from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List, Optional

from app.core.database import get_db
from app.models.booking import Booking, BookingStatus
from app.schemas.booking import BookingBase, BookingCreate, BookingOut
from app.core.security import get_current_user_id
from app.services.external import get_cancha_info

app = FastAPI(title="Bookings and Reservations Service")


@app.get("/admin/reservas", response_model=List[BookingOut], tags=["Admin"])
def get_all_bookings_admin(
    user_id: Optional[int] = None,
    cancha_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user_payload: dict = Depends(get_current_user_id),
):

    if user_payload.get("role") != 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: Se requieren permisos de administrador",
        )

    query = db.query(Booking)

    if user_id:
        query = query.filter(Booking.user_id == user_id)
    if cancha_id:
        query = query.filter(Booking.cancha_id == cancha_id)

    return query.order_by(Booking.created_at.desc()).all()


@app.post("/reservar", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
def create_booking(
    booking_in: BookingCreate,
    db: Session = Depends(get_db),
    user_payload: dict = Depends(get_current_user_id),
):

    user_id = user_payload.get("sub_id")

    ahora = datetime.now()

    if booking_in.hora_inicio < ahora:
        raise HTTPException(
            status_code=400, detail="No puedes reservar en una fecha/hora pasada"
        )

    if booking_in.hora_inicio.minute != 0 or booking_in.hora_fin.minute != 0:
        raise HTTPException(
            status_code=400,
            detail="Solo se permiten reservas en horas exactas (ej: 14:00, no 14:30)",
        )

    duracion_segundos = (booking_in.hora_fin - booking_in.hora_inicio).total_seconds()
    if duracion_segundos % 3600 != 0:
        raise HTTPException(
            status_code=400, detail="La reserva debe ser por bloques exactos de 1 hora"
        )

    cancha = get_cancha_info(booking_in.cancha_id)

    if cancha is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"La cancha con ID {booking_in.cancha_id} no existe o el servicio de inventario no responde.",
        )

    overlap = (
        db.query(Booking)
        .filter(
            Booking.cancha_id == booking_in.cancha_id,
            Booking.estado != BookingStatus.CANCELADA,
            Booking.hora_inicio < booking_in.hora_fin,
            Booking.hora_fin > booking_in.hora_inicio,
        )
        .first()
    )

    if overlap:
        raise HTTPException(
            status_code=400,
            detail=f"La cancha ya está reservada en ese horario (Ocupada hasta {overlap.hora_fin})",
        )

    duracion = (booking_in.hora_fin - booking_in.hora_inicio).total_seconds() / 3600
    total = duracion * cancha["precio_hora"]

    new_booking = Booking(
        user_id=user_id,
        cancha_id=booking_in.cancha_id,
        fecha_reserva=booking_in.fecha_reserva,
        hora_inicio=booking_in.hora_inicio,
        hora_fin=booking_in.hora_fin,
        total_pago=total,
        estado=BookingStatus.CONFIRMADA,
    )

    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    return new_booking


@app.get("/mis-reservas", response_model=List[BookingOut], tags=["User"])
def get_my_bookings(
    status: Optional[BookingStatus] = None,
    db: Session = Depends(get_db),
    user_payload: dict = Depends(get_current_user_id),
):
    user_id = user_payload.get("sub_id")
    query = db.query(Booking).filter(Booking.user_id == user_id)

    if status:
        query = query.filter(Booking.estado == status)

    return query.order_by(Booking.fecha_reserva.desc()).all()


@app.patch("/reservas/{booking_id}", response_model=BookingOut, tags=["User"])
def update_or_cancel_booking(
    booking_id: int,
    booking_update: Optional[BookingBase] = None,
    cancel: bool = False,
    db: Session = Depends(get_db),
    user_payload: dict = Depends(get_current_user_id),
):
    user_id = user_payload.get("sub_id")

    booking = (
        db.query(Booking)
        .filter(Booking.id == booking_id, Booking.user_id == user_id)
        .first()
    )

    if not booking:
        raise HTTPException(
            status_code=404, detail="Reserva no encontrada o no te pertenece"
        )

    if cancel:
        if booking.estado == BookingStatus.CANCELADA:
            raise HTTPException(status_code=400, detail="La reserva ya está cancelada")

        booking.estado = BookingStatus.CANCELADA
        db.commit()
        db.refresh(booking)
        return booking

    if booking_update:

        overlap = (
            db.query(Booking)
            .filter(
                Booking.cancha_id == booking.cancha_id,
                Booking.id != booking_id,
                Booking.estado != BookingStatus.CANCELADA,
                Booking.hora_inicio < booking_update.hora_fin,
                Booking.hora_fin > booking_update.hora_inicio,
            )
            .first()
        )

        if overlap:
            raise HTTPException(
                status_code=400, detail="El nuevo horario ya está ocupado"
            )

        booking.fecha_reserva = booking_update.fecha_reserva
        booking.hora_inicio = booking_update.hora_inicio
        booking.hora_fin = booking_update.hora_fin

        cancha = get_cancha_info(booking.cancha_id)
        duracion = (
            booking_update.hora_fin - booking_update.hora_inicio
        ).total_seconds() / 3600
        booking.total_pago = duracion * cancha["precio_hora"]

    db.commit()
    db.refresh(booking)
    return booking
