"""
🎙️ AI Voice Assistant — Core Orchestrator
Receives text transcript → runs NLU → routes to handler → returns response.
Supports context tracking for multi-turn conversations.
"""

import time
from datetime import datetime, timezone

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import config
from voice_assistant.intent_engine import classify_intent
from voice_assistant.handlers.all_handlers import HANDLER_MAP


class VoiceAssistant:
    """Core voice assistant with session context."""

    def __init__(self):
        self.sessions: dict[str, dict] = {}

    def _get_session(self, session_id: str) -> dict:
        """Get or create a session."""
        if session_id not in self.sessions:
            self.sessions[session_id] = {
                "id": session_id,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "turns": [],
                "context": {},
            }
        return self.sessions[session_id]

    def process(self, transcript: str, session_id: str = "default") -> dict:
        """
        Process a voice command transcript.
        Args:
            transcript: raw text from speech-to-text
            session_id: session identifier for context tracking
        Returns:
            dict with intent, response, entities, confidence
        """
        session = self._get_session(session_id)

        # Classify intent
        classification = classify_intent(transcript)
        intent = classification["intent"]
        confidence = classification["confidence"]
        entities = classification["entities"]

        # Merge session context entities (for multi-turn)
        if not entities.get("appliances") and session.get("context", {}).get("last_appliance"):
            entities["appliances"] = [session["context"]["last_appliance"]]

        # Route to handler
        handler = HANDLER_MAP.get(intent, HANDLER_MAP["general_query"])
        response = handler(entities)

        # Update session context
        if entities.get("appliances"):
            session["context"]["last_appliance"] = entities["appliances"][0]
        if entities.get("time_period"):
            session["context"]["last_time_period"] = entities["time_period"]
        session["context"]["last_intent"] = intent

        # Track turn
        turn = {
            "transcript": transcript,
            "intent": intent,
            "confidence": confidence,
            "response_text": response["text"],
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        session["turns"].append(turn)

        # Trim old turns
        if len(session["turns"]) > config.MAX_CONTEXT_TURNS:
            session["turns"] = session["turns"][-config.MAX_CONTEXT_TURNS:]

        return {
            "intent": intent,
            "confidence": confidence,
            "entities": entities,
            "response": response,
            "session_id": session_id,
            "turn_number": len(session["turns"]),
        }

    def get_session_history(self, session_id: str) -> list[dict]:
        session = self.sessions.get(session_id, {})
        return session.get("turns", [])

    def clear_session(self, session_id: str):
        if session_id in self.sessions:
            del self.sessions[session_id]


# Global singleton
assistant = VoiceAssistant()


def process_voice_command(transcript: str, session_id: str = "default") -> dict:
    """Convenience function for one-shot usage."""
    return assistant.process(transcript, session_id)
