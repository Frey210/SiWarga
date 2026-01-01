"""add announcements table

Revision ID: 0002_announcements
Revises: 0001_initial
Create Date: 2026-01-01 10:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "0002_announcements"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


announcement_status_enum = sa.Enum(
    "DRAFT",
    "PUBLISHED",
    "ARCHIVED",
    name="announcementstatusenum",
)


def upgrade() -> None:
    bind = op.get_bind()
    announcement_status_enum.create(bind, checkfirst=True)

    op.create_table(
        "announcements",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("slug", sa.String(length=160), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("excerpt", sa.Text(), nullable=True),
        sa.Column("category", sa.String(length=120), nullable=True),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("status", announcement_status_enum, nullable=False),
        sa.Column("cover_original_name", sa.String(length=255), nullable=True),
        sa.Column("cover_stored_name", sa.String(length=255), nullable=True),
        sa.Column("cover_mime_type", sa.String(length=255), nullable=True),
        sa.Column("cover_size_bytes", sa.Integer(), nullable=True),
        sa.Column("cover_focus", sa.String(length=32), nullable=False),
        sa.Column("author_user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("published_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("slug"),
        sa.UniqueConstraint("cover_stored_name"),
    )
    op.create_index("ix_announcements_slug", "announcements", ["slug"])


def downgrade() -> None:
    op.drop_index("ix_announcements_slug", table_name="announcements")
    op.drop_table("announcements")
    bind = op.get_bind()
    announcement_status_enum.drop(bind, checkfirst=True)
