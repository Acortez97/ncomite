import React, { useState, useContext } from "react";
import Swal from "sweetalert2";
import { jsPDF } from "jspdf";
import { AuthContext } from "../context/authContext";

// API PHP REAL
const API_INSERT_SALIDA =
  "https://comitedeaguasangaspartl.com/api/Insertgeneric/insert.php";

export default function RegistroSalidas() {
  const { user } = useContext(AuthContext);


  // ------------------ STATES ------------------
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState("");
  const [monto, setMonto] = useState("");
  const [autoriza, setAutoriza] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const logoUrl = "/logoagua.png";

  // ------------------ FECHA LOCAL ------------------
  function getFechaLocal() {
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, "0");

    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate()
    )} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(
      now.getSeconds()
    )}`;
  }

  // ------------------ LIMPIAR FORM ------------------
  const borrar = () => {
    setDescripcion("");
    setMonto("");
    setFecha("");
    setAutoriza("");
    setObservaciones("");
  };

  // ------------------ GUARDAR SALIDA ------------------
  const guardarSalida = async () => {
    if (!descripcion || !monto || !fecha || !autoriza) {
      Swal.fire("Error", "Todos los campos excepto observaciones son obligatorios", "error");
      return;
    }

    const payload = {
      table: "salidas",
      data: {
        descripcion,
        monto,
        fecha,
        autoriza,
        observaciones,
        fecha_registro: getFechaLocal(),
        status: 1,
      },
    };

    try {
      const res = await fetch(API_INSERT_SALIDA, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        Swal.fire("Error", result?.error || "No se pudo guardar", "error");
        return;
      }

      Swal.fire("Éxito", "Salida registrada correctamente", "success");

      borrar();
    } catch (error) {
      Swal.fire("Error", "Ocurrió un error al guardar", "error");
    }
  };
  // SOLO ADMIN
  if (user?.rol !== "admin") {
    return <h2 style={{ textAlign: "center" }}>Acceso denegado</h2>;
  }

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "40px auto",
        padding: "20px",
        backgroundColor: "#f9f9f9",
        borderRadius: "10px",
        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>
        Registro de Salidas
      </h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          guardarSalida();
        }}
        style={{ display: "flex", flexDirection: "column", gap: "20px" }}
      >
        <div>
          <label>
            <b>Descripción:</b>
          </label>
          <input
            type="text"
            placeholder="Ejemplo: Pago recibo de luz #1234"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label>
            <b>Monto:</b>
          </label>
          <input
            type="number"
            placeholder="Ingrese el monto total"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label>
            <b>Fecha:</b>
          </label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label>
            <b>Autoriza:</b>
          </label>
          <input
            type="text"
            placeholder="Quién autoriza la compra"
            value={autoriza}
            onChange={(e) => setAutoriza(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label>
            <b>Observaciones:</b>
          </label>
          <input
            type="text"
            placeholder="Observaciones opcionales"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            style={inputStyle}
          />
        </div>

        <button type="submit" style={buttonStyle}>
          Registrar Salida
        </button>
      </form>
    </div>
  );
}

// ------------------ ESTILOS ------------------
const inputStyle = {
  width: "100%",
  padding: "10px",
  fontSize: "0.95rem",
  border: "1px solid #ccc",
  borderRadius: "6px",
  marginTop: "5px",
};

const buttonStyle = {
  padding: "10px 20px",
  backgroundColor: "#0077b6",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  marginTop: "10px",
};
