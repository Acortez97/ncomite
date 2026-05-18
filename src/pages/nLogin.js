import React, { useState, useContext } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { AuthContext } from "../context/authContext";
import Swal from "sweetalert2";
import "../App.css";

export default function Login() {
  const navigate = useNavigate();
  const { login, user } = useContext(AuthContext);

  const [tipo, setTipo] = useState("admin");
  const [usuario, setUsuario] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔹 POPUP PROFESIONAL (POWERED BY)
  const showInfo = () => {
    Swal.fire({
      title: "Comité del Agua de San Gaspar Tlahuelilpan, Metepec, Edo. Méx.",
      html: `
    <div style="text-align:center">
      <h3>Solución desarrollada por</h3>
      <h2 style="color:#0077b6;">Adrian Cortez</h2>

      <p style="margin-top:10px;">
        Desarrollo de sistemas web a la medida
      </p>

      <hr/>

      <p><b>Tecnologías:</b></p>
      <p>React • PHP • MySQL • AWS</p>

      <hr/>

      <p><b>Contacto</b></p>
      <p style="margin:5px 0;">📧 adriancortezv97@gmail.com</p>
      <p style="margin:5px 0;">📱 +52 729 542 6360</p>

      <p style="font-size:12px; margin-top:10px;">
        Soporte, mejoras o nuevos desarrollos
      </p>

      <p style="margin-top:15px; font-size:12px;">
        © ${new Date().getFullYear()} Todos los derechos reservados
      </p>
    </div>
  `,
      confirmButtonText: "Cerrar",
      width: 500,
    });
  };

  if (user) {
    if (user.rol === "admin") return <Navigate to="/Admin" />;
    if (user.rol === "caja") return <Navigate to="/Caja" />;
    if (user.rol === "usuario") return <Navigate to="/Usuario" />;
    if (user.rol === "cliente") return <Navigate to="/Cliente" />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const endpoint =
      tipo === "admin"
        ? "/api/login_admin.php"
        : "/api/login_cliente.php";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, pass }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error en login");

      login(data.user);

      Swal.fire({
        icon: "success",
        title: "¡Bienvenido!",
        text: "Accediendo al sistema...",
        timer: 1200,
        showConfirmButton: false,
      });

      setTimeout(() => {
        navigate(
          `/${data.user.rol.charAt(0).toUpperCase() + data.user.rol.slice(1)}`
        );
      }, 1300);
    } catch (error) {
      Swal.fire("Error", error.message, "error");
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Olas animadas */}
      <div className="wave wave1"></div>
      <div className="wave wave2"></div>

      <h1 className="login-title">
        Página Oficial del Comité del Agua de San Gaspar Tlahuelilpan, Metepec.
      </h1>

      {/* CONTENEDOR PARALELO */}
      <div className="login-content">
        <img
          src="/logoagua.ico"
          alt="Agua"
          className="login-image"
        />

        <div className="login-card">
          <div className="login-toggle">
            <button
              className={tipo === "admin" ? "btn active" : "btn"}
              onClick={() => setTipo("admin")}
            >
              Administrador
            </button>
            <button
              className={tipo === "cliente" ? "btn active" : "btn"}
              onClick={() => setTipo("cliente")}
            >
              Cliente
            </button>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <h2>
              Iniciar Sesión ({tipo === "admin" ? "Administrador" : "Cliente"})
            </h2>

            <input
              type="text"
              placeholder="Usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Contraseña"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              required
            />

            <button disabled={loading}>
              {loading ? "Ingresando..." : "Entrar"}
            </button>

            {tipo === "cliente" && (
              <div style={{ textAlign: "center", marginTop: 15 }}>
                <a href="/cambiar_pass" style={{ color: "#0077b6" }}>
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* 🔹 FOOTER DISCRETO (NO INTERFIERE CON NADA) */}
      <div style={styles.footer}>
        © {new Date().getFullYear()} Comité del Agua de San Gaspar Tlahuelilpan, Metepec, Edo Méx. |{" "}
        <span onClick={showInfo} style={styles.link}>
          Powered by Adrian Cortez
        </span>
      </div>
    </div>
  );
}

// 🔹 ESTILOS AISLADOS (NO ROMPEN TU CSS)
const styles = {
  footer: {
    position: "fixed",
    bottom: "10px",
    width: "100%",
    textAlign: "center",
    fontSize: "12px",
    color: "#ffffffcc",
    zIndex: 10,
  },
  link: {
    color: "#90e0ef",
    cursor: "pointer",
    fontWeight: "bold",
  },
};