/**
 * Pure validation for course fixtures (JSON-shaped objects consumed by {@link loadCourse}).
 */

const VALID_EDGES = /** @type {const} */ (['N', 'E', 'S', 'W']);
const EDGE_SET = new Set(VALID_EDGES);
const VALID_DIRECTIONS = /** @type {const} */ ([0, 90, 180, 270]);
const DIR_SET = new Set(VALID_DIRECTIONS);

const MIN_DIM = 1;
const MAX_DIM = 99;

export class CourseValidationError extends Error {
  /**
   * @param {string[]} errors
   */
  constructor(errors) {
    const msg = errors.length === 1 ? errors[0] : `Course validation failed:\n${errors.join('\n')}`;
    super(msg);
    this.name = 'CourseValidationError';
    /** @type {string[]} */
    this.errors = [...errors];
  }
}

/**
 * @param {unknown} n
 * @returns {boolean}
 */
function isPositiveIntDim(n) {
  return typeof n === 'number' && Number.isInteger(n) && n >= MIN_DIM && n <= MAX_DIM;
}

/**
 * @param {{ width: number, height: number }} dims
 * @param {unknown} col
 * @param {unknown} row
 * @returns {boolean}
 */
function cellInBounds(dims, col, row) {
  return (
    typeof col === 'number' &&
    typeof row === 'number' &&
    Number.isInteger(col) &&
    Number.isInteger(row) &&
    col >= 0 &&
    col < dims.width &&
    row >= 0 &&
    row < dims.height
  );
}

/**
 * @param {unknown} course
 * @returns {{ ok: true } | { ok: false, errors: string[] }}
 */
