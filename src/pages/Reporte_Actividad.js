import { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  FaMoneyBillWave, FaArrowDown, FaHandHoldingUsd,
  FaFileContract, FaFileExcel, FaSearch, FaClock,
} from "react-icons/fa";
import { API } from "../Api/api.config";
import { apiFetch } from "../Api/apiFetch";

const fmt = (n) => `$${Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

const TIPOS = {
  pago:        { label: "Pago anual",       color: "#27ae60", bg: "#eafaf1", icon: <FaMoneyBillWave /> },
  aportacion:  { label: "Aportación vol.",  color: "#2980b9", bg: "#eaf3fb", icon: <FaHandHoldingUsd /> },
  salida:      { label: "Salida/Gasto",     color: "#e74c3c", bg: "#fdecea", icon: <FaArrowDown /> },
  contrato:    { label: "Contrato nuevo",   color: "#8e44ad", bg: "#f5eef8", icon: <FaFileContract /> },
};

export default function ReporteActividad() {
  const [pagos,        setPagos]        = useState([]);
  const [salidas,      setSalidas]      = useState([]);
  const [aportaciones, setAportaciones] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [busqueda,     setBusqueda]     = useState("");
  const [filtroTipo,   setFiltroTipo]   = useState("todos");

  const load = (select, table, orderBy) =>
    apiFetch(API.SELECT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ select, table, orderBy }),
    }).then((r) => r.json()).then((d) => (!d.error ? d : [])).catch(() => []);

  useEffect(() => {
    Promise.all([
      apiFetch(API.SELECT_JOIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          select: `p.anio_pago, p.fecha_registro AS fecha, p.monto_pago AS monto, p.metodo_pago AS metodo,
                   CONCAT_WS(" ", u.Nombre, u.Apellido_pat) AS nombre, c.num_contrato AS contrato`,
          table:  `pagos p LEFT JOIN usuarios u ON p.id_usuario = u.id_usuario
                   LEFT JOIN contratos c ON p.id_contrato = c.id_contrato`,
          where:  "p.status = 1",
          orderBy:"p.fecha_registro DESC",
        }),
      }).then((r) => r.json()).then((d) => (!d.error ? d : [])).catch(() => []),

      load("idsalidas, descripcion AS nombre, monto, fecha, autoriza AS metodo", "salidas", "fecha DESC"),

      apiFetch(API.SELECT_JOIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          select: `av.fecha_aportacion AS fecha, av.monto, av.metodo,
                   CONCAT_WS(" ", u.Nombre, u.Apellido_pat) AS nombre, c.num_contrato AS contrato`,
          table:  `aportacion_voluntaria av
                   LEFT JOIN usuarios u ON av.id_usuario = u.id_usuario
                   LEFT JOIN contratos c ON av.id_contrato = c.id_contrato`,
          where:  "av.status = 1",
          orderBy:"av.fecha_aportacion DESC",
        }),
      }).then((r) => r.json()).then((d) => (!d.error ? d : [])).catch(() => []),
    ]).then(([p, s, a]) => {
      setPagos(p);
      setSalidas(s);
      setAportaciones(a);
      setLoading(false);
    });
  }, []);

  /* ─── Unificar y ordenar ─── */
  const actividad = useMemo(() => {
    const lista = [
      ...pagos.map((r) => ({
        tipo: "pago",
        fecha: r.fecha,
        descripcion: `Pago ${r.anio_pago ?? ""} — ${r.nombre ?? ""}`,
        detalle: r.contrato ?? "—",
        monto: r.monto,
        metodo: r.metodo,
      })),
      ...salidas.map((r) => ({
        tipo: "salida",
        fecha: r.fecha,
        descripcion: r.nombre ?? "Salida",
        detalle: `Autoriza: ${r.metodo ?? "—"}`,
        monto: r.monto,
        metodo: "—",
      })),
      ...aportaciones.map((r) => ({
        tipo: "aportacion",
        fecha: r.fecha,
        descripcion: `Aportación — ${r.nombre ?? ""}`,
        detalle: r.contrato ?? "—",
        monto: r.monto,
        metodo: r.metodo,
      })),
    ]
      .filter((r) => r.fecha)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      .slice(0, 100);

    return lista;
  }, [pagos, salidas, aportaciones]);

  /* ─── Filtros ─── */
  const filtrada = useMemo(() => {
    const q = busqueda.toLowerCase();
    return actividad.filter((r) => {
      const matchTipo = filtroTipo === "todos" || r.tipo === filtroTipo;
      const matchQ    = !q || r.descripcion.toLowerCase().includes(q) || r.detalle?.toLowerCase().includes(q);
      return matchTipo && matchQ;
    });
  }, [actividad, busqueda, filtroTipo]);

  /* ─── KPIs ─── */
  const totalIngresos   = [...pagos, ...aportaciones].reduce((s, r) => s + (parseFloat(r.monto) || 0), 0);
  const totalEgresos    = salidas.reduce((s, r) => s + (parseFloat(r.monto) || 0), 0);

  /* ─── Exportar ─── */
  const exportExcel = () => {
    const rows = filtrada.map((r) => ({
      Tipo:        TIPOS[r.tipo]?.label,
      Fecha:       r.fecha,
      Descripción: r.descripcion,
      Detalle:     r.detalle,
      Monto:       r.monto,
      Método:      r.metodo,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Actividad");
    saveAs(new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })],
      { type: "application/octet-stream" }), "actividad_reciente.xlsx");
  };

  const fmtFecha = (f) => {
    if (!f) return "—";
    try { return new Date(f).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }); }
    catch { return f; }
  };

  return (
    <div style={page}>
      {/* Header */}
      <div style={headerRow}>
        <div>
          <h1 style={headerTitle}><FaClock style={{ marginRight: 10 }} />Actividad Reciente</h1>
          <p style={muted}>Últimos 100 movimientos del sistema</p>
        </div>
        <button style={btnExcel} onClick={exportExcel} disabled={loading}>
          <FaFileExcel style={{ marginRight: 6 }} /> Exportar Excel
        </button>
      </div>

      {loading && <p style={muted}>Cargando movimientos...</p>}

      {!loading && (
        <>
          {/* KPIs */}
          <div style={kpiRow}>
            <div style={{ ...kpiCard, borderColor: "#27ae60" }}>
              <FaMoneyBillWave style={{ color: "#27ae60", fontSize: 20 }} />
              <div>
                <div style={kpiNum}>{fmt(totalIngresos)}</div>
                <div style={kpiLabel}>Total ingresos registrados</div>
              </div>
            </div>
            <div style={{ ...kpiCard, borderColor: "#e74c3c" }}>
              <FaArrowDown style={{ color: "#e74c3c", fontSize: 20 }} />
              <div>
                <div style={kpiNum}>{fmt(totalEgresos)}</div>
                <div style={kpiLabel}>Total egresos registrados</div>
              </div>
            </div>
            <div style={{ ...kpiCard, borderColor: "#0f4c75" }}>
              <FaClock style={{ color: "#0f4c75", fontSize: 20 }} />
              <div>
                <div style={kpiNum}>{actividad.length}</div>
                <div style={kpiLabel}>Movimientos totales</div>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div style={filterRow}>
            <div style={searchBox}>
              <FaSearch style={{ color: "#aaa", marginRight: 8, flexShrink: 0 }} />
              <input style={searchInput} placeholder="Buscar..." value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)} />
            </div>
            <div style={chipRow}>
              {[["todos","Todos"],["pago","Pagos"],["aportacion","Aportaciones"],["salida","Salidas"]].map(([k, l]) => (
                <button key={k} onClick={() => setFiltroTipo(k)}
                  style={{ ...chip, ...(filtroTipo === k ? chipActive : {}) }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div style={timelineWrap}>
            {filtrada.length === 0 && (
              <p style={{ ...muted, textAlign: "center", padding: 30 }}>Sin movimientos</p>
            )}
            {filtrada.map((r, i) => {
              const t = TIPOS[r.tipo] ?? TIPOS.pago;
              return (
                <div key={i} style={timelineItem}>
                  <div style={{ ...iconBox, background: t.bg, color: t.color }}>{t.icon}</div>
                  <div style={itemBody}>
                    <div style={itemTop}>
                      <span style={{ ...badge, background: t.bg, color: t.color, border: `1px solid ${t.color}33` }}>
                        {t.label}
                      </span>
                      <span style={itemFecha}>{fmtFecha(r.fecha)}</span>
                    </div>
                    <div style={itemDesc}>{r.descripcion}</div>
                    {r.detalle && <div style={itemSub}>{r.detalle}</div>}
                  </div>
                  <div style={{ ...itemMonto, color: r.tipo === "salida" ? "#e74c3c" : "#27ae60" }}>
                    {r.tipo === "salida" ? "-" : "+"}{fmt(r.monto ?? 0)}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Styles ── */
const page       = { maxWidth: 960, margin: "24px auto", padding: "0 clamp(12px,4vw,20px)" };
const headerRow  = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 20 };
const headerTitle = { margin: 0, fontSize: "clamp(18px,4vw,24px)", fontWeight: 700, color: "#0f4c75", display: "flex", alignItems: "center" };
const muted      = { color: "#999", fontSize: 13 };

const kpiRow  = { display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20 };
const kpiCard = { flex: "1 1 180px", background: "white", borderRadius: 12, padding: "14px 18px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", borderLeft: "4px solid #ccc", display: "flex", alignItems: "center", gap: 12 };
const kpiNum  = { fontSize: 20, fontWeight: 700, color: "#1a1a2e", lineHeight: 1 };
const kpiLabel = { fontSize: 11, color: "#777", textTransform: "uppercase", letterSpacing: "0.4px", marginTop: 3 };

const filterRow  = { display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16, alignItems: "center" };
const searchBox  = { display: "flex", alignItems: "center", background: "white", border: "1.5px solid #d0d7e0", borderRadius: 8, padding: "8px 14px", flex: "1 1 200px" };
const searchInput = { border: "none", outline: "none", flex: 1, fontSize: 14, fontFamily: "inherit" };
const chipRow    = { display: "flex", gap: 6, flexWrap: "wrap" };
const chip       = { padding: "6px 14px", borderRadius: 20, border: "1.5px solid #d0d7e0", background: "white", cursor: "pointer", fontSize: 12, fontWeight: 500, color: "#555" };
const chipActive = { background: "#0f4c75", color: "white", borderColor: "#0f4c75" };

const timelineWrap = { background: "white", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", overflow: "hidden" };
const timelineItem = { display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: "1px solid #f0f4f8" };
const iconBox      = { width: 38, height: 38, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 15 };
const itemBody     = { flex: 1, minWidth: 0 };
const itemTop      = { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 };
const badge        = { fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20 };
const itemFecha    = { fontSize: 11, color: "#aaa" };
const itemDesc     = { fontSize: 14, fontWeight: 500, color: "#222", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const itemSub      = { fontSize: 12, color: "#888", marginTop: 1 };
const itemMonto    = { fontWeight: 700, fontSize: 14, flexShrink: 0, whiteSpace: "nowrap" };

const btnExcel = { display: "flex", alignItems: "center", padding: "9px 16px", background: "#1a7a4a", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 };
