import { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  FaExclamationTriangle, FaCheckCircle, FaUserSlash, FaFileExcel, FaSearch,
} from "react-icons/fa";
import { API } from "../Api/api.config";

const fmt  = (n) => `$${Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
const COLORS = ["#e74c3c","#e67e22","#f1c40f","#2ecc71","#3498db","#9b59b6"];

export default function ReporteAdeudos() {
  const [adeudos,   setAdeudos]   = useState([]);
  const [contratos, setContratos] = useState([]);
  const [usuarios,  setUsuarios]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [busqueda,  setBusqueda]  = useState("");
  const [tab,       setTab]       = useState("deudores"); // deudores | corriente | sinContrato

  const load = (select, table) =>
    fetch(API.SELECT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ select, table }),
    }).then((r) => r.json()).then((d) => (!d.error ? d : [])).catch(() => []);

  useEffect(() => {
    Promise.all([
      load("*", "adeudos"),
      load("id_contrato, id_usuario, num_contrato", "contratos"),
      load("id_usuario, Nombre, Apellido_pat, Apellido_mat", "usuarios"),
    ]).then(([a, c, u]) => {
      setAdeudos(a);
      setContratos(c);
      setUsuarios(u);
      setLoading(false);
    });
  }, []);

  /* ─── Joins client-side ─── */
  const datos = useMemo(() => {
    return adeudos.map((a) => {
      const c = contratos.find((x) => String(x.id_contrato) === String(a.id_contrato));
      const u = c ? usuarios.find((x) => String(x.id_usuario) === String(c.id_usuario)) : null;
      return {
        ...a,
        num_contrato: c?.num_contrato ?? "—",
        nombre: u ? `${u.Nombre} ${u.Apellido_pat} ${u.Apellido_mat ?? ""}`.trim() : "Sin usuario",
      };
    });
  }, [adeudos, contratos, usuarios]);

  /* ─── KPIs ─── */
  const pendientes = datos.filter((d) => d.estado === "pendiente");
  const pagados    = datos.filter((d) => d.estado === "pagado");

  const contratosConPendiente = [...new Set(pendientes.map((d) => d.id_contrato))].length;
  const contratosAlCorriente  = contratos.filter((c) =>
    !adeudos.some((a) => String(a.id_contrato) === String(c.id_contrato) && a.estado === "pendiente")
  ).length;

  const usuariosConContrato = [...new Set(contratos.map((c) => c.id_usuario))];
  const usuariosSinContrato = usuarios.filter(
    (u) => !usuariosConContrato.includes(String(u.id_usuario)) && !usuariosConContrato.includes(u.id_usuario)
  );

  /* ─── Adeudos por año ─── */
  const porAnio = useMemo(() => {
    const mapa = {};
    pendientes.forEach((d) => {
      mapa[d.anio] = (mapa[d.anio] || 0) + 1;
    });
    return Object.entries(mapa)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([anio, cantidad]) => ({ anio, cantidad }));
  }, [pendientes]);

  /* ─── Top deudores ─── */
  const topDeudores = useMemo(() => {
    const mapa = {};
    pendientes.forEach((d) => {
      if (!mapa[d.id_contrato]) mapa[d.id_contrato] = { ...d, count: 0 };
      mapa[d.id_contrato].count++;
    });
    return Object.values(mapa)
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [pendientes]);

  /* ─── Contratos al corriente ─── */
  const corriente = useMemo(() => {
    return contratos
      .filter((c) =>
        !adeudos.some((a) => String(a.id_contrato) === String(c.id_contrato) && a.estado === "pendiente")
      )
      .map((c) => {
        const u = usuarios.find((x) => String(x.id_usuario) === String(c.id_usuario));
        return {
          ...c,
          nombre: u ? `${u.Nombre} ${u.Apellido_pat} ${u.Apellido_mat ?? ""}`.trim() : "Sin usuario",
        };
      });
  }, [contratos, adeudos, usuarios]);

  /* ─── Filtrado por búsqueda ─── */
  const q = busqueda.toLowerCase();
  const deudoresFiltrados = topDeudores.filter((d) =>
    d.nombre.toLowerCase().includes(q) || d.num_contrato.toLowerCase().includes(q)
  );
  const corrienteFiltrados = corriente.filter((d) =>
    d.nombre.toLowerCase().includes(q) || d.num_contrato?.toLowerCase().includes(q)
  );
  const sinContratoFiltrados = usuariosSinContrato.filter((u) =>
    `${u.Nombre} ${u.Apellido_pat}`.toLowerCase().includes(q)
  );

  /* ─── Exportar Excel ─── */
  const exportExcel = () => {
    const rows = topDeudores.map((d) => ({
      Nombre:          d.nombre,
      Contrato:        d.num_contrato,
      "Años pendientes": d.count,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Top Deudores");
    saveAs(new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })],
      { type: "application/octet-stream" }), "reporte_adeudos.xlsx");
  };

  return (
    <div style={page}>
      {/* Header */}
      <div style={headerRow}>
        <div>
          <h1 style={headerTitle}><FaExclamationTriangle style={{ marginRight: 10, color: "#e74c3c" }} />Reporte de Adeudos</h1>
          <p style={muted}>Estado de cuentas por contrato</p>
        </div>
        <button style={btnExcel} onClick={exportExcel} disabled={loading}>
          <FaFileExcel style={{ marginRight: 6 }} /> Exportar Excel
        </button>
      </div>

      {loading && <p style={muted}>Cargando datos...</p>}

      {!loading && (
        <>
          {/* KPIs */}
          <div style={kpiRow}>
            <KpiCard color="#e74c3c" label="Contratos con adeudos" value={contratosConPendiente} icon={<FaExclamationTriangle />} />
            <KpiCard color="#27ae60" label="Contratos al corriente" value={contratosAlCorriente} icon={<FaCheckCircle />} />
            <KpiCard color="#e67e22" label="Años pendientes (total)" value={pendientes.length} icon={<FaExclamationTriangle />} />
            <KpiCard color="#95a5a6" label="Usuarios sin contrato" value={usuariosSinContrato.length} icon={<FaUserSlash />} />
          </div>

          {/* Gráfica por año */}
          <div style={card}>
            <h3 style={cardTitle}>Adeudos pendientes por año</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={porAnio} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="anio" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v} contratos`, "Pendientes"]} />
                <Bar dataKey="cantidad" radius={[4,4,0,0]} maxBarSize={50}>
                  {porAnio.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tabs */}
          <div style={tabRow}>
            {[
              { key: "deudores",    label: `Top deudores (${topDeudores.length})` },
              { key: "corriente",   label: `Al corriente (${corriente.length})` },
              { key: "sinContrato", label: `Sin contrato (${usuariosSinContrato.length})` },
            ].map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{ ...tabBtn, ...(tab === t.key ? tabBtnActive : {}) }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Buscador */}
          <div style={searchRow}>
            <FaSearch style={{ color: "#aaa", marginRight: 8 }} />
            <input
              style={searchInput}
              placeholder="Buscar por nombre o contrato..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          {/* Tabla: Top deudores */}
          {tab === "deudores" && (
            <div style={{ overflowX: "auto" }}>
              <table style={tbl}>
                <thead><tr style={{ background: "#0f4c75" }}>
                  <th style={th}>#</th>
                  <th style={th}>Nombre</th>
                  <th style={th}>Contrato</th>
                  <th style={th}>Años pendientes</th>
                  <th style={th}>Años adeudados</th>
                </tr></thead>
                <tbody>
                  {deudoresFiltrados.length === 0 && (
                    <tr><td colSpan={5} style={{ ...td, textAlign: "center", color: "#aaa" }}>Sin resultados</td></tr>
                  )}
                  {deudoresFiltrados.map((d, i) => {
                    const anios = datos.filter((x) => x.id_contrato === d.id_contrato && x.estado === "pendiente").map((x) => x.anio);
                    return (
                      <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fdf8f8" }}>
                        <td style={td}>{i + 1}</td>
                        <td style={{ ...td, fontWeight: 500 }}>{d.nombre}</td>
                        <td style={td}>{d.num_contrato}</td>
                        <td style={{ ...td, textAlign: "center" }}>
                          <span style={badgeRed}>{d.count}</span>
                        </td>
                        <td style={{ ...td, fontSize: 12, color: "#888" }}>{anios.join(", ")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Tabla: Al corriente */}
          {tab === "corriente" && (
            <div style={{ overflowX: "auto" }}>
              <table style={tbl}>
                <thead><tr style={{ background: "#0f4c75" }}>
                  <th style={th}>#</th><th style={th}>Nombre</th><th style={th}>Contrato</th>
                </tr></thead>
                <tbody>
                  {corrienteFiltrados.length === 0 && (
                    <tr><td colSpan={3} style={{ ...td, textAlign: "center", color: "#aaa" }}>Sin resultados</td></tr>
                  )}
                  {corrienteFiltrados.map((d, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f0fdf4" }}>
                      <td style={td}>{i + 1}</td>
                      <td style={{ ...td, fontWeight: 500 }}>{d.nombre}</td>
                      <td style={td}>{d.num_contrato}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tabla: Sin contrato */}
          {tab === "sinContrato" && (
            <div style={{ overflowX: "auto" }}>
              <table style={tbl}>
                <thead><tr style={{ background: "#0f4c75" }}>
                  <th style={th}>#</th><th style={th}>Nombre completo</th>
                </tr></thead>
                <tbody>
                  {sinContratoFiltrados.length === 0 && (
                    <tr><td colSpan={2} style={{ ...td, textAlign: "center", color: "#aaa" }}>Sin resultados</td></tr>
                  )}
                  {sinContratoFiltrados.map((u, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8f8ff" }}>
                      <td style={td}>{i + 1}</td>
                      <td style={{ ...td, fontWeight: 500 }}>
                        {u.Nombre} {u.Apellido_pat} {u.Apellido_mat ?? ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function KpiCard({ color, label, value, icon }) {
  return (
    <div style={{ ...kpiCard, borderColor: color }}>
      <span style={{ color, fontSize: 22 }}>{icon}</span>
      <div>
        <div style={kpiNum}>{value}</div>
        <div style={kpiLabel}>{label}</div>
      </div>
    </div>
  );
}

/* ── Styles ── */
const page       = { maxWidth: 1000, margin: "24px auto", padding: "0 clamp(12px,4vw,20px)" };
const headerRow  = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 20 };
const headerTitle = { margin: 0, fontSize: "clamp(18px,4vw,24px)", fontWeight: 700, color: "#0f4c75", display: "flex", alignItems: "center" };
const muted      = { color: "#999", fontSize: 13 };

const kpiRow  = { display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 22 };
const kpiCard = { flex: "1 1 160px", background: "white", borderRadius: 12, padding: "14px 18px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", borderLeft: "4px solid #ccc", display: "flex", alignItems: "center", gap: 12 };
const kpiNum  = { fontSize: 26, fontWeight: 700, color: "#1a1a2e", lineHeight: 1 };
const kpiLabel = { fontSize: 11, color: "#777", textTransform: "uppercase", letterSpacing: "0.4px", marginTop: 3 };

const card      = { background: "white", borderRadius: 12, padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginBottom: 20 };
const cardTitle = { margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#0f4c75" };

const tabRow  = { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 };
const tabBtn  = { padding: "8px 16px", borderRadius: 8, border: "1.5px solid #d0d7e0", background: "white", cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#555" };
const tabBtnActive = { background: "#0f4c75", color: "white", borderColor: "#0f4c75", fontWeight: 700 };

const searchRow   = { display: "flex", alignItems: "center", background: "white", border: "1.5px solid #d0d7e0", borderRadius: 8, padding: "8px 14px", marginBottom: 14 };
const searchInput = { border: "none", outline: "none", flex: 1, fontSize: 14, fontFamily: "inherit" };

const tbl     = { width: "100%", borderCollapse: "collapse", fontSize: 13, background: "white", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.07)", minWidth: 400 };
const th      = { color: "white", padding: "10px 14px", textAlign: "left", fontWeight: 600, fontSize: 12 };
const td      = { padding: "9px 14px", borderBottom: "1px solid #eef2f7" };
const badgeRed = { background: "#fdecea", color: "#c0392b", border: "1px solid #f5b7b1", borderRadius: 20, padding: "2px 10px", fontWeight: 700, fontSize: 12 };

const btnExcel = { display: "flex", alignItems: "center", padding: "9px 16px", background: "#1a7a4a", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 };
