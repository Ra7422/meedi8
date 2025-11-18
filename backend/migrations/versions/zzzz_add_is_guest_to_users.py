"""add is_guest to users

Revision ID: zzzz_add_is_guest
Revises:
Create Date: 2025-11-18

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'zzzz_add_is_guest'
down_revision = 'zzz_unique_participant'
branch_labels = None
depends_on = None


def upgrade():
    # Add is_guest column to users table
    op.add_column('users', sa.Column('is_guest', sa.Boolean(), nullable=False, server_default=sa.false()))


def downgrade():
    # Remove is_guest column from users table
    op.drop_column('users', 'is_guest')
