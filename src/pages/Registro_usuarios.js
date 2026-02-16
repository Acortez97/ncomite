import React, { useState } from 'react';
import Swal from 'sweetalert2';
import Papa from 'papaparse';
import withAuthRole from '../components/withAuthRole';

/* APIs PHP */
const API_INSERT = "https://comitedeaguasangaspartl.com/api/Insertgeneric/insert.php";
const API_IMPORT_CSV = "https://comitedeaguasangaspartl.com/api/Insertgeneric/importUserCsv.php";

function Registro_usuarios() {
    const [nombreUsuario, setNombreUsuario] = useState('');
    const [ap_pat, setAp_pat] = useState('');
    const [ap_mat, setAp_mat] = useState('');
    const [num_cel, setNum_cel] = useState('');
    const [correo, setCorreo] = useState('');
    const [domicilio, setDomicilio] = useState('');

    /* Fecha local YYYY-MM-DD */
    const getFechaLocal = () => {
        const now = new Date();
        const pad = (n) => n.toString().padStart(2, '0');
        const offset = now.getTimezoneOffset();
        now.setMinutes(now.getMinutes() - offset);
        return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    };

    /* REGISTRO INDIVIDUAL */
    const guardarUsuario = async () => {
        try {
            const payload = {
                Nombre: nombreUsuario,
                Apellido_pat: ap_pat,
                Apellido_mat: ap_mat,
                num_celular: num_cel,
                correo,
                domicilio,
                status: 1,
                fecha_creacion: getFechaLocal(),
            };

            const response = await fetch(API_INSERT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    table: 'usuarios',
                    data: payload,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                Swal.fire('Error', result?.error || 'Error al insertar', 'error');
                return;
            }

            Swal.fire('¡Registro exitoso!', 'Usuario guardado correctamente.', 'success');

            /* Limpiar formulario */
            setNombreUsuario('');
            setAp_pat('');
            setAp_mat('');
            setNum_cel('');
            setCorreo('');
            setDomicilio('');

        } catch (error) {
            Swal.fire('Error', 'Error de conexión con el servidor', 'error');
        }
    };

    /* CARGA MASIVA CSV */
    const cargaMasivaCSV = () => {
        Swal.fire({
            title: 'Carga masiva de usuarios (CSV)',
            html: `<input type="file" id="csvFileInput" accept=".csv" />`,
            showCancelButton: true,
            confirmButtonText: 'Subir',
            preConfirm: () => {
                const input = Swal.getPopup().querySelector('#csvFileInput');
                if (!input.files[0]) {
                    Swal.showValidationMessage('Selecciona un archivo CSV');
                }
                return input.files[0];
            },
        }).then((result) => {
            if (!result.isConfirmed) return;

            Papa.parse(result.value, {
                header: true,
                skipEmptyLines: true,
                complete: async ({ data }) => {
                    if (!data.length) {
                        Swal.fire('Error', 'El CSV está vacío', 'error');
                        return;
                    }

                    if (!('Nombre' in data[0])) {
                        Swal.fire('Error', 'El CSV debe contener el campo "Nombre"', 'error');
                        return;
                    }

                    const fecha = getFechaLocal();
                    const usuarios = data.map(u => ({
                        ...u,
                        status: 1,
                        fecha_creacion: fecha,
                    }));

                    try {
                        const response = await fetch(API_IMPORT_CSV, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ usuarios }),
                        });

                        const resData = await response.json();

                        if (!response.ok) {
                            Swal.fire('Error', resData.error || 'Error al importar CSV', 'error');
                            return;
                        }

                        Swal.fire(
                            'Éxito',
                            `Usuarios importados correctamente (${usuarios.length})`,
                            'success'
                        );
                    } catch {
                        Swal.fire('Error', 'Error al subir el CSV', 'error');
                    }
                },
                error: (err) => {
                    Swal.fire('Error', 'Error leyendo CSV: ' + err.message, 'error');
                },
            });
        });
    };

    return (
        <div style={containerStyle}>
            <h1 style={{ textAlign: 'center' }}>Registro de Usuarios</h1>

            <button onClick={cargaMasivaCSV} style={buttonStyle}>
                Carga masiva de usuarios (CSV)
            </button>

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    guardarUsuario();
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
            >
                <Input label="Nombre" value={nombreUsuario} setValue={setNombreUsuario} required />
                <Input label="Apellido Paterno" value={ap_pat} setValue={setAp_pat} />
                <Input label="Apellido Materno" value={ap_mat} setValue={setAp_mat} />
                <Input label="Número celular" value={num_cel} setValue={setNum_cel} />
                <Input label="Correo" type="email" value={correo} setValue={setCorreo} />
                <Input label="Domicilio" value={domicilio} setValue={setDomicilio} />

                <button type="submit" style={buttonStyle}>
                    Registrar Usuario
                </button>
            </form>
        </div>
    );
}

/* Input reutilizable */
const Input = ({ label, value, setValue, type = 'text', required }) => (
    <div>
        <label><b>{label}:</b></label>
        <input
            type={type}
            required={required}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            style={inputStyle}
        />
    </div>
);

export default withAuthRole(Registro_usuarios, ['admin', 'usuario', 'caja']);

/* ESTILOS */
const containerStyle = {
    maxWidth: '600px',
    margin: '40px auto',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '10px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
};

const inputStyle = {
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    marginTop: '5px',
};

const buttonStyle = {
    padding: '10px',
    backgroundColor: '#0077b6',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
};
