from pydantic import BaseModel
from typing import Optional
from enum import Enum


class TipoGrama(str, Enum):
    SINTETICA = "sintetica"
    NATURAL = "natural"


class CanchaBase(BaseModel):
    nombre: str
    ubicacion: str
    tipo_grama: Optional[TipoGrama] = TipoGrama.SINTETICA
    capacidad: int
    precio_hora: float
    es_techada: Optional[bool] = False


class CanchaCreate(CanchaBase):
    pass


class CanchaOut(CanchaBase):
    id: int
    esta_disponible: bool

    class Config:
        from_attributes = True
