// ─────────────────────────────────────────────────────────────
//  Parser y clasificador de KML de Google My Maps
//  para el módulo de Mapa del Comité del Agua
// ─────────────────────────────────────────────────────────────

// Clasifica un punto según su nombre.
// Devuelve { categoria, tipo, num_contrato } o categoria='ignorar'/'revision'
export function clasificarPunto(nombreRaw) {
  const nombre = (nombreRaw || '').trim();
  const n = nombre.toLowerCase();

  if (!nombre) return { categoria: 'ignorar' };

  // Basura: rutas de Google
  if (n.startsWith('indicaciones')) return { categoria: 'ignorar' };

  // Nodos de trazado: "Punto 22" → ignorar como punto individual
  if (/^punto\b/.test(n) || nombre === 'Punto') return { categoria: 'ignorar' };

  // Rótulos de red/ramal que aparezcan como punto → ignorar
  if (/^(red|ramal|l[ií]nea|final de red)\b/.test(n)) return { categoria: 'ignorar' };

  // Válvula
  if (n.includes('valvula') || n.includes('válvula')) {
    return { categoria: 'infra', tipo: 'valvula', notas: nombre };
  }

  // Tubo
  if (/^tubo\b/.test(n)) {
    return { categoria: 'infra', tipo: 'tubo', notas: nombre };
  }

  // Conexión T o Y (solo, o con medida: T 2", Y)
  if (/^(t|y)(\s|$|\d|")/.test(n) || n === 't' || n === 'y') {
    return { categoria: 'infra', tipo: 'conexion', notas: nombre };
  }

  // Cliente comercial: "Comercial 1005" → contrato 1005
  const comercial = nombre.match(/^comercial\s+(\w+)/i);
  if (comercial) {
    return { categoria: 'cliente', tipo: 'cliente', num_contrato: comercial[1], notas: nombre };
  }

  // Cliente por número (con letra o guion opcional): 1001, 335B, 894-D, 113B
  if (/^\d+[a-zA-Z]?(-[a-zA-Z])?$/.test(nombre)) {
    return { categoria: 'cliente', tipo: 'cliente', num_contrato: nombre, notas: '' };
  }

  // Cualquier otra cosa (nombres de persona, "Contrato nuevo", "48 cambiar") → revisión manual
  return { categoria: 'revision', nombre };
}

// Convierte "lng,lat,alt" → [lat, lng]
function parseCoord(str) {
  const parts = str.trim().split(',');
  if (parts.length < 2) return null;
  const lng = parseFloat(parts[0]);
  const lat = parseFloat(parts[1]);
  if (isNaN(lat) || isNaN(lng)) return null;
  return [lat, lng];
}

// Parsea el texto KML completo. Devuelve { puntos, lineas, revision, ignorados }
export function parseKML(kmlText) {
  const dom = new DOMParser().parseFromString(kmlText, 'text/xml');
  const placemarks = Array.from(dom.getElementsByTagName('Placemark'));

  const puntos = [];     // { tipo, num_contrato?, lat, lng, notas }
  const lineas = [];     // { nombre, descripcion, coordenadas:[[lat,lng]...] }
  const revision = [];   // { nombre, lat, lng } — requieren revisión manual
  let ignorados = 0;

  for (const pm of placemarks) {
    const nombre = (pm.getElementsByTagName('name')[0]?.textContent || '').trim();
    const descEl = pm.getElementsByTagName('description')[0];
    const descripcion = (descEl?.textContent || '').trim();

    const pointEl = pm.getElementsByTagName('Point')[0];
    const lineEl  = pm.getElementsByTagName('LineString')[0];

    // ── LÍNEA (trazado de tubería) ──
    if (lineEl) {
      const coordText = lineEl.getElementsByTagName('coordinates')[0]?.textContent || '';
      const n = nombre.toLowerCase();
      if (n.startsWith('indicaciones')) { ignorados++; continue; }
      const coords = coordText.trim().split(/\s+/).map(parseCoord).filter(Boolean);
      if (coords.length >= 2) {
        lineas.push({ nombre: nombre || 'Línea', descripcion, coordenadas: coords });
      } else {
        ignorados++;
      }
      continue;
    }

    // ── PUNTO (toma, válvula, infra) ──
    if (pointEl) {
      const coordText = pointEl.getElementsByTagName('coordinates')[0]?.textContent || '';
      const c = parseCoord(coordText);
      if (!c) { ignorados++; continue; }

      const clas = clasificarPunto(nombre);
      if (clas.categoria === 'ignorar') { ignorados++; continue; }
      if (clas.categoria === 'revision') {
        revision.push({ nombre: clas.nombre, lat: c[0], lng: c[1] });
        continue;
      }
      puntos.push({
        tipo: clas.tipo,
        num_contrato: clas.num_contrato || null,
        lat: c[0],
        lng: c[1],
        notas: clas.notas || '',
      });
      continue;
    }

    ignorados++;
  }

  return { puntos, lineas, revision, ignorados };
}
