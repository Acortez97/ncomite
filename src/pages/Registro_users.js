import React, { useState } from "react";
import Swal from "sweetalert2";
import { FaUserShield } from "react-icons/fa";
import { API } from "../Api/api.config";

const API_INSERT_USER = API.INSERT_USER_ADMIN;

export default function RegistroUsersAdmin() {
  const [nombre,   setNombre]   = useState("");
  const [apellido, setApellido] = useState("");
  const [usuario,  setUsuario]  = useState("");
  const [pass,     setPass]     = useState("");
  const [rol,      setRol]      = useState("");
  const [loading,  setLoading]  = useState(false);

  const getFechaLocal = () => {
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  };

  const guardarUsuario = async () => {
    if (!nombre || !usuario || !pass || !rol) {
      Swal.fire({ icon: "error", title: "Campos incompletos",
        text: "Nombre, usuario, contraseña y rol son obligatorios." });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(API_INSERT_USER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, pass, id_rol: rol, nombre, apellido, status: 1, fecha_creacion: getFechaLocal() }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Error al registrar");
      Swal.fire({ icon: "success", title: "Usuario registrado", text: "El usuario fue creado correctamente." });
      setNombre(""); setApellido(""); setUsuario(""); setPass(""); setRol("");
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <div className="form-card">
        <h2 className="form-title">Registrar Administrador</h2>

        <form onSubmit={(e) => { e.preventDefault(); guardarUsuario(); }}>
          <div className="form-group">
            <label className="form-label">Nombre *</label>
            <input type="text" required value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre del administrador" className="form-input" />
          </div>

          <div className="form-group">
            <label className="form-label">Apellido</label>
            <input type="text" value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              placeholder="Apellido(s)" className="form-input" />
          </div>

          <div className="form-group">
            <label className="form-label">Usuario *</label>
            <input type="text" required value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Nombre de usuario para iniciar sesión" className="form-input" />
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña *</label>
            <input type="password" required value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="Contraseña" className="form-input" />
          </div>

          <div className="form-group">
            <label className="form-label">Rol *</label>
            <select required value={rol}
              onChange={(e) => setRol(e.target.value)} className="form-input">
              <option value="">— Seleccione rol —</option>
              <option value="1">Administrador</option>
              <option value="2">Caja</option>
              <option value="3">Usuario común</option>
            </select>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <FaUserShield /> {loading ? "Guardando..." : "Registrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
