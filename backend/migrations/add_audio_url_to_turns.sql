-- Add audio_url column to turns table for voice message playback
-- Migration: add_audio_url_to_turns
-- Created: 2025-11-05

ALTER TABLE turns ADD COLUMN IF NOT EXISTS audio_url VARCHAR(500);

-- Add index for faster queries on voice messages
CREATE INDEX IF NOT EXISTS idx_turns_audio_url ON turns(audio_url) WHERE audio_url IS NOT NULL;
