"""add gemini_corpus_id to telegram_downloads

Revision ID: add_gemini_corpus_id
Revises: 8627c758cba0
Create Date: 2025-11-17

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_gemini_corpus_id'
down_revision = '8627c758cba0'
branch_labels = None
depends_on = None


def upgrade():
    # Add gemini_corpus_id column to telegram_downloads table
    op.add_column('telegram_downloads', sa.Column('gemini_corpus_id', sa.String(500), nullable=True))


def downgrade():
    # Remove gemini_corpus_id column from telegram_downloads table
    op.drop_column('telegram_downloads', 'gemini_corpus_id')
