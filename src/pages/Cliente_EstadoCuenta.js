import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/authContext";
import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  FaFileContract, FaCheckCircle, FaExclamationCircle,
  FaFilePdf, FaInbox,
} from "react-icons/fa";
import { API } from "../Api/api.config";

const fmt = (n) => `$${Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

export default function ClienteEstadoCuenta() {
  const { user } = useContext(AuthContext);

  const [contratos,      setContratos]      = useState([]);
  const [adeudos,        setAdeudos]        = useState([]);
  const [loading,        setLoading]        = useState(true);

  useEffect(() => {
    if (!user?.id_usuario) return;

    Promise.all([
      fetch(API.SELECT_WHERE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          select: "id_contrato, num_contrato, Fecha_contrato, respon_comite",
          table:  "contratos",
          column: "id_usuario",
          id:     user.id_usuario,
        }),
      }).then((r) => r.json()).then((d) => (!d.error ? d : [])).catch(() => []),
    ]).then(([c]) => {
      setContratos(c);
      if (!c.length) { setLoading(false); return; }

      const fetches = c.map((contrato) =>
        fetch(API.GET_ADEUDOS, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_usuario: user.id_usuario, id_contrato: contrato.id_contrato }),
        }).then((r) => r.json()).then((d) =>
          (!d.error && Array.isArray(d)) ? d.map((a) => ({ ...a, id_contrato: contrato.id_contrato })) : []
        ).catch(() => [])
      );

      Promise.all(fetches).then((results) => {
        setAdeudos(results.flat());
        setLoading(false);
      });
    });
  }, [user]);

  /* ─── Resumen ─── */
  const pendientes   = adeudos.filter((a) => a.estado === "pendiente");
  const pagados      = adeudos.filter((a) => a.estado === "pagado");
  const montoPendiente = pendientes.reduce((s, a) => s + (parseFloat(a.monto) || 0), 0);

  /* ─── Generar PDF ─── */
  const generarPDF = () => {
    const doc = new jsPDF();
    const pw  = doc.internal.pageSize.getWidth();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Comité del Agua de San Gaspar Tlahuelilpan", pw / 2, 18, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Estado de Cuenta del Cliente", pw / 2, 25, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`Cliente: ${user.Nombre} ${user.Apellido_pat ?? ""}`, 14, 35);
    doc.setFont("helvetica", "normal");
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString("es-MX")}`, 14, 42);

    doc.setLineWidth(0.5);
    doc.line(14, 46, pw - 14, 46);

    let y = 54;
    contratos.forEach((c) => {
      const adeudosCont = adeudos.filter((a) => String(a.id_contrato) === String(c.id_contrato));
      const pend = adeudosCont.filter((a) => a.estado === "pendiente");
      const pag  = adeudosCont.filter((a) => a.estado === "pagado");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`Contrato: ${c.num_contrato ?? c.id_contrato}`, 14, y);
      y += 6;

      if (c.Fecha_contrato) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`Fecha: ${c.Fecha_contrato}   Responsable: ${c.respon_comite ?? "—"}`, 14, y);
        y += 6;
      }

      doc.autoTable({
        startY: y,
        head:   [["Año", "Estado", "Monto"]],
        body:   adeudosCont.map((a) => [
          a.anio,
          a.estado === "pendiente" ? "PENDIENTE" : "PAGADO",
          fmt(a.monto ?? 0),
        ]),
        headStyles:  { fillColor: [15, 76, 117] },
        alternateRowStyles: { fillColor: [248, 250, 255] },
        styles:      { fontSize: 9 },
        margin:      { left: 14, right: 14 },
      });

      y = doc.lastAutoTable.finalY + 8;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(192, 57, 43);
      doc.text(`Años pendientes: ${pend.length}   Años pagados: ${pag.length}`, 14, y);
      doc.setTextColor(0);
      y += 10;
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`TOTAL PENDIENTE DE PAGO: ${fmt(montoPendiente)}`, 14, y);

    doc.save(`estado_cuenta_${user.Nombre}.pdf`);
  };

  if (!user) return <div style={page}><p style={muted}>Debes iniciar sesión.</p></div>;

  return (
    <div style={page}>
      {/* Header */}
      <div style={headerCard}>
        <div>
          <h1 style={headerTitle}>Estado de Cuenta</h1>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.8)", fontSize: 13 }}>
            {user.Nombre} {user.Apellido_pat}
          </p>
        </div>
        <button style={btnPdf} onClick={generarPDF} disabled={loading || !contratos.length}>
          <FaFilePdf style={{ marginRight: 6 }} /> Descargar PDF
        </button>
      </div>

      {loading && <p style={muted}>Cargando información...</p>}

      {!loading && (
        <>
          {/* Resumen */}
          <div style={kpiRow}>
            <div style={{ ...kpiCard, borderColor: "#e74c3c" }}>
              <FaExclamationCircle style={{ color: "#e74c3c", fontSize: 22 }} />
              <div>
                <div style={{ ...kpiNum, color: "#e74c3c" }}>{pendientes.length}</div>
                <div style={kpiLabel}>Años pendientes</div>
              </div>
            </div>
            <div style={{ ...kpiCard, borderColor: "#27ae60" }}>
              <FaCheckCircle style={{ color: "#27ae60", fontSize: 22 }} />
              <div>
                <div style={{ ...kpiNum, color: "#27ae60" }}>{pagados.length}</div>
                <div style={kpiLabel}>Años pagados</div>
              </div>
            </div>
            <div style={{ ...kpiCard, borderColor: montoPendiente > 0 ? "#e74c3c" : "#27ae60" }}>
              <FaFileContract style={{ color: "#0f4c75", fontSize: 22 }} />
              <div>
                <div style={{ ...kpiNum, color: montoPendiente > 0 ? "#e74c3c" : "#27ae60" }}>
                  {fmt(montoPendiente)}
                </div>
                <div style={kpiLabel}>Total por pagar</div>
              </div>
            </div>
          </div>

          {/* Sin contratos */}
          {contratos.length === 0 && (
            <div style={emptyBox}>
              <FaInbox style={{ fontSize: 32, color: "#bbb", marginBottom: 8 }} />
              <p style={muted}>No tienes contratos registrados.</p>
            </div>
          )}

          {/* Contrato por contrato */}
          {contratos.map((c) => {
            const adeudosCont = adeudos.filter((a) => String(a.id_contrato) === String(c.id_contrato));
            const pend = adeudosCont.filter((a) => a.estado === "pendiente");
            const pag  = adeudosCont.filter((a) => a.estado === "pagado");

            return (
              <div key={c.id_contrato} style={contratoCard}>
                {/* Encabezado contrato */}
                <div style={contratoHeader}>
                  <FaFileContract style={{ color: "#0f4c75" }} />
                  <span style={contratoNum}>Contrato {c.num_contrato ?? `#${c.id_contrato}`}</span>
                  <span style={contratoFecha}>{c.Fecha_contrato ?? "Sin fecha"}</span>
                  {c.respon_comite && <span style={contratoResp}>{c.respon_comite}</span>}
                </div>

                {adeudosCont.length === 0 && <p style={muted}>Sin adeudos registrados.</p>}

                {/* Grid de años */}
                {adeudosCont.length > 0 && (
                  <div style={anioGrid}>
                    {adeudosCont
                      .sort((a, b) => Number(a.anio) - Number(b.anio))
                      .map((a) => (
                        <div key={a.id_adeudo}
                          style={{ ...anioChip, ...(a.estado === "pendiente" ? chipPend : chipPag) }}>
                          <div style={{ fontSize: 14, fontWeight: 700 }}>{a.anio}</div>
                          <div style={{ fontSize: 10, marginTop: 2 }}>
                            {a.estado === "pendiente" ? "Pendiente" : "Pagado"}
                          </div>
                          {a.monto && <div style={{ fontSize: 11, marginTop: 2 }}>{fmt(a.monto)}</div>}
                        </div>
                      ))}
                  </div>
                )}

                {/* Subtotales */}
                {adeudosCont.length > 0 && (
                  <div style={subtotal}>
                    <span style={{ color: "#e74c3c" }}>{pend.length} pendiente(s)</span>
                    <span style={{ color: "#27ae60" }}>{pag.length} pagado(s)</span>
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

/* ── Styles ── */
const page       = { maxWidth: 800, margin: "24px auto", padding: "0 clamp(12px,4vw,20px)" };
const headerCard = { background: "linear-gradient(135deg, #0f4c75 0%, #1a6090 100%)", borderRadius: 14, padding: "clamp(18px,4vw,26px) clamp(18px,4vw,30px)", marginBottom: 22, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", boxShadow: "0 4px 18px rgba(15,76,117,0.25)" };
const headerTitle = { margin: 0, color: "white", fontSize: "clamp(18px,4vw,22px)", fontWeight: 700 };

const kpiRow  = { display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20 };
const kpiCard = { flex: "1 1 160px", background: "white", borderRadius: 12, padding: "14px 18px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", borderLeft: "4px solid #ccc", display: "flex", alignItems: "center", gap: 12 };
const kpiNum  = { fontSize: 24, fontWeight: 700, lineHeight: 1 };
const kpiLabel = { fontSize: 11, color: "#777", textTransform: "uppercase", letterSpacing: "0.4px", marginTop: 3 };

const emptyBox   = { textAlign: "center", padding: "40px 20px", background: "white", borderRadius: 12, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" };
const contratoCard   = { background: "white", borderRadius: 12, padding: "18px 20px", marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", borderTop: "3px solid #0f4c75" };
const contratoHeader = { display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" };
const contratoNum    = { fontWeight: 700, fontSize: 15, color: "#0f4c75", flex: 1 };
const contratoFecha  = { fontSize: 12, color: "#888", background: "#f0f4f8", padding: "2px 10px", borderRadius: 20 };
const contratoResp   = { fontSize: 12, color: "#555", background: "#f5f0ff", padding: "2px 10px", borderRadius: 20 };

const anioGrid = { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 };
const anioChip = { width: 80, borderRadius: 10, padding: "10px 8px", textAlign: "center", border: "1.5px solid" };
const chipPend = { background: "#fdecea", color: "#c0392b", borderColor: "#f5b7b1" };
const chipPag  = { background: "#eafaf1", color: "#1e8449", borderColor: "#a9dfbf" };

const subtotal = { display: "flex", gap: 16, fontSize: 13, fontWeight: 600 };
const muted    = { color: "#999", fontSize: 13 };
const btnPdf   = { display: "flex", alignItems: "center", padding: "9px 16px", background: "#c0392b", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 };
