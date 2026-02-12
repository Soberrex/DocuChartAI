# 🤖 DocuChat AI - Enterprise RAG Chatbot

![DocuChat AI Preview](https://placehold.co/800x400?text=DocuChat+AI+Dashboard)

DocuChat AI is a modern Retrieval-Augmented Generation (RAG) system that allows users to chat with their documents (PDF, DOCX, XLSX). It features a sleek React frontend, a robust FastAPI backend, and persistent storage via Supabase.

## 🎯 The Problem It Solves

In today's data-driven world, professionals spend countless hours searching through dense documents to find specific information. Traditional keyword search is often insufficient for understanding context or synthesizing answers from multiple sources.

**DocuChat AI solves this by:**
- **Eliminating manual search:** Instantly answers questions based on document content.
- **Synthesizing information:** Combines data from multiple parts of a document to provide comprehensive answers.
- **Reducing hallucinations:** Grounding LLM responses in your actual data, not just general training knowledge.

## ✨ Key Features
- **📄 Multi-Format Support:** Upload and chat with PDF, Word, Excel, CSV, and Text files.
- **💡 Smart Summaries:** Auto-generates summaries for every uploaded document.
- **📊 Data Visualization:** Automatically detects data in answers and renders interactive charts (Bar, Line, Pie).
- **🔍 Source Citations:** Every answer includes expandable source citations with relevance scores.
- **🌗 Dark/Light Mode:** Premium UI with dynamic theme switching.
- **💾 Session Persistence:** chats and document history are saved automatically via Supabase.

## 🔄 How It Works

The system uses a sophisticated RAG pipeline to ensure accurate, context-aware answers:

1.  **Ingestion & Chunking:**
    - When you upload a file (PDF, DOCX, etc.), the system extracts text and splits it into manageable chunks (1000 chars) with overlap.
    - Metadata (page number, source file) is preserved.

2.  **Embedding & Storage:**
    - Each chunk is converted into a vector embedding using `sentence-transformers`.
    - These vectors are stored locally in **ChromaDB** for fast semantic retrieval.

3.  **Retrieval (The "R" in RAG):**
    - When you ask a question, your query is embedded into the same vector space.
    - The system performs a semantic search to find the top 5 most relevant document chunks.

4.  **Generation (The "G" in RAG):**
    - The relevant chunks are fed into the LLM (via OpenRouter) as "Context".
    - The LLM generates a natural language answer based *only* on that context.
    - If data is detected, the system formats it for the frontend to render as a chart.

## 📈 Accuracy & Performance

DocuChat AI is engineered for high precision:

- **Context-Aware Retrieval:** Uses semantic search (cosine similarity) to understand the *meaning* of your query, not just keywords.
- **Source Tracking:** Unlike standard chatbots, every claim is backed by a specific source citation from your uploaded document.
- **Relevance Scoring:** The system calculates a confidence score for every answer. High confidence (>70%) indicates strong evidence in the text.
- **Hallucination Prevention:** The LLM is strictly instructed to answer *only* from the provided context, significantly reducing false information.

## 🛠️ Tech Stack
- **Frontend:** React, Vite, Material-UI (MUI), Recharts
- **Backend:** FastAPI, Python 3.11
- **Database:** Supabase (PostgreSQL)
- **Vector DB:** ChromaDB (local persistence for embeddings)
- **LLM:** OpenRouter (OpenAI-compatible API)

## 🚀 Quick Start (Local)

### 1. Backend Setup
```bash
# Clone repository
git clone https://github.com/yourusername/DocuChat-AI.git
cd DocuChat-AI

# Install dependencies
pip install -r requirements.txt

# Create .env file
# Copy .env.example to .env and add your API keys (OPENROUTER_API_KEY, DATABASE_URL)
cp .env.example .env

# Run API
uvicorn api.main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

Visit `http://localhost:5173` (Frontend) or `http://localhost:8000/docs` (API Docs).

## 📁 Project Structure
- `api/`: FastAPI endpoints and entry point
- `frontend/`: React application source
- `src/`: Core RAG logic (ingestion, embedding, retrieval)
- `data/`: (Ignored) Temporary data storage
- `chroma_db/`: (Ignored) Vector store persistence

## 📜 License
MIT