import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/authContext";
import Swal from "sweetalert2";

/* ===================== APIs ===================== */

const API_SELECT_USUARIO =
  "https://comitedeaguasangaspartl.com/api/Selectgeneric/SelectWithWhere.php";

const API_SELECT_CONTRATOS =
  "https://comitedeaguasangaspartl.com/api/Selectgeneric/SelectWithWhere.php";

/* ================================================= */

export default function ClientePerfil() {
  const { user } = useContext(AuthContext);

  const [infoUsuario, setInfoUsuario] = useState(null);
  const [contratos, setContratos] = useState([]);

  const [loading, setLoading] = useState(true);

  /* ===================== CARGAR INFO USUARIO ===================== */

  useEffect(() => {
    if (!user?.id_usuario) return;

    const cargarDatos = async () => {
      try {
        setLoading(true);

        // 1️⃣ Datos del usuario
        const resUsuario = await fetch(API_SELECT_USUARIO, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            select:
              "id_usuario, Nombre, Apellido_pat, Apellido_mat, domicilio, num_celular, correo",
            table: "usuarios",
            column: "id_usuario",
            id: user.id_usuario,
          }),
        });

        const dataUsuario = await resUsuario.json();

        if (!dataUsuario.error && dataUsuario.length > 0) {
          setInfoUsuario(dataUsuario[0]);
        }

        // 2️⃣ Contratos del usuario
        const resContratos = await fetch(API_SELECT_CONTRATOS, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            select: "id_contrato, num_contrato",
            table: "contratos",
            column: "id_usuario",
            id: user.id_usuario,
          }),
        });

        const dataContratos = await resContratos.json();

        if (!dataContratos.error) {
          setContratos(dataContratos);
        }
      } catch (error) {
        console.error(error);
        Swal.fire("Error", "No se pudo cargar la información", "error");
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [user]);

  /* ===================== VALIDACIÓN ===================== */

  if (!user) {
    return (
      <div style={containerStyle}>
        <h2>Debes iniciar sesión</h2>
      </div>
    );
  }

  /* ===================== RENDER ===================== */

  return (
    <div style={containerStyle}>
      <h1 style={{ marginBottom: 25 }}>👤 Mi Información</h1>

      {loading && <p>Cargando información...</p>}

      {!loading && infoUsuario && (
        <div style={cardStyle}>
          <ul style={listStyle}>
            <li>
              <strong>Nombre completo:</strong>{" "}
              {infoUsuario.Nombre} {infoUsuario.Apellido_pat}{" "}
              {infoUsuario.Apellido_mat}
            </li>

            <li>
              <strong>Dirección:</strong>{" "}
              {infoUsuario.domicilio || "No registrada"}
            </li>

            <li>
              <strong>Teléfono:</strong>{" "}
              {infoUsuario.num_celular || "No registrado"}
            </li>

            <li>
              <strong>Correo:</strong>{" "}
              {infoUsuario.correo || "No registrado"}
            </li>
          </ul>
        </div>
      )}

      {/* ===================== CONTRATOS ===================== */}

      <div style={{ marginTop: 30 }}>
        <h2>📄 Mis Contratos</h2>

        {loading && <p>Cargando contratos...</p>}

        {!loading && contratos.length === 0 && (
          <p style={{ color: "#777" }}>
            No tienes contratos registrados.
          </p>
        )}

        {!loading && contratos.length > 0 && (
          <div style={cardStyle}>
            <ul style={listStyle}>
              {contratos.map((c) => (
                <li key={c.id_contrato}>
                  Contrato: <strong>{c.num_contrato}</strong>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===================== ESTILOS ===================== */

const containerStyle = {
  maxWidth: 800,
  margin: "40px auto",
  padding: 25,
  background: "#f4f6f9",
  borderRadius: 10,
};

const cardStyle = {
  background: "white",
  padding: 20,
  borderRadius: 10,
  boxShadow: "0 3px 12px rgba(0,0,0,0.1)",
};

const listStyle = {
  listStyle: "none",
  padding: 0,
  lineHeight: "2rem",
};
