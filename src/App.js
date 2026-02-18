// src/App.js
import React from 'react';
//import '../styles/globals.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/authContext';
import Layout from './components/nLayout';
//import Home from './pages/index';
import Login from './pages/nLogin';
import { Helmet } from 'react-helmet'; // npm install react-helmet
import logo from './logoagua.png';
import './App.css';
import Footer from './components/Footer';
import VerUsuarios from "./pages/Ver_usuarios";
import EditarUsuarios from "./pages/Editar_usuarios";
import RegistroUsuarios from "./pages/Registro_usuarios";
import VerContratos from "./pages/Ver_contratos";
import ProtectedRoute from "./components/ProtectedRoute";
import NoAccess from "./pages/NoAccess";
import RegistroContratos from "./pages/Registro_contratos";
import RegistroPagos from "./pages/Registro_pagos";
import VerPagos from "./pages/Ver_pagos";
import RegistroAportacionVoluntaria from "./pages/Registro_Avoluntarias";
import VerAportacionesVoluntarias from "./pages/Ver_aportaciones";
import VerSalidas from "./pages/Ver_salidas";
import RegistroSalidas from "./pages/Registro_Salidas";
import RegistroUsersAdmin from "./pages/Registro_users";
import VerUsersAdmin from "./pages/Ver_useradmin";
import VerClientes from "./pages/Ver_clientes";
import VerAdeudos from "./pages/Ver_adeudos";
import RegistroPagosContratos from "./pages/Registro_Pcontratos";
import ClientePerfil from "./pages/cliente_datos";
import ClienteForgotPassword from "./pages/cambiar_pass";
import ClienteContacto from "./pages/contactanos";

import AdminHome from "./pages/Admin";
import CajaHome from "./pages/Caja";
import UsuarioHome from "./pages/Usuario";
import ClienteHome from "./pages/Cliente";

function App({ Component, pageProps }) {
  return (
    <>
      <Helmet>
        <title>COMITE DEL AGUA</title>
        <meta name="description" content="Administración del sistema de agua." />
        <link rel="icon" href="./public/logoagua.ico" />
      </Helmet>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
             <Route path="/cambiar_pass" element={<ClienteForgotPassword />}/>

            {/* Página de acceso denegado */}
            <Route path="/NoAccess" element={<NoAccess />} />

            <Route path="/Admin" element={<ProtectedRoute rolesAllowed={["admin"]}> <Layout><AdminHome /></Layout></ProtectedRoute>} />
            <Route path="/Caja" element={<ProtectedRoute rolesAllowed={["caja"]}><Layout><CajaHome /></Layout></ProtectedRoute>} />
            <Route path="/Usuario" element={<ProtectedRoute rolesAllowed={["usuario"]}><Layout><UsuarioHome /></Layout></ProtectedRoute>} />
            <Route path="/Cliente" element={<ProtectedRoute rolesAllowed={["cliente"]}><Layout><ClienteHome /></Layout></ProtectedRoute>} />

            {/* Rutas adicionales */}
            <Route path="/Ver_usuarios" element={<ProtectedRoute rolesAllowed={["admin", "cliente", "usuario"]}><Layout><VerUsuarios /></Layout></ProtectedRoute>} />
            <Route path="/Editar_usuarios" element={<ProtectedRoute rolesAllowed={["admin"]}><Layout><EditarUsuarios /></Layout></ProtectedRoute>} />
            <Route path="/Registro_usuarios" element={<ProtectedRoute rolesAllowed={["admin", "usuario", "caja"]}><Layout><RegistroUsuarios /></Layout></ProtectedRoute>} />
            <Route path="/Ver_contratos" element={<ProtectedRoute rolesAllowed={["admin", "usuario"]}><Layout><VerContratos /></Layout></ProtectedRoute>} />
            <Route path="/Registro_contratos" element={<ProtectedRoute rolesAllowed={["admin", "usuario"]}><Layout><RegistroContratos /></Layout></ProtectedRoute>} />
            <Route path="/Registro_pagos" element={<ProtectedRoute rolesAllowed={["admin", "caja"]}><Layout><RegistroPagos /></Layout></ProtectedRoute>} />
            <Route path="/Ver_pagos" element={<ProtectedRoute rolesAllowed={["admin", "caja", "usuario"]}><Layout><VerPagos /></Layout></ProtectedRoute>} />
            <Route path="/Registro_AVoluntarias" element={<ProtectedRoute rolesAllowed={["admin", "caja"]}><Layout><RegistroAportacionVoluntaria /></Layout></ProtectedRoute>} />
            <Route path="/Ver_aportaciones" element={<ProtectedRoute rolesAllowed={["admin", "caja", "usuario"]}><Layout><VerAportacionesVoluntarias /></Layout></ProtectedRoute>} />

            <Route path="/Ver_salidas" element={<ProtectedRoute rolesAllowed={["admin"]}><Layout><VerSalidas /></Layout></ProtectedRoute>} />
            <Route path="/Registro_salidas" element={<ProtectedRoute rolesAllowed={["admin"]}><Layout><RegistroSalidas /></Layout></ProtectedRoute>} />
            <Route path="/Ver_useradmin" element={<ProtectedRoute rolesAllowed={["admin"]}><Layout><VerUsersAdmin /></Layout></ProtectedRoute>} />
            <Route path="/Registro_users" element={<ProtectedRoute rolesAllowed={["admin"]}><Layout><RegistroUsersAdmin /></Layout></ProtectedRoute>} />
            <Route path="/Ver_clientes" element={<ProtectedRoute rolesAllowed={["admin"]}><Layout><VerClientes /></Layout></ProtectedRoute>} />
            <Route path="/Ver_adeudos" element={<ProtectedRoute rolesAllowed={["admin", "caja"]}><Layout><VerAdeudos /></Layout></ProtectedRoute>} />
            <Route path="/Registro_Pcontratos" element={<ProtectedRoute rolesAllowed={["admin", "caja"]}><Layout><RegistroPagosContratos /></Layout></ProtectedRoute>} />

            <Route path="/cliente_datos" element={<ProtectedRoute rolesAllowed={["cliente"]}><Layout><ClientePerfil /></Layout></ProtectedRoute>} />
            <Route path="/contactanos" element={<ProtectedRoute rolesAllowed={["cliente"]}><Layout><ClienteContacto /></Layout></ProtectedRoute>} />

           

          </Routes>

        </Router>
      </AuthProvider>

    </>
  );
}

export default App;
