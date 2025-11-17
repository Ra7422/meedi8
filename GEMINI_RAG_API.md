# Gemini RAG API Integration for Meedi8

## Overview

This document outlines how to integrate Google's Gemini API with file search capabilities (RAG - Retrieval Augmented Generation) into the Meedi8 platform. The Gemini file search tool simplifies RAG implementation by handling document upload, indexing, and context-aware querying.

**Key Benefit**: Gemini excels at large document processing and context extraction, while Claude remains superior for nuanced emotional mediation. This hybrid approach optimizes both cost and quality.

---

## Table of Contents

1. [Use Cases for Meedi8](#use-cases-for-meedi8)
2. [Architecture Integration](#architecture-integration)
3. [Implementation Guide](#implementation-guide)
4. [Cost & Performance Optimization](#cost-and-performance-optimization)
5. [Privacy & Security](#privacy-and-security)
6. [Feature Recommendations](#feature-recommendations)
7. [Implementation Timeline](#implementation-timeline)
8. [Environment Setup](#environment-setup)
9. [Cost Analysis](#cost-analysis)

---

## Use Cases for Meedi8

### 1. Telegram Conversation Analysis ⭐ (Immediate Priority)

**Problem**: Users reference past conversations but AI lacks context  
**Solution**: Upload entire Telegram chat history to Gemini for analysis

**Example Flow**:
```
User 1: "They never help with chores" (references 3 months of messages)
AI (with Telegram context): "I can see from your messages that housework 
has been mentioned 47 times since January. Let's explore what 'help' means to each of you."
```

**Benefits**:
- Pre-populate coaching context
- Identify recurring conflict themes
- Detect communication patterns
- Ground discussions in actual conversation history

### 2. Document Context in Mediation

**Problem**: Users say "as I mentioned in the email..." but AI hasn't seen it  
**Solution**: Upload emails, text screenshots, shared documents

**Example Flow**:
```
User: "I sent an email about this"
AI: "I see the email from March 15th where you wrote: 'I feel overwhelmed when...' 
     [Other User], did you receive this email? How did it land for you?"
```

**Benefits**:
- Grounds conversation in facts
- Reduces "he said / she said" disputes
- References specific dates and details
- Maintains accuracy

### 3. Cross-Session Pattern Detection

**Problem**: Conflicts recur but no system to identify patterns  
**Solution**: Analyze summaries from past mediation sessions

**Example Insights**:
```
"You've resolved household chores 3 times in 6 months, but it keeps coming back. 
The underlying need might be about feeling valued rather than task distribution."
```

**Benefits**:
- Identifies root causes beneath surface issues
- Shows relationship health trends over time
- Recommends what strategies worked before
- Prevents circular arguments

---

## Architecture Integration

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ MEEDI8 FRONTEND (React)                                     │
│  ├── Telegram Import Button                                 │
│  ├── Document Upload (PDF, Images, Text)                    │
│  └── Pattern Dashboard                                      │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼ HTTPS
┌─────────────────────────────────────────────────────────────┐
│ MEEDI8 BACKEND (FastAPI)                                    │
│  ├── app/routes/rooms.py (mediation endpoints)              │
│  ├── app/services/gemini_rag_service.py (NEW)               │
│  ├── app/services/pre_mediation_coach.py (enhanced)         │
│  └── app/services/main_room_mediator.py (enhanced)          │
└─────────────────────────────────────────────────────────────┘
                          │
                          ├────────────────────────┐
                          ▼                        ▼
┌─────────────────────────────────┐  ┌──────────────────────────┐
│ GEMINI API                      │  │ CLAUDE API               │
│ (Document Analysis & RAG)       │  │ (Mediation Dialogue)     │
│  ├── File Upload API            │  │  ├── Emotional Intel     │
│  ├── Context Caching            │  │  ├── NVC Framework       │
│  ├── Pattern Recognition        │  │  └── Turn-taking         │
│  └── Multi-document Queries     │  └──────────────────────────┘
└─────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ STORAGE                                                      │
│  ├── PostgreSQL (file metadata, deletion schedule)          │
│  ├── S3 (temporary documents, auto-delete 30 days)          │
│  └── Gemini Files (uploaded docs, programmatic deletion)    │
└─────────────────────────────────────────────────────────────┘
```

### Hybrid AI Strategy

**Gemini's Role** (NEW):
- Document upload and indexing
- Large context analysis (1M+ tokens)
- Pattern detection across sessions
- Multi-document querying
- Cost-effective for heavy lifting

**Claude's Role** (EXISTING):
- Real-time mediation dialogue
- Emotional intelligence
- Nuanced empathy
- Turn-taking enforcement
- De-escalation interventions

**Why Hybrid?**
- Cost: Gemini is 5-10x cheaper for document processing
- Quality: Claude is superior for emotional mediation
- Speed: Gemini processes large files faster
- Complementary: Each handles what it does best

---

## Implementation Guide

### 1. Core Service: `gemini_rag_service.py`

Create: `backend/app/services/gemini_rag_service.py`

```python
# backend/app/services/gemini_rag_service.py

import google.generativeai as genai
from google.generativeai import caching
import datetime
import asyncio
import json
import os
from typing import Optional, List, Dict

class GeminiRAGService:
    """
    Handles document upload, analysis, and RAG queries using Gemini API.
    
    Key Features:
    - Telegram conversation analysis
    - Document context extraction
    - Cross-session pattern detection
    - Context caching for cost optimization
    """
    
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not set in environment")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash-002')
        self.cache_ttl = datetime.timedelta(hours=1)
    
    # ─────────────────────────────────────────────────────────────
    # TELEGRAM CONVERSATION ANALYSIS
    # ─────────────────────────────────────────────────────────────
    
    async def analyze_telegram_history(
        self,
        telegram_messages: List[Dict],
        room_id: str,
        user1_name: str,
        user2_name: str
    ) -> Dict:
        """
        Upload Telegram history and extract relationship insights.
        
        Args:
            telegram_messages: List of {timestamp, from_me, text}
            room_id: Meedi8 room identifier
            user1_name: Name of person who uploaded messages
            user2_name: Name of other person
        
        Returns:
            {
                "recurring_themes": [...],
                "communication_patterns": {...},
                "emotional_triggers": {...},
                "unmet_needs": {...},
                "positive_moments": [...]
            }
        """
        print(f"[Gemini RAG] Analyzing Telegram history for room {room_id}")
        
        # 1. Format messages into uploadable document
        formatted_text = self._format_telegram_messages(
            messages=telegram_messages,
            user1_name=user1_name,
            user2_name=user2_name
        )
        
        # Save temporarily
        temp_path = f"/tmp/telegram_{room_id}.txt"
        with open(temp_path, 'w', encoding='utf-8') as f:
            f.write(formatted_text)
        
        try:
            # 2. Upload to Gemini Files API
            telegram_file = genai.upload_file(
                path=temp_path,
                display_name=f"Telegram History - Room {room_id}"
            )
            
            print(f"[Gemini RAG] Uploaded file: {telegram_file.name}")
            
            # 3. Wait for processing
            while telegram_file.state.name == "PROCESSING":
                await asyncio.sleep(2)
                telegram_file = genai.get_file(telegram_file.name)
            
            if telegram_file.state.name == "FAILED":
                raise Exception("File processing failed")
            
            # 4. Create analysis prompt
            prompt = f"""
            Analyze this Telegram conversation history between {user1_name} and {user2_name} 
            who are about to enter mediation through Meedi8.
            
            Identify and return JSON with these exact keys:
            
            {{
              "recurring_themes": [
                {{"theme": "...", "frequency": ..., "examples": ["timestamp: message", ...]}}
              ],
              "communication_patterns": {{
                "{user1_name}": {{"initiates_pct": ..., "response_time": "...", "tone": "..."}},
                "{user2_name}": {{"initiates_pct": ..., "response_time": "...", "tone": "..."}}
              }},
              "emotional_triggers": {{
                "{user1_name}": ["trigger1", "trigger2"],
                "{user2_name}": ["trigger1", "trigger2"]
              }},
              "unmet_needs": {{
                "{user1_name}": ["need1", "need2"],
                "{user2_name}": ["need1", "need2"]
              }},
              "positive_moments": [
                {{"date": "...", "moment": "...", "significance": "..."}}
              ],
              "overall_assessment": "...",
              "coaching_recommendations": ["...", "..."]
            }}
            
            Be empathetic but objective. Focus on patterns, not individual messages.
            This analysis will help the AI coach prepare them for productive mediation.
            """
            
            # 5. Query with file context
            response = self.model.generate_content([telegram_file, prompt])
            
            # 6. Parse JSON response
            response_text = response.text.strip()
            
            # Remove markdown code blocks if present
            if response_text.startswith('```json'):
                response_text = response_text[7:]  # Remove ```json
            if response_text.startswith('```'):
                response_text = response_text[3:]  # Remove ```
            if response_text.endswith('```'):
                response_text = response_text[:-3]  # Remove trailing ```
            
            response_text = response_text.strip()
            
            analysis = json.loads(response_text)
            
            print(f"[Gemini RAG] Analysis complete: {len(analysis.get('recurring_themes', []))} themes found")
            
            # 7. Clean up (respect privacy)
            genai.delete_file(telegram_file.name)
            os.remove(temp_path)
            
            return analysis
        
        except Exception as e:
            print(f"[Gemini RAG] Error analyzing Telegram history: {e}")
            # Clean up on error
            try:
                if 'telegram_file' in locals():
                    genai.delete_file(telegram_file.name)
                if os.path.exists(temp_path):
                    os.remove(temp_path)
            except:
                pass
            raise
    
    def _format_telegram_messages(
        self,
        messages: List[Dict],
        user1_name: str,
        user2_name: str
    ) -> str:
        """
        Convert Telegram JSON to readable text format for Gemini.
        
        Format:
        [2025-01-15 14:32] Sarah: I'm frustrated about the dishes
        [2025-01-15 14:35] David: I'll do them later
        """
        formatted = []
        formatted.append(f"=== Telegram Conversation History ===")
        formatted.append(f"Between: {user1_name} and {user2_name}")
        formatted.append(f"Total messages: {len(messages)}")
        formatted.append(f"Date range: {messages[0]['timestamp']} to {messages[-1]['timestamp']}")
        formatted.append("")
        formatted.append("=== Messages ===")
        formatted.append("")
        
        for msg in messages:
            timestamp = msg['timestamp']
            speaker = user1_name if msg['from_me'] else user2_name
            text = msg['text']
            formatted.append(f"[{timestamp}] {speaker}: {text}")
        
        return "\n".join(formatted)
    
    # ─────────────────────────────────────────────────────────────
    # DOCUMENT CONTEXT QUERIES
    # ─────────────────────────────────────────────────────────────
    
    async def query_uploaded_documents(
        self,
        room_id: str,
        user_question: str,
        document_urls: List[str]
    ) -> str:
        """
        Answer questions about documents users uploaded to the room.
        
        Args:
            room_id: Meedi8 room identifier
            user_question: Question to answer (e.g., "What did the email say about money?")
            document_urls: S3 URLs of uploaded documents
        
        Returns:
            Answer based on document content, or honest "not found" response
        """
        print(f"[Gemini RAG] Querying {len(document_urls)} documents for room {room_id}")
        
        if not document_urls:
            return "No documents have been uploaded yet."
        
        # Download documents from S3 and upload to Gemini
        uploaded_files = []
        temp_files = []
        
        try:
            for i, url in enumerate(document_urls):
                # Download from S3
                local_path = await self._download_from_s3(url, room_id, i)
                temp_files.append(local_path)
                
                # Upload to Gemini
                doc_file = genai.upload_file(
                    path=local_path,
                    display_name=f"Document {i+1} - Room {room_id}"
                )
                
                # Wait for processing
                while doc_file.state.name == "PROCESSING":
                    await asyncio.sleep(1)
                    doc_file = genai.get_file(doc_file.name)
                
                if doc_file.state.name == "FAILED":
                    print(f"[Gemini RAG] Document {i+1} processing failed")
                    continue
                
                uploaded_files.append(doc_file)
            
            if not uploaded_files:
                return "Sorry, I couldn't process the uploaded documents."
            
            # Create context-aware prompt
            prompt = f"""
            The user asks: "{user_question}"
            
            Based on the uploaded documents, provide a clear, factual answer.
            
            Guidelines:
            - Quote specific parts if relevant (with document reference)
            - If the documents don't contain the answer, say so honestly
            - Keep the response concise (2-3 sentences max)
            - Focus on facts from the documents, not assumptions
            
            This is for a mediation session, so remain neutral and factual.
            """
            
            # Query with all documents
            response = self.model.generate_content([
                *uploaded_files,
                prompt
            ])
            
            answer = response.text.strip()
            
            print(f"[Gemini RAG] Document query complete")
            
            # Cleanup
            for doc_file in uploaded_files:
                genai.delete_file(doc_file.name)
            
            for temp_path in temp_files:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
            
            return answer
        
        except Exception as e:
            print(f"[Gemini RAG] Error querying documents: {e}")
            
            # Cleanup on error
            try:
                for doc_file in uploaded_files:
                    genai.delete_file(doc_file.name)
                for temp_path in temp_files:
                    if os.path.exists(temp_path):
                        os.remove(temp_path)
            except:
                pass
            
            return "Sorry, I encountered an error processing the documents."
    
    async def _download_from_s3(self, url: str, room_id: str, index: int) -> str:
        """
        Download file from S3 to temporary location.
        
        Returns:
            Local file path
        """
        import httpx
        
        # Determine file extension from URL
        extension = url.split('.')[-1].split('?')[0]
        temp_path = f"/tmp/doc_{room_id}_{index}.{extension}"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            response.raise_for_status()
            
            with open(temp_path, 'wb') as f:
                f.write(response.content)
        
        return temp_path
    
    # ─────────────────────────────────────────────────────────────
    # CROSS-SESSION PATTERN DETECTION
    # ─────────────────────────────────────────────────────────────
    
    async def analyze_session_patterns(
        self,
        user_id: str,
        session_transcripts: List[Dict]
    ) -> Dict:
        """
        Analyze patterns across multiple mediation sessions.
        
        Args:
            user_id: User identifier
            session_transcripts: List of {session_id, date, transcript, resolution}
        
        Returns:
            {
                "recurring_conflicts": [...],
                "successful_strategies": [...],
                "unresolved_needs": [...],
                "progress_indicators": {...},
                "recommendations": [...]
            }
        """
        print(f"[Gemini RAG] Analyzing {len(session_transcripts)} sessions for user {user_id}")
        
        if len(session_transcripts) < 2:
            return {
                "error": "Need at least 2 sessions for pattern analysis",
                "recommendation": "Complete more mediation sessions to unlock pattern insights"
            }
        
        # Combine all transcripts
        combined_text = "=== MEDIATION SESSION HISTORY ===\n\n"
        
        for session in session_transcripts:
            combined_text += f"--- Session {session['session_id']} ({session['date']}) ---\n"
            combined_text += f"Status: {session.get('status', 'Unknown')}\n"
            combined_text += f"Transcript:\n{session['transcript']}\n"
            if session.get('resolution'):
                combined_text += f"Resolution: {session['resolution']}\n"
            combined_text += "\n"
        
        # Save temporarily
        temp_path = f"/tmp/sessions_{user_id}.txt"
        with open(temp_path, 'w', encoding='utf-8') as f:
            f.write(combined_text)
        
        try:
            # Upload to Gemini
            sessions_file = genai.upload_file(
                path=temp_path,
                display_name=f"Session History - User {user_id}"
            )
            
            # Wait for processing
            while sessions_file.state.name == "PROCESSING":
                await asyncio.sleep(2)
                sessions_file = genai.get_file(sessions_file.name)
            
            # Analysis prompt
            prompt = """
            Analyze these mediation session transcripts and identify patterns.
            
            Return JSON with these exact keys:
            
            {
              "recurring_conflicts": [
                {"conflict": "...", "frequency": ..., "last_occurred": "..."}
              ],
              "successful_strategies": [
                {"strategy": "...", "sessions_used": [...], "effectiveness": "..."}
              ],
              "unresolved_needs": [
                {"need": "...", "indicators": ["...", "..."]}
              ],
              "progress_indicators": {
                "improvement_areas": ["...", "..."],
                "persistent_challenges": ["...", "..."],
                "relationship_health_trend": "improving/stable/declining"
              },
              "recommendations": [
                "...",
                "..."
              ]
            }
            
            Focus on:
            1. What conflicts keep recurring despite resolution attempts?
            2. What resolution strategies actually worked?
            3. What underlying needs aren't being addressed?
            4. Is there progress over time?
            """
            
            response = self.model.generate_content([sessions_file, prompt])
            
            # Parse JSON
            response_text = response.text.strip()
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.startswith('```'):
                response_text = response_text[3:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            
            analysis = json.loads(response_text.strip())
            
            # Cleanup
            genai.delete_file(sessions_file.name)
            os.remove(temp_path)
            
            return analysis
        
        except Exception as e:
            print(f"[Gemini RAG] Error analyzing session patterns: {e}")
            try:
                if 'sessions_file' in locals():
                    genai.delete_file(sessions_file.name)
                if os.path.exists(temp_path):
                    os.remove(temp_path)
            except:
                pass
            raise
    
    # ─────────────────────────────────────────────────────────────
    # CONTEXT CACHING (Cost Optimization)
    # ─────────────────────────────────────────────────────────────
    
    async def create_cached_context(
        self,
        content: str,
        cache_id: str,
        system_instruction: str
    ) -> caching.CachedContent:
        """
        Create cached context for repeated queries.
        
        Benefits:
        - First query: Pay full input tokens
        - Subsequent queries: Pay 1/10th the cost
        
        Example:
        - 50k token Telegram history
        - First query: $0.05
        - Next 10 queries: $0.005 each
        
        Args:
            content: Text to cache (e.g., Telegram history)
            cache_id: Unique identifier for this cache
            system_instruction: System prompt for model
        
        Returns:
            CachedContent object (valid for 1 hour)
        """
        # Save content to temporary file
        temp_path = f"/tmp/cache_{cache_id}.txt"
        with open(temp_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        # Upload to Gemini
        uploaded_file = genai.upload_file(
            path=temp_path,
            display_name=f"Cached Context - {cache_id}"
        )
        
        # Wait for processing
        while uploaded_file.state.name == "PROCESSING":
            await asyncio.sleep(1)
            uploaded_file = genai.get_file(uploaded_file.name)
        
        # Create cache
        cache = caching.CachedContent.create(
            model='gemini-1.5-flash-002',
            display_name=f'context_cache_{cache_id}',
            system_instruction=system_instruction,
            contents=[uploaded_file],
            ttl=self.cache_ttl
        )
        
        # Cleanup temp file
        os.remove(temp_path)
        
        print(f"[Gemini RAG] Created cache: {cache.name} (expires in {self.cache_ttl})")
        
        return cache
    
    async def query_with_cache(
        self,
        cache: caching.CachedContent,
        query: str
    ) -> str:
        """
        Query using cached context (much cheaper).
        
        Args:
            cache: Previously created CachedContent
            query: Question to ask
        
        Returns:
            Response text
        """
        model_with_cache = genai.GenerativeModel.from_cached_content(cache)
        
        response = model_with_cache.generate_content(query)
        
        return response.text.strip()
```

### 2. Integration with Existing Services

#### A. Pre-Mediation Coach Enhancement

Modify: `backend/app/services/pre_mediation_coach.py`

```python
# Add this method to PreMediationCoach class

from app.services.gemini_rag_service import GeminiRAGService

class PreMediationCoach:
    def __init__(self):
        self.claude = anthropic.Client()
        self.gemini_rag = GeminiRAGService()  # NEW
    
    async def start_session_with_telegram_context(
        self,
        room: Room,
        user: User,
        telegram_history: Optional[Dict] = None
    ):
        """
        Enhanced coaching start that includes Telegram context analysis.
        """
        telegram_insights = None
        
        if telegram_history:
            print(f"[Coach] Analyzing Telegram history for {user.name}")
            
            # Get both participant names
            participants = room.participants
            user1 = participants[0]
            user2 = participants[1]
            
            try:
                # Analyze with Gemini
                telegram_insights = await self.gemini_rag.analyze_telegram_history(
                    telegram_messages=telegram_history['messages'],
                    room_id=str(room.id),
                    user1_name=user1.name,
                    user2_name=user2.name
                )
                
                # Store in room for later reference
                room.telegram_insights = telegram_insights
                await room.save()
                
                print(f"[Coach] Telegram analysis complete: {len(telegram_insights['recurring_themes'])} themes")
            
            except Exception as e:
                print(f"[Coach] Telegram analysis failed: {e}")
                # Continue without Telegram context
        
        # Start coaching with enriched context
        initial_prompt = self._build_coaching_prompt(
            user=user,
            room=room,
            telegram_context=telegram_insights
        )
        
        return await self.send_first_message(initial_prompt)
    
    def _build_coaching_prompt(
        self,
        user: User,
        room: Room,
        telegram_context: Optional[Dict] = None
    ) -> str:
        """
        Build coaching system prompt with optional Telegram context.
        """
        base_prompt = PRE_MEDIATION_COACH_PROMPT  # Your existing prompt
        
        if telegram_context:
            context_addition = f"""
            
            === CONVERSATION HISTORY CONTEXT ===
            
            I have analyzed {user.name}'s recent message history with the other person.
            Here are key insights to inform your coaching:
            
            Recurring Themes:
            {self._format_themes(telegram_context['recurring_themes'])}
            
            Communication Patterns:
            {self._format_patterns(telegram_context['communication_patterns'])}
            
            Emotional Triggers:
            {self._format_triggers(telegram_context['emotional_triggers'])}
            
            Unmet Needs:
            {self._format_needs(telegram_context['unmet_needs'])}
            
            Overall Assessment:
            {telegram_context['overall_assessment']}
            
            Use these insights to:
            1. Ask more targeted questions
            2. Validate what they're experiencing
            3. Help them articulate their position clearly
            4. Prepare them for productive mediation
            
            Remember: This context is PRIVATE. The other person hasn't seen this analysis.
            """
            
            return base_prompt + context_addition
        
        return base_prompt
    
    def _format_themes(self, themes: List[Dict]) -> str:
        lines = []
        for theme in themes[:3]:  # Top 3
            lines.append(f"• {theme['theme']} (mentioned {theme['frequency']} times)")
        return "\n".join(lines)
    
    def _format_patterns(self, patterns: Dict) -> str:
        lines = []
        for person, data in patterns.items():
            lines.append(f"• {person}: {data['tone']}, initiates {data['initiates_pct']}% of conversations")
        return "\n".join(lines)
    
    def _format_triggers(self, triggers: Dict) -> str:
        lines = []
        for person, trigger_list in triggers.items():
            lines.append(f"• {person}: {', '.join(trigger_list[:2])}")
        return "\n".join(lines)
    
    def _format_needs(self, needs: Dict) -> str:
        lines = []
        for person, need_list in needs.items():
            lines.append(f"• {person}: {', '.join(need_list[:2])}")
        return "\n".join(lines)
```

#### B. Main Room Mediator Enhancement

Modify: `backend/app/services/main_room_mediator.py`

```python
# Add document context capability to MainRoomMediator

from app.services.gemini_rag_service import GeminiRAGService

class MainRoomMediator:
    def __init__(self):
        self.claude = anthropic.Client()
        self.gemini_rag = GeminiRAGService()  # NEW
    
    async def respond_with_document_context(
        self,
        room: Room,
        user_message: str,
        conversation_history: List[Dict],
        attached_document_ids: Optional[List[str]] = None
    ) -> str:
        """
        Generate mediation response with document context if needed.
        
        Use Cases:
        - User says: "As I mentioned in the email..."
        - User asks: "What did the document say about X?"
        - AI needs to reference specific facts
        """
        document_context = None
        
        # Check if user is referencing documents
        if attached_document_ids or self._is_referencing_document(user_message):
            print(f"[Mediator] User referencing documents, fetching context...")
            
            # Get document URLs from database
            from app.models import Attachment
            
            if attached_document_ids:
                attachments = await Attachment.filter(id__in=attached_document_ids)
            else:
                # Get all documents uploaded in this room
                attachments = await Attachment.filter(room_id=room.id).all()
            
            if attachments:
                doc_urls = [att.s3_url for att in attachments]
                
                try:
                    # Ask Gemini to extract relevant context
                    document_context = await self.gemini_rag.query_uploaded_documents(
                        room_id=str(room.id),
                        user_question=user_message,
                        document_urls=doc_urls
                    )
                    
                    print(f"[Mediator] Document context retrieved")
                
                except Exception as e:
                    print(f"[Mediator] Document query failed: {e}")
        
        # Build enhanced prompt for Claude
        system_prompt = self._build_mediator_prompt(
            room=room,
            document_context=document_context
        )
        
        # Add document context to conversation if available
        if document_context:
            conversation_history.append({
                "role": "assistant",
                "content": f"[Document Context: {document_context}]"
            })
        
        # Get Claude's mediation response
        response = await self.claude.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1000,
            system=system_prompt,
            messages=conversation_history + [
                {"role": "user", "content": user_message}
            ]
        )
        
        return response.content[0].text
    
    def _is_referencing_document(self, message: str) -> bool:
        """
        Detect if user is referencing an uploaded document.
        """
        reference_phrases = [
            "in the email",
            "in the document",
            "in the file",
            "as I sent",
            "as you can see",
            "like I wrote",
            "in my message",
            "in the attachment"
        ]
        
        message_lower = message.lower()
        return any(phrase in message_lower for phrase in reference_phrases)
    
    def _build_mediator_prompt(
        self,
        room: Room,
        document_context: Optional[str] = None
    ) -> str:
        """
        Build system prompt with optional document context.
        """
        base_prompt = MAIN_ROOM_MEDIATOR_PROMPT  # Your existing prompt
        
        if document_context:
            context_addition = f"""
            
            === DOCUMENT CONTEXT ===
            
            Relevant information from uploaded documents:
            {document_context}
            
            Use this context to:
            1. Ground the conversation in facts
            2. Reference specific details when helpful
            3. Ask both parties how they interpret this information
            4. Reduce "he said / she said" disputes
            
            CRITICAL: Remain neutral. Don't assume the document proves anyone "right."
            """
            
            return base_prompt + context_addition
        
        return base_prompt
```

### 3. API Routes Integration

Add new endpoints to: `backend/app/routes/rooms.py`

```python
from app.services.gemini_rag_service import GeminiRAGService

gemini_rag_service = GeminiRAGService()

# ─────────────────────────────────────────────────────────────
# TELEGRAM INTEGRATION ENDPOINT
# ─────────────────────────────────────────────────────────────

@router.post("/{room_id}/telegram/analyze")
async def analyze_telegram_history(
    room_id: str,
    telegram_data: Dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Analyze Telegram conversation history for coaching context.
    
    Request Body:
    {
        "messages": [
            {"timestamp": "2025-01-15 14:32", "from_me": true, "text": "..."},
            ...
        ],
        "contact_name": "Sarah"
    }
    
    Response:
    {
        "success": true,
        "analysis": {
            "recurring_themes": [...],
            "communication_patterns": {...},
            ...
        }
    }
    """
    # Verify access
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(404, "Room not found")
    
    if current_user not in room.participants:
        raise HTTPException(403, "Not authorized")
    
    try:
        # Get participant names
        participants = room.participants
        user1 = participants[0]
        user2 = participants[1]
        
        # Analyze with Gemini
        analysis = await gemini_rag_service.analyze_telegram_history(
            telegram_messages=telegram_data['messages'],
            room_id=room_id,
            user1_name=user1.name,
            user2_name=user2.name
        )
        
        # Store in room
        room.telegram_insights = analysis
        db.commit()
        
        return {
            "success": True,
            "analysis": analysis,
            "message": "Telegram history analyzed successfully"
        }
    
    except Exception as e:
        print(f"[API] Telegram analysis failed: {e}")
        raise HTTPException(500, f"Analysis failed: {str(e)}")

# ─────────────────────────────────────────────────────────────
# DOCUMENT QUERY ENDPOINT
# ─────────────────────────────────────────────────────────────

@router.post("/{room_id}/documents/query")
async def query_documents(
    room_id: str,
    query_data: Dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Query uploaded documents for specific information.
    
    Request Body:
    {
        "question": "What did the email say about money?",
        "document_ids": ["uuid1", "uuid2"]  # Optional, defaults to all
    }
    
    Response:
    {
        "success": true,
        "answer": "According to the email from March 15th, ..."
    }
    """
    # Verify access
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(404, "Room not found")
    
    if current_user not in room.participants:
        raise HTTPException(403, "Not authorized")
    
    question = query_data.get('question')
    if not question:
        raise HTTPException(400, "Question is required")
    
    try:
        # Get document URLs
        from app.models import Attachment
        
        if query_data.get('document_ids'):
            attachments = db.query(Attachment).filter(
                Attachment.id.in_(query_data['document_ids']),
                Attachment.room_id == room_id
            ).all()
        else:
            # All documents in room
            attachments = db.query(Attachment).filter(
                Attachment.room_id == room_id
            ).all()
        
        if not attachments:
            return {
                "success": False,
                "answer": "No documents have been uploaded to this room yet."
            }
        
        doc_urls = [att.s3_url for att in attachments]
        
        # Query with Gemini
        answer = await gemini_rag_service.query_uploaded_documents(
            room_id=room_id,
            user_question=question,
            document_urls=doc_urls
        )
        
        return {
            "success": True,
            "answer": answer,
            "documents_queried": len(attachments)
        }
    
    except Exception as e:
        print(f"[API] Document query failed: {e}")
        raise HTTPException(500, f"Query failed: {str(e)}")

# ─────────────────────────────────────────────────────────────
# PATTERN DASHBOARD ENDPOINT
# ─────────────────────────────────────────────────────────────

@router.get("/users/{user_id}/patterns")
async def get_relationship_patterns(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get relationship pattern analysis across all sessions.
    
    Response:
    {
        "success": true,
        "patterns": {
            "recurring_conflicts": [...],
            "successful_strategies": [...],
            "progress_indicators": {...}
        },
        "sessions_analyzed": 5
    }
    """
    # Verify access (only own patterns or admin)
    if current_user.id != user_id and not current_user.is_admin:
        raise HTTPException(403, "Not authorized")
    
    try:
        # Get all resolved sessions for this user
        rooms = db.query(Room).filter(
            Room.participants.any(id=user_id),
            Room.phase == "resolved"
        ).all()
        
        if len(rooms) < 2:
            return {
                "success": False,
                "message": "Need at least 2 completed sessions for pattern analysis",
                "sessions_analyzed": len(rooms)
            }
        
        # Prepare session data
        session_data = []
        for room in rooms:
            # Get main room transcript
            main_turns = db.query(Turn).filter(
                Turn.room_id == room.id,
                Turn.context == "main"
            ).order_by(Turn.created_at).all()
            
            transcript = "\n".join([
                f"{turn.user.name}: {turn.summary}" for turn in main_turns
            ])
            
            session_data.append({
                "session_id": str(room.id),
                "date": room.created_at.strftime("%Y-%m-%d"),
                "status": room.phase,
                "transcript": transcript,
                "resolution": room.agreement_text
            })
        
        # Analyze with Gemini
        patterns = await gemini_rag_service.analyze_session_patterns(
            user_id=user_id,
            session_transcripts=session_data
        )
        
        return {
            "success": True,
            "patterns": patterns,
            "sessions_analyzed": len(session_data)
        }
    
    except Exception as e:
        print(f"[API] Pattern analysis failed: {e}")
        raise HTTPException(500, f"Analysis failed: {str(e)}")
```

---

## Cost and Performance Optimization

### 1. Context Caching Strategy

**Problem**: Analyzing the same Telegram history multiple times is expensive  
**Solution**: Cache the context for 1 hour

**Implementation**:

```python
# In gemini_rag_service.py

async def analyze_telegram_with_caching(
    self,
    telegram_messages: List[Dict],
    room_id: str,
    user1_name: str,
    user2_name: str
) -> Dict:
    """
    Analyze Telegram history with caching for follow-up queries.
    
    Use Case:
    - Initial analysis: "What are the main themes?" (creates cache)
    - Follow-up: "What triggers Sarah?" (uses cache, 10x cheaper)
    - Follow-up: "When do conflicts happen?" (uses cache, 10x cheaper)
    """
    # Check if cache exists
    cache_key = f"telegram_{room_id}"
    cached_context = await self._get_cache(cache_key)
    
    if not cached_context:
        # First query: create cache
        formatted_text = self._format_telegram_messages(
            messages=telegram_messages,
            user1_name=user1_name,
            user2_name=user2_name
        )
        
        system_instruction = f"""
        You are analyzing a Telegram conversation between {user1_name} and {user2_name}
        for relationship mediation purposes. Be empathetic, objective, and pattern-focused.
        """
        
        cached_context = await self.create_cached_context(
            content=formatted_text,
            cache_id=cache_key,
            system_instruction=system_instruction
        )
    
    # Query with cache
    prompt = """
    Analyze this conversation and provide:
    1. Recurring themes
    2. Communication patterns
    3. Emotional triggers
    4. Unmet needs
    5. Positive moments
    
    Return as JSON.
    """
    
    response = await self.query_with_cache(cached_context, prompt)
    
    return json.loads(response)

async def _get_cache(self, cache_key: str) -> Optional[caching.CachedContent]:
    """
    Check if cached context exists and is still valid.
    """
    try:
        # List all caches for this project
        caches = caching.CachedContent.list()
        
        for cache in caches:
            if cache_key in cache.display_name:
                # Check if still valid
                if cache.expire_time > datetime.datetime.now():
                    return cache
        
        return None
    
    except:
        return None
```

**Cost Savings**:
```
Telegram History: 500 messages = ~50,000 tokens

Without Caching:
- Query 1: 50k input tokens × $0.075/1M = $0.00375
- Query 2: 50k input tokens × $0.075/1M = $0.00375
- Query 3: 50k input tokens × $0.075/1M = $0.00375
Total: $0.01125

With Caching (1 hour TTL):
- Query 1: 50k tokens × $0.075/1M = $0.00375 (creates cache)
- Query 2: 50k cached × $0.0075/1M = $0.000375 (10x cheaper)
- Query 3: 50k cached × $0.0075/1M = $0.000375 (10x cheaper)
Total: $0.0045 (60% savings)
```

### 2. Batch Processing

For multiple documents, process in parallel:

```python
import asyncio

async def query_multiple_documents_parallel(
    self,
    room_id: str,
    questions: List[str],
    document_urls: List[str]
) -> List[str]:
    """
    Process multiple questions in parallel for speed.
    
    Example:
    questions = [
        "What does the email say about money?",
        "What was agreed in the contract?",
        "When is the deadline?"
    ]
    
    All answered simultaneously instead of sequentially.
    """
    tasks = [
        self.query_uploaded_documents(room_id, q, document_urls)
        for q in questions
    ]
    
    answers = await asyncio.gather(*tasks)
    
    return answers
```

**Performance**:
- Sequential: 3 questions × 2 seconds = 6 seconds
- Parallel: 3 questions = 2 seconds (3x faster)

### 3. Smart Document Selection

Don't upload ALL documents if user asks about one:

```python
def _select_relevant_documents(
    self,
    user_question: str,
    available_documents: List[Attachment]
) -> List[Attachment]:
    """
    Select only relevant documents based on question.
    
    Reduces:
    - Upload time
    - Processing time
    - Token costs
    """
    # Simple keyword matching (can enhance with embeddings)
    question_lower = user_question.lower()
    
    relevant = []
    for doc in available_documents:
        # Check filename
        if any(keyword in doc.filename.lower() for keyword in question_lower.split()):
            relevant.append(doc)
            continue
        
        # Check document type
        if "email" in question_lower and "email" in doc.filename.lower():
            relevant.append(doc)
        elif "contract" in question_lower and "contract" in doc.filename.lower():
            relevant.append(doc)
    
    # If no specific matches, use all (fallback)
    if not relevant:
        return available_documents
    
    return relevant
```

---

## Privacy and Security

### 1. Privacy-Compliant File Lifecycle

**Principle**: Gemini files must respect Meedi8's 30-day deletion policy

```python
# backend/app/models/gemini_file.py

from sqlalchemy import Column, String, DateTime
from datetime import datetime, timedelta

class GeminiFile(Base):
    """
    Tracks files uploaded to Gemini for privacy compliance.
    """
    __tablename__ = "gemini_files"
    
    id = Column(String, primary_key=True)
    room_id = Column(String, ForeignKey('rooms.id'))
    gemini_file_name = Column(String)  # Gemini's file identifier
    file_type = Column(String)  # 'telegram', 'document', 'session'
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    delete_at = Column(DateTime)  # Auto-set to uploaded_at + 30 days
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.delete_at:
            self.delete_at = self.uploaded_at + timedelta(days=30)

# Migration
# backend/migrations/versions/20251117_add_gemini_files.py
def upgrade():
    op.create_table(
        'gemini_files',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('room_id', sa.String(), nullable=True),
        sa.Column('gemini_file_name', sa.String(), nullable=False),
        sa.Column('file_type', sa.String(), nullable=True),
        sa.Column('uploaded_at', sa.DateTime(), nullable=True),
        sa.Column('delete_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['room_id'], ['rooms.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
```

**Automated Cleanup**:

```python
# backend/app/services/gemini_rag_service.py

async def upload_with_auto_delete_tracking(
    self,
    file_path: str,
    room_id: str,
    file_type: str
) -> str:
    """
    Upload file and track for deletion.
    """
    # Upload to Gemini
    uploaded_file = genai.upload_file(file_path)
    
    # Store reference in DB
    from app.models.gemini_file import GeminiFile
    
    gemini_file_record = GeminiFile(
        id=str(uuid.uuid4()),
        room_id=room_id,
        gemini_file_name=uploaded_file.name,
        file_type=file_type,
        uploaded_at=datetime.utcnow()
    )
    
    db.add(gemini_file_record)
    db.commit()
    
    return uploaded_file.name

# Celery task for cleanup
@celery.task
async def cleanup_expired_gemini_files():
    """
    Run daily: Delete expired files from Gemini API.
    """
    from app.models.gemini_file import GeminiFile
    
    expired_files = db.query(GeminiFile).filter(
        GeminiFile.delete_at <= datetime.utcnow()
    ).all()
    
    for file_record in expired_files:
        try:
            # Delete from Gemini
            genai.delete_file(file_record.gemini_file_name)
            print(f"[Privacy] Deleted Gemini file: {file_record.gemini_file_name}")
        except Exception as e:
            print(f"[Privacy] Failed to delete Gemini file: {e}")
        
        # Delete DB record
        db.delete(file_record)
    
    db.commit()
    
    print(f"[Privacy] Cleaned up {len(expired_files)} expired Gemini files")

# Schedule daily at 3 AM
celery.conf.beat_schedule = {
    'cleanup-gemini-files': {
        'task': 'tasks.cleanup_expired_gemini_files',
        'schedule': crontab(hour=3, minute=0),
    },
}
```

### 2. Secure File Handling

```python
class SecureGeminiUpload:
    """
    Security best practices for file uploads.
    """
    
    # Allowed file types
    ALLOWED_EXTENSIONS = {
        'txt', 'pdf', 'doc', 'docx', 
        'png', 'jpg', 'jpeg', 
        'csv', 'xlsx'
    }
    
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB
    
    @staticmethod
    def validate_file(file_path: str) -> bool:
        """
        Validate file before uploading to Gemini.
        """
        # Check extension
        ext = file_path.split('.')[-1].lower()
        if ext not in SecureGeminiUpload.ALLOWED_EXTENSIONS:
            raise ValueError(f"File type .{ext} not allowed")
        
        # Check size
        file_size = os.path.getsize(file_path)
        if file_size > SecureGeminiUpload.MAX_FILE_SIZE:
            raise ValueError(f"File too large: {file_size} bytes (max {SecureGeminiUpload.MAX_FILE_SIZE})")
        
        # Check for malicious content (basic)
        with open(file_path, 'rb') as f:
            header = f.read(512)
            # Check for executable headers
            if header.startswith(b'MZ') or header.startswith(b'\x7fELF'):
                raise ValueError("Executable files not allowed")
        
        return True
    
    @staticmethod
    async def upload_safely(
        file_path: str,
        room_id: str,
        file_type: str
    ) -> str:
        """
        Validate and upload file securely.
        """
        # Validate
        SecureGeminiUpload.validate_file(file_path)
        
        # Scan with antivirus if available
        # await scan_with_clamav(file_path)
        
        # Upload
        service = GeminiRAGService()
        gemini_file_name = await service.upload_with_auto_delete_tracking(
            file_path=file_path,
            room_id=room_id,
            file_type=file_type
        )
        
        return gemini_file_name
```

### 3. User Consent & Transparency

**Privacy Notice**:

```python
# When user uploads Telegram history or documents

GEMINI_PRIVACY_NOTICE = """
📄 Document Analysis Privacy Notice

When you upload files or Telegram history for analysis:

✅ What happens:
- Files are temporarily uploaded to Google's Gemini AI for analysis
- Analysis helps provide better mediation context
- Files are automatically deleted within 30 days
- All data is encrypted in transit and at rest

❌ What DOESN'T happen:
- We don't share your data with third parties
- Google doesn't use your data to train their models
- The other person doesn't see your private analysis
- We don't keep files longer than necessary

You can delete your data anytime from Settings > Privacy.

By clicking "Analyze", you consent to this processing.
"""

# Show before first upload
async def check_gemini_consent(user_id: str) -> bool:
    """
    Check if user has consented to Gemini processing.
    """
    user = await User.get(id=user_id)
    
    if not user.has_consented_to_gemini:
        # Show consent modal in frontend
        return False
    
    return True

# Store consent
@router.post("/users/{user_id}/consent/gemini")
async def grant_gemini_consent(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Record user's consent for Gemini processing.
    """
    if current_user.id != user_id:
        raise HTTPException(403, "Not authorized")
    
    current_user.has_consented_to_gemini = True
    current_user.gemini_consent_date = datetime.utcnow()
    await current_user.save()
    
    return {"success": True, "message": "Consent recorded"}
```

---

## Feature Recommendations

### Feature 1: "Conversation Pre-Analysis" (Telegram)

**User Flow**:

```
┌──────────────────────────────────────────────────────┐
│ [User 1 starts new mediation]                       │
├──────────────────────────────────────────────────────┤
│                                                      │
│ 🔗 Connect Telegram for Better Coaching             │
│                                                      │
│ Optional: Let AI analyze your past conversations    │
│ to provide more targeted coaching.                  │
│                                                      │
│ [Connect Telegram]  [Skip for Now]                  │
└──────────────────────────────────────────────────────┘

         ↓ User clicks "Connect Telegram"

┌──────────────────────────────────────────────────────┐
│ Select Contact                                       │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Who is this mediation with?                         │
│                                                      │
│ 👤 Sarah Johnson                                     │
│    Last message: 2 hours ago                        │
│                                                      │
│ 👤 David Miller                                      │
│    Last message: Yesterday                          │
│                                                      │
│ [Cancel]                                             │
└──────────────────────────────────────────────────────┘

         ↓ User selects "Sarah Johnson"

┌──────────────────────────────────────────────────────┐
│ ⏳ Analyzing Your Conversations...                   │
├──────────────────────────────────────────────────────┤
│                                                      │
│ [Progress bar]                                       │
│                                                      │
│ Reading 487 messages...                             │
│ Identifying patterns...                             │
│ Almost done...                                       │
│                                                      │
└──────────────────────────────────────────────────────┘

         ↓ Analysis complete (10-15 seconds)

┌──────────────────────────────────────────────────────┐
│ ✅ Analysis Complete                                 │
├──────────────────────────────────────────────────────┤
│                                                      │
│ 📊 Key Insights from Your Conversations:            │
│                                                      │
│ Recurring Themes:                                   │
│ • Household responsibilities (47 mentions)          │
│ • Communication timing (evening conflicts)          │
│ • Different appreciation styles                     │
│                                                      │
│ Communication Patterns:                             │
│ • You initiate 65% of conversations                 │
│ • Conflicts often happen after 8 PM                 │
│ • Both show care but different expression styles    │
│                                                      │
│ 💡 This context will help your AI coach understand  │
│    your situation better and ask more targeted      │
│    questions.                                        │
│                                                      │
│ Your partner won't see this analysis. It's private  │
│ coaching context.                                    │
│                                                      │
│ [Continue to Coaching]                               │
└──────────────────────────────────────────────────────┘
```

**Backend Implementation**:

```python
@router.post("/{room_id}/telegram/connect")
async def connect_telegram_for_analysis(
    room_id: str,
    telegram_data: Dict,
    current_user: User = Depends(get_current_user)
):
    """
    Step 1: User connects Telegram and selects contact
    Step 2: Fetch message history via Telegram API
    Step 3: Analyze with Gemini
    Step 4: Store insights for coaching
    """
    # Verify room access
    room = await get_room(room_id)
    
    # Fetch Telegram messages (using Telethon)
    from app.services.telegram_service import TelegramService
    
    telegram = TelegramService()
    messages = await telegram.fetch_messages(
        user_phone=current_user.phone,
        contact_id=telegram_data['contact_id'],
        limit=500  # Last 500 messages
    )
    
    # Analyze with Gemini
    analysis = await gemini_rag_service.analyze_telegram_history(
        telegram_messages=messages,
        room_id=room_id,
        user1_name=current_user.name,
        user2_name=telegram_data['contact_name']
    )
    
    # Store for coaching
    room.telegram_insights = analysis
    await room.save()
    
    return {
        "success": True,
        "analysis": {
            "themes_count": len(analysis['recurring_themes']),
            "messages_analyzed": len(messages),
            "insights": analysis
        }
    }
```

**Frontend Component** (React):

```jsx
// frontend/src/components/TelegramConnect.jsx

import React, { useState } from 'react';

export default function TelegramConnect({ roomId, onComplete }) {
  const [step, setStep] = useState('prompt'); // prompt, select, analyzing, complete
  const [contacts, setContacts] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  
  const handleConnect = async () => {
    // Step 1: Fetch Telegram contacts
    const response = await fetch(`/api/telegram/contacts`);
    const data = await response.json();
    setContacts(data.contacts);
    setStep('select');
  };
  
  const handleSelectContact = async (contact) => {
    setStep('analyzing');
    
    // Step 2: Analyze conversation history
    const response = await fetch(`/api/rooms/${roomId}/telegram/analyze`, {
      method: 'POST',
      body: JSON.stringify({
        contact_id: contact.id,
        contact_name: contact.name
      })
    });
    
    const data = await response.json();
    setAnalysis(data.analysis);
    setStep('complete');
  };
  
  if (step === 'prompt') {
    return (
      <div style={styles.container}>
        <h3>🔗 Connect Telegram for Better Coaching</h3>
        <p>Optional: Let AI analyze your past conversations to provide more targeted coaching.</p>
        <button onClick={handleConnect}>Connect Telegram</button>
        <button onClick={() => onComplete(null)}>Skip for Now</button>
      </div>
    );
  }
  
  if (step === 'select') {
    return (
      <div style={styles.container}>
        <h3>Select Contact</h3>
        <p>Who is this mediation with?</p>
        {contacts.map(contact => (
          <div key={contact.id} onClick={() => handleSelectContact(contact)} style={styles.contact}>
            <span>👤 {contact.name}</span>
            <span style={styles.lastMessage}>Last message: {contact.last_message_time}</span>
          </div>
        ))}
      </div>
    );
  }
  
  if (step === 'analyzing') {
    return (
      <div style={styles.container}>
        <h3>⏳ Analyzing Your Conversations...</h3>
        <div style={styles.progress}>
          <div style={styles.progressBar}></div>
        </div>
        <p>Reading messages...</p>
        <p>Identifying patterns...</p>
      </div>
    );
  }
  
  if (step === 'complete') {
    return (
      <div style={styles.container}>
        <h3>✅ Analysis Complete</h3>
        
        <div style={styles.insights}>
          <h4>📊 Key Insights from Your Conversations:</h4>
          
          <section>
            <strong>Recurring Themes:</strong>
            <ul>
              {analysis.recurring_themes.slice(0, 3).map((theme, i) => (
                <li key={i}>{theme.theme} ({theme.frequency} mentions)</li>
              ))}
            </ul>
          </section>
          
          <section>
            <strong>Communication Patterns:</strong>
            <ul>
              {Object.entries(analysis.communication_patterns).map(([person, data]) => (
                <li key={person}>
                  {person}: {data.tone}, initiates {data.initiates_pct}% of conversations
                </li>
              ))}
            </ul>
          </section>
          
          <p style={styles.note}>
            💡 This context will help your AI coach understand your situation better.
          </p>
          <p style={styles.privacy}>
            Your partner won't see this analysis. It's private coaching context.
          </p>
        </div>
        
        <button onClick={() => onComplete(analysis)}>Continue to Coaching</button>
      </div>
    );
  }
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '600px',
    margin: '0 auto'
  },
  contact: {
    padding: '15px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    marginBottom: '10px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between'
  },
  lastMessage: {
    color: '#666',
    fontSize: '14px'
  },
  progress: {
    width: '100%',
    height: '10px',
    backgroundColor: '#eee',
    borderRadius: '5px',
    overflow: 'hidden',
    margin: '20px 0'
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#7DD3C0',
    animation: 'progress 10s linear'
  },
  insights: {
    backgroundColor: '#f5f5f5',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  note: {
    fontStyle: 'italic',
    color: '#7DD3C0',
    marginTop: '15px'
  },
  privacy: {
    fontSize: '14px',
    color: '#666'
  }
};
```

### Feature 2: "Document Reference" in Main Room

**User Flow**:

```
Main Room Conversation:

User 1: "As I mentioned in the email I sent last week, I'm frustrated about the budget."

AI (detects document reference, queries Gemini):
"I see you're referring to the email from March 15th where you wrote:
'I'm concerned we're spending beyond our means.'

Sarah, did you receive this email? How did it land for you?"

User 2: "I saw it, but I thought we agreed on that budget together."

AI: "Let me check... According to the budget document you both uploaded,
the agreed amount was $2,000/month. Sarah, you're saying you understood
this differently?"
```

**Implementation**:

Already covered in Section 2B above (`respond_with_document_context`)

**Frontend Enhancement**:

```jsx
// frontend/src/pages/MainRoom.jsx

// Add document attachment button next to message input

<div style={styles.messageInputContainer}>
  <input
    type="text"
    value={message}
    onChange={(e) => setMessage(e.target.value)}
    placeholder="Type your message..."
  />
  
  {/* NEW: Document attachment */}
  <button onClick={handleAttachDocument} style={styles.attachButton}>
    📎 Attach Document
  </button>
  
  <button onClick={handleSend}>Send</button>
</div>

// When user references a document in text
const handleSend = async () => {
  // Check if message references documents
  const referencesDoc = checkForDocumentReference(message);
  
  if (referencesDoc) {
    // Show confirmation
    const confirmed = window.confirm(
      "I noticed you mentioned a document. Would you like me to reference it in the conversation?"
    );
    
    if (confirmed) {
      // Include document_query flag
      await sendMessage({
        text: message,
        query_documents: true
      });
    }
  } else {
    await sendMessage({ text: message });
  }
};

function checkForDocumentReference(text) {
  const referencePatterns = [
    /in the email/i,
    /in the document/i,
    /as I (sent|wrote|mentioned)/i,
    /like I said in/i
  ];
  
  return referencePatterns.some(pattern => pattern.test(text));
}
```

### Feature 3: "Pattern Dashboard"

**User Flow**:

```
┌──────────────────────────────────────────────────────┐
│ Your Relationship Patterns                          │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Based on 5 completed mediation sessions             │
│                                                      │
│ 📈 Progress Over Time                               │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 70% Improvement        │
│                                                      │
│ ✅ What's Working:                                   │
│ • Using "I feel" statements (↑ 45%)                 │
│ • Taking breaks when frustrated (↑ 60%)             │
│ • Active listening (↑ 30%)                          │
│                                                      │
│ ⚠️ Recurring Challenges:                            │
│ • Household chores (resolved 3 times, returns)      │
│   → Underlying need: Feeling valued                 │
│                                                      │
│ • Communication timing (late evening conflicts)     │
│   → Try discussing in morning instead               │
│                                                      │
│ 💡 Recommendation:                                   │
│ "The chores discussion keeps coming back because    │
│  it's not really about tasks - it's about feeling   │
│  appreciated. Try focusing on appreciation rather   │
│  than task division next time."                     │
│                                                      │
│ [View Detailed History]  [Schedule Check-in]        │
└──────────────────────────────────────────────────────┘
```

**Backend Endpoint**:

Already covered in Section 3 above (`/users/{user_id}/patterns`)

**Frontend Component**:

```jsx
// frontend/src/pages/PatternDashboard.jsx

import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function PatternDashboard({ userId }) {
  const [patterns, setPatterns] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchPatterns();
  }, [userId]);
  
  const fetchPatterns = async () => {
    const response = await fetch(`/api/users/${userId}/patterns`);
    const data = await response.json();
    
    if (data.success) {
      setPatterns(data.patterns);
    }
    
    setLoading(false);
  };
  
  if (loading) {
    return <div>Loading your relationship insights...</div>;
  }
  
  if (!patterns) {
    return (
      <div style={styles.empty}>
        <h3>Complete More Sessions</h3>
        <p>Pattern analysis requires at least 2 completed mediations.</p>
        <p>Keep working through your conflicts to unlock insights!</p>
      </div>
    );
  }
  
  return (
    <div style={styles.container}>
      <h2>Your Relationship Patterns</h2>
      <p>Based on {patterns.sessions_analyzed} completed sessions</p>
      
      {/* Progress Indicator */}
      <section style={styles.progressSection}>
        <h3>📈 Progress Over Time</h3>
        <div style={styles.progressBar}>
          <div style={{
            ...styles.progressFill,
            width: `${calculateProgress(patterns)}%`
          }}>
            {calculateProgress(patterns)}% Improvement
          </div>
        </div>
      </section>
      
      {/* Successful Strategies */}
      <section style={styles.section}>
        <h3>✅ What's Working</h3>
        <ul>
          {patterns.successful_strategies.slice(0, 3).map((strategy, i) => (
            <li key={i}>
              {strategy.strategy}
              <span style={styles.effectiveness}> ({strategy.effectiveness})</span>
            </li>
          ))}
        </ul>
      </section>
      
      {/* Recurring Challenges */}
      <section style={styles.section}>
        <h3>⚠️ Recurring Challenges</h3>
        {patterns.recurring_conflicts.map((conflict, i) => (
          <div key={i} style={styles.conflict}>
            <strong>{conflict.conflict}</strong>
            <p style={styles.conflictDetail}>
              Occurred {conflict.frequency} times
              {conflict.last_occurred && ` · Last: ${conflict.last_occurred}`}
            </p>
          </div>
        ))}
      </section>
      
      {/* Unresolved Needs */}
      <section style={styles.section}>
        <h3>💡 Underlying Needs</h3>
        {patterns.unresolved_needs.map((need, i) => (
          <div key={i} style={styles.need}>
            <strong>{need.need}</strong>
            <ul>
              {need.indicators.map((indicator, j) => (
                <li key={j}>{indicator}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>
      
      {/* Recommendations */}
      <section style={styles.recommendations}>
        <h3>📝 Personalized Recommendations</h3>
        {patterns.recommendations.map((rec, i) => (
          <p key={i} style={styles.recommendation}>• {rec}</p>
        ))}
      </section>
      
      <div style={styles.actions}>
        <button>View Detailed History</button>
        <button>Schedule Check-in Session</button>
      </div>
    </div>
  );
}

function calculateProgress(patterns) {
  const improvement = patterns.progress_indicators.improvement_areas.length;
  const challenges = patterns.progress_indicators.persistent_challenges.length;
  
  if (improvement + challenges === 0) return 50;
  
  return Math.round((improvement / (improvement + challenges)) * 100);
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px'
  },
  empty: {
    textAlign: 'center',
    padding: '40px',
    color: '#666'
  },
  progressSection: {
    marginBottom: '30px'
  },
  progressBar: {
    width: '100%',
    height: '40px',
    backgroundColor: '#eee',
    borderRadius: '20px',
    overflow: 'hidden',
    marginTop: '10px'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7DD3C0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 'bold',
    transition: 'width 1s ease'
  },
  section: {
    backgroundColor: '#f9f9f9',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  effectiveness: {
    color: '#7DD3C0',
    fontSize: '14px'
  },
  conflict: {
    marginBottom: '15px',
    paddingBottom: '15px',
    borderBottom: '1px solid #ddd'
  },
  conflictDetail: {
    fontSize: '14px',
    color: '#666',
    marginTop: '5px'
  },
  need: {
    marginBottom: '15px'
  },
  recommendations: {
    backgroundColor: '#E8F9F5',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  recommendation: {
    fontSize: '16px',
    marginBottom: '10px',
    lineHeight: '1.6'
  },
  actions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center'
  }
};
```

---

## Implementation Timeline

### Week 1-2: Foundation (Telegram Integration)

**Tasks**:
- [ ] Set up Gemini API access (API key, test connection)
- [ ] Create `gemini_rag_service.py` core service
- [ ] Implement Telegram message formatting
- [ ] Build `analyze_telegram_history()` function
- [ ] Add database migration for `telegram_insights` field
- [ ] Create `/telegram/analyze` endpoint
- [ ] Test with sample Telegram data (500 messages)

**Deliverable**: Working Telegram analysis that returns JSON insights

**Testing**:
```bash
# Sample test
curl -X POST http://localhost:8000/api/rooms/{room_id}/telegram/analyze \
  -H "Authorization: Bearer {token}" \
  -d '{
    "messages": [...],
    "contact_name": "Test User"
  }'

# Expected response:
{
  "success": true,
  "analysis": {
    "recurring_themes": [...],
    "communication_patterns": {...},
    ...
  }
}
```

### Week 3-4: Document Context

**Tasks**:
- [ ] Implement `query_uploaded_documents()` function
- [ ] Add document reference detection logic
- [ ] Enhance `MainRoomMediator` with document context
- [ ] Create `/documents/query` endpoint
- [ ] Add frontend document attachment button
- [ ] Test with PDF, images, text files

**Deliverable**: AI can reference uploaded documents during mediation

**Testing**:
```python
# Test document query
response = await gemini_rag_service.query_uploaded_documents(
    room_id="test-room",
    user_question="What did the email say about money?",
    document_urls=["https://s3.../email.pdf"]
)

print(response)
# Expected: "According to the email from March 15th, the budget was set at $2000/month..."
```

### Week 5-6: Pattern Dashboard

**Tasks**:
- [ ] Implement `analyze_session_patterns()` function
- [ ] Create `/users/{id}/patterns` endpoint
- [ ] Build frontend `PatternDashboard` component
- [ ] Add progress visualization (charts)
- [ ] Test with 3+ completed sessions
- [ ] Add "View Patterns" button to dashboard

**Deliverable**: Users can see relationship health trends

**Testing**:
- Create 3 test mediation sessions with different conflicts
- Call patterns endpoint
- Verify it identifies recurring themes
- Check recommendations are actionable

### Week 7: Privacy & Compliance

**Tasks**:
- [ ] Create `gemini_files` database table
- [ ] Implement auto-delete tracking
- [ ] Create Celery cleanup task
- [ ] Add privacy consent flow (frontend modal)
- [ ] Update Privacy Policy with Gemini disclosure
- [ ] Test 30-day deletion works
- [ ] Security audit (file validation, size limits)

**Deliverable**: Privacy-compliant file lifecycle

**Testing**:
```python
# Test auto-delete
file = await gemini_rag.upload_with_auto_delete_tracking(...)

# Manually set delete_at to past
file_record.delete_at = datetime.now() - timedelta(hours=1)
db.commit()

# Run cleanup task
await cleanup_expired_gemini_files()

# Verify file deleted from Gemini
try:
    genai.get_file(file_record.gemini_file_name)
    assert False, "File should be deleted"
except:
    pass  # Expected
```

### Week 8: Optimization & Launch

**Tasks**:
- [ ] Implement context caching for repeated queries
- [ ] Add batch processing for multiple questions
- [ ] Optimize document selection (relevance filtering)
- [ ] Load testing (100 concurrent Telegram analyses)
- [ ] Cost monitoring dashboard
- [ ] Beta test with 20 users
- [ ] Fix bugs from beta feedback
- [ ] Production launch

**Deliverable**: Production-ready Gemini RAG integration

**Success Metrics**:
- Telegram analysis completes in <15 seconds
- Document queries return in <3 seconds
- Cost per session: <$0.10 (with caching)
- User satisfaction: "Context helped" >70%
- Zero privacy incidents

---

## Environment Setup

### 1. Install Dependencies

```bash
# Backend
cd backend

# Add to requirements.txt
echo "google-generativeai>=0.3.0" >> requirements.txt

# Install
pip install -r requirements.txt
```

### 2. Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Get API Key"
3. Create new API key
4. Copy key

### 3. Environment Variables

```bash
# backend/.env

# Add these lines
GEMINI_API_KEY=your_key_here
ENABLE_GEMINI_RAG=true

# Optional: Rate limiting
GEMINI_RATE_LIMIT_PER_MINUTE=60
```

### 4. Database Migration

```bash
# Create migration for telegram_insights and gemini_files

cd backend
alembic revision --autogenerate -m "add gemini rag support"

# Inspect migration file
# Should add:
# - telegram_insights JSONB column to rooms table
# - gemini_files table for tracking uploads

alembic upgrade head
```

### 5. Test Connection

```python
# backend/test_gemini.py

import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

# Test basic query
model = genai.GenerativeModel('gemini-1.5-flash-002')
response = model.generate_content("Say hello")

print(f"✅ Gemini API connected successfully!")
print(f"Response: {response.text}")

# Test file upload
with open("test.txt", "w") as f:
    f.write("This is a test file for Gemini RAG.")

uploaded_file = genai.upload_file("test.txt")
print(f"✅ File upload works! File ID: {uploaded_file.name}")

# Cleanup
genai.delete_file(uploaded_file.name)
os.remove("test.txt")
print(f"✅ File deletion works!")
```

Run:
```bash
python backend/test_gemini.py
```

Expected output:
```
✅ Gemini API connected successfully!
Response: Hello! How can I help you today?
✅ File upload works! File ID: files/abc123
✅ File deletion works!
```

---

## Cost Analysis

### Per-Feature Cost Breakdown

#### 1. Telegram Analysis (One-Time per Room)

**Scenario**: 500-message Telegram history

```
Input:
- Formatted messages: ~50,000 tokens
- Analysis prompt: ~500 tokens
- Total input: ~50,500 tokens

Output:
- JSON analysis: ~2,000 tokens

Cost:
- Input: 50,500 × $0.075/1M = $0.00379
- Output: 2,000 × $0.30/1M = $0.0006
- Total: ~$0.0044 per analysis

With caching (3 follow-up queries):
- Initial: $0.0044
- Follow-up 1: $0.0006 (cached input is 10x cheaper)
- Follow-up 2: $0.0006
- Follow-up 3: $0.0006
- Total: ~$0.0062 for 4 queries vs $0.0176 without caching
- Savings: 65%
```

**Monthly at Scale**:
- 1,000 rooms with Telegram analysis
- Cost: 1,000 × $0.0044 = **$4.40/month**

#### 2. Document Queries (During Mediation)

**Scenario**: User asks 3 questions about uploaded documents

```
Input:
- Document (10-page PDF): ~20,000 tokens
- Query 1: "What did the email say about money?" ~20,020 tokens
- Query 2: "When is the deadline?" ~20,020 tokens
- Query 3: "What was agreed?" ~20,020 tokens

Output per query: ~300 tokens

Without caching:
- Query 1: (20,020 × $0.075/1M) + (300 × $0.30/1M) = $0.00159
- Query 2: $0.00159
- Query 3: $0.00159
- Total: $0.00477

With caching:
- Query 1: $0.00159 (creates cache)
- Query 2: (20,000 × $0.0075/1M) + (300 × $0.30/1M) = $0.00024
- Query 3: $0.00024
- Total: $0.00207 (56% savings)
```

**Monthly at Scale**:
- 500 sessions with document queries
- 3 queries per session on average
- Cost: 500 × $0.00207 = **$1.04/month**

#### 3. Pattern Analysis (Monthly Dashboard)

**Scenario**: Analyzing 5 past session transcripts

```
Input:
- 5 session transcripts: ~100,000 tokens total
- Analysis prompt: ~500 tokens
- Total input: ~100,500 tokens

Output:
- Pattern analysis JSON: ~3,000 tokens

Cost:
- Input: 100,500 × $0.075/1M = $0.00754
- Output: 3,000 × $0.30/1M = $0.0009
- Total: ~$0.0084 per dashboard generation
```

**Monthly at Scale**:
- 200 active users request pattern dashboard
- Cost: 200 × $0.0084 = **$1.68/month**

### Total Monthly Cost Projection

```
Feature                    Usage        Cost/Month
─────────────────────────────────────────────────
Telegram Analysis          1,000        $4.40
Document Queries           500          $1.04
Pattern Dashboards         200          $1.68
─────────────────────────────────────────────────
TOTAL GEMINI COSTS                      $7.12/month

Existing Claude Costs                   ~$200/month
                                        (based on mediation sessions)

TOTAL AI COSTS                          ~$207/month
```

**Cost Per Session (Average)**:
- Gemini: $0.007
- Claude (mediation): $0.10
- **Total: ~$0.107 per session** (3.5% increase)

### Cost Optimization Tips

1. **Use Caching Aggressively**
   - Cache Telegram histories (valid for 1 hour)
   - Cache large documents during active mediation
   - Savings: 50-65%

2. **Batch Related Queries**
   - Process multiple questions in parallel
   - Share same uploaded file
   - Reduces upload/processing time

3. **Smart Document Selection**
   - Don't upload all 10 documents if query mentions "email"
   - Filter by relevance before uploading
   - Savings: 40-60% on document queries

4. **Progressive Analysis**
   - Telegram: Start with summary (cheap), deep-dive on demand (more expensive)
   - Patterns: Monthly generation, not real-time
   - Cache frequently accessed analyses

5. **Token Optimization**
   - Compress transcripts before analysis (remove filler words)
   - Use structured prompts (JSON output is more compact)
   - Limit output tokens to what's necessary

**With all optimizations**:
- Estimated reduction: 40%
- New monthly cost: ~$4.30 for Gemini
- Cost per session: ~$0.004 (negligible impact)

---

## Next Steps

### Immediate Actions (This Week)

1. **Get Gemini API Access**
   - Go to https://aistudio.google.com/app/apikey
   - Create API key
   - Add to `.env` file
   - Test connection (run `test_gemini.py`)

2. **Create Core Service**
   - Copy `gemini_rag_service.py` code into project
   - Test with sample Telegram data
   - Verify JSON parsing works

3. **Database Migration**
   - Run `alembic revision` for new fields
   - Test migration on local PostgreSQL
   - Verify no conflicts with existing schema

### Priority Features (Next 2 Weeks)

**High Priority**:
- ✅ Telegram analysis (biggest immediate value)
- ✅ Document context in mediation (prevents disputes)

**Medium Priority**:
- ⏳ Pattern dashboard (nice-to-have, not critical for MVP)
- ⏳ Context caching (cost optimization)

**Low Priority**:
- ⏳ Batch processing (performance optimization)
- ⏳ Advanced relevance filtering

### Questions to Answer Before Implementation

1. **Telegram Integration Method**
   - Use Telethon library for direct Telegram API access?
   - Or manual upload (user exports chat history)?
   - **Recommendation**: Manual upload for MVP (simpler, no Telegram credentials needed)

2. **Document Storage Duration**
   - Keep in Gemini for session duration (hours)?
   - Or store for 30 days like other data?
   - **Recommendation**: Session duration (hours) - upload on-demand, delete after session

3. **User Consent Flow**
   - Show privacy notice on first Telegram/document upload?
   - Or during onboarding?
   - **Recommendation**: First upload (contextual consent)

4. **Pattern Dashboard Access**
   - Free tier gets basic patterns?
   - Or premium feature only?
   - **Recommendation**: Basic patterns free, detailed analysis for premium

### Testing Plan

**Phase 1: Internal Testing** (Week 1-2)
- Test with your own Telegram data
- Upload test documents and query
- Verify privacy: Check Gemini deletes files

**Phase 2: Beta Testing** (Week 3-4)
- Invite 10 couples to try Telegram feature
- Collect feedback on insights accuracy
- Monitor costs (should be <$0.10 per session)

**Phase 3: Production** (Week 5+)
- Roll out to all users
- Monitor error rates, costs, performance
- Iterate based on usage patterns

---

## Conclusion

### Key Takeaways

1. **Hybrid AI Strategy is Optimal**
   - Gemini: Document processing, pattern detection (cheap, fast)
   - Claude: Emotional mediation, real-time dialogue (expensive, high-quality)
   - Combined: Best cost/quality ratio

2. **Biggest Value: Telegram Analysis**
   - Provides immediate context that users can't articulate themselves
   - Makes coaching more targeted and effective
   - Cost: Only $0.004 per analysis (negligible)

3. **Privacy is Achievable**
   - 30-day auto-delete matches existing policy
   - User consent at first upload
   - Programmatic file cleanup prevents leaks

4. **Implementation is Straightforward**
   - Main complexity: File upload/download pipeline
   - Gemini API is simple (similar to Claude)
   - Frontend changes are minimal

5. **Costs are Negligible**
   - Total Gemini cost: ~$7/month for 1,000 active sessions
   - Per-session increase: $0.007 (0.3% of total AI costs)
   - ROI: High (better mediation outcomes >> cost)

### Success Metrics

**Track these after launch**:

```
Metric                          Target
────────────────────────────────────────
Telegram adoption rate          >30%
"Context helped" feedback       >70%
Document query accuracy         >85%
Pattern dashboard satisfaction  >4/5 stars
Cost per session                <$0.01
Privacy incidents               0
```

### Final Recommendation

**Start with Telegram analysis** - it's the highest-value, lowest-complexity feature. Once that's working well, add document context, then pattern dashboard.

**Timeline**: 8 weeks to full implementation  
**Cost**: Negligible (<1% increase)  
**Value**: High (better outcomes, unique differentiator)

**Go for it!** 🚀

---

## Appendix: Additional Resources

### Gemini API Documentation
- File API: https://ai.google.dev/gemini-api/docs/file-api
- Context Caching: https://ai.google.dev/gemini-api/docs/caching
- Prompt Engineering: https://ai.google.dev/gemini-api/docs/prompting

### Example Prompts Library

```python
# Telegram Analysis Variations

# Focused on specific theme
TELEGRAM_THEME_PROMPT = """
Focus specifically on {theme} in this conversation history.
Identify:
1. How often does {theme} come up?
2. What triggers discussions about {theme}?
3. How do they typically resolve (or not resolve) {theme} conflicts?
4. What underlying needs relate to {theme}?
"""

# Communication style analysis
COMMUNICATION_STYLE_PROMPT = """
Analyze communication styles in this conversation:
1. Who uses more "I" statements vs "You" statements?
2. Who asks more questions vs makes more statements?
3. Response time patterns (immediate vs delayed)
4. Emotional tone progression (calm → frustrated → angry)
5. Use of humor, sarcasm, affection
"""

# Conflict escalation detection
ESCALATION_PATTERN_PROMPT = """
Identify patterns in how conflicts escalate:
1. What time of day do conflicts occur?
2. What topics trigger escalation?
3. How quickly do they escalate (minutes? hours?)?
4. What de-escalation strategies work?
5. Are there "point of no return" phrases?
"""
```

### Telegram Manual Export Instructions

**For Users** (if not using Telethon integration):

```
How to Export Your Telegram Chat History:

1. Open Telegram Desktop (required - mobile doesn't support export)
2. Navigate to the chat with the person you're mediating with
3. Click on their name at the top
4. Click the three dots (⋮) → "Export chat history"
5. In the export dialog:
   ✅ Check "Messages"
   ❌ Uncheck "Photos and videos" (unless relevant)
   ❌ Uncheck "Voice messages"
   ✅ Select "JSON" format
6. Click "Export"
7. Upload the exported file to Meedi8

This gives our AI context about your relationship dynamics.
Your partner won't see this analysis - it's private coaching context.
```

### Security Checklist

Before launching Gemini integration:

```
Security Review Checklist:

□ API key stored in environment variables (not code)
□ File size limits enforced (<50MB)
□ File type validation (only allowed extensions)
□ Malware scanning for uploaded files (ClamAV or similar)
□ Rate limiting on upload endpoints (prevent abuse)
□ User consent flow implemented and tested
□ Privacy Policy updated with Gemini disclosure
□ GDPR data export includes Gemini insights
□ GDPR deletion removes Gemini files
□ Encryption in transit (HTTPS) verified
□ Encryption at rest for temporary files
□ Automatic file cleanup tested (30-day deletion)
□ Access controls: Only room participants can query documents
□ Audit logging for all Gemini API calls
□ Error handling: Never expose Gemini API responses to users
□ Cost monitoring alerts (<$10/day)
```

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-17  
**Author**: Claude (Anthropic)  
**For**: Meedi8 Platform  

---
