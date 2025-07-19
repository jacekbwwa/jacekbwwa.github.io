"use strict";

/* author Jacek Byzdra https://www.linkedin.com/in/jacek-byzdra/ */

const boardSize = 8;

const PIECES = {
  RED: "red",
  WHITE: "white-piece",
  RED_KING: "red-king",
  WHITE_KING: "white-king"
};

const MAX_DEPTH = 4;

const initialBoard = [
  [null, PIECES.RED, null, PIECES.RED, null, PIECES.RED, null, PIECES.RED],
  [PIECES.RED, null, PIECES.RED, null, PIECES.RED, null, PIECES.RED, null],
  [null, PIECES.RED, null, PIECES.RED, null, PIECES.RED, null, PIECES.RED],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [PIECES.WHITE, null, PIECES.WHITE, null, PIECES.WHITE, null, PIECES.WHITE, null],
  [null, PIECES.WHITE, null, PIECES.WHITE, null, PIECES.WHITE, null, PIECES.WHITE],
  [PIECES.WHITE, null, PIECES.WHITE, null, PIECES.WHITE, null, PIECES.WHITE, null]
];


let board = [];
let currentPlayer = PIECES.WHITE;
let selected = null;
let highlightedSquares = [];
let multiJumpInProgress = null;

let capturedCount = { red: 0, white: 0 };

const boardContainer = document.getElementById("board");
const messageEl = document.getElementById("message");
const resetBtn = document.getElementById("reset");

const scoreboardEl = document.getElementById("scoreboard");


const deepCloneBoard = (board) => board.map((row) => [...row]);

const isRed = (piece) => piece === PIECES.RED || piece === PIECES.RED_KING;
const isWhite = (piece) => piece === PIECES.WHITE || piece === PIECES.WHITE_KING;
const isKing = (piece) => piece === PIECES.RED_KING || piece === PIECES.WHITE_KING;

const isOpponent = (p1, p2) => {
  if (!p1 || !p2) return false;
  return (isRed(p1) && isWhite(p2)) || (isWhite(p1) && isRed(p2));
};

const isInBounds = (row, col) => row >= 0 && row < boardSize && col >= 0 && col < boardSize;

const clearHighlight = () => {
  highlightedSquares.forEach(({ row, col }) => {
    const sq = squareAt(row, col);
    if (sq) sq.classList.remove("highlight");
  });
  highlightedSquares = [];
};

const highlightSquare = (row, col) => {
  const sq = squareAt(row, col);
  if (!sq) return;
  sq.classList.add("highlight");
  highlightedSquares.push({ row, col });
};

const squareAt = (row, col) => boardContainer.querySelector(`.square[data-row="${row}"][data-col="${col}"]`);


const addAriaToSquares = () => {
  const squares = boardContainer.querySelectorAll(".square");
  squares.forEach((square) => {
    square.setAttribute("role", "gridcell");
    square.setAttribute(
      "aria-label",
      `Square row ${parseInt(square.dataset.row) + 1} column ${parseInt(square.dataset.col) + 1}`
    );
  });
};

const init = () => {
  board = deepCloneBoard(initialBoard);
  currentPlayer = PIECES.WHITE;
  selected = null;
  multiJumpInProgress = null;
  capturedCount = { red: 0, white: 0 };
  renderBoard();
  updateMessage();
  clearHighlight();

  updateScoreboard();

  if (currentPlayer === PIECES.RED) {
    setTimeout(aiMove, 300);
  }
};


