"""fix tags column type from text array to json

Revision ID: fix_tags_type
Revises: add_audio_url
Create Date: 2025-11-10 00:00:02.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'fix_tags_type'
down_revision: Union[str, Sequence[str], None] = 'add_audio_url'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Change tags column from text[] to JSON type."""
    # Drop the old text[] column and recreate as JSON
    op.execute('ALTER TABLE turns ALTER COLUMN tags TYPE JSON USING tags::text::json')


def downgrade() -> None:
    """Change tags column back from JSON to text[] type."""
    op.execute('ALTER TABLE turns ALTER COLUMN tags TYPE text[] USING ARRAY[tags::text]')
