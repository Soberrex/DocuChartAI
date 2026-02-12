<div align="center">

# 🤖 DocuChat AI

### Enterprise-Grade RAG Chatbot for Intelligent Document Interaction

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Visit_Site-blue?style=for-the-badge)](https://docuchartai-production.up.railway.app/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg?style=for-the-badge&logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688.svg?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg?style=for-the-badge&logo=react)](https://react.dev/)

![DocuChat AI Banner](https://placeholder.co/1200x400/1e293b/ffffff?text=DocuChat+AI+-+Chat+With+Your+Documents)

[Features](#-features) • [Demo](#-demo) • [Installation](#-installation) • [Usage](#-usage) • [Architecture](#-architecture) • [API Docs](#-api-documentation)

</div>

---

## 📖 Overview

**DocuChat AI** is a production-ready Retrieval-Augmented Generation (RAG) system that transforms how you interact with documents. Upload PDFs, Word docs, Excel sheets, or text files and get instant, accurate answers backed by your actual data—no more searching through pages manually.

### 🎯 The Problem It Solves

Modern professionals spend **hours** sifting through dense documents to extract specific information. Traditional search falls short when you need:

- **Context-aware answers** (not just keyword matching)
- **Synthesized insights** from multiple document sections
- **Data-driven charts** auto-generated from text
- **Source citations** for every claim

DocuChat AI eliminates this friction by combining semantic search, AI-powered summarization, and intelligent data visualization in one seamless interface.

---

## ✨ Features

### 🚀 Core Capabilities

| Feature | Description |
|---------|-------------|
| 📄 **Multi-Format Support** | Upload PDF, DOCX, XLSX, CSV, TXT files |
| 💡 **Smart Summaries** | Auto-generates document summaries on upload |
| 📊 **Data Visualization** | Detects tabular data and renders interactive charts (Bar, Line, Pie) |
| 🔍 **Source Citations** | Every answer includes expandable citations with relevance scores |
| 💬 **Session Persistence** | Chat history and documents saved automatically via Supabase |
| 🌗 **Dark/Light Mode** | Premium UI with dynamic theme switching |
| ⚡ **Real-time Streaming** | LLM responses stream token-by-token for better UX |

### 🎨 User Experience

- **Drag & Drop Upload**: Effortless file management
- **Conversation History**: Resume chats from any device
- **Responsive Design**: Works flawlessly on desktop, tablet, and mobile
- **Error Handling**: Graceful fallbacks with user-friendly error messages

---

## 🎬 Demo

### Live Application
👉 **[https://docuchartai-production.up.railway.app/](https://docuchartai-production.up.railway.app/)**

### Example Workflows

1. **Upload** a company earnings report (PDF)
2. **Ask**: *"What was the revenue growth in Q3?"*
3. **Get**: An answer with source citations + auto-generated chart

4. **Upload** a research paper (DOCX)
5. **Ask**: *"Summarize the methodology section"*
6. **Get**: A concise summary grounded in the actual text

---

## 🛠️ Tech Stack

### Backend
- **[FastAPI](https://fastapi.tiangolo.com/)**: High-performance Python web framework
- **[ChromaDB](https://www.trychroma.com/)**: Vector database for semantic search
- **[Sentence Transformers](https://www.sbert.net/)**: Embeddings for RAG pipeline
- **[OpenRouter](https://openrouter.ai/)**: LLM API (OpenAI-compatible)
- **[Supabase](https://supabase.com/)**: PostgreSQL database for persistence

### Frontend
- **[React 18](https://react.dev/)**: Modern UI framework
- **[Vite](https://vitejs.dev/)**: Lightning-fast build tool
- **[Material-UI (MUI)](https://mui.com/)**: Premium component library
- **[Recharts](https://recharts.org/)**: Data visualization library

### DevOps
- **Docker**: Containerized deployments
- **Railway**: Cloud hosting platform
- **GitHub Actions**: CI/CD pipelines (optional)

---

## 🚀 Installation

### Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **npm** or **yarn**
- **Supabase Account** ([Sign up free](https://supabase.com/))
- **OpenRouter API Key** ([Get one here](https://openrouter.ai/))

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Soberrex/DocuChartAI.git
cd DocuChartAI
```

### 2️⃣ Backend Setup

```bash
# Install Python dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
```

**Edit `.env` with your credentials:**

```env
# OpenRouter API
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Supabase Database
DATABASE_URL=postgresql://user:password@host:port/database

# Server Config (optional)
PORT=8000
ENVIRONMENT=production
```

**Start the FastAPI server:**

```bash
uvicorn api.main:app --reload --port 8000
```

✅ API will be available at `http://localhost:8000`  
📚 Interactive docs at `http://localhost:8000/docs`

### 3️⃣ Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

✅ App will open at `http://localhost:5173`

---

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `OPENROUTER_API_KEY` | API key for LLM access | ✅ Yes | `sk-or-v1-abc123...` |
| `DATABASE_URL` | PostgreSQL connection string | ✅ Yes | `postgresql://...` |
| `PORT` | API server port | ❌ No | `8000` (default) |
| `ENVIRONMENT` | Deployment environment | ❌ No | `production` |

### Supabase Setup

1. Create a new project on [Supabase](https://supabase.com/)
2. Go to **Settings → Database** and copy your connection string
3. Paste it into `.env` as `DATABASE_URL`

---

## 💻 Usage

### Basic Workflow

```bash
# 1. Start the backend
uvicorn api.main:app --reload

# 2. Start the frontend (in a new terminal)
cd frontend && npm run dev

# 3. Open http://localhost:5173 in your browser
```

### Using the Application

1. **Upload Document**: Drag & drop or click to upload (PDF, DOCX, XLSX, etc.)
2. **Wait for Processing**: System extracts text, chunks it, and creates embeddings
3. **Start Chatting**: Ask questions in natural language
4. **View Citations**: Expand the "Sources" section to see where answers came from
5. **Generate Charts**: If data is detected, a chart auto-renders below the answer

---

## 🏗️ Architecture

### High-Level Overview

```mermaid
graph LR
    A[User] -->|Uploads File| B[FastAPI Backend]
    B -->|Extracts Text| C[Document Processor]
    C -->|Chunks Text| D[Embedding Model]
    D -->|Stores Vectors| E[ChromaDB]
    A -->|Asks Question| B
    B -->|Query Embedding| D
    D -->|Semantic Search| E
    E -->|Top K Chunks| F[LLM via OpenRouter]
    F -->|Generated Answer| A
    B -->|Saves Session| G[Supabase DB]
```

### RAG Pipeline Deep Dive

#### 1. Document Ingestion
```python
# Pseudo-code workflow
1. User uploads file (e.g., research_paper.pdf)
2. Backend extracts text using PyPDF2/python-docx
3. Text is split into 1000-char chunks with 200-char overlap
4. Each chunk is converted to a 384-dim vector (sentence-transformers)
5. Vectors stored in ChromaDB with metadata (page #, source file)
```

#### 2. Query Processing
```python
# When user asks: "What is the conclusion?"
1. Query is embedded into the same 384-dim vector space
2. ChromaDB performs cosine similarity search
3. Top 5 most relevant chunks are retrieved
4. Chunks are formatted into a prompt:
   """
   Context: [chunk1] [chunk2] ... [chunk5]
   Question: What is the conclusion?
   """
5. LLM generates answer using ONLY the provided context
6. Answer is streamed back to the frontend
```

#### 3. Data Visualization
- If the LLM detects structured data (tables, numbers), it formats the response as JSON
- Frontend parses JSON and renders charts using Recharts
- Supports: Bar charts, Line charts, Pie charts

---

## 📁 Project Structure

```
DocuChartAI/
├── api/                    # FastAPI application
│   ├── main.py            # Entry point, routes
│   ├── models.py          # Pydantic schemas
│   └── dependencies.py    # Shared dependencies
├── src/                    # Core RAG logic
│   ├── ingestion.py       # Document processing
│   ├── embeddings.py      # Vector generation
│   ├── retrieval.py       # Semantic search
│   └── llm.py             # OpenRouter integration
├── frontend/               # React application
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Route pages
│   │   └── services/      # API calls
│   └── vite.config.js     # Vite config
├── tests/                  # Unit & integration tests
├── data/                   # (Ignored) Temp file storage
├── chroma_db/              # (Ignored) Vector DB persistence
├── Dockerfile              # Production container
├── railway.json            # Railway deployment config
├── requirements.txt        # Python dependencies
└── README.md               # This file
```

---

## 📡 API Documentation

### Key Endpoints

#### `POST /upload`
Upload and process a document.

**Request:**
```bash
curl -X POST "http://localhost:8000/upload" \
  -F "file=@document.pdf"
```

**Response:**
```json
{
  "document_id": "abc123",
  "filename": "document.pdf",
  "summary": "This document discusses...",
  "chunk_count": 42
}
```

#### `POST /chat`
Ask a question about uploaded documents.

**Request:**
```bash
curl -X POST "http://localhost:8000/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the revenue?",
    "session_id": "user123"
  }'
```

**Response (Streaming):**
```json
{
  "answer": "The revenue was $5M in Q3...",
  "sources": [
    {"text": "Q3 revenue: $5M", "score": 0.92, "page": 3}
  ],
  "chart_data": {...}
}
```

**Full API Docs:** Visit `http://localhost:8000/docs` after starting the server.

---

## 🧪 Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test file
pytest tests/test_ingestion.py -v
```

---

## 🚢 Deployment

### Railway (Recommended)

1. **Fork this repository**
2. **Connect to Railway**:
   - Go to [Railway](https://railway.app/)
   - Create a new project from your GitHub repo
3. **Add Environment Variables**:
   - `OPENROUTER_API_KEY`
   - `DATABASE_URL` (from Supabase)
4. **Deploy**: Railway auto-detects `railway.json` and deploys

### Docker

```bash
# Build image
docker build -t docuchat-ai .

# Run container
docker run -p 8000:8000 \
  -e OPENROUTER_API_KEY=your_key \
  -e DATABASE_URL=your_db_url \
  docuchat-ai
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow PEP 8 for Python code
- Use ESLint/Prettier for JavaScript
- Write tests for new features
- Update documentation as needed

---

## 📊 Performance & Accuracy

### Benchmarks

| Metric | Value |
|--------|-------|
| **Average Query Latency** | ~2.5s (including LLM) |
| **Embedding Speed** | ~0.3s per 1000 chars |
| **Relevance Accuracy** | 85-92% (based on manual eval) |
| **Supported File Size** | Up to 50MB per document |

### How Accuracy Works

- **Semantic Search**: Uses cosine similarity (threshold: 0.7) to find relevant chunks
- **Context Window**: Provides top 5 chunks (~5000 tokens) to LLM
- **Hallucination Prevention**: LLM instructed to answer *only* from provided context
- **Confidence Scores**: Each source citation includes a relevance score (0-1)

---

## 🐛 Troubleshooting

### Common Issues

**Problem:** `ModuleNotFoundError: No module named 'chromadb'`  
**Solution:** Run `pip install -r requirements.txt`

**Problem:** Frontend can't connect to API  
**Solution:** Check that backend is running on port 8000. Update `VITE_API_URL` in `frontend/.env` if needed.

**Problem:** Railway deployment shows "0 Variables"  
**Solution:** Ensure environment variables are set in Railway dashboard under the **Variables** tab. Click **Redeploy** after adding them.

**Problem:** LLM responses are slow  
**Solution:** Consider using a faster model on OpenRouter (e.g., `anthropic/claude-instant-v1`)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [ChromaDB](https://www.trychroma.com/) for the excellent vector database
- [OpenRouter](https://openrouter.ai/) for LLM API access
- [Supabase](https://supabase.com/) for backend-as-a-service
- [FastAPI](https://fastapi.tiangolo.com/) for the amazing web framework

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Soberrex/DocuChartAI/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Soberrex/DocuChartAI/discussions)
- **Email**: your-email@example.com

---

<div align="center">

**Made with ❤️ by [Soberrex](https://github.com/Soberrex)**

⭐ Star this repo if you found it helpful!

</div>
