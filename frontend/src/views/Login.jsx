import React, { useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";

const InputField = ({
  label,
  type,
  name,
  icon: Icon,
  placeholder,
  value,
  onChange,
  showPass,
  setShowPass,
}) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black text-zinc-400 uppercase ml-1">
      {label}
    </label>
    <div className="relative">
      <Icon className="absolute left-4 top-3.5 text-zinc-400" size={18} />
      <input
        type={type}
        required
        className="w-full pl-12 pr-12 py-3.5 bg-zinc-50 border-2 border-zinc-100 rounded-2xl focus:border-zinc-900 outline-none transition-all"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      {name === "password" && (
        <button
          type="button"
          onClick={() => setShowPass(!showPass)}
          className="absolute right-4 top-3.5 text-zinc-400 hover:text-zinc-900"
        >
          {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  </div>
);

const Login = () => {
  const [mode, setMode] = useState("login");
  const [showPass, setShowPass] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    full_name: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e, name) => {
    setFormData({ ...formData, [name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (mode === "login") {
        const res = await api.post("/auth/login", {
          email: formData.email,
          password: formData.password,
        });
        const token = res.data.access_token;
        localStorage.setItem("token", token);

        const decoded = jwtDecode(token);

        if (decoded.role === 1) {
          navigate("/admin");
        } else {
          navigate("/home");
        }
      } else if (mode === "register") {
        if (formData.password !== formData.confirmPassword)
          return setError("Las contraseñas no coinciden");
        const { confirmPassword, ...dataToSend } = formData;
        await api.post("/auth/register", dataToSend);
        setMode("login");
        alert("Registro exitoso.");
      } else if (mode === "recover") {
        await api.post("/auth/recover-password", {
          email: formData.email,
          full_name: formData.full_name,
          new_password: formData.password,
        });
        setMode("login");
        alert("Contraseña restablecida.");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Error en el servidor");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-6">
      <div className="bg-white max-w-md w-full rounded-[40px] p-10 shadow-2xl border border-zinc-200/50 relative">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-zinc-900 tracking-tighter">
            {mode === "login"
              ? "Bienvenido"
              : mode === "register"
                ? "Únete"
                : "Recuperar"}
          </h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode !== "login" && (
            <InputField
              label="Nombre Completo"
              type="text"
              name="full_name"
              icon={User}
              placeholder="Juan Pérez"
              value={formData.full_name}
              onChange={(e) => handleChange(e, "full_name")}
            />
          )}

          <InputField
            label="Correo Electrónico"
            type="email"
            name="email"
            icon={Mail}
            placeholder="tu@email.com"
            value={formData.email}
            onChange={(e) => handleChange(e, "email")}
          />

          <InputField
            label={mode === "recover" ? "Nueva Contraseña" : "Contraseña"}
            type={showPass ? "text" : "password"}
            name="password"
            icon={Lock}
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => handleChange(e, "password")}
            showPass={showPass}
            setShowPass={setShowPass}
          />

          {mode === "register" && (
            <InputField
              label="Confirmar Contraseña"
              type={showPass ? "text" : "password"}
              name="confirmPassword"
              icon={ShieldCheck}
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => handleChange(e, "confirmPassword")}
              showPass={showPass}
              setShowPass={setShowPass}
            />
          )}

          <button
            type="submit"
            className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-black transition-all shadow-xl shadow-zinc-200"
          >
            {mode === "login"
              ? "Entrar ahora"
              : mode === "register"
                ? "Crear Cuenta"
                : "Restablecer"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-zinc-100 text-center space-y-3">
          {mode === "login" ? (
            <>
              <button
                onClick={() => setMode("register")}
                className="text-sm font-bold text-zinc-500 hover:text-zinc-900"
              >
                ¿No tienes cuenta?{" "}
                <span className="text-zinc-900 underline">Regístrate</span>
              </button>
              <br />
              <button
                onClick={() => setMode("recover")}
                className="text-xs font-bold text-zinc-400 hover:text-zinc-900"
              >
                Olvidé mi contraseña
              </button>
            </>
          ) : (
            <button
              onClick={() => setMode("login")}
              className="flex items-center justify-center w-full text-sm font-bold text-zinc-900"
            >
              <ArrowLeft size={16} className="mr-2" /> Volver
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
