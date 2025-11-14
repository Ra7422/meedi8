"""add telegram integration tables

Revision ID: 8627c758cba0
Revises: 21ab3ff7a9d9
Create Date: 2025-11-14 19:36:12.109510

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8627c758cba0'
down_revision: Union[str, Sequence[str], None] = '21ab3ff7a9d9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create telegram_sessions table
    op.create_table(
        'telegram_sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('encrypted_session', sa.Text(), nullable=False),
        sa.Column('phone_number', sa.String(length=20), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('last_used_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )

    # Create telegram_downloads table
    op.create_table(
        'telegram_downloads',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('session_id', sa.Integer(), nullable=False),
        sa.Column('chat_id', sa.BigInteger(), nullable=False),
        sa.Column('chat_name', sa.String(length=255), nullable=True),
        sa.Column('chat_type', sa.String(length=50), nullable=True),
        sa.Column('start_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('end_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('message_count', sa.Integer(), server_default='0', nullable=True),
        sa.Column('media_count', sa.Integer(), server_default='0', nullable=True),
        sa.Column('status', sa.String(length=50), server_default='pending', nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('transcript_url', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('api_cost_usd', sa.Numeric(10, 6), server_default='0.00', nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['session_id'], ['telegram_sessions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create telegram_messages table
    op.create_table(
        'telegram_messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('download_id', sa.Integer(), nullable=False),
        sa.Column('message_id', sa.BigInteger(), nullable=False),
        sa.Column('sender_id', sa.BigInteger(), nullable=False),
        sa.Column('sender_name', sa.String(length=255), nullable=True),
        sa.Column('date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('text', sa.Text(), nullable=True),
        sa.Column('reply_to_message_id', sa.BigInteger(), nullable=True),
        sa.Column('has_media', sa.Boolean(), server_default='false', nullable=True),
        sa.Column('media_type', sa.String(length=50), nullable=True),
        sa.Column('media_url', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['download_id'], ['telegram_downloads.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes
    op.create_index('idx_telegram_messages_download_date', 'telegram_messages', ['download_id', 'date'])
    op.create_index('idx_telegram_messages_sender', 'telegram_messages', ['download_id', 'sender_id'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('idx_telegram_messages_sender', table_name='telegram_messages')
    op.drop_index('idx_telegram_messages_download_date', table_name='telegram_messages')
    op.drop_table('telegram_messages')
    op.drop_table('telegram_downloads')
    op.drop_table('telegram_sessions')
