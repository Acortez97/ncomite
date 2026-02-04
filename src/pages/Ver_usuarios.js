import * as React from 'react';
import PropTypes from 'prop-types';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead,
  TablePagination, TableRow, TableSortLabel, Toolbar,
  Typography, Paper, Switch, FormControlLabel,
  TextField, Button
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const API_URL = "https://comitedeaguasangaspartl.com/api/Selectgeneric/Select_Gen.php";

/* ===================== TABLE HEAD ===================== */

const headCells = [
  { id: 'Nombre', label: 'Nombre' },
  { id: 'Apellido_pat', label: 'Apellido Paterno' },
  { id: 'Apellido_mat', label: 'Apellido Materno' },
  { id: 'num_celular', label: 'Celular' },
  { id: 'correo', label: 'Correo' },
  { id: 'domicilio', label: 'Domicilio' },
];

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

function EnhancedTableHead({ order, orderBy, onRequestSort }) {
  const createSortHandler = (property) => () =>
    onRequestSort(null, property);

  return (
    <TableHead>
      <TableRow sx={{ backgroundColor: '#0f4c75' }}>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            sortDirection={orderBy === headCell.id ? order : false}
            sx={{
              color: 'white',
              fontWeight: 'bold'
            }}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={createSortHandler(headCell.id)}
              sx={{
                color: 'white',
                '& .MuiTableSortLabel-label': {
                  color: 'white',
                  fontWeight: 'bold',
                },
                '& .MuiTableSortLabel-icon': {
                  color: 'white !important',
                },
                '&.Mui-active': {
                  color: 'white',
                },
              }}
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


/* ===================== MAIN ===================== */

export default function VerUsuarios() {
  const [rows, setRows] = React.useState([]);
  const [order, setOrder] = React.useState('asc');          // 👈 alfabético
  const [orderBy, setOrderBy] = React.useState('Nombre');  // 👈 por Nombre
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);
  const [dense, setDense] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ select: '*', table: 'usuarios' ,orderBy: 'Nombre ASC'})
    })
      .then(res => res.json())
      .then(data => {
        if (!data.error) setRows(data);
      });
  }, []);

  const filteredRows = rows.filter(row => {
    const q = searchQuery.toLowerCase();
    return Object.values(row).some(
      v => String(v).toLowerCase().includes(q)
    );
  });

  const visibleRows = React.useMemo(() =>
    [...filteredRows]
      .sort(getComparator(order, orderBy))
      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredRows, order, orderBy, page, rowsPerPage]
  );

  const handleRequestSort = (_, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Usuarios");
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buffer]), "usuarios.xlsx");
  };

  return (
    <Box sx={{ width: '95%', mx: 'auto' }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Visualizar Usuarios
        </Typography>

        {/* ===== TOOLBAR ===== */}
        <Toolbar sx={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Buscar usuario..."
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
              onRequestSort={handleRequestSort}
            />
            <TableBody>
              {visibleRows.map(row => (
                <TableRow key={row.id_usuario} hover>
                  <TableCell>{row.Nombre}</TableCell>
                  <TableCell>{row.Apellido_pat}</TableCell>
                  <TableCell>{row.Apellido_mat}</TableCell>
                  <TableCell>{row.num_celular}</TableCell>
                  <TableCell>{row.correo}</TableCell>
                  <TableCell>{row.domicilio}</TableCell>
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
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={e => setRowsPerPage(+e.target.value)}
        />
      </Paper>

      <FormControlLabel
        control={<Switch checked={dense} onChange={e => setDense(e.target.checked)} />}
        label="Compactar tabla"
      />
    </Box>
  );
}
