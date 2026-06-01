import React, { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import {
  Box, Paper, Typography, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, Chip,
  Toolbar, IconButton, Tooltip, FormControlLabel, Switch,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Select, MenuItem, InputLabel, FormControl, Divider,
} from "@mui/material";
import SearchIcon    from "@mui/icons-material/Search";
import BlockIcon     from "@mui/icons-material/Block";
import EditIcon      from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { API } from "../Api/api.config";
import { apiFetch } from "../Api/apiFetch";

const API_SELECT     = API.SELECT;
const API_UPDATE     = API.UPDATE_USER_ADMIN;

const rolConfig = {
  "1": { label: "Admin",   color: "#fff3e0", textColor: "#e65100" },
  "2": { label: "Caja",    color: "#e3f2fd", textColor: "#1565c0" },
  "3": { label: "Usuario", color: "#e8f5e9", textColor: "#2e7d32" },
};

// Módulos agrupados (igual que en Registro_users)
const GRUPOS_MODULOS = [
  {
    grupo: "Usuarios",
    modulos: [
      { label: "Ver usuarios",      path: "/Ver_usuarios" },
      { label: "Editar usuarios",   path: "/Editar_usuarios" },
      { label: "Registrar usuario", path: "/Registro_usuarios" },
    ],
  },
  {
    grupo: "Contratos",
    modulos: [
      { label: "Ver contratos",      path: "/Ver_contratos" },
      { label: "Registrar contrato", path: "/Registro_contratos" },
    ],
  },
  {
    grupo: "Pagos",
    modulos: [
      { label: "Registrar pago",        path: "/Registro_pagos" },
      { label: "Ver pagos",             path: "/Ver_pagos" },
      { label: "Aportación Voluntaria", path: "/Registro_AVoluntarias" },
      { label: "Ver Aportaciones",      path: "/Ver_aportaciones" },
      { label: "Registrar Salida",      path: "/Registro_Salidas" },
      { label: "Ver Salidas",           path: "/Ver_salidas" },
      { label: "Pago de Contrato",      path: "/Registro_Pcontratos" },
    ],
  },
  {
    grupo: "Clientes y Adeudos",
    modulos: [
      { label: "Ver clientes", path: "/Ver_clientes" },
      { label: "Ver adeudos",  path: "/Ver_adeudos" },
    ],
  },
  {
    grupo: "Reportes",
    modulos: [
      { label: "Flujo de Caja",      path: "/Reporte_FlujoCaja" },
      { label: "Reporte de Adeudos", path: "/Reporte_Adeudos" },
      { label: "Actividad Reciente", path: "/Reporte_Actividad" },
    ],
  },
  {
    grupo: "Mapa de Tomas",
    modulos: [
      { label: "Mapa de ubicaciones", path: "/Mapa" },
    ],
  },
];

const DEFAULT_PERMISOS = {
  "1": [
    "/Ver_usuarios", "/Editar_usuarios", "/Registro_usuarios",
    "/Ver_contratos", "/Registro_contratos",
    "/Registro_pagos", "/Ver_pagos", "/Registro_AVoluntarias", "/Ver_aportaciones",
    "/Registro_Salidas", "/Ver_salidas", "/Registro_Pcontratos",
    "/Ver_clientes", "/Ver_adeudos",
    "/Reporte_FlujoCaja", "/Reporte_Adeudos", "/Reporte_Actividad",
  ],
  "2": [
    "/Registro_pagos", "/Ver_pagos", "/Registro_AVoluntarias",
    "/Ver_aportaciones", "/Ver_adeudos", "/Registro_Pcontratos", "/Registro_usuarios",
  ],
  "3": [
    "/Ver_usuarios", "/Registro_usuarios",
    "/Ver_contratos", "/Registro_contratos",
    "/Ver_pagos", "/Ver_aportaciones", "/Ver_adeudos",
  ],
};

const FORM_INIT = {
  nombre: "", apellido: "", usuario: "", pass: "",
  id_rol: "", permisos: [], status: 1,
};

export default function VerUsuariosAdmin() {
  const [usuarios,    setUsuarios]    = useState([]);
  const [search,      setSearch]      = useState("");
  const [page,        setPage]        = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dense,       setDense]       = useState(false);

  // Modal de edición
  const [editOpen,    setEditOpen]    = useState(false);
  const [editando,    setEditando]    = useState(null); // usuario original
  const [form,        setForm]        = useState(FORM_INIT);
  const [saving,      setSaving]      = useState(false);
  const [intentoGuardar, setIntentoGuardar] = useState(false);

  const cargarUsuarios = () => {
    apiFetch(API_SELECT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ select: "*", table: "user_admin" }),
    })
      .then(res => res.json())
      .then(data => { if (!data.error) setUsuarios(data); })
      .catch(() => Swal.fire("Error", "No se pudieron cargar los usuarios", "error"));
  };

  useEffect(() => { cargarUsuarios(); }, []);

  // ── Abrir modal de edición ──
  const abrirEdicion = (u) => {
    setEditando(u);
    let permisosParsed;
    try {
      permisosParsed = u.permisos ? JSON.parse(u.permisos) : null;
    } catch { permisosParsed = null; }
    // Si no tiene permisos guardados, usar los del rol como punto de partida
    if (!Array.isArray(permisosParsed)) {
      permisosParsed = DEFAULT_PERMISOS[String(u.id_rol)] ?? [];
    }
    setForm({
      nombre:   u.nombre   ?? "",
      apellido: u.apellido ?? "",
      usuario:  u.usuario  ?? "",
      pass:     "",
      id_rol:   u.id_rol ? String(u.id_rol) : "",
      permisos: Array.isArray(permisosParsed) ? permisosParsed : [],
      status:   Number(u.status ?? 1),
    });
    setEditOpen(true);
  };

  const cerrarEdicion = () => { setEditOpen(false); setEditando(null); setIntentoGuardar(false); };

  // ── Permisos: toggle individual y por grupo ──
  const toggleModulo = (path) =>
    setForm(f => ({
      ...f,
      permisos: f.permisos.includes(path)
        ? f.permisos.filter(p => p !== path)
        : [...f.permisos, path],
    }));

  const toggleGrupo = (modulos) => {
    const paths = modulos.map(m => m.path);
    const todosActivos = paths.every(p => form.permisos.includes(p));
    setForm(f => ({
      ...f,
      permisos: todosActivos
        ? f.permisos.filter(p => !paths.includes(p))
        : [...new Set([...f.permisos, ...paths])],
    }));
  };

  // ── Guardar edición ──
  // Swal encima del Dialog de MUI (zIndex 1300)
  const swalAlto = (opts) => Swal.fire({
    ...opts,
    didOpen: () => {
      const c = document.querySelector(".swal2-container");
      if (c) c.style.zIndex = "99999";
    },
  });

  const guardarEdicion = async () => {
    setIntentoGuardar(true);

    const usuario = form.usuario?.trim() ?? "";
    const id_rol  = form.id_rol ? String(form.id_rol).trim() : "";

    if (!usuario || !id_rol) {
      swalAlto({ icon: "error", title: "Campos incompletos",
        text: `Completa: ${[!usuario && "Usuario", !id_rol && "Rol"].filter(Boolean).join(", ")}.` });
      return;
    }
    setSaving(true);

    // Solo enviar campos que realmente cambiaron
    const data = {};

    if ((form.nombre?.trim()   ?? "") !== (editando.nombre   ?? "")) data.nombre   = form.nombre?.trim() ?? "";
    if ((form.apellido?.trim() ?? "") !== (editando.apellido ?? "")) data.apellido = form.apellido?.trim() ?? "";
    if (usuario !== (editando.usuario ?? ""))                        data.usuario  = usuario;
    if (id_rol  !== String(editando.id_rol ?? ""))                   data.id_rol   = id_rol;
    if (form.status !== Number(editando.status ?? 1))                data.status   = form.status;
    if (form.pass?.trim())                                           data.pass     = form.pass;

    // Comparar permisos
    const permOriginal = (() => {
      try { return editando.permisos ? JSON.parse(editando.permisos) : []; }
      catch { return []; }
    })();
    if (JSON.stringify([...form.permisos].sort()) !== JSON.stringify([...permOriginal].sort())) {
      data.permisos = form.permisos;
    }

    if (Object.keys(data).length === 0) {
      setSaving(false);
      swalAlto({ icon: "info", title: "Sin cambios", text: "No se realizó ninguna modificación." });
      return;
    }

    try {
      const res = await apiFetch(API_UPDATE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idusers: editando.idusers, data }),
      });
      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error ?? "Error al guardar");
      cerrarEdicion();
      cargarUsuarios();
      Swal.fire("Guardado", "Usuario actualizado correctamente.", "success");
    } catch (err) {
      swalAlto({ icon: "error", title: "Error", text: err.message || "No se pudo guardar" });
    } finally {
      setSaving(false);
    }
  };

  // ── Activar / desactivar usuario ──
  const toggleStatus = async (u) => {
    const activo    = String(u.status) === "1";
    const accion    = activo ? "desactivar" : "reactivar";
    const nuevoSt   = activo ? 0 : 1;
    const confirm   = await Swal.fire({
      icon: activo ? "warning" : "question",
      title: `¿${activo ? "Desactivar" : "Reactivar"} este usuario?`,
      text: activo
        ? "El usuario no podrá iniciar sesión."
        : "El usuario podrá volver a iniciar sesión.",
      showCancelButton: true,
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: "Cancelar",
      confirmButtonColor: activo ? "#c0392b" : "#2e7d32",
    });
    if (!confirm.isConfirmed) return;

    const res = await apiFetch(API_UPDATE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idusers: u.idusers, data: { status: nuevoSt } }),
    });
    const result = await res.json();
    if (!res.ok || result.error) {
      Swal.fire("Error", result.error || `No se pudo ${accion}`, "error");
      return;
    }
    Swal.fire("Listo", `Usuario ${activo ? "desactivado" : "reactivado"} correctamente`, "success");
    cargarUsuarios();
  };

  const filtrados = useMemo(() =>
    usuarios.filter(u => {
      const q   = search.toLowerCase();
      const rol = rolConfig[String(u.id_rol)]?.label ?? "";
      return (
        u.usuario?.toLowerCase().includes(q) ||
        u.nombre?.toLowerCase().includes(q)  ||
        u.apellido?.toLowerCase().includes(q)||
        rol.toLowerCase().includes(q)
      );
    }), [usuarios, search]);

  const visibles = useMemo(() =>
    filtrados.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filtrados, page, rowsPerPage]);

  return (
    <Box sx={{ width: "95%", mx: "auto" }}>
      <Paper sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={700} color="#0f4c75"
          sx={{ px: 3, pt: 2.5, pb: 1 }}>
          Usuarios Administrativos
        </Typography>

        <Toolbar sx={{ justifyContent: "space-between", flexWrap: "wrap", gap: 2, px: 2 }}>
          <TextField
            size="small"
            placeholder="Buscar usuario, nombre, rol..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: "gray" }} /> }}
            sx={{ width: { xs: "100%", sm: 320 } }}
          />
        </Toolbar>

        <TableContainer>
          <Table size={dense ? "small" : "medium"}>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#0f4c75" }}>
                {["Nombre", "Apellido", "Usuario", "Rol", "Permisos", "Fecha Creación", "Acciones"].map(h => (
                  <TableCell key={h} sx={{ color: "white", fontWeight: 700 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {visibles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ color: "#aaa", py: 4 }}>
                    Sin resultados
                  </TableCell>
                </TableRow>
              ) : visibles.map(u => {
                const rol    = rolConfig[String(u.id_rol)];
                const activo = String(u.status) === "1";
                let permisosParsed = null;
                try { permisosParsed = u.permisos ? JSON.parse(u.permisos) : null; } catch { /* */ }
                const numPermisos = Array.isArray(permisosParsed) ? permisosParsed.length : null;

                return (
                  <TableRow key={u.idusers} hover
                    sx={{ "&:hover": { backgroundColor: "#f0f7ff" }, opacity: activo ? 1 : 0.5 }}>
                    <TableCell sx={{ fontWeight: 500 }}>{u.nombre || "—"}</TableCell>
                    <TableCell>{u.apellido || "—"}</TableCell>
                    <TableCell>
                      <code style={{ background: "#f4f4f4", padding: "2px 8px",
                        borderRadius: 4, fontSize: 13 }}>
                        {u.usuario}
                      </code>
                    </TableCell>
                    <TableCell>
                      {rol ? (
                        <Chip label={rol.label} size="small"
                          sx={{ fontWeight: 700, fontSize: 12,
                            backgroundColor: rol.color, color: rol.textColor }} />
                      ) : u.id_rol}
                    </TableCell>
                    <TableCell sx={{ fontSize: 13, color: "#555" }}>
                      {numPermisos === null
                        ? <Chip label="Acceso total" size="small" sx={{ background: "#e8f5e9", color: "#2e7d32", fontWeight: 600, fontSize: 11 }} />
                        : <Chip label={`${numPermisos} módulo${numPermisos !== 1 ? "s" : ""}`} size="small" sx={{ background: "#e3f2fd", color: "#1565c0", fontWeight: 600, fontSize: 11 }} />
                      }
                    </TableCell>
                    <TableCell sx={{ color: "#666", fontSize: 13 }}>
                      {u.fecha_creacion
                        ? new Date(u.fecha_creacion).toLocaleDateString("es-MX")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Editar usuario">
                        <IconButton size="small" onClick={() => abrirEdicion(u)}
                          sx={{ color: "#0f4c75", "&:hover": { backgroundColor: "#e3f2fd" }, mr: 0.5 }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={activo ? "Desactivar usuario" : "Reactivar usuario"}>
                        <span>
                          <IconButton size="small"
                            onClick={() => toggleStatus(u)}
                            sx={{
                              color: activo ? "#c0392b" : "#2e7d32",
                              "&:hover": { backgroundColor: activo ? "#fdecea" : "#e8f5e9" },
                            }}>
                            {activo ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filtrados.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={e => { setRowsPerPage(+e.target.value); setPage(0); }}
          labelRowsPerPage="Filas:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
        />
      </Paper>

      <FormControlLabel
        control={<Switch checked={dense} onChange={e => setDense(e.target.checked)} />}
        label="Compactar tabla"
      />

      {/* ══════════════════ MODAL DE EDICIÓN ══════════════════ */}
      <Dialog open={editOpen} onClose={cerrarEdicion} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: "#0f4c75", pb: 1 }}>
          Editar usuario — {editando?.usuario}
        </DialogTitle>
        <Divider />

        <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Datos básicos */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <TextField label="Nombre" size="small" value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
            <TextField label="Apellido" size="small" value={form.apellido}
              onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))} />
          </Box>

          <TextField label="Usuario *" size="small" value={form.usuario}
            onChange={e => setForm(f => ({ ...f, usuario: e.target.value }))}
            error={intentoGuardar && !form.usuario?.trim()}
            helperText={intentoGuardar && !form.usuario?.trim() ? "El usuario es obligatorio" : ""} />

          <TextField label="Nueva contraseña (dejar vacío para no cambiar)"
            type="password" size="small" value={form.pass}
            onChange={e => setForm(f => ({ ...f, pass: e.target.value }))}
            autoComplete="new-password" />

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, alignItems: "center" }}>
            <FormControl size="small" error={intentoGuardar && !form.id_rol}>
              <InputLabel>Rol *</InputLabel>
              <Select label="Rol *" value={form.id_rol}
                onChange={e => setForm(f => ({ ...f, id_rol: e.target.value }))}>
                <MenuItem value="1">Administrador</MenuItem>
                <MenuItem value="2">Caja</MenuItem>
                <MenuItem value="3">Usuario común</MenuItem>
              </Select>
              {intentoGuardar && !form.id_rol && (
                <span style={{ fontSize: 11, color: "#d32f2f", marginTop: 3, marginLeft: 14 }}>
                  El rol es obligatorio
                </span>
              )}
            </FormControl>

            <FormControlLabel
              control={
                <Switch checked={form.status === 1}
                  onChange={e => setForm(f => ({ ...f, status: e.target.checked ? 1 : 0 }))} />
              }
              label={form.status === 1 ? "Activo" : "Inactivo"}
            />
          </Box>

          <Divider />

          {/* Módulos / Permisos */}
          <Typography variant="subtitle2" fontWeight={700} color="#0f4c75">
            Módulos con acceso
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: -1.5 }}>
            Si no se selecciona ninguno, el usuario tendrá acceso total según su rol.
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {GRUPOS_MODULOS.map(({ grupo, modulos }) => {
              const paths       = modulos.map(m => m.path);
              const todosActivos = paths.every(p => form.permisos.includes(p));
              const algunoActivo = paths.some(p  => form.permisos.includes(p));
              return (
                <Box key={grupo} sx={{ border: "1px solid #d0dce8", borderRadius: 2, overflow: "hidden" }}>
                  {/* Cabecera del grupo */}
                  <Box sx={{ background: "#eaf3fb", px: 2, py: 1, borderBottom: "1px solid #d0dce8" }}>
                    <label style={{ fontWeight: 700, fontSize: 13, color: "#0f4c75",
                      display: "flex", alignItems: "center", cursor: "pointer" }}>
                      <input type="checkbox" checked={todosActivos}
                        ref={el => { if (el) el.indeterminate = algunoActivo && !todosActivos; }}
                        onChange={() => toggleGrupo(modulos)}
                        style={{ marginRight: 8, accentColor: "#0f4c75" }} />
                      {grupo}
                    </label>
                  </Box>
                  {/* Módulos individuales */}
                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                    gap: "6px 16px", p: "10px 14px" }}>
                    {modulos.map(({ label, path }) => (
                      <label key={path} style={{ fontSize: 13, color: "#2c3e50",
                        display: "flex", alignItems: "center", cursor: "pointer" }}>
                        <input type="checkbox" checked={form.permisos.includes(path)}
                          onChange={() => toggleModulo(path)}
                          style={{ marginRight: 7, accentColor: "#0f4c75" }} />
                        {label}
                      </label>
                    ))}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </DialogContent>

        <Divider />
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={cerrarEdicion} variant="outlined" color="inherit">
            Cancelar
          </Button>
          <Button onClick={guardarEdicion} variant="contained" disabled={saving}
            sx={{ background: "#0f4c75", "&:hover": { background: "#0d3f63" } }}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
