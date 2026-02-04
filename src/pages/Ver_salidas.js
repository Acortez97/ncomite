import React from "react";
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

// 🔗 API PHP REAL
const API_SELECT_SALIDAS =
  "https://comitedeaguasangaspartl.com/api/Selectgeneric/Select_Gen.php";

// ----------------SORTING--------------------
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

// ----------------TABLE HEAD----------------
const headCells = [
  { id: "descripcion", numeric: false, disablePadding: true, label: "Descripción" },
  { id: "monto", numeric: false, disablePadding: false, label: "Monto" },
  { id: "fecha", numeric: false, disablePadding: false, label: "Fecha" },
  { id: "autoriza", numeric: false, disablePadding: false, label: "Autoriza" },
  { id: "observaciones", numeric: false, disablePadding: false, label: "Observaciones" },
];

function EnhancedTableHead(props) {
  const {
    onSelectAllClick,
    order,
    orderBy,
    numSelected,
    rowCount,
    onRequestSort,
  } = props;

  const createSortHandler = (property) => (event) =>
    onRequestSort(event, property);

  return (
    <TableHead>
      <TableRow sx={{ backgroundColor: "#0f4c75" }}>
        <TableCell padding="checkbox">
          <Checkbox
            color="primary"
            checked={rowCount > 0 && numSelected === rowCount}
            indeterminate={numSelected > 0 && numSelected < rowCount}
            onChange={onSelectAllClick}
            sx={{ color: "white" }}
          />
        </TableCell>
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
              sx={{ color: "white" }}
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

EnhancedTableHead.propTypes = {
  numSelected: PropTypes.number.isRequired,
  onRequestSort: PropTypes.func.isRequired,
  onSelectAllClick: PropTypes.func.isRequired,
  order: PropTypes.oneOf(["asc", "desc"]).isRequired,
  orderBy: PropTypes.string.isRequired,
  rowCount: PropTypes.number.isRequired,
};

// ----------------TOOLBAR------------------
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
      <Typography
        sx={{ flex: "1 1 100%" }}
        variant="h6"
        component="div"
        color={numSelected > 0 ? "inherit" : "primary"}
      >
        {numSelected > 0
          ? `${numSelected} seleccionado(s)`
          : "Salidas Registradas"}
      </Typography>
    </Toolbar>
  );
}

// ----------------COMPONENT------------------
export default function VerSalidas() {
  const [order, setOrder] = React.useState("asc");
  const [orderBy, setOrderBy] = React.useState("descripcion");
  const [selected, setSelected] = React.useState([]);
  const [page, setPage] = React.useState(0);
  const [dense, setDense] = React.useState(false);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);
  const [rows, setRows] = React.useState([]);
  const [searchQuery, setSearchQuery] = React.useState("");

  // --------LOAD DATA FROM PHP API----------
  React.useEffect(() => {
    fetch(API_SELECT_SALIDAS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        select: "*",
        table: "salidas",
        orderBy: "fecha DESC",
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setRows(data);
      })
      .catch((err) => console.error("Error al cargar salidas:", err));
  }, []);

  // --------FILTER SEARCH----------
  const filteredRows = rows.filter((row) => {
    const q = searchQuery.toLowerCase();
    return (
      row.descripcion?.toLowerCase().includes(q) ||
      row.monto?.toLowerCase().includes(q) ||
      row.autoriza?.toLowerCase().includes(q) ||
      row.observaciones?.toLowerCase().includes(q) ||
      row.fecha?.toLowerCase().includes(q)
    );
  });

  // --------VISIBLE ROWS----------
  const visibleRows = React.useMemo(
    () =>
      [...filteredRows]
        .sort(getComparator(order, orderBy))
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredRows, order, orderBy, page, rowsPerPage]
  );

  // --------EXPORT EXCEL----------
  const exportToExcel = () => {
    const exportData = filteredRows.map((row) => ({
      Descripción: row.descripcion,
      Monto: row.monto,
      Fecha: row.fecha,
      Autoriza: row.autoriza,
      Observaciones: row.observaciones,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Salidas");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "salidas.xlsx");
  };

  // --------SELECTION----------
  const isSelected = (id) => selected.indexOf(id) !== -1;

  const handleSelectAllClick = (e) => {
    if (e.target.checked) {
      const newSelected = rows.map((r) => r.idsalidas);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [...selected];

    if (selectedIndex === -1) newSelected.push(id);
    else newSelected.splice(selectedIndex, 1);

    setSelected(newSelected);
  };

  return (
    <Box sx={{ width: "95%", margin: "auto" }}>
      <Paper sx={{ width: "100%", mb: 2 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "20px",
          }}
        >
          <label style={{ fontSize: "2.5rem", fontWeight: "bold" }}>
            Visualizar Salidas
          </label>
        </div>

        <EnhancedTableToolbar numSelected={selected.length} />

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
          <Table sx={{ minWidth: 750 }} size={dense ? "small" : "medium"}>
            <EnhancedTableHead
              numSelected={selected.length}
              order={order}
              orderBy={orderBy}
              onSelectAllClick={handleSelectAllClick}
              onRequestSort={(e, property) => {
                const isAsc = orderBy === property && order === "asc";
                setOrder(isAsc ? "desc" : "asc");
                setOrderBy(property);
              }}
              rowCount={rows.length}
            />

            <TableBody>
              {visibleRows.map((row, index) => {
                const isItemSelected = isSelected(row.idsalidas);

                return (
                  <TableRow
                    hover
                    key={index}
                    onClick={(e) => handleClick(e, row.idsalidas)}
                    selected={isItemSelected}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox color="primary" checked={isItemSelected} />
                    </TableCell>

                    <TableCell>{row.descripcion}</TableCell>
                    <TableCell>{row.monto}</TableCell>
                    <TableCell>{row.fecha}</TableCell>
                    <TableCell>{row.autoriza}</TableCell>
                    <TableCell>{row.observaciones}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, p) => setPage(p)}
          onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
        />
      </Paper>

      <FormControlLabel
        control={<Switch checked={dense} onChange={(e) => setDense(e.target.checked)} />}
        label="Compactar"
      />
    </Box>
  );
}