const renderBoard = () => {
  boardContainer.innerHTML = "";
  boardContainer.style.gridTemplateColumns = `repeat(${boardSize}, 1fr)`;
  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      const square = document.createElement("div");
      square.classList.add("square");
      square.dataset.row = r;
      square.dataset.col = c;
      if ((parseInt(r) + parseInt(c)) % 2 === 0) {
        square.classList.add("white");
      } else {
        square.classList.add("black");
        if (currentPlayer === PIECES.WHITE) {
          square.addEventListener("click", onSquareClick);
        }
      }

      const piece = board[r][c];
      if (piece) {
        const pieceEl = document.createElement("div");
        pieceEl.classList.add("piece");
        if (piece === PIECES.RED || piece === PIECES.RED_KING) pieceEl.classList.add("red");
        else pieceEl.classList.add("white-piece");

        if (isKing(piece)) pieceEl.classList.add("king");

        if (currentPlayer === PIECES.WHITE) {
        pieceEl.addEventListener("click", onPieceClick);
        pieceEl.tabIndex = 0; 
        pieceEl.setAttribute("role", "button");
        pieceEl.setAttribute(
          "aria-label",
          `${isRed(piece) ? "Red" : "White"}${isKing(piece) ? " king" : ""} piece at row ${r + 1} column ${c + 1}`
        );
        pieceEl.addEventListener("keydown", (e) => {

          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onPieceClick(e);
          }
        });
           }
        square.appendChild(pieceEl);
      }

      boardContainer.appendChild(square);
    }
  }
  addAriaToSquares();
};


const onPieceClick = (evt) => {
  evt.stopPropagation();
  if (currentPlayer === PIECES.RED) return; 
  const sq = evt.target.parentElement;
  const row = Number(sq.dataset.row);
  const col = Number(sq.dataset.col);
  if (isCurrentPlayerPiece(row, col)) {
    selectPiece(row, col);
  }
};

const onSquareClick = (evt) => {
  if (currentPlayer === PIECES.RED) return; 
  const sq = evt.currentTarget;
  const row = Number(sq.dataset.row);
  const col = Number(sq.dataset.col);
  if (selected) moveSelectedPiece(row, col);
};

const isCurrentPlayerPiece = (row, col) => {
  const p = board[row][col];
  return currentPlayer === PIECES.RED ? isRed(p) : isWhite(p);
};

const selectPiece = (row, col) => {
  clearHighlight();
  selected = { row, col };
  highlightMoves(row, col);
};


const moveSelectedPiece = (toRow, toCol) => {
  if (!selected) return;
  if (!highlightedSquares.some((sq) => sq.row === toRow && sq.col === toCol)) return;

  const fromRow = selected.row;
  const fromCol = selected.col;
  const piece = board[fromRow][fromCol];


  const jumpPath = getJumpPath(fromRow, fromCol, toRow, toCol, piece);

  if (!jumpPath) {

    board[toRow][toCol] = piece;
    board[fromRow][fromCol] = null;
    maybeCrownKing(toRow, toCol);

    selected = null;
    multiJumpInProgress = null;
    clearHighlight();
    swapPlayerAndRender();
    return;
  }


  board[toRow][toCol] = piece;
  board[fromRow][fromCol] = null;

  jumpPath.forEach((pos) => {
    board[pos.row][pos.col] = null;
    if (isRed(piece)) capturedCount.white++;
    else if (isWhite(piece)) capturedCount.red++;
  });
  maybeCrownKing(toRow, toCol);


  const jumpedPositionsSet = multiJumpInProgress ? new Set(multiJumpInProgress.jumpedPositions) : new Set();

  jumpPath.forEach((jp) => jumpedPositionsSet.add(`${jp.row},${jp.col}`));

  selected = { row: toRow, col: toCol };
  multiJumpInProgress = {
    row: toRow,
    col: toCol,
    piece,
    jumpedPositions: jumpedPositionsSet
  };

  clearHighlight();


  const furtherJumps = isKing(piece)
    ? findKingJumpsMulti(board, toRow, toCol, piece, jumpedPositionsSet)
    : findPossibleJumps(toRow, toCol, piece, jumpedPositionsSet);

  if (furtherJumps.length > 0) highlightMultiJumpPaths(furtherJumps);

  else {

    multiJumpInProgress = null;
    selected = null;
    updateScoreboard();
    swapPlayerAndRender();
  }
};


