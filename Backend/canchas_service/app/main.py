from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.cancha import Cancha
from app.schemas.cancha import CanchaCreate, CanchaOut
from app.core.security import validate_admin_token

app = FastAPI(title="Canchas Inventory Service")


@app.get("/", tags=["Health"])
def health_check():
    return {"service": "Canchas Inventory", "status": "online"}


@app.get("/canchas", response_model=List[CanchaOut], tags=["Public"])
def get_all_canchas(db: Session = Depends(get_db)):
    return db.query(Cancha).all()


@app.get("/canchas/{cancha_id}", response_model=CanchaOut, tags=["Public"])
def get_cancha(cancha_id: int, db: Session = Depends(get_db)):
    cancha = db.query(Cancha).filter(Cancha.id == cancha_id).first()
    if not cancha:
        raise HTTPException(status_code=404, detail="Cancha no encontrada")
    return cancha


@app.post(
    "/canchas",
    response_model=CanchaOut,
    status_code=status.HTTP_201_CREATED,
    tags=["Admin"],
)
def create_new_cancha(
    cancha_in: CanchaCreate,
    db: Session = Depends(get_db),
    admin_payload: dict = Depends(validate_admin_token),
):
    new_cancha = Cancha(**cancha_in.dict())
    db.add(new_cancha)
    db.commit()
    db.refresh(new_cancha)
    return new_cancha


@app.put("/canchas/{cancha_id}", response_model=CanchaOut, tags=["Admin"])
def update_cancha(
    cancha_id: int,
    cancha_update: CanchaCreate,
    db: Session = Depends(get_db),
    admin_payload: dict = Depends(validate_admin_token),
):
    db_cancha = db.query(Cancha).filter(Cancha.id == cancha_id).first()
    if not db_cancha:
        raise HTTPException(status_code=404, detail="Cancha no encontrada")

    for key, value in cancha_update.dict().items():
        setattr(db_cancha, key, value)

    db.commit()
    db.refresh(db_cancha)
    return db_cancha


@app.delete(
    "/canchas/{cancha_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Admin"]
)
def delete_cancha(
    cancha_id: int,
    db: Session = Depends(get_db),
    admin_payload: dict = Depends(validate_admin_token),
):
    db_cancha = db.query(Cancha).filter(Cancha.id == cancha_id).first()
    if not db_cancha:
        raise HTTPException(status_code=404, detail="Cancha no encontrada")

    db.delete(db_cancha)
    db.commit()
    return None
