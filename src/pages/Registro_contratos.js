import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

const API_SELECT_USUARIOS = "https://comitedeaguasangaspartl.com/api/Selectgeneric/Select_Gen.php";

const API_INSERT_CONTRATO = "https://comitedeaguasangaspartl.com/api/Insertgeneric/insert.php";

export default function RegistroContratos() {
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState('');
  const [busquedaUsuario, setBusquedaUsuario] = useState('');
  const [numContrato, setNumContrato] = useState('');
  const [fechaContrato, setFechaContrato] = useState('');
  const [responComite, setResponComite] = useState('');

  /* ===================== CARGAR USUARIOS ===================== */
  useEffect(() => {
    fetch(API_SELECT_USUARIOS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        select: 'id_usuario, CONCAT_WS(" ",Nombre, Apellido_pat, Apellido_mat) AS Contratante',
        table: 'usuarios',
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (!data.error) setUsuarios(data);
      })
      .catch(err => {
        console.error(err);
        Swal.fire('Error', 'No se pudieron cargar los usuarios', 'error');
      });
  }, []);

  /* ===================== FECHA LOCAL ===================== */
  const getFechaLocal = () => {
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');

    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} `
      + `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  };

  /* ===================== LIMPIAR FORM ===================== */
  const limpiar = () => {
    setUsuarioSeleccionado('');
    setBusquedaUsuario('');
    setNumContrato('');
    setFechaContrato('');
    setResponComite('');
  };

  /* ===================== GUARDAR ===================== */
  const guardarContrato = async () => {
    if (!usuarioSeleccionado) {
      Swal.fire('Error', 'El contratante es obligatorio', 'error');
      return;
    }

    try {
      const res = await fetch(API_INSERT_CONTRATO, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'contratos',
          data: {
            id_usuario: usuarioSeleccionado,
            num_contrato: numContrato,
            Fecha_contrato: fechaContrato,
            respon_comite: responComite,
            status: 1,
            fecha_creacion: getFechaLocal(),
          },
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result?.error);

      Swal.fire('Éxito', 'Contrato registrado correctamente', 'success');
      limpiar();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'No se pudo guardar el contrato', 'error');
    }
  };

  /* ===================== RENDER ===================== */
  return (
    <div style={containerStyle}>
      <h2 style={{ textAlign: 'center', marginBottom: 30 }}>
        Registro de Contratos
      </h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          guardarContrato();
        }}
        style={formStyle}
      >
        {/* BUSCAR USUARIO */}
        <div>
          <label><b>Buscar usuario</b></label>
          <input
            type="text"
            value={busquedaUsuario}
            onChange={e => setBusquedaUsuario(e.target.value)}
            placeholder="Nombre del contratante"
            style={inputStyle}
          />
        </div>

        {/* SELECT USUARIO */}
        <div>
          <label><b>Contratante</b></label>
          <select
            required
            value={usuarioSeleccionado}
            onChange={e => setUsuarioSeleccionado(e.target.value)}
            style={inputStyle}
          >
            <option value="">SELECCIONE</option>
            {usuarios
              .filter(u =>
                u.Contratante
                  .toLowerCase()
                  .includes(busquedaUsuario.toLowerCase())
              )
              .map(u => (
                <option key={u.id_usuario} value={u.id_usuario}>
                  {u.Contratante}
                </option>
              ))}
          </select>
        </div>

        {/* NUM CONTRATO */}
        <div>
          <label><b>Número de contrato</b></label>
          <input
            type="text"
            value={numContrato}
            onChange={e => setNumContrato(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* FECHA */}
        <div>
          <label><b>Fecha del contrato</b></label>
          <input
            type="datetime-local"
            value={fechaContrato}
            onChange={e => setFechaContrato(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* RESPONSABLE */}
        <div>
          <label><b>Responsable del comité</b></label>
          <select
            required
            value={responComite}
            onChange={e => setResponComite(e.target.value)}
            style={inputStyle}
          >
            <option value="">SELECCIONE</option>
            <option value="Presidente">Presidente</option>
            <option value="Secretario">Secretario</option>
            <option value="Tesorero">Tesorero</option>
            <option value="Auxiliar">Auxiliar</option>
            <option value="Voluntario">Voluntario</option>
          </select>
        </div>

        <button type="submit" style={buttonStyle}>
          Registrar Contrato
        </button>
      </form>
    </div>
  );
}

/* ===================== ESTILOS ===================== */

const containerStyle = {
  maxWidth: 600,
  margin: '40px auto',
  padding: 20,
  background: '#f9f9f9',
  borderRadius: 10,
  boxShadow: '0 4px 10px rgba(0,0,0,.1)',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
};

const inputStyle = {
  width: '100%',
  padding: 10,
  marginTop: 5,
  borderRadius: 6,
  border: '1px solid #ccc',
};

const buttonStyle = {
  marginTop: 10,
  padding: 12,
  background: '#0077b6',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
};
