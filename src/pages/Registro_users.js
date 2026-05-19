import React, { useState } from "react";
import Swal from "sweetalert2";
import { FaUserShield } from "react-icons/fa";
import { API } from "../Api/api.config";
import { apiFetch } from "../Api/apiFetch";

const API_INSERT_USER = API.INSERT_USER_ADMIN;

// Módulos agrupados que se pueden asignar a cada usuario
const GRUPOS_MODULOS = [
  {
    grupo: "Usuarios",
    modulos: [
      { label: "Ver usuarios",       path: "/Ver_usuarios" },
      { label: "Editar usuarios",    path: "/Editar_usuarios" },
      { label: "Registrar usuario",  path: "/Registro_usuarios" },
    ],
  },
  {
    grupo: "Contratos",
    modulos: [
      { label: "Ver contratos",       path: "/Ver_contratos" },
      { label: "Registrar contrato",  path: "/Registro_contratos" },
    ],
  },
  {
    grupo: "Pagos",
    modulos: [
      { label: "Registrar pago",        path: "/Registro_pagos" },
      { label: "Ver pagos",             path: "/Ver_pagos" },
      { label: "Aportación Voluntaria", path: "/Registro_AVoluntarias" },
      { label: "Ver Aportaciones",      path: "/Ver_aportaciones" },
      { label: "Registrar Salida",      path: "/Registro_Salidas" },
      { label: "Ver Salidas",           path: "/Ver_salidas" },
      { label: "Pago de Contrato",      path: "/Registro_Pcontratos" },
    ],
  },
  {
    grupo: "Clientes y Adeudos",
    modulos: [
      { label: "Ver clientes", path: "/Ver_clientes" },
      { label: "Ver adeudos",  path: "/Ver_adeudos" },
    ],
  },
  {
    grupo: "Reportes",
    modulos: [
      { label: "Flujo de Caja",      path: "/Reporte_FlujoCaja" },
      { label: "Reporte de Adeudos", path: "/Reporte_Adeudos" },
      { label: "Actividad Reciente", path: "/Reporte_Actividad" },
    ],
  },
];

// Permisos predeterminados según el rol seleccionado
const DEFAULT_PERMISOS = {
  "1": [ // Administrador — acceso total
    "/Ver_usuarios", "/Editar_usuarios", "/Registro_usuarios",
    "/Ver_contratos", "/Registro_contratos",
    "/Registro_pagos", "/Ver_pagos", "/Registro_AVoluntarias", "/Ver_aportaciones",
    "/Registro_Salidas", "/Ver_salidas", "/Registro_Pcontratos",
    "/Ver_clientes", "/Ver_adeudos",
    "/Reporte_FlujoCaja", "/Reporte_Adeudos", "/Reporte_Actividad",
  ],
  "2": [ // Caja
    "/Registro_pagos", "/Ver_pagos", "/Registro_AVoluntarias",
    "/Ver_aportaciones", "/Ver_adeudos", "/Registro_Pcontratos", "/Registro_usuarios",
  ],
  "3": [ // Usuario común
    "/Ver_usuarios", "/Registro_usuarios",
    "/Ver_contratos", "/Registro_contratos",
    "/Ver_pagos", "/Ver_aportaciones", "/Ver_adeudos",
  ],
};

export default function RegistroUsersAdmin() {
  const [nombre,   setNombre]   = useState("");
  const [apellido, setApellido] = useState("");
  const [usuario,  setUsuario]  = useState("");
  const [pass,     setPass]     = useState("");
  const [rol,      setRol]      = useState("");
  const [permisos, setPermisos] = useState([]);
  const [loading,  setLoading]  = useState(false);

  const getFechaLocal = () => {
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  };

  const handleRolChange = (nuevoRol) => {
    setRol(nuevoRol);
    setPermisos(DEFAULT_PERMISOS[nuevoRol] ?? []);
  };

  const toggleModulo = (path) => {
    setPermisos(prev =>
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    );
  };

  const toggleGrupo = (modulos) => {
    const paths = modulos.map(m => m.path);
    const todosActivos = paths.every(p => permisos.includes(p));
    if (todosActivos) {
      setPermisos(prev => prev.filter(p => !paths.includes(p)));
    } else {
      setPermisos(prev => [...new Set([...prev, ...paths])]);
    }
  };

  const guardarUsuario = async () => {
    if (!nombre || !usuario || !pass || !rol) {
      Swal.fire({ icon: "error", title: "Campos incompletos",
        text: "Nombre, usuario, contraseña y rol son obligatorios." });
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch(API_INSERT_USER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario, pass, id_rol: rol, nombre, apellido,
          status: 1, fecha_creacion: getFechaLocal(),
          permisos,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Error al registrar");
      Swal.fire({ icon: "success", title: "Usuario registrado", text: "El usuario fue creado correctamente." });
      setNombre(""); setApellido(""); setUsuario(""); setPass(""); setRol(""); setPermisos([]);
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
              onChange={(e) => handleRolChange(e.target.value)} className="form-input">
              <option value="">— Seleccione rol —</option>
              <option value="1">Administrador</option>
              <option value="2">Caja</option>
              <option value="3">Usuario común</option>
            </select>
          </div>

          {/* ── Módulos / Permisos ── */}
          {rol && (
            <div className="form-group">
              <label className="form-label" style={{ marginBottom: 10 }}>
                Módulos con acceso
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {GRUPOS_MODULOS.map(({ grupo, modulos }) => {
                  const paths = modulos.map(m => m.path);
                  const todosActivos = paths.every(p => permisos.includes(p));
                  const algunoActivo = paths.some(p => permisos.includes(p));
                  return (
                    <div key={grupo} style={styles.grupoBox}>
                      {/* Cabecera del grupo */}
                      <div style={styles.grupoHeader}>
                        <label style={styles.grupoLabel}>
                          <input
                            type="checkbox"
                            checked={todosActivos}
                            ref={el => { if (el) el.indeterminate = algunoActivo && !todosActivos; }}
                            onChange={() => toggleGrupo(modulos)}
                            style={{ marginRight: 8, accentColor: "#0f4c75" }}
                          />
                          {grupo}
                        </label>
                      </div>
                      {/* Módulos individuales */}
                      <div style={styles.modulosGrid}>
                        {modulos.map(({ label, path }) => (
                          <label key={path} style={styles.moduloItem}>
                            <input
                              type="checkbox"
                              checked={permisos.includes(path)}
                              onChange={() => toggleModulo(path)}
                              style={{ marginRight: 7, accentColor: "#0f4c75" }}
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <FaUserShield /> {loading ? "Guardando..." : "Registrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  grupoBox: {
    border: "1px solid #d0dce8",
    borderRadius: 8,
    overflow: "hidden",
  },
  grupoHeader: {
    background: "#eaf3fb",
    padding: "8px 14px",
    borderBottom: "1px solid #d0dce8",
  },
  grupoLabel: {
    fontWeight: 700,
    fontSize: 13,
    color: "#0f4c75",
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
  },
  modulosGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "6px 16px",
    padding: "10px 14px",
  },
  moduloItem: {
    fontSize: 13,
    color: "#2c3e50",
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
  },
};
