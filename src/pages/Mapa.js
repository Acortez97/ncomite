import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  MapContainer, TileLayer, Marker, Popup, Polygon, useMapEvents, useMap
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { apiFetch } from '../Api/apiFetch';
import { API } from '../Api/api.config';
import NavMenu from '../components/NavMenu';

// ── Íconos leaflet con CRA ─────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl:       require('leaflet/dist/images/marker-icon.png'),
  shadowUrl:     require('leaflet/dist/images/marker-shadow.png'),
});

const iconoCliente = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">' +
    '<path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#2563eb"/>' +
    '<circle cx="12" cy="12" r="5" fill="white"/></svg>'
  ),
  iconSize: [24, 36], iconAnchor: [12, 36], popupAnchor: [0, -36],
});

// Válvula de paso de agua — llave de compuerta (gate valve)
const _svgValvula = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 44" width="30" height="44">
  <path d="M15 0C7 0 0 7 0 15c0 11 15 29 15 29s15-18 15-29C30 7 23 0 15 0z" fill="#dc2626"/>
  <rect x="13.5" y="4" width="3" height="5" rx="1" fill="white"/>
  <rect x="9" y="4" width="12" height="2.5" rx="1.25" fill="white"/>
  <circle cx="15" cy="15" r="6.5" fill="none" stroke="white" stroke-width="1.8"/>
  <polygon points="8.5,15 12,10.5 12,19.5" fill="white"/>
  <polygon points="21.5,15 18,10.5 18,19.5" fill="white"/>
  <rect x="14.1" y="10.5" width="1.8" height="9" fill="white"/>
