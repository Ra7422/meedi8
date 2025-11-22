"""Add gamification tables

Revision ID: def16f58442b
Revises: dc764a968e2d
Create Date: 2025-11-22 10:19:14.315158

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'def16f58442b'
down_revision: Union[str, Sequence[str], None] = 'dc764a968e2d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Make migration idempotent by checking existing tables
    from sqlalchemy import inspect
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()

    if 'achievements' not in existing_tables:
        op.create_table('achievements',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('code', sa.String(length=50), nullable=False),
            sa.Column('name', sa.String(length=100), nullable=False),
            sa.Column('description', sa.String(length=500), nullable=False),
            sa.Column('icon', sa.String(length=50), nullable=False),
            sa.Column('category', sa.String(length=50), nullable=False),
            sa.Column('criteria', sa.JSON(), nullable=False),
            sa.Column('xp_reward', sa.Integer(), nullable=False),
            sa.Column('rarity', sa.String(length=20), nullable=False),
            sa.Column('sort_order', sa.Integer(), nullable=False),
            sa.Column('is_hidden', sa.Boolean(), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_achievements_code'), 'achievements', ['code'], unique=True)
        op.create_index(op.f('ix_achievements_id'), 'achievements', ['id'], unique=False)

    if 'daily_challenges' not in existing_tables:
        op.create_table('daily_challenges',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('code', sa.String(length=50), nullable=False),
            sa.Column('title', sa.String(length=100), nullable=False),
            sa.Column('description', sa.String(length=500), nullable=False),
            sa.Column('challenge_type', sa.String(length=20), nullable=False),
            sa.Column('requirements', sa.JSON(), nullable=False),
            sa.Column('score_reward', sa.Integer(), nullable=False),
            sa.Column('is_active', sa.Boolean(), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_daily_challenges_code'), 'daily_challenges', ['code'], unique=True)
        op.create_index(op.f('ix_daily_challenges_id'), 'daily_challenges', ['id'], unique=False)

    if 'breathing_sessions' not in existing_tables:
        op.create_table('breathing_sessions',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('mode', sa.String(length=20), nullable=False),
            sa.Column('cycles_completed', sa.Integer(), nullable=False),
            sa.Column('duration_seconds', sa.Integer(), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_breathing_sessions_created_at'), 'breathing_sessions', ['created_at'], unique=False)
        op.create_index(op.f('ix_breathing_sessions_id'), 'breathing_sessions', ['id'], unique=False)
        op.create_index(op.f('ix_breathing_sessions_user_id'), 'breathing_sessions', ['user_id'], unique=False)

    if 'conversion_events' not in existing_tables:
        op.create_table('conversion_events',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('trigger_type', sa.String(length=50), nullable=False),
            sa.Column('trigger_value', sa.Integer(), nullable=True),
            sa.Column('offer_type', sa.String(length=50), nullable=True),
            sa.Column('shown_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
            sa.Column('converted', sa.Boolean(), nullable=False),
            sa.Column('converted_at', sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_conversion_events_id'), 'conversion_events', ['id'], unique=False)
        op.create_index(op.f('ix_conversion_events_user_id'), 'conversion_events', ['user_id'], unique=False)

    if 'emotional_checkins' not in existing_tables:
        op.create_table('emotional_checkins',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('mood', sa.String(length=30), nullable=False),
            sa.Column('energy_level', sa.Integer(), nullable=True),
            sa.Column('note', sa.String(length=500), nullable=True),
            sa.Column('context', sa.String(length=50), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_emotional_checkins_created_at'), 'emotional_checkins', ['created_at'], unique=False)
        op.create_index(op.f('ix_emotional_checkins_id'), 'emotional_checkins', ['id'], unique=False)
        op.create_index(op.f('ix_emotional_checkins_user_id'), 'emotional_checkins', ['user_id'], unique=False)

    if 'gratitude_entries' not in existing_tables:
        op.create_table('gratitude_entries',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('content', sa.Text(), nullable=False),
            sa.Column('prompt', sa.String(length=255), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_gratitude_entries_created_at'), 'gratitude_entries', ['created_at'], unique=False)
        op.create_index(op.f('ix_gratitude_entries_id'), 'gratitude_entries', ['id'], unique=False)
        op.create_index(op.f('ix_gratitude_entries_user_id'), 'gratitude_entries', ['user_id'], unique=False)

    if 'score_events' not in existing_tables:
        op.create_table('score_events',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('event_type', sa.String(length=50), nullable=False),
            sa.Column('score_change', sa.Integer(), nullable=False),
            sa.Column('score_before', sa.Integer(), nullable=False),
            sa.Column('score_after', sa.Integer(), nullable=False),
            sa.Column('description', sa.String(length=255), nullable=True),
            sa.Column('event_metadata', sa.JSON(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_score_events_created_at'), 'score_events', ['created_at'], unique=False)
        op.create_index(op.f('ix_score_events_id'), 'score_events', ['id'], unique=False)
        op.create_index(op.f('ix_score_events_user_id'), 'score_events', ['user_id'], unique=False)

    if 'user_achievements' not in existing_tables:
        op.create_table('user_achievements',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('achievement_id', sa.Integer(), nullable=False),
            sa.Column('unlocked_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
            sa.Column('claimed_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('progress', sa.Integer(), nullable=False),
            sa.ForeignKeyConstraint(['achievement_id'], ['achievements.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('user_id', 'achievement_id', name='uq_user_achievement')
        )
        op.create_index(op.f('ix_user_achievements_achievement_id'), 'user_achievements', ['achievement_id'], unique=False)
        op.create_index(op.f('ix_user_achievements_id'), 'user_achievements', ['id'], unique=False)
        op.create_index(op.f('ix_user_achievements_user_id'), 'user_achievements', ['user_id'], unique=False)

    if 'user_daily_challenges' not in existing_tables:
        op.create_table('user_daily_challenges',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('challenge_id', sa.Integer(), nullable=False),
            sa.Column('assigned_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
            sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('progress', sa.Integer(), nullable=False),
            sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('claimed_at', sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(['challenge_id'], ['daily_challenges.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_user_daily_challenges_challenge_id'), 'user_daily_challenges', ['challenge_id'], unique=False)
        op.create_index(op.f('ix_user_daily_challenges_id'), 'user_daily_challenges', ['id'], unique=False)
        op.create_index(op.f('ix_user_daily_challenges_user_id'), 'user_daily_challenges', ['user_id'], unique=False)

    if 'user_progress' not in existing_tables:
        op.create_table('user_progress',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('health_score', sa.Integer(), nullable=False),
            sa.Column('health_tier', sa.String(length=20), nullable=False),
            sa.Column('highest_score', sa.Integer(), nullable=False),
            sa.Column('current_streak', sa.Integer(), nullable=False),
            sa.Column('longest_streak', sa.Integer(), nullable=False),
            sa.Column('streak_last_activity', sa.DateTime(timezone=True), nullable=True),
            sa.Column('streak_protected_until', sa.DateTime(timezone=True), nullable=True),
            sa.Column('total_breathing_sessions', sa.Integer(), nullable=False),
            sa.Column('total_breathing_minutes', sa.Integer(), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_user_progress_id'), 'user_progress', ['id'], unique=False)
        op.create_index(op.f('ix_user_progress_user_id'), 'user_progress', ['user_id'], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_user_progress_user_id'), table_name='user_progress')
    op.drop_index(op.f('ix_user_progress_id'), table_name='user_progress')
    op.drop_table('user_progress')
    op.drop_index(op.f('ix_user_daily_challenges_user_id'), table_name='user_daily_challenges')
    op.drop_index(op.f('ix_user_daily_challenges_id'), table_name='user_daily_challenges')
    op.drop_index(op.f('ix_user_daily_challenges_challenge_id'), table_name='user_daily_challenges')
    op.drop_table('user_daily_challenges')
    op.drop_index(op.f('ix_user_achievements_user_id'), table_name='user_achievements')
    op.drop_index(op.f('ix_user_achievements_id'), table_name='user_achievements')
    op.drop_index(op.f('ix_user_achievements_achievement_id'), table_name='user_achievements')
    op.drop_table('user_achievements')
    op.drop_index(op.f('ix_score_events_user_id'), table_name='score_events')
    op.drop_index(op.f('ix_score_events_id'), table_name='score_events')
    op.drop_index(op.f('ix_score_events_created_at'), table_name='score_events')
    op.drop_table('score_events')
    op.drop_index(op.f('ix_gratitude_entries_user_id'), table_name='gratitude_entries')
    op.drop_index(op.f('ix_gratitude_entries_id'), table_name='gratitude_entries')
    op.drop_index(op.f('ix_gratitude_entries_created_at'), table_name='gratitude_entries')
    op.drop_table('gratitude_entries')
    op.drop_index(op.f('ix_emotional_checkins_user_id'), table_name='emotional_checkins')
    op.drop_index(op.f('ix_emotional_checkins_id'), table_name='emotional_checkins')
    op.drop_index(op.f('ix_emotional_checkins_created_at'), table_name='emotional_checkins')
    op.drop_table('emotional_checkins')
    op.drop_index(op.f('ix_conversion_events_user_id'), table_name='conversion_events')
    op.drop_index(op.f('ix_conversion_events_id'), table_name='conversion_events')
    op.drop_table('conversion_events')
    op.drop_index(op.f('ix_breathing_sessions_user_id'), table_name='breathing_sessions')
    op.drop_index(op.f('ix_breathing_sessions_id'), table_name='breathing_sessions')
    op.drop_index(op.f('ix_breathing_sessions_created_at'), table_name='breathing_sessions')
    op.drop_table('breathing_sessions')
    op.drop_index(op.f('ix_daily_challenges_id'), table_name='daily_challenges')
    op.drop_index(op.f('ix_daily_challenges_code'), table_name='daily_challenges')
    op.drop_table('daily_challenges')
    op.drop_index(op.f('ix_achievements_id'), table_name='achievements')
    op.drop_index(op.f('ix_achievements_code'), table_name='achievements')
    op.drop_table('achievements')
