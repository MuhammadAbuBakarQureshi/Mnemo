from fastapi import APIRouter, Depends, HTTPException, Response, Request

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from backend.app.core.database import db_session_maker
from backend.app.models.models import User
from backend.app.schemas.user import UserCreate, UserLogin
from backend.app.auth.jwt import create_access_token
from backend.app.dependencies.auth import get_current_user

import os
from dotenv import load_dotenv
import bcrypt

load_dotenv()
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")) # type: ignore

router = APIRouter()


@router.get("/me")
async def get_current_user(
    current_user: User = Depends(get_current_user),
):
    try:
        return {
            "user_id": current_user.user_id,
            "name": current_user.username,
            "email": current_user.email
        }
    except Exception as e:
        print(f"Get Current User Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch user") from e


@router.post("/register")
async def register(credentials: UserCreate, session: AsyncSession = Depends(db_session_maker)):

    existing = await session.execute(select(User).where(User.email == credentials.email))

    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    try:
        password = credentials.password.encode('utf-8')
        hashed = bcrypt.hashpw(password, bcrypt.gensalt())
        password_hash_str = hashed.decode('utf-8')

        new_user = User(
            username=credentials.username,
            email=credentials.email,
            password_hash=password_hash_str
        )

        session.add(new_user)
        await session.commit()

        return {"message": "User registered successfully"}

    except IntegrityError as e:
        await session.rollback()
        raise HTTPException(status_code=400, detail="User with this email or username already exists")

    except Exception as e:
        await session.rollback()
        print(f"User Register Error: {e}")
        raise HTTPException(status_code=500, detail="Something went wrong while creating your account")
    


@router.post("/login")
async def login(credentials: UserLogin, response: Response, request: Request, session: AsyncSession = Depends(db_session_maker)):

    try:
        result = await session.execute(select(User).where(User.email == credentials.email))
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=401, detail="Invalid email")

        valid = bcrypt.checkpw(credentials.password.encode("utf-8"), user.password_hash.encode("utf-8"))

        if not valid:
            raise HTTPException(status_code=401, detail="Invalid password")

        access_token = create_access_token({"sub": str(user.user_id)})
    
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=ACCESS_TOKEN_EXPIRE_MINUTES
        )

        return {
            "message": "Logged in successfully",
            "user": {
                "user_id": user.user_id,
                "username": user.username,
                "email": user.email
            }
        }

    except HTTPException:
        raise

    except Exception as e:
        print(f"User Login Error: {e}")
        raise HTTPException(status_code=500, detail="Something went wrong while logging in")
    
@router.post("/logout")
async def logout(response: Response):
    try:
        
        response.delete_cookie(
            key="access_token",
            httponly=True,
            secure=True,
            samesite="none",
        )
        return {"message": "Logged out successfully"}
    except Exception as e:
        print(f"Logout Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to log out") from e