
// Datos ficticios de la Semana de Ingeniería.
// Todas las personas, lugares y eventos son inventados para el taller.

export const WEEK = [
  '2026-11-23',
  '2026-11-24',
  '2026-11-25',
  '2026-11-26',
  '2026-11-27',
];

export const CATEGORIES = [
  { id: 'hackathon', label: 'Hackathon', icon: 'i-hack' },
  { id: 'robotica', label: 'Robótica', icon: 'i-robo' },
  { id: 'conferencias', label: 'Conferencias', icon: 'i-conf' },
  { id: 'esports', label: 'E-sports', icon: 'i-esp' },
  { id: 'feria', label: 'Feria', icon: 'i-feria' },
];

const RAW_EVENTS = [
  {
    id: 'mini-hackathon',
    title: 'Mini hackathon: apps para el campus',
    category: 'hackathon',
    date: '2026-11-23',
    time: '09:00',
    venue: 'Laboratorio de Cómputo B',
    capacity: 40,
    registered: 31,
    price: 0,
  },
  {
    id: 'mario-kart',
    title: 'Torneo de Mario Kart',
    category: 'esports',
    date: '2026-11-23',
    time: '18:00',
    venue: 'Sala de usos múltiples',
    capacity: 32,
    registered: 32,
    price: 30,
  },
  {
    id: 'minisumo',
    title: 'Batalla de minisumo',
    category: 'robotica',
    date: '2026-11-24',
    time: '16:00',
    venue: 'Gimnasio universitario',
    capacity: 30,
    registered: 33,
    price: 50,
  },
  {
    id: 'git-desde-cero',
    title: 'Taller: Git desde cero',
    category: 'hackathon',
    date: '2026-11-25',
    time: '13:00',
    venue: 'Aula C24',
    capacity: 25,
    registered: 19,
    price: 0,
  },
  {
    id: 'ia-industria',
    title: 'IA en la industria: ¿herramienta o reemplazo?',
    category: 'conferencias',
    date: '2026-11-26',
    time: '12:00',
    venue: 'Auditorio A',
    capacity: 120,
    registered: 119,
    price: 0,
  },
  {
    id: 'brazo-robotico',
    title: 'Brazo robótico con Arduino',
    category: 'robotica',
    date: '2026-11-26',
    time: '15:00',
    venue: 'Laboratorio de Mecatrónica',
    capacity: 20,
    registered: 12,
    price: 120,
  },
  {
    id: 'codigo-entrega',
    title: 'Del código a la entrega con GitHub Actions',
    category: 'conferencias',
    date: '2026-11-26',
    time: '17:00',
    venue: 'Auditorio B',
    capacity: 80,
    registered: 41,
    price: 0,
  },
  {
    id: 'feria-proyectos',
    title: 'Feria de proyectos de ingeniería',
    category: 'feria',
    date: '2026-11-27',
    time: '10:00',
    venue: 'Explanada central',
    capacity: 300,
    registered: 140,
    price: 0,
  },
  {
    id: 'rocket-league',
    title: 'Torneo de Rocket League',
    category: 'esports',
    date: '2026-11-27',
    time: '18:00',
    venue: 'Sala de usos múltiples',
    capacity: 32,
    registered: 20,
    price: 80,
  },
  {
    id: 'posada-proyectos',
    title: 'Posada de proyectos',
    category: 'feria',
    date: '2026-12-02',
    time: '17:00',
    venue: 'Explanada central',
    capacity: 200,
    registered: 64,
    price: 0,
  },
];

// ---------- Validaciones ----------

function isValidDate(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }

  const parsed = new Date(`${date}T00:00:00Z`);

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === date
  );
}

function isValidTime(time) {
  if (typeof time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    return false;
  }

  return true;
}

function assertUniqueIds(items, type) {
  const ids = new Set(items.map((item) => item.id));

  if (ids.size !== items.length) {
    throw new Error(`Existen identificadores de ${type} duplicados.`);
  }
}

// Validar semana.
if (!WEEK.every(isValidDate)) {
  throw new Error('La semana contiene fechas inválidas.');
}

if (new Set(WEEK).size !== WEEK.length) {
  throw new Error('Existen fechas duplicadas en WEEK.');
}

// Validar categorías.
assertUniqueIds(CATEGORIES, 'categoría');

const categoryMap = new Map(
  CATEGORIES.map((category) => [category.id, category]),
);

// Validar identificadores de eventos.
assertUniqueIds(RAW_EVENTS, 'eventos');

// ---------- Construcción de eventos ----------

const WEEK_DATES = new Set(WEEK);

export const ALL_EVENTS = RAW_EVENTS.map((event) => {
  const category = categoryMap.get(event.category);

  if (!category) {
    throw new Error(
      `Categoría desconocida "${event.category}" en el evento "${event.id}".`,
    );
  }

  if (!isValidDate(event.date)) {
    throw new Error(
      `Fecha inválida "${event.date}" en el evento "${event.id}".`,
    );
  }

  if (!isValidTime(event.time)) {
    throw new Error(
      `Horario inválido "${event.time}" en el evento "${event.id}".`,
    );
  }

  if (!Number.isInteger(event.capacity) || event.capacity <= 0) {
    throw new Error(
      `Capacidad inválida en el evento "${event.id}".`,
    );
  }

  if (!Number.isInteger(event.registered) || event.registered < 0) {
    throw new Error(
      `Número de inscritos inválido en el evento "${event.id}".`,
    );
  }

  if (!Number.isFinite(event.price) || event.price < 0) {
    throw new Error(
      `Precio inválido en el evento "${event.id}".`,
    );
  }

  return {
    ...event,
    categoryLabel: category.label,

    // Nunca mostrar disponibilidad negativa.
    available: Math.max(0, event.capacity - event.registered),

    // Se considera lleno cuando alcanza o supera su capacidad.
    isFull: event.registered >= event.capacity,

    // Permite detectar eventos con sobrecupo.
    overCapacity: Math.max(0, event.registered - event.capacity),
  };
});

// Eventos correspondientes exclusivamente a la semana.
export const EVENTS = ALL_EVENTS.filter((event) =>
  WEEK_DATES.has(event.date),
);

// Eventos programados fuera de la semana.
export const OUT_OF_WEEK_EVENTS = ALL_EVENTS.filter(
  (event) => !WEEK_DATES.has(event.date),
);
