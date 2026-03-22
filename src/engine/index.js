export { DIRECTIONS } from './types.js';
export { createBoard, inBounds, hasWall, wallKey, isConveyor } from './board.js';
export { stepForward, stepBackward, stepForwardWithPush, turn, directionDelta } from './movement.js';
export { sortRobotsByPriority, distanceToAntenna } from './priority.js';
export { toPixelCenter, boardToWallSegments } from './canvasAdapter.js';
export { applyMove, getOccupiedCells, createInitialState } from './gameState.js';
export { CARD_TYPES, cardToAction, DEFAULT_DECK } from './cards.js';
export { shuffle, draw, createDeck } from './deck.js';
export {
  dealHands,
  setProgram,
  activateRegister,
  activateRegisterWithEvents,
  activateRound,
  getLockedRegisterCount,
  getUnlockedRegisterCount,
  getHandDrawCount,
  MAX_DAMAGE,
} from './activation.js';
export { pickProgram } from './autoplay.js';
export { resolveConveyors, resolveGears, resolvePushPanels } from './boardElements.js';
export { raycast, listLaserHits, traceLaserPath } from './lasers.js';
export { isPit } from './board.js';
export { addDamage, rebootRobot, drawForSpam, SPAM_CARDS_PER_HIT } from './damage.js';
export { loadCourse, DIZZY_HIGHWAY } from './courses.js';
export { mulberry32 } from './random.js';
export { getTopStartSlots, slotToCell } from './startLine.js';
export { placeRandomCheckpoints, chooseInitialFacing } from './scenario.js';
