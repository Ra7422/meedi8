# Gemini RAG API Investigation

## Current Status: NOT WORKING

The Gemini File Search (RAG) integration is currently broken due to API incompatibility.

### Error
```
AttributeError: module 'google.generativeai' has no attribute 'create_corpus'
```

### What Was Attempted
- Using `genai.create_corpus()` and `genai.create_document()` for persistent file storage
- Based on Gemini File Search documentation (https://ai.google.dev/gemini-api/docs/file-search)
- Goal: Store Telegram conversation history in Gemini's free 1TB storage with automatic chunking/indexing

### Issues Found
1. **API Method Not Available**: `create_corpus()` doesn't exist in the installed `google-generativeai` package
2. **Version Mismatch**: Railway is using Python 3.9.25 (EOL), Gemini recommends Python 3.10+
3. **Missing Schema**: Turn model doesn't have `metadata` or `text` fields needed to store analysis results

### Workaround Applied
- Temporarily disabled Gemini analysis in both endpoints:
  - `/rooms/{room_id}/coach/telegram-import` (backend/app/routes/rooms.py:2172)
  - `/rooms/{room_id}/main-room/telegram-import` (backend/app/routes/rooms.py:2305)
- Telegram messages ARE downloading successfully and stored in `telegram_messages` table
- Turn created with summary only (no Gemini analysis)

### Next Steps to Fix
1. **Update Python Version**: Upgrade Railway to Python 3.10+
2. **Update Gemini SDK**: Check for latest `google-generativeai` version
3. **Verify API Methods**: Test if `create_corpus()` exists in newer versions
4. **Add Database Fields**:
   - Add `metadata` JSON field to `turns` table for storing Gemini analysis
   - OR create separate `telegram_analysis` table with foreign key to `telegram_downloads`
5. **Alternative Approach**: Use simple `generate_content()` with file upload instead of corpus API

### Files Involved
- `backend/app/services/gemini_rag_service.py` - Service attempting to use corpus API
- `backend/app/routes/rooms.py` - Endpoints creating Turn records
- `backend/app/models/room.py` - Turn model definition
- `backend/app/models/telegram.py` - TelegramDownload model (has gemini_corpus_id field added)

### Telegram Data Location
All downloaded messages are in PostgreSQL:
- Table: `telegram_messages`
- Fields: `download_id`, `sender_id`, `sender_name`, `date`, `text`, `has_media`, etc.
- Query example: `SELECT * FROM telegram_messages WHERE download_id = 38 ORDER BY date ASC;`

### Cost Impact
- Message download: FREE (Telethon uses your own Telegram account)
- Gemini File Search: FREE (up to 1TB storage)
- Gemini analysis: ~$0.004 per conversation (when working)
