
-- BASES DE DATOS
CREATE DATABASE canchas_auth_db;
CREATE DATABASE bookings_db;
CREATE DATABASE canchas_roles_db;
CREATE DATABASE canchas_inventory_db;

\c canchas_auth_db;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    role_id INTEGER NOT NULL
);


-- Insertar usuario admin obligatorio contraseña 'admin123'
INSERT INTO users (email, full_name, hashed_password, role_id) 
VALUES ('admin@canchas.com', 'Admin System', '$2a$12$xOHnmlmRY92WJTgaKwJTyO2NbQRJnG.CAueln7c6fZnpJGtK.oPjC', 1);

\c canchas_roles_db;

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    permissions JSONB NOT NULL
);

-- Insertar roles usuario y admin obligatorio
INSERT INTO roles (name, permissions) 
VALUES ('admin', '["canchas:all", "users:all", "roles:all"]'),
       ('usuario', '["canchas:view", "reservas:create", "reservas:view_own", "perfil:edit"]');


\c bookings_db;


CREATE TABLE reservas (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    cancha_id INTEGER NOT NULL,
    fecha_reserva TIMESTAMP NOT NULL,
    hora_inicio TIMESTAMP NOT NULL,
    hora_fin TIMESTAMP NOT NULL,
    estado VARCHAR(20) DEFAULT 'confirmada',
    total_pago DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


\c canchas_inventory_db;

CREATE TABLE canchas (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    tipo_grama TEXT DEFAULT 'sintetica',
    capacidad INTEGER NOT NULL,
    precio_hora DECIMAL(10,2) NOT NULL,
    es_techada BOOLEAN DEFAULT FALSE,
    esta_disponible BOOLEAN DEFAULT TRUE,
    ubicacion TEXT DEFAULT 'No especificada'
);

-- Cancha de prueba para validar el sistema
INSERT INTO canchas (nombre, tipo_grama, capacidad, precio_hora, es_techada, esta_disponible, ubicacion) 
VALUES ('Cancha Central', 'sintetica', 22, 150, TRUE, TRUE, 'Av. Principal 123');