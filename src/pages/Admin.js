import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function AdminHome() {
  const [chartData, setChartData] = useState([]);
  const [filteredChart, setFilteredChart] = useState([]);
  const [details, setDetails] = useState(null);
  const [tableData, setTableData] = useState([]);

  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");

  const [yearsMulti, setYearsMulti] = useState([]);
  const [monthsMulti, setMonthsMulti] = useState([]);

  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  // generar años desde 2018 hasta hoy
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = 2018; y <= currentYear; y++) years.push(y);

  // --------------------------------------------
  // API FETCH GENÉRICO
  // --------------------------------------------
  const fetchDashboard = async (params = {}) => {
    const response = await fetch("/api/dashboard/GeneralDashboard.php", {
      method: "POST",
      body: JSON.stringify(params)
    });
    return await response.json();
  };

  // cargar general al inicio
  useEffect(() => {
    loadGeneral();
  }, []);

  const loadGeneral = async () => {
    const data = await fetchDashboard();
    setChartData(data.categorias);
    setDetails(data.detalles);
    setTableData(data.tabla);
  };

  const loadFiltered = async () => {
    const data = await fetchDashboard({
      year,
      month
    });
    setFilteredChart(data.categorias);
    setDetails(data.detalles);
    setTableData(data.tabla);
  };

  const loadCorteCaja = async () => {
    const data = await fetchDashboard({
      years: yearsMulti,
      months: monthsMulti
    });

    setFilteredChart(data.categorias);
    setDetails(data.detalles);
    setTableData(data.tabla);
  };

  // --------------------------------------------
  // EXPORTAR EXCEL
  // --------------------------------------------
  const exportExcel = () => {
    if (tableData.length === 0) return alert("No hay datos para exportar");

    const ws = XLSX.utils.json_to_sheet(tableData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte");

    XLSX.writeFile(wb, "reporte_financiero.xlsx");
  };

  // --------------------------------------------
  // EXPORTAR PDF
  // --------------------------------------------
  const exportPDF = () => {
    const doc = new jsPDF();

    doc.text("Reporte Financiero", 14, 15);

    const tabla = tableData.map(row => [
      row.tipo,
      row.fecha,
      row.anio ?? "",
      row.monto
    ]);

    doc.autoTable({
      head: [["Tipo", "Fecha", "Año", "Monto"]],
      body: tabla,
      startY: 25
    });

    doc.save("reporte_financiero.pdf");
  };

  // --------------------------------------------
  // FUNCIONES AUXILIARES
  // --------------------------------------------
  const toggleYear = (y) => {
    if (yearsMulti.includes(y)) {
      setYearsMulti(yearsMulti.filter(a => a !== y));
    } else {
      setYearsMulti([...yearsMulti, y]);
    }
  };

  const toggleMonth = (m) => {
    if (monthsMulti.includes(m)) {
      setMonthsMulti(monthsMulti.filter(a => a !== m));
    } else {
      setMonthsMulti([...monthsMulti, m]);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Bienvenido Administrador</h1>
      <p>Dashboard financiero del sistema de agua</p>

      {/* ------------------------ CARDS ------------------------ */}
      {details && (
        <div style={styles.cards}>
          <div style={styles.card}>Ingresos: ${details.ingresos}</div>
          <div style={styles.card}>Salidas: ${details.salidas}</div>
          <div style={styles.card}>Restante: ${details.restante}</div>
        </div>
      )}

      {/* ------------------------ GRÁFICA GENERAL ------------------------ */}
      <h2>Resumen General</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3"/>
          <XAxis dataKey="name"/>
          <YAxis/>
          <Tooltip/>
          <Legend/>
          <Bar dataKey="monto" fill="#4a90e2"/>
        </BarChart>
      </ResponsiveContainer>

      {/* ------------------------ FILTRO SIMPLE ------------------------ */}
      <h2>Filtrar por año y mes</h2>

      <div style={styles.filters}>
        <select value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="">Todos los años</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <select value={month} onChange={(e) => setMonth(e.target.value)}>
          <option value="">Todos los meses</option>
          {meses.map((m, idx) => (
            <option key={idx} value={idx + 1}>{m}</option>
          ))}
        </select>

        <button onClick={loadFiltered}>Consultar</button>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={filteredChart}>
          <CartesianGrid strokeDasharray="3 3"/>
          <XAxis dataKey="name"/>
          <YAxis/>
          <Tooltip/>
          <Legend/>
          <Bar dataKey="monto" fill="#70c27a"/>
        </BarChart>
      </ResponsiveContainer>

      {/* ------------------------ CORTE DE CAJA ------------------------ */}
      <h2>Corte de Caja (Años y Meses múltiples)</h2>

      <div style={{ marginBottom: "20px" }}>
        <h4>Años</h4>
        <div style={styles.multiSelect}>
          {years.map((y) => (
            <button
              key={y}
              onClick={() => toggleYear(y)}
              style={yearsMulti.includes(y) ? styles.btnActive : styles.btn}
            >
              {y}
            </button>
          ))}
        </div>

        <h4>Meses</h4>
        <div style={styles.multiSelect}>
          {meses.map((m, idx) => (
            <button
              key={idx}
              onClick={() => toggleMonth(idx + 1)}
              style={monthsMulti.includes(idx + 1) ? styles.btnActive : styles.btn}
            >
              {m}
            </button>
          ))}
        </div>

        <button style={styles.buttonPrimary} onClick={loadCorteCaja}>
          Consultar Corte de Caja
        </button>
      </div>

      {/* ------------------------ TABLA DETALLADA ------------------------ */}
      <h2>Tabla Detallada</h2>

      <button style={styles.excelBtn} onClick={exportExcel}>Descargar Excel</button>
      <button style={styles.pdfBtn} onClick={exportPDF}>Descargar PDF</button>

      <table style={styles.table}>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Fecha</th>
            <th>Año</th>
            <th>Monto</th>
          </tr>
        </thead>

        <tbody>
          {tableData.map((row, i) => (
            <tr key={i}>
              <td>{row.tipo}</td>
              <td>{row.fecha}</td>
              <td>{row.anio}</td>
              <td>${row.monto}</td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}

/* ------------------------ ESTILOS ------------------------ */
const styles = {
  cards: {
    display: "flex",
    gap: "20px",
    marginBottom: "20px"
  },
  card: {
    flex: 1,
    background: "#e8f0fe",
    padding: "20px",
    borderRadius: "10px",
    fontSize: "18px",
    textAlign: "center",
    fontWeight: "bold"
  },
  filters: {
    display: "flex",
    gap: "20px",
    marginBottom: "20px"
  },
  multiSelect: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "15px"
  },
  btn: {
    padding: "8px 15px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    cursor: "pointer",
    background: "#f8f8f8"
  },
  btnActive: {
    padding: "8px 15px",
    borderRadius: "8px",
    cursor: "pointer",
    background: "#4a90e2",
    color: "white",
    border: "1px solid #4a90e2"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "20px"
  },
  excelBtn: {
    background: "green",
    color: "white",
    padding: "10px 20px",
    marginRight: "10px",
    borderRadius: "5px",
    cursor: "pointer"
  },
  pdfBtn: {
    background: "red",
    color: "white",
    padding: "10px 20px",
    borderRadius: "5px",
    cursor: "pointer"
  },
  buttonPrimary: {
    padding: "10px 20px",
    background: "#4a90e2",
    color: "white",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    marginTop: "10px"
  }
};