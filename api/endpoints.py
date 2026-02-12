"""
API Endpoints for Document Upload, Chat, and Data Management
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import List, Optional, Dict
from sqlalchemy.orm import Session as DBSession
from datetime import datetime
import uuid
import traceback

from src.database import get_db
from src.models import Document as DBDocument, Conversation, Message, Session as SessionModel
from src.document_processor import DocumentProcessor
from src.session_manager import SessionManager, ConversationManager

router = APIRouter()


# ─── Pydantic Models ───────────────────────────────

class UploadResponse(BaseModel):
    document_id: str
    filename: str
    status: str
    message: str
    file_kept: bool
    summary: Optional[Dict] = None

class ChatRequest(BaseModel):
    message: str
    conversation_id: str
    session_id: str

class ChatResponse(BaseModel):
    message: Dict
    sources: Optional[List[Dict]] = None
    chart_data: Optional[Dict] = None

class DeleteResponse(BaseModel):
    success: bool
    message: str


# ─── Upload Endpoint ───────────────────────────────

@router.post("/upload", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    session_id: Optional[str] = Form(None),
    db: DBSession = Depends(get_db)
):
    """Upload and process document with text extraction, embedding, and auto-summary"""
    try:
        from src.vector_db import get_vector_db
        from src.rag_engine import get_rag_engine

        # Ensure session exists
        sid = session_id or str(uuid.uuid4())
        SessionManager.get_or_create_session(sid, db)

        # Read file
        file_content = await file.read()
        file_size = len(file_content)

        # Process document (extract text, chunk)
        processor = DocumentProcessor()
        result = await processor.process_document(
            file_content,
            file.filename,
            file_size
        )

        # Create document record
        doc_id = str(uuid.uuid4())
        document = DBDocument(
            id=doc_id,
            session_id=sid,
            filename=f"{doc_id}_{file.filename}",
            original_filename=file.filename,
            file_size=file_size,
            file_type=result['file_type'],
            status='processing',
            doc_metadata={
                'chunk_count': len(result['chunks']),
                'file_kept': result['should_keep_file']
            }
        )
        db.add(document)
        db.commit()

        # Store chunks in vector database
        vector_db = get_vector_db()
        chunks_added = vector_db.add_document_chunks(
            chunks=result['chunks'],
            document_id=doc_id,
            filename=file.filename,
            file_type=result['file_type']
        )

        # Mark as ready immediately (summary generated in background)
        document.status = 'ready'
        document.indexed_at = datetime.utcnow()
        db.commit()
        vector_db.persist()

        # Generate summary in background (non-blocking for faster upload response)
        import asyncio
        async def _generate_summary():
            try:
                from src.database import SessionLocal
                rag_engine = get_rag_engine()
                summary_result = await rag_engine.generate_document_summary(
                    document_id=doc_id,
                    document_text=result['text'][:10000],
                    file_type=result['file_type']
                )
                bg_db = SessionLocal()
                try:
                    doc = bg_db.query(DBDocument).filter(DBDocument.id == doc_id).first()
                    if doc:
                        doc.doc_metadata = {
                            **(doc.doc_metadata or {}),
                            'summary': summary_result.get('summary'),
                            'suggested_charts': summary_result.get('suggested_charts', [])
                        }
                        bg_db.commit()
                finally:
                    bg_db.close()
            except Exception as e:
                print(f"⚠️ Background summary failed (non-critical): {e}")

        asyncio.create_task(_generate_summary())

        return UploadResponse(
            document_id=doc_id,
            filename=file.filename,
            status='ready',
            message=f"Processed successfully. {chunks_added} chunks indexed.",
            file_kept=result['should_keep_file'],
            summary=None
        )

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


# ─── Chat Endpoint ─────────────────────────────────

@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    db: DBSession = Depends(get_db)
):
    """Send message and get AI response with sources and charts"""
    try:
        from src.rag_engine import get_rag_engine

        # Save user message
        user_msg_id = str(uuid.uuid4())
        user_message = Message(
            id=user_msg_id,
            conversation_id=request.conversation_id,
            role='user',
            content=request.message,
            created_at=datetime.utcnow()
        )
        db.add(user_message)
        db.commit()

        # Get conversation history
        history_messages = db.query(Message).filter(
            Message.conversation_id == request.conversation_id
        ).order_by(Message.created_at.desc()).limit(6).all()

        conversation_history = [
            {"role": msg.role, "content": msg.content}
            for msg in reversed(history_messages)
        ]

        # Process query with RAG
        rag_engine = get_rag_engine()
        rag_response = await rag_engine.process_query(
            query=request.message,
            session_id=request.session_id,
            conversation_history=conversation_history,
            top_k=5
        )

        # Save assistant message
        assistant_msg_id = str(uuid.uuid4())
        assistant_message = Message(
            id=assistant_msg_id,
            conversation_id=request.conversation_id,
            role='assistant',
            content=rag_response['response'],
            created_at=datetime.utcnow(),
            sources=rag_response.get('sources', []),
            confidence=rag_response.get('confidence', 0.0),
            tokens_used=rag_response.get('tokens_used', 0)
        )
        db.add(assistant_message)

        # Update conversation title if first message
        conversation = db.query(Conversation).filter(
            Conversation.id == request.conversation_id
        ).first()

        if conversation and conversation.title == "New Conversation":
            conversation.title = ConversationManager.generate_title(request.message)
            conversation.updated_at = datetime.utcnow()

        db.commit()

        return ChatResponse(
            message={
                "id": assistant_msg_id,
                "role": "assistant",
                "content": assistant_message.content,
                "created_at": assistant_message.created_at.isoformat(),
                "confidence": rag_response.get('confidence', 0.0)
            },
            sources=rag_response.get('sources', []),
            chart_data=rag_response.get('chart_data')
        )

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")


# ─── Deletion Endpoints ───────────────────────────

@router.delete("/conversations/{conversation_id}", response_model=DeleteResponse)
async def delete_conversation(
    conversation_id: str,
    db: DBSession = Depends(get_db)
):
    """Delete conversation and all associated messages and charts"""
    success = SessionManager.delete_conversation(conversation_id, db)
    if not success:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return DeleteResponse(success=True, message="Conversation deleted successfully")


@router.delete("/documents/{document_id}", response_model=DeleteResponse)
async def delete_document(
    document_id: str,
    db: DBSession = Depends(get_db)
):
    """Delete document and associated embeddings"""
    try:
        from src.vector_db import get_vector_db
        vector_db = get_vector_db()
        vector_db.delete_document(document_id)
        vector_db.persist()
    except Exception as e:
        print(f"⚠️ Vector DB cleanup: {e}")

    success = SessionManager.delete_document(document_id, db)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")
    return DeleteResponse(success=True, message="Document deleted successfully")


@router.delete("/sessions/{session_id}", response_model=DeleteResponse)
async def delete_session(
    session_id: str,
    db: DBSession = Depends(get_db)
):
    """Delete entire session and all associated data"""
    try:
        from src.vector_db import get_vector_db
        vector_db = get_vector_db()
        vector_db.delete_session(session_id)
        vector_db.persist()
    except Exception as e:
        print(f"⚠️ Vector DB cleanup: {e}")

    success = SessionManager.delete_session(session_id, db)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return DeleteResponse(success=True, message="Session and all data deleted successfully")


@router.post("/cleanup")
async def cleanup_old_data(
    days: int = 30,
    db: DBSession = Depends(get_db)
):
    """Auto-cleanup data older than specified days"""
    result = SessionManager.cleanup_old_data(days, db)
    return {"success": True, "message": "Cleanup completed", "deleted": result}


# ─── Session & Conversation Endpoints ──────────────

@router.get("/sessions/{session_id}/conversations")
async def get_session_conversations(
    session_id: str,
    db: DBSession = Depends(get_db)
):
    """Get all conversations for a session"""
    return SessionManager.get_session_conversations(session_id, db)


@router.get("/conversations/{conversation_id}/messages")
async def get_conversation_messages(
    conversation_id: str,
    db: DBSession = Depends(get_db)
):
    """Get all messages in a conversation"""
    return SessionManager.get_conversation_messages(conversation_id, db)


@router.get("/documents/{session_id}")
async def get_documents(
    session_id: str,
    db: DBSession = Depends(get_db)
):
    """Get all documents for a session"""
    documents = db.query(DBDocument).filter(
        DBDocument.session_id == session_id
    ).all()
    return [
        {
            "id": doc.id,
            "filename": doc.original_filename,
            "file_size": doc.file_size,
            "file_type": doc.file_type,
            "status": doc.status,
            "created_at": doc.created_at.isoformat() if doc.created_at else None,
            "metadata": doc.doc_metadata
        }
        for doc in documents
    ]


@router.post("/conversations")
async def create_conversation(
    session_id: str = Query(...),
    db: DBSession = Depends(get_db)
):
    """Create new conversation"""
    SessionManager.get_or_create_session(session_id, db)

    conv_id = str(uuid.uuid4())
    conversation = Conversation(
        id=conv_id,
        session_id=session_id,
        title="New Conversation",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(conversation)
    db.commit()

    return {
        "id": conv_id,
        "title": conversation.title,
        "created_at": conversation.created_at.isoformat()
    }
