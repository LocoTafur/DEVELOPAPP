from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os

app = FastAPI(title="API Gateway - Canchas System")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


SERVICES = {
    "auth": os.getenv("AUTH_SERVICE_URL", "http://localhost:8000"),
    "roles": os.getenv("ROLES_SERVICE_URL", "http://localhost:8001"),
    "canchas": os.getenv("CANCHAS_SERVICE_URL", "http://localhost:8002"),
    "bookings": os.getenv("BOOKINGS_SERVICE_URL", "http://localhost:8003"),
    "dashboard": os.getenv("DASHBOARD_SERVICE_URL", "http://localhost:8004"),
}


@app.api_route(
    "/{service}/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"]
)
async def gateway(service: str, path: str, request: Request):
    if service not in SERVICES:
        raise HTTPException(
            status_code=404, detail="Servicio no encontrado en el Gateway"
        )

    url = f"{SERVICES[service]}/{path}"
    body = await request.body()
    headers = dict(request.headers)
    params = dict(request.query_params)
    headers.pop("host", None)

    async with httpx.AsyncClient() as client:
        try:

            response = await client.request(
                method=request.method,
                url=url,
                content=body,
                headers=headers,
                params=params,
                timeout=10.0,
            )

            return Response(
                content=response.content,
                status_code=response.status_code,
                headers=dict(response.headers),
            )
        except httpx.ConnectError:
            raise HTTPException(
                status_code=503, detail=f"El servicio {service} está caído"
            )
