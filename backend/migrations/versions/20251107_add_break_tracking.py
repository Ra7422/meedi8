"""add break tracking to rooms

Revision ID: add_break_tracking
Revises: add_profile_picture_url
Create Date: 2025-11-07
"""
from alembic import op
import sqlalchemy as sa

revision = 'add_break_tracking'
down_revision = 'add_profile_picture_url'
branch_labels = None
depends_on = None

def upgrade():
    # For SQLite, we just add columns without foreign key constraints
    # Production PostgreSQL will use declarative models which include FKs
    op.add_column('rooms', sa.Column('break_requested_by_id', sa.Integer(), nullable=True))
    op.add_column('rooms', sa.Column('break_requested_at', sa.DateTime(timezone=True), nullable=True))

def downgrade():
    op.drop_column('rooms', 'break_requested_at')
    op.drop_column('rooms', 'break_requested_by_id')