const highlightMultiJumpPaths = (jumpMoves) => {
  clearHighlight();
  jumpMoves.forEach((jump) => highlightSquare(jump.to.row, jump.to.col));
};

const swapPlayerAndRender = () => {
  currentPlayer = currentPlayer === PIECES.RED ? PIECES.WHITE : PIECES.RED;
  renderBoard();
  updateMessage();
  clearHighlight();
  selected = null;

  updateScoreboard();

  if (currentPlayer === PIECES.RED) {
    setTimeout(aiMove, 300);
  }
  checkGameOver();
};

const updateMessage = () => {
  messageEl.innerText = `${currentPlayer === PIECES.RED ? "Red" : "White"}'s turn`;
};

const updateScoreboard = () => {
  scoreboardEl.textContent = `Red Captured: ${capturedCount.red} | White Captured: ${capturedCount.white}`;
};

const maybeCrownKing = (row, col) => {
  if (currentPlayer === PIECES.RED && row === boardSize - 1 && board[row][col] === PIECES.RED) {
    board[row][col] = PIECES.RED_KING;
  }
  if (currentPlayer === PIECES.WHITE && row === 0 && board[row][col] === PIECES.WHITE) {
    board[row][col] = PIECES.WHITE_KING;
  }
};



const findPossibleJumps = (row, col, piece, jumpedPositions) => {
  const jumps = [];
  const directions = isKing(piece)
    ? [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1]
      ]
    : isRed(piece)
      ? [
          [1, -1],
          [1, 1]
        ]
      : [
          [-1, -1],
          [-1, 1]
        ];

  for (const [dr, dc] of directions) {
    const midRow = parseInt(row) + parseInt(dr);
    const midCol = parseInt(col) + parseInt(dc);
    const jumpRow = parseInt(row) + parseInt(dr) * 2;
    const jumpCol = parseInt(col) + parseInt(dc) * 2;

    if (!isInBounds(jumpRow, jumpCol)) continue;

    const midPiece = board[midRow]?.[midCol];
    if (
      midPiece &&
      isOpponent(piece, midPiece) &&
      !jumpedPositions.has(`${midRow},${midCol}`) &&
      board[jumpRow][jumpCol] === null
    ) {
      jumps.push({
        from: { row, col },
        over: { row: midRow, col: midCol },
        to: { row: jumpRow, col: jumpCol }
      });
    }
  }

  return jumps;
};


const findKingJumpsMulti = (boardState, row, col, piece, jumpedPositions = new Set(), origin = null) => {
  const results = [];

  const directions = [
    [1, 1],
    [1, -1],
    [-1, -1],
    [-1, 1]
  ];

  origin ??= { row, col };


  for (const [dr, dc] of directions) {
    let r = parseInt(row) + parseInt(dr);
    let c = parseInt(col) + parseInt(dc);
    let opponentFound = null;

    while (isInBounds(r, c)) {
      if (boardState[r][c] === null) {
        r = parseInt(r) + parseInt(dr);
        c = parseInt(c) + parseInt(dc);
        continue;
      }
      if (isOpponent(piece, boardState[r][c]) && !jumpedPositions.has(`${r},${c}`) && !opponentFound) {
        opponentFound = { row: r, col: c };
        r = parseInt(r) + parseInt(dr);
        c = parseInt(c) + parseInt(dc);

        while (isInBounds(r, c) && boardState[r][c] === null) {

          const newJumped = new Set(jumpedPositions);
          newJumped.add(`${opponentFound.row},${opponentFound.col}`);


          const furtherJumps = findKingJumpsMulti(boardState, r, c, piece, newJumped, origin);
          if (furtherJumps.length > 0) {

            for (const fjump of furtherJumps) {
              results.push({
                from: { row: origin.row, col: origin.col },
                to: fjump.to,
                jumped: [{ row: opponentFound.row, col: opponentFound.col }, ...fjump.jumped]
              });
            }
          } else {

            results.push({
              from: { row: origin.row, col: origin.col },
              to: { row: r, col: c },
              jumped: [{ row: opponentFound.row, col: opponentFound.col }]
            });
          }
          r = parseInt(r) + parseInt(dr);
          c = parseInt(c) + parseInt(dc);
        }
        break; 
      } else {
        break;
      }
    }
  }
  return results;
};

