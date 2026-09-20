from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials

from app.api.dependencies import bearer, current_user
from app.schemas.auth import AuthResponse, Credentials, SessionResponse, SignupRequest, UserPublic
from app.schemas.financial import FinancialProfile
from app.services import auth_store


router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


def _session_response(user: UserPublic) -> SessionResponse:
    return SessionResponse(
        user=user,
        profile=auth_store.get_profile(user.id),
        goals=auth_store.list_goals(user.id),
    )


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(request: SignupRequest) -> AuthResponse:
    try:
        user = auth_store.create_user(request.username, request.password, request.profile)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
    return AuthResponse(
        access_token=auth_store.create_session(user.id),
        user=user,
        profile=request.profile,
        goals=[],
    )


@router.post("/login", response_model=AuthResponse)
def login(request: Credentials) -> AuthResponse:
    user = auth_store.authenticate(request.username, request.password)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password.")
    return AuthResponse(
        access_token=auth_store.create_session(user.id),
        user=user,
        profile=auth_store.get_profile(user.id),
        goals=auth_store.list_goals(user.id),
    )


@router.get("/me", response_model=SessionResponse)
def me(user: UserPublic = Depends(current_user)) -> SessionResponse:
    return _session_response(user)


@router.put("/profile", response_model=FinancialProfile)
def update_profile(profile: FinancialProfile, user: UserPublic = Depends(current_user)) -> FinancialProfile:
    return auth_store.update_profile(user.id, profile)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)) -> None:
    if credentials is not None:
        auth_store.delete_session(credentials.credentials)
