"""
💬 AI Chatbot — Core Engine
Session-based conversation engine with context memory.
Routes queries through query_engine → formats via response_builder.
"""

import time
from datetime import datetime, timezone

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import config
from chatbot.query_engine import execute_query
from chatbot.response_builder import build_response


class ChatSession:
    """A single chat session with context memory."""

    def __init__(self, session_id: str):
        self.session_id = session_id
        self.created_at = datetime.now(timezone.utc).isoformat()
        self.turns: list[dict] = []
        self.context: dict = {}

    def add_turn(self, user_msg: str, bot_response: dict):
        self.turns.append({
            "user": user_msg,
            "bot": bot_response["formatted_text"],
            "query_type": bot_response["raw_data"].get("type", "unknown"),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        # Keep context bounded
        if len(self.turns) > config.MAX_CONTEXT_TURNS:
            self.turns = self.turns[-config.MAX_CONTEXT_TURNS:]


class Chatbot:
    """Session-based chatbot engine."""

    def __init__(self):
        self.sessions: dict[str, ChatSession] = {}

    def _get_session(self, session_id: str) -> ChatSession:
        if session_id not in self.sessions:
            self.sessions[session_id] = ChatSession(session_id)
        return self.sessions[session_id]

    def process_query(self, text: str, session_id: str = "default") -> dict:
        """
        Process a user query and return a formatted response.
        Args:
            text: natural language query
            session_id: for context tracking
        Returns:
            dict with formatted_text, raw_data, suggestions, session info
        """
        session = self._get_session(session_id)

        # Execute the query
        query_result = execute_query(text)

        # Build rich response
        response = build_response(query_result)

        # Track in session
        session.add_turn(text, response)

        return {
            "formatted_text": response["formatted_text"],
            "raw_data": response["raw_data"],
            "suggestions": response["suggestions"],
            "session_id": session_id,
            "turn_number": len(session.turns),
            "query_classification": query_result["classification"]["query_type"],
        }

    def get_history(self, session_id: str) -> list[dict]:
        session = self.sessions.get(session_id)
        return session.turns if session else []

    def clear_session(self, session_id: str):
        if session_id in self.sessions:
            del self.sessions[session_id]


# Global singleton
chatbot = Chatbot()


def process_query(text: str, session_id: str = "default") -> dict:
    """Convenience function for one-shot usage."""
    return chatbot.process_query(text, session_id)
