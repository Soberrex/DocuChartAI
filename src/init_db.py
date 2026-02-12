"""
Database initialization script
Run this to create all tables in PostgreSQL
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.database import init_db, engine
from src.models import Session, Document, Conversation, Message, Chart
from sqlalchemy import inspect

def check_tables():
    """Check if tables exist"""
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    print("\n📊 Database Tables:")
    if tables:
        for table in tables:
            print(f"  ✅ {table}")
    else:
        print("  ⚠️  No tables found")
    
    return tables

def main():
    """Initialize database"""
    print("🚀 Initializing RAG Chatbot Database...")
    print(f"📍 Database: {engine.url}")
    
    # Create tables
    try:
        init_db()
        print("\n✅ Database initialized successfully!")
        
        # Check created tables
        tables = check_tables()
        
        expected_tables = ['sessions', 'documents', 'conversations', 'messages', 'charts']
        missing = set(expected_tables) - set(tables)
        
        if missing:
            print(f"\n⚠️  Missing tables: {', '.join(missing)}")
        else:
            print(f"\n🎉 All {len(expected_tables)} tables created successfully!")
            
    except Exception as e:
        print(f"\n❌ Error initializing database: {e}")
        raise

if __name__ == "__main__":
    main()