export function validateCourse(course) {
  /** @type {string[]} */
  const errors = [];

  if (course === null || course === undefined) {
    errors.push('course: expected object, got ' + course);
    return { ok: false, errors };
  }

  if (typeof course !== 'object' || Array.isArray(course)) {
    errors.push(`course: expected plain object, got ${typeof course}`);
    return { ok: false, errors };
  }

  const c = /** @type {Record<string, unknown>} */ (course);

  if (!('width' in c)) {
    errors.push('width: required');
  }
  if (!('height' in c)) {
    errors.push('height: required');
  }

  if (!isPositiveIntDim(c.width)) {
    errors.push(
      `width: expected integer ${MIN_DIM}..${MAX_DIM}, got ${JSON.stringify(c.width)}`
    );
  }
  if (!isPositiveIntDim(c.height)) {
    errors.push(
      `height: expected integer ${MIN_DIM}..${MAX_DIM}, got ${JSON.stringify(c.height)}`
    );
  }

  if (!isPositiveIntDim(c.width) || !isPositiveIntDim(c.height)) {
    return { ok: false, errors };
  }

  const dims = { width: /** @type {number} */ (c.width), height: /** @type {number} */ (c.height) };

  /**
   * @param {unknown} arr
   * @param {string} key
   * @returns {unknown[] | null}
   */
  function reqArray(arr, key) {
    if (arr === undefined || arr === null) return [];
    if (!Array.isArray(arr)) {
      errors.push(`${key}: expected array`);
      return null;
    }
    return arr;
  }

  const walls = reqArray(c.walls, 'walls');
  if (walls === null) return { ok: false, errors };

  walls.forEach((item, i) => {
    const prefix = `walls[${i}]`;
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      errors.push(`${prefix}: expected object`);
      return;
    }
    const w = /** @type {Record<string, unknown>} */ (item);
    const { col, row, edge } = w;
    if (!cellInBounds(dims, col, row)) {
      errors.push(`${prefix} col/row: out of bounds for ${dims.width}x${dims.height}`);
    }
    if (!EDGE_SET.has(/** @type {string} */ (edge))) {
      errors.push(`${prefix}.edge: expected one of ${VALID_EDGES.join(',')}, got ${JSON.stringify(edge)}`);
    }
  });

  const conveyors = reqArray(c.conveyors, 'conveyors');
  if (conveyors === null) return { ok: false, errors };
  conveyors.forEach((item, i) => {
    const prefix = `conveyors[${i}]`;
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      errors.push(`${prefix}: expected object`);
      return;
    }
    const x = /** @type {Record<string, unknown>} */ (item);
    if (!cellInBounds(dims, x.col, x.row)) {
      errors.push(`${prefix} col/row: out of bounds for ${dims.width}x${dims.height}`);
    }
    if (!DIR_SET.has(/** @type {number} */ (x.direction))) {
      errors.push(
        `${prefix}.direction: expected one of ${[...DIR_SET].join(',')}, got ${JSON.stringify(x.direction)}`
      );
    }
    if (x.express !== undefined && typeof x.express !== 'boolean') {
      errors.push(`${prefix}.express: expected boolean, got ${typeof x.express}`);
    }
  });

  const gears = reqArray(c.gears, 'gears');
  if (gears === null) return { ok: false, errors };
  gears.forEach((item, i) => {
    const prefix = `gears[${i}]`;
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      errors.push(`${prefix}: expected object`);
      return;
    }
    const x = /** @type {Record<string, unknown>} */ (item);
    if (!cellInBounds(dims, x.col, x.row)) {
      errors.push(`${prefix} col/row: out of bounds for ${dims.width}x${dims.height}`);
    }
    if (x.type !== 'L' && x.type !== 'R') {
      errors.push(`${prefix}.type: expected "L" or "R", got ${JSON.stringify(x.type)}`);
    }
  });

  const checkpoints = reqArray(c.checkpoints, 'checkpoints');
  if (checkpoints === null) return { ok: false, errors };
  checkpoints.forEach((item, i) => {
    const prefix = `checkpoints[${i}]`;
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      errors.push(`${prefix}: expected object`);
      return;
    }
    const x = /** @type {Record<string, unknown>} */ (item);
    if (!cellInBounds(dims, x.col, x.row)) {
      errors.push(`${prefix} col/row: out of bounds for ${dims.width}x${dims.height}`);
    }
  });

  const pits = reqArray(c.pits, 'pits');
  if (pits === null) return { ok: false, errors };
  pits.forEach((item, i) => {
    const prefix = `pits[${i}]`;
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      errors.push(`${prefix}: expected object`);
      return;
    }
    const x = /** @type {Record<string, unknown>} */ (item);
    if (!cellInBounds(dims, x.col, x.row)) {
      errors.push(`${prefix} col/row: out of bounds for ${dims.width}x${dims.height}`);
    }
  });

  const reboot = reqArray(c.reboot, 'reboot');
  if (reboot === null) return { ok: false, errors };
  reboot.forEach((item, i) => {
    const prefix = `reboot[${i}]`;
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      errors.push(`${prefix}: expected object`);
      return;
    }
    const x = /** @type {Record<string, unknown>} */ (item);
    if (!cellInBounds(dims, x.col, x.row)) {
      errors.push(`${prefix} col/row: out of bounds for ${dims.width}x${dims.height}`);
    }
  });

  const boardLasers = reqArray(c.boardLasers, 'boardLasers');
  if (boardLasers === null) return { ok: false, errors };
  boardLasers.forEach((item, i) => {
    const prefix = `boardLasers[${i}]`;
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      errors.push(`${prefix}: expected object`);
      return;
    }
    const x = /** @type {Record<string, unknown>} */ (item);
    if (!cellInBounds(dims, x.col, x.row)) {
      errors.push(`${prefix} col/row: out of bounds for ${dims.width}x${dims.height}`);
    }
    if (!DIR_SET.has(/** @type {number} */ (x.direction))) {
      errors.push(
        `${prefix}.direction: expected one of ${[...DIR_SET].join(',')}, got ${JSON.stringify(x.direction)}`
      );
    }
  });

  /** Optional overrides validated when present */
  if (c.antenna !== undefined && c.antenna !== null) {
    if (typeof c.antenna !== 'object' || Array.isArray(c.antenna)) {
      errors.push('antenna: expected object');
    } else {
      const a = /** @type {Record<string, unknown>} */ (c.antenna);
      if (!cellInBounds(dims, a.col, a.row)) {
        errors.push(`antenna col/row: out of bounds for ${dims.width}x${dims.height}`);
      }
    }
  }

  if (c.antennaDirection !== undefined && !DIR_SET.has(/** @type {number} */ (c.antennaDirection))) {
    errors.push(
      `antennaDirection: expected one of ${[...DIR_SET].join(',')}, got ${JSON.stringify(c.antennaDirection)}`
    );
  }

  if (c.robotDeckSeedBase !== undefined) {
    const s = c.robotDeckSeedBase;
    if (typeof s !== 'number' || !Number.isInteger(s) || s < 0) {
      errors.push(`robotDeckSeedBase: expected non-negative integer, got ${JSON.stringify(s)}`);
    }
  }

  if (c.robots !== undefined && c.robots !== null) {
    if (!Array.isArray(c.robots)) {
      errors.push('robots: expected array');
    } else {
      c.robots.forEach((item, i) => {
        const prefix = `robots[${i}]`;
        if (typeof item !== 'object' || item === null || Array.isArray(item)) {
          errors.push(`${prefix}: expected object`);
          return;
        }
        const x = /** @type {Record<string, unknown>} */ (item);
        if (!cellInBounds(dims, x.col, x.row)) {
          errors.push(`${prefix} col/row: out of bounds for ${dims.width}x${dims.height}`);
        }
        if (x.direction !== undefined && !DIR_SET.has(/** @type {number} */ (x.direction))) {
          errors.push(
            `${prefix}.direction: expected one of ${[...DIR_SET].join(',')}, got ${JSON.stringify(x.direction)}`
          );
        }
      });
    }
  }

  if (errors.length === 0) return { ok: true };
  return { ok: false, errors };
}
