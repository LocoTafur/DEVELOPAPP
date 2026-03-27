import React, { useEffect, useState } from "react";
import api from "../api/client";
import {
  MapPin,
  Users,
  Clock,
  Calendar,
  CheckCircle2,
  Settings,
  ClipboardList,
  LayoutGrid,
  Trash2,
  Edit,
  X,
  Lock,
  User,
} from "lucide-react";

const UserHome = () => {
  const [activeTab, setActiveTab] = useState("canchas");
  const [canchas, setCanchas] = useState([]);
  const [misReservas, setMisReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Estados para Modal de Reserva/Edición
  const [bookingModal, setBookingModal] = useState({
    open: false,
    data: null,
    isEdit: false,
  });
  const [formReserva, setFormReserva] = useState({
    fecha: "",
    hora_inicio: "",
    hora_fin: "",
  });

  // Estado Perfil
  const [perfil, setPerfil] = useState({
    full_name: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [resCanchas, resMisReservas] = await Promise.all([
        api.get("/canchas/canchas"),
        api.get("/bookings/mis-reservas"),
      ]);
      setCanchas(resCanchas.data);
      setMisReservas(resMisReservas.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- RESERVAS
  const handleSaveBooking = async (e) => {
    e.preventDefault();
    const payload = {
      cancha_id: bookingModal.data.id || bookingModal.data.cancha_id,
      fecha_reserva: `${formReserva.fecha}T00:00:00`,
      hora_inicio: `${formReserva.fecha}T${formReserva.hora_inicio.padStart(2, "0")}:00:00`,
      hora_fin: `${formReserva.fecha}T${formReserva.hora_fin.padStart(2, "0")}:00:00`,
    };

    try {
      if (bookingModal.isEdit) {
        await api.patch(`/bookings/reservas/${bookingModal.data.id}`, payload);
        setMessage({
          type: "success",
          text: "Reserva actualizada correctamente.",
        });
      } else {
        await api.post("/bookings/reservar", payload);
        setMessage({ type: "success", text: "Reserva creada con éxito." });
      }
      setBookingModal({ open: false, data: null, isEdit: false });
      fetchInitialData();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.detail || "Error en la operación",
      });
      setBookingModal({ open: false, data: null, isEdit: false });
    }
  };

  const handleCancelBooking = async (id) => {
    if (!window.confirm("¿Seguro que deseas cancelar esta reserva?")) return;
    try {
      await api.patch(`/bookings/reservas/${id}?cancel=true`);
      setMessage({ type: "success", text: "Reserva cancelada." });
      fetchInitialData();
    } catch (err) {
      setMessage({ type: "error", text: "No se pudo cancelar la reserva." });
    }
  };

  // --- PERFIL
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (perfil.password && perfil.password !== perfil.confirmPassword) {
      return setMessage({
        type: "error",
        text: "Las contraseñas no coinciden.",
      });
    }
    try {
      await api.patch("/auth/me", {
        full_name: perfil.full_name,
        password: perfil.password || undefined,
      });
      setMessage({ type: "success", text: "Perfil actualizado con éxito." });
      setPerfil({ ...perfil, password: "", confirmPassword: "" });
    } catch (err) {
      setMessage({ type: "error", text: "Error al actualizar perfil." });
    }
  };

  if (loading)
    return (
      <div className="p-10 text-center animate-pulse">
        Sincronizando datos...
      </div>
    );

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col">
      <header className="bg-zinc-900 border-b border-zinc-800 p-6 sticky top-0 z-40 shadow-xl">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-white">Canchas Pro</h1>
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mt-1">
              Portal del Jugador
            </p>
          </div>
          <nav className="flex bg-white/5 p-1 rounded-2xl backdrop-blur-sm border border-white/10">
            {[
              { id: "canchas", icon: LayoutGrid, label: "Explorar" },
              { id: "reservas", icon: ClipboardList, label: "Mis Reservas" },
              { id: "perfil", icon: Settings, label: "Mi Perfil" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab.id
                    ? "bg-white shadow-md text-zinc-900"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <tab.icon size={16} className="mr-2" /> {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full p-6 flex-1">
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-2xl border flex justify-between items-center animate-in slide-in-from-top duration-300 ${message.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}
          >
            <span className="font-bold text-sm">{message.text}</span>
            <button onClick={() => setMessage({ type: "", text: "" })}>
              <X size={16} />
            </button>
          </div>
        )}

        {activeTab === "canchas" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {canchas.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-3xl border border-zinc-200 overflow-hidden hover:shadow-xl transition-all group"
              >
                <div className="h-48 bg-zinc-900 relative">
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-black">
                    ${c.precio_hora}/HR
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-zinc-800 mb-1">
                    {c.nombre}
                  </h3>
                  <p className="text-zinc-500 text-sm flex items-center mb-4">
                    <MapPin size={14} className="mr-1" /> {c.ubicacion}
                  </p>
                  <button
                    onClick={() => {
                      setBookingModal({ open: true, data: c, isEdit: false });
                      setFormReserva({
                        fecha: "",
                        hora_inicio: "",
                        hora_fin: "",
                      });
                    }}
                    className="w-full bg-green-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-green-100 hover:bg-green-700 hover:shadow-green-200 transition-all active:scale-95"
                  >
                    Reservar ahora
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "reservas" && (
          <div className="space-y-4">
            {misReservas.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed text-zinc-400">
                Aún no tienes reservas activas.
              </div>
            ) : (
              misReservas.map((r) => (
                <div
                  key={r.id}
                  className="bg-white p-5 rounded-2xl border border-zinc-200 flex justify-between items-center group"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-xl ${r.estado === "confirmada" ? "bg-green-100 text-green-600" : "bg-zinc-100 text-zinc-400"}`}
                    >
                      <Calendar size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-zinc-800">
                        Cancha #{r.cancha_id}
                      </p>
                      <p className="text-xs text-zinc-500 font-medium">
                        {new Date(r.hora_inicio).toLocaleDateString()} |{" "}
                        {new Date(r.hora_inicio).getHours()}:00 a{" "}
                        {new Date(r.hora_fin).getHours()}:00
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {r.estado !== "cancelada" && (
                      <>
                        <button
                          onClick={() => {
                            setBookingModal({
                              open: true,
                              data: r,
                              isEdit: true,
                            });
                            setFormReserva({
                              fecha: r.hora_inicio.split("T")[0],
                              hora_inicio: new Date(r.hora_inicio)
                                .getHours()
                                .toString(),
                              hora_fin: new Date(r.hora_fin)
                                .getHours()
                                .toString(),
                            });
                          }}
                          className="p-3 bg-zinc-50 text-zinc-600 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleCancelBooking(r.id)}
                          className="p-3 bg-zinc-50 text-zinc-600 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center ${r.estado === "confirmada" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      {r.estado}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "perfil" && (
          <div className="max-w-xl mx-auto bg-white rounded-3xl border border-zinc-200 p-8">
            <h2 className="text-2xl font-black mb-6">
              Configuración de Cuenta
            </h2>
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-black text-zinc-400 uppercase">
                  Nombre Completo
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-3 text-zinc-400"
                    size={18}
                  />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:border-zinc-900 outline-none"
                    placeholder="Tu nombre real"
                    value={perfil.full_name}
                    onChange={(e) =>
                      setPerfil({ ...perfil, full_name: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-zinc-400 uppercase">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-3 text-zinc-400"
                    size={18}
                  />
                  <input
                    type="password"
                    className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:border-zinc-900 outline-none"
                    placeholder="Dejar vacío para no cambiar"
                    value={perfil.password}
                    onChange={(e) =>
                      setPerfil({ ...perfil, password: e.target.value })
                    }
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-black hover:bg-black transition-all"
              >
                Actualizar Mis Datos
              </button>
            </form>
          </div>
        )}
      </main>

      {bookingModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSaveBooking}
            className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-5"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black">
                {bookingModal.isEdit ? "Modificar Horario" : "Nueva Reserva"}
              </h2>
              <button
                type="button"
                onClick={() => setBookingModal({ open: false })}
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase">
                  Fecha
                </label>
                <input
                  type="date"
                  required
                  className="w-full border-2 border-zinc-100 p-3 rounded-xl focus:border-zinc-900 outline-none"
                  value={formReserva.fecha}
                  onChange={(e) =>
                    setFormReserva({ ...formReserva, fecha: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase">
                    Desde
                  </label>
                  <select
                    className="w-full border-2 border-zinc-100 p-3 rounded-xl focus:border-zinc-900 outline-none"
                    value={formReserva.hora_inicio}
                    onChange={(e) =>
                      setFormReserva({
                        ...formReserva,
                        hora_inicio: e.target.value,
                        hora_fin: "",
                      })
                    }
                  >
                    <option value="">Hora</option>
                    {[...Array(15)].map((_, i) => (
                      <option key={i + 7} value={(i + 7).toString()}>
                        {i + 7}:00
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase">
                    Hasta
                  </label>
                  <select
                    className="w-full border-2 border-zinc-100 p-3 rounded-xl focus:border-zinc-900 outline-none"
                    value={formReserva.hora_fin}
                    disabled={!formReserva.hora_inicio}
                    onChange={(e) =>
                      setFormReserva({
                        ...formReserva,
                        hora_fin: e.target.value,
                      })
                    }
                  >
                    <option value="">Hora</option>
                    {[...Array(24)].map((_, i) => {
                      if (i + 1 > parseInt(formReserva.hora_inicio)) {
                        return (
                          <option key={i + 1} value={(i + 1).toString()}>
                            {i + 1}:00
                          </option>
                        );
                      }
                      return null;
                    })}
                  </select>
                </div>
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-green-100 hover:bg-green-700 transition-all"
            >
              {bookingModal.isEdit ? "Actualizar Reserva" : "Confirmar Reserva"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default UserHome;
