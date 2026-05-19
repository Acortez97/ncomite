import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/authContext";

// Rutas que no requieren verificación de permisos (accesibles con solo tener el rol correcto)
const RUTAS_EXENTAS = [
  "/Admin", "/Caja", "/Usuario", "/Cliente",
  "/Registro_users", "/Ver_useradmin",
];

export default function ProtectedRoute({ children, rolesAllowed }) {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  if (!user) return <Navigate to="/login" />;

  const rol = user.rol?.toString().toLowerCase();

  if (rolesAllowed && !rolesAllowed.includes(rol)) {
    return <Navigate to="/NoAccess" />;
  }

  // Si el usuario tiene permisos definidos y la ruta no está exenta, verificar acceso
  if (
    user.permisos &&
    Array.isArray(user.permisos) &&
    !RUTAS_EXENTAS.includes(location.pathname)
  ) {
    if (!user.permisos.includes(location.pathname)) {
      return <Navigate to="/NoAccess" />;
    }
  }

  return children;
}
