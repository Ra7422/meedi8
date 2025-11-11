"""add attachment fields to turns

Revision ID: add_attachments
Revises: add_solo_mode
Create Date: 2025-11-11 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'add_attachments'
down_revision: Union[str, Sequence[str], None] = 'add_solo_mode'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add attachment fields to turns table for file uploads visible to all users."""
    op.add_column('turns', sa.Column('attachment_url', sa.String(length=500), nullable=True))
    op.add_column('turns', sa.Column('attachment_filename', sa.String(length=255), nullable=True))


def downgrade() -> None:
    """Remove attachment fields from turns table."""
    op.drop_column('turns', 'attachment_filename')
    op.drop_column('turns', 'attachment_url')
