"""Initial schema — PostGIS extensions, all tables, spatial indexes

Revision ID: 0001_initial
Revises: 
Create Date: 2026-11-05
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB
import geoalchemy2

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Enable PostGIS extensions
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis;")
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')

    # 1. Users table
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(150), nullable=False),
        sa.Column("phone_number", sa.String(30), nullable=True),
        sa.Column("role", sa.String(30), nullable=False, server_default="citizen"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("idx_users_email", "users", ["email"])

    # 2. Road segments table
    op.create_table(
        "road_segments",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("osm_way_id", sa.BigInteger, unique=True, nullable=True),
        sa.Column("road_name", sa.String(255), nullable=False, server_default="Unnamed Road"),
        sa.Column("road_class", sa.String(50), nullable=False),
        sa.Column("speed_limit_kmh", sa.Integer, server_default="50"),
        sa.Column("adt_volume", sa.Integer, server_default="1500"),
        sa.Column("is_sensitive_zone", sa.Boolean, server_default="false"),
        sa.Column("region", sa.String(100), server_default="kerala"),
        sa.Column(
            "geom",
            geoalchemy2.types.Geometry("MULTILINESTRING", srid=4326),
            nullable=False,
        ),
    )
    op.create_index("idx_road_segments_geom", "road_segments", ["geom"], postgresql_using="gist")
    op.create_index("idx_road_segments_region", "road_segments", ["region"])

    # 3. Defect complaints table
    op.create_table(
        "defect_complaints",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("ticket_id", sa.String(50), unique=True, nullable=False),
        sa.Column("citizen_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("citizen_email", sa.String(255), nullable=False),
        sa.Column("raw_lat", sa.Float, nullable=False),
        sa.Column("raw_lon", sa.Float, nullable=False),
        sa.Column("snapped_point", geoalchemy2.types.Geometry("POINT", srid=4326), nullable=True),
        sa.Column("road_segment_id", UUID(as_uuid=True), sa.ForeignKey("road_segments.id", ondelete="CASCADE"), nullable=True),
        # Admin snap override
        sa.Column("snap_radius_override_m", sa.Float, nullable=True),
        sa.Column("snap_override_by", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("snap_override_at", sa.DateTime(timezone=True), nullable=True),
        # Media
        sa.Column("media_url", sa.Text, nullable=False),
        sa.Column("media_type", sa.String(20), server_default="image"),
        # ML results
        sa.Column("defect_type", sa.String(50), nullable=True),
        sa.Column("severity_area_sqm", sa.Float, server_default="0.0"),
        sa.Column("severity_depth_cm", sa.Float, server_default="0.0"),
        sa.Column("uncertainty_score", sa.Float, server_default="0.0"),
        sa.Column("priority_score", sa.Float, server_default="0.0"),
        # Status & deduplication
        sa.Column("status", sa.String(50), server_default="SUBMITTED"),
        sa.Column("upvote_count", sa.Integer, server_default="1"),
        sa.Column("cluster_id", UUID(as_uuid=True), nullable=True),
        # Post-repair
        sa.Column("post_repair_media_url", sa.Text, nullable=True),
        sa.Column("repair_notes", sa.Text, nullable=True),
        # Timestamps
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("resolution_email_sent_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("idx_defect_geom", "defect_complaints", ["snapped_point"], postgresql_using="gist")
    op.create_index("idx_defect_ticket", "defect_complaints", ["ticket_id"])
    op.create_index("idx_defect_status", "defect_complaints", ["status"])
    op.create_index("idx_defect_road_segment", "defect_complaints", ["road_segment_id"])

    # 4. Work orders table
    op.create_table(
        "work_orders",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("order_id", sa.String(50), unique=True, nullable=False),
        sa.Column("complaint_id", UUID(as_uuid=True), sa.ForeignKey("defect_complaints.id", ondelete="CASCADE")),
        sa.Column("assigned_by", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("assigned_to_depot", sa.String(255), nullable=True),
        sa.Column("status", sa.String(50), server_default="SCHEDULED"),
        sa.Column("technician_lat", sa.Float, nullable=True),
        sa.Column("technician_lon", sa.Float, nullable=True),
        sa.Column("location_verified", sa.String(10), nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )

    # 5. Geotechnical profiles table
    op.create_table(
        "geotech_profiles",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("road_segment_id", UUID(as_uuid=True), sa.ForeignKey("road_segments.id", ondelete="CASCADE"), unique=True),
        sa.Column("elevation_m", sa.Float, nullable=True),
        sa.Column("slope_percentage", sa.Float, nullable=True),
        sa.Column("soil_texture", sa.String(100), nullable=True),
        sa.Column("clay_percent", sa.Float, nullable=True),
        sa.Column("silt_percent", sa.Float, nullable=True),
        sa.Column("sand_percent", sa.Float, nullable=True),
        sa.Column("cbr_estimate", sa.Float, nullable=True),
        sa.Column("water_retention_capacity", sa.String(50), nullable=True),
        sa.Column("groundwater_table_m", sa.Float, nullable=True),
        sa.Column("soil_moisture_index", sa.Float, nullable=True),
        sa.Column("ai_advisory_payload", JSONB, nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("geotech_profiles")
    op.drop_table("work_orders")
    op.drop_index("idx_defect_road_segment", table_name="defect_complaints")
    op.drop_index("idx_defect_status", table_name="defect_complaints")
    op.drop_index("idx_defect_ticket", table_name="defect_complaints")
    op.drop_index("idx_defect_geom", table_name="defect_complaints")
    op.drop_table("defect_complaints")
    op.drop_index("idx_road_segments_region", table_name="road_segments")
    op.drop_index("idx_road_segments_geom", table_name="road_segments")
    op.drop_table("road_segments")
    op.drop_index("idx_users_email", table_name="users")
    op.drop_table("users")

