import fs from 'fs';
import path from 'path';
import Ajv from 'ajv';
import { createBoard } from '../board.js';
import { createInitialState } from '../gameState.js';
import { activateRegisterWithEvents } from '../activation.js';
import { CARD_TYPES } from '../cards.js';
import { normalizeActivationEventsToGoldenV0 } from '../goldenTraceV0.js';

const fixturesDir = path.join(__dirname, '../__fixtures__/golden');
const fixturePriorityLaserPath = path.join(fixturesDir, 'trace-v0-priority-laser.json');
const fixtureMixPath = path.join(fixturesDir, 'trace-v0-mix-conveyor-laser-checkpoint.json');
const fixturePriorityLaser = JSON.parse(fs.readFileSync(fixturePriorityLaserPath, 'utf8'));
const fixtureMix = JSON.parse(fs.readFileSync(fixtureMixPath, 'utf8'));

describe('golden trace v0', () => {
  const ajv = new Ajv({ allErrors: true });
  /** @type {import('ajv').ValidateFunction} */
  let validate;

  beforeAll(() => {
    const schemaPath = path.join(__dirname, '../../../docs/golden-trace-v0.schema.json');
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    validate = ajv.compile(schema);
  });

  it.each([
    ['priority + robot laser', fixturePriorityLaser],
    ['conveyor + lasers + checkpoint', fixtureMix],
  ])('fixture %s validates against golden-trace-v0.schema.json', (_label, fx) => {
    const ok = validate(fx);
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
    expect(normalized).toEqual(fixturePriorityLaser.events);
  });

  it('replay matches normalized fixture events (conveyor chain, robot + wall lasers, checkpoint)', () => {
    const board = createBoard(
      8,
      5,
      [],
      [{ col: 7, row: 2, direction: 270 }]
    );
    board.conveyors = {
      '1,2': { direction: 90, express: true },
      '2,2': { direction: 90, express: true },
    };
    board.checkpoints = [{ col: 3, row: 2 }];
    let state = createInitialState({
      board,
      robots: [
        { col: 1, row: 2, direction: 90 },
        { col: 5, row: 2, direction: 180 },
      ],
      antenna: { col: 0, row: 0 },
    });
    const five = Array(5).fill(CARD_TYPES.POWER_UP);
    state = {
      ...state,
      robots: state.robots.map((r) => ({ ...r, registers: five, hand: [] })),
    };
    const { state: after, events } = activateRegisterWithEvents(state, 0);
    const normalized = normalizeActivationEventsToGoldenV0(events);
    expect(normalized).toEqual(fixtureMix.events);
    const r1 = after.robots.find((r) => r.id === 'r1');
    expect(r1?.col).toBe(3);
    expect(r1?.row).toBe(2);
    expect(r1?.nextCheckpoint).toBe(1);
  });
});
