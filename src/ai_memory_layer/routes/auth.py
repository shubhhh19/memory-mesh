"""Authentication routes."""

from __future__ import annotations

from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from ai_memory_layer.database import get_session
from ai_memory_layer.models.user import UserRole
from ai_memory_layer.schemas.auth import (
    APIKeyCreate,
    APIKeyListResponse,
    APIKeyResponse,
    LoginRequest,
    PasswordChange,
    Token,
    UserCreate,
    UserResponse,
    UserUpdate,
)
from ai_memory_layer.security import get_current_active_user, get_current_user
from ai_memory_layer.services.auth_service import ACCESS_TOKEN_EXPIRE_MINUTES, AuthService, create_access_token, create_refresh_token

router = APIRouter(prefix="/auth", tags=["authentication"])
auth_service = AuthService()
bearer_scheme = HTTPBearer()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    request: Request,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> UserResponse:
    """Register a new user. Rate limited by global middleware (5/minute recommended)."""
    """Register a new user."""
    user = await auth_service.create_user(
        session=session,
        email=user_data.email,
        username=user_data.username,
        password=user_data.password,
        full_name=user_data.full_name,
        tenant_id=user_data.tenant_id,
    )
    return UserResponse.model_validate(user)


@router.post("/login", response_model=Token)
async def login(
    login_data: LoginRequest,
    request: Request,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> Token:
    """Authenticate user and return JWT tokens. Rate limited by global middleware (10/minute recommended)."""
    """Authenticate user and return JWT tokens."""
    user = await auth_service.authenticate_user(
        session=session,
        email=login_data.email,
        username=login_data.username,
        password=login_data.password,
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create tokens
    expires_delta = timedelta(days=30) if login_data.remember_me else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "username": user.username,
        "role": user.role.value,
        "tenant_id": user.tenant_id or "",
    }
    
    access_token = create_access_token(data=token_data, expires_delta=expires_delta)
    refresh_token = create_refresh_token(data=token_data)
    
    # Create session
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    await auth_service.create_session(
        session=session,
        user_id=user.id,
        token=refresh_token,
        ip_address=ip_address,
        user_agent=user_agent,
        expires_delta=timedelta(days=7),
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=int(expires_delta.total_seconds()),
        refresh_token=refresh_token,
    )


@router.post("/refresh", response_model=Token)
async def refresh_token(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> Token:
    """Refresh access token using refresh token."""
    from ai_memory_layer.services.auth_service import verify_token
    
    token = credentials.credentials
    token_data = verify_token(token)
    
    if not token_data.user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )
    
    # Verify session exists
    user_session = await auth_service.get_session(session, token)
    if not user_session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session not found or expired",
        )
    
    # Get user
    user = await auth_service.get_user_by_id(session, token_data.user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    
    # Create new tokens
    new_token_data = {
        "sub": str(user.id),
        "email": user.email,
        "username": user.username,
        "role": user.role.value,
        "tenant_id": user.tenant_id or "",
    }
    
    access_token = create_access_token(data=new_token_data)
    new_refresh_token = create_refresh_token(data=new_token_data)
    
    # Update session
    await auth_service.delete_session(session, token)
    await auth_service.create_session(
        session=session,
        user_id=user.id,
        token=new_refresh_token,
        ip_address=user_session.ip_address,
        user_agent=user_session.user_agent,
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        refresh_token=new_refresh_token,
    )


@router.post("/logout")
async def logout(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict[str, str]:
    """Logout user by invalidating refresh token."""
    token = credentials.credentials
    await auth_service.delete_session(session, token)
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> UserResponse:
    """Get current authenticated user information."""
    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> UserResponse:
    """Update current user information."""
    update_data = user_update.model_dump(exclude_unset=True)
    
    # Don't allow role changes via self-update
    if "role" in update_data:
        del update_data["role"]
    
    for key, value in update_data.items():
        if value is not None:
            setattr(current_user, key, value)
    
    await session.commit()
    await session.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.post("/change-password")
async def change_password(
    password_data: PasswordChange,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict[str, str]:
    """Change user password."""
    from ai_memory_layer.services.auth_service import verify_password, get_password_hash
    
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    
    current_user.hashed_password = get_password_hash(password_data.new_password)
    await session.commit()
    
    return {"message": "Password changed successfully"}


@router.post("/api-keys", response_model=APIKeyResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    api_key_data: APIKeyCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> APIKeyResponse:
    """Create a new API key for the current user."""
    api_key_obj, key = await auth_service.create_api_key(
        session=session,
        user_id=current_user.id,
        name=api_key_data.name,
        expires_days=api_key_data.expires_days,
    )
    
    return APIKeyResponse(
        id=api_key_obj.id,
        name=api_key_obj.name,
        key=key,
        last_used=api_key_obj.last_used,
        expires_at=api_key_obj.expires_at,
        is_active=api_key_obj.is_active,
        created_at=api_key_obj.created_at,
    )


@router.get("/api-keys", response_model=list[APIKeyListResponse])
async def list_api_keys(
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[APIKeyListResponse]:
    """List all API keys for the current user."""
    from sqlalchemy import select
    from ai_memory_layer.models.user import APIKey
    
    stmt = select(APIKey).where(APIKey.user_id == current_user.id).order_by(APIKey.created_at.desc())
    result = await session.execute(stmt)
    api_keys = result.scalars().all()
    
    return [APIKeyListResponse.model_validate(key) for key in api_keys]


@router.delete("/api-keys/{api_key_id}")
async def delete_api_key(
    api_key_id: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict[str, str]:
    """Delete an API key."""
    from sqlalchemy import select
    from uuid import UUID
    from ai_memory_layer.models.user import APIKey
    
    try:
        key_uuid = UUID(api_key_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid API key ID")
    
    stmt = select(APIKey).where(APIKey.id == key_uuid, APIKey.user_id == current_user.id)
    result = await session.execute(stmt)
    api_key = result.scalar_one_or_none()
    
    if not api_key:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API key not found")
    
    await session.delete(api_key)
    await session.commit()
    
    return {"message": "API key deleted successfully"}