const findStraightLineMoves = (row, col, piece) => {
  const directions = [
    [1, 1],
    [1, -1],
    [-1, -1],
    [-1, 1]
  ];

  const moves = [];
  for (const [dr, dc] of directions) {
    let r = parseInt(row) + parseInt(dr);
    let c = parseInt(col) + parseInt(dc);
    while (isInBounds(r, c) && !board[r][c]) {
      moves.push({ row: r, col: c });
      r = parseInt(r) + parseInt(dr);
      c = parseInt(c) + parseInt(dc);
    }
  }
  return moves;
};

const highlightMoves = (row, col) => {
  clearHighlight();
  const piece = board[row][col];
  if (!isKing(piece)) {
    highlightSimpleMoves(row, col, piece);
    return;
  }
  const jumpPaths = findKingJumpsMulti(board, row, col, piece, new Set());
  if (!jumpPaths.length) {
    findStraightLineMoves(row, col, piece).forEach(({ row, col }) => highlightSquare(row, col));
  } else {
    jumpPaths.forEach((jump) => highlightSquare(jump.to.row, jump.to.col));
  }
};

const highlightSimpleMoves = (row, col, piece) => {
  const directions = isRed(piece)
    ? [
        [1, -1],
        [1, 1]
      ]
    : [
        [-1, -1],
        [-1, 1]
      ];
  const moves = [];
  const jumps = [];

  for (const [dr, dc] of directions) {
    const nr = parseInt(row) + parseInt(dr);
    const nc = parseInt(col) + parseInt(dc);

    if (isInBounds(nr, nc) && !board[nr][nc]) {
      moves.push({ row: nr, col: nc });
    }

    const jr = parseInt(row) + 2 * parseInt(dr);
    const jc = parseInt(col) + 2 * parseInt(dc);
    if (isInBounds(jr, jc) && !board[jr][jc] && board[nr][nc] && isOpponent(board[nr][nc], piece)) {
      jumps.push({ row: jr, col: jc });
    }
  }
  const toHighlight = jumps.length ? jumps : moves;
  toHighlight.forEach(({ row, col }) => highlightSquare(row, col));
};

const getJumpPath = (fr, fc, tr, tc, piece) => {
  const rowDiff = parseInt(tr) - parseInt(fr);
  const colDiff = parseInt(tc) - parseInt(fc);

  if (Math.abs(rowDiff) <= 1 && Math.abs(colDiff) <= 1) return null;

  if (!isKing(piece)) {
    if (Math.abs(rowDiff) !== 2 || Math.abs(colDiff) !== 2) return null;
    const jumpedRow = parseInt(fr) + parseInt(rowDiff) / 2;
    const jumpedCol = parseInt(fc) + parseInt(colDiff) / 2;

    if (board[jumpedRow][jumpedCol] && isOpponent(board[jumpedRow][jumpedCol], piece)) {
      return [{ row: jumpedRow, col: jumpedCol }];
    }
    return null;
  }


  let dr = rowDiff > 0 ? 1 : -1;
  let dc = colDiff > 0 ? 1 : -1;
  let r = parseInt(fr) + parseInt(dr);
  let c = parseInt(fc) + parseInt(dc);

  const jumped = [];

  while (r !== tr && c !== tc) {
    if (board[r][c]) {
      if (isOpponent(board[r][c], piece)) {

        jumped.push({ row: r, col: c });

      } else {
        return null;
      }
    }
    r = parseInt(r) + parseInt(dr);
    c = parseInt(c) + parseInt(dc);
  }

  return jumped.length === 1 ? jumped : null;
};



