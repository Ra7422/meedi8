"""add breathing break columns to rooms

Revision ID: add_breathing_breaks
Revises: 6e6326293b4b
Create Date: 2025-11-10 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_breathing_breaks'
down_revision: Union[str, Sequence[str], None] = '6e6326293b4b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add breathing break tracking columns to rooms table."""
    op.add_column('rooms', sa.Column('breathing_break_count', sa.Integer(), server_default='0', nullable=False))
    op.add_column('rooms', sa.Column('last_breathing_break_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    """Remove breathing break tracking columns from rooms table."""
    op.drop_column('rooms', 'last_breathing_break_at')
    op.drop_column('rooms', 'breathing_break_count')
