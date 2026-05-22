import React, { useState, useContext } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { AuthContext } from "../context/authContext";
import Swal from "sweetalert2";
import "../App.css";
import { apiFetch } from "../Api/apiFetch";

export default function Login() {
  const navigate = useNavigate();
  const { login, user } = useContext(AuthContext);

  const [tipo, setTipo] = useState("admin");
  const [usuario, setUsuario] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔹 POPUP PROFESIONAL (POWERED BY)
  const showInfo = () => {
    const stack = [
      { label: "React", color: "#61dafb", bg: "#e8f9fe" },
      { label: "Node.js", color: "#3d9970", bg: "#e8f5ee" },
      { label: "PHP", color: "#7b7fb5", bg: "#eeeff8" },
      { label: "Python", color: "#3776ab", bg: "#e8f1fb" },
      { label: "MySQL", color: "#e48e00", bg: "#fdf3e0" },
      { label: "Azure", color: "#0078d4", bg: "#e5f2fd" },
      { label: "AWS", color: "#e25c1a", bg: "#fdeee8" },
      { label: "IA / LLMs", color: "#6d28d9", bg: "#f0ebff" },
    ];

    Swal.fire({
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif; padding:4px 0 8px;">

          <!-- Avatar con iniciales -->
          <div style="
            width:76px; height:76px; border-radius:50%;
            background:linear-gradient(135deg,#1a1a2e,#16213e,#0f3460);
            display:flex; align-items:center; justify-content:center;
            margin:0 auto 14px;
            box-shadow:0 6px 24px rgba(0,0,0,0.28);
            font-size:1.55rem; font-weight:800; color:#fff;
            letter-spacing:1px;
          ">AC</div>

          <!-- Nombre y rol -->
          <h2 style="margin:0 0 3px; font-size:1.45rem; color:#0f3460; font-weight:700; letter-spacing:-.3px;">
            Adrian Cortez
          </h2>
          <p style="margin:0 0 2px; color:#444; font-size:0.88rem; font-weight:600;">
            Desarrollador de Software &amp; Consultor Tecnológico
          </p>
          <p style="margin:0 0 20px; color:#888; font-size:0.78rem;">
            Desarrollo a la medida · Integraciones con IA · Cloud · Soporte
          </p>

          <!-- Stack tecnológico -->
          <div style="
            background:#f8f9fb; border:1px solid #eaecf0; border-radius:10px;
            padding:14px 12px; margin-bottom:18px;
          ">
            <p style="margin:0 0 10px; font-size:0.72rem; font-weight:700; color:#999; text-transform:uppercase; letter-spacing:1px;">
              Stack &amp; Tecnologías
            </p>
            <div style="display:flex; flex-wrap:wrap; gap:7px; justify-content:center;">
              ${stack.map(t => `
                <span style="
                  background:${t.bg}; color:${t.color};
                  border:1px solid ${t.color}33;
                  border-radius:6px; padding:4px 11px;
                  font-size:0.76rem; font-weight:700;
                ">${t.label}</span>
              `).join("")}
            </div>
          </div>

          <!-- Contacto -->
          <div style="display:flex; flex-direction:column; gap:8px; align-items:center;">
            <a href="mailto:adriancortezv97@gmail.com" style="
              display:flex; align-items:center; gap:10px;
              background:#fff; border:1.5px solid #e2e8f0;
              border-radius:9px; padding:10px 18px; text-decoration:none;
              color:#1a202c; font-size:0.85rem; font-weight:500;
              width:100%; max-width:290px; box-sizing:border-box;
            ">
              <span style="font-size:1rem;">✉️</span>
              <span>adriancortezv97@gmail.com</span>
            </a>
            <a href="tel:+527295426360" style="
              display:flex; align-items:center; gap:10px;
              background:#fff; border:1.5px solid #e2e8f0;
              border-radius:9px; padding:10px 18px; text-decoration:none;
              color:#1a202c; font-size:0.85rem; font-weight:500;
              width:100%; max-width:290px; box-sizing:border-box;
            ">
              <span style="font-size:1rem;">📱</span>
              <span>+52 729 542 6360</span>
            </a>
          </div>

          <p style="margin:18px 0 0; font-size:0.72rem; color:#c0c0c0;">
            © ${new Date().getFullYear()} Adrian Cortez — Todos los derechos reservados
          </p>
        </div>
      `,
      showConfirmButton: true,
      confirmButtonText: "Cerrar",
      confirmButtonColor: "#0f3460",
      width: 460,
      padding: "30px 28px 24px",
      background: "#fff",
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
      const res = await apiFetch(endpoint, {
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
      {/* Blobs animados */}
      <div className="blob blob1"></div>
      <div className="blob blob2"></div>
      <div className="blob blob3"></div>

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

      {/* FOOTER */}
      <div style={{ ...styles.footer, whiteSpace: "normal", textAlign: "center", lineHeight: 1.6 }}>
        © {new Date().getFullYear()} Comité del Agua, San Gaspar Tlahuelilpan &nbsp;·&nbsp;{" "}
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
    bottom: "12px",
    left: "50%",
    transform: "translateX(-50%)",
    whiteSpace: "nowrap",
    background: "rgba(0,0,0,0.45)",
    backdropFilter: "blur(6px)",
    borderRadius: "20px",
    padding: "6px 18px",
    fontSize: "11px",
    color: "#ffffffdd",
    zIndex: 10,
    maxWidth: "92vw",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  link: {
    color: "#90e0ef",
    cursor: "pointer",
    fontWeight: "bold",
    textDecoration: "underline",
    textDecorationColor: "transparent",
  },
};