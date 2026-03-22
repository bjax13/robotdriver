/**
 * Top-row start line: even columns 0, 2, 4, … numbered 1, 2, 3, …
 */

/**
 * @param {import('./types').Board} board
 * @returns {{ col: number, row: number, slot: number }[]}
 */
export function getTopStartSlots(board) {
  const slots = [];
  for (let col = 0; col < board.width; col += 2) {
    slots.push({ col, row: 0, slot: col / 2 + 1 });
  }
  return slots;
}

/**
 * @param {import('./types').Board} board
 * @param {number} slot - 1-based
 * @returns {{ col: number, row: number } | null}
 */
export function slotToCell(board, slot) {
  if (slot < 1) return null;
  const col = (slot - 1) * 2;
  if (col >= board.width) return null;
  return { col, row: 0 };
}
