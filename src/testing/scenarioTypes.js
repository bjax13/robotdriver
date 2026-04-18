/**
 * JSDoc types for engine test scenarios (no runtime).
 * @typedef {import('../engine/types').GameState} GameState
 * @typedef {{ label: string, apply: (s: GameState) => GameState }} ScenarioStep
 * @typedef {Object} EngineTestScenario
 * @property {string} id
 * @property {string} title
 * @property {string} module
 * @property {string} description
 * @property {string[]} parityIds
 * @property {string} testEvidence - path to Jest file in repo, e.g. src/engine/__tests__/foo.test.js
 * @property {() => GameState} buildState
 * @property {ScenarioStep[]} steps
 * @property {(s: GameState) => { ok: boolean, reason?: string }} assert
 */

export {};
