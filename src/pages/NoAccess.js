import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/authContext";
import { FaLock, FaArrowLeft, FaHome, FaSignOutAlt } from "react-icons/fa";

const HOME_POR_ROL = {
  admin:   "/Admin",
  caja:    "/Caja",
  usuario: "/Usuario",
  cliente: "/Cliente",
};

export default function NoAccess() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const irAlInicio = () => {
    const home = HOME_POR_ROL[user?.rol?.toLowerCase()];
    navigate(home ?? "/login");
  };

  const cerrarSesion = () => {
    logout();
    navigate("/login");
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.iconBox}>
          <FaLock size={36} color="#c0392b" />
        </div>

        <h1 style={s.titulo}>Acceso denegado</h1>
        <p style={s.texto}>
          No tienes permisos para ver esta página.
          {user?.Nombre && (
            <> Contacta al administrador si crees que esto es un error, <strong>{user.Nombre}</strong>.</>
          )}
        </p>

        <div style={s.botones}>
          <button style={s.btnBack} onClick={() => navigate(-1)}>
            <FaArrowLeft style={{ marginRight: 7 }} />
            Regresar
          </button>

          <button style={s.btnHome} onClick={irAlInicio}>
            <FaHome style={{ marginRight: 7 }} />
            Ir al inicio
          </button>

          <button style={s.btnLogout} onClick={cerrarSesion}>
            <FaSignOutAlt style={{ marginRight: 7 }} />
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f0f4f8",
    padding: 24,
  },
  card: {
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
    padding: "48px 40px",
    maxWidth: 440,
    width: "100%",
    textAlign: "center",
  },
  iconBox: {
    background: "#fdecea",
    borderRadius: "50%",
    width: 72,
    height: 72,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 24px",
  },
  titulo: {
    fontSize: 24,
    fontWeight: 700,
    color: "#1a1a2e",
    margin: "0 0 12px",
  },
  texto: {
    fontSize: 15,
    color: "#555",
    lineHeight: 1.6,
    margin: "0 0 32px",
  },
  botones: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  btnBack: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "11px 20px",
    borderRadius: 8,
    border: "1.5px solid #d0dce8",
    background: "#fff",
    color: "#2c3e50",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  },
  btnHome: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "11px 20px",
    borderRadius: 8,
    border: "none",
    background: "#0f4c75",
    color: "#fff",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  },
  btnLogout: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "11px 20px",
    borderRadius: 8,
    border: "none",
    background: "#c0392b",
    color: "#fff",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  },
};
