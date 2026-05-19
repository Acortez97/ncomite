import React, { createContext, useState, useEffect } from "react";
import { API } from "../Api/api.config";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = async () => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const { token } = JSON.parse(stored);
        if (token) {
          await fetch(API.LOGOUT, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      } catch {
        // best-effort, ignore network errors on logout
      }
    }
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
