import React, { useContext, useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/authContext";
import {
  FaHome, FaUsers, FaFileContract, FaMoneyBillWave, FaUserShield,
  FaExclamationTriangle, FaSignOutAlt, FaChevronDown, FaChevronUp,
  FaBars, FaTimes, FaTint, FaChartBar, FaClock, FaMapMarkedAlt,
} from "react-icons/fa";

const iconMap = {
  "Inicio":               <FaHome />,
  "Usuarios":             <FaUsers />,
  "Contratos":            <FaFileContract />,
  "Pagos":                <FaMoneyBillWave />,
  "Administrar Usuarios": <FaUserShield />,
  "Adeudos":              <FaExclamationTriangle />,
  "Registrar pagos":      <FaMoneyBillWave />,
  "Ver pagos":            <FaMoneyBillWave />,
  "Reportes":             <FaChartBar />,
  "Actividad":            <FaClock />,
  "Mi Cuenta":            <FaFileContract />,
  "Mapa":                 <FaMapMarkedAlt />,
};

export default function NavMenu() {
  const { user, logout } = useContext(AuthContext);
  const [openMenu, setOpenMenu]   = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile]   = useState(window.innerWidth < 900);
  const location = useLocation();
  const navRef = useRef(null);

  // Detectar tamaño de pantalla
  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 900;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Cerrar menú al navegar
  useEffect(() => {
    setMobileOpen(false);
    setOpenMenu(null);
  }, [location.pathname]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const menu = {
    admin: [
      { label: "Inicio", path: "/Admin" },
      {
        label: "Usuarios",
        children: [
          { path: "/Ver_usuarios",      label: "Ver usuarios" },
          { path: "/Editar_usuarios",   label: "Editar usuarios" },
          { path: "/Registro_usuarios", label: "Registrar usuario" },
        ],
      },
      {
        label: "Contratos",
        children: [
          { path: "/Ver_contratos",      label: "Ver contratos" },
          { path: "/Registro_contratos", label: "Registrar contrato" },
        ],
      },
      {
        label: "Pagos",
        children: [
          { path: "/Registro_pagos",        label: "Registrar pago" },
          { path: "/Ver_pagos",             label: "Ver pagos" },
          { path: "/Registro_AVoluntarias", label: "Aportación Voluntaria" },
          { path: "/Ver_aportaciones",      label: "Ver Aportaciones" },
          { path: "/Registro_Salidas",      label: "Registrar Salida" },
          { path: "/Ver_salidas",           label: "Ver Salidas" },
          { path: "/Registro_Pcontratos",   label: "Pago de Contrato" },
        ],
      },
      {
        label: "Administrar Usuarios",
        children: [
          { path: "/Registro_users", label: "Registrar administradores" },
          { path: "/Ver_useradmin",  label: "Ver administradores" },
          { path: "/Ver_clientes",   label: "Ver clientes" },
        ],
      },
      {
        label: "Adeudos",
        children: [{ path: "/Ver_adeudos", label: "Ver adeudos" }],
      },
      {
        label: "Reportes",
        children: [
          { path: "/Reporte_FlujoCaja", label: "Flujo de Caja" },
          { path: "/Reporte_Adeudos",   label: "Reporte de Adeudos" },
          { path: "/Reporte_Actividad", label: "Actividad Reciente" },
        ],
      },
      { label: "Mapa", path: "/Mapa" },
    ],

    caja: [
      { label: "Inicio",          path: "/Caja" },
      { label: "Registrar pagos", path: "/Registro_pagos" },
      { label: "Ver pagos",       path: "/Ver_pagos" },
      { path: "/Registro_AVoluntarias", label: "Aportación Voluntaria" },
      { path: "/Ver_aportaciones",      label: "Ver Aportaciones" },
      { path: "/Ver_adeudos",           label: "Ver adeudos" },
      { path: "/Registro_Pcontratos",   label: "Pago de Contrato" },
      { path: "/Registro_usuarios",     label: "Registrar usuario" },
    ],

    usuario: [
      { label: "Inicio", path: "/usuario" },
      {
        label: "Usuarios",
        children: [
          { path: "/Ver_usuarios",      label: "Ver usuarios" },
          { path: "/Registro_usuarios", label: "Registrar usuario" },
        ],
      },
      {
        label: "Contratos",
        children: [
          { path: "/Ver_contratos",      label: "Ver contratos" },
          { path: "/Registro_contratos", label: "Registrar contrato" },
        ],
      },
      {
        label: "Pagos",
        children: [
          { path: "/Ver_pagos",        label: "Ver pagos" },
          { path: "/Ver_aportaciones", label: "Ver Aportaciones" },
          { path: "/Ver_adeudos",      label: "Ver adeudos" },
        ],
      },
      { label: "Mapa", path: "/Mapa" },
    ],

    cliente: [
      { label: "Inicio",      path: "/Cliente" },
      { label: "Mis datos",   path: "/cliente_datos" },
      {
        label: "Mi Cuenta",
        children: [
          { path: "/Cliente_EstadoCuenta",          label: "Estado de Cuenta" },
          { path: "/Cliente_HistorialPagos",        label: "Historial de Pagos" },
          { path: "/Cliente_HistorialAportaciones", label: "Mis Aportaciones" },
        ],
      },
      { label: "Contáctanos", path: "/contactanos" },
    ],
  };

  const isActive      = (path)     => location.pathname === path;
  const isGroupActive = (children) => children?.some(c => location.pathname === c.path);

  // Rutas siempre visibles sin importar permisos
  const RUTAS_EXENTAS = ["/Admin", "/Caja", "/Usuario", "/Cliente", "/Registro_users", "/Ver_useradmin", "/Mapa"];

  const puedeVer = (path) => {
    if (RUTAS_EXENTAS.includes(path)) return true;
    if (!user?.permisos || !Array.isArray(user.permisos)) return true;
    return user.permisos.includes(path);
  };

  const filtrarMenu = (items = []) =>
    items
      .map(item => {
        if (item.children) {
          const hijos = item.children.filter(c => puedeVer(c.path));
          return hijos.length > 0 ? { ...item, children: hijos } : null;
        }
        return puedeVer(item.path) ? item : null;
      })
      .filter(Boolean);

  // ── Ítem de menú (reutilizable en desktop y mobile) ──
  const renderItems = (isMobileLayout) =>
    filtrarMenu(menu[user?.rol]).map((item, index) =>
      item.children ? (
        <div key={index} style={isMobileLayout ? n.mobileGroup : n.dropdown}>
          <button
            style={{
              ...(isMobileLayout ? n.mobileGroupBtn : n.dropBtn),
              ...(isGroupActive(item.children)
                ? (isMobileLayout ? n.mobileGroupBtnActive : n.dropBtnActive)
                : {}),
            }}
            onClick={() => setOpenMenu(openMenu === index ? null : index)}
          >
            <span style={{ marginRight: 7 }}>{iconMap[item.label]}</span>
            {item.label}
            <span style={{ marginLeft: "auto", paddingLeft: 8, fontSize: 11 }}>
              {openMenu === index ? <FaChevronUp /> : <FaChevronDown />}
            </span>
          </button>

          {/* Submenú */}
          {openMenu === index && (
            <div style={isMobileLayout ? n.mobileSubMenu : n.dropMenu}>
              {item.children.map((child) => (
                <Link
                  key={child.path}
                  to={child.path}
                  style={{
                    ...(isMobileLayout ? n.mobileSubItem : n.dropItem),
                    ...(isActive(child.path)
                      ? (isMobileLayout ? n.mobileSubItemActive : n.dropItemActive)
                      : {}),
                  }}
                >
                  {child.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <Link
          key={item.path}
          to={item.path}
          style={{
            ...(isMobileLayout ? n.mobileLink : n.link),
            ...(isActive(item.path)
              ? (isMobileLayout ? n.mobileLinkActive : n.linkActive)
              : {}),
          }}
        >
          <span style={{ marginRight: 7 }}>{iconMap[item.label]}</span>
          {item.label}
        </Link>
      )
    );

  return (
    <nav ref={navRef} style={n.nav}>
      {/* ── Brand ── */}
      <div style={n.brand}>
        <FaTint size={16} style={{ marginRight: 7 }} />
        Comité del Agua
      </div>

      {/* ── Desktop: links horizontales ── */}
      {!isMobile && (
        <div style={n.links}>{renderItems(false)}</div>
      )}

      {/* ── Desktop: logout ── */}
      {!isMobile && (
        <button style={n.logout} onClick={logout}>
          <FaSignOutAlt style={{ marginRight: 6 }} />
          Salir
        </button>
      )}

      {/* ── Mobile: hamburger ── */}
      {isMobile && (
        <button
          style={n.hamburger}
          onClick={() => { setMobileOpen(!mobileOpen); setOpenMenu(null); }}
          aria-label="Menú"
        >
          {mobileOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>
      )}

      {/* ── Mobile: menú desplegable ── */}
      {isMobile && mobileOpen && (
        <div style={n.mobileMenu}>
          {renderItems(true)}

          <button style={n.mobileLogout} onClick={logout}>
            <FaSignOutAlt style={{ marginRight: 8 }} />
            Cerrar sesión
          </button>
        </div>
      )}
    </nav>
  );
}

/* ── ESTILOS ── */
const n = {
  /* Navbar bar */
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#0f4c75",
    padding: "0 20px",
    height: 56,
    position: "sticky",
    top: 0,
    zIndex: 1000,
    boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
    flexWrap: "wrap",
  },
  brand: {
    fontWeight: 700,
    fontSize: 16,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    whiteSpace: "nowrap",
  },

  /* ── Desktop ── */
  links: {
    display: "flex",
    gap: 2,
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  link: {
    color: "rgba(255,255,255,0.85)",
    textDecoration: "none",
    padding: "6px 11px",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
  },
  linkActive: {
    background: "rgba(255,255,255,0.18)",
    color: "#fff",
    fontWeight: 700,
  },
  dropdown: { position: "relative" },
  dropBtn: {
    background: "none",
    border: "none",
    color: "rgba(255,255,255,0.85)",
    cursor: "pointer",
    padding: "6px 11px",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    height: 56,
    whiteSpace: "nowrap",
  },
  dropBtnActive: {
    background: "rgba(255,255,255,0.18)",
    color: "#fff",
    fontWeight: 700,
  },
  dropMenu: {
    position: "absolute",
    top: "100%",
    left: 0,
    background: "#fff",
    borderRadius: 8,
    minWidth: 210,
    boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
    zIndex: 1100,
    padding: "6px 0",
    border: "1px solid #e8eef4",
  },
  dropItem: {
    display: "block",
    padding: "9px 16px",
    color: "#2c3e50",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 500,
  },
  dropItemActive: {
    background: "#eaf3fb",
    color: "#0f4c75",
    fontWeight: 700,
  },
  logout: {
    background: "#c0392b",
    border: "none",
    color: "#fff",
    padding: "7px 14px",
    borderRadius: 7,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    whiteSpace: "nowrap",
  },

  /* ── Mobile hamburger ── */
  hamburger: {
    background: "none",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    padding: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  /* ── Mobile menú desplegado ── */
  mobileMenu: {
    width: "100%",
    background: "#0d3f63",
    padding: "8px 0 12px",
    display: "flex",
    flexDirection: "column",
  },
  mobileLink: {
    color: "rgba(255,255,255,0.88)",
    textDecoration: "none",
    padding: "12px 20px",
    fontSize: 15,
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
  },
  mobileLinkActive: {
    background: "rgba(255,255,255,0.12)",
    color: "#fff",
    fontWeight: 700,
  },
  mobileGroup: {
    display: "flex",
    flexDirection: "column",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
  },
  mobileGroupBtn: {
    background: "none",
    border: "none",
    color: "rgba(255,255,255,0.88)",
    cursor: "pointer",
    padding: "12px 20px",
    fontSize: 15,
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    textAlign: "left",
  },
  mobileGroupBtnActive: {
    background: "rgba(255,255,255,0.12)",
    color: "#fff",
    fontWeight: 700,
  },
  mobileSubMenu: {
    background: "rgba(0,0,0,0.2)",
    display: "flex",
    flexDirection: "column",
  },
  mobileSubItem: {
    color: "rgba(255,255,255,0.8)",
    textDecoration: "none",
    padding: "10px 20px 10px 44px",
    fontSize: 14,
    display: "block",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  mobileSubItemActive: {
    color: "#fff",
    fontWeight: 700,
    background: "rgba(255,255,255,0.1)",
  },
  mobileLogout: {
    background: "#c0392b",
    border: "none",
    color: "#fff",
    margin: "14px 20px 4px",
    padding: "12px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 15,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};
