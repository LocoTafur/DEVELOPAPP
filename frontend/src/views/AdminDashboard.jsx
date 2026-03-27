import React, { useEffect, useState } from "react";
import api from "../api/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  LayoutDashboard,
  MapPin,
  ShieldCheck,
  Users,
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
} from "lucide-react";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("stats");
  const [stats, setStats] = useState(null);
  const [canchas, setCanchas] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCancha, setEditingCancha] = useState(null);
  const [editingRole, setEditingRole] = useState(null);

  const [statsSubTab, setStatsSubTab] = useState("canchas");
  const [selectedCancha, setSelectedCancha] = useState("Todas");
  const [userFilter, setUserFilter] = useState("Todas");
  const [users, setUsers] = useState([]);
  const [reservas, setReservas] = useState([]);

  const [editingUser, setEditingUser] = useState(null);

  const [newCancha, setNewCancha] = useState({
    nombre: "",
    ubicacion: "",
    precio_hora: "",
    capacidad: "",
  });
  const [editingCanchaId, setEditingCanchaId] = useState(null);
  const [newRole, setNewRole] = useState({ name: "", permissions: "" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resStats, resCanchas, resRoles, resUsers, resReservas] =
        await Promise.all([
          api.get("/dashboard/dashboard/metrics"),
          api.get("/canchas/canchas"),
          api.get("/roles/roles"),
          api.get("/auth/users"),
          api.get("/bookings/admin/reservas"),
        ]);
      setStats(resStats.data);
      setCanchas(resCanchas.data);
      setRoles(resRoles.data);
      setUsers(resUsers.data);
      setReservas(resReservas.data);
    } catch (err) {
      console.error("Error de sincronización", err);
    } finally {
      setLoading(false);
    }
  };

  // --- ESTADÍSTICAS
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser.full_name.trim()) return alert("Nombre obligatorio");

    try {
      await api.put(`/auth/users/${editingUser.id}`, {
        full_name: editingUser.full_name,
        is_active: editingUser.is_active,
        role_id: editingUser.role_id,
      });
      setEditingUser(null);
      fetchData();
    } catch (err) {
      alert("Error al actualizar usuario");
    }
  };

  // --- CANCHAS

  const handleSaveCancha = async (e) => {
    e.preventDefault();

    // Validación de seguridad: No permitimos nulos ni vacíos
    if (
      !newCancha.nombre.trim() ||
      !newCancha.ubicacion.trim() ||
      !newCancha.precio_hora ||
      !newCancha.capacidad
    ) {
      alert(
        "Error: Todos los campos son obligatorios, incluyendo la capacidad.",
      );
      return;
    }

    try {
      if (editingCanchaId) {
        // MODO EDICIÓN: PUT al endpoint con el ID
        await api.put(`/canchas/canchas/${editingCanchaId}`, newCancha);
      } else {
        // MODO CREACIÓN: POST normal
        await api.post("/canchas/canchas", newCancha);
      }

      // Resetear todo después del éxito
      setNewCancha({
        nombre: "",
        ubicacion: "",
        precio_hora: "",
        capacidad: "",
      });
      setEditingCanchaId(null);
      fetchData(); // Refrescar la lista y las estadísticas
    } catch (err) {
      console.error(err);
      alert("Error al procesar la solicitud en el microservicio de Canchas.");
    }
  };

  const handleDeleteCancha = async (id) => {
    if (window.confirm("¿Eliminar esta cancha permanentemente?")) {
      await api.delete(`/canchas/canchas/${id}`);
      fetchData();
    }
  };

  const startEditing = (cancha) => {
    setEditingCanchaId(cancha.id);
    setNewCancha({
      nombre: cancha.nombre,
      ubicacion: cancha.ubicacion,
      precio_hora: cancha.precio_hora,
      capacidad: cancha.capacidad,
    });
  };

  // --- ROLES
  const handleSaveRole = async () => {
    if (!newRole.name.trim()) {
      alert("El nombre del rol es obligatorio.");
      return;
    }
    const permissionsArray = newRole.permissions
      ? newRole.permissions
          .split(",")
          .map((p) => p.trim())
          .filter((p) => p !== "")
      : [];

    const rolePayload = {
      name: newRole.name.trim(),
      permissions: permissionsArray,
    };
    try {
      if (editingRole) {
        await api.put(`/roles/roles/${editingRole.id}`, rolePayload);
      } else {
        await api.post("/roles/roles", rolePayload);
      }
      setNewRole({ name: "", permissions: "" });
      setEditingRole(null);
      fetchData();
    } catch (err) {
      alert("Error al guardar rol");
    }
  };

  const startEditingRole = (role) => {
    setEditingRole(role);
    // Al editar, convertimos el array del backend [a, b] de vuelta a string "a, b" para el input
    setNewRole({
      name: role.name,
      permissions: role.permissions ? role.permissions.join(", ") : "",
    });
  };

  const handleDeleteRole = async (id) => {
    if (
      window.confirm(
        "¿Estás seguro de eliminar este rol? Esto podría afectar a los usuarios asociados.",
      )
    ) {
      try {
        await api.delete(`/roles/roles/${id}`);
        fetchData();
      } catch (err) {
        alert("Error: El rol no pudo ser eliminado.");
      }
    }
  };

  if (loading)
    return (
      <div className="p-10 text-center">
        Sincronizando con microservicios...
      </div>
    );

  const chartData = stats
    ? Object.keys(stats.ranking_canchas).map((name) => ({
        name,
        value: stats.ranking_canchas[name],
      }))
    : [];

  return (
    <div className="min-h-screen bg-zinc-100 flex">
      <div className="w-64 bg-zinc-900 text-white p-6 space-y-8">
        <h1 className="text-2xl font-black text-green-500">
          Administrador de canchas
        </h1>
        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab("stats")}
            className={`w-full flex items-center p-3 rounded-xl ${activeTab === "stats" ? "bg-green-600" : "hover:bg-zinc-800"}`}
          >
            <LayoutDashboard className="mr-3" size={20} /> Estadísticas
          </button>
          <button
            onClick={() => setActiveTab("canchas")}
            className={`w-full flex items-center p-3 rounded-xl ${activeTab === "canchas" ? "bg-green-600" : "hover:bg-zinc-800"}`}
          >
            <MapPin className="mr-3" size={20} /> Gestionar Canchas
          </button>
          <button
            onClick={() => setActiveTab("roles")}
            className={`w-full flex items-center p-3 rounded-xl ${activeTab === "roles" ? "bg-green-600" : "hover:bg-zinc-800"}`}
          >
            <ShieldCheck className="mr-3" size={20} /> Roles y Permisos
          </button>
        </nav>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        {activeTab === "stats" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-l-zinc-900">
                <p className="text-zinc-500 text-xs font-black uppercase">
                  Total Reservas
                </p>
                <p className="text-4xl font-black">
                  {stats?.resumen_reservas.total}
                </p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-l-red-500">
                <p className="text-zinc-500 text-xs font-black uppercase">
                  Tasa Cancelación
                </p>
                <p className="text-4xl font-black text-red-500">
                  {stats?.resumen_reservas.porcentaje_cancelacion.toFixed(1)}%
                </p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-l-green-500">
                <p className="text-zinc-500 text-xs font-black uppercase">
                  Usuarios Activos
                </p>
                <p className="text-4xl font-black text-green-600">
                  {stats?.resumen_usuarios.total}
                </p>
              </div>
            </div>

            <div className="flex bg-zinc-200 p-1 rounded-xl w-fit">
              <button
                onClick={() => setStatsSubTab("canchas")}
                className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${statsSubTab === "canchas" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500"}`}
              >
                Canchas
              </button>
              <button
                onClick={() => setStatsSubTab("usuarios")}
                className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${statsSubTab === "usuarios" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500"}`}
              >
                Usuarios
              </button>
            </div>

            {statsSubTab === "canchas" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border">
                  <h4 className="font-bold text-zinc-700">
                    Rendimiento por Escenario
                  </h4>
                  <select
                    className="border-2 border-zinc-100 p-2 rounded-xl outline-none font-semibold text-sm"
                    value={selectedCancha}
                    onChange={(e) => setSelectedCancha(e.target.value)}
                  >
                    <option value="Todas">Todas las Canchas</option>
                    {canchas.map((c) => (
                      <option key={c.id} value={c.nombre}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* GRÁFICA DE 3 COLUMNAS */}
                <div className="bg-white p-6 rounded-2xl border h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={canchas
                        .filter(
                          (c) =>
                            selectedCancha === "Todas" ||
                            c.nombre === selectedCancha,
                        )
                        .map((c) => ({
                          name: c.nombre,
                          confirmadas: reservas.filter(
                            (r) =>
                              r.cancha_id === c.id && r.estado === "confirmada",
                          ).length,
                          canceladas: reservas.filter(
                            (r) =>
                              r.cancha_id === c.id && r.estado === "cancelada",
                          ).length,
                          finalizada: reservas.filter(
                            (r) =>
                              r.cancha_id === c.id && r.estado === "finalizada",
                          ).length,
                        }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip cursor={{ fill: "transparent" }} />
                      <Bar
                        dataKey="confirmadas"
                        fill="#16a34a"
                        radius={[4, 4, 0, 0]}
                        name="Confirmadas"
                      />
                      <Bar
                        dataKey="canceladas"
                        fill="#ef4444"
                        radius={[4, 4, 0, 0]}
                        name="Canceladas"
                      />
                      <Bar
                        dataKey="finalizada"
                        fill="#f59e0b"
                        radius={[4, 4, 0, 0]}
                        name="Finalizadas"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* LISTA DE RESERVAS FILTRADA */}
                <div className="bg-white rounded-2xl border overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-zinc-50 text-zinc-400 text-[10px] font-black uppercase">
                      <tr>
                        <th className="p-4">Cancha</th>
                        <th className="p-4">Fecha/Hora</th>
                        <th className="p-4">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {reservas
                        .filter(
                          (r) =>
                            selectedCancha === "Todas" ||
                            canchas.find((c) => c.id === r.cancha_id)
                              ?.nombre === selectedCancha,
                        )
                        .map((r) => (
                          <tr key={r.id} className="text-sm hover:bg-zinc-50">
                            <td className="p-4 font-bold">
                              {
                                canchas.find((c) => c.id === r.cancha_id)
                                  ?.nombre
                              }
                            </td>
                            <td className="p-4 text-zinc-500">
                              {new Date(r.hora_inicio).toLocaleString()}
                            </td>
                            <td className="p-4">
                              <span
                                className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                  r.estado === "confirmada"
                                    ? "bg-green-100 text-green-700"
                                    : r.estado === "cancelada"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {r.estado}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {statsSubTab === "usuarios" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border">
                  <div className="flex items-center gap-4">
                    <select
                      className="border-2 border-zinc-100 p-2 rounded-xl outline-none font-semibold text-sm"
                      value={userFilter}
                      onChange={(e) => setUserFilter(e.target.value)}
                    >
                      <option value="Todas">Todas</option>
                      <option value="Activas">Activas</option>
                      <option value="Inactivas">Inactivas</option>
                    </select>
                    <span className="text-2xl font-black text-zinc-900">
                      {
                        users.filter(
                          (u) =>
                            userFilter === "Todas" ||
                            (userFilter === "Activas"
                              ? u.is_active
                              : !u.is_active),
                        ).length
                      }
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {users
                    .filter(
                      (u) =>
                        userFilter === "Todas" ||
                        (userFilter === "Activas" ? u.is_active : !u.is_active),
                    )
                    .map((u) => (
                      <div
                        key={u.id}
                        className="bg-white p-4 rounded-2xl border flex justify-between items-center"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-3 h-3 rounded-full ${u.is_active ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-zinc-300"}`}
                          />
                          <div>
                            <p className="font-bold text-zinc-800">
                              {u.full_name}
                            </p>
                            <p className="text-xs text-zinc-500">{u.email}</p>
                          </div>
                          <span className="bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded text-[10px] font-black uppercase">
                            {roles.find((r) => r.id === u.role_id)?.name}
                          </span>
                        </div>
                        <button
                          onClick={() => setEditingUser({ ...u })}
                          className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                        >
                          <Edit3 size={18} />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {editingUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
            <form
              onSubmit={handleUpdateUser}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6"
            >
              <h2 className="text-2xl font-black text-zinc-900">
                Editar Perfil
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    className="w-full border-2 border-zinc-100 p-3 rounded-xl focus:border-zinc-900 outline-none"
                    value={editingUser.full_name}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        full_name: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl">
                  <span className="text-sm font-bold">Estado de Cuenta</span>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingUser({
                        ...editingUser,
                        is_active: !editingUser.is_active,
                      })
                    }
                    className={`px-4 py-1 rounded-full text-xs font-black uppercase transition-all ${editingUser.is_active ? "bg-green-500 text-white" : "bg-zinc-300 text-zinc-600"}`}
                  >
                    {editingUser.is_active ? "Activo" : "Inactivo"}
                  </button>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">
                    Rol Asignado
                  </label>
                  <select
                    className="w-full border-2 border-zinc-100 p-3 rounded-xl focus:border-zinc-900 outline-none"
                    value={editingUser.role_id}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        role_id: parseInt(e.target.value),
                      })
                    }
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-3 font-bold text-zinc-400 hover:text-zinc-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-zinc-900 text-white rounded-2xl font-black shadow-lg hover:bg-black transition-all active:scale-95"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === "canchas" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                {editingCanchaId ? (
                  <Edit3 className="mr-2 text-blue-600" />
                ) : (
                  <Plus className="mr-2 text-green-600" />
                )}
                {editingCanchaId
                  ? "Modificar Cancha Seleccionada"
                  : "Registrar Nueva Cancha"}
              </h3>

              <form
                onSubmit={handleSaveCancha}
                className="grid grid-cols-1 md:grid-cols-5 gap-4"
              >
                <input
                  type="text"
                  placeholder="Nombre (Ej: Cancha 5)"
                  className="border-2 border-zinc-100 p-2.5 rounded-xl focus:border-zinc-900 outline-none"
                  value={newCancha.nombre}
                  onChange={(e) =>
                    setNewCancha({ ...newCancha, nombre: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Ubicación"
                  className="border-2 border-zinc-100 p-2.5 rounded-xl focus:border-zinc-900 outline-none"
                  value={newCancha.ubicacion}
                  onChange={(e) =>
                    setNewCancha({ ...newCancha, ubicacion: e.target.value })
                  }
                />
                <input
                  type="number"
                  placeholder="Precio/Hora"
                  className="border-2 border-zinc-100 p-2.5 rounded-xl focus:border-zinc-900 outline-none"
                  value={newCancha.precio_hora}
                  onChange={(e) =>
                    setNewCancha({ ...newCancha, precio_hora: e.target.value })
                  }
                />
                <input
                  type="number"
                  placeholder="Capacidad (Pers.)"
                  className="border-2 border-zinc-100 p-2.5 rounded-xl focus:border-zinc-900 outline-none"
                  value={newCancha.capacidad}
                  onChange={(e) =>
                    setNewCancha({ ...newCancha, capacidad: e.target.value })
                  }
                />

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className={`flex-1 text-white rounded-xl font-bold transition-all ${editingCanchaId ? "bg-blue-600 hover:bg-blue-700" : "bg-zinc-900 hover:bg-black"}`}
                  >
                    {editingCanchaId ? "Guardar Cambios" : "Crear Cancha"}
                  </button>
                  {editingCanchaId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCanchaId(null);
                        setNewCancha({
                          nombre: "",
                          ubicacion: "",
                          precio_hora: "",
                          capacidad: "",
                        });
                      }}
                      className="p-2 bg-zinc-100 text-zinc-500 rounded-xl"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {canchas.map((c) => (
                <div
                  key={c.id}
                  className="bg-white p-4 rounded-xl flex justify-between items-center border border-zinc-200 hover:border-zinc-400 transition-all"
                >
                  <div className="flex gap-4 items-center">
                    <div className="bg-zinc-100 p-3 rounded-lg text-zinc-600 font-bold">
                      #{c.id}
                    </div>
                    <div>
                      <p className="font-bold text-lg text-zinc-800">
                        {c.nombre}
                      </p>
                      <p className="text-zinc-500 text-sm flex items-center">
                        <MapPin size={14} className="mr-1" /> {c.ubicacion} |{" "}
                        <Users size={14} className="mx-1" /> Cap: {c.capacidad}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => startEditing(c)}
                      className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteCancha(c.id)}
                      className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "roles" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                {editingRole ? (
                  <ShieldCheck className="mr-2 text-blue-600" />
                ) : (
                  <Plus className="mr-2 text-green-600" />
                )}
                {editingRole
                  ? "Editar Capacidades del Rol"
                  : "Definir Nuevo Rol"}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-400 uppercase ml-1">
                    Nombre del Rol
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: gestor_canchas"
                    className="w-full border-2 border-zinc-100 p-2.5 rounded-xl focus:border-zinc-900 outline-none transition-all"
                    value={newRole.name}
                    onChange={(e) =>
                      setNewRole({ ...newRole, name: e.target.value })
                    }
                  />
                </div>

                <div className="md:col-span-1 space-y-1">
                  <label className="text-xs font-bold text-zinc-400 uppercase ml-1">
                    Permisos (separados por coma)
                  </label>
                  <input
                    type="text"
                    placeholder="read, write, delete..."
                    className="w-full border-2 border-zinc-100 p-2.5 rounded-xl focus:border-zinc-900 outline-none transition-all"
                    value={newRole.permissions}
                    onChange={(e) =>
                      setNewRole({ ...newRole, permissions: e.target.value })
                    }
                  />
                </div>

                <div className="flex items-end gap-2">
                  <button
                    onClick={handleSaveRole}
                    className={`flex-1 p-3 text-white rounded-xl font-bold transition-all ${editingRole ? "bg-blue-600 hover:bg-blue-700" : "bg-zinc-900 hover:bg-black"}`}
                  >
                    {editingRole ? "Actualizar Rol" : "Crear Rol"}
                  </button>
                  {editingRole && (
                    <button
                      onClick={() => {
                        setEditingRole(null);
                        setNewRole({ name: "", permissions: "" });
                      }}
                      className="p-3 bg-zinc-100 text-zinc-500 rounded-xl"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-zinc-400 mt-2 uppercase tracking-tighter">
                * Los permisos son opcionales. Déjalos vacíos si el rol es solo
                informativo.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {roles.map((r) => (
                <div
                  key={r.id}
                  className="bg-white p-5 rounded-2xl border border-zinc-200 flex justify-between items-center hover:shadow-md transition-all"
                >
                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] font-black bg-zinc-100 px-2 py-0.5 rounded text-zinc-500 uppercase mr-2">
                        ID: {r.id}
                      </span>
                      <span className="font-bold text-lg text-zinc-900 uppercase">
                        {r.name}
                      </span>
                    </div>

                    {/* Visualización de permisos como chips */}
                    <div className="flex flex-wrap gap-1">
                      {r.permissions && r.permissions.length > 0 ? (
                        r.permissions.map((p, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-full font-semibold"
                          >
                            {p}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-zinc-400 italic">
                          Sin permisos asignados
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => startEditingRole(r)}
                      className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteRole(r.id)}
                      className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
