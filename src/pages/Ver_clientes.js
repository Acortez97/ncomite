import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

const API_LOGIN_JOIN = "https://comitedeaguasangaspartl.com/api/Selectgeneric/clientes_login_join.php";
const API_INSERT = "https://comitedeaguasangaspartl.com/api/Insertgeneric/insert.php";

export default function CrearAccesosLogin() {
    const [data, setData] = useState([]); // Datos originales
    const [filteredData, setFilteredData] = useState([]); // Datos para mostrar
    const [searchTerm, setSearchTerm] = useState("");
    const [compact, setCompact] = useState(false); // Estado para tabla compacta

    // Estados de Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20); // Cambia aquí cuántos ver por página

    const cargarDatos = () => {
        fetch(API_LOGIN_JOIN)
            .then((res) => res.json())
            .then((resData) => {
                setData(resData);
                setFilteredData(resData);
            })
            .catch(() => Swal.fire("Error", "No se pudieron cargar los datos", "error"));
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    // Lógica de Búsqueda
    useEffect(() => {
        const results = data.filter((u) =>
            u.id_usuario.toString().includes(searchTerm.toLowerCase()) ||
            u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.apellido_pat.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredData(results);
        setCurrentPage(1); // Reiniciar a página 1 al buscar
    }, [searchTerm, data]);

    // Lógica de Paginación
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const crearAcceso = async (u) => {
        const primerNombre = u.nombre.trim().split(" ")[0];
        const usuarioLogin = `${u.id_usuario}${primerNombre}`;
        const passMD5 = "d1ba957ebc4998838e4a880aef3183d3"; // MD5 de Temporal123

        try {
            const res = await fetch(API_INSERT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    table: "clientes_login",
                    data: {
                        id_usuario: u.id_usuario,
                        usuario: usuarioLogin,
                        pass: passMD5,
                        status: 1
                    }
                })
            });

            if (res.ok) {
                Swal.fire("¡Éxito!", `Acceso creado para ${usuarioLogin}`, "success");
                cargarDatos();
            }
        } catch (err) {
            Swal.fire("Error", "No se pudo crear el registro", "error");
        }
    };

    return (
        <div style={{ width: "95%", margin: "20px auto", fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif' }}>
            <h2 style={{ textAlign: "center", color: '#0f4c75' }}>Administración de Accesos Masivos</h2>

            {/* Barra de Herramientas */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '10px', flexWrap: 'wrap' }}>

                <input
                    type="text"
                    placeholder="Buscar por ID o Nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ padding: '10px', width: '300px', borderRadius: '5px', border: '1px solid #ccc' }}
                />

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => setCompact(!compact)}
                        style={{ ...styles.btnSecundary, backgroundColor: compact ? '#3282b8' : '#6c757d' }}>
                        {compact ? "Vista Normal" : "Vista Compacta"}
                    </button>
                    <span style={{ alignSelf: 'center', fontWeight: 'bold' }}>Total: {filteredData.length} usuarios</span>
                </div>
            </div>

            {/* Tabla */}
            <div style={{ overflowX: 'auto', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ background: "#0f4c75", color: "white" }}>
                            <th style={compact ? styles.thCompact : styles.th}>ID</th>
                            <th style={compact ? styles.thCompact : styles.th}>Nombre Completo</th>
                            <th style={compact ? styles.thCompact : styles.th}>Estado</th>
                            <th style={compact ? styles.thCompact : styles.th}>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map((u) => (
                            <tr key={u.id_usuario} style={{ borderBottom: "1px solid #eee", fontSize: compact ? '12px' : '14px' }}>
                                <td style={compact ? styles.tdCompact : styles.td}>{u.id_usuario}</td>
                                <td style={{ ... (compact ? styles.tdCompact : styles.td), textAlign: 'left' }}>
                                    {u.nombre} {u.apellido_pat} {u.apellido_mat}
                                </td>
                                <td style={{ ... (compact ? styles.tdCompact : styles.td), fontWeight: 'bold', color: u.id_login ? 'green' : 'red' }}>
                                    {u.id_login ? "ACTIVO" : "SIN ACCESO"}
                                </td>
                                <td style={compact ? styles.tdCompact : styles.td}>
                                    {u.id_login ? (
                                        <span style={{ color: 'gray' }}>{u.usuario_login}</span>
                                    ) : (
                                        <button onClick={() => crearAcceso(u)} style={compact ? styles.btnCompact : styles.btn}>
                                            Crear
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Paginación */}
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '5px' }}>
                <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    style={styles.btnPagination}> Anterior </button>

                <span style={{ padding: '8px 15px' }}>Página {currentPage} de {totalPages}</span>

                <button
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    style={styles.btnPagination}> Siguiente </button>
            </div>
        </div>
    );
}

const styles = {
    th: { padding: "12px", textAlign: 'center' },
    td: { padding: "10px", textAlign: 'center' },
    thCompact: { padding: "5px", textAlign: 'center', fontSize: '12px' },
    tdCompact: { padding: "4px", textAlign: 'center', fontSize: '11px' },
    btn: {
        padding: "6px 15px", background: "#1b7bd1", color: "white",
        border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold"
    },
    btnCompact: {
        padding: "2px 8px", background: "#1b7bd1", color: "white",
        border: "none", borderRadius: "3px", cursor: "pointer", fontSize: '10px'
    },
    btnSecundary: {
        padding: "8px 15px", color: "white", border: "none", borderRadius: "5px", cursor: "pointer"
    },
    btnPagination: {
        padding: '8px 15px', background: '#f8f9fa', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer'
    }
};