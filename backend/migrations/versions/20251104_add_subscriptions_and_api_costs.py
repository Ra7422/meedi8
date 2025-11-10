"""add subscriptions and api costs

Revision ID: add_subscriptions_and_api_costs
Revises: add_turn_tracking_columns
Create Date: 2025-11-04
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'add_subscriptions_and_api_costs'
down_revision = 'add_turn_tracking_columns'
branch_labels = None
depends_on = None

def upgrade():
    # Create subscription tier and status enums
    subscription_tier_enum = postgresql.ENUM('free', 'plus', 'pro', name='subscriptiontier', create_type=False)
    subscription_tier_enum.create(op.get_bind(), checkfirst=True)

    subscription_status_enum = postgresql.ENUM('active', 'cancelled', 'expired', 'trial', name='subscriptionstatus', create_type=False)
    subscription_status_enum.create(op.get_bind(), checkfirst=True)

    # Add is_admin column to users
    op.add_column('users', sa.Column('is_admin', sa.Integer(), nullable=False, server_default='0'))

    # Create subscriptions table
    op.create_table(
        'subscriptions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('tier', subscription_tier_enum, nullable=False, server_default='free'),
        sa.Column('status', subscription_status_enum, nullable=False, server_default='trial'),
        sa.Column('start_date', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('end_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column('voice_conversations_used', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('voice_conversations_limit', sa.Integer(), nullable=False, server_default='1'),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index(op.f('ix_subscriptions_id'), 'subscriptions', ['id'], unique=False)

    # Create api_costs table for tracking all API usage
    op.create_table(
        'api_costs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('room_id', sa.Integer(), nullable=True),
        sa.Column('turn_id', sa.Integer(), nullable=True),
        sa.Column('service_type', sa.String(50), nullable=False),
        sa.Column('input_tokens', sa.Integer(), server_default='0'),
        sa.Column('output_tokens', sa.Integer(), server_default='0'),
        sa.Column('audio_seconds', sa.Numeric(10, 2), server_default='0.0'),
        sa.Column('cost_usd', sa.Numeric(10, 6), nullable=False),
        sa.Column('model', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['room_id'], ['rooms.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['turn_id'], ['turns.id'], ondelete='CASCADE')
    )
    op.create_index(op.f('ix_api_costs_id'), 'api_costs', ['id'], unique=False)
    op.create_index(op.f('ix_api_costs_service_type'), 'api_costs', ['service_type'], unique=False)
    op.create_index(op.f('ix_api_costs_created_at'), 'api_costs', ['created_at'], unique=False)

    # Create a default free subscription for all existing users
    op.execute("""
        INSERT INTO subscriptions (user_id, tier, status, voice_conversations_used, voice_conversations_limit)
        SELECT id, 'free', 'trial', 0, 1 FROM users
        ON CONFLICT (user_id) DO NOTHING
    """)

def downgrade():
    op.drop_index(op.f('ix_api_costs_created_at'), table_name='api_costs')
    op.drop_index(op.f('ix_api_costs_service_type'), table_name='api_costs')
    op.drop_index(op.f('ix_api_costs_id'), table_name='api_costs')
    op.drop_table('api_costs')

    op.drop_index(op.f('ix_subscriptions_id'), table_name='subscriptions')
    op.drop_table('subscriptions')

    op.drop_column('users', 'is_admin')

    # Drop enums
    sa.Enum(name='subscriptiontier').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='subscriptionstatus').drop(op.get_bind(), checkfirst=True)
