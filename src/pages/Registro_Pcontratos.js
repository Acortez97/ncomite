import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

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

    if (modo === "nuevo" && !contratoNuevo) {
      return Swal.fire("Error", "Debe escribir el número de contrato", "error");
    }

    if (modo === "reposicion" && !contratoSeleccionado) {
      return Swal.fire("Error", "Debe seleccionar un contrato", "error");
    }

    const fechaContrato = fechaLocal(); // Para contratos nuevos y reposiciones

    /* ========= MODO A: NUEVO CONTRATO ========= */
    if (modo === "nuevo") {
      /* 1️⃣ Insertar en tabla contratos */
      const insertContratoPayload = {
        table: "contratos",
        data: {
          id_usuario: userSelect,
          num_contrato: contratoNuevo,
          Fecha_contrato: fechaContrato,
          respon_comite: "COMITÉ",
          fecha_creacion: fechaContrato,
          status: 1,
        },
      };

      const resContrato = await fetch(API_INSERT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(insertContratoPayload),
      });

      const rContrato = await resContrato.json();
      if (rContrato.error) {
        return Swal.fire("Error", "No se pudo crear el contrato", "error");
      }

      /* ID DEL CONTRATO CREADO */
      const idContratoCreado = rContrato.insert_id;

      /* 2️⃣ Insertar pago del contrato nuevo */
      const insertPagoPayload = {
        table: "pagos_contratos",
        data: {
          id_usuario: userSelect,
          num_contrato: contratoNuevo,
          monto,
          metodo_pago: metodoPago,
          observaciones,
          status: 1,
          fecha_contrato: fechaContrato,
          fecha_creacion: fechaLocal(),
        },
      };

      await fetch(API_INSERT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(insertPagoPayload),
      });

      Swal.fire("Éxito", "Contrato nuevo registrado con éxito", "success");
    }

    /* ========= MODO B: REPOSICIÓN ========= */
    else if (modo === "reposicion") {
      const insertReemplazoPayload = {
        table: "pagos_contratos",
        data: {
          id_usuario: userSelect,
          num_contrato: contratoSeleccionado,
          monto,
          metodo_pago: metodoPago,
          observaciones,
          status: 1,
          fecha_contrato: fechaContrato,
          fecha_creacion: fechaLocal(),
        },
      };

      await fetch(API_INSERT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(insertReemplazoPayload),
      });

      Swal.fire("Éxito", "Pago de reposición registrado correctamente", "success");
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
