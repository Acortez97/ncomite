import { useEffect, useState, useContext } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { AuthContext } from "../context/authContext";
import { FaMoneyBillWave, FaArrowDown, FaWallet, FaFileExcel, FaFilePdf, FaFilter, FaCashRegister } from "react-icons/fa";
import { apiFetch } from "../Api/apiFetch";

export default function AdminHome() {
  const { user } = useContext(AuthContext);
  const [chartData, setChartData]       = useState([]);
  const [filteredChart, setFilteredChart] = useState([]);
  const [details, setDetails]           = useState(null);
  const [tableData, setTableData]       = useState([]);
  const [year, setYear]                 = useState("");
  const [month, setMonth]               = useState("");
  const [yearsMulti, setYearsMulti]     = useState([]);
  const [monthsMulti, setMonthsMulti]   = useState([]);
  const [loading, setLoading]           = useState(true);

  const meses = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
  ];

  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = 2018; y <= currentYear; y++) years.push(y);

  const fetchDashboard = async (params = {}) => {
    const response = await apiFetch("/api/dashboard/GeneralDashboard.php", {
      method: "POST",
      body: JSON.stringify(params)
    });
    return await response.json();
  };

  useEffect(() => { loadGeneral(); }, []);

  const loadGeneral = async () => {
    setLoading(true);
    const data = await fetchDashboard();
    setChartData(data.categorias);
    setDetails(data.detalles);
    setTableData(data.tabla);
    setLoading(false);
  };

  const loadFiltered = async () => {
    setLoading(true);
    const data = await fetchDashboard({ year, month });
    setFilteredChart(data.categorias);
    setDetails(data.detalles);
    setTableData(data.tabla);
    setLoading(false);
  };

  const loadCorteCaja = async () => {
    setLoading(true);
    const data = await fetchDashboard({ years: yearsMulti, months: monthsMulti });
    setFilteredChart(data.categorias);
    setDetails(data.detalles);
    setTableData(data.tabla);
    setLoading(false);
  };

  const exportExcel = () => {
    if (tableData.length === 0) return alert("No hay datos para exportar");
    const ws = XLSX.utils.json_to_sheet(tableData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte");
    XLSX.writeFile(wb, "reporte_financiero.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Reporte Financiero – Comité del Agua", 14, 15);
    const tabla = tableData.map(row => [row.tipo, row.fecha, row.anio ?? "", `$${row.monto}`]);
    doc.autoTable({ head: [["Tipo","Fecha","Año","Monto"]], body: tabla, startY: 25 });
    doc.save("reporte_financiero.pdf");
  };

  const toggleYear  = (y) => setYearsMulti(prev  => prev.includes(y)  ? prev.filter(a => a !== y)  : [...prev, y]);
  const toggleMonth = (m) => setMonthsMulti(prev => prev.includes(m) ? prev.filter(a => a !== m) : [...prev, m]);

  return (
    <div style={s.page}>

      {/* ── ENCABEZADO ── */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Dashboard Financiero</h1>
          <p style={s.subtitle}>Bienvenido, {user?.nombre || "Administrador"}</p>
        </div>
      </div>

      {/* ── CARDS KPI ── */}
      {loading ? (
        <div style={s.loadingBox}>Cargando datos...</div>
      ) : details && (
        <div style={s.cards}>
          <div style={{ ...s.card, borderTop: "4px solid #2ecc71" }}>
            <FaMoneyBillWave size={28} color="#2ecc71" />
            <div style={s.cardLabel}>Ingresos</div>
            <div style={{ ...s.cardValue, color: "#2ecc71" }}>
              ${Number(details.ingresos).toLocaleString("es-MX")}
            </div>
          </div>

          <div style={{ ...s.card, borderTop: "4px solid #e74c3c" }}>
            <FaArrowDown size={28} color="#e74c3c" />
            <div style={s.cardLabel}>Salidas</div>
            <div style={{ ...s.cardValue, color: "#e74c3c" }}>
              ${Number(details.salidas).toLocaleString("es-MX")}
            </div>
          </div>

          <div style={{ ...s.card, borderTop: "4px solid #3498db" }}>
            <FaWallet size={28} color="#3498db" />
            <div style={s.cardLabel}>Balance</div>
            <div style={{ ...s.cardValue, color: "#3498db" }}>
              ${Number(details.restante).toLocaleString("es-MX")}
            </div>
          </div>
        </div>
      )}

      {/* ── GRÁFICA GENERAL ── */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}>Resumen General</h2>
        <div style={s.chartBox}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `$${Number(v).toLocaleString("es-MX")}`} />
              <Legend />
              <Bar dataKey="monto" fill="#3498db" radius={[4,4,0,0]} name="Monto" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── FILTRO POR AÑO / MES ── */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}><FaFilter style={{ marginRight: 8 }} />Filtrar por Año y Mes</h2>
        <div style={s.filterRow}>
          <select style={s.select} value={year} onChange={e => setYear(e.target.value)}>
            <option value="">Todos los años</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          <select style={s.select} value={month} onChange={e => setMonth(e.target.value)}>
            <option value="">Todos los meses</option>
            {meses.map((m, idx) => <option key={idx} value={idx + 1}>{m}</option>)}
          </select>

          <button style={s.btnPrimary} onClick={loadFiltered}>Consultar</button>
        </div>

        {filteredChart.length > 0 && (
          <div style={s.chartBox}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={filteredChart} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => `$${Number(v).toLocaleString("es-MX")}`} />
                <Legend />
                <Bar dataKey="monto" fill="#2ecc71" radius={[4,4,0,0]} name="Monto" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── CORTE DE CAJA ── */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}><FaCashRegister style={{ marginRight: 8 }} />Corte de Caja</h2>
        <p style={s.hint}>Selecciona uno o varios años y meses para el corte</p>

        <div style={s.chipGroup}>
          <span style={s.chipLabel}>Años:</span>
          {years.map(y => (
            <button
              key={y}
              onClick={() => toggleYear(y)}
              style={yearsMulti.includes(y) ? s.chipActive : s.chip}
            >
              {y}
            </button>
          ))}
        </div>

        <div style={{ ...s.chipGroup, marginTop: 10 }}>
          <span style={s.chipLabel}>Meses:</span>
          {meses.map((m, idx) => (
            <button
              key={idx}
              onClick={() => toggleMonth(idx + 1)}
              style={monthsMulti.includes(idx + 1) ? s.chipActive : s.chip}
            >
              {m}
            </button>
          ))}
        </div>

        <button style={{ ...s.btnPrimary, marginTop: 16 }} onClick={loadCorteCaja}>
          Generar Corte
        </button>
      </div>

      {/* ── TABLA DETALLADA ── */}
      <div style={s.section}>
        <div style={s.tableHeader}>
          <h2 style={{ ...s.sectionTitle, margin: 0 }}>Detalle de Movimientos</h2>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={s.btnExcel} onClick={exportExcel}>
              <FaFileExcel style={{ marginRight: 6 }} />Excel
            </button>
            <button style={s.btnPdf} onClick={exportPDF}>
              <FaFilePdf style={{ marginRight: 6 }} />PDF
            </button>
          </div>
        </div>

        <div style={s.tableWrapper}>
          <table style={s.table}>
            <thead>
              <tr>
                {["Tipo","Fecha","Año","Monto"].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.length === 0 ? (
                <tr><td colSpan={4} style={s.tdEmpty}>Sin registros</td></tr>
              ) : tableData.map((row, i) => (
                <tr key={i} style={i % 2 === 0 ? {} : { background: "#f8faff" }}>
                  <td style={s.td}>
                    <span style={{
                      ...s.badge,
                      background: row.tipo === "Pago" ? "#d4edda" : row.tipo === "Salida" ? "#f8d7da" : "#d1ecf1",
                      color:      row.tipo === "Pago" ? "#155724" : row.tipo === "Salida" ? "#721c24" : "#0c5460",
                    }}>
                      {row.tipo}
                    </span>
                  </td>
                  <td style={s.td}>{row.fecha}</td>
                  <td style={s.td}>{row.anio ?? "—"}</td>
                  <td style={{ ...s.td, fontWeight: 600 }}>
                    ${Number(row.monto).toLocaleString("es-MX")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

/* ── ESTILOS ── */
const s = {
  page: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "clamp(12px, 3vw, 24px) clamp(10px, 3vw, 20px)",
  },
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: "2px solid #e8eef4",
  },
  title: {
    fontSize: 26,
    fontWeight: 700,
    color: "#0f4c75",
    margin: 0,
  },
  subtitle: {
    color: "#666",
    marginTop: 4,
    fontSize: 14,
  },
  loadingBox: {
    textAlign: "center",
    padding: 40,
    color: "#888",
    fontSize: 15,
  },
  cards: {
    display: "flex",
    gap: 16,
    marginBottom: 28,
    flexWrap: "wrap",
  },
  card: {
    flex: "1 1 160px",
    minWidth: 0,
    background: "#fff",
    padding: "16px 20px",
    borderRadius: 12,
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  cardLabel: {
    fontSize: 13,
    color: "#888",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  cardValue: {
    fontSize: "clamp(20px, 4vw, 26px)",
    fontWeight: 700,
  },
  section: {
    background: "#fff",
    borderRadius: 12,
    padding: "clamp(14px, 3vw, 20px) clamp(12px, 3vw, 24px)",
    marginBottom: 20,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: "#0f4c75",
    marginBottom: 16,
    display: "flex",
    alignItems: "center",
  },
  chartBox: {
    marginTop: 12,
  },
  filterRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "center",
  },
  select: {
    padding: "9px 12px",
    borderRadius: 8,
    border: "1px solid #d0d7e0",
    fontSize: 14,
    background: "#f8faff",
    cursor: "pointer",
    minWidth: 160,
  },
  btnPrimary: {
    padding: "9px 20px",
    background: "#0f4c75",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    display: "flex",
    alignItems: "center",
  },
  hint: {
    fontSize: 13,
    color: "#888",
    marginBottom: 14,
  },
  chipGroup: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: "#555",
    marginRight: 4,
  },
  chip: {
    padding: "5px 12px",
    border: "1px solid #d0d7e0",
    borderRadius: 20,
    cursor: "pointer",
    background: "#f8faff",
    fontSize: 13,
    fontWeight: 500,
  },
  chipActive: {
    padding: "5px 12px",
    borderRadius: 20,
    cursor: "pointer",
    background: "#0f4c75",
    color: "#fff",
    border: "1px solid #0f4c75",
    fontSize: 13,
    fontWeight: 500,
  },
  tableHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    flexWrap: "wrap",
    gap: 10,
  },
  tableWrapper: {
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 14,
  },
  th: {
    background: "#0f4c75",
    color: "#fff",
    padding: "10px 14px",
    textAlign: "left",
    fontWeight: 600,
    fontSize: 13,
  },
  td: {
    padding: "10px 14px",
    borderBottom: "1px solid #edf0f5",
    color: "#333",
  },
  tdEmpty: {
    padding: 30,
    textAlign: "center",
    color: "#aaa",
  },
  badge: {
    padding: "3px 10px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
  },
  btnExcel: {
    padding: "8px 16px",
    background: "#27ae60",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
    display: "flex",
    alignItems: "center",
  },
  btnPdf: {
    padding: "8px 16px",
    background: "#c0392b",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
    display: "flex",
    alignItems: "center",
  },
};
