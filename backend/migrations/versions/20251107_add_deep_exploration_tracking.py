"""add deep exploration tracking

Revision ID: add_deep_exploration
Revises: add_break_tracking
Create Date: 2025-11-07
"""
from alembic import op
import sqlalchemy as sa

revision = 'add_deep_exploration'
down_revision = 'add_break_tracking'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('rooms', sa.Column('last_speaker_id', sa.Integer(), nullable=True))
    op.add_column('rooms', sa.Column('consecutive_questions_to_same', sa.Integer(), server_default='0', nullable=False))

def downgrade():
    op.drop_column('rooms', 'consecutive_questions_to_same')
    op.drop_column('rooms', 'last_speaker_id')
