import React, { useEffect, useState, useContext } from "react";
import Swal from "sweetalert2";
import { AuthContext } from "../context/authContext";
import { FaFileContract, FaCheckCircle, FaExclamationCircle, FaInbox } from "react-icons/fa";

import { API } from "../Api/api.config";

const API_SELECT_CONTRATOS = API.SELECT_WHERE;
const API_ADEUDOS_GET      = API.GET_ADEUDOS;

export default function ClienteHome() {
  const { user } = useContext(AuthContext);

  const [contratos, setContratos] = useState([]);
  const [adeudos, setAdeudos] = useState([]);
  const [loadingContratos, setLoadingContratos] = useState(true);
  const [loadingAdeudos, setLoadingAdeudos] = useState(true);

  useEffect(() => {
    if (!user?.id_usuario) return;
    setLoadingContratos(true);
    fetch(API_SELECT_CONTRATOS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        select: "id_contrato, num_contrato, Fecha_contrato",
        table: "contratos",
        column: "id_usuario",
        id: user.id_usuario,
      }),
    })
      .then((res) => res.json())
      .then((data) => setContratos(!data.error && Array.isArray(data) ? data : []))
      .catch(() => setContratos([]))
      .finally(() => setLoadingContratos(false));
  }, [user]);

  useEffect(() => {
    if (!user?.id_usuario || contratos.length === 0) {
      setAdeudos([]);
      setLoadingAdeudos(false);
      return;
    }
    const cargarAdeudos = async () => {
      setLoadingAdeudos(true);
      try {
        let todos = [];
        for (const contrato of contratos) {
          const res = await fetch(API_ADEUDOS_GET, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_usuario: user.id_usuario, id_contrato: contrato.id_contrato }),
          });
          const data = await res.json();
          if (!data.error && Array.isArray(data))
            todos.push(...data.map((a) => ({ ...a, id_contrato: contrato.id_contrato })));
        }
        setAdeudos(todos);
      } catch { setAdeudos([]); }
      finally { setLoadingAdeudos(false); }
    };
    cargarAdeudos();
  }, [user, contratos]);

  useEffect(() => {
    if (adeudos.length === 0) return;
    const pendientes = adeudos.filter((a) => a.estado === "pendiente");
    if (pendientes.length > 0) {
      Swal.fire({
        icon: "warning",
        title: "Tienes adeudos pendientes",
        text: `Tienes ${pendientes.length} año(s) pendiente(s) por pagar.`,
        confirmButtonColor: "#d33",
      });
    }
  }, [adeudos]);

  if (!user) {
    return <div style={pageStyle}><p style={{ color: "#777" }}>Debes iniciar sesión.</p></div>;
  }

  const totalPendientes = adeudos.filter((a) => a.estado === "pendiente").length;
  const totalPagados    = adeudos.filter((a) => a.estado === "pagado").length;

  return (
    <div style={pageStyle}>
      {/* Saludo */}
      <div style={greetingCard}>
        <h1 style={greetingTitle}>
          Bienvenido(a), {user.Nombre} {user.Apellido_pat}
        </h1>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.85)", fontSize: 14 }}>
          Comité del Agua de San Gaspar Tlahuelilpan
        </p>
      </div>

      {/* Resumen */}
      <div style={summaryRow}>
        <div style={{ ...summaryCard, borderColor: "#e74c3c" }}>
          <FaExclamationCircle style={{ color: "#e74c3c", fontSize: 22 }} />
          <div>
            <div style={summaryNum}>{totalPendientes}</div>
            <div style={summaryLabel}>Pendiente(s)</div>
          </div>
        </div>
        <div style={{ ...summaryCard, borderColor: "#27ae60" }}>
          <FaCheckCircle style={{ color: "#27ae60", fontSize: 22 }} />
          <div>
            <div style={summaryNum}>{totalPagados}</div>
            <div style={summaryLabel}>Pagado(s)</div>
          </div>
        </div>
        <div style={{ ...summaryCard, borderColor: "#0f4c75" }}>
          <FaFileContract style={{ color: "#0f4c75", fontSize: 22 }} />
          <div>
            <div style={summaryNum}>{contratos.length}</div>
            <div style={summaryLabel}>Contrato(s)</div>
          </div>
        </div>
      </div>

      {/* Contratos */}
      <h2 style={sectionTitle}>Mis Contratos</h2>

      {loadingContratos && <p style={muted}>Cargando contratos...</p>}

      {!loadingContratos && contratos.length === 0 && (
        <div style={emptyBox}>
          <FaInbox style={{ fontSize: 32, color: "#bbb", marginBottom: 8 }} />
          <p style={muted}>No tienes contratos registrados.</p>
        </div>
      )}

      {!loadingContratos && contratos.map((contrato) => {
        const adeudosContrato = adeudos.filter((a) => a.id_contrato === contrato.id_contrato);
        const pendientes = adeudosContrato.filter((a) => a.estado === "pendiente");
        const pagados    = adeudosContrato.filter((a) => a.estado === "pagado");

        return (
          <div key={contrato.id_contrato} style={contratoCard}>
            <div style={contratoHeader}>
              <FaFileContract style={{ color: "#0f4c75" }} />
              <span style={contratoNum}>Contrato {contrato.num_contrato || `#${contrato.id_contrato}`}</span>
              {contrato.Fecha_contrato && (
                <span style={contratoFecha}>{contrato.Fecha_contrato}</span>
              )}
            </div>

            {loadingAdeudos && <p style={muted}>Cargando adeudos...</p>}

            {!loadingAdeudos && adeudosContrato.length === 0 && (
              <p style={muted}>Sin adeudos registrados.</p>
            )}

            {!loadingAdeudos && (pendientes.length > 0 || pagados.length > 0) && (
              <div style={adeudoGrid}>
                {pendientes.length > 0 && (
                  <div style={adeudoGroup}>
                    <div style={groupTitle}>
                      <FaExclamationCircle style={{ color: "#e74c3c" }} />
                      <span style={{ color: "#e74c3c" }}>Pendientes</span>
                    </div>
                    <div style={chipRow}>
                      {pendientes.map((a) => (
                        <span key={a.id_adeudo} style={{ ...chip, background: "#fdecea", color: "#c0392b", border: "1px solid #f5b7b1" }}>
                          {a.anio}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {pagados.length > 0 && (
                  <div style={adeudoGroup}>
                    <div style={groupTitle}>
                      <FaCheckCircle style={{ color: "#27ae60" }} />
                      <span style={{ color: "#27ae60" }}>Pagados</span>
                    </div>
                    <div style={chipRow}>
                      {pagados.map((a) => (
                        <span key={a.id_adeudo} style={{ ...chip, background: "#eafaf1", color: "#1e8449", border: "1px solid #a9dfbf" }}>
                          {a.anio}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Styles ── */
const pageStyle = {
  maxWidth: 860,
  margin: "32px auto",
  padding: "0 clamp(12px, 4vw, 20px)",
};

const greetingCard = {
  background: "linear-gradient(135deg, #0f4c75 0%, #1a6090 100%)",
  borderRadius: 14,
  padding: "clamp(20px, 5vw, 28px) clamp(20px, 5vw, 32px)",
  marginBottom: 24,
  boxShadow: "0 4px 18px rgba(15,76,117,0.25)",
};

const greetingTitle = {
  margin: 0,
  color: "white",
  fontSize: "clamp(18px, 4vw, 24px)",
  fontWeight: 700,
  marginBottom: 6,
};

const summaryRow = {
  display: "flex",
  gap: 16,
  flexWrap: "wrap",
  marginBottom: 28,
};

const summaryCard = {
  flex: "1 1 140px",
  background: "white",
  borderRadius: 12,
  padding: "16px 20px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  borderLeft: "4px solid #ccc",
  display: "flex",
  alignItems: "center",
  gap: 14,
};

const summaryNum = {
  fontSize: 26,
  fontWeight: 700,
  color: "#1a1a2e",
  lineHeight: 1,
};

const summaryLabel = {
  fontSize: 12,
  color: "#777",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginTop: 2,
};

const sectionTitle = {
  fontSize: "clamp(16px, 3.5vw, 20px)",
  fontWeight: 700,
  color: "#0f4c75",
  marginBottom: 16,
  paddingBottom: 10,
  borderBottom: "2px solid #e8eef4",
};

const muted = { color: "#999", fontSize: 14, margin: "8px 0" };

const emptyBox = {
  textAlign: "center",
  padding: "40px 20px",
  background: "white",
  borderRadius: 12,
  boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
};

const contratoCard = {
  background: "white",
  borderRadius: 12,
  padding: "18px 20px",
  marginBottom: 16,
  boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
  borderTop: "3px solid #0f4c75",
};

const contratoHeader = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 14,
  flexWrap: "wrap",
};

const contratoNum = {
  fontWeight: 700,
  fontSize: 16,
  color: "#0f4c75",
  flex: 1,
};

const contratoFecha = {
  fontSize: 12,
  color: "#888",
  background: "#f0f4f8",
  padding: "2px 10px",
  borderRadius: 20,
};

const adeudoGrid = {
  display: "flex",
  gap: 20,
  flexWrap: "wrap",
};

const adeudoGroup = {
  flex: "1 1 180px",
};

const groupTitle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontWeight: 600,
  fontSize: 13,
  marginBottom: 8,
};

const chipRow = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
};

const chip = {
  fontSize: 12,
  fontWeight: 600,
  padding: "3px 10px",
  borderRadius: 20,
};
