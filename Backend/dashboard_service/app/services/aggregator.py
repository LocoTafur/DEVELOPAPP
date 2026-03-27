import os
import requests
from fastapi import HTTPException

AUTH_URL = os.getenv("AUTH_SERVICE_URL", "http://localhost:8000")
CANCHAS_URL = os.getenv("CANCHAS_SERVICE_URL", "http://localhost:8002")
BOOKINGS_URL = os.getenv("BOOKINGS_SERVICE_URL", "http://localhost:8003")


def fetch_data(url: str, token: str):
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            return response.json()
        return []
    except requests.exceptions.ConnectionError:
        return None


def get_dashboard_data(token: str):
    users = fetch_data(f"{AUTH_URL}/users", token)
    bookings = fetch_data(f"{BOOKINGS_URL}/admin/reservas", token)
    canchas = fetch_data(f"{CANCHAS_URL}/canchas", token)

    if None in [users, bookings, canchas]:
        raise HTTPException(status_code=503, detail="Uno o más servicios no responden")

    return users, bookings, canchas
