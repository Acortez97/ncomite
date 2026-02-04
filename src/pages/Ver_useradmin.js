import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

// APIs PHP
const API_SELECT =
    "https://comitedeaguasangaspartl.com/api/Selectgeneric/Select_Gen.php";

const API_UPDATE =
    "https://comitedeaguasangaspartl.com/api/Updategeneric/update_generic.php";

export default function VerUsuariosAdmin() {
    const [usuarios, setUsuarios] = useState([]);
    const [search, setSearch] = useState("");

    // =================== CARGAR USUARIOS ===================
    const cargarUsuarios = () => {
        fetch(API_SELECT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                select: "*",
                table: "user_admin",
            }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (!data.error) setUsuarios(data);
            })
            .catch(() =>
                Swal.fire("Error", "No se pudieron cargar los usuarios", "error")
            );
    };

    useEffect(() => {
        cargarUsuarios();
    }, []);

    // =================== FUNCIÓN PARA TRADUCIR EL ROL ===================
    const obtenerNombreRol = (id) => {
        switch (String(id)) {
            case "1": return "Admin";
            case "2": return "Caja";
            case "3": return "Usuario";
            case "4": return "Cliente";
            default: return "Desconocido";
        }
    };

    // =================== DESACTIVAR ===================
    const desactivarUsuario = async (iduser) => {
        const confirm = await Swal.fire({
            icon: "warning",
            title: "¿Desactivar usuario?",
            showCancelButton: true,
            confirmButtonText: "Sí",
            cancelButtonText: "Cancelar",
        });

        if (!confirm.isConfirmed) return;

        const payload = {
            table: "user_admin",
            updates: { status: 0 },
            idField: "idusers",
            idValue: iduser
        };

        const res = await fetch(API_UPDATE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const result = await res.json();

        if (!res.ok || result.error) {
            Swal.fire("Error", result.error || "No se pudo desactivar", "error");
            return;
        }

        Swal.fire("Éxito", "Usuario desactivado", "success");
        cargarUsuarios();
    };

    // =================== FILTRAR ===================
    const usuariosFiltrados = usuarios.filter((u) => {
        const q = search.toLowerCase();
        return (
            u.usuario.toLowerCase().includes(q) ||
            (u.nombre?.toLowerCase().includes(q) ?? false) ||
            (u.apellido?.toLowerCase().includes(q) ?? false) ||
            obtenerNombreRol(u.id_rol).toLowerCase().includes(q)
        );
    });

    return (
        <div style={{ width: "95%", margin: "30px auto" }}>
            <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
                Usuarios Administrativos
            </h1>

            <input
                type="text"
                placeholder="Buscar usuario, nombre, rol..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={inputSearch}
            />

            <table style={tableStyle}>
                <thead style={theadStyle}>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Apellido</th>
                        <th>Usuario</th>
                        <th>Rol</th>
                        <th>Fecha Creación</th>
                        <th>Desactivar</th>
                    </tr>
                </thead>

                <tbody>
                    {usuariosFiltrados.map((u) => (
                        <tr key={u.idusers} style={rowStyle}>
                            <td>{u.idusers}</td>
                            <td>{u.nombre}</td>
                            <td>{u.apellido}</td>
                            <td>{u.usuario}</td>

                            {/* ← AQUI EL ROL TRADUCIDO */}
                            <td>{obtenerNombreRol(u.id_rol)}</td>

                            <td>{u.fecha_creacion}</td>

                            <td>
                                <button
                                    onClick={() => desactivarUsuario(u.idusers)}
                                    style={btnDelete}
                                    disabled={u.status === "0"}
                                >
                                    Desactivar
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/* =================== ESTILOS =================== */

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
    transition: "0.2s",
};

const inputSearch = {
    padding: "10px",
    width: "300px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    margin: "15px 0",
};

const btnDelete = {
    padding: "6px 12px",
    background: "red",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
};
