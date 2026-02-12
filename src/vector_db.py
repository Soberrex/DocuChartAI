"""
Vector Database Integration with ChromaDB
Handles embeddings, storage, and retrieval for RAG
"""
import os
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv()


class VectorDatabase:
    """ChromaDB wrapper for document embeddings and retrieval"""
    
    def __init__(self, persist_directory: str = "chroma_db"):
        """Initialize ChromaDB client with correct API for installed version"""
        import chromadb
        
        self.persist_directory = persist_directory
        
        # Use persistent client (works with ChromaDB >= 0.4.x)
        try:
            self.client = chromadb.PersistentClient(path=persist_directory)
        except (TypeError, AttributeError):
            # Fallback for older ChromaDB versions
            from chromadb.config import Settings
            self.client = chromadb.Client(Settings(
                chroma_db_impl="duckdb+parquet",
                persist_directory=persist_directory
            ))
        
        # Use OpenAI embeddings only if we have a real OpenAI key (not OpenRouter)
        openai_api_key = os.getenv("OPENAI_API_KEY")
        self.embedding_function = None
        
        if openai_api_key and openai_api_key.startswith("sk-") and not openai_api_key.startswith("sk-or-"):
            try:
                from chromadb.utils import embedding_functions
                self.embedding_function = embedding_functions.OpenAIEmbeddingFunction(
                    api_key=openai_api_key,
                    model_name="text-embedding-3-small"
                )
            except Exception as e:
                print(f"⚠️ OpenAI embeddings not available: {e}")
                self.embedding_function = None
        
        # Get or create collection
        if self.embedding_function:
            self.collection = self.client.get_or_create_collection(
                name="documents",
                embedding_function=self.embedding_function
            )
        else:
            # Use ChromaDB's default embedding function
            self.collection = self.client.get_or_create_collection(
                name="documents"
            )
        
        print(f"✅ Vector DB initialized ({self.collection.count()} existing chunks)")
    
    def add_document_chunks(
        self,
        chunks: List[Dict],
        document_id: str,
        filename: str,
        file_type: str
    ) -> int:
        """Add document chunks to vector database"""
        if not chunks:
            return 0
        
        ids = []
        documents = []
        metadatas = []
        
        for i, chunk in enumerate(chunks):
            chunk_id = f"{document_id}_chunk_{i}"
            ids.append(chunk_id)
            documents.append(chunk['content'])
            
            # Build metadata - ChromaDB only accepts str, int, float, bool
            metadata = {
                'document_id': document_id,
                'filename': filename,
                'file_type': file_type,
                'chunk_index': i,
            }
            # Add simple metadata from chunk (skip nested dicts/lists)
            for k, v in chunk.get('metadata', {}).items():
                if isinstance(v, (str, int, float, bool)):
                    metadata[k] = v
            
            metadatas.append(metadata)
        
        # Add to collection in batches to avoid memory issues
        batch_size = 100
        for start in range(0, len(ids), batch_size):
            end = min(start + batch_size, len(ids))
            self.collection.add(
                ids=ids[start:end],
                documents=documents[start:end],
                metadatas=metadatas[start:end]
            )
        
        return len(chunks)
    
    def search(
        self,
        query: str,
        n_results: int = 5,
        document_id: Optional[str] = None,
        session_id: Optional[str] = None
    ) -> List[Dict]:
        """Search for relevant chunks"""
        # Build where clause for filtering
        where = None
        if document_id:
            where = {'document_id': document_id}
        
        # Ensure we don't request more results than available
        total_count = self.collection.count()
        if total_count == 0:
            return []
        
        actual_n = min(n_results, total_count)
        
        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=actual_n,
                where=where
            )
        except Exception as e:
            print(f"⚠️ Vector search error: {e}")
            return []
        
        # Format results
        formatted_results = []
        if results['ids'] and len(results['ids'][0]) > 0:
            for i in range(len(results['ids'][0])):
                score = 0.0
                if results.get('distances') and results['distances'][0]:
                    score = max(0, 1 - results['distances'][0][i])
                
                formatted_results.append({
                    'id': results['ids'][0][i],
                    'content': results['documents'][0][i],
                    'metadata': results['metadatas'][0][i] if results.get('metadatas') else {},
                    'score': score
                })
        
        return formatted_results
    
    def delete_document(self, document_id: str) -> bool:
        """Delete all chunks for a document"""
        try:
            results = self.collection.get(
                where={'document_id': document_id}
            )
            if results['ids']:
                self.collection.delete(ids=results['ids'])
                return True
            return False
        except Exception as e:
            print(f"Error deleting document from vector DB: {e}")
            return False
    
    def delete_session(self, session_id: str) -> bool:
        """Delete all chunks for a session"""
        try:
            results = self.collection.get(
                where={'session_id': session_id}
            )
            if results['ids']:
                self.collection.delete(ids=results['ids'])
                return True
            return False
        except Exception as e:
            print(f"Error deleting session from vector DB: {e}")
            return False
    
    def get_document_stats(self, document_id: str) -> Dict:
        """Get statistics for a document"""
        results = self.collection.get(
            where={'document_id': document_id}
        )
        return {
            'chunk_count': len(results['ids']) if results['ids'] else 0,
            'document_id': document_id
        }
    
    def persist(self):
        """Persist changes to disk (no-op for PersistentClient)"""
        # PersistentClient auto-persists; older versions need explicit persist
        if hasattr(self.client, 'persist'):
            self.client.persist()


# Global instance
vector_db: Optional[VectorDatabase] = None


def get_vector_db() -> VectorDatabase:
    """Get or create vector database singleton"""
    global vector_db
    if vector_db is None:
        vector_db = VectorDatabase()
    return vector_db
