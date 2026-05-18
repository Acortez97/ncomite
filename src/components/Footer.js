import React from "react";

export default function Footer() {
  return (
    <footer className="footer">
      <p>© {new Date().getFullYear()} Comité del Agua de San Gaspar Tlahuelilpan, Metepec, Edo. Méx.</p>
      <p style={{ fontSize: "0.85em", opacity: 0.75, marginTop: 4 }}>
        Powered by Adrian Cortez — Todos los derechos reservados.
      </p>
    </footer>
  );
}
