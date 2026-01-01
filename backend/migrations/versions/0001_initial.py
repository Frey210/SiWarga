"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2025-12-30 12:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


role_enum = sa.Enum("WARGA", "ADMIN_RW", name="roleenum", create_type=False)
status_enum = sa.Enum(
    "SUBMITTED",
    "IN_REVIEW",
    "NEED_REVISION",
    "APPROVED",
    "REJECTED",
    name="submissionstatusenum",
    create_type=False,
)
action_enum = sa.Enum(
    "SET_IN_REVIEW",
    "APPROVE",
    "REJECT",
    "REQUEST_REVISION",
    name="submissionactionenum",
    create_type=False,
)


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("role", role_enum, nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=True),
        sa.Column("phone_number", sa.String(length=50), nullable=True),
        sa.Column("nik", sa.String(length=16), nullable=True),
        sa.Column("kk_number", sa.String(length=16), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "submissions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("type", sa.String(length=100), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("status", status_enum, nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_submissions_user_id", "submissions", ["user_id"])

    op.create_table(
        "submission_files",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("submission_id", sa.Integer(), sa.ForeignKey("submissions.id"), nullable=False),
        sa.Column("document_type", sa.String(length=120), nullable=False),
        sa.Column("original_name", sa.String(length=255), nullable=False),
        sa.Column("stored_name", sa.String(length=255), nullable=False),
        sa.Column("mime_type", sa.String(length=255), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("stored_name"),
    )
    op.create_index("ix_submission_files_submission_id", "submission_files", ["submission_id"])

    op.create_table(
        "approval_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("submission_id", sa.Integer(), sa.ForeignKey("submissions.id"), nullable=False),
        sa.Column("actor_user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("action", action_enum, nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_approval_logs_submission_id", "approval_logs", ["submission_id"])


def downgrade() -> None:
    op.drop_index("ix_approval_logs_submission_id", table_name="approval_logs")
    op.drop_table("approval_logs")

    op.drop_index("ix_submission_files_submission_id", table_name="submission_files")
    op.drop_table("submission_files")

    op.drop_index("ix_submissions_user_id", table_name="submissions")
    op.drop_table("submissions")

    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
