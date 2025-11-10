"""add has_completed_screening to users

Revision ID: add_screening_flag
Revises: fix_tags_type
Create Date: 2025-11-10 00:00:03.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_screening_flag'
down_revision: Union[str, Sequence[str], None] = 'fix_tags_type'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add has_completed_screening column to users table."""
    op.add_column('users', sa.Column('has_completed_screening', sa.Boolean(), server_default='0', nullable=False))


def downgrade() -> None:
    """Remove has_completed_screening column from users table."""
    op.drop_column('users', 'has_completed_screening')
