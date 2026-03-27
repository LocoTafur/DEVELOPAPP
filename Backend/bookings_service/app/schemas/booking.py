from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional
from enum import Enum


class BookingStatus(str, Enum):
    PENDIENTE = "finalizada"
    CONFIRMADA = "confirmada"
    CANCELADA = "cancelada"


class BookingBase(BaseModel):
    cancha_id: int
    fecha_reserva: datetime
    hora_inicio: datetime
    hora_fin: datetime

    @field_validator("hora_fin")
    @classmethod
    def check_times(cls, v: datetime, info):
        if "hora_inicio" in info.data and v <= info.data["hora_inicio"]:
            raise ValueError("La hora de fin debe ser posterior a la de inicio")
        return v


class BookingCreate(BookingBase):
    pass


class BookingOut(BookingBase):
    id: int
    user_id: int
    estado: BookingStatus
    total_pago: float
    created_at: datetime

    class Config:
        from_attributes = True
