import { useState, useEffect, useContext, useMemo } from "react";
import { AuthContext } from "../context/authContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  FaMoneyBillWave, FaFileExcel, FaSearch, FaInbox,
} from "react-icons/fa";
import { API } from "../Api/api.config";
import { apiFetch } from "../Api/apiFetch";

const fmt = (n) => `$${Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

export default function ClienteHistorialPagos() {
  const { user } = useContext(AuthContext);
  const [pagos,    setPagos]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    if (!user?.id_usuario) return;

    apiFetch(API.SELECT_JOIN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        select:  `p.anio_pago, p.fecha_registro AS fecha, p.monto_pago AS monto,
                  p.metodo_pago AS metodo, p.observaciones, c.num_contrato AS contrato`,
        table:   `pagos p LEFT JOIN contratos c ON p.id_contrato = c.id_contrato`,
        where:   `p.id_usuario = ${user.id_usuario} AND p.status = 1`,
        orderBy: "p.fecha_registro DESC",
      }),
    })
      .then((r) => r.json())
      .then((d) => { if (!d.error) setPagos(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase();
    return pagos.filter((p) =>
      !q ||
      p.contrato?.toLowerCase().includes(q) ||
      String(p.anio_pago).includes(q) ||
      p.metodo?.toLowerCase().includes(q) ||
      p.fecha?.toLowerCase().includes(q)
    );
  }, [pagos, busqueda]);

  const totalPagado = pagos.reduce((s, p) => s + (parseFloat(p.monto) || 0), 0);

  const exportExcel = () => {
    const rows = filtrados.map((p) => ({
      Fecha:    p.fecha,
      Contrato: p.contrato,
      "Año pago": p.anio_pago,
      Monto:    p.monto,
      Método:   p.metodo,
      Observaciones: p.observaciones,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pagos");
    saveAs(new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })],
      { type: "application/octet-stream" }), "historial_pagos.xlsx");
  };

  const fmtFecha = (f) => {
    if (!f) return "—";
    try { return new Date(f).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }); }
    catch { return f; }
  };

  if (!user) return <div style={page}><p style={muted}>Debes iniciar sesión.</p></div>;

  return (
    <div style={page}>
      {/* Header */}
      <div style={headerCard}>
        <div>
          <h1 style={headerTitle}>Historial de Pagos</h1>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.8)", fontSize: 13 }}>
            {user.Nombre} {user.Apellido_pat}
          </p>
        </div>
        <button style={btnExcel} onClick={exportExcel} disabled={loading || !pagos.length}>
          <FaFileExcel style={{ marginRight: 6 }} /> Exportar Excel
        </button>
      </div>

      {/* KPI */}
      <div style={kpiRow}>
        <div style={{ ...kpiCard, borderColor: "#27ae60" }}>
          <FaMoneyBillWave style={{ color: "#27ae60", fontSize: 22 }} />
          <div>
            <div style={{ ...kpiNum, color: "#27ae60" }}>{fmt(totalPagado)}</div>
            <div style={kpiLabel}>Total pagado</div>
          </div>
        </div>
        <div style={{ ...kpiCard, borderColor: "#0f4c75" }}>
          <FaMoneyBillWave style={{ color: "#0f4c75", fontSize: 22 }} />
          <div>
            <div style={kpiNum}>{pagos.length}</div>
            <div style={kpiLabel}>Pagos registrados</div>
          </div>
        </div>
      </div>

      {loading && <p style={muted}>Cargando historial...</p>}

      {!loading && (
        <>
          {/* Buscador */}
          <div style={searchBox}>
            <FaSearch style={{ color: "#aaa", marginRight: 8 }} />
            <input style={searchInput} placeholder="Buscar por contrato, año o método..."
              value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>

          {/* Tabla */}
          {pagos.length === 0 ? (
            <div style={emptyBox}>
              <FaInbox style={{ fontSize: 32, color: "#bbb", marginBottom: 8 }} />
              <p style={muted}>No tienes pagos registrados.</p>
            </div>
          ) : (
            <div style={{ background: "white", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={tbl}>
                  <thead>
                    <tr style={{ background: "#0f4c75" }}>
                      <th style={th}>Fecha</th>
                      <th style={th}>Contrato</th>
                      <th style={th}>Año pago</th>
                      <th style={th}>Monto</th>
                      <th style={th}>Método</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.length === 0 && (
                      <tr><td colSpan={5} style={{ ...td, textAlign: "center", color: "#aaa" }}>Sin resultados</td></tr>
                    )}
                    {filtrados.map((p, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8faff" }}>
                        <td style={td}>{fmtFecha(p.fecha)}</td>
                        <td style={td}>{p.contrato ?? "—"}</td>
                        <td style={{ ...td, textAlign: "center", fontWeight: 600 }}>{p.anio_pago}</td>
                        <td style={{ ...td, color: "#27ae60", fontWeight: 700 }}>{fmt(p.monto ?? 0)}</td>
                        <td style={td}>
                          <span style={badge}>{p.metodo ?? "—"}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Styles ── */
const page       = { maxWidth: 800, margin: "24px auto", padding: "0 clamp(12px,4vw,20px)" };
const headerCard = { background: "linear-gradient(135deg, #0f4c75 0%, #1a6090 100%)", borderRadius: 14, padding: "clamp(18px,4vw,26px) clamp(18px,4vw,30px)", marginBottom: 22, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", boxShadow: "0 4px 18px rgba(15,76,117,0.25)" };
const headerTitle = { margin: 0, color: "white", fontSize: "clamp(18px,4vw,22px)", fontWeight: 700 };

const kpiRow  = { display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 18 };
const kpiCard = { flex: "1 1 160px", background: "white", borderRadius: 12, padding: "14px 18px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", borderLeft: "4px solid #ccc", display: "flex", alignItems: "center", gap: 12 };
const kpiNum  = { fontSize: 22, fontWeight: 700, color: "#1a1a2e", lineHeight: 1 };
const kpiLabel = { fontSize: 11, color: "#777", textTransform: "uppercase", letterSpacing: "0.4px", marginTop: 3 };

const searchBox   = { display: "flex", alignItems: "center", background: "white", border: "1.5px solid #d0d7e0", borderRadius: 8, padding: "8px 14px", marginBottom: 14 };
const searchInput = { border: "none", outline: "none", flex: 1, fontSize: 14, fontFamily: "inherit" };

const tbl     = { width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 460 };
const th      = { color: "white", padding: "10px 14px", textAlign: "left", fontWeight: 600, fontSize: 12 };
const td      = { padding: "9px 14px", borderBottom: "1px solid #eef2f7" };
const badge   = { background: "#eaf3fb", color: "#0f4c75", border: "1px solid #bee3f8", borderRadius: 20, padding: "2px 9px", fontSize: 11, fontWeight: 600 };
const emptyBox = { textAlign: "center", padding: "40px 20px", background: "white", borderRadius: 12, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" };
const muted   = { color: "#999", fontSize: 13 };
const btnExcel = { display: "flex", alignItems: "center", padding: "9px 16px", background: "#1a7a4a", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 };
