import { useState, useEffect } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  FaArrowUp, FaArrowDown, FaBalanceScale, FaFileExcel, FaChartBar,
} from "react-icons/fa";
import { API } from "../Api/api.config";

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const MESES_FULL = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const fmt = (n) => `$${Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

export default function ReporteFlujoCaja() {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2017 }, (_, i) => 2018 + i);

  const [year, setYear]       = useState(currentYear);
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async (y) => {
    setLoading(true);
    try {
      const res = await fetch(API.DASHBOARD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: y }),
      });
      const json = await res.json();
      setData(json);
    } catch { setData(null); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(year); }, [year]);

  /* ─── Construir datos mensuales ─── */
  const buildMonthly = () => {
    const byMonth = MESES.map((mes) => ({ mes, ingresos: 0, egresos: 0, balance: 0 }));
    data?.tabla?.forEach((row) => {
      const m = new Date(row.fecha).getMonth();
      if (m < 0 || m > 11) return;
      if (row.tipo === "salida") byMonth[m].egresos += parseFloat(row.monto) || 0;
      else                       byMonth[m].ingresos += parseFloat(row.monto) || 0;
    });
    let acum = 0;
    return byMonth.map((m) => { acum += m.ingresos - m.egresos; return { ...m, balance: acum }; });
  };

  const monthly         = data ? buildMonthly() : [];
  const totalIngresos   = data?.detalles?.totalIngresos  ?? 0;
  const totalEgresos    = data?.detalles?.totalEgresos   ?? 0;
  const balance         = data?.detalles?.balance        ?? 0;

  /* ─── Exportar Excel ─── */
  const exportExcel = () => {
    const rows = monthly.map((m, i) => ({
      Mes:        MESES_FULL[i],
      Ingresos:   m.ingresos,
      Egresos:    m.egresos,
      Diferencia: m.ingresos - m.egresos,
      "Balance acumulado": m.balance,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Flujo ${year}`);
    saveAs(new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })],
      { type: "application/octet-stream" }), `flujo_caja_${year}.xlsx`);
  };

  /* ─── Tooltip personalizado ─── */
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={tooltip}>
        <strong style={{ color: "#0f4c75" }}>{label}</strong>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color, fontSize: 13, marginTop: 3 }}>
            {p.name}: {fmt(p.value)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={page}>
      {/* Header */}
      <div style={header}>
        <div>
          <h1 style={headerTitle}><FaChartBar style={{ marginRight: 10 }} />Flujo de Caja</h1>
          <p style={headerSub}>Ingresos vs Egresos mensuales</p>
        </div>
        <button style={btnExcel} onClick={exportExcel} disabled={!data}>
          <FaFileExcel style={{ marginRight: 6 }} /> Exportar Excel
        </button>
      </div>

      {/* Selector de año */}
      <div style={chipRow}>
        {years.map((y) => (
          <button key={y} onClick={() => setYear(y)}
            style={{ ...chip, ...(year === y ? chipActive : {}) }}>
            {y}
          </button>
        ))}
      </div>

      {loading && <p style={muted}>Cargando datos...</p>}

      {!loading && data && (
        <>
          {/* KPIs */}
          <div style={kpiRow}>
            <div style={{ ...kpiCard, borderColor: "#27ae60" }}>
              <FaArrowUp style={{ color: "#27ae60", fontSize: 22 }} />
              <div>
                <div style={kpiNum}>{fmt(totalIngresos)}</div>
                <div style={kpiLabel}>Total Ingresos {year}</div>
              </div>
            </div>
            <div style={{ ...kpiCard, borderColor: "#e74c3c" }}>
              <FaArrowDown style={{ color: "#e74c3c", fontSize: 22 }} />
              <div>
                <div style={kpiNum}>{fmt(totalEgresos)}</div>
                <div style={kpiLabel}>Total Egresos {year}</div>
              </div>
            </div>
            <div style={{ ...kpiCard, borderColor: balance >= 0 ? "#0f4c75" : "#c0392b" }}>
              <FaBalanceScale style={{ color: balance >= 0 ? "#0f4c75" : "#c0392b", fontSize: 22 }} />
              <div>
                <div style={{ ...kpiNum, color: balance >= 0 ? "#0f4c75" : "#c0392b" }}>{fmt(balance)}</div>
                <div style={kpiLabel}>Balance Neto</div>
              </div>
            </div>
          </div>

          {/* Gráfica */}
          <div style={chartCard}>
            <h3 style={chartTitle}>Ingresos vs Egresos — {year}</h3>
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={monthly} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="ingresos" name="Ingresos" fill="#27ae60" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="egresos"  name="Egresos"  fill="#e74c3c" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Line dataKey="balance" name="Balance acumulado" type="monotone"
                  stroke="#0f4c75" strokeWidth={2.5} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Tabla mensual */}
          <div style={tableCard}>
            <h3 style={chartTitle}>Detalle Mensual — {year}</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={tbl}>
                <thead>
                  <tr style={{ background: "#0f4c75" }}>
                    {["Mes","Ingresos","Egresos","Diferencia","Balance acumulado"].map((h) => (
                      <th key={h} style={th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {monthly.map((m, i) => {
                    const diff = m.ingresos - m.egresos;
                    return (
                      <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8faff" }}>
                        <td style={td}>{MESES_FULL[i]}</td>
                        <td style={{ ...td, color: "#27ae60", fontWeight: 600 }}>{fmt(m.ingresos)}</td>
                        <td style={{ ...td, color: "#e74c3c", fontWeight: 600 }}>{fmt(m.egresos)}</td>
                        <td style={{ ...td, color: diff >= 0 ? "#27ae60" : "#e74c3c", fontWeight: 700 }}>
                          {diff >= 0 ? "+" : ""}{fmt(diff)}
                        </td>
                        <td style={{ ...td, color: m.balance >= 0 ? "#0f4c75" : "#c0392b", fontWeight: 700 }}>
                          {fmt(m.balance)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!loading && !data && (
        <p style={{ ...muted, textAlign: "center", marginTop: 40 }}>No se pudo cargar la información.</p>
      )}
    </div>
  );
}

/* ── Styles ── */
const page    = { maxWidth: 1000, margin: "24px auto", padding: "0 clamp(12px,4vw,20px)" };
const header  = { display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 };
const headerTitle = { margin: 0, fontSize: "clamp(18px,4vw,24px)", fontWeight: 700, color: "#0f4c75", display: "flex", alignItems: "center" };
const headerSub   = { margin: "4px 0 0", color: "#888", fontSize: 13 };

const chipRow  = { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 };
const chip     = { padding: "6px 14px", borderRadius: 20, border: "1.5px solid #c0d0e0", background: "white", cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#555" };
const chipActive = { background: "#0f4c75", color: "white", borderColor: "#0f4c75", fontWeight: 700 };

const kpiRow  = { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 };
const kpiCard = { flex: "1 1 180px", background: "white", borderRadius: 12, padding: "16px 20px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", borderLeft: "4px solid #ccc", display: "flex", alignItems: "center", gap: 14 };
const kpiNum  = { fontSize: 22, fontWeight: 700, color: "#1a1a2e", lineHeight: 1 };
const kpiLabel = { fontSize: 11, color: "#777", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 4 };

const chartCard = { background: "white", borderRadius: 12, padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginBottom: 20 };
const chartTitle = { margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#0f4c75" };
const tableCard = { background: "white", borderRadius: 12, padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginBottom: 24 };

const tbl = { width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 520 };
const th  = { color: "white", padding: "10px 14px", textAlign: "left", fontWeight: 600, fontSize: 12 };
const td  = { padding: "9px 14px", borderBottom: "1px solid #eef2f7" };

const btnExcel = { display: "flex", alignItems: "center", padding: "9px 16px", background: "#1a7a4a", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 };
const muted = { color: "#999", fontSize: 14 };
const tooltip = { background: "white", border: "1px solid #e0e8f0", borderRadius: 8, padding: "10px 14px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" };
