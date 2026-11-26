// Lógica de CampusFest: funciones puras, sin DOM.
// La app (app.js) y las pruebas (tests/) usan estas mismas funciones.

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Convierte una fecha YYYY-MM-DD a UTC para evitar problemas
// de zona horaria y cambios de horario de verano.
function toDate(dateStr) {
  const date = new Date(`${dateStr}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw new RangeError(`Fecha inválida: ${dateStr}`);
  }

  return date;
}

function pad(number) {
  return String(number).padStart(2, '0');
}

// ---------- Cupos ----------

export function spotsLeft(event) {
  return Math.max(0, event.capacity - event.registered);
}

export function isFull(event) {
  return spotsLeft(event) === 0;
}

export function spotsLabel(event) {
  if (isFull(event)) {
    return 'Cupo lleno';
  }

  const spots = spotsLeft(event);
  return `${spots} ${spots === 1 ? 'lugar' : 'lugares'}`;
}

// ---------- Precio ----------

export function formatPrice(price) {
  return `$${price}`;
}

// ---------- Fechas ----------

export function formatShortDate(dateStr) {
  const date = toDate(dateStr);

  return `${pad(date.getUTCDate())}/${pad(date.getUTCMonth() + 1)}`;
}

export function weekdayName(dateStr) {
  return WEEKDAYS[toDate(dateStr).getUTCDay()];
}

export function daysUntil(dateStr, todayStr) {
  const eventDate = toDate(dateStr);
  const today = toDate(todayStr);

  return Math.round((eventDate - today) / MS_PER_DAY);
}

export function countdownLabel(dateStr, todayStr) {
  const days = daysUntil(dateStr, todayStr);

  if (days === 0) {
    return 'Hoy';
  }

  if (days === 1) {
    return 'Mañana';
  }

  if (days === -1) {
    return 'Ayer';
  }

  if (days < 0) {
    return `Hace ${Math.abs(days)} días`;
  }

  return `Faltan ${days} días`;
}

export function sortByDate(events) {
  return [...events].sort((a, b) => {
    return toDate(a.date) - toDate(b.date);
  });
}

// ---------- Búsqueda y filtros ----------

export function matchesSearch(event, query) {
  const normalizedQuery = String(query ?? '').trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const text = [
    event.title,
    event.venue,
    event.categoryLabel,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return text.includes(normalizedQuery);
}

export function filterEvents(
  events,
  {
    query = '',
    category = 'todas',
    day = null,
    onlyMine = false,
    mine = [],
  } = {},
) {
  return events.filter((event) => {
    if (category !== 'todas' && event.category !== category) {
      return false;
    }

    if (day && event.date !== day) {
      return false;
    }

    if (onlyMine && !mine.includes(event.id)) {
      return false;
    }

    if (query && !matchesSearch(event, query)) {
      return false;
    }

    return true;
  });
}