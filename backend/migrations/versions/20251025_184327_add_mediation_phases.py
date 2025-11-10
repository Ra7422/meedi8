"""add mediation phases

Revision ID: add_mediation_phases
Revises: 
Create Date: 2025-10-25
"""
from alembic import op
import sqlalchemy as sa

revision = 'add_mediation_phases'
down_revision = 'a1bc74e2b335'  # Points to last migration
branch_labels = None
depends_on = None

def upgrade():
    # Add phase column to rooms
    op.add_column('rooms', sa.Column('phase', sa.String(), nullable=False, server_default='user1_intake'))
    
    # Add invite_token column for sharing
    op.add_column('rooms', sa.Column('invite_token', sa.String(length=100), nullable=True))
    op.create_index('ix_rooms_invite_token', 'rooms', ['invite_token'], unique=True)
    
    # Add user1_summary and user2_summary for polished positions
    op.add_column('rooms', sa.Column('user1_summary', sa.Text(), nullable=True))
    op.add_column('rooms', sa.Column('user2_summary', sa.Text(), nullable=True))
    
    # Add context field to turns to distinguish pre-mediation vs main room
    op.add_column('turns', sa.Column('context', sa.String(), nullable=False, server_default='main'))

def downgrade():
    op.drop_column('rooms', 'phase')
    op.drop_index('ix_rooms_invite_token', 'rooms')
    op.drop_column('rooms', 'invite_token')
    op.drop_column('rooms', 'user1_summary')
    op.drop_column('rooms', 'user2_summary')
    op.drop_column('turns', 'context')
