import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

const API_SELECT =
  "https://comitedeaguasangaspartl.com/api/Selectgeneric/Select_Gen.php";

export default function VerAdeudos() {
  const [adeudos, setAdeudos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [listaFinal, setListaFinal] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  // 🟦 PAGINACIÓN
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 20;

  // ===================== CARGAR ADEUDOS =====================
  const loadAdeudos = async () => {
    const res = await fetch(API_SELECT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        select: "*",
        table: "adeudos",
      }),
    });
    const data = await res.json();
    if (!data.error) setAdeudos(data);
  };

  // ===================== CARGAR USUARIOS =====================
  const loadUsuarios = async () => {
    const res = await fetch(API_SELECT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        select: "id_usuario, Nombre, Apellido_pat, Apellido_mat",
        table: "usuarios",
      }),
    });
    const data = await res.json();
    if (!data.error) setUsuarios(data);
  };

  // ===================== CARGAR CONTRATOS =====================
  const loadContratos = async () => {
    const res = await fetch(API_SELECT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        select: "id_contrato, id_usuario, num_contrato",
        table: "contratos",
      }),
    });
    const data = await res.json();
    if (!data.error) setContratos(data);
  };

  // ===================== CARGAR TODO =====================
  useEffect(() => {
    loadAdeudos();
    loadUsuarios();
    loadContratos();
  }, []);

  // ===================== HACER JOIN EN FRONT =====================
  useEffect(() => {
    if (adeudos.length === 0 || usuarios.length === 0 || contratos.length === 0)
      return;

    const joinData = adeudos.map((a) => {
      const user = usuarios.find(
        (u) => String(u.id_usuario) === String(a.id_usuario)
      );

      const contrato = contratos.find(
        (c) => String(c.id_contrato) === String(a.id_contrato)
      );

      return {
        ...a,
        usuario: user
          ? `${user.Nombre} ${user.Apellido_pat} ${user.Apellido_mat}`
          : "SIN USUARIO",
        num_contrato: contrato ? contrato.num_contrato : "SIN CONTRATO",
      };
    });

    setListaFinal(joinData);
  }, [adeudos, usuarios, contratos]);

  // ===================== FILTRO =====================
  const filtrados = listaFinal.filter((item) =>
    `${item.usuario} ${item.num_contrato}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  // 🟦 CALCULAR PAGINACIÓN
  const indiceInicial = (paginaActual - 1) * registrosPorPagina;
  const indiceFinal = indiceInicial + registrosPorPagina;
  const datosPaginados = filtrados.slice(indiceInicial, indiceFinal);

  const totalPaginas = Math.ceil(filtrados.length / registrosPorPagina);

  const siguientePagina = () => {
    if (paginaActual < totalPaginas) setPaginaActual(paginaActual + 1);
  };

  const anteriorPagina = () => {
    if (paginaActual > 1) setPaginaActual(paginaActual - 1);
  };

  // Reiniciar a la página 1 al buscar
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda]);

  return (
    <div style={{ width: "95%", margin: "40px auto" }}>
      <h1 style={{ textAlign: "center" }}>Adeudos</h1>

      {/* BUSCADOR */}
      <input
        type="text"
        placeholder="Buscar usuario o contrato..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        style={inputSearch}
      />

      <table style={tableStyle}>
        <thead style={theadStyle}>
          <tr>
            <th>ID</th>
            <th>Usuario</th>
            <th>Contrato</th>
            <th>Año</th>
            <th>Estado</th>
          </tr>
        </thead>

        <tbody>
          {datosPaginados.length > 0 ? (
            datosPaginados.map((a) => (
              <tr key={a.id_adeudo} style={rowStyle}>
                <td>{a.id_adeudo}</td>
                <td>{a.usuario}</td>
                <td>{a.num_contrato}</td>
                <td>{a.anio}</td>
                <td
                  style={{
                    fontWeight: "bold",
                    color: a.estado === "pendiente" ? "red" : "green",
                  }}
                >
                  {a.estado}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={{ padding: "15px", color: "gray" }}>
                Sin resultados...
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* PAGINACIÓN */}
      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <button
          onClick={anteriorPagina}
          disabled={paginaActual === 1}
          style={btnPag}
        >
          ◀ Anterior
        </button>

        <span style={{ margin: "0 15px" }}>
          Página {paginaActual} de {totalPaginas}
        </span>

        <button
          onClick={siguientePagina}
          disabled={paginaActual === totalPaginas}
          style={btnPag}
        >
          Siguiente ▶
        </button>
      </div>
    </div>
  );
}

/* ===================== ESTILOS ===================== */

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  background: "white",
  borderRadius: "8px",
  overflow: "hidden",
  boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
};

const theadStyle = {
  background: "#0f4c75",
  color: "white",
  fontWeight: "bold",
};

const rowStyle = {
  borderBottom: "1px solid #ddd",
};

const inputSearch = {
  padding: "10px",
  width: "300px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  margin: "15px 0",
};

const btnPag = {
  padding: "8px 14px",
  background: "#0f4c75",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  margin: "5px",
};