</svg>`;
const iconoValvula = new L.Icon({
  iconUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(_svgValvula),
  iconSize: [30, 44], iconAnchor: [15, 44], popupAnchor: [0, -44],
});

const iconoPrevio = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">' +
    '<path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#7c3aed" opacity="0.85"/>' +
    '<circle cx="12" cy="12" r="5" fill="white"/></svg>'
  ),
  iconSize: [24, 36], iconAnchor: [12, 36], popupAnchor: [0, -36],
});

const SECTOR_COLORES = {
  1: { color: '#2563eb', fillColor: '#3b82f6', label: 'Sector 1' },
  2: { color: '#16a34a', fillColor: '#22c55e', label: 'Sector 2' },
  3: { color: '#d97706', fillColor: '#f59e0b', label: 'Sector 3' },
};

const STORAGE_SECTORES = 'ncomite_sectores';
const STORAGE_POSICION  = 'ncomite_mapa_pos';
const CENTRO_DEFAULT = [20.006, -99.567];
const ZOOM_DEFAULT   = 17;
const MAX_ZOOM = 23;

const CAPAS = {
  mapa: {
    label: 'Mapa',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxNativeZoom: 19,
    maxZoom: 23,
  },
  satelite: {
    label: 'Satelite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com">Esri</a>',
    maxNativeZoom: 20,
    maxZoom: 23,
  },
};

function cargarSectores() {
  try { const r = localStorage.getItem(STORAGE_SECTORES); if (r) return JSON.parse(r); } catch {}
  return { 1: [], 2: [], 3: [] };
}

// Ray casting: devuelve true si el punto [lat,lng] está dentro del polígono
function puntoEnPoligono(punto, poligono) {
  if (!poligono || poligono.length < 3) return false;
  const [py, px] = punto;
  let dentro = false;
  for (let i = 0, j = poligono.length - 1; i < poligono.length; j = i++) {
    const [iy, ix] = poligono[i];
    const [jy, jx] = poligono[j];
    if (((iy > py) !== (jy > py)) && (px < (jx - ix) * (py - iy) / (jy - iy) + ix)) {
      dentro = !dentro;
    }
  }
  return dentro;
}

// Detecta en qué sector cae un punto. Devuelve 1/2/3 o null si no cae en ninguno
function detectarSector(coords, sectoresCoords) {
  for (const id of [1, 2, 3]) {
    const poly = sectoresCoords[id] || [];
    if (poly.length >= 3 && puntoEnPoligono(coords, poly)) return id;
  }
  return null;
}

// Devuelve true si hay al menos un sector con 3+ puntos definidos
function haySectoresDefinidos(sectoresCoords) {
  return [1, 2, 3].some(id => (sectoresCoords[id] || []).length >= 3);
}

function cargarPosicion() {
  try {
    // Primero usa el inicio fijado manualmente, luego la última posición, luego el default
    const inicio = localStorage.getItem('ncomite_mapa_inicio');
    if (inicio) return JSON.parse(inicio);
    const ultima = localStorage.getItem(STORAGE_POSICION);
    if (ultima) return JSON.parse(ultima);
  } catch {}
  return { center: CENTRO_DEFAULT, zoom: ZOOM_DEFAULT };
}

// ── Guarda posición del mapa al moverse y expone centro actual ─
function GuardaPosicion({ onPosicion }) {
  useMapEvents({
    moveend(e) {
      const c = e.target.getCenter();
      const z = e.target.getZoom();
      const pos = { center: [c.lat, c.lng], zoom: z };
      localStorage.setItem(STORAGE_POSICION, JSON.stringify(pos));
      onPosicion(pos);
    },
  });
  return null;
}

// ── Clics solo para sectores ───────────────────────────────────
function ManejadorClics({ sectoresEditando, onSector }) {
  const ref = useRef({});
  ref.current = { sectoresEditando, onSector };
  useMapEvents({
    click(e) {
      const { sectoresEditando, onSector } = ref.current;
      if (sectoresEditando) onSector([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

// ── Marcador arrastrable para modo manual ──────────────────────

// Sigue el centro del mapa y actualiza las coordenadas
function SeguirCentro({ onCoordsChange }) {
  const map = useMap();
  useEffect(() => {
    const update = () => {
      const c = map.getCenter();
      onCoordsChange([c.lat, c.lng]);
    };
    update(); // coordenadas iniciales
    map.on('move', update);
    return () => map.off('move', update);
  }, [map, onCoordsChange]);
  return null;
}

// ── Vuela a unas coordenadas ───────────────────────────────────
function VolarA({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo(coords, 18, { animate: true, duration: 1 });
  }, [coords, map]);
  return null;
}

// ── Corrige coordenadas de clic tras cambios de layout ─────────
function InvalidateSize() {
  const map = useMap();
  useEffect(() => {
    try { map.whenReady(() => map.invalidateSize()); } catch {}
  }, [map]);
  return null;
}

// ── Ajusta el mapa para mostrar todos los marcadores ──────────
function FitBounds({ ubicaciones, trigger }) {
  const map = useMap();
  useEffect(() => {
    if (!trigger || ubicaciones.length === 0) return;
    const bounds = ubicaciones.map(u => [parseFloat(u.latitud), parseFloat(u.longitud)]);
    map.fitBounds(bounds, { padding: [40, 40], animate: true });
  }, [trigger]);
  return null;
}

// ══════════════════════════════════════════════════════════════
export default function Mapa() {
  const posInicial = cargarPosicion();

  const [ubicaciones, setUbicaciones]   = useState([]);
  const [filtroSector, setFiltroSector] = useState('');
  const [filtroTipo, setFiltroTipo]     = useState('');
  const [cargando, setCargando]         = useState(true);
  const [error, setError]               = useState('');

  // Formulario
  const [mostrarForm, setMostrarForm]   = useState(false);
  const [modoUbicacion, setModoUbicacion] = useState('gps'); // 'gps' | 'manual'
  const [numContrato, setNumContrato]   = useState('');
  const [contratoData, setContratoData] = useState(null);
  const [errorContrato, setErrorContrato] = useState('');
  const [buscando, setBuscando]         = useState(false);
  const [coords, setCoords]             = useState(null);   // lat,lng seleccionadas
  const [sector, setSector]             = useState(1);
  const [tipo, setTipo]                 = useState('cliente');
  const [notas, setNotas]               = useState('');
  const [guardando, setGuardando]       = useState(false);
  const [mensajeForm, setMensajeForm]   = useState('');
  const [obteniendo, setObteniendo]     = useState(false);
  const [volarA, setVolarA]             = useState(null);
  const modoRef   = useRef('gps');
  const [pasoManual, setPasoManual]     = useState(1); // 1=posicionar, 2=detalles

  // Posición actual del mapa (actualizada en tiempo real)
  const [posActual, setPosActual]     = useState(posInicial);
  const [fitTrigger, setFitTrigger]   = useState(0);
  const [capa, setCapa] = useState('mapa');
  const [inicioGuardado, setInicioGuardado] = useState(false);

  const fijarInicio = () => {
    const KEY_INICIO = 'ncomite_mapa_inicio';
    localStorage.setItem(KEY_INICIO, JSON.stringify(posActual));
    setInicioGuardado(true);
    setTimeout(() => setInicioGuardado(false), 2000);
  };

  // Sectores
  const [sectoresEditando, setSectoresEditando] = useState(false);
  const [sectorActivo, setSectorActivo]         = useState(1);
  const [sectoresCoords, setSectoresCoords]     = useState(cargarSectores);

  const buscarTimeout = useRef(null);

  // ── Cargar ubicaciones ───────────────────────────────────────
  const cargarUbicaciones = useCallback(async () => {
    setCargando(true); setError('');
    try {
      let url = API.MAPA_OBTENER_UBICACIONES;
      const p = [];
      if (filtroSector) p.push(`sector=${filtroSector}`);
      if (filtroTipo)   p.push(`tipo=${filtroTipo}`);
      if (p.length) url += '?' + p.join('&');
      const res  = await apiFetch(url);
      const json = await res.json();
      if (json.error) throw new Error(json.message);
      setUbicaciones(json.data || []);
    } catch { setError('No se pudieron cargar las ubicaciones'); }
    finally  { setCargando(false); }
  }, [filtroSector, filtroTipo]);

  useEffect(() => { cargarUbicaciones(); }, [cargarUbicaciones]);

  // ── Buscar contrato ──────────────────────────────────────────
  const buscarContrato = useCallback(async (num) => {
    if (!num) { setContratoData(null); setErrorContrato(''); return; }
    setBuscando(true); setErrorContrato(''); setContratoData(null);
    try {
      const res  = await apiFetch(`${API.MAPA_BUSCAR_CONTRATO}?num_contrato=${encodeURIComponent(num)}`);
      const json = await res.json();
      if (json.error || !json.data) setErrorContrato('Contrato no encontrado.');
      else setContratoData(json.data);
    } catch { setErrorContrato('Error al buscar. Verifica conexión.'); }
    finally  { setBuscando(false); }
  }, []);

  const onContratoChange = (e) => {
    const val = e.target.value;
    setNumContrato(val);
    clearTimeout(buscarTimeout.current);
    buscarTimeout.current = setTimeout(() => buscarContrato(val.trim()), 600);
  };

  // ── GPS ──────────────────────────────────────────────────────
  const obtenerGPS = useCallback(() => {
    if (!navigator.geolocation) { setMensajeForm('GPS no disponible en este dispositivo'); return; }
    setObteniendo(true);
    setMensajeForm('Obteniendo ubicación GPS...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Solo aplica si el usuario no cambió a modo manual mientras esperaba
        if (modoRef.current !== 'gps') { setObteniendo(false); return; }
        const c = [pos.coords.latitude, pos.coords.longitude];
        setCoords(c);
        setVolarA(c);
        setMensajeForm('');
        setObteniendo(false);
      },
      () => { setMensajeForm('No se pudo obtener el GPS. Verifica permisos.'); setObteniendo(false); },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, []);

  // ── Abrir formulario ─────────────────────────────────────────
  const abrirFormulario = () => {
    modoRef.current = 'gps';
    setMostrarForm(true);
    setModoUbicacion('gps');
    setPasoManual(1);
    setMensajeForm('');
    setErrorContrato('');
    setContratoData(null);
    setNumContrato('');
    setCoords(null);
    setNotas('');
    setTipo('cliente');
    setSector(1);
    setVolarA(null);
    obtenerGPS();
  };

  // ── Cambiar modo ubicación ───────────────────────────────────
  const cambiarModo = (modo) => {
    modoRef.current = modo;
    setModoUbicacion(modo);
    setCoords(null);
    setMensajeForm('');
    if (modo === 'gps') {
      obtenerGPS();
    } else {
      setPasoManual(1);
    }
  };

  // ── Guardar ──────────────────────────────────────────────────
  // Detección automática de sector cuando cambian las coordenadas
  const [sectorDetectado, setSectorDetectado] = useState(null);

  useEffect(() => {
    if (!coords) { setSectorDetectado(null); return; }
    const detectado = detectarSector(coords, sectoresCoords);
    setSectorDetectado(detectado);
    if (detectado) setSector(detectado);
  }, [coords, sectoresCoords]);

  const sectoresListos   = haySectoresDefinidos(sectoresCoords);
  const necesitaContrato = tipo === 'cliente';
  // Bloquear solo si no hay sectores. Si cae fuera permite guardar con selección manual.
  const puedeGuardar = coords && (!necesitaContrato || contratoData) && sectoresListos;

  const guardarUbicacion = async () => {
    if (necesitaContrato && !contratoData) { setMensajeForm('Busca un contrato válido primero'); return; }
    if (!coords) { setMensajeForm(modoUbicacion === 'gps' ? 'Captura el GPS primero' : 'Toca el mapa para marcar la ubicación'); return; }
    setGuardando(true);
    try {
      const res  = await apiFetch(API.MAPA_GUARDAR_UBICACION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_contrato: contratoData?.id_contrato ?? null,
          latitud: coords[0], longitud: coords[1],
          tipo, sector, notas,
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.message);
      setMensajeForm('¡Ubicación guardada correctamente!');
      cargarUbicaciones();
      setTimeout(() => setMostrarForm(false), 1500);
    } catch (e) { setMensajeForm('Error al guardar: ' + e.message); }
    finally     { setGuardando(false); }
  };

  // ── Sectores ─────────────────────────────────────────────────
  const agregarPuntoSector = (c) => {
    setSectoresCoords(prev => {
      const n = { ...prev, [sectorActivo]: [...(prev[sectorActivo] || []), c] };
      localStorage.setItem(STORAGE_SECTORES, JSON.stringify(n));
      return n;
    });
  };

  const deshacerPunto = () => {
    setSectoresCoords(prev => {
      const pts = [...(prev[sectorActivo] || [])]; pts.pop();
      const n = { ...prev, [sectorActivo]: pts };
      localStorage.setItem(STORAGE_SECTORES, JSON.stringify(n));
      return n;
    });
  };

  // ── Limpiar todos los registros del mapa ─────────────────────
  const limpiarTodo = async () => {
    if (!window.confirm('¿Eliminar TODOS los clientes y válvulas del mapa? Esta acción no se puede deshacer.')) return;
    try {
      const res  = await apiFetch(API.MAPA_LIMPIAR, { method: 'DELETE' });
      const json = await res.json();
      if (json.error) throw new Error(json.message);
      alert(`Listo — ${json.eliminados} registros eliminados.`);
      cargarUbicaciones();
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };

  const limpiarSector = (id) => {
    setSectoresCoords(prev => {
      const n = { ...prev, [id]: [] };
      localStorage.setItem(STORAGE_SECTORES, JSON.stringify(n));
      return n;
    });
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f1f5f9' }}>
      <div style={{ position: 'relative', zIndex: 9999 }}>
        <NavMenu />
      </div>

      {/* Barra de controles del mapa */}
      <div style={{
        background: '#1e40af', color: 'white', padding: '8px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 6, zIndex: 1000,
      }}>
        <span style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}>🗺 Tomas de Agua</span>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={filtroSector} onChange={e => setFiltroSector(e.target.value)} style={estiloSelect}>
            <option value="">Todos sectores</option>
            <option value="1">Sector 1</option>
            <option value="2">Sector 2</option>
            <option value="3">Sector 3</option>
          </select>
          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} style={estiloSelect}>
            <option value="">Todo</option>
            <option value="cliente">Clientes</option>
            <option value="valvula">Válvulas</option>
          </select>
          <button onClick={abrirFormulario} style={estiloBotonPrimario}>+ Registrar</button>
          <button
            onClick={() => setSectoresEditando(!sectoresEditando)}
            style={{ ...estiloBotonPrimario, background: sectoresEditando ? '#dc2626' : '#0ea5e9' }}
          >
            {sectoresEditando ? '✓ Listo' : '⬡ Sectores'}
          </button>
          <button onClick={fijarInicio} style={{
            ...estiloBotonPrimario,
            background: inicioGuardado ? '#16a34a' : '#374151',
            transition: 'background 0.3s',
          }}>
            {inicioGuardado ? '✓ Guardado' : '📌 Fijar inicio'}
          </button>
          {ubicaciones.length > 0 && (
            <button onClick={() => setFitTrigger(t => t + 1)}
              style={{ ...estiloBotonPrimario, background: '#16a34a' }}>
              Ver todos
            </button>
          )}
          <button
            onClick={() => setCapa(c => c === 'mapa' ? 'satelite' : 'mapa')}
            style={{ ...estiloBotonPrimario, background: capa === 'satelite' ? '#0369a1' : '#475569' }}>
            {capa === 'satelite' ? 'Mapa' : 'Satelite'}
          </button>
          <button onClick={limpiarTodo}
            style={{ ...estiloBotonPrimario, background: '#dc2626' }}>
            Limpiar todo
          </button>
        </div>
      </div>

      {/* Panel sectores */}
      {sectoresEditando && (
        <div style={{
          background: '#1e3a8a', color: 'white', padding: '8px 16px',
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 13,
        }}>
          <span style={{ fontWeight: 600 }}>Clic en el mapa → agrega vértice al sector seleccionado:</span>
          {[1, 2, 3].map(id => (
            <button key={id} onClick={() => setSectorActivo(id)} style={{
              background: sectorActivo === id ? SECTOR_COLORES[id].fillColor : 'rgba(255,255,255,0.15)',
              color: 'white', border: '1px solid rgba(255,255,255,0.4)',
              borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontWeight: 600,
            }}>
              Sector {id} ({(sectoresCoords[id] || []).length} pts)
            </button>
          ))}
          <button onClick={deshacerPunto} style={estiloBotonUndo}>↩ Deshacer</button>
          <button onClick={() => limpiarSector(sectorActivo)} style={estiloBotonUndo}>🗑 Limpiar S{sectorActivo}</button>
          <span style={{ color: '#93c5fd', fontSize: 11 }}>Se guarda automáticamente</span>
        </div>
      )}


      {/* Leyenda */}
      <div style={{
        background: 'white', padding: '6px 16px', display: 'flex',
        gap: 16, fontSize: 12, borderBottom: '1px solid #e2e8f0',
        flexWrap: 'wrap', alignItems: 'center',
      }}>
        {Object.entries(SECTOR_COLORES).map(([id, s]) => (
          <span key={id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 12, height: 12, borderRadius: 2, background: s.fillColor, display: 'inline-block' }} />
            {s.label} {(sectoresCoords[id] || []).length > 0
              ? `(${(sectoresCoords[id] || []).length} pts)`
              : <span style={{ color: '#94a3b8' }}>(sin definir)</span>}
          </span>
        ))}
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#2563eb', display: 'inline-block' }} /> Cliente
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} /> Válvula
        </span>
        {!cargando && (
          <span style={{ marginLeft: 'auto', color: '#64748b' }}>
            {ubicaciones.length} punto{ubicaciones.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '8px 16px', fontSize: 13 }}>{error}</div>}

      {/* Mapa */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>

        {/* Cruz central — visible solo en modo manual */}
        {mostrarForm && modoUbicacion === 'manual' && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000, pointerEvents: 'none',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}>
            {/* Ícono de válvula de agua */}
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: '#dc2626', border: '3px solid white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}>
              {/* Gate valve symbol */}
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="white" strokeWidth="1.8">
                <circle cx="12" cy="12" r="5.5"/>
                <polygon points="6.5,12 10,7.5 10,16.5" fill="white" stroke="none"/>
                <polygon points="17.5,12 14,7.5 14,16.5" fill="white" stroke="none"/>
                <line x1="12" y1="3" x2="12" y2="6.5" strokeWidth="2"/>
                <line x1="9"  y1="3" x2="15" y2="3" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            {/* Puntero hacia abajo */}
            <div style={{
              width: 2, height: 12, background: '#0369a1',
            }}/>
            <div style={{
              width: 0, height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: '7px solid #0369a1',
            }}/>
            <div style={{
              background: '#0369a1', color: 'white',
              fontSize: 10, fontWeight: 700,
              padding: '2px 8px', borderRadius: 4, marginTop: 4,
              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            }}>
              Mueve el mapa
            </div>
          </div>
        )}
        <MapContainer
          center={posInicial.center}
          zoom={posInicial.zoom}
          maxZoom={MAX_ZOOM}
          style={{ height: '100%', width: '100%', minHeight: '400px' }}
        >
          <TileLayer
            key={capa}
            attribution={CAPAS[capa].attribution}
            url={CAPAS[capa].url}
            maxNativeZoom={CAPAS[capa].maxNativeZoom}
            maxZoom={CAPAS[capa].maxZoom}
          />

          <GuardaPosicion onPosicion={setPosActual} />
          <InvalidateSize />

          <ManejadorClics
            sectoresEditando={sectoresEditando}
            onSector={agregarPuntoSector}
          />

          {/* Sigue el centro del mapa en modo manual */}
          {mostrarForm && modoUbicacion === 'manual' && (
            <SeguirCentro onCoordsChange={setCoords} />
          )}

          {/* Polígonos de sectores */}
          {[1, 2, 3].map(id => {
            const pts = sectoresCoords[id] || [];
            if (pts.length < 3) return null;
            const c = SECTOR_COLORES[id];
            return (
              <Polygon key={id} positions={pts}
                pathOptions={{ color: c.color, fillColor: c.fillColor, fillOpacity: 0.12, weight: 2, dashArray: '6 4' }}>
                <Popup>{c.label}</Popup>
              </Polygon>
            );
          })}

          {/* Vértices en modo edición */}
          {sectoresEditando && (sectoresCoords[sectorActivo] || []).map((p, i) => (
            <Marker key={`v-${sectorActivo}-${i}`} position={p}
              icon={new L.DivIcon({
                className: '',
                html: `<div style="width:10px;height:10px;background:${SECTOR_COLORES[sectorActivo].fillColor};border:2px solid white;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.5)"></div>`,
                iconSize: [10, 10], iconAnchor: [5, 5],
              })}
            />
          ))}


          {volarA && <VolarA coords={volarA} />}
          <FitBounds ubicaciones={ubicaciones} trigger={fitTrigger} />

          {/* Marcadores guardados */}
          {ubicaciones.map(ub => (
            <Marker key={ub.id}
              position={[parseFloat(ub.latitud), parseFloat(ub.longitud)]}
              icon={ub.tipo === 'valvula' ? iconoValvula : iconoCliente}
            >
              <Popup maxWidth={260}>
                {ub.tipo === 'valvula' ? (
                  <div style={{ fontSize: 13, lineHeight: 1.7 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#dc2626', marginBottom: 4 }}>
                      Valvula de Paso
                    </div>
                    <div><b>Sector:</b> {SECTOR_COLORES[ub.sector]?.label}</div>
                    {ub.notas && <div><b>Descripcion:</b> {ub.notas}</div>}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                      {ub.Nombre} {ub.Apellido_pat} {ub.Apellido_mat}
                    </div>
                    <div><b>Contrato:</b> {ub.num_contrato}</div>
                    <div><b>Domicilio:</b> {ub.domicilio || '—'}</div>
                    <div><b>Telefono:</b> {ub.num_celular || '—'}</div>
                    <div><b>Sector:</b> {SECTOR_COLORES[ub.sector]?.label}</div>
                    {parseInt(ub.anios_deuda) > 0 && (
                      <div style={{ marginTop: 6, background: '#fee2e2', borderRadius: 4, padding: '4px 8px' }}>
                        <b>Adeudos pendientes:</b> {ub.anios_deuda} año{ub.anios_deuda !== 1 ? 's' : ''}
                      </div>
                    )}
                    {ub.notas && <div style={{ marginTop: 4, color: '#64748b', fontSize: 12 }}>{ub.notas}</div>}
                  </div>
                )}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Modo manual paso 1 — barra mínima para posicionar */}
      {mostrarForm && modoUbicacion === 'manual' && pasoManual === 1 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 2000,
          display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ width: '100%', maxWidth: 500, background: '#0f172a',
            borderRadius: '16px 16px 0 0', padding: '14px 16px 24px',
            pointerEvents: 'auto', boxShadow: '0 -4px 20px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>
                Mueve el mapa al punto exacto
              </span>
              <button onClick={() => setMostrarForm(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 12 }}>
              {coords
                ? `Lat: ${coords[0].toFixed(6)}  Lng: ${coords[1].toFixed(6)}`
                : 'Centrando...'}
            </div>
            <button
              onClick={() => setPasoManual(2)}
              disabled={!coords}
              style={{ ...estiloBotonPrimario, width: '100%', padding: '12px 0',
                opacity: coords ? 1 : 0.5 }}>
              Confirmar ubicacion
            </button>
          </div>
        </div>
      )}

      {/* Formulario completo — GPS siempre, manual solo en paso 2 */}
      {mostrarForm && (modoUbicacion === 'gps' || pasoManual === 2) && (
        <div style={estiloManualWrap}>
          <div style={estiloManualPanel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {modoUbicacion === 'manual' && (
                  <button onClick={() => setPasoManual(1)}
                    style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: 6,
                      padding: '3px 8px', fontSize: 12, cursor: 'pointer', color: '#374151' }}>
                    ← Reposicionar
                  </button>
                )}
                <h3 style={{ margin: 0, color: '#1e40af' }}>Registrar Ubicación</h3>
              </div>
              <button onClick={() => setMostrarForm(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            {/* Toggle GPS / Manual */}
            <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid #d1d5db', marginBottom: 14 }}>
              {[
                { key: 'gps',    label: '📡 Usar GPS',         desc: 'Tu posición actual' },
                { key: 'manual', label: '🗺️ Marcar en mapa',  desc: 'Clic sobre el mapa' },
              ].map(m => (
                <button key={m.key} onClick={() => cambiarModo(m.key)} style={{
                  flex: 1, padding: '8px 4px', border: 'none', cursor: 'pointer', fontSize: 13,
                  background: modoUbicacion === m.key ? '#1e40af' : '#f8fafc',
                  color: modoUbicacion === m.key ? 'white' : '#374151',
                  fontWeight: modoUbicacion === m.key ? 700 : 500,
                }}>
                  <div>{m.label}</div>
                  <div style={{ fontSize: 10, opacity: 0.8 }}>{m.desc}</div>
                </button>
              ))}
            </div>

            {/* Estado de coordenadas */}
            <div style={{
              background: coords ? '#f0fdf4' : modoUbicacion === 'manual' ? '#f5f3ff' : '#fefce8',
              border: `1px solid ${coords ? '#86efac' : modoUbicacion === 'manual' ? '#c4b5fd' : '#fde047'}`,
              borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
            }}>
              <span>
                {obteniendo && '⏳ Obteniendo GPS...'}
                {!obteniendo && coords && `📍 ${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}`}
                {!obteniendo && !coords && modoUbicacion === 'gps'    && '⚠️ GPS no capturado'}
                {!obteniendo && !coords && modoUbicacion === 'manual' && 'Mueve el mapa hasta el punto exacto'}
              </span>
              {modoUbicacion === 'gps' && (
                <button onClick={obtenerGPS} disabled={obteniendo} style={{
                  background: '#2563eb', color: 'white', border: 'none',
                  borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer',
                }}>
                  {obteniendo ? '...' : 'Actualizar'}
                </button>
              )}
              {modoUbicacion === 'manual' && coords && (
                <button onClick={() => { setCoords(null); setMensajeForm(''); }} style={{
                  background: '#dc2626', color: 'white', border: 'none',
                  borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer',
                }}>
                  Borrar
                </button>
              )}
            </div>

            {/* Contrato — solo requerido para clientes */}
            {tipo === 'valvula' ? (
              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8,
                padding: '8px 12px', marginBottom: 12, fontSize: 13, color: '#0369a1' }}>
                Las válvulas no requieren contrato asociado.
              </div>
            ) : (
              <>
                <label style={estiloLabel}>Número de Contrato <span style={{ color: '#dc2626' }}>*</span></label>
                <input type="text" placeholder="Ej: 1045" value={numContrato}
                  onChange={onContratoChange} style={estiloInput} />
                {buscando && <p style={{ fontSize: 12, color: '#64748b', marginTop: -6 }}>Buscando...</p>}
                {errorContrato && (
                  <p style={{ fontSize: 12, color: '#b91c1c', marginTop: -6, marginBottom: 8,
                    background: '#fee2e2', padding: '6px 10px', borderRadius: 6 }}>{errorContrato}</p>
                )}
                {contratoData && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 13 }}>
                    <div style={{ fontWeight: 700 }}>
                      {contratoData.Nombre} {contratoData.Apellido_pat} {contratoData.Apellido_mat}
                    </div>
                    <div>{contratoData.domicilio}</div>
                    <div>Tel: {contratoData.num_celular || '—'}</div>
                    {parseInt(contratoData.anios_deuda) > 0 && (
                      <div style={{ color: '#b91c1c', marginTop: 4 }}>
                        Adeudos pendientes: {contratoData.anios_deuda} año{contratoData.anios_deuda !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Alerta si no hay sectores definidos */}
            {!sectoresListos && (
              <div style={{ background: '#fef3c7', border: '1px solid #fbbf24',
                borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontSize: 13, color: '#92400e' }}>
                Define los sectores primero (boton "Sectores" en el mapa).
              </div>
            )}

            {/* Sector — detectado automáticamente */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={estiloLabel}>
                  Sector
                  {sectorDetectado && (
                    <span style={{ marginLeft: 6, color: '#16a34a', fontWeight: 700, fontSize: 11 }}>
                      AUTO
                    </span>
                  )}
                </label>
                {sectorDetectado ? (
                  <div style={{ ...estiloInput, marginBottom: 0, background: '#f0fdf4',
                    border: '1px solid #86efac', color: '#166534', fontWeight: 600,
                    display: 'flex', alignItems: 'center' }}>
                    {SECTOR_COLORES[sectorDetectado]?.label}
                  </div>
                ) : coords && sectoresListos ? (
                  <>
                    <div style={{ background: '#fee2e2', border: '1px solid #fca5a5',
                      borderRadius: 6, padding: '6px 10px', fontSize: 12, color: '#b91c1c', marginBottom: 6 }}>
                      Fuera de los sectores definidos
                    </div>
                    <select value={sector} onChange={e => setSector(+e.target.value)} style={estiloInput}>
                      <option value={1}>Sector 1 (manual)</option>
                      <option value={2}>Sector 2 (manual)</option>
                      <option value={3}>Sector 3 (manual)</option>
                    </select>
                  </>
                ) : (
                  <div style={{ ...estiloInput, marginBottom: 0, color: '#94a3b8', background: '#f8fafc' }}>
                    Se detectará al obtener coordenadas
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <label style={estiloLabel}>Tipo</label>
                <select value={tipo} onChange={e => setTipo(e.target.value)} style={estiloInput}>
                  <option value="cliente">Cliente</option>
                  <option value="valvula">Válvula</option>
                </select>
              </div>
            </div>

            {/* Notas / Descripción */}
            <label style={estiloLabel}>
              {tipo === 'valvula' ? 'Descripcion (cierre, ramal, diametro...)' : 'Notas (opcional)'}
            </label>
            <input type="text"
              placeholder={tipo === 'valvula' ? 'Ej: Cierre calle Morelos, 2 pulgadas' : 'Observaciones...'}
              value={notas}
              onChange={e => setNotas(e.target.value)} style={{ ...estiloInput, marginBottom: 12 }} />

            {mensajeForm && (
              <p style={{
                fontSize: 13, padding: '6px 10px', borderRadius: 6,
                background: mensajeForm.includes('correctamente') ? '#f0fdf4' : '#fef9c3',
                color: mensajeForm.includes('correctamente') ? '#166534' : '#713f12',
              }}>
                {mensajeForm}
              </p>
            )}

            <button onClick={guardarUbicacion}
              disabled={guardando || !puedeGuardar}
              style={{
                ...estiloBotonPrimario, width: '100%', marginTop: 12, padding: '12px 0',
                opacity: !puedeGuardar ? 0.5 : 1,
                cursor: !puedeGuardar ? 'not-allowed' : 'pointer',
              }}
            >
              {guardando ? 'Guardando...'
                : !sectoresListos ? 'Define los sectores primero'
                : !coords ? 'Obtén la ubicación primero'
                : 'Guardar Ubicación'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Estilos ────────────────────────────────────────────────────
const estiloSelect = {
  background: 'white', color: '#1e293b',
  border: '1px solid #cbd5e1', borderRadius: 6,
  padding: '5px 8px', fontSize: 13, cursor: 'pointer',
};
const estiloBotonPrimario = {
  background: '#2563eb', color: 'white', border: 'none',
  borderRadius: 6, padding: '7px 14px', fontSize: 13,
  cursor: 'pointer', fontWeight: 600,
};
const estiloBotonUndo = {
  background: 'rgba(255,255,255,0.15)', color: 'white',
  border: '1px solid rgba(255,255,255,0.3)', borderRadius: 6,
  padding: '4px 10px', fontSize: 12, cursor: 'pointer',
};
// Panel inferior sin overlay — mapa siempre accesible
const estiloManualWrap = {
  position: 'fixed', bottom: 0, left: 0, right: 0,
  zIndex: 2000, display: 'flex',
  justifyContent: 'center',
  pointerEvents: 'none',
};
const estiloManualPanel = {
  background: 'white',
  borderRadius: '16px 16px 0 0',
  padding: '14px 16px 28px',
  width: '100%', maxWidth: 500,
  maxHeight: '60vh',
  overflowY: 'auto',
  boxShadow: '0 -6px 30px rgba(0,0,0,0.25)',
  pointerEvents: 'auto',
};
const estiloLabel = {
  display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4,
};
const estiloInput = {
  width: '100%', padding: '8px 10px', fontSize: 14,
  border: '1px solid #d1d5db', borderRadius: 6,
  marginBottom: 10, boxSizing: 'border-box', color: '#111827', background: 'white',
};
