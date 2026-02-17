import React, { useEffect, useState, useContext } from "react";
import Swal from "sweetalert2";
import { AuthContext } from "../context/authContext";

/* ===================== API ===================== */

const API_SELECT_CONTRATOS =
  "https://comitedeaguasangaspartl.com/api/Selectgeneric/SelectWithWhere.php";

const API_ADEUDOS_GET =
  "https://comitedeaguasangaspartl.com/api/Selectgeneric/get_adeudos.php";

/* ===================================================== */

export default function ClienteHome() {
  const { user } = useContext(AuthContext);

  const [contratos, setContratos] = useState([]);
  const [adeudos, setAdeudos] = useState([]);

  const [loadingContratos, setLoadingContratos] = useState(true);
  const [loadingAdeudos, setLoadingAdeudos] = useState(true);
  const [errorCarga, setErrorCarga] = useState(false);

  /* ===================== CARGAR CONTRATOS ===================== */

  useEffect(() => {
    if (!user?.id_usuario) return;

    setLoadingContratos(true);
    setErrorCarga(false);

    fetch(API_SELECT_CONTRATOS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        select: "id_contrato, num_contrato, Fecha_contrato",
        table: "contratos",
        column: "id_usuario",
        id: user.id_usuario,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.error && Array.isArray(data)) {
          setContratos(data);
        } else {
          setContratos([]);
        }
      })
      .catch(() => {
        setErrorCarga(true);
        setContratos([]);
      })
      .finally(() => setLoadingContratos(false));
  }, [user]);

  /* ===================== CARGAR ADEUDOS ===================== */

  useEffect(() => {
    if (!user?.id_usuario || contratos.length === 0) {
      setAdeudos([]);
      setLoadingAdeudos(false);
      return;
    }

    const cargarAdeudos = async () => {
      setLoadingAdeudos(true);

      try {
        let todosAdeudos = [];

        for (const contrato of contratos) {
          const res = await fetch(API_ADEUDOS_GET, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id_usuario: user.id_usuario,
              id_contrato: contrato.id_contrato,
            }),
          });

          const data = await res.json();

          if (!data.error && Array.isArray(data)) {
            todosAdeudos.push(
              ...data.map((a) => ({
                ...a,
                id_contrato: contrato.id_contrato,
              }))
            );
          }
        }

        setAdeudos(todosAdeudos);
      } catch (error) {
        console.error(error);
        setAdeudos([]);
      } finally {
        setLoadingAdeudos(false);
      }
    };

    cargarAdeudos();
  }, [user, contratos]);

  /* ===================== ALERTA SI HAY ADEUDOS ===================== */

  useEffect(() => {
    if (adeudos.length === 0) return;

    const pendientes = adeudos.filter((a) => a.estado === "pendiente");

    if (pendientes.length > 0) {
      Swal.fire({
        icon: "warning",
        title: "Tienes adeudos pendientes",
        text: `Tienes ${pendientes.length} año(s) pendiente(s) por pagar.`,
        confirmButtonColor: "#d33",
      });
    }
  }, [adeudos]);

  /* ===================== VALIDACIÓN USUARIO ===================== */

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
      <h1>Bienvenido(a) {user.Nombre}  {user.Apellido_pat}👋</h1>
      <p>Esta es tu área de cliente.</p>

      <div style={{ marginTop: 30 }}>
        <h2>📊 Mis Contratos</h2>

        {loadingContratos && <p>Cargando contratos...</p>}

        {!loadingContratos && contratos.length === 0 && (
          <p style={{ color: "#777" }}>
            No tienes contratos registrados.
          </p>
        )}

        {!loadingContratos &&
          contratos.length > 0 &&
          contratos.map((contrato) => {
            const adeudosContrato = adeudos.filter(
              (a) => a.id_contrato === contrato.id_contrato
            );

            const pendientes = adeudosContrato.filter(
              (a) => a.estado === "pendiente"
            );

            const pagados = adeudosContrato.filter(
              (a) => a.estado === "pagado"
            );

            return (
              <div key={contrato.id_contrato} style={cardStyle}>
                <h3>Contrato: {contrato.num_contrato}</h3>

                {loadingAdeudos && <p>Cargando adeudos...</p>}

                {!loadingAdeudos && adeudosContrato.length === 0 && (
                  <p style={{ color: "#777" }}>
                    No tiene adeudos registrados.
                  </p>
                )}

                {!loadingAdeudos && pendientes.length > 0 && (
                  <div>
                    <strong style={{ color: "red" }}>
                      🔴 Pendientes:
                    </strong>
                    <ul>
                      {pendientes.map((a) => (
                        <li key={a.id_adeudo}>{a.anio}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {!loadingAdeudos && pagados.length > 0 && (
                  <div>
                    <strong style={{ color: "green" }}>
                      🟢 Pagados:
                    </strong>
                    <ul>
                      {pagados.map((a) => (
                        <li key={a.id_adeudo}>{a.anio}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}

/* ===================== ESTILOS ===================== */

const containerStyle = {
  maxWidth: 900,
  margin: "40px auto",
  padding: 20,
  background: "#f4f6f9",
  borderRadius: 10,
};

const cardStyle = {
  background: "white",
  padding: 15,
  marginBottom: 15,
  borderRadius: 8,
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
};
