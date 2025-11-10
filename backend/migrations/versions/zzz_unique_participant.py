"""unique participant per room"""
from alembic import op

revision = "zzz_unique_participant"
down_revision = "4ccaa49233bc"
branch_labels = None
depends_on = None

def upgrade():
    op.create_unique_constraint(
        "uq_room_participant",
        "room_participants",
        ["room_id", "user_id"],
    )

def downgrade():
    op.drop_constraint("uq_room_participant", "room_participants", type_="unique")
