import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { FaFileContract } from 'react-icons/fa';
import { API } from "../Api/api.config";

const API_SELECT_USUARIOS = API.SELECT;
const API_INSERT_CONTRATO = API.INSERT;

export default function RegistroContratos() {
  const [usuarios,           setUsuarios]           = useState([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState('');
  const [busquedaUsuario,    setBusquedaUsuario]    = useState('');
  const [numContrato,        setNumContrato]        = useState('');
  const [fechaContrato,      setFechaContrato]      = useState('');
  const [responComite,       setResponComite]       = useState('');
  const [loading,            setLoading]            = useState(false);

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
      .then(data => { if (!data.error) setUsuarios(data.filter(u => !u.Contratante?.startsWith("TEST_PRUEBA"))); })
      .catch(() => Swal.fire('Error', 'No se pudieron cargar los usuarios', 'error'));
  }, []);

  const getFechaLocal = () => {
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} `
      + `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  };

  const limpiar = () => {
    setUsuarioSeleccionado(''); setBusquedaUsuario('');
    setNumContrato(''); setFechaContrato(''); setResponComite('');
  };

  const guardarContrato = async () => {
    if (!usuarioSeleccionado) { Swal.fire('Error', 'El contratante es obligatorio', 'error'); return; }
    setLoading(true);
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
    } catch {
      Swal.fire('Error', 'No se pudo guardar el contrato', 'error');
    } finally {
      setLoading(false);
    }
  };

  const usuariosFiltrados = usuarios.filter(u =>
    u.Contratante.toLowerCase().includes(busquedaUsuario.toLowerCase())
  );

  return (
    <div className="form-page">
      <div className="form-card">
        <h2 className="form-title">Registro de Contratos</h2>

        <form onSubmit={(e) => { e.preventDefault(); guardarContrato(); }}>

          <div className="form-group">
            <label className="form-label">Buscar contratante</label>
            <input
              type="text"
              value={busquedaUsuario}
              onChange={e => setBusquedaUsuario(e.target.value)}
              placeholder="Escribe el nombre..."
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contratante *</label>
            <select
              required
              value={usuarioSeleccionado}
              onChange={e => setUsuarioSeleccionado(e.target.value)}
              className="form-input"
            >
              <option value="">— Seleccione —</option>
              {usuariosFiltrados.map(u => (
                <option key={u.id_usuario} value={u.id_usuario}>{u.Contratante}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Número de contrato</label>
            <input
              type="text"
              value={numContrato}
              onChange={e => setNumContrato(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Fecha del contrato</label>
            <input
              type="datetime-local"
              value={fechaContrato}
              onChange={e => setFechaContrato(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Responsable del comité *</label>
            <select
              required
              value={responComite}
              onChange={e => setResponComite(e.target.value)}
              className="form-input"
            >
              <option value="">— Seleccione —</option>
              <option value="Presidente">Presidente</option>
              <option value="Secretario">Secretario</option>
              <option value="Tesorero">Tesorero</option>
              <option value="Auxiliar">Auxiliar</option>
              <option value="Voluntario">Voluntario</option>
            </select>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <FaFileContract /> {loading ? 'Guardando...' : 'Registrar Contrato'}
          </button>
        </form>
      </div>
    </div>
  );
}
