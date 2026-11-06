"""
Test Suite: Role-Based Routing & Authorization Isolation (Acceptance Criterion 1)
Verifies:
1. Password hashing and cryptographic verification.
2. Token generation and claims integrity.
3. Access control rejection for unauthenticated users (401).
4. Access control rejection for citizen role attempting admin routes (403).
5. Proper authority clearance for admin/inspector roles.
"""

import pytest
from datetime import timedelta
from fastapi import HTTPException

from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    decode_token,
    require_admin,
    require_citizen,
    ADMIN_ROLES,
)
from app.models.user import User


class MockUser:
    def __init__(self, id: str, role: str, email: str = "test@kerala.pwd"):
        self.id = id
        self.role = role
        self.email = email
        self.is_active = True


def test_password_hashing():
    raw = "PWD_Kerala_Secure_Pass@2026"
    hashed = hash_password(raw)
    assert hashed != raw
    assert verify_password(raw, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False


def test_token_creation_and_decoding():
    user_payload = {"sub": "user-uuid-123", "role": "admin", "email": "engineer@roadwatch.local"}
    token = create_access_token(user_payload, expires_delta=timedelta(minutes=15))
    decoded = decode_token(token)

    assert decoded["sub"] == "user-uuid-123"
    assert decoded["role"] == "admin"
    assert decoded["email"] == "engineer@roadwatch.local"
    assert "exp" in decoded


def test_invalid_token_decoding():
    with pytest.raises(HTTPException) as exc_info:
        decode_token("invalid.corrupted.token")
    assert exc_info.value.status_code == 401
    assert "Invalid or expired token" in exc_info.value.detail


def test_rbac_citizen_forbidden_from_admin():
    """Criterion 1: Logged-in citizens attempting to access admin routes must receive 403 Forbidden."""
    citizen = MockUser(id="citizen-001", role="citizen")
    with pytest.raises(HTTPException) as exc_info:
        require_admin(current_user=citizen)
    assert exc_info.value.status_code == 403
    assert "Admin privileges required" in exc_info.value.detail


def test_rbac_admin_allowed_on_admin():
    """Admin roles (admin, supervisor, inspector) must successfully pass require_admin."""
    for role in ADMIN_ROLES:
        admin_user = MockUser(id=f"{role}-001", role=role)
        result = require_admin(current_user=admin_user)
        assert result.role == role


def test_rbac_citizen_allowed_on_citizen():
    citizen = MockUser(id="citizen-002", role="citizen")
    result = require_citizen(current_user=citizen)
    assert result.role == "citizen"

