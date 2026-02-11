import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { jsPDF } from "jspdf";

/* ======= ENDPOINTS ======= */
const API_SELECT =
  "https://comitedeaguasangaspartl.com/api/Selectgeneric/Select_Gen.php";
const API_SELECT_WHERE =
  "https://comitedeaguasangaspartl.com/api/Selectgeneric/SelectWithWhere.php";
const API_INSERT =
  "https://comitedeaguasangaspartl.com/api/Insertgeneric/insert.php";

/* ============================================================
        VISTA PRINCIPAL: Registro de Pagos de Contratos
   ============================================================ */
export default function RegistroPagosContratos() {
  /* ======= States ======= */
  const [modo, setModo] = useState(""); // "nuevo" | "reposicion"
  const [usuarios, setUsuarios] = useState([]);
  const [contratos, setContratos] = useState([]);

  const [userSelect, setUserSelect] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const [contratoNuevo, setContratoNuevo] = useState("");
  const [contratoSeleccionado, setContratoSeleccionado] = useState("");

  const [monto, setMonto] = useState("");
  const [metodoPago, setMetodoPago] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const logoBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOoAAAD6CAMAAACYnCvnAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAALfUExURf////f392dmXggACBQQGTM5Pjk6Lt7e3Z+elbWztwAAAAgAABAIACIHABkIACcQABAAAHJ0ciEgIS0gEC8ZAEIhAFo5DWtCEGJCCGtCCGE8AGJCEGNCGVlbW1Y8GU4vC2tKDGs6AHNCCHtCCHNCAHxKA3NKAJCVl2tCGWU6CnNKCGtCAHM6AHtCAO/m7+/v7yEgC0xNJmFKF3NLE4mIiNTU2WtKGRIQDRAQABkQAFE6DXs6AHNCEistIRAICwgIAExMRXM6CCEgGYSDeGRRJhkAAD4tECwhALy9u8nJyQAIAKSleUtMMWJgQAgICE4tAAAACAAcKAIzSAI6VwAAEAAICIF8Uf/+1sDBrRcZE///97S0hEJAMAgQIQAQITR2kxhliSuEr0K15je25j2t70Kr3kqs3R9VbwApN8fGmP//zuDho//86BgZAO/3zjExMQAIIQAhN1qqzkK170K19zq99zq190K990y170q15kCgzleevj+Jrp2ceNDVpSgqETEyGU9BKwAIGVaz3j297zG19zq9/zG1/0298l+21AAIEPDvyP//xf//vVm+5jq17zG97zG99zG9/1W93v//tTExKTw8IYqJZkJCSjG17zrF9zat5vf3vf/3zubnuO/3te/3vToxL0qcvjq1/0K13jqt9/f3tTrG/wAlRPf/tTGt7yV3lzuXvTGt9wIRFff/xUK95lFQVFDF8gAAIQAAGQhLaAAQKTUqACm9/2e53gAZNEq+5gAQMim99x298wdVdy/F9QgIEDHF/ym191jE/zeq3Fes1hceIUq23Tqt/ymz71a05jExDwAIKQgAEAA/ZNLTuQcQAP//rff/vfb3qym1/+/tu/f3xf/3xff/q0JCQublrSm971d5izGt/6WjrWlpbOXm4SUpK/f/9/f///f3///3///3re7v5Pf3zv/3taOipe/3xff17+/v9zw8Fff/0f/2vffvvP/+pf////0e3o0AAAABdFJOUwBA5thmAAAAAWJLR0QAiAUdSAAAAAd0SU1FB+oBHRY6JZIe4UoAAAABb3JOVAHPoneaAAAz7ElEQVR42u19j0NTV54v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";


  /* =================== CARGAR USUARIOS =================== */
  const cargarUsuarios = () => {
    fetch(API_SELECT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        select:
          'id_usuario, CONCAT_WS(" ", Nombre, Apellido_pat, Apellido_mat) AS nombre',
        table: "usuarios",
      }),
    })
      .then((res) => res.json())
      .then((data) => setUsuarios(data))
      .catch(() => Swal.fire("Error", "No se pudieron cargar usuarios", "error"));
  };

  /* =================== CARGAR CONTRATOS DEL USUARIO =================== */
  const cargarContratosUsuario = (id_usuario) => {
    if (!id_usuario) return setContratos([]);

    fetch(API_SELECT_WHERE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        select: "id_contrato, num_contrato",
        table: "contratos",
        column: "id_usuario",
        id: id_usuario,
      }),
    })
      .then((res) => res.json())
      .then((data) => setContratos(data.error ? [] : data))
      .catch(() => setContratos([]));
  };

  /* =================== INIT =================== */
  useEffect(() => {
    cargarUsuarios();
  }, []);

  /* =================== HELPER: FECHA LOCAL =================== */
  const fechaLocal = () => {
    const n = new Date();
    const zz = (v) => v.toString().padStart(2, "0");
    return `${n.getFullYear()}-${zz(n.getMonth() + 1)}-${zz(
      n.getDate()
    )} ${zz(n.getHours())}:${zz(n.getMinutes())}:${zz(n.getSeconds())}`;
  };

  /* ============================================================
            HANDLER PRINCIPAL DE GUARDAR PAGO / NUEVO CONTRATO
     ============================================================ */
  const guardarPago = async () => {
    if (!userSelect || !monto || !metodoPago) {
      return Swal.fire("Error", "Faltan datos obligatorios", "error");
    }

    const usuarioNombre =
      usuarios.find((u) => u.id_usuario == userSelect)?.nombre || "";

    const fechaPago = fechaLocal();

    /* === NUEVO CONTRATO === */
    if (modo === "nuevo") {
      if (!contratoNuevo) {
        return Swal.fire("Error", "Debe escribir el número de contrato", "error");
      }

      // 1. Insertar contrato
      const resContrato = await fetch(API_INSERT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "contratos",
          data: {
            id_usuario: userSelect,
            num_contrato: contratoNuevo,
            Fecha_contrato: fechaPago,
            respon_comite: "COMITÉ",
            fecha_creacion: fechaPago,
            status: 1,
          },
        }),
      });

      const rContrato = await resContrato.json();
      if (rContrato.error) return Swal.fire("Error", "No se pudo crear contrato");

      // 2. Insertar pago
      await fetch(API_INSERT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "pagos_contratos",
          data: {
            id_usuario: userSelect,
            num_contrato: contratoNuevo,
            monto,
            metodo_pago: metodoPago,
            observaciones,
            status: 1,
            fecha_contrato: fechaPago,
            fecha_creacion: fechaPago,
          },
        }),
      });

      Swal.fire("Éxito", "Contrato nuevo registrado con éxito", "success");

      // === GENERAR RECIBO PDF ===
      generarPDFContrato("nuevo", {
        usuario: usuarioNombre,
        numContrato: contratoNuevo,
        monto,
        metodo: metodoPago,
        observaciones,
        fecha: fechaPago,
      }, logoBase64);
    }

    /* === REPOSICIÓN === */
    if (modo === "reposicion") {
      await fetch(API_INSERT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "pagos_contratos",
          data: {
            id_usuario: userSelect,
            num_contrato: contratoSeleccionado,
            monto,
            metodo_pago: metodoPago,
            observaciones,
            status: 1,
            fecha_contrato: fechaPago,
            fecha_creacion: fechaPago,
          },
        }),
      });

      Swal.fire("Éxito", "Pago de reposición registrado correctamente", "success");

      // === GENERAR RECIBO PDF ===
      generarPDFContrato("reposicion", {
        usuario: usuarioNombre,
        numContrato: contratoSeleccionado,
        monto,
        metodo: metodoPago,
        observaciones,
        fecha: fechaPago,
      }, logoBase64);
    }

    limpiarFormulario();
  };


  /* =================== LIMPIAR =================== */
  const limpiarFormulario = () => {
    setUserSelect("");
    setContratoNuevo("");
    setContratoSeleccionado("");
    setMonto("");
    setMetodoPago("");
    setObservaciones("");
    setBusqueda("");
    setContratos([]);
  };

  function numeroALetras(num) {
    const unidades = [
      "", "UNO", "DOS", "TRES", "CUATRO", "CINCO",
      "SEIS", "SIETE", "OCHO", "NUEVE"
    ];

    const especiales = [
      "DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE",
      "DIECISÉIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE"
    ];

    const decenas = [
      "", "DIEZ", "VEINTE", "TREINTA", "CUARENTA",
      "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"
    ];

    const centenas = [
      "", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS",
      "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS",
      "NOVECIENTOS"
    ];

    function convertir(n) {
      if (n === 0) return "";
      if (n < 10) return unidades[n];
      if (n < 20) return especiales[n - 10];
      if (n < 100) {
        if (n === 20) return "VEINTE";
        if (n < 30) return "VEINTI" + unidades[n - 20];
        return decenas[Math.floor(n / 10)] +
          (n % 10 ? " Y " + unidades[n % 10] : "");
      }
      if (n < 1000) {
        if (n === 100) return "CIEN";
        return centenas[Math.floor(n / 100)] +
          (n % 100 ? " " + convertir(n % 100) : "");
      }
      if (n < 1000000) {
        if (n === 1000) return "MIL";
        return convertir(Math.floor(n / 1000)) + " MIL" +
          (n % 1000 ? " " + convertir(n % 1000) : "");
      }
      return convertir(Math.floor(n / 1000000)) + " MILLONES" +
        (n % 1000000 ? " " + convertir(n % 1000000) : "");
    }

    // 🔹 Validar número y separar decimales
    let partes = num.toString().split(".");
    let entero = parseInt(partes[0], 10);
    let decimales = partes[1] ? partes[1].padEnd(2, "0").slice(0, 2) : "00";

    let letraEntero = convertir(entero).trim();
    if (letraEntero === "") letraEntero = "CERO";

    return `${letraEntero} PESOS ${decimales}/100 M.N.`;
  }



  /* ======================================
        GENERADOR DE RECIBO PDF
     ====================================== */
  const generarPDFContrato = (tipo, info, logoBase64) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    let y = 20;

    /* === LOGO === */
    try {
      doc.addImage(logoBase64, "PNG", 15, 10, 30, 30);
    } catch (e) {
      console.log("Logo no cargado");
    }

    /* === ENCABEZADO === */
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Comité del Agua Potable", pageWidth / 2, 20, { align: "center" });

    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(
      "San Gaspar Tlahuelilpan, Metepec, Estado de México",
      pageWidth / 2,
      y,
      { align: "center" }
    );

    /* === Fecha de expedición === */
    y += 12;
    const fechaExpedicion = new Date().toLocaleDateString("es-MX");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`Fecha de expedición: ${fechaExpedicion}`, pageWidth - 20, y, {
      align: "right",
    });

    /* === TÍTULO SEGÚN TIPO === */
    y += 18;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);

    if (tipo === "nuevo") {
      doc.text("RECIBO DE PAGO POR NUEVO CONTRATO", pageWidth / 2, y, {
        align: "center",
      });
    } else {
      doc.text("RECIBO DE PAGO POR REPOSICIÓN DE CONTRATO", pageWidth / 2, y, {
        align: "center",
      });
    }

    y += 5;
    doc.setLineWidth(0.5);
    doc.line(20, y, pageWidth - 20, y);

    /* === CONTENIDO === */
    y += 15;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    const leftX = 25;
    const rightX = 90;
    const h = 8;

    const datos = [
      ["Contratante", info.usuario],
      ["Contrato", info.numContrato],
      ["Fecha del pago", info.fecha],
      ["Método de pago", info.metodo],
      ["Observaciones", info.observaciones || "Ninguna"],
    ];

    datos.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, leftX, y);
      doc.setFont("helvetica", "normal");
      doc.text(String(value), rightX, y);
      y += h;
    });

    /* === MONTO DESTACADO === */
    y += 12;
    const montoNumero = `$${parseFloat(info.monto).toLocaleString("es-MX", {
      minimumFractionDigits: 2,
    })}`;
    const montoLetra = numeroALetras(info.monto).toUpperCase();

    doc.setLineWidth(0.5);
    doc.rect(25, y - 6, pageWidth - 50, 20);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(
      `MONTO PAGADO: ${montoNumero} (${montoLetra})`,
      pageWidth / 2,
      y + 5,
      { align: "center", maxWidth: pageWidth - 60 }
    );

    /* === PIE === */
    y += 40;
    doc.setLineWidth(0.3);
    doc.line(20, y, pageWidth - 20, y);

    y += 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    let textoFinal =
      "Este documento certifica el pago correspondiente realizado ante el Comité del Agua Potable.";

    if (tipo === "reposicion") {
      textoFinal =
        "Este documento certifica el pago correspondiente a la reposición de contrato con el Comité del Agua Potable.";
    }

    doc.text(textoFinal, pageWidth / 2, y, {
      align: "center",
    });

    y += 5;
    doc.text(
      "San Gaspar Tlahuelilpan, Metepec, Estado de México.",
      pageWidth / 2,
      y,
      { align: "center" }
    );

    /* === GUARDAR === */
    const nombrePDF =
      tipo === "nuevo"
        ? `Recibo_NuevoContrato_${info.usuario}_${info.numContrato}.pdf`
        : `Recibo_ReposicionContrato_${info.usuario}_${info.numContrato}.pdf`;

    doc.save(nombrePDF);
    window.open(doc.output("bloburl"), "_blank");
  };


  /* ============================================================
                          RENDER
     ============================================================ */
  return (
    <div style={styles.container}>
      <h2 style={{ textAlign: "center", marginBottom: 20 }}>
        Registro de Pagos de Contratos
      </h2>

      {/* ===== Selección de Modo ===== */}
      <div style={styles.selectorModo}>
        <button
          style={modo === "nuevo" ? styles.btnSelected : styles.btn}
          onClick={() => setModo("nuevo")}
        >
          ➕ Nuevo Contrato
        </button>

        <button
          style={modo === "reposicion" ? styles.btnSelected : styles.btn}
          onClick={() => setModo("reposicion")}
        >
          🔄 Reposición
        </button>
      </div>

      {modo === "" && (
        <p style={{ textAlign: "center", marginTop: 20 }}>
          Selecciona una opción para continuar.
        </p>
      )}

      {/* ============================================================
                      FORMULARIO: NUEVO CONTRATO
         ============================================================ */}
      {modo === "nuevo" && (
        <div style={styles.form}>
          <h3>Registrar Nuevo Contrato</h3>

          {/* BUSCAR USUARIO */}
          <input
            style={styles.input}
            placeholder="Buscar usuario..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          <select
            style={styles.input}
            value={userSelect}
            onChange={(e) => setUserSelect(e.target.value)}
          >
            <option value="">Seleccione usuario</option>
            {usuarios
              .filter((u) =>
                u.nombre.toLowerCase().includes(busqueda.toLowerCase())
              )
              .map((u) => (
                <option key={u.id_usuario} value={u.id_usuario}>
                  {u.nombre}
                </option>
              ))}
          </select>

          <input
            style={styles.input}
            placeholder="Número de contrato nuevo"
            value={contratoNuevo}
            onChange={(e) => setContratoNuevo(e.target.value)}
          />

          <input
            type="number"
            style={styles.input}
            placeholder="Monto"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
          />

          <select
            style={styles.input}
            value={metodoPago}
            onChange={(e) => setMetodoPago(e.target.value)}
          >
            <option value="">Método de pago</option>
            <option value="EFECTIVO">Efectivo</option>
            <option value="TARJETA">Tarjeta</option>
            <option value="TRANSFERENCIA">Transferencia</option>
          </select>

          <textarea
            style={styles.textarea}
            placeholder="Observaciones"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
          />

          <button style={styles.btnGuardar} onClick={guardarPago}>
            Registrar Pago y Contrato
          </button>
        </div>
      )}

      {/* ============================================================
                      FORMULARIO: REPOSICIÓN
         ============================================================ */}
      {modo === "reposicion" && (
        <div style={styles.form}>
          <h3>Registrar Reposición de Contrato</h3>

          {/* BUSCAR USUARIO */}
          <input
            style={styles.input}
            placeholder="Buscar usuario..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          <select
            style={styles.input}
            value={userSelect}
            onChange={(e) => {
              setUserSelect(e.target.value);
              cargarContratosUsuario(e.target.value);
            }}
          >
            <option value="">Seleccione usuario</option>
            {usuarios
              .filter((u) =>
                u.nombre.toLowerCase().includes(busqueda.toLowerCase())
              )
              .map((u) => (
                <option key={u.id_usuario} value={u.id_usuario}>
                  {u.nombre}
                </option>
              ))}
          </select>

          <select
            style={styles.input}
            value={contratoSeleccionado}
            onChange={(e) => setContratoSeleccionado(e.target.value)}
          >
            <option value="">Seleccione contrato</option>
            {contratos.map((c) => (
              <option key={c.id_contrato} value={c.num_contrato}>
                {c.num_contrato}
              </option>
            ))}
          </select>

          <input
            type="number"
            style={styles.input}
            placeholder="Monto"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
          />

          <select
            style={styles.input}
            value={metodoPago}
            onChange={(e) => setMetodoPago(e.target.value)}
          >
            <option value="">Método de pago</option>
            <option value="EFECTIVO">Efectivo</option>
            <option value="TARJETA">Tarjeta</option>
            <option value="TRANSFERENCIA">Transferencia</option>
          </select>

          <textarea
            style={styles.textarea}
            placeholder="Observaciones"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
          />

          <button style={styles.btnGuardar} onClick={guardarPago}>
            Registrar Pago
          </button>
        </div>
      )}
    </div>
  );
}

