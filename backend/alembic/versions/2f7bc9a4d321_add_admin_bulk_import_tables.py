"""add admin bulk import tables

Revision ID: 2f7bc9a4d321
Revises: e694bcc659db
Create Date: 2026-03-20 19:20:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "2f7bc9a4d321"
down_revision: Union[str, Sequence[str], None] = "e694bcc659db"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "import_batches",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_by", sa.String(length=120), nullable=False),
        sa.Column("default_process_id", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["default_process_id"], ["admission_processes.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_import_batches_created_at", "import_batches", ["created_at"], unique=False
    )
    op.create_index(
        "ix_import_batches_created_by", "import_batches", ["created_by"], unique=False
    )

    op.create_table(
        "import_source_files",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("s3_bucket", sa.String(length=180), nullable=False),
        sa.Column("s3_object_key", sa.String(length=512), nullable=False),
        sa.Column("original_filename", sa.String(length=255), nullable=False),
        sa.Column("content_type", sa.String(length=120), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("checksum_sha256", sa.String(length=64), nullable=False),
        sa.Column("admission_process_id", sa.Integer(), nullable=False),
        sa.Column("major_id", sa.Integer(), nullable=False),
        sa.Column("uploaded_by", sa.String(length=120), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["admission_process_id"], ["admission_processes.id"], ondelete="RESTRICT"
        ),
        sa.ForeignKeyConstraint(["major_id"], ["majors.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("s3_object_key"),
    )
    op.create_index(
        "ix_import_source_files_process_major",
        "import_source_files",
        ["admission_process_id", "major_id"],
        unique=False,
    )
    op.create_index(
        "ix_import_source_files_uploaded_by",
        "import_source_files",
        ["uploaded_by"],
        unique=False,
    )

    op.create_table(
        "import_batch_items",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("batch_id", sa.Integer(), nullable=False),
        sa.Column("source_file_id", sa.Integer(), nullable=False),
        sa.Column("process_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("failure_reason", sa.Text(), nullable=True),
        sa.Column("total_rows", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("imported_rows", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("failed_rows", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("error_payload", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["batch_id"], ["import_batches.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["process_id"], ["admission_processes.id"], ondelete="RESTRICT"
        ),
        sa.ForeignKeyConstraint(
            ["source_file_id"], ["import_source_files.id"], ondelete="RESTRICT"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_import_batch_items_batch_id",
        "import_batch_items",
        ["batch_id"],
        unique=False,
    )
    op.create_index(
        "ix_import_batch_items_process_id",
        "import_batch_items",
        ["process_id"],
        unique=False,
    )
    op.create_index(
        "ix_import_batch_items_status", "import_batch_items", ["status"], unique=False
    )


def downgrade() -> None:
    op.drop_index("ix_import_batch_items_status", table_name="import_batch_items")
    op.drop_index("ix_import_batch_items_process_id", table_name="import_batch_items")
    op.drop_index("ix_import_batch_items_batch_id", table_name="import_batch_items")
    op.drop_table("import_batch_items")

    op.drop_index(
        "ix_import_source_files_uploaded_by", table_name="import_source_files"
    )
    op.drop_index(
        "ix_import_source_files_process_major", table_name="import_source_files"
    )
    op.drop_table("import_source_files")

    op.drop_index("ix_import_batches_created_by", table_name="import_batches")
    op.drop_index("ix_import_batches_created_at", table_name="import_batches")
    op.drop_table("import_batches")
