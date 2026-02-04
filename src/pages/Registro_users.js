import React, { useState } from "react";
import Swal from "sweetalert2";

// 🚨 IMPORTANTE: TU API PHP REAL
const API_INSERT_USER =
  "https://comitedeaguasangaspartl.com/api/Insertgeneric/insert_user_admin.php";

function RegistroUsersAdmin() {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [usuario, setUsuario] = useState("");
  const [pass, setPass] = useState("");
  const [rol, setRol] = useState("");

  // Fecha local YYYY-MM-DD
  function getFechaLocal() {
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate()
    )}`;
  }

  // ------------------- GUARDAR USUARIO -------------------
  const guardarUsuario = async () => {
    if (!nombre || !usuario || !pass || !rol) {
      Swal.fire({
        icon: "error",
        title: "Campos incompletos",
        text: "Todos los campos excepto apellido son obligatorios.",
      });
      return;
    }

    const payload = {
      usuario: usuario,
      pass: pass, // se encripta en PHP (MD5)
      id_rol: rol,
      nombre,
      apellido,
      status: 1,
      fecha_creacion: getFechaLocal(),
    };

    try {
      const res = await fetch(API_INSERT_USER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("Respuesta API:", data);

      if (!res.ok || data.error) {
        throw new Error(data.error || "Error al registrar usuario");
      }

      Swal.fire({
        icon: "success",
        title: "Usuario registrado",
        text: "El usuario fue creado correctamente.",
      });

      setNombre("");
      setApellido("");
      setUsuario("");
      setPass("");
      setRol("");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
      });
    }
  };

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "40px auto",
        padding: "20px",
        backgroundColor: "#f9f9f9",
        borderRadius: "10px",
        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>
        Registro de Usuarios (Admin/Caja/Usuario)
      </h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          guardarUsuario();
        }}
        style={{ display: "flex", flexDirection: "column", gap: "20px" }}
      >
        <div>
          <label>
            <b>Nombre:</b>
          </label>
          <input
            type="text"
            required
            placeholder="NOMBRE DEL USUARIO"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label>
            <b>Apellido:</b>
          </label>
          <input
            type="text"
            placeholder="APELLIDO O APELLIDOS"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label>
            <b>Usuario:</b>
          </label>
          <input
            type="text"
            required
            placeholder="USUARIO PARA INICIAR SESIÓN"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label>
            <b>Contraseña:</b>
          </label>
          <input
            type="password"
            required
            placeholder="CONTRASEÑA"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label>
            <b>Rol:</b>
          </label>
          <select
            required
            value={rol}
            onChange={(e) => setRol(e.target.value)}
            style={inputStyle}
          >
            <option value="">Seleccione rol</option>
            <option value="1">Administrador</option>
            <option value="2">Caja</option>
            <option value="3">Usuario común</option>
          </select>
        </div>

        <button type="submit" style={buttonStyle}>
          Registrar Usuario
        </button>
      </form>
    </div>
  );
}

export default RegistroUsersAdmin;

// 🎨 Estilos
const inputStyle = {
  width: "100%",
  padding: "10px",
  fontSize: "0.95rem",
  border: "1px solid #ccc",
  borderRadius: "6px",
  marginTop: "5px",
};

const buttonStyle = {
  padding: "10px 20px",
  backgroundColor: "#0077b6",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  marginTop: "10px",
};
