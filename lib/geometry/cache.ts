import { buildBoard, type BoardGeometry } from "./board";

let board: BoardGeometry | null = null;

/** The motherboard geometry is built once and used by the board model. */
export const getBoard = (): BoardGeometry => {
  board ??= buildBoard();
  return board;
};
