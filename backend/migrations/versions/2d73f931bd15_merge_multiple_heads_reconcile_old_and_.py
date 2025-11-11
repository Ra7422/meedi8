"""Merge multiple heads: reconcile old and new migration paths

Revision ID: 2d73f931bd15
Revises: 4a31d56e5a87, b6133fb09084
Create Date: 2025-11-11 11:04:26.077841

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2d73f931bd15'
down_revision: Union[str, Sequence[str], None] = ('4a31d56e5a87', 'b6133fb09084')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
