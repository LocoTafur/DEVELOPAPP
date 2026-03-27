from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Float
import enum
from app.core.database import Base
from datetime import datetime


class BookingStatus(str, enum.Enum):
    PENDIENTE = "finalizada"
    CONFIRMADA = "confirmada"
    CANCELADA = "cancelada"


class Booking(Base):
    __tablename__ = "reservas"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    cancha_id = Column(Integer, nullable=False)
    fecha_reserva = Column(DateTime, nullable=False)
    hora_inicio = Column(DateTime, nullable=False)
    hora_fin = Column(DateTime, nullable=False)
    estado = Column(Enum(BookingStatus), default=BookingStatus.PENDIENTE)
    total_pago = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
