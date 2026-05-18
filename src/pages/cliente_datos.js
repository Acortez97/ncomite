import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/authContext";
import Swal from "sweetalert2";
import {
  FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaFileContract, FaIdCard,
} from "react-icons/fa";

import { API } from "../Api/api.config";

const API_SELECT_USUARIO   = API.SELECT_WHERE;
const API_SELECT_CONTRATOS = API.SELECT_WHERE;

export default function ClientePerfil() {
  const { user } = useContext(AuthContext);

  const [infoUsuario, setInfoUsuario] = useState(null);
  const [contratos, setContratos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id_usuario) return;

    const cargarDatos = async () => {
      try {
        setLoading(true);

        const resUsuario = await fetch(API_SELECT_USUARIO, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            select: "id_usuario, Nombre, Apellido_pat, Apellido_mat, domicilio, num_celular, correo",
            table: "usuarios",
            column: "id_usuario",
            id: user.id_usuario,
          }),
        });
        const dataUsuario = await resUsuario.json();
        if (!dataUsuario.error && dataUsuario.length > 0) setInfoUsuario(dataUsuario[0]);

        const resContratos = await fetch(API_SELECT_CONTRATOS, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            select: "id_contrato, num_contrato",
            table: "contratos",
            column: "id_usuario",
            id: user.id_usuario,
          }),
        });
        const dataContratos = await resContratos.json();
        if (!dataContratos.error) setContratos(dataContratos);
      } catch {
        Swal.fire("Error", "No se pudo cargar la información", "error");
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [user]);

  if (!user) {
    return <div style={pageStyle}><p style={muted}>Debes iniciar sesión.</p></div>;
  }

  if (loading) {
    return <div style={pageStyle}><p style={muted}>Cargando información...</p></div>;
  }

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerCard}>
        <div style={avatarCircle}>
          <FaUser style={{ fontSize: 28, color: "white" }} />
        </div>
        <div>
          <h1 style={headerName}>
            {infoUsuario
              ? `${infoUsuario.Nombre} ${infoUsuario.Apellido_pat} ${infoUsuario.Apellido_mat || ""}`.trim()
              : user.Nombre}
          </h1>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.8)", fontSize: 13 }}>
            Perfil de cliente
          </p>
        </div>
      </div>

      {/* Info personal */}
      {infoUsuario && (
        <section style={section}>
          <h2 style={sectionTitle}>
            <FaIdCard style={{ marginRight: 8, verticalAlign: "middle" }} />
            Información Personal
          </h2>
          <div style={infoGrid}>
            <InfoRow icon={<FaUser />}          label="Nombre completo"
              value={`${infoUsuario.Nombre} ${infoUsuario.Apellido_pat} ${infoUsuario.Apellido_mat || ""}`.trim()} />
            <InfoRow icon={<FaMapMarkerAlt />}  label="Dirección"
              value={infoUsuario.domicilio || "No registrada"} />
            <InfoRow icon={<FaPhone />}         label="Teléfono"
              value={infoUsuario.num_celular || "No registrado"} />
            <InfoRow icon={<FaEnvelope />}      label="Correo electrónico"
              value={infoUsuario.correo || "No registrado"} />
          </div>
        </section>
      )}

      {/* Contratos */}
      <section style={section}>
        <h2 style={sectionTitle}>
          <FaFileContract style={{ marginRight: 8, verticalAlign: "middle" }} />
          Mis Contratos
        </h2>

        {contratos.length === 0 ? (
          <p style={muted}>No tienes contratos registrados.</p>
        ) : (
          <div style={contratoGrid}>
            {contratos.map((c) => (
              <div key={c.id_contrato} style={contratoChip}>
                <FaFileContract style={{ color: "#0f4c75", marginRight: 6 }} />
                <span style={{ fontWeight: 600, color: "#0f4c75" }}>
                  {c.num_contrato || `#${c.id_contrato}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={infoRow}>
      <div style={infoIcon}>{icon}</div>
      <div>
        <div style={infoLabel}>{label}</div>
        <div style={infoValue}>{value}</div>
      </div>
    </div>
  );
}

/* ── Styles ── */
const pageStyle = {
  maxWidth: 720,
  margin: "32px auto",
  padding: "0 clamp(12px, 4vw, 20px)",
};

const headerCard = {
  background: "linear-gradient(135deg, #0f4c75 0%, #1a6090 100%)",
  borderRadius: 14,
  padding: "clamp(20px, 5vw, 28px) clamp(20px, 5vw, 32px)",
  marginBottom: 24,
  display: "flex",
  alignItems: "center",
  gap: 20,
  boxShadow: "0 4px 18px rgba(15,76,117,0.25)",
  flexWrap: "wrap",
};

const avatarCircle = {
  width: 64,
  height: 64,
  borderRadius: "50%",
  background: "rgba(255,255,255,0.2)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const headerName = {
  margin: 0,
  color: "white",
  fontSize: "clamp(17px, 4vw, 22px)",
  fontWeight: 700,
};

const section = {
  background: "white",
  borderRadius: 12,
  padding: "clamp(16px, 4vw, 24px)",
  marginBottom: 20,
  boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
};

const sectionTitle = {
  fontSize: "clamp(14px, 3vw, 17px)",
  fontWeight: 700,
  color: "#0f4c75",
  margin: "0 0 16px 0",
  paddingBottom: 12,
  borderBottom: "2px solid #e8eef4",
};

const infoGrid = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const infoRow = {
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
};

const infoIcon = {
  color: "#0f4c75",
  fontSize: 16,
  marginTop: 3,
  flexShrink: 0,
};

const infoLabel = {
  fontSize: 11,
  fontWeight: 700,
  color: "#888",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginBottom: 2,
};

const infoValue = {
  fontSize: 15,
  color: "#222",
};

const contratoGrid = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
};

const contratoChip = {
  display: "flex",
  alignItems: "center",
  background: "#eaf3fb",
  border: "1.5px solid #bee3f8",
  borderRadius: 8,
  padding: "8px 16px",
  fontSize: 14,
};

const muted = { color: "#999", fontSize: 14 };
