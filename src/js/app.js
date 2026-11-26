
// Interfaz de CampusFest: dibuja la pantalla usando las funciones de logic.js.

import { CATEGORIES, EVENTS, WEEK } from './data.js';

import {
  countdownLabel,
  filterEvents,
  formatPrice,
  formatShortDate,
  isFull,
  sortByDate,
  spotsLabel,
  spotsLeft,
  weekdayName,
} from './logic.js';

const STORAGE_KEY = 'campusfest-inscripciones';

const validEventIds = new Set(EVENTS.map((event) => event.id));

const state = {
  query: '',
  category: 'todas',
  day: null,
  onlyMine: false,
  mine: loadMine(),
  today: getToday(),
};

// ---------- Fecha actual ----------

// Se puede fijar el día con ?hoy=2026-11-26 (útil para la demo).
function getToday() {
  const fromUrl = new URLSearchParams(location.search).get('hoy');

  if (/^\d{4}-\d{2}-\d{2}$/.test(fromUrl ?? '')) {
    try {
      // Utiliza la validación estricta de logic.js.
      formatShortDate(fromUrl);
      return fromUrl;
    } catch {
      // Si la fecha no existe, se utiliza la fecha actual.
    }
  }

  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
}

// ---------- Persistencia ----------

function loadMine() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? '[]',
    );

    if (!Array.isArray(saved)) {
      return [];
    }

    // Elimina identificadores duplicados y eventos inexistentes.
    return [...new Set(saved.filter((id) => validEventIds.has(id)))];
  } catch {
    return [];
  }
}

function saveMine() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(state.mine),
    );
  } catch {
    // Sin localStorage (modo privado):
    // la inscripción solo dura en esta pestaña.
  }
}

// ---------- Utilidades ----------

function escapeHtml(text) {
  return String(text ?? '').replace(
    /[&<>"']/g,
    (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    })[char],
  );
}

// Suma la inscripción del visitante al cupo ocupado.
function withMyRegistration(event) {
  if (!state.mine.includes(event.id)) {
    return event;
  }

  return {
    ...event,
    registered: event.registered + 1,
  };
}

function categoryOf(event) {
  return CATEGORIES.find(
    (category) => category.id === event.category,
  );
}

// ---------- Línea de la semana ----------

function renderWeek() {
  const html = WEEK.map((day) => {
    const lines = [
      ...new Set(
        EVENTS
          .filter((event) => event.date === day)
          .map((event) => event.category),
      ),
    ];

    const label = `${weekdayName(day)} ${Number(day.slice(8))}`;
    const isToday = day === state.today;

    return `
      <li>
        <button
          class="station${isToday ? ' is-today' : ''}"
          type="button"
          data-day="${escapeHtml(day)}"
          aria-pressed="${state.day === day}"
        >
          <span class="station-dot" aria-hidden="true"></span>

          <span class="station-name">
            ${escapeHtml(label)}${isToday ? ' · hoy' : ''}
          </span>

          <span class="station-lines" aria-hidden="true">
            ${lines.map((id) => `<i class="line-${escapeHtml(id)}"></i>`).join('')}
          </span>
        </button>
      </li>
    `;
  }).join('');

  document.querySelector('#week-stations').innerHTML = html;
}

// ---------- Filtros ----------

function renderChips() {
  const all = `
    <button
      class="chip"
      type="button"
      data-category="todas"
      aria-pressed="${state.category === 'todas'}"
    >
      Todas
    </button>
  `;

  const chips = CATEGORIES.map((category) => `
    <button
      class="chip"
      type="button"
      data-category="${escapeHtml(category.id)}"
      aria-pressed="${state.category === category.id}"
    >
      <span
        class="picto picto-sm line-${escapeHtml(category.id)}"
        aria-hidden="true"
      >
        <svg>
          <use href="#${escapeHtml(category.icon)}"/>
        </svg>
      </span>

      ${escapeHtml(category.label)}
    </button>
  `).join('');

  document.querySelector('#chips').innerHTML = all + chips;
}

// ---------- Tarjetas de eventos ----------