const performMove = (move, player) => {
  if (!move) return;
  board = applyMultiJumpMove(board, move);
  maybeCrownKing(move.to.row, move.to.col);

  swapPlayerAndRender();
};


const aiMove = () => {
  const aiPlayer = PIECES.RED;

  const best = minimaxRoot(board, MAX_DEPTH, aiPlayer);
  if (!best) {
    messageEl.innerText = "White wins! (AI has no moves)";

    return;
  }
  if (best.jumped && best.jumped.length > 0) {
    for (let i = 0; i < best.jumped.length; i++) {
      capturedCount.white++;
    }
  }
  performMove(best, aiPlayer);

  updateMessage();
  renderBoard();
  checkGameOver();
};


const minimaxRoot = (boardState, depth, aiPlayer) => {
  const moves = generateAllMovesMultiJump(boardState, aiPlayer);
  if (!moves.length) return null;
  let bestScore = -Infinity;
  let bestMove = null;

  for (const move of moves) {
    const newBoard = applyMultiJumpMove(boardState, move);
    const score = minimax(newBoard, parseInt(depth) - 1, -Infinity, Infinity, false);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  return bestMove;
};

const minimax = (boardState, depth, alpha, beta, maximizingPlayer) => {
  if (depth === 0) return evaluateBoard(boardState);
  const player = maximizingPlayer ? PIECES.RED : PIECES.WHITE;
  const moves = generateAllMovesMultiJump(boardState, player);
  if (!moves.length) return maximizingPlayer ? -Infinity : Infinity;

  if (maximizingPlayer) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const newBoard = applyMultiJumpMove(boardState, move);
      const evalScore = minimax(newBoard, parseInt(depth) - 1, alpha, beta, false);
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const newBoard = applyMultiJumpMove(boardState, move);
      const evalScore = minimax(newBoard, parseInt(depth) - 1, alpha, beta, true);
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
};

const evaluateBoard = (boardState) => {
  let score = 0;
  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      const p = boardState[r][c];
      if (!p) continue;
      if (p === PIECES.WHITE) score -= 1;
      else if (p === PIECES.WHITE_KING) score -= 1.5;
      else if (p === PIECES.RED) score += 1;
      else if (p === PIECES.RED_KING) score += 1.5;
    }
  }
  return score;
};

const generateAllMovesMultiJump = (boardState, player) => {
  let allMoves = [];
  let jumpMoves = [];

  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      const piece = boardState[r][c];
      if (!piece) continue;
      if ((player === PIECES.RED && isRed(piece)) || (player === PIECES.WHITE && isWhite(piece))) {
        const jumps = getAllMultiJumpChains(boardState, r, c, piece);
        if (jumps.length) jumpMoves.push(...jumps);
      }
    }
  }
  if (jumpMoves.length) return jumpMoves;

  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      const piece = boardState[r][c];
      if (!piece) continue;
      if ((player === PIECES.RED && isRed(piece)) || (player === PIECES.WHITE && isWhite(piece))) {
        const moves = findSimpleMovesOnBoard(boardState, r, c, piece);
        allMoves.push(...moves);
      }
    }
  }
  return allMoves;
};

const getAllMultiJumpChains = (boardState, row, col, piece) => {
  const recurse = (currentBoard, r, c, jumpedSet, pathJumpedPositions) => {
    const jumps = isKing(piece)
      ? findKingJumpsMulti(currentBoard, r, c, piece, jumpedSet)
      : findPossibleJumpsOnBoardWithJumped(currentBoard, r, c, piece, jumpedSet);

    if (!jumps.length && row !== r && col !== c)
      return [
        {
          from: { row: row, col: col },
          to: { row: r, col: c },
          jumped: [...pathJumpedPositions]
        }
      ];

    const allChains = [];
    for (const jump of jumps) {
      const tempBoard = applyMultiJumpMove(currentBoard, jump);
      const newJumpedSet = new Set(jumpedSet);
      jump.jumped.forEach((pos) => newJumpedSet.add(`${pos.row},${pos.col}`));
      const newJumpedPositions = pathJumpedPositions.concat(jump.jumped);
      const chains = recurse(tempBoard, jump.to.row, jump.to.col, newJumpedSet, newJumpedPositions);
      allChains.push(...chains);
    }
    return allChains;
  };
  return recurse(boardState, row, col, new Set(), []);
};

