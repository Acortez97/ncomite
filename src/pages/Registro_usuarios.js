import React, { useState } from 'react';
import Swal from 'sweetalert2';
import Papa from 'papaparse';
import withAuthRole from '../components/withAuthRole';
import { FaUpload, FaUserPlus } from 'react-icons/fa';
import { API } from "../Api/api.config";

const API_INSERT     = API.INSERT;
const API_IMPORT_CSV = API.IMPORT_CSV;

function Registro_usuarios() {
    const [nombreUsuario, setNombreUsuario] = useState('');
    const [ap_pat, setAp_pat]   = useState('');
    const [ap_mat, setAp_mat]   = useState('');
    const [num_cel, setNum_cel] = useState('');
    const [correo, setCorreo]   = useState('');
    const [domicilio, setDomicilio] = useState('');
    const [loading, setLoading] = useState(false);

    const getFechaLocal = () => {
        const now = new Date();
        const pad = (n) => n.toString().padStart(2, '0');
        const offset = now.getTimezoneOffset();
        now.setMinutes(now.getMinutes() - offset);
        return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    };

    const limpiar = () => {
        setNombreUsuario(''); setAp_pat(''); setAp_mat('');
        setNum_cel(''); setCorreo(''); setDomicilio('');
    };

    const guardarUsuario = async () => {
        setLoading(true);
        try {
            const response = await fetch(API_INSERT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    table: 'usuarios',
                    data: {
                        Nombre: nombreUsuario, Apellido_pat: ap_pat,
                        Apellido_mat: ap_mat, num_celular: num_cel,
                        correo, domicilio, status: 1,
                        fecha_creacion: getFechaLocal(),
                    },
                }),
            });
            const result = await response.json();
            if (!response.ok) { Swal.fire('Error', result?.error || 'Error al insertar', 'error'); return; }
            Swal.fire('Registrado', 'Usuario guardado correctamente.', 'success');
            limpiar();
        } catch {
            Swal.fire('Error', 'Error de conexión con el servidor', 'error');
        } finally {
            setLoading(false);
        }
    };

    const cargaMasivaCSV = () => {
        Swal.fire({
            title: 'Carga masiva (CSV)',
            html: `<input type="file" id="csvFileInput" accept=".csv" />`,
            showCancelButton: true,
            confirmButtonText: 'Subir',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                const input = Swal.getPopup().querySelector('#csvFileInput');
                if (!input.files[0]) Swal.showValidationMessage('Selecciona un archivo CSV');
                return input.files[0];
            },
        }).then((result) => {
            if (!result.isConfirmed) return;
            Papa.parse(result.value, {
                header: true, skipEmptyLines: true,
                complete: async ({ data }) => {
                    if (!data.length) { Swal.fire('Error', 'El CSV está vacío', 'error'); return; }
                    if (!('Nombre' in data[0])) { Swal.fire('Error', 'El CSV debe tener el campo "Nombre"', 'error'); return; }
                    const fecha = getFechaLocal();
                    const usuarios = data.map(u => ({ ...u, status: 1, fecha_creacion: fecha }));
                    try {
                        const res = await fetch(API_IMPORT_CSV, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ usuarios }),
                        });
                        const resData = await res.json();
                        if (!res.ok) { Swal.fire('Error', resData.error || 'Error al importar', 'error'); return; }
                        Swal.fire('Éxito', `${usuarios.length} usuarios importados`, 'success');
                    } catch { Swal.fire('Error', 'Error al subir el CSV', 'error'); }
                },
                error: (err) => Swal.fire('Error', 'Error leyendo CSV: ' + err.message, 'error'),
            });
        });
    };

    return (
        <div className="form-page">
            <div className="form-card">
                <h2 className="form-title">Registro de Usuarios</h2>

                <button className="btn-secondary" onClick={cargaMasivaCSV}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <FaUpload /> Carga masiva por CSV
                </button>

                <form onSubmit={(e) => { e.preventDefault(); guardarUsuario(); }}>
                    <Field label="Nombre *"         value={nombreUsuario} onChange={setNombreUsuario} required />
                    <Field label="Apellido Paterno"  value={ap_pat}        onChange={setAp_pat} />
                    <Field label="Apellido Materno"  value={ap_mat}        onChange={setAp_mat} />
                    <Field label="Número de celular" value={num_cel}        onChange={setNum_cel} type="tel" />
                    <Field label="Correo electrónico" value={correo}       onChange={setCorreo}  type="email" />
                    <Field label="Domicilio"         value={domicilio}     onChange={setDomicilio} />

                    <button type="submit" className="btn-primary" disabled={loading}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <FaUserPlus /> {loading ? 'Guardando...' : 'Registrar Usuario'}
                    </button>
                </form>
            </div>
        </div>
    );
}

const Field = ({ label, value, onChange, type = 'text', required }) => (
    <div className="form-group">
        <label className="form-label">{label}</label>
        <input
            type={type}
            required={required}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="form-input"
        />
    </div>
);

export default withAuthRole(Registro_usuarios, ['admin', 'usuario', 'caja']);
