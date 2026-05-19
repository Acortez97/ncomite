import React, { useEffect, useState, useMemo } from "react";
import {
  Box, Paper, Typography, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TableSortLabel, TablePagination,
  Chip, Toolbar, FormControlLabel, Switch,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { visuallyHidden } from "@mui/utils";
import { API } from "../Api/api.config";
import { apiFetch } from "../Api/apiFetch";

const API_SELECT = API.SELECT;

const headCells = [
  { id: "usuario",      label: "Usuario" },
  { id: "num_contrato", label: "# Contrato" },
  { id: "anio",         label: "Año" },
  { id: "estado",       label: "Estado" },
];

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}

function getComparator(order, orderBy) {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function TableHead_({ order, orderBy, onRequestSort }) {
  const sort = (prop) => () => onRequestSort(prop);
  return (
    <TableHead>
      <TableRow sx={{ backgroundColor: "#0f4c75" }}>
        {headCells.map((h) => (
          <TableCell key={h.id} sortDirection={orderBy === h.id ? order : false}
            sx={{ color: "white", fontWeight: 700 }}>
            <TableSortLabel
              active={orderBy === h.id}
              direction={orderBy === h.id ? order : "asc"}
              onClick={sort(h.id)}
              sx={{ color: "white !important", "& .MuiTableSortLabel-icon": { color: "white !important" } }}
            >
              {h.label}
              {orderBy === h.id && (
                <Box component="span" sx={visuallyHidden}>
                  {order === "desc" ? "desc" : "asc"}
                </Box>
              )}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

export default function VerAdeudos() {
  const [adeudos,   setAdeudos]   = useState([]);
  const [usuarios,  setUsuarios]  = useState([]);
  const [contratos, setContratos] = useState([]);
  const [lista,     setLista]     = useState([]);
  const [busqueda,  setBusqueda]  = useState("");
  const [order,     setOrder]     = useState("asc");
  const [orderBy,   setOrderBy]   = useState("usuario");
  const [page,      setPage]      = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [dense,     setDense]     = useState(false);

  const load = async (select, table) => {
    const res = await apiFetch(API_SELECT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ select, table }),
    });
    const data = await res.json();
    return data.error ? [] : data;
  };

  useEffect(() => {
    Promise.all([
      load("*", "adeudos"),
      load("id_usuario, Nombre, Apellido_pat, Apellido_mat", "usuarios"),
      load("id_contrato, id_usuario, num_contrato", "contratos"),
    ]).then(([a, u, c]) => {
      setAdeudos(a);
      setUsuarios(u.filter(x => x.Nombre !== "TEST_PRUEBA"));
      setContratos(c);
    });
  }, []);

  useEffect(() => {
    if (!adeudos.length || !usuarios.length || !contratos.length) return;
    setLista(
      adeudos.map((a) => {
        const u = usuarios.find((x) => String(x.id_usuario) === String(a.id_usuario));
        const c = contratos.find((x) => String(x.id_contrato) === String(a.id_contrato));
        return {
          ...a,
          usuario: u ? `${u.Nombre} ${u.Apellido_pat} ${u.Apellido_mat}`.trim() : "Sin usuario",
          num_contrato: c ? c.num_contrato : "Sin contrato",
        };
      })
    );
  }, [adeudos, usuarios, contratos]);

  const filtrados = useMemo(() =>
    lista.filter((r) =>
      `${r.usuario} ${r.num_contrato} ${r.anio} ${r.estado}`
        .toLowerCase()
        .includes(busqueda.toLowerCase())
    ), [lista, busqueda]);

  const visibles = useMemo(() =>
    [...filtrados]
      .sort(getComparator(order, orderBy))
      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filtrados, order, orderBy, page, rowsPerPage]
  );

  const handleSort = (prop) => {
    const isAsc = orderBy === prop && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(prop);
  };

  const pendientes = lista.filter((r) => r.estado === "pendiente").length;
  const pagados    = lista.filter((r) => r.estado === "pagado").length;

  return (
    <Box sx={{ width: "95%", mx: "auto" }}>
      {/* ── Resumen ── */}
      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <Paper sx={{ flex: 1, minWidth: 140, p: 2, textAlign: "center", borderTop: "4px solid #e74c3c" }}>
          <Typography variant="h4" fontWeight={700} color="#e74c3c">{pendientes}</Typography>
          <Typography variant="body2" color="text.secondary">Pendientes</Typography>
        </Paper>
        <Paper sx={{ flex: 1, minWidth: 140, p: 2, textAlign: "center", borderTop: "4px solid #2ecc71" }}>
          <Typography variant="h4" fontWeight={700} color="#2ecc71">{pagados}</Typography>
          <Typography variant="body2" color="text.secondary">Pagados</Typography>
        </Paper>
        <Paper sx={{ flex: 1, minWidth: 140, p: 2, textAlign: "center", borderTop: "4px solid #3498db" }}>
          <Typography variant="h4" fontWeight={700} color="#3498db">{lista.length}</Typography>
          <Typography variant="body2" color="text.secondary">Total</Typography>
        </Paper>
      </Box>

      <Paper sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={700} color="#0f4c75"
          sx={{ px: 3, pt: 2.5, pb: 1 }}>
          Adeudos
        </Typography>

        <Toolbar sx={{ justifyContent: "space-between", flexWrap: "wrap", gap: 2, px: 2 }}>
          <TextField
            size="small"
            placeholder="Buscar usuario, contrato, año..."
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPage(0); }}
            InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: "gray" }} /> }}
            sx={{ width: { xs: "100%", sm: 320 } }}
          />
        </Toolbar>

        <TableContainer>
          <Table size={dense ? "small" : "medium"}>
            <TableHead_ order={order} orderBy={orderBy} onRequestSort={handleSort} />
            <TableBody>
              {visibles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ color: "#aaa", py: 4 }}>
                    Sin resultados
                  </TableCell>
                </TableRow>
              ) : visibles.map((r) => (
                <TableRow key={r.id_adeudo} hover
                  sx={{ "&:hover": { backgroundColor: "#f0f7ff" } }}>
                  <TableCell sx={{ fontWeight: 500 }}>{r.usuario}</TableCell>
                  <TableCell>{r.num_contrato}</TableCell>
                  <TableCell>{r.anio}</TableCell>
                  <TableCell>
                    <Chip
                      label={r.estado === "pendiente" ? "Pendiente" : "Pagado"}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: 12,
                        backgroundColor: r.estado === "pendiente" ? "#fdecea" : "#e8f5e9",
                        color:           r.estado === "pendiente" ? "#c0392b" : "#27ae60",
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[10, 20, 50]}
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
