import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { testScenarios } from "./registry.js";
import { runScenario } from "./runScenario.js";

const pageWrap = { padding: "16px 24px", maxWidth: 1100, margin: "0 auto" };
const tableWrap = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 14,
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  overflow: "hidden",
};
const thBase = {
  padding: "10px 12px",
  borderBottom: "1px solid #e2e8f0",
  background: "#f8fafc",
  textAlign: "left",
  fontWeight: 600,
  color: "#334155",
};
const tdBase = {
  padding: "10px 12px",
  borderBottom: "1px solid #f1f5f9",
  verticalAlign: "top",
};
const sortBtn = {
  border: "none",
  background: "transparent",
  font: "inherit",
  fontWeight: 600,
  color: "inherit",
  cursor: "pointer",
  padding: 0,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};
const sortHint = { opacity: 0.45, fontSize: 12 };

const columnHelper = createColumnHelper();

export default function TestingIndex() {
  const data = useMemo(() => {
    return testScenarios.map((scenario) => {
      const { result } = runScenario(scenario);
      return { scenario, result };
    });
  }, []);

  const columns = useMemo(
    () => [
      columnHelper.accessor((row) => row.scenario.parityIds.join(", "), {
        id: "parityIds",
        header: "Parity IDs",
        sortingFn: "alphanumeric",
        cell: (info) => (
          <code style={{ fontSize: 12 }}>{info.getValue()}</code>
        ),
      }),
      columnHelper.accessor((row) => row.scenario.title, {
        id: "title",
        header: "Title",
        sortingFn: "alphanumeric",
      }),
      columnHelper.accessor((row) => row.scenario.module, {
        id: "module",
        header: "Module",
        sortingFn: "alphanumeric",
        cell: (info) => (
          <span style={{ color: "#64748b" }}>{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor((row) => row.result.ok, {
        id: "status",
        header: "Status",
        sortingFn: (rowA, rowB) => {
          const a = rowA.original.result.ok ? 1 : 0;
          const b = rowB.original.result.ok ? 1 : 0;
          return a - b;
        },
        cell: ({ row }) => {
          const { result } = row.original;
          return (
            <>
              <span
                style={{
                  fontWeight: 700,
                  color: result.ok ? "#15803d" : "#b91c1c",
                }}
              >
                {result.ok ? "PASS" : "FAIL"}
              </span>
              {!result.ok && result.reason && (
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                  {result.reason}
                </div>
              )}
            </>
          );
        },
      }),
      columnHelper.display({
        id: "open",
        header: "",
        enableSorting: false,
        meta: { narrow: true },
        cell: ({ row }) => (
          <Link to={`/testing/${row.original.scenario.id}`}>Open</Link>
        ),
      }),
    ],
    [],
  );

  const [sorting, setSorting] = useState([{ id: "module", desc: false }]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const passCount = data.filter((r) => r.result.ok).length;
  const total = data.length;

  return (
    <div style={pageWrap}>
      <h1 style={{ marginTop: 0 }}>Engine rule tests</h1>
      <p style={{ color: "#475569", marginBottom: 16 }}>
        Headless assertions against the same scenarios as these visual pages. Rows update from{" "}
        <code>runScenario</code> on load. Click column headers to sort.
      </p>
      <p
        style={{
          marginBottom: 20,
          padding: "10px 14px",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          fontWeight: 600,
          color: "#0f172a",
        }}
      >
        Summary: {passCount} / {total} passing
      </p>
      <table style={tableWrap}>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  scope="col"
                  aria-sort={
                    header.column.getCanSort()
                      ? header.column.getIsSorted() === "asc"
                        ? "ascending"
                        : header.column.getIsSorted() === "desc"
                          ? "descending"
                          : "none"
                      : undefined
                  }
                  style={{
                    ...thBase,
                    width: header.column.columnDef.meta?.narrow ? "1%" : undefined,
                    whiteSpace: header.column.columnDef.meta?.narrow ? "nowrap" : undefined,
                  }}
                >
                  {header.isPlaceholder ? null : header.column.getCanSort() ? (
                    <button
                      type="button"
                      style={sortBtn}
                      onClick={header.column.getToggleSortingHandler()}
                      aria-label={`Sort by ${typeof header.column.columnDef.header === "string" ? header.column.columnDef.header : "column"}`}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <span style={sortHint} aria-hidden>
                        {{
                          asc: "▲",
                          desc: "▼",
                        }[header.column.getIsSorted()] ?? "⇅"}
                      </span>
                    </button>
                  ) : (
                    flexRender(header.column.columnDef.header, header.getContext())
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  style={{
                    ...tdBase,
                    whiteSpace: cell.column.id === "open" ? "nowrap" : undefined,
                  }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
