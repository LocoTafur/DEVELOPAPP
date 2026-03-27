from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.role import Role
from app.schemas.role import RoleCreate, RoleOut
from app.core.security import verify_admin_access

app = FastAPI(title="Roles and Permissions Service")


@app.get("/", tags=["Health Check"])
def root():
    return {"message": "Roles Service is active"}


@app.post("/roles", response_model=RoleOut)
def create_role(
    role_in: RoleCreate,
    db: Session = Depends(get_db),
    current_admin: int = Depends(verify_admin_access),
):

    existing_role = db.query(Role).filter(Role.name == role_in.name).first()
    if existing_role:
        raise HTTPException(status_code=400, detail="El rol ya existe")

    new_role = Role(name=role_in.name, permissions=role_in.permissions)
    db.add(new_role)
    db.commit()
    db.refresh(new_role)
    return new_role


@app.get("/roles", response_model=List[RoleOut])
def list_roles(db: Session = Depends(get_db)):
    return db.query(Role).all()


@app.put("/roles/{role_id}", response_model=RoleOut, tags=["Admin"])
def update_role(
    role_id: int,
    role_update: RoleCreate,
    db: Session = Depends(get_db),
    current_admin: int = Depends(verify_admin_access),
):
    db_role = db.query(Role).filter(Role.id == role_id).first()
    if not db_role:
        raise HTTPException(status_code=404, detail="Rol no encontrado")

    db_role.name = role_update.name
    db_role.permissions = role_update.permissions
    db.commit()
    db.refresh(db_role)
    return db_role


@app.delete("/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Admin"])
def delete_role(
    role_id: int,
    db: Session = Depends(get_db),
    current_admin: int = Depends(verify_admin_access),
):
    if role_id == 1:
        raise HTTPException(
            status_code=400, detail="No se puede eliminar el rol de Administrador"
        )

    db_role = db.query(Role).filter(Role.id == role_id).first()
    if not db_role:
        raise HTTPException(status_code=404, detail="Rol no encontrado")

    db.delete(db_role)
    db.commit()
    return None
