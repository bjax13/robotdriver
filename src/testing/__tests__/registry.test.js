import { testScenarios } from "../registry.js";
import { runScenario } from "../runScenario.js";

describe("engine test scenario registry", () => {
  it("every scenario passes runScenario", () => {
    for (const scenario of testScenarios) {
      const { result } = runScenario(scenario);
      expect(result).toEqual(
        expect.objectContaining({ ok: true })
      );
    }
  });
});
