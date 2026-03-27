import requests
import os

CANCHAS_SERVICE_URL = os.getenv("CANCHAS_SERVICE_URL", "http://localhost:8002/canchas")


def get_cancha_info(cancha_id: int):
    try:
        response = requests.get(f"{CANCHAS_SERVICE_URL}/{cancha_id}")
        if response.status_code == 200:
            return response.json()
        return None
    except requests.exceptions.RequestException:
        return None
