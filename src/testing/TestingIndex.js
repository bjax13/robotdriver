import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { testScenarios } from "./registry.js";
import { runScenario } from "./runScenario.js";

export default function TestingIndex() {
  const rows = useMemo(() => {
    return testScenarios.map((scenario) => {
      const { result } = runScenario(scenario);
      return { scenario, result };
    });
  }, []);

  const passCount = rows.filter((r) => r.result.ok).length;
  const total = rows.length;

  return (
    <div style={{ padding: "16px 24px", maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ marginTop: 0 }}>Engine rule tests</h1>
      <p style={{ color: "#475569", marginBottom: 24 }}>
        Headless assertions against the same scenarios as these visual pages. Rows update from{" "}
        <code>runScenario</code> on load.
      </p>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 14,
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <thead>
          <tr style={{ background: "#f8fafc", textAlign: "left" }}>
            <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>Parity IDs</th>
            <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>Title</th>
            <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>Module</th>
            <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>Status</th>
            <th style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }} />
          </tr>
        </thead>
        <tbody>
          {rows.map(({ scenario, result }) => (
            <tr key={scenario.id}>
              <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", verticalAlign: "top" }}>
                <code style={{ fontSize: 12 }}>{scenario.parityIds.join(", ")}</code>
              </td>
              <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9" }}>{scenario.title}</td>
              <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", color: "#64748b" }}>
                {scenario.module}
              </td>
              <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9" }}>
                <span
                  style={{
                    fontWeight: 700,
                    color: result.ok ? "#15803d" : "#b91c1c",
                  }}
                >
                  {result.ok ? "PASS" : "FAIL"}
                </span>
                {!result.ok && result.reason && (
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{result.reason}</div>
                )}
              </td>
              <td style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>
                <Link to={`/testing/${scenario.id}`}>Open</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ marginTop: 16, fontWeight: 600, color: "#0f172a" }}>
        Summary: {passCount} / {total} passing
      </p>
    </div>
  );
}
