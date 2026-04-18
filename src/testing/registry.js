import { movementWallsBlock } from "./scenarios/movementWallsBlock.js";
import { pushChain } from "./scenarios/pushChain.js";
import { priorityTieBreak } from "./scenarios/priorityTieBreak.js";
import { conveyorExpressTwo } from "./scenarios/conveyorExpressTwo.js";
import { conveyorNormalOne } from "./scenarios/conveyorNormalOne.js";
import { gearRotateLeft } from "./scenarios/gearRotateLeft.js";
import { pushPanelRegisterGate } from "./scenarios/pushPanelRegisterGate.js";
import { laserWallBlock } from "./scenarios/laserWallBlock.js";
import { pitFallSpawn } from "./scenarios/pitFallSpawn.js";
import { checkpointSequence } from "./scenarios/checkpointSequence.js";

/** @type {import('./scenarioTypes.js').EngineTestScenario[]} */
export const testScenarios = [
  movementWallsBlock,
  pushChain,
  priorityTieBreak,
  conveyorExpressTwo,
  conveyorNormalOne,
  gearRotateLeft,
  pushPanelRegisterGate,
  laserWallBlock,
  pitFallSpawn,
  checkpointSequence,
];
