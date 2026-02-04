// src/pages/Login.js
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/authContext";
import Swal from "sweetalert2";

export default function Login() {
  const navigate = useNavigate(); // reemplazo de useRouter
  const { login } = useContext(AuthContext);

  const [usuario, setUsuario] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/login.php", { // apunta a tu PHP
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, pass }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Error en login");

      // Guardar usuario en contexto y localStorage
      login(data.user);

      Swal.fire({
        icon: "success",
        title: "¡Inicio de Sesión exitoso!",
        text: "Ingresando...",
        showConfirmButton: false,
        timer: 1000,
      });

      setTimeout(() => {
        navigate("/"); // redirige al home
      }, 1100);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
      });
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2 style={styles.title}>Iniciar Sesión</h2>

        <label style={styles.label}>Usuario</label>
        <input
          type="text"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          required
          style={styles.input}
        />

        <label style={styles.label}>Contraseña</label>
        <input
          type="password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          required
          style={styles.input}
        />

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? "Ingresando..." : "Iniciar Sesión"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "400px",
    margin: "80px auto",
    padding: "40px",
    background: "#f9f9f9",
    borderRadius: "10px",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  title: {
    textAlign: "center",
    marginBottom: "30px",
    color: "#003366",
  },
  label: {
    marginBottom: "5px",
    color: "#333",
  },
  input: {
    padding: "10px",
    marginBottom: "20px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    fontSize: "16px",
  },
  button: {
    padding: "12px",
    background: "#007BFF",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "16px",
  },
};
