"""add audio_url to turns

Revision ID: add_audio_url
Revises: add_breathing_breaks
Create Date: 2025-11-10 00:00:01.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_audio_url'
down_revision: Union[str, Sequence[str], None] = 'add_breathing_breaks'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add audio_url column to turns table for voice message storage."""
    op.add_column('turns', sa.Column('audio_url', sa.String(length=500), nullable=True))


def downgrade() -> None:
    """Remove audio_url column from turns table."""
    op.drop_column('turns', 'audio_url')
