import { useState } from "react";
import Swal from "sweetalert2";

export default function ClienteForgotPassword() {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [usuarioValidado, setUsuarioValidado] = useState(false);

  /* ================= VALIDAR USUARIO ================= */
  const validarUsuario = async (e) => {
    e.preventDefault();

    const res = await fetch("/api/forgot_password.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario }),
    });

    const data = await res.json();

    if (data.success) {
      setUsuarioValidado(true);
      Swal.fire("Correcto", "Usuario válido. Ahora ingrese nueva contraseña.", "success");
    } else {
      Swal.fire("Error", data.error, "error");
    }
  };

  /* ================= CAMBIAR PASSWORD ================= */
  const cambiarPassword = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      Swal.fire("Error", "Mínimo 6 caracteres", "error");
      return;
    }

    const res = await fetch("/api/reset_password.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, password }),
    });

    const data = await res.json();

    if (data.success) {
      Swal.fire("Éxito", "Contraseña actualizada correctamente", "success");
      setUsuario("");
      setPassword("");
      setUsuarioValidado(false);
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    } else {
      Swal.fire("Error", data.error, "error");
    }
  };

  return (
    <div style={containerStyle}>
      <h2 style={{ textAlign: "center" }}>Recuperar contraseña</h2>

      {!usuarioValidado ? (
        <form onSubmit={validarUsuario}>
          <input
            type="text"
            placeholder="Usuario"
            required
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            style={inputStyle}
          />
          <button style={buttonStyle}>Validar Usuario</button>
        </form>
      ) : (
        <form onSubmit={cambiarPassword}>
          <input
            type="password"
            placeholder="Nueva contraseña"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
          <button style={buttonStyle}>Actualizar contraseña</button>
        </form>
      )}
    </div>
  );
}

/* ===== Estilos ===== */

const containerStyle = {
  maxWidth: 400,
  margin: "60px auto",
  padding: 20,
  background: "#f9f9f9",
  borderRadius: 8,
  boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
};

const inputStyle = {
  width: "100%",
  padding: 10,
  marginTop: 10,
  borderRadius: 6,
  border: "1px solid #ccc",
};

const buttonStyle = {
  width: "100%",
  marginTop: 15,
  padding: 10,
  background: "#0077b6",
  color: "white",
  border: "none",
  borderRadius: 6,
};
