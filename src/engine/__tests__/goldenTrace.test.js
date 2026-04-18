import fs from 'fs';
import path from 'path';
import Ajv from 'ajv';
import { createBoard } from '../board.js';
import { createInitialState } from '../gameState.js';
import { activateRegisterWithEvents } from '../activation.js';
import { CARD_TYPES } from '../cards.js';
import { normalizeActivationEventsToGoldenV0 } from '../goldenTraceV0.js';

const fixturePath = path.join(__dirname, '../__fixtures__/golden/trace-v0-priority-laser.json');
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

describe('golden trace v0', () => {
  const ajv = new Ajv({ allErrors: true });
  /** @type {import('ajv').ValidateFunction} */
  let validate;

  beforeAll(() => {
    const schemaPath = path.join(__dirname, '../../../docs/golden-trace-v0.schema.json');
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    validate = ajv.compile(schema);
  });

  it('fixture validates against golden-trace-v0.schema.json', () => {
    const ok = validate(fixture);
    if (!ok) {
      // eslint-disable-next-line no-console
      console.error(validate.errors);
    }
    expect(ok).toBe(true);
  });

  it('maps unknown activation kinds to unknown_event without throwing', () => {
    const normalized = normalizeActivationEventsToGoldenV0([
      { kind: 'future_kind', registerIndex: 2 },
    ]);
    expect(normalized).toEqual([
      {
        step: 0,
        register: 2,
        type: 'unknown_event',
        payload: { kind: 'future_kind' },
      },
    ]);
  });

  it('replay matches normalized fixture events (priority + robot laser)', () => {
    let state = createInitialState({
      board: createBoard(6, 3),
      robots: [
        { col: 1, row: 1, direction: 90 },
        { col: 3, row: 1, direction: 0 },
      ],
      antenna: { col: 0, row: 0 },
    });
    const five = Array(5).fill(CARD_TYPES.POWER_UP);
    state = {
      ...state,
      robots: state.robots.map((r) => ({ ...r, registers: five, hand: [] })),
    };
    const { events } = activateRegisterWithEvents(state, 0);
    const normalized = normalizeActivationEventsToGoldenV0(events);
    expect(normalized).toEqual(fixture.events);
  });
});