const findPossibleJumpsOnBoardWithJumped = (boardState, row, col, piece, jumpedPositions) => {
  const jumps = [];
  const directions = isKing(piece)
    ? [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1]
      ]
    : isRed(piece)
      ? [
          [1, -1],
          [1, 1]
        ]
      : [
          [-1, -1],
          [-1, 1]
        ];
  for (const [dr, dc] of directions) {
    const midRow = parseInt(row) + parseInt(dr);
    const midCol = parseInt(col) + parseInt(dc);
    const jumpRow = parseInt(row) + 2 * parseInt(dr);
    const jumpCol = parseInt(col) + 2 * parseInt(dc);
    if (!isInBounds(jumpRow, jumpCol)) continue;
    const midPiece = boardState[midRow]?.[midCol];
    if (
      midPiece &&
      isOpponent(piece, midPiece) &&
      !jumpedPositions.has(`${midRow},${midCol}`) &&
      boardState[jumpRow][jumpCol] === null
    ) {
      jumps.push({
        from: { row, col },
        to: { row: jumpRow, col: jumpCol },
        jumped: [{ row: midRow, col: midCol }]
      });
    }
  }
  return jumps;
};

const findSimpleMovesOnBoard = (boardState, row, col, piece) => {
  const moves = [];
  const directions = isKing(piece)
    ? [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1]
      ]
    : isRed(piece)
      ? [
          [1, -1],
          [1, 1]
        ]
      : [
          [-1, -1],
          [-1, 1]
        ];
  for (const [dr, dc] of directions) {
    const nr = parseInt(row) + parseInt(dr);
    const nc = parseInt(col) + parseInt(dc);
    if (isInBounds(nr, nc) && boardState[nr][nc] === null) {
      moves.push({ from: { row, col }, to: { row: nr, col: nc }, jumped: [] });
    }
  }
  return moves;
};

const applyMultiJumpMove = (boardState, move) => {
  const newBoard = deepCloneBoard(boardState);
  const piece = newBoard[move.from.row][move.from.col];
  newBoard[move.from.row][move.from.col] = null;
  newBoard[move.to.row][move.to.col] = piece;
  if (move.jumped?.length) move.jumped.forEach(({ row, col }) => (newBoard[row][col] = null));
  crownIfNeeded(newBoard, move.to.row, move.to.col, piece);
  return newBoard;
};

const crownIfNeeded = (boardState, row, col, piece) => {
  if (isRed(piece) && row === parseInt(boardSize) - 1) {
    boardState[row][col] = PIECES.RED_KING;
  }
  if (isWhite(piece) && row === 0) {
    boardState[row][col] = PIECES.WHITE_KING;
  }
};


const checkGameOver = () => {
  const redPieces = board.flat().some((p) => isRed(p) || p === PIECES.RED_KING);
  const whitePieces = board.flat().some((p) => isWhite(p) || p === PIECES.WHITE_KING);
  if (!redPieces) {
    messageEl.innerText = "White wins!";

    return true;
  }
  if (!whitePieces) {
    messageEl.innerText = "Red wins!";
    return true;
  }
  return false;
};


resetBtn.addEventListener("click", () => {
  selected = null;
  multiJumpInProgress = null;
  capturedCount = { red: 0, white: 0 };
  updateScoreboard();
  clearHighlight();
  init();
});


init();
