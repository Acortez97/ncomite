import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { alpha } from '@mui/material/styles';
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
  Switch, Button,
  TextField,
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';

/* ================== CONFIG ================== */
const API_SELECT =
  'https://comitedeaguasangaspartl.com/api/Selectgeneric/SelectWithJoin.php';

/* ================== SORT HELPERS ================== */
function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

/* ================== HEAD CELLS ================== */
const headCells = [
  { id: 'Contratante', label: 'Nombre' },
  { id: 'num_contrato', label: 'Contrato' },
  { id: 'Fecha_contrato', label: 'Fecha de contrato' },
  { id: 'respon_comite', label: 'Responsable Comité' },
];

/* ================== TABLE HEAD ================== */
function EnhancedTableHead({ order, orderBy, onRequestSort }) {
  const createSortHandler = (property) => (event) =>
    onRequestSort(event, property);

  return (
    <TableHead>
      <TableRow sx={{ backgroundColor: '#0f4c75' }}>
        <TableCell />
        {headCells.map((headCell) => (
          <TableCell key={headCell.id} sx={{ color: 'white' }}>
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={createSortHandler(headCell.id)}
              sx={{ color: 'white', '&.Mui-active': { color: 'white' } }}
            >
              {headCell.label}
              {orderBy === headCell.id && (
                <Box component="span" sx={visuallyHidden}>
                  {order === 'desc'
                    ? 'sorted descending'
                    : 'sorted ascending'}
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
  order: PropTypes.string.isRequired,
  orderBy: PropTypes.string.isRequired,
  onRequestSort: PropTypes.func.isRequired,
};

/* ================== TOOLBAR ================== */
function EnhancedTableToolbar() {
  return (
    <Toolbar>
      <Typography variant="h6" color="primary">
        Contratos
      </Typography>
    </Toolbar>
  );
}

/* ================== MAIN COMPONENT ================== */
export default function VerContratos() {
  const [rows, setRows] = useState([]);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('Contratante');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [dense, setDense] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  /* ================== FETCH DATA ================== */
  useEffect(() => {
    fetch(API_SELECT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        select: 'c.num_contrato,DATE_FORMAT(c.Fecha_contrato, "%Y-%m-%d %H:%i:%s") AS Fecha_contrato, c.respon_comite, CONCAT_WS(" ", u.Nombre, u.Apellido_pat, u.Apellido_mat) AS Contratante',
        table: 'contratos c LEFT JOIN usuarios u ON c.id_usuario = u.id_usuario',
        where: 'c.status = 1',
        orderBy: 'c.Fecha_contrato ASC'
      }),
    })
      .then((res) => res.json())
      .then((data) => !data.error && setRows(data))
      .catch((err) => console.error(err));
  }, []);

  /* ================== FILTER ================== */
  const filteredRows = rows.filter((row) => {
    const q = searchQuery.toLowerCase();
    return (
      row.Contratante?.toLowerCase().includes(q) ||
      row.num_contrato?.toLowerCase().includes(q) ||
      row.Fecha_contrato?.toLowerCase().includes(q) ||
      row.respon_comite?.toLowerCase().includes(q)
    );
  });

  /* ================== SORT + PAGINATION ================== */
  const visibleRows = useMemo(
    () =>
      [...filteredRows]
        .sort(getComparator(order, orderBy))
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredRows, order, orderBy, page, rowsPerPage]
  );

  /* ================== EXPORT ================== */
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Contratos');

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buffer]), 'contratos.xlsx');
  };

  /* ================== RENDER ================== */
  return (
    <Box sx={{ width: '95%', margin: 'auto' }}>
      <Paper sx={{ mb: 2 }}>
        <Typography variant="h4" align="center" sx={{ my: 2 }}>
          Visualizar Contratos
        </Typography>

        <EnhancedTableToolbar />

        <Toolbar sx={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Buscar Contrato..."
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
          <Table size={dense ? 'small' : 'medium'}>
            <EnhancedTableHead
              order={order}
              orderBy={orderBy}
              onRequestSort={(e, prop) => {
                const isAsc = orderBy === prop && order === 'asc';
                setOrder(isAsc ? 'desc' : 'asc');
                setOrderBy(prop);
              }}
            />
            <TableBody>
              {visibleRows.map((row, i) => (
                <TableRow key={i}>
                  <TableCell />
                  <TableCell>{row.Contratante}</TableCell>
                  <TableCell>{row.num_contrato}</TableCell>
                  <TableCell>
                    {row.Fecha_contrato &&
                      new Date(
                        row.Fecha_contrato.replace(' ', 'T')
                      ).toLocaleString('es-MX')}
                  </TableCell>
                  <TableCell>{row.respon_comite}</TableCell>
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
      </Paper>

      <FormControlLabel
        control={
          <Switch checked={dense} onChange={(e) => setDense(e.target.checked)} />
        }
        label="Compactar"
      />
    </Box>
  );
}
