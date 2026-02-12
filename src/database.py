"""
Database configuration and session management
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

import sys

load_dotenv()

# Secure Environment Logging
print("-" * 50)
print("🔍 CONFIGURATION CHECK")
print("-" * 50)

# Check operational environment
ENV_TYPE = "Local"
if os.getenv("RAILWAY_ENVIRONMENT"):
    ENV_TYPE = "Railway"
elif os.getenv("RENDER"):
    ENV_TYPE = "Render"

print(f"🌍 Environment: {ENV_TYPE}")

# Check critical variables
REQUIRED_VARS = ["DATABASE_URL"]
OPTIONAL_VARS = ["OPENAI_API_KEY", "GEMINI_API_KEY", "API_KEY"]

missing_critical = []

for key in REQUIRED_VARS + OPTIONAL_VARS:
    value = os.getenv(key)
    if value:
        masked = f"{value[:8]}...{value[-4:]}" if len(value) > 12 else "***"
        print(f"✅ {key}: Found ({masked})")
    else:
        if key in REQUIRED_VARS:
            print(f"❌ {key}: MISSING (Critical)")
            missing_critical.append(key)
        else:
            print(f"⚠️  {key}: Missing (Optional)")

print("-" * 50)

# PostgreSQL connection string
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    if ENV_TYPE != "Local":
        print(f"🚨 CRITICAL ERROR: Missing {', '.join(missing_critical)} in production!")
        print("Scrubbing process to prevent unstable state.")
        sys.exit(1)
    
    print("⚠️  Using default local database URL")
    DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/rag_chatbot"

# Create engine
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Verify connections before using
    pool_size=10,
    max_overflow=20
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

def get_db():
    """
    Dependency for FastAPI to get database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """
    Initialize database tables
    """
    from src.models import Session, Document, Conversation, Message, Chart
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully")
