import React, { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import {
  Box, Paper, Typography, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, Chip,
  Toolbar, IconButton, Tooltip, FormControlLabel, Switch,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import BlockIcon from "@mui/icons-material/Block";
import { API } from "../Api/api.config";

const API_SELECT = API.SELECT;
const API_UPDATE = API.UPDATE;

const rolConfig = {
  "1": { label: "Admin",   color: "#fff3e0", textColor: "#e65100" },
  "2": { label: "Caja",    color: "#e3f2fd", textColor: "#1565c0" },
  "3": { label: "Usuario", color: "#e8f5e9", textColor: "#2e7d32" },
  "4": { label: "Cliente", color: "#f3e5f5", textColor: "#6a1b9a" },
};

export default function VerUsuariosAdmin() {
  const [usuarios, setUsuarios] = useState([]);
  const [search,   setSearch]   = useState("");
  const [page,     setPage]     = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dense,    setDense]    = useState(false);

  const cargarUsuarios = () => {
    fetch(API_SELECT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ select: "*", table: "user_admin" }),
    })
      .then((res) => res.json())
      .then((data) => { if (!data.error) setUsuarios(data); })
      .catch(() => Swal.fire("Error", "No se pudieron cargar los usuarios", "error"));
  };

  useEffect(() => { cargarUsuarios(); }, []);

  const desactivarUsuario = async (iduser) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "¿Desactivar este usuario?",
      text: "El usuario no podrá iniciar sesión.",
      showCancelButton: true,
      confirmButtonText: "Sí, desactivar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#c0392b",
    });
    if (!confirm.isConfirmed) return;

    const res = await fetch(API_UPDATE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "user_admin", updates: { status: 0 }, idField: "idusers", idValue: iduser }),
    });
    const result = await res.json();
    if (!res.ok || result.error) {
      Swal.fire("Error", result.error || "No se pudo desactivar", "error");
      return;
    }
    Swal.fire("Listo", "Usuario desactivado correctamente", "success");
    cargarUsuarios();
  };

  const filtrados = useMemo(() =>
    usuarios.filter((u) => {
      const q = search.toLowerCase();
      const rol = rolConfig[String(u.id_rol)]?.label ?? "";
      return (
        u.usuario?.toLowerCase().includes(q) ||
        u.nombre?.toLowerCase().includes(q) ||
        u.apellido?.toLowerCase().includes(q) ||
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
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: "gray" }} /> }}
            sx={{ width: { xs: "100%", sm: 320 } }}
          />
        </Toolbar>

        <TableContainer>
          <Table size={dense ? "small" : "medium"}>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#0f4c75" }}>
                {["Nombre", "Apellido", "Usuario", "Rol", "Fecha Creación", "Acción"].map((h) => (
                  <TableCell key={h} sx={{ color: "white", fontWeight: 700 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {visibles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ color: "#aaa", py: 4 }}>
                    Sin resultados
                  </TableCell>
                </TableRow>
              ) : visibles.map((u) => {
                const rol = rolConfig[String(u.id_rol)];
                const activo = String(u.status) === "1";
                return (
                  <TableRow key={u.idusers} hover
                    sx={{ "&:hover": { backgroundColor: "#f0f7ff" },
                          opacity: activo ? 1 : 0.5 }}>
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
                    <TableCell sx={{ color: "#666", fontSize: 13 }}>
                      {u.fecha_creacion
                        ? new Date(u.fecha_creacion).toLocaleDateString("es-MX")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Tooltip title={activo ? "Desactivar usuario" : "Ya desactivado"}>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => desactivarUsuario(u.idusers)}
                            disabled={!activo}
                            sx={{
                              color: activo ? "#c0392b" : "#ccc",
                              "&:hover": { backgroundColor: "#fdecea" },
                            }}
                          >
                            <BlockIcon fontSize="small" />
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
          onRowsPerPageChange={(e) => { setRowsPerPage(+e.target.value); setPage(0); }}
          labelRowsPerPage="Filas:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
        />
      </Paper>

      <FormControlLabel
        control={<Switch checked={dense} onChange={(e) => setDense(e.target.checked)} />}
        label="Compactar tabla"
      />
    </Box>
  );
}
