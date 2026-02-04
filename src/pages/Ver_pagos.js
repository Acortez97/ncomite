import * as React from "react";
import PropTypes from "prop-types";
import { alpha } from "@mui/material/styles";
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
import { visuallyHidden } from "@mui/utils";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';

/* ===================== ORDENAMIENTO ===================== */
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

/* ===================== COLUMNAS ===================== */
const headCells = [
  { id: "Contrato", label: "# Contrato" },
  { id: "Contratante", label: "Contratante" },
  { id: "anio_pago", label: "Año" },
  { id: "mes_pago", label: "Mes" },
  { id: "monto_pago", label: "Monto" },
  { id: "metodo_pago", label: "Método" },
  { id: "observaciones", label: "Observaciones" },
];

/* ===================== HEADER ===================== */
function EnhancedTableHead({ order, orderBy, onRequestSort }) {
  const createSortHandler = (property) => (event) =>
    onRequestSort(event, property);

  return (
    <TableHead>
      <TableRow sx={{ backgroundColor: "#0f4c75" }}>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
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

/* ===================== COMPONENTE ===================== */
export default function VerPagos() {
  const [order, setOrder] = React.useState("asc");
  const [orderBy, setOrderBy] = React.useState("Contrato");
  const [rows, setRows] = React.useState([]);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);
  const [dense, setDense] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  /* ===================== FETCH PAGOS ===================== */
  React.useEffect(() => {
    fetch(
      "https://comitedeaguasangaspartl.com/api/Selectgeneric/SelectWithJoin.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          select: `
            p.anio_pago,
            p.mes_pago,
            p.monto_pago,
            p.metodo_pago,
            p.observaciones,
            CONCAT_WS(" ", u.Nombre, u.Apellido_pat, u.Apellido_mat) AS Contratante,
            c.num_contrato AS Contrato
          `,
          table: `
            pagos p
            LEFT JOIN usuarios u ON p.id_usuario = u.id_usuario
            LEFT JOIN contratos c ON p.id_contrato = c.id_contrato
          `,
          where: "p.status = 1",
          orderBy: "p.fecha_registro DESC",
        }),
      }
    )
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setRows(data);
      })
      .catch((err) => console.error(err));
  }, []);

  /* ===================== FILTRO ===================== */
  const filteredRows = rows.filter((row) =>
    Object.values(row)
      .join(" ")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const visibleRows = React.useMemo(
    () =>
      filteredRows
        .sort(getComparator(order, orderBy))
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredRows, order, orderBy, page, rowsPerPage]
  );

  /* ===================== EXCEL ===================== */
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pagos");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    saveAs(new Blob([excelBuffer]), "pagos.xlsx");
  };

  return (
    <Box sx={{ width: "95%", margin: "auto" }}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Visualizar Pagos
        </Typography>

        {/* ===== TOOLBAR ===== */}
        <Toolbar sx={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Buscar Pago..."
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
              order={order}
              orderBy={orderBy}
              onRequestSort={(e, prop) =>
                setOrderBy(prop) ||
                setOrder(order === "asc" ? "desc" : "asc")
              }
            />
            <TableBody>
              {visibleRows.map((row, i) => (
                <TableRow key={i}>
                  <TableCell>{row.Contrato}</TableCell>
                  <TableCell>{row.Contratante}</TableCell>
                  <TableCell>{row.anio_pago}</TableCell>
                  <TableCell>{row.mes_pago}</TableCell>
                  <TableCell>${row.monto_pago}</TableCell>
                  <TableCell>{row.metodo_pago}</TableCell>
                  <TableCell>{row.observaciones}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[25, 50, 100]}
          component="div"
          count={filteredRows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, p) => setPage(p)}
          onRowsPerPageChange={(e) =>
            setRowsPerPage(parseInt(e.target.value, 10))
          }
        />

        <FormControlLabel
          control={<Switch checked={dense} onChange={(e) => setDense(e.target.checked)} />}
          label="Compactar"
        />
      </Paper>
    </Box>
  );
}
