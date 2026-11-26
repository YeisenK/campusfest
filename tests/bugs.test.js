
// Pruebas de regresión de CampusFest.
// Ejecuta las pruebas contra las funciones reales de src/js/logic.js.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  countdownLabel,
  formatPrice,
  formatShortDate,
  isFull,
  matchesSearch,
  sortByDate,
  spotsLabel,
  spotsLeft,
} from '../src/js/logic.js';

const event = (overrides = {}) => ({
  id: 'x',
  title: 'Evento',
  venue: 'Aula',
  categoryLabel: 'Feria',
  date: '2026-11-26',
  capacity: 10,
  registered: 0,
  price: 0,
  ...overrides,
});

// BUG-0: Los cupos nunca son negativos.
test('[BUG-0] Los cupos nunca son negativos y un evento sobrevendido está lleno', () => {
  const sobrevendido = event({ capacity: 30, registered: 33 });

  assert.equal(spotsLeft(sobrevendido), 0);
  assert.equal(isFull(sobrevendido), true);
});

// BUG-1: Orden cronológico.
test('[BUG-1] Los eventos se ordenan por fecha real', () => {
  const ordenados = sortByDate([
    event({ id: 'posada', date: '2026-12-02' }),
    event({ id: 'hackathon', date: '2026-11-23' }),
    event({ id: 'feria', date: '2026-11-27' }),
  ]);

  assert.deepEqual(
    ordenados.map((e) => e.id),
    ['hackathon', 'feria', 'posada'],
  );
});

// BUG-2: Búsqueda sin distinción de acentos ni mayúsculas.
test('[BUG-2] La búsqueda ignora acentos y mayúsculas', () => {
  const brazo = event({
    title: 'Brazo robótico con Arduino',
    categoryLabel: 'Robótica',
  });

  assert.equal(matchesSearch(brazo, 'robotica'), true);
  assert.equal(matchesSearch(brazo, 'ROBÓTICO'), true);
});

// BUG-3: Formato de fecha.
test('[BUG-3] La fecha corta muestra el mes correcto', () => {
  assert.equal(formatShortDate('2026-11-24'), '24/11');
  assert.equal(formatShortDate('2026-12-02'), '02/12');
});

// BUG-4: Precio gratuito.
test('[BUG-4] Un evento sin costo dice Gratis', () => {
  assert.equal(formatPrice(0), 'Gratis');
  assert.equal(formatPrice(50), '$50');
});

// BUG-5: Singular y plural de cupos.
test('[BUG-5] La etiqueta de cupos utiliza singular y plural correctamente', () => {
  assert.equal(
    spotsLabel(event({ capacity: 120, registered: 119 })),
    '1 lugar',
  );

  assert.equal(
    spotsLabel(event({ capacity: 20, registered: 12 })),
    '8 lugares',
  );
});

// BUG-6: Eventos finalizados.
test('[BUG-6] Un evento que ya pasó dice Finalizado', () => {
  assert.equal(
    countdownLabel('2026-11-23', '2026-11-26'),
    'Finalizado',
  );

  assert.equal(
    countdownLabel('2026-11-30', '2026-11-26'),
    'Faltan 4 días',
  );
});

// BUG-7: Contraste WCAG.
test('[BUG-7] El texto secundario tiene contraste mínimo de 4.5:1', () => {
  const css = readFileSync(
    new URL('../src/css/styles.css', import.meta.url),
    'utf8',
  );

  const muted = css.match(/--text-muted:\s*(#[0-9a-fA-F]{6})/)?.[1];
  const surface = css.match(/--surface:\s*(#[0-9a-fA-F]{6})/)?.[1];

  assert.ok(muted && surface, 'No se encontraron los colores necesarios');

  const ratio = contrast(muted, surface);

  assert.ok(
    ratio >= 4.5,
    `El contraste es ${ratio.toFixed(2)}:1; necesita al menos 4.5:1`,
  );
});

// BUG-8: Fechas inexistentes.
test('[BUG-8] Las fechas imposibles deben rechazarse', () => {
  assert.throws(
    () => formatShortDate('2026-02-30'),
    RangeError,
  );

  assert.throws(
    () => formatShortDate('2026-02-29'),
    RangeError,
  );

  assert.throws(
    () => formatShortDate('2026-13-01'),
    RangeError,
  );

  // Año bisiesto válido.
  assert.equal(formatShortDate('2024-02-29'), '29/02');
});

// Calcula el contraste WCAG entre dos colores hexadecimales.
function contrast(a, b) {
  const luminance = (hex) => {
    const channels = [1, 3, 5].map((i) =>
      parseInt(hex.slice(i, i + 2), 16) / 255,
    );

    const [r, g, b2] = channels.map((c) =>
      c <= 0.04045
        ? c / 12.92
        : ((c + 0.055) / 1.055) ** 2.4,
    );

    return 0.2126 * r + 0.7152 * g + 0.0722 * b2;
  };

  const [light, dark] = [luminance(a), luminance(b)]
    .sort((x, y) => y - x);

  return (light + 0.05) / (dark + 0.05);
}
