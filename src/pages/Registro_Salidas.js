import React, { useState, useContext } from "react";
import Swal from "sweetalert2";
import { AuthContext } from "../context/authContext";
import { FaMoneyBillWave } from "react-icons/fa";

import { API } from "../Api/api.config";

const API_INSERT_SALIDA = API.INSERT;

export default function RegistroSalidas() {
  const { user } = useContext(AuthContext);

  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState("");
  const [monto, setMonto] = useState("");
  const [autoriza, setAutoriza] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [loading, setLoading] = useState(false);

  const getFechaLocal = () => {
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} `
      + `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  };

  const limpiar = () => {
    setDescripcion(""); setMonto(""); setFecha(""); setAutoriza(""); setObservaciones("");
  };

  const guardarSalida = async () => {
    if (!descripcion || !monto || !fecha || !autoriza) {
      Swal.fire("Error", "Todos los campos excepto observaciones son obligatorios", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(API_INSERT_SALIDA, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "salidas",
          data: { descripcion, monto, fecha, autoriza, observaciones, fecha_registro: getFechaLocal(), status: 1 },
        }),
      });
      const result = await res.json();
      if (!res.ok) { Swal.fire("Error", result?.error || "No se pudo guardar", "error"); return; }
      Swal.fire("Éxito", "Salida registrada correctamente", "success");
      limpiar();
    } catch {
      Swal.fire("Error", "Ocurrió un error al guardar", "error");
    } finally {
      setLoading(false);
    }
  };

  if (user?.rol !== "admin") {
    return <h2 style={{ textAlign: "center", marginTop: 40, color: "#777" }}>Acceso denegado</h2>;
  }

  return (
    <div className="form-page">
      <div className="form-card">
        <h2 className="form-title">Registro de Salidas</h2>

        <form onSubmit={(e) => { e.preventDefault(); guardarSalida(); }}>
          <div className="form-group">
            <label className="form-label">Descripción *</label>
            <input type="text" required value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ejemplo: Pago recibo de luz #1234"
              className="form-input" />
          </div>

          <div className="form-group">
            <label className="form-label">Monto *</label>
            <input type="number" required value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="Ingrese el monto total"
              className="form-input" />
          </div>

          <div className="form-group">
            <label className="form-label">Fecha *</label>
            <input type="date" required value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="form-input" />
          </div>

          <div className="form-group">
            <label className="form-label">Autoriza *</label>
            <input type="text" required value={autoriza}
              onChange={(e) => setAutoriza(e.target.value)}
              placeholder="Quién autoriza la salida"
              className="form-input" />
          </div>

          <div className="form-group">
            <label className="form-label">Observaciones</label>
            <input type="text" value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Observaciones opcionales"
              className="form-input" />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <FaMoneyBillWave /> {loading ? "Guardando..." : "Registrar Salida"}
          </button>
        </form>
      </div>
    </div>
  );
}
