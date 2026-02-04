import React, { useEffect, useState, useMemo } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Toolbar,
  Typography,
  Paper,
  Checkbox,
  FormControlLabel,
  Switch,
  Button,
  TextField,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { visuallyHidden } from "@mui/utils";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';

// -------------------- APIs PHP --------------------
const API_SELECT_JOIN =
  "https://comitedeaguasangaspartl.com/api/Selectgeneric/SelectWithJoin.php";

// -------------------- Ordenamiento --------------------
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

// -------------------- Encabezados --------------------
const headCells = [
  { id: "Contrato", numeric: false, disablePadding: true, label: "# Contrato" },
  { id: "Contratante", numeric: false, disablePadding: false, label: "Contratante" },
  { id: "monto_pago", numeric: false, disablePadding: false, label: "Monto Aportación" },
  { id: "metodo_pago", numeric: false, disablePadding: false, label: "Método de Pago" },
  { id: "observaciones", numeric: false, disablePadding: false, label: "Observaciones" },
  { id: "fecha_aportacion", numeric: false, disablePadding: false, label: "Fecha de Aportación" },
];

// -------------------- Table Head --------------------
function EnhancedTableHead(props) {
  const { order, orderBy, onRequestSort } = props;
  const createSortHandler = (property) => (event) =>
    onRequestSort(event, property);

  return (
    <TableHead>
      <TableRow sx={{ backgroundColor: "#0f4c75" }}>
        <TableCell padding="checkbox"></TableCell>

        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align="left"
            padding={headCell.disablePadding ? "none" : "normal"}
            sortDirection={orderBy === headCell.id ? order : false}
            sx={{ color: "white" }}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : "asc"}
              onClick={createSortHandler(headCell.id)}
              sx={{ color: "white", "&.Mui-active": { color: "white" } }}
            >
              {headCell.label}
              {orderBy === headCell.id && (
                <Box component="span" sx={visuallyHidden}>
                  {order === "desc" ? "sorted descending" : "sorted ascending"}
                </Box>
              )}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

// -------------------- Toolbar --------------------
function EnhancedTableToolbar({ numSelected }) {
  return (
    <Toolbar
      sx={{
        pl: { sm: 2 },
        pr: { xs: 1, sm: 1 },
        ...(numSelected > 0 && {
          bgcolor: (theme) =>
            alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity),
        }),
      }}
    >
      <Typography sx={{ flex: "1 1 100%" }} variant="h6" component="div">
        {numSelected > 0
          ? `${numSelected} seleccionado(s)`
          : "Aportaciones Voluntarias"}
      </Typography>
    </Toolbar>
  );
}

EnhancedTableToolbar.propTypes = {
  numSelected: PropTypes.number.isRequired,
};

// -------------------- MAIN COMPONENT --------------------
export default function VerAportaciones() {
  const [rows, setRows] = useState([]);
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("Contrato");
  const [selected, setSelected] = useState([]);

  const [page, setPage] = useState(0);
  const [dense, setDense] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [searchQuery, setSearchQuery] = useState("");

  // ----- Cargar datos de aportaciones -----
  useEffect(() => {
    fetch(API_SELECT_JOIN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        select: `av.fecha_aportacion, av.monto AS monto_pago, av.metodo AS metodo_pago, av.observaciones,
                 CONCAT_WS(" ", u.Nombre, u.Apellido_pat, u.Apellido_mat) AS Contratante,
                 c.num_contrato AS Contrato`,
        table: `aportacion_voluntaria av
                LEFT JOIN usuarios u ON av.id_usuario = u.id_usuario
                LEFT JOIN contratos c ON av.id_contrato = c.id_contrato`,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setRows(data);
      })
      .catch(() => console.error("Error consultando aportaciones"));
  }, []);

  // ----- Filtrado -----
  const filteredRows = rows.filter((row) => {
    const q = searchQuery.toLowerCase();
    return (
      row.Contratante?.toLowerCase().includes(q) ||
      row.Contrato?.toLowerCase().includes(q) ||
      row.monto_pago?.toString().includes(q) ||
      row.metodo_pago?.toLowerCase().includes(q) ||
      row.observaciones?.toLowerCase().includes(q) ||
      row.fecha_aportacion?.toLowerCase().includes(q)
    );
  });

  // ----- Ordenamiento + paginación -----
  const visibleRows = useMemo(
    () =>
      [...filteredRows]
        .sort(getComparator(order, orderBy))
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredRows, order, orderBy, page, rowsPerPage]
  );

  // ----- Exportar Excel -----
  const exportToExcel = () => {
    const exportData = filteredRows.map((row) => ({
      Contrato: row.Contrato,
      Contratante: row.Contratante,
      "Monto Pagado": row.monto_pago,
      "Método de Pago": row.metodo_pago,
      Observaciones: row.observaciones,
      "Fecha de Aportación": row.fecha_aportacion,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Aportaciones");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "aportaciones_voluntarias.xlsx");
  };

  // ----- Handlers -----
  const handleRequestSort = (e, property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleChangePage = (e, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  // ----- UI -----
  return (
    <Box sx={{ width: "95%", margin: "auto" }}>
      <Paper sx={{ width: "100%", mb: 2 }}>
        <div style={{ textAlign: "center", padding: "20px" }}>
          <h1>Visualizar Aportaciones Voluntarias</h1>
        </div>

        <EnhancedTableToolbar numSelected={selected.length} />

        {/* ===== TOOLBAR ===== */}
        <Toolbar sx={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Buscar Aportación Voluntaria..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'gray' }} />,
            }}
            sx={{ width: { xs: '100%', sm: 300 } }}
          />

          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={exportToExcel}
            sx={{
              backgroundColor: '#0f4c75',
              '&:hover': { backgroundColor: '#3282b8' }
            }}
          >
            Descargar Excel
          </Button>
        </Toolbar>

        <TableContainer>
          <Table size={dense ? "small" : "medium"}>
            <EnhancedTableHead
              numSelected={selected.length}
              order={order}
              orderBy={orderBy}
              onRequestSort={handleRequestSort}
              rowCount={rows.length}
            />

            <TableBody>
              {visibleRows.map((row, i) => (
                <TableRow key={i} hover>
                  <TableCell></TableCell>

                  <TableCell>{row.Contrato}</TableCell>
                  <TableCell>{row.Contratante}</TableCell>
                  <TableCell>{row.monto_pago}</TableCell>
                  <TableCell>{row.metodo_pago}</TableCell>
                  <TableCell>{row.observaciones}</TableCell>
                  <TableCell>{row.fecha_aportacion}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={rows.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      </Paper>

      <FormControlLabel
        control={<Switch checked={dense} onChange={(e) => setDense(e.target.checked)} />}
        label="Compactar"
      />
    </Box>
  );
}