/* ============================================================
                        ESTILOS
   ============================================================ */
const styles = {
  container: {
    maxWidth: 650,
    margin: "40px auto",
    padding: 20,
    background: "#f8f9fa",
    borderRadius: 8,
    boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
  },

  selectorModo: {
    display: "flex",
    justifyContent: "space-around",
    marginBottom: 25,
  },

  btn: {
    padding: "10px 20px",
    background: "#bbb",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },

  btnSelected: {
    padding: "10px 20px",
    background: "#0077b6",
    color: "white",
    border: "none",
    borderRadius: 6,
    fontWeight: "bold",
    cursor: "pointer",
  },

  form: {
    background: "white",
    padding: 20,
    borderRadius: 8,
    marginTop: 15,
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },

  input: {
    width: "100%",
    padding: 10,
    marginTop: 10,
    border: "1px solid #bbb",
    borderRadius: 6,
  },

  textarea: {
    width: "100%",
    padding: 10,
    marginTop: 10,
    height: 80,
    border: "1px solid #bbb",
    borderRadius: 6,
  },

  btnGuardar: {
    width: "100%",
    marginTop: 20,
    padding: 12,
    background: "#28a745",
    color: "white",
    border: "none",
    fontSize: "1rem",
    borderRadius: 6,
    cursor: "pointer",
  },
};