function renderEventCard(event) {
  const category = categoryOf(event);

  if (!category) {
    throw new Error(
      `No se encontró la categoría "${event.category}" del evento "${event.id}".`,
    );
  }

  const left = spotsLeft(event);
  const full = isFull(event);
  const mine = state.mine.includes(event.id);

  const spotsClass = full
    ? 'spots is-full'
    : left <= 5
      ? 'spots is-few'
      : 'spots';

  const button = mine
    ? `
      <button
        class="btn btn-done"
        type="button"
        data-register="${escapeHtml(event.id)}"
        aria-pressed="true"
      >
        <svg aria-hidden="true">
          <use href="#i-check"/>
        </svg>
        Inscrito
      </button>
    `
    : `
      <button
        class="btn"
        type="button"
        data-register="${escapeHtml(event.id)}"
        ${full ? 'disabled' : ''}
      >
        ${full ? 'Lleno' : 'Inscribirme'}
      </button>
    `;

  return `
    <article class="event">
      <div class="event-head">
        <span
          class="picto line-${escapeHtml(event.category)}"
          aria-hidden="true"
        >
          <svg>
            <use href="#${escapeHtml(category.icon)}"/>
          </svg>
        </span>

        <div>
          <h3>${escapeHtml(event.title)}</h3>

          <p class="meta">
            <span>
              <svg aria-hidden="true">
                <use href="#i-clock"/>
              </svg>
              ${weekdayName(event.date)}
              ${formatShortDate(event.date)}
              · ${escapeHtml(event.time)}
            </span>

            <span>
              <svg aria-hidden="true">
                <use href="#i-pin"/>
              </svg>
              ${escapeHtml(event.venue)}
            </span>
          </p>
        </div>
      </div>

      <div class="event-foot">
        <span class="${spotsClass}">
          ${spotsLabel(event)}
        </span>

        <span class="price">
          ${formatPrice(event.price)}
        </span>

        <span class="countdown">
          ${countdownLabel(event.date, state.today)}
        </span>

        ${button}
      </div>
    </article>
  `;
}

function renderEvents() {
  const events = sortByDate(
    filterEvents(
      EVENTS.map(withMyRegistration),
      state,
    ),
  );

  const list = document.querySelector('#events');
  const summary = document.querySelector('#results-summary');

  summary.textContent = `${events.length} de ${EVENTS.length} eventos`;

  if (events.length === 0) {
    const reason = state.query
      ? `para “${escapeHtml(state.query)}”`
      : 'con estos filtros';

    list.innerHTML = `
      <div class="empty">
        <p>No encontramos eventos ${reason}.</p>

        <button
          class="btn btn-ghost"
          type="button"
          data-clear
        >
          Limpiar filtros
        </button>
      </div>
    `;

    return;
  }

  list.innerHTML = events
    .map(renderEventCard)
    .join('');
}

// ---------- Mis inscripciones ----------

function renderMine() {
  const button = document.querySelector('#mine-toggle');

  button.querySelector('span').textContent =
    `Mis inscripciones (${state.mine.length})`;

  button.setAttribute(
    'aria-pressed',
    String(state.onlyMine),
  );
}

// ---------- Renderizado general ----------

function render() {
  try {
    renderWeek();
    renderChips();
    renderEvents();
    renderMine();
  } catch (error) {
    showFatalError(error);
  }
}

// ---------- Eventos de la interfaz ----------

function onClick(clickEvent) {
  const target = clickEvent.target.closest('button');

  if (!target) {
    return;
  }

  if (target.dataset.day) {
    state.day = state.day === target.dataset.day
      ? null
      : target.dataset.day;

  } else if (target.dataset.category) {
    state.category = target.dataset.category;

  } else if (target.dataset.register) {
    const id = target.dataset.register;

    if (!validEventIds.has(id)) {
      return;
    }

    state.mine = state.mine.includes(id)
      ? state.mine.filter((saved) => saved !== id)
      : [...state.mine, id];

    saveMine();

  } else if (target.id === 'mine-toggle') {
    state.onlyMine = !state.onlyMine;

  } else if ('clear' in target.dataset) {
    Object.assign(state, {
      query: '',
      category: 'todas',
      day: null,
      onlyMine: false,
    });

    document.querySelector('#search').value = '';

  } else {
    return;
  }

  render();
}

// ---------- Manejo de errores ----------

function showFatalError(error) {
  console.error(error);

  const panel = document.querySelector('#app-error');

  if (!panel) {
    return;
  }

  panel.hidden = false;

  const code = panel.querySelector('code');

  if (code) {
    code.textContent = error?.message ?? String(error);
  }
}

// ---------- Inicialización ----------

document.addEventListener('click', onClick);

document.querySelector('#search').addEventListener(
  'input',
  (inputEvent) => {
    state.query = inputEvent.target.value;
    render();
  },
);

render();
