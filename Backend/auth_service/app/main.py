import os

from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.security import validate_admin_token, get_current_user_id
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import (
    UserCreate,
    UserOut,
    Token,
    UserUpdateAdmin,
    UserUpdateMe,
    PasswordRecover,
)

SECRET_KEY = os.getenv("SECRET_KEY", "secret_key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI(title="Auth Service - Gestión de Canchas")


def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


@app.get("/", tags=["Health Check"])
def root():
    return {"message": "Auth Service is up and running"}


@app.get("/users", tags=["Admin"])
def get_users(
    db: Session = Depends(get_db), current_admin: dict = Depends(validate_admin_token)
):
    users = db.query(User).all()
    return users


@app.post(
    "/register",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
    tags=["Auth"],
)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):

    user_exists = db.query(User).filter(User.email == user_in.email).first()
    if user_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico ya está registrado.",
        )

    new_user = User(
        email=user_in.email,
        hashed_password=pwd_context.hash(user_in.password),
        full_name=user_in.full_name,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.post("/login", response_model=Token, tags=["Auth"])
def login(user_credentials: UserCreate, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.email == user_credentials.email).first()

    if not user or not pwd_context.verify(
        user_credentials.password, user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "sub_id": user.id, "role": user.role_id},
        expires_delta=access_token_expires,
    )

    return {"access_token": access_token, "token_type": "bearer"}


@app.patch("/users/{user_id}", tags=["Admin"])
def admin_update_user(
    user_id: int,
    obj_in: UserUpdateAdmin,
    db: Session = Depends(get_db),
    admin_data: dict = Depends(validate_admin_token),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    update_data = obj_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    return {"msg": "Usuario actualizado por administrador"}


@app.patch("/me", tags=["User"])
def update_own_profile(
    obj_in: UserUpdateMe,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_id),
):
    user = db.query(User).filter(User.id == current_user["id"]).first()

    if obj_in.full_name:
        user.full_name = obj_in.full_name
    if obj_in.password:
        user.hashed_password = pwd_context.hash(obj_in.password)

    db.commit()
    return {"msg": "Perfil actualizado correctamente"}


@app.post("/recover-password", tags=["Auth"])
def recover_password(data: PasswordRecover, db: Session = Depends(get_db)):

    user = (
        db.query(User)
        .filter(User.email == data.email, User.full_name == data.full_name)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404, detail="Los datos no coinciden con nuestros registros."
        )

    user.hashed_password = pwd_context.hash(data.new_password)
    db.commit()
    return {"msg": "Contraseña restablecida con éxito"}
