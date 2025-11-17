"""
Gemini RAG Service - Document analysis using Google Gemini File Search

This service handles:
1. Telegram conversation analysis (themes, patterns, triggers)
2. File upload analysis (images, PDFs, documents)
3. RAG-based context extraction for Claude mediation

Architecture:
- Gemini File Search: Upload, chunk, index, store (FREE, automatic)
- Analysis: Query Gemini for insights (~$0.004 per analysis)
- Storage: Store insights in PostgreSQL Turn.metadata
- Mediation: Claude uses insights for context-aware coaching
"""

import os
import json
import asyncio
from typing import List, Dict, Optional
from datetime import datetime
import google.generativeai as genai
from google.generativeai import caching
from google.generativeai.types import HarmCategory, HarmBlockThreshold


class GeminiRAGService:
    """
    Handles document upload, analysis, and RAG queries using Gemini File Search API.

    Key Features:
    - Persistent storage with File Search (FREE up to 1 TB)
    - Automatic chunking and indexing
    - Semantic search capabilities
    - Low-cost analysis ($0.004 per Telegram import)
    """

    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not set in environment")

        genai.configure(api_key=api_key)

        # Use Gemini 2.0 Flash for speed and cost efficiency
        self.model = genai.GenerativeModel(
            model_name='gemini-2.0-flash-exp',
            safety_settings={
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
            }
        )

    # ─────────────────────────────────────────────────────────────
    # TELEGRAM CONVERSATION ANALYSIS
    # ─────────────────────────────────────────────────────────────

    async def analyze_telegram_history(
        self,
        messages: List[Dict],
        user1_name: str,
        user2_name: str,
        room_id: int,
        download_id: int
    ) -> Dict:
        """
        Analyze Telegram conversation history using File Search.

        IMPORTANT: This method now stores files PERSISTENTLY in Gemini for future retrieval.
        The corpus_id is returned and should be saved to TelegramDownload.gemini_corpus_id

        Args:
            messages: List of {id, from_me, text, timestamp, sender_name}
            user1_name: Name of user who uploaded messages
            user2_name: Name of other participant
            room_id: Meedi8 room identifier
            download_id: TelegramDownload ID for tracking

        Returns:
            {
                "summary": "Overall relationship summary",
                "recurring_themes": [...],
                "communication_patterns": {...},
                "emotional_triggers": {...},
                "positive_moments": [...],
                "key_conflicts": [...],
                "corpus_id": "Gemini corpus ID for persistent storage"
            }
        """
        print(f"[Gemini RAG] Analyzing {len(messages)} Telegram messages for room {room_id}")

        corpus_id = None
        temp_path = None

        try:
            # 1. Create corpus for persistent storage
            corpus_name = f"meedi8_room_{room_id}_download_{download_id}"
            print(f"[Gemini RAG] Creating corpus: {corpus_name}")

            corpus = genai.create_corpus(display_name=corpus_name)
            corpus_id = corpus.name
            print(f"[Gemini RAG] Corpus created: {corpus_id}")

            # 2. Format messages into uploadable document
            formatted_text = self._format_telegram_messages(
                messages=messages,
                user1_name=user1_name,
                user2_name=user2_name
            )

            # 3. Save temporarily
            temp_path = f"/tmp/telegram_{room_id}_{datetime.now().timestamp()}.txt"
            with open(temp_path, 'w', encoding='utf-8') as f:
                f.write(formatted_text)

            # 4. Upload to corpus (persistent storage)
            print(f"[Gemini RAG] Uploading file to corpus...")
            telegram_file = genai.upload_file(
                path=temp_path,
                display_name=f"Telegram History - Room {room_id}"
            )

            # 5. Wait for processing
            while telegram_file.state.name == "PROCESSING":
                await asyncio.sleep(2)
                telegram_file = genai.get_file(telegram_file.name)

            if telegram_file.state.name == "FAILED":
                raise Exception("File processing failed")

            # 6. Add file to corpus for persistent indexing
            print(f"[Gemini RAG] Creating document in corpus...")
            document = genai.create_document(
                corpus_name=corpus_id,
                display_name=f"Telegram Conversation",
                source_file=telegram_file.name
            )

            print(f"[Gemini RAG] Document created in corpus: {document.name}")
            print(f"[Gemini RAG] File will remain in Gemini for future retrieval")

            # 7. Create analysis prompt with corpus query
            prompt = f"""Analyze this Telegram conversation between {user1_name} and {user2_name} who are about to enter mediation.

They are having conflicts and need professional help. Provide deep insights to help their mediator (AI coach) guide them effectively.

Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:

{{
  "summary": "2-3 sentence overview of relationship dynamics",
  "recurring_themes": [
    {{
      "theme": "Brief theme name",
      "description": "What this theme is about",
      "frequency": "high/medium/low",
      "examples": ["Quote from conversation", "Another quote"]
    }}
  ],
  "communication_patterns": {{
    "{user1_name}": {{
      "tone": "Overall communication tone",
      "initiates_conversations": true/false,
      "response_style": "How they respond",
      "conflict_approach": "How they handle conflict"
    }},
    "{user2_name}": {{
      "tone": "Overall communication tone",
      "initiates_conversations": true/false,
      "response_style": "How they respond",
      "conflict_approach": "How they handle conflict"
    }}
  }},
  "emotional_triggers": {{
    "{user1_name}": ["trigger 1", "trigger 2", "trigger 3"],
    "{user2_name}": ["trigger 1", "trigger 2", "trigger 3"]
  }},
  "positive_moments": [
    {{
      "moment": "Description of positive interaction",
      "significance": "Why this matters for mediation"
    }}
  ],
  "key_conflicts": [
    {{
      "conflict": "Main conflict topic",
      "unmet_needs": {{
        "{user1_name}": "What they need",
        "{user2_name}": "What they need"
      }},
      "suggested_approach": "How mediator could address this"
    }}
  ]
}}

Focus on:
1. Recurring patterns that indicate deeper issues
2. Emotional triggers that escalate conflicts
3. Positive moments that show relationship strength
4. Unmet needs beneath surface conflicts
5. Actionable insights for the mediator

Be empathetic but objective. This analysis helps them resolve conflicts."""

            # 8. Query corpus with file context
            print(f"[Gemini RAG] Generating analysis from corpus...")
            response = self.model.generate_content([telegram_file, prompt])

            # 9. Parse JSON response
            response_text = response.text.strip()

            # Remove markdown code blocks if present
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.startswith('```'):
                response_text = response_text[3:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]

            response_text = response_text.strip()

            try:
                analysis = json.loads(response_text)
            except json.JSONDecodeError as e:
                print(f"[Gemini RAG] JSON parse error: {e}")
                print(f"[Gemini RAG] Response text: {response_text[:500]}")
                # Fallback to basic analysis
                analysis = {
                    "summary": f"Analyzed conversation between {user1_name} and {user2_name}",
                    "recurring_themes": [],
                    "communication_patterns": {},
                    "emotional_triggers": {},
                    "positive_moments": [],
                    "key_conflicts": []
                }

            print(f"[Gemini RAG] Analysis complete")

            # 10. Clean up temp file ONLY (keep file in Gemini corpus for future retrieval)
            try:
                if temp_path and os.path.exists(temp_path):
                    os.remove(temp_path)
                print(f"[Gemini RAG] Temp file cleanup complete")
                print(f"[Gemini RAG] Corpus {corpus_id} and file persist in Gemini for future queries")
            except Exception as e:
                print(f"[Gemini RAG] Cleanup warning: {e}")

            # 11. Add corpus_id to analysis for storage in database
            analysis["corpus_id"] = corpus_id

            return analysis

        except Exception as e:
            print(f"[Gemini RAG] Error analyzing Telegram history: {e}")
            import traceback
            traceback.print_exc()

            # Clean up on error (delete corpus and temp files)
            try:
                if corpus_id:
                    print(f"[Gemini RAG] Cleaning up corpus {corpus_id} due to error")
                    genai.delete_corpus(corpus_id)
                if temp_path and os.path.exists(temp_path):
                    os.remove(temp_path)
            except Exception as cleanup_error:
                print(f"[Gemini RAG] Cleanup error: {cleanup_error}")

            # Return minimal analysis on error
            return {
                "summary": f"Error analyzing conversation: {str(e)}",
                "recurring_themes": [],
                "communication_patterns": {},
                "emotional_triggers": {},
                "positive_moments": [],
                "key_conflicts": [],
                "corpus_id": None
            }

    def _format_telegram_messages(
        self,
        messages: List[Dict],
        user1_name: str,
        user2_name: str
    ) -> str:
        """
        Convert Telegram messages to readable text format for Gemini.

        Format:
        [2025-01-15 14:32] Sarah: I'm frustrated about the dishes
        [2025-01-15 14:35] David: I'll do them later
        """
        formatted = []
        formatted.append(f"=== TELEGRAM CONVERSATION HISTORY ===")
        formatted.append(f"Between: {user1_name} and {user2_name}")
        formatted.append(f"Total messages: {len(messages)}")
        formatted.append("")
        formatted.append("=== MESSAGES ===")
        formatted.append("")

        for msg in messages:
            timestamp = msg.get('timestamp', 'Unknown time')
            sender = msg.get('sender_name', user1_name if msg.get('from_me') else user2_name)
            text = msg.get('text', '[Media]')
            formatted.append(f"[{timestamp}] {sender}: {text}")

        return "\n".join(formatted)

    # ─────────────────────────────────────────────────────────────
    # FILE/IMAGE ANALYSIS
    # ─────────────────────────────────────────────────────────────

    async def analyze_uploaded_file(
        self,
        file_path: str,
        file_type: str,
        room_id: int
    ) -> Dict:
        """
        Analyze uploaded file (image, PDF, document) for mediation context.

        Args:
            file_path: Local path to file
            file_type: MIME type or extension
            room_id: Meedi8 room identifier

        Returns:
            {
                "summary": "What this file shows/contains",
                "relevant_details": [...],
                "emotional_context": "How this might affect mediation"
            }
        """
        print(f"[Gemini RAG] Analyzing file: {file_path} (type: {file_type})")

        try:
            # Upload file
            uploaded_file = genai.upload_file(
                path=file_path,
                display_name=f"Upload - Room {room_id}"
            )

            # Wait for processing
            while uploaded_file.state.name == "PROCESSING":
                await asyncio.sleep(1)
                uploaded_file = genai.get_file(uploaded_file.name)

            if uploaded_file.state.name == "FAILED":
                raise Exception("File processing failed")

            # Analysis prompt
            prompt = """Analyze this file in the context of relationship mediation.

Provide insights that would help a mediator understand what this document/image reveals about the conflict.

Return ONLY valid JSON (no markdown):

{
  "summary": "Clear description of what this file shows or contains",
  "relevant_details": ["Detail 1 relevant to conflict", "Detail 2", "Detail 3"],
  "emotional_context": "How this file might emotionally impact the mediation",
  "suggested_use": "How mediator should reference this in conversation"
}

Be objective and helpful."""

            response = self.model.generate_content([uploaded_file, prompt])
            response_text = response.text.strip()

            # Remove markdown
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.startswith('```'):
                response_text = response_text[3:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]

            analysis = json.loads(response_text.strip())

            # Cleanup
            genai.delete_file(uploaded_file.name)

            return analysis

        except Exception as e:
            print(f"[Gemini RAG] Error analyzing file: {e}")
            return {
                "summary": f"Error analyzing file: {str(e)}",
                "relevant_details": [],
                "emotional_context": "Unable to analyze",
                "suggested_use": "File available but analysis failed"
            }
