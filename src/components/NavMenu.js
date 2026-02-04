import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/authContext";

export default function NavMenu() {
  const { user, logout } = useContext(AuthContext);
  const [openMenu, setOpenMenu] = useState(null);

  const menu = {
    admin: [
      {
        label: "Inicio",
        path: "/Admin",
      },
      {
        label: "Usuarios",
        children: [
          { path: "/Ver_usuarios", label: "Ver usuarios" },
          { path: "/Editar_usuarios", label: "Editar usuarios" },
          { path: "/Registro_usuarios", label: "Registrar usuario" },
        ],
      },
      {
        label: "Contratos",
        children: [
          { path: "/Ver_contratos", label: "Ver contratos" },
          { path: "/Registro_contratos", label: "Registrar contrato" },
        ],
      },
      {
        label: "Pagos",
        children: [
          { path: "/Registro_pagos", label: "Registrar pago" },
          { path: "/Ver_pagos", label: "Ver pagos" },
          { path: "/Registro_AVoluntarias", label: "Registrar Aportación Voluntaria" },
          { path: "/Ver_aportaciones", label: "Ver Aportaciones Voluntarias" },
          { path: "/Registro_Salidas", label: "Registrar Salida" },
          { path: "/Ver_salidas", label: "Ver Salidas" },

        ],
      },
      {
        label: "Administrar Usuarios",
        children: [
          { path: "/Registro_users", label: "Registrar administradores" },
          { path: "/Ver_useradmin", label: "Ver administradores" },
          { path: "/Ver_clientes", label: "Ver clientes" },
        ],
      },
    ],

    caja: [
      { label: "Inicio", path: "/Caja" },
      { label: "Registrar pagos", path: "/Registro_pagos" },
      { label: "Ver pagos", path: "/Ver_pagos" },
      { path: "/Registro_AVoluntarias", label: "Registrar Aportación Voluntaria" },
      { path: "/Ver_aportaciones", label: "Ver Aportaciones Voluntarias" },
    ],

    usuario: [
      { label: "Inicio", path: "/usuario" },

      {
        label: "Usuarios",
        children: [
          { path: "/Ver_usuarios", label: "Ver usuarios" },
          { path: "/Registro_usuarios", label: "Registrar usuario" },
        ],
      },
      {
        label: "Contratos",
        children: [
          { path: "/Ver_contratos", label: "Ver contratos" },
          { path: "/Registro_contratos", label: "Registrar contrato" },
        ],
      },
      {
        label: "Pagos",
        children: [
          { path: "/Ver_pagos", label: "Ver pagos" },
          { path: "/Ver_aportaciones", label: "Ver Aportaciones Voluntarias" },

        ],
      },

    ],

    cliente: [
      { label: "Inicio", path: "/Cliente" },
      { label: "Mis datos", path: "/Ver_usuarios" },
    ],
  };

  return (
    <nav className="nav">
      <div className="nav-brand">Comité del Agua</div>

      <div className="nav-links">
        {menu[user?.rol]?.map((item, index) =>
          item.children ? (
            <div className="nav-dropdown" key={index}>
              <span
                className="nav-link"
                onClick={() =>
                  setOpenMenu(openMenu === index ? null : index)
                }
              >
                {item.label}
              </span>

              {openMenu === index && (
                <div className="dropdown-menu">
                  {item.children.map((child) => (
                    <Link
                      key={child.path}
                      to={child.path}
                      className="dropdown-item"
                      onClick={() => setOpenMenu(null)}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Link key={item.path} to={item.path} className="nav-link">
              {item.label}
            </Link>
          )
        )}
      </div>

      <button className="nav-logout" onClick={logout}>
        Salir
      </button>
    </nav>
  );
}
