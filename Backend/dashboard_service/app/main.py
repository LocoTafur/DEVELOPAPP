from fastapi import FastAPI, Depends, HTTPException
from typing import Optional
from app.services.aggregator import get_dashboard_data
from app.core.security import validate_admin_token

app = FastAPI(title="Dashboard & Analytics Service")


@app.get("/dashboard/metrics", tags=["Analytics"])
def get_general_metrics(admin_payload: dict = Depends(validate_admin_token)):

    token = admin_payload.get("raw_token")
    users, bookings, canchas = get_dashboard_data(token)

    total_bookings = len(bookings)
    activas = [b for b in bookings if b["estado"] == "confirmada"]
    canceladas = [b for b in bookings if b["estado"] == "cancelada"]

    reservas_por_cancha = {}
    for cancha in canchas:
        count = len([b for b in bookings if b["cancha_id"] == cancha["id"]])
        reservas_por_cancha[cancha["nombre"]] = count

    return {
        "resumen_usuarios": {
            "total": len(users),
            "admins": len([u for u in users if u["role_id"] == 1]),
            "clientes": len([u for u in users if u["role_id"] == 2]),
        },
        "resumen_reservas": {
            "total": total_bookings,
            "activas": len(activas),
            "canceladas": len(canceladas),
            "porcentaje_cancelacion": (
                (len(canceladas) / total_bookings * 100) if total_bookings > 0 else 0
            ),
        },
        "ranking_canchas": reservas_por_cancha,
    }


@app.get("/dashboard/users", tags=["Management"])
def list_users(
    role_id: Optional[int] = None, admin_payload: dict = Depends(validate_admin_token)
):
    token = admin_payload.get("raw_token")
    users, _, _ = get_dashboard_data(token)

    if role_id:
        return [u for u in users if u["role_id"] == role_id]
    return users
