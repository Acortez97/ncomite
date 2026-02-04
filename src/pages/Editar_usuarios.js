import * as React from 'react';
import PropTypes from 'prop-types';
import { alpha } from '@mui/material/styles';
import {
    Box, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination,
    TableRow, TableSortLabel, Toolbar, Typography, Paper, Checkbox, IconButton, FormControlLabel, TextField, Switch
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { visuallyHidden } from '@mui/utils';

import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

/* API URLs */
const API_SELECT = "https://comitedeaguasangaspartl.com/api/Selectgeneric/Select_Gen.php";
const API_UPDATE = "https://comitedeaguasangaspartl.com/api/Updategeneric/update_generic.php";

/* Table Head Configuration */
const headCells = [
    { id: 'Nombre', label: 'Nombre' },
    { id: 'Apellido_pat', label: 'Apellido Paterno' },
    { id: 'Apellido_mat', label: 'Apellido Materno' },
    { id: 'num_celular', label: 'Celular' },
    { id: 'correo', label: 'Correo' },
    { id: 'domicilio', label: 'Domicilio' },
    { id: 'edit', label: 'Editar' },
    { id: 'delete', label: 'Eliminar' },
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

/* Table Head Component */
function EnhancedTableHead({ order, orderBy, onSelectAllClick, numSelected, rowCount, onRequestSort }) {
    const createSortHandler = (property) => (event) => onRequestSort(event, property);

    return (
        <TableHead>
            <TableRow sx={{ backgroundColor: '#0f4c75' }}>
                <TableCell padding="checkbox">
                    <Checkbox
                        color="primary"
                        checked={rowCount > 0 && numSelected === rowCount}
                        indeterminate={numSelected > 0 && numSelected < rowCount}
                        onChange={onSelectAllClick}
                        inputProps={{ 'aria-label': 'select all users' }}
                        sx={{ color: 'white' }}
                    />
                </TableCell>
                {headCells.map((headCell) => (
                    <TableCell
                        key={headCell.id}
                        sx={{ color: 'white' }}
                    >
                        {headCell.id === 'edit' || headCell.id === 'delete' ? (
                            headCell.label
                        ) : (
                            <TableSortLabel
                                active={orderBy === headCell.id}
                                direction={orderBy === headCell.id ? order : 'asc'}
                                onClick={createSortHandler(headCell.id)}
                                sx={{ color: 'white', '&.Mui-active': { color: 'white' } }}
                            >
                                {headCell.label}
                                {orderBy === headCell.id && (
                                    <Box component="span" sx={visuallyHidden}>
                                        {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                                    </Box>
                                )}
                            </TableSortLabel>
                        )}
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
    order: PropTypes.oneOf(['asc', 'desc']).isRequired,
    orderBy: PropTypes.string.isRequired,
    rowCount: PropTypes.number.isRequired,
};

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
                sx={{ flex: '1 1 100%' }}
                variant="h6"
                component="div"
                color={numSelected > 0 ? 'inherit' : 'primary'}
            >
                {numSelected > 0 ? `${numSelected} seleccionado(s)` : 'Usuarios'}
            </Typography>
        </Toolbar>
    );
}

EnhancedTableToolbar.propTypes = {
    numSelected: PropTypes.number.isRequired,
};

/* Form to Edit User */
function EditUserForm({ user, onSave, onCancel }) {
    const [form, setForm] = React.useState({ ...user });
    const [loading, setLoading] = React.useState(false);


    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const guardar = async () => {
        setLoading(true);
        try {
            const res = await fetch(API_UPDATE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    table: 'usuarios',
                    updates: {
                        Nombre: form.Nombre,
                        Apellido_pat: form.Apellido_pat,
                        Apellido_mat: form.Apellido_mat,
                        num_celular: form.num_celular,
                        correo: form.correo,
                        domicilio: form.domicilio,
                    },
                    idField: 'id_usuario',
                    idValue: user.id_usuario,
                }),
            });

            if (!res.ok) throw new Error('Error al actualizar');

            onSave(form);
        } catch (err) {
            Swal.fire('Error', err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={(e) => { e.preventDefault(); guardar(); }}>
            {['Nombre', 'Apellido_pat', 'Apellido_mat', 'num_celular', 'correo', 'domicilio'].map(c => (
                <input
                    key={c}
                    name={c}
                    value={form[c] || ''}
                    onChange={handleChange}
                    placeholder={c}
                    style={{ width: '100%', padding: 8, marginBottom: 10 }}
                />
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button type="button" onClick={onCancel}>Cancelar</button>
                <button type="submit" disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar'}
                </button>
            </div>
        </form>
    );
}

/* Main Component */
export default function Ver_usuarios() {
    const [rows, setRows] = React.useState([]);
    const [order, setOrder] = React.useState('asc');
    const [orderBy, setOrderBy] = React.useState('Nombre');
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(25);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [selected, setSelected] = React.useState([]);
    const [dense, setDense] = React.useState(false);

    React.useEffect(() => {
        fetch(API_SELECT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ select: '*', table: 'usuarios' }),
        })
            .then(res => res.json())
            .then(data => setRows(data))
            .catch(err => console.error('Error al obtener usuarios:', err));
    }, []);

    const filteredRows = rows.filter(row => {
        const q = searchQuery.toLowerCase();
        return (
            row.Nombre?.toLowerCase().includes(q) ||
            row.Apellido_pat?.toLowerCase().includes(q) ||
            row.Apellido_mat?.toLowerCase().includes(q) ||
            row.num_celular?.toLowerCase().includes(q) ||
            row.correo?.toLowerCase().includes(q) ||
            row.domicilio?.toLowerCase().includes(q)
        );
    });

    const visibleRows = React.useMemo(() =>
        [...filteredRows]
            .sort(getComparator(order, orderBy))
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
        [filteredRows, order, orderBy, page, rowsPerPage]
    );

    const handleEdit = (user) => {
        MySwal.fire({
            title: 'Editar Usuario',
            html: (
                <EditUserForm
                    user={user}
                    onSave={(updatedUser) => {
                        setRows(prev =>
                            prev.map(r =>
                                r.id_usuario === updatedUser.id_usuario ? updatedUser : r
                            )
                        );
                        MySwal.close();
                        Swal.fire('Guardado!', 'Usuario actualizado correctamente', 'success');
                    }}
                    onCancel={() => MySwal.close()}
                />
            ),
            showConfirmButton: false,
            showCloseButton: true,
            width: '450px',
        });
    };

    const handleDelete = (user) => {
        Swal.fire({
            title: '¿Estás seguro(a)?',
            text: `Eliminar usuario ${user.Nombre} ${user.Apellido_pat}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
        }).then(async (result) => {
            if (result.isConfirmed) {
                const res = await fetch(API_UPDATE, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        table: 'usuarios',
                        updates: { status: 0 },
                        idField: 'id_usuario',
                        idValue: user.id_usuario,
                    }),
                });

                if (!res.ok) {
                    Swal.fire('Error', 'No se pudo eliminar', 'error');
                    return;
                }

                setRows(prev => prev.filter(r => r.id_usuario !== user.id_usuario));
                Swal.fire('Eliminado!', 'Usuario eliminado correctamente', 'success');
            }
        });
    };

    return (
        <Box sx={{ width: '95%', margin: 'auto' }}>
            <Paper sx={{ mb: 2 }}>
                <Typography variant="h4" align="center" sx={{ my: 2 }}>
                    Administración de Usuarios
                </Typography>

                {/* Search */}


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
                </Toolbar>

                <TableContainer>
                    <Table size={dense ? 'small' : 'medium'}>
                        <EnhancedTableHead
                            order={order}
                            orderBy={orderBy}
                            onSelectAllClick={() => { }}
                            onRequestSort={(e, prop) => {
                                setOrder(orderBy === prop && order === 'asc' ? 'desc' : 'asc');
                                setOrderBy(prop);
                            }}
                            numSelected={selected.length}
                            rowCount={rows.length}
                        />
                        <TableBody>
                            {visibleRows.map((row) => (
                                <TableRow key={row.id_usuario}>
                                    <TableCell />
                                    <TableCell>{row.Nombre}</TableCell>
                                    <TableCell>{row.Apellido_pat}</TableCell>
                                    <TableCell>{row.Apellido_mat}</TableCell>
                                    <TableCell>{row.num_celular}</TableCell>
                                    <TableCell>{row.correo}</TableCell>
                                    <TableCell>{row.domicilio}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleEdit(row)}>
                                            <EditIcon color="primary" />
                                        </IconButton>
                                    </TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleDelete(row)}>
                                            <DeleteIcon color="error" />
                                        </IconButton>
                                    </TableCell>
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
