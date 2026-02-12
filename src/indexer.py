import os
import chromadb
import pickle
import time
from rank_bm25 import BM25Okapi
from sentence_transformers import CrossEncoder, SentenceTransformer 
from dotenv import load_dotenv
import PyPDF2
import pdfplumber
from src.metrics import MetricsTracker

load_dotenv()

class HybridIndexer:
    def __init__(self, persist_dir="chroma_db"):
        print(f"⚙️  Initializing Enterprise RAG Engine (Production-Ready)...")
        
        #Vector Database
        self.client = chromadb.PersistentClient(path=persist_dir)
        self.collection = self.client.get_or_create_collection(name="erpnext_hybrid")
        
        #Local Embedding Model
        print("   🧠 Loading Local Embedding Model (all-MiniLM-L6-v2)...")
        self.embedder = SentenceTransformer('all-MiniLM-L6-v2')
        
        #Neural Re-Ranker
        print("   ⚖️  Loading Cross-Encoder (ms-marco-MiniLM-L-6-v2)...")
        os.environ["TOKENIZERS_PARALLELISM"] = "false"
        self.reranker = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
        
        self.bm25 = None
        self.doc_map = {}
        
        # Add metrics tracker
        self.metrics = MetricsTracker()
        print("   📊 Metrics Tracker Initialized") 

    def get_embedding(self, text):
        """Generates Embeddings LOCALLY (Zero Latency, No Rate Limits)"""
        
        return self.embedder.encode(text).tolist()

    def _extract_pdf_text(self, pdf_path):
        """Extract text from PDF files using PyPDF2"""
        text = ""
        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        except Exception as e:
            print(f"   ⚠️  PyPDF2 failed, trying pdfplumber: {e}")
            # Fallback to pdfplumber for complex PDFs
            try:
                with pdfplumber.open(pdf_path) as pdf:
                    for page in pdf.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text += page_text + "\n"
            except Exception as e2:
                print(f"   ❌ Both PDF extractors failed: {e2}")
        return text

    def _add_to_index(self, doc_text, full_path, documents, ids, embeddings, tokenized_corpus):
        """Helper method to add document to all indices"""
        documents.append(doc_text)
        ids.append(full_path)
        embeddings.append(self.get_embedding(doc_text))
        
        tokens = doc_text.lower().split()
        tokenized_corpus.append(tokens)
        self.doc_map[len(tokenized_corpus)-1] = full_path

    def build_index(self, folder_path):
        print(f"🚀 Scanning Dataset: {folder_path}")
        documents = []
        ids = []
        embeddings = []
        tokenized_corpus = []
        
        count = 0
        
        for root, _, files in os.walk(folder_path):
            for file in files:
                full_path = os.path.join(root, file)
                
                # Process Python files
                if file.endswith(".py"):
                    try:
                        with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                            code = f.read()
                            if len(code) > 50:
                                doc_text = f"FILE: {file}\nPATH: {full_path}\nCONTENT:\n{code[:5000]}"
                                self._add_to_index(doc_text, full_path, documents, ids, embeddings, tokenized_corpus)
                                count += 1
                                if count % 10 == 0:
                                    print(f"   🔹 Indexed {count} files...")
                    except Exception as e:
                        print(f"   ⚠️  Skipped {file}: {e}")
                
                # Process PDF files
                elif file.endswith(".pdf"):
                    try:
                        text = self._extract_pdf_text(full_path)
                        if len(text) > 100:
                            doc_text = f"FILE: {file}\nPATH: {full_path}\nCONTENT:\n{text[:5000]}"
                            self._add_to_index(doc_text, full_path, documents, ids, embeddings, tokenized_corpus)
                            count += 1
                            if count % 10 == 0:
                                print(f"   🔹 Indexed {count} files (including PDFs)...")
                    except Exception as e:
                        print(f"   ⚠️  Skipped PDF {file}: {e}")
                
                # Add support for TXT and MD files
                elif file.endswith((".txt", ".md")):
                    try:
                        with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                            text = f.read()
                            if len(text) > 50:
                                doc_text = f"FILE: {file}\nPATH: {full_path}\nCONTENT:\n{text[:5000]}"
                                self._add_to_index(doc_text, full_path, documents, ids, embeddings, tokenized_corpus)
                                count += 1
                                if count % 10 == 0:
                                    print(f"   🔹 Indexed {count} files...")
                    except Exception as e:
                        print(f"   ⚠️  Skipped {file}: {e}")
        
        # Batch upsert for efficiency
        if documents:
            print(f"   💾 Upserting {len(documents)} documents to ChromaDB...")
            self.collection.upsert(documents=documents, ids=ids, embeddings=embeddings)
        
        print("   📊 Training BM25 Sparse Model...")
        self.bm25 = BM25Okapi(tokenized_corpus)
        
        # Save indices
        os.makedirs("data", exist_ok=True)
        with open("data/bm25.pkl", "wb") as f: 
            pickle.dump(self.bm25, f)
        with open("data/doc_map.pkl", "wb") as f: 
            pickle.dump(self.doc_map, f)
            
        print(f"✅ Successfully indexed {count} files (Python + PDFs + Text) using Local Intelligence.")

    def search(self, query, top_k=10):
        start_time = time.time()
        print(f"🔍 Hybrid Search: '{query}'")
        
        # 1. Vector Search (Local)
        query_emb = self.get_embedding(query)
        vector_results = self.collection.query(query_embeddings=[query_emb], n_results=top_k)
        vector_files = vector_results['ids'][0] if vector_results['ids'] else []

        # 2. BM25 Search
        if not self.bm25 and os.path.exists("data/bm25.pkl"):
            with open("data/bm25.pkl", "rb") as f: self.bm25 = pickle.load(f)
            with open("data/doc_map.pkl", "rb") as f: self.doc_map = pickle.load(f)

        tokenized_query = query.lower().split()
        bm25_scores = self.bm25.get_scores(tokenized_query)
        top_n = sorted(range(len(bm25_scores)), key=lambda i: bm25_scores[i], reverse=True)[:top_k]
        bm25_files = [self.doc_map[i] for i in top_n if i in self.doc_map]

        #Rerank
        candidates = list(set(vector_files + bm25_files))
        if not candidates:
            # Log metrics for failed search
            response_time = time.time() - start_time
            self.metrics.log_query(query, response_time, False, 0.0)
            print(f"   ⏱️  Response Time: {response_time*1000:.2f}ms")
            print(f"   ❌ No results found")
            return None

        pred_input = [[query, c] for c in candidates]
        scores = self.reranker.predict(pred_input)
        ranked = sorted(zip(candidates, scores), key=lambda x: x[1], reverse=True)
        
        best_file = ranked[0][0]
        top_score = ranked[0][1]
        
        # Log metrics
        response_time = time.time() - start_time
        result_found = best_file is not None
        
        self.metrics.log_query(query, response_time, result_found, top_score)
        
        print(f"   🎯 Winner: {best_file} (Score: {top_score:.4f})")
        print(f"   ⏱️  Response Time: {response_time*1000:.2f}ms")
        print(f"   📊 Confidence Score: {top_score:.4f}")
        
        return best_file