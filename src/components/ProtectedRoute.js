import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/authContext";

export default function ProtectedRoute({ children, rolesAllowed }) {
  const { user } = useContext(AuthContext);

  if (!user) return <Navigate to="/login" />;

  const rol = user.rol?.toString().toLowerCase();

  if (rolesAllowed && !rolesAllowed.includes(rol)) {
    return <Navigate to="/no-autorizado" />;
  }

  return children;
}
