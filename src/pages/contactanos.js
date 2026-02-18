import React, { useState, useContext } from "react";
import Swal from "sweetalert2";
import { AuthContext } from "../context/authContext";

const API_CONTACTO =
    "https://comitedeaguasangaspartl.com/api/send_mail.php";

export default function ClienteContacto() {
    const { user } = useContext(AuthContext);

    const [correo, setCorreo] = useState(user?.correo || "");
    const [telefono, setTelefono] = useState(user?.telefono || "");
    const [mensaje, setMensaje] = useState("");
    const [loading, setLoading] = useState(false);

    const enviarMensaje = async (e) => {
        e.preventDefault();

        if (!correo || !mensaje.trim()) {
            return Swal.fire("Error", "Correo y mensaje son obligatorios", "error");
        }

        setLoading(true);

        const payload = {
            nombre: user?.Nombre || "",
            correo,
            telefono,
            mensaje,
        };

        try {
            const res = await fetch(API_CONTACTO, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (data.error) {
                Swal.fire("Error", data.error, "error");
            } else {
                Swal.fire("Éxito", "Mensaje enviado correctamente", "success");
                setMensaje("");
                setCorreo("");
                setTelefono("");
            }
        } catch (err) {
            Swal.fire("Error", "Error al enviar mensaje", "error");
        }

        setLoading(false);
    };

    return (
        <div style={styles.container}>
            <h2>Contacto</h2>

            <form onSubmit={enviarMensaje} style={styles.form}>
                {/* Nombre fijo */}
                <div style={styles.field}>
                    <label>Nombre</label>
                    <input
                        type="text"
                        value={user?.Nombre || ""}
                        disabled
                        style={styles.inputDisabled}
                    />
                </div>

                {/* Correo editable */}
                <div style={styles.field}>
                    <label>Correo electrónico</label>
                    <input
                        type="email"
                        value={correo}
                        onChange={(e) => setCorreo(e.target.value)}
                        style={styles.input}
                        required
                    />
                </div>

                {/* Teléfono editable */}
                <div style={styles.field}>
                    <label>Teléfono</label>
                    <input
                        type="text"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        style={styles.input}
                    />
                </div>

                {/* Mensaje */}
                <div style={styles.field}>
                    <label>**¿Tienes alguna duda o reporte?
                        Describe tu situación y ayúdanos a brindarte una respuesta más rápida agregando tus datos de contacto.
                        Por ejemplo: tu número de contrato, la dirección de tu toma de agua (con referencias de calles)
                        o simplemente una breve explicación de lo sucedido. **</label>

                    <label>Mensaje</label>
                    <textarea
                        value={mensaje}
                        onChange={(e) => setMensaje(e.target.value)}
                        style={styles.textarea}
                        required
                    />
                </div>

                <button type="submit" style={styles.button} disabled={loading}>
                    {loading ? "Enviando..." : "Enviar mensaje"}
                </button>
            </form>
        </div>
    );
}

/* ===================== ESTILOS ===================== */

const styles = {
    container: {
        maxWidth: 600,
        margin: "40px auto",
        padding: 25,
        background: "#f9f9f9",
        borderRadius: 10,
        boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: 15,
    },
    field: {
        display: "flex",
        flexDirection: "column",
        gap: 5,
    },
    input: {
        padding: 10,
        borderRadius: 6,
        border: "1px solid #ccc",
    },
    inputDisabled: {
        padding: 10,
        borderRadius: 6,
        border: "1px solid #ddd",
        backgroundColor: "#eee",
    },
    textarea: {
        minHeight: 120,
        padding: 10,
        borderRadius: 6,
        border: "1px solid #ccc",
    },
    button: {
        padding: 12,
        background: "#0077b6",
        color: "white",
        border: "none",
        borderRadius: 6,
        cursor: "pointer",
    },
};
