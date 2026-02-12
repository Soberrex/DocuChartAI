import time
import json
import os
from datetime import datetime
from typing import Dict, List, Optional

class MetricsTracker:
    """Track and analyze RAG system performance metrics"""
    
    def __init__(self, log_file="data/metrics.json"):
        self.log_file = log_file
        self.metrics = self._load_metrics()
    
    def _load_metrics(self) -> Dict:
        """Load existing metrics from file"""
        if os.path.exists(self.log_file):
            try:
                with open(self.log_file, 'r') as f:
                    return json.load(f)
            except json.JSONDecodeError:
                return self._initialize_metrics()
        return self._initialize_metrics()
    
    def _initialize_metrics(self) -> Dict:
        """Initialize empty metrics structure"""
        return {
            "total_queries": 0,
            "successful_queries": 0,
            "avg_response_time_ms": 0,
            "avg_confidence_score": 0,
            "queries_log": []
        }
    
    def log_query(self, query: str, response_time: float, result_found: bool, confidence_score: Optional[float] = None):
        """
        Log a single query with its metrics
        
        Args:
            query: The search query
            response_time: Time taken in seconds
            result_found: Whether a result was found
            confidence_score: Confidence score of top result (0-1)
        """
        self.metrics["total_queries"] += 1
        
        if result_found:
            self.metrics["successful_queries"] += 1
        
        query_data = {
            "timestamp": datetime.now().isoformat(),
            "query": query,
            "response_time_ms": round(float(response_time) * 1000, 2),
            "result_found": result_found,
            "confidence_score": round(float(confidence_score), 4) if confidence_score else 0.0
        }
        
        self.metrics["queries_log"].append(query_data)
        
        # Keep only last 1000 queries to prevent file bloat
        if len(self.metrics["queries_log"]) > 1000:
            self.metrics["queries_log"] = self.metrics["queries_log"][-1000:]
        
        # Update running averages
        self._update_averages()
        self._save_metrics()
    
    def _update_averages(self):
        """Recalculate average metrics"""
        if not self.metrics["queries_log"]:
            return
        
        total_time = sum(q["response_time_ms"] for q in self.metrics["queries_log"])
        self.metrics["avg_response_time_ms"] = round(
            total_time / len(self.metrics["queries_log"]), 2
        )
        
        total_confidence = sum(q["confidence_score"] for q in self.metrics["queries_log"])
        self.metrics["avg_confidence_score"] = round(
            total_confidence / len(self.metrics["queries_log"]), 4
        )
    
    def _save_metrics(self):
        """Save metrics to file"""
        os.makedirs(os.path.dirname(self.log_file), exist_ok=True)
        with open(self.log_file, 'w') as f:
            json.dump(self.metrics, f, indent=2)
    
    def get_stats(self) -> Dict:
        """
        Get summary statistics
        
        Returns:
            Dictionary with current metrics
        """
        if self.metrics["total_queries"] == 0:
            return {
                "total_queries": 0,
                "success_rate": "0%",
                "avg_response_time_ms": 0,
                "avg_confidence": 0.0
            }
        
        success_rate = (self.metrics["successful_queries"] / self.metrics["total_queries"]) * 100
        
        return {
            "total_queries": self.metrics["total_queries"],
            "successful_queries": self.metrics["successful_queries"],
            "success_rate": f"{success_rate:.1f}%",
            "avg_response_time_ms": self.metrics["avg_response_time_ms"],
            "avg_confidence": self.metrics["avg_confidence_score"]
        }
    
    def get_recent_queries(self, limit: int = 10) -> List[Dict]:
        """Get most recent queries"""
        return self.metrics["queries_log"][-limit:]
    
    def reset_metrics(self):
        """Reset all metrics (useful for testing)"""
        self.metrics = self._initialize_metrics()
        self._save_metrics()
