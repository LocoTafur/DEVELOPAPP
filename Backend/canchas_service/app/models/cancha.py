from sqlalchemy import Column, Integer, String, Float, Boolean, Enum
import enum
from app.core.database import Base


class Cancha(Base):
    __tablename__ = "canchas"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    ubicacion = Column(
        String, nullable=False, server_default="Dirección no especificada"
    )
    tipo_grama = Column(String, default="sintetica")
    capacidad = Column(Integer, nullable=False)
    precio_hora = Column(Float, nullable=False)
    es_techada = Column(Boolean, default=False)
    esta_disponible = Column(Boolean, default=True)
