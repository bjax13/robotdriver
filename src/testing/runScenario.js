/**
 * Headless scenario runner for the engine testing gallery.
 * @param {import('./scenarioTypes.js').EngineTestScenario} scenario
 * @returns {{ state: import('../engine/types').GameState, trace: { label: string, state: import('../engine/types').GameState }[], result: { ok: boolean, reason?: string } }}
 */
export function runScenario(scenario) {
  let state = scenario.buildState();
  /** @type { { label: string, state: import('../engine/types').GameState }[] } */
  const trace = [{ label: scenario.initialTraceLabel ?? "start", state }];
  for (const step of scenario.steps) {
    state = step.apply(state);
    trace.push({ label: step.label, state });
  }
  const result = scenario.assert(state);
  return { state, trace, result };
}

/**
 * @param {string} id
 * @param {import('./scenarioTypes.js').EngineTestScenario[]} list
 * @returns {import('./scenarioTypes.js').EngineTestScenario | undefined}
 */
export function getScenarioById(id, list) {
  return list.find((s) => s.id === id);
}
