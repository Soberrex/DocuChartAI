import pytest
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.indexer import HybridIndexer
from src.metrics import MetricsTracker


class TestHybridIndexer:
    """Test HybridIndexer functionality"""
    
    def test_indexer_initialization(self):
        """Test that indexer initializes correctly"""
        indexer = HybridIndexer()
        assert indexer is not None
        assert indexer.embedder is not None
        assert indexer.reranker is not None
    
    def test_get_embedding(self):
        """Test embedding generation"""
        indexer = HybridIndexer()
        embedding = indexer.get_embedding("test text")
        assert isinstance(embedding, list)
        assert len(embedding) > 0
        assert all(isinstance(x, (float, int)) for x in embedding)


class TestMetricsTracker:
    """Test MetricsTracker functionality"""
    
    def test_metrics_initialization(self):
        """Test metrics tracker initialization"""
        tracker = MetricsTracker(log_file="data/test_metrics.json")
        assert tracker is not None
        assert tracker.metrics["total_queries"] >= 0
    
    def test_log_query(self):
        """Test logging a query"""
        tracker = MetricsTracker(log_file="data/test_metrics.json")
        initial_count = tracker.metrics["total_queries"]
        
        tracker.log_query("test query", 0.5, True, 0.95)
        
        assert tracker.metrics["total_queries"] == initial_count + 1
    
    def test_get_stats(self):
        """Test getting statistics"""
        tracker = MetricsTracker(log_file="data/test_metrics.json")
        
        tracker.log_query("query1", 0.3, True, 0.9)
        tracker.log_query("query2", 0.4, False, 0.5)
        
        stats = tracker.get_stats()
        assert "total_queries" in stats
        assert "successful_queries" in stats
        assert "success_rate" in stats


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
