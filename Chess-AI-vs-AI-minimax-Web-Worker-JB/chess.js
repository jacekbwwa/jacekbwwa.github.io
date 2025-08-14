
"use strict";

  /* author Jacek Byzdra https://www.linkedin.com/in/jacek-byzdra/ */

import { createEmptyBoard, initializeGame, GameState, coordToIndex, indexToCoord, PIECES_SYMBOLS } from "./worker.js";

const LETTERS = ["a", "b", "c", "d", "e", "f", "g", "h"];
const ROWS = [8,7,6,5,4,3,2,1];

const MOVE_DIRECTIONS = {
    N: [],
    B: [[1, 1], [1, -1], [-1, 1], [-1, -1]],
    R: [[1, 0], [-1, 0], [0, 1], [0, -1]],
    Q: [[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]],
    K: [[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]]
};

let game = new GameState();
let worker = null;
let isGameRunning = false;
let aiTimeoutId = null;

function createEmptyCorner() {
  const el = document.createElement("div");
  el.className = "empty-corner";
  el.style.gridColumn = "span 1";
  el.style.gridRow = "span 1";
  return el;
}

function buildBoardMarkup() {
  const boardContainer = document.getElementById("board");
  boardContainer.innerHTML = "";

  boardContainer.appendChild(createEmptyCorner());
  for (const f of LETTERS) {
    const elemTop = document.createElement('div');
    elemTop.className = 'col-label-top';
    elemTop.textContent = f;
    elemTop.style.gridRow = "span 1";
    boardContainer.appendChild(elemTop);
  }
  boardContainer.appendChild(createEmptyCorner());

  for (let r = 0; r < 8; r++) {
    const rankNumTopToBottom = 8 - r;
    const lblLeft = document.createElement('div');
    lblLeft.className = 'row-label-left';
    lblLeft.textContent = rankNumTopToBottom;
    boardContainer.appendChild(lblLeft);

    for (let c = 0; c < 8; c++) {
      const squareDiv = document.createElement("div");
      squareDiv.className = "square";
      //const lightSquare = (r + c) % 2 === 1;
      const lightSquare = (r + c) % 2 === 0;
      if (lightSquare) squareDiv.classList.add("light");
      else squareDiv.classList.add("dark");
      squareDiv.setAttribute("id", `square-${indexToCoord(r, c)}`);
      squareDiv.setAttribute('data-row', r);
      squareDiv.setAttribute('data-col', c);
      squareDiv.setAttribute("role", "gridcell");
      squareDiv.setAttribute("aria-label", `Square ${indexToCoord(r, c)}`);
      squareDiv.textContent = "";
      boardContainer.appendChild(squareDiv);
    }

    const lblRight = document.createElement('div');
    lblRight.className = 'row-label-right';
    lblRight.textContent = rankNumTopToBottom;
    boardContainer.appendChild(lblRight);
  }

  boardContainer.appendChild(createEmptyCorner());
  for (const f of LETTERS) {
    const elemBottom = document.createElement('div');
    elemBottom.className = 'col-label-bottom';
    elemBottom.textContent = f;
    elemBottom.style.gridRow = "span 1";
    boardContainer.appendChild(elemBottom);
  }
  boardContainer.appendChild(createEmptyCorner());
}

function renderBoard(game) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const squareId = `square-${indexToCoord(r, c)}`;
      const squareDiv = document.getElementById(squareId);
      if (!squareDiv) continue;
      const piece = game.board[r][c];
     // squareDiv.textContent = piece ? PIECES_SYMBOLS[piece] : "";
     squareDiv.classList.remove("highlight", "check");
     squareDiv.title = piece ? `${pieceName(piece)} (${isWhite(piece) ? "White" : "Black"})` : "";
      if (piece) {
        if (isWhite(piece)) {
          squareDiv.innerHTML = `<img src="img/${"White"}-${piece}.png">`;
          squareDiv.style.color = "#f4fbff";
          squareDiv.style.fontWeight = "550";
        } else {
          squareDiv.innerHTML = `<img src="img/${"Black"}-${piece}.png">`;
          squareDiv.style.color = "black";
          squareDiv.style.fontWeight = "550";
        }
      } else {
        squareDiv.innerHTML = "";
        squareDiv.style.color = "";
        squareDiv.style.fontWeight = "";
      }
    }
  }
}

function pieceName(piece) {
  if (!piece) return "";
  const map = {
    P: "Pawn", p: "Pawn",
    N: "Knight", n: "Knight",
    B: "Bishop", b: "Bishop",
    R: "Rook", r: "Rook",
    Q: "Queen", q: "Queen",
    K: "King", k: "King"
  };
  return map[piece.toUpperCase()] || "";
}

function isWhite(piece) {
  if (!piece) return false;
  return piece === piece.toUpperCase();
}

function isBlack(piece) {
  if (!piece) return false;
  return piece === piece.toLowerCase();
}

function updateInfoPanel(game, statusMessage) {
  document.getElementById("mode-info").textContent = game.currentMode || "Not started";
  document.getElementById("turn-info").textContent = game.turn === "w" ? "White (AI1)" : "Black (AI2)";
  document.getElementById("status").textContent = statusMessage || "";
  const capturedWhite = game.capturedWhitePieces.map((p) => PIECES_SYMBOLS[p]).join("") || "none";
  const capturedBlack = game.capturedBlackPieces.map((p) => PIECES_SYMBOLS[p]).join("") || "none";
  document.getElementById("captured-white").textContent = capturedWhite;
  document.getElementById("captured-black").textContent = capturedBlack;
  document.getElementById("score-white").textContent = game.whiteScore.toFixed(1);
  document.getElementById("score-black").textContent = game.blackScore.toFixed(1);
}

function updateButtons(game) {
  const btnAI = document.getElementById("btn-ai1vai2");
  const btnRestart = document.getElementById("btn-restart");
  const btnStop = document.getElementById("btn-stop");
  const btnPlayAgain = document.getElementById("btn-playagain");
  const btnHistory = document.getElementById("btn-history");

  btnAI.disabled = !!game.currentMode;
  btnAI.setAttribute("aria-disabled", btnAI.disabled);
  btnRestart.disabled = !game.currentMode;
  btnRestart.setAttribute("aria-disabled", btnRestart.disabled);
  btnStop.disabled = !game.currentMode || game.isPaused || game.gameResult !== null;
  btnStop.setAttribute("aria-disabled", btnStop.disabled);
  btnPlayAgain.disabled = !game.isPaused || game.gameResult !== null;
  btnPlayAgain.setAttribute("aria-disabled", btnPlayAgain.disabled);
  btnHistory.disabled = game.history.length === 0 || (!game.isPaused && !game.gameResult);
  btnHistory.setAttribute("aria-disabled", btnHistory.disabled);
}

function moveToNotation(move, moveNum, player) {
  const fromCoord = indexToCoord(...move.from);
  const toCoord = indexToCoord(...move.to);
  const cap = move.captured ? ` captures ${pieceName(move.captured)}` : "";
  if (move.isCastle) {
    if (move.to[1] === 6) return `${moveNum}. ${player}: Castling O-O`;
    if (move.to[1] === 2) return `${moveNum}. ${player}: Castling O-O-O`;
  }
  let promo = move.promotion ? " (Pawn promoted to Queen)" : "";
  return `${moveNum}. ${player}: ${pieceName(move.piece)} ${fromCoord} to ${toCoord}${cap}${promo}`;
}

function startWorker() {
  if (worker) {
    worker.terminate();
    worker = null;
  }
  worker = new Worker("worker.js", { type: "module" });
  worker.onmessage = handleWorkerMessage;
}

async function handleWorkerMessage(e) {
  const { type, payload } = e.data;
  switch(type) {
    case "init_complete":
      Object.assign(game, payload.game);
      renderBoard(game);
      updateInfoPanel(game, "");
      updateButtons(game);
      break;

    case "move_result":
      {
        const move = payload.move;
        await applyMoveAndUpdate(move);
        if (!game.gameResult && !game.isPaused) {
          setTimeout(() => sendPlayRequestToWorker(), 500);
        } else {
          isGameRunning = false;
          updateButtons(game);
        }
      }
      break;

    case "error":
      console.error("Worker error:", payload.message);
      isGameRunning = false;
      updateButtons(game);
      break;

    default:
      console.warn("Unknown message from worker:", type);
  }
}

function sendPlayRequestToWorker() {
  if (!worker) return;
  worker.postMessage({ type: "play_move", payload: { gameData: game } });
}


function sendInitGameToWorker() {
  if (!worker) return;
  worker.postMessage({ type: "init_game" });
}


async function applyMoveAndUpdate(move) {
  if (!move) return;
  let newGame = simulateMove(game, move);
  detectEndConditions(newGame);
  recordMove(newGame, move);
  if (newGame.gameResult === "white") newGame.whiteScore += 1;
  else if (newGame.gameResult === "black") newGame.blackScore += 1;
  else if (newGame.gameResult === "draw") {
    newGame.whiteScore += 0.5;
    newGame.blackScore += 0.5;
  }
  Object.assign(game, newGame);
  renderBoard(game);
  updateInfoPanel(game, getStatusMessage(game));
  updateButtons(game);
}

function simulateMove(gameState, move) {
  const newGame = deepCloneGame(gameState);
  const fr = move.from[0], fc = move.from[1];
  const tr = move.to[0], tc = move.to[1];
  const piece = newGame.board[fr][fc];

  if (move.captured) {
    if (move.enPassant) {
      newGame.board[fr][tc] = null;
      if (isWhite(piece)) newGame.capturedBlackPieces.push(move.captured);
      else newGame.capturedWhitePieces.push(move.captured);
    } else {
      if (isWhite(move.captured)) newGame.capturedWhitePieces.push(move.captured);
      else newGame.capturedBlackPieces.push(move.captured);
    }
  }

  newGame.board[tr][tc] = piece;
  newGame.board[fr][fc] = null;
  newGame.enPassantTarget = null;

  if (piece.toUpperCase() === "P") {
    if ((isWhite(piece) && tr === 0) || (isBlack(piece) && tr === 7)) {
      newGame.board[tr][tc] = isWhite(piece) ? "Q" : "q";
      move.promotion = true;
    }
  }

  if (move.isCastle) {
    const row = isWhite(piece) ? 7 : 0;
    if (tc === 6) {
      const rookCol = 7;
      const rookDest = 5;
      newGame.board[row][rookDest] = isWhite(piece) ? "R" : "r";
      newGame.board[row][rookCol] = null;
    } else if (tc === 2) {
      const rookCol = 0;
      const rookDest = 3;
      newGame.board[row][rookDest] = isWhite(piece) ? "R" : "r";
      newGame.board[row][rookCol] = null;
    }
    if (isWhite(piece)) {
      newGame.whiteCastled = true;
      newGame.castledPlayers.w = true;
    } else {
      newGame.blackCastled = true;
      newGame.castledPlayers.b = true;
    }
  }

  if (piece.toUpperCase() === "K") {
    if (isWhite(piece)) newGame.whiteKingMoved = true;
    else newGame.blackKingMoved = true;
    newGame.castlingRights[newGame.turn] = { kingSide: false, queenSide: false };
  }

  if (piece.toUpperCase() === "R") {
    if (isWhite(piece)) {
      if (fr === 7 && fc === 0) newGame.whiteRookAMoved = true;
      if (fr === 7 && fc === 7) newGame.whiteRookHMoved = true;
    } else {
      if (fr === 0 && fc === 0) newGame.blackRookAMoved = true;
      if (fr === 0 && fc === 7) newGame.blackRookHMoved = true;
    }
    if (isWhite(piece)) {
      if (fr === 7 && fc === 0) newGame.castlingRights.w.queenSide = false;
      if (fr === 7 && fc === 7) newGame.castlingRights.w.kingSide = false;
    } else {
      if (fr === 0 && fc === 0) newGame.castlingRights.b.queenSide = false;
      if (fr === 0 && fc === 7) newGame.castlingRights.b.kingSide = false;
    }
  }

  if (move.captured && move.captured.toUpperCase() === "R") {
    if (tr === 7 && tc === 0) newGame.castlingRights.w.queenSide = false;
    if (tr === 7 && tc === 7) newGame.castlingRights.w.kingSide = false;
    if (tr === 0 && tc === 0) newGame.castlingRights.b.queenSide = false;
    if (tr === 0 && tc === 7) newGame.castlingRights.b.kingSide = false;
  }

  if (move.doublePawnPush) {
    newGame.enPassantTarget = [(fr + tr) / 2, fc];
  }

  newGame.turn = opponent(gameState.turn);
  if (newGame.turn === "w") newGame.moveNumber++;

  const posKey = getPositionKey(newGame);
  newGame.positionsCounter[posKey] = (newGame.positionsCounter[posKey] ?? 0) + 1;

  return newGame;
}

function opponent(color) {
  return color === "w" ? "b" : "w";
}

function getPositionKey(game) {
  let s = "";
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      s += game.board[r][c] ? game.board[r][c] : ".";
    }
  }
  s += game.turn;
  s += game.castlingRights.w.kingSide ? "K" : "";
  s += game.castlingRights.w.queenSide ? "Q" : "";
  s += game.castlingRights.b.kingSide ? "k" : "";
  s += game.castlingRights.b.queenSide ? "q" : "";
  s += game.enPassantTarget ? indexToCoord(...game.enPassantTarget) : "-";
  return s;
}

function detectEndConditions(game) {
    const kingPos = findKing(game, game.turn);
    if (!kingPos) {
        game.gameResult = game.turn === "w" ? "black" : "white";
        return;
    }
    game.isCheck = squareIsAttacked(game, kingPos[0], kingPos[1], opponent(game.turn));
    const legalMoves = generateAllLegalMoves(game);
    if (!legalMoves.length) {
        if (game.isCheck) {
            game.isCheckMate = true;
            game.gameResult = game.turn === "w" ? "black" : "white";
        } else {
            game.isStaleMate = true;
            game.gameResult = "draw";
        }
        return;
    } else {
        game.isCheckMate = false;
        game.isStaleMate = false;
    }
    if (isInsufficientMaterial(game)) {
        game.gameResult = "draw";
        return;
    }
    const posKey = getPositionKey(game);
    if ((game.positionsCounter[posKey] ?? 0) >= 3) {
        game.gameResult = "draw";
        return;
    }
}


    
    
function squareIsAttacked(game, row, col, attackerColor) {
  for (let r=0;r<8;r++) {
    for(let c=0;c<8;c++) {
      const p = game.board[r][c];
      if (!p) continue;
      if ((attackerColor === "w" && isWhite(p)) || (attackerColor==="b"&&isBlack(p))) {
        if (canAttackSquare(game, r,c,row,col)) return true;
      }
    }
  }
  return false;
}

function canAttackSquare(game, sr, sc, tr, tc) {
  const piece = game.board[sr][sc];
  if (!piece) return false;
  const pieceType = piece.toUpperCase();
  const isWhitePiece = isWhite(piece);
  const dr = tr - sr;
  const dc = tc - sc;
  const absDr = Math.abs(dr);
  const absDc = Math.abs(dc);

  switch(pieceType) {
    case "P": {
      const dir = isWhitePiece ? -1 : 1;
      return (dr === dir && absDc === 1);
    }
    case "N": {
      return ((absDr === 2 && absDc === 1)||(absDr === 1 && absDc === 2));
    }
    case "B": {
      if (absDr === absDc && isPathClear(game,sr,sc,tr,tc)) return true;
      return false;
    }
    case "R": {
      if (((dr === 0 && dc !== 0)||(dc === 0 && dr !== 0)) && isPathClear(game,sr,sc,tr,tc)) return true;
      return false;
    }
    case "Q": {
      if ((absDr === absDc || dr === 0 || dc === 0) && isPathClear(game,sr,sc,tr,tc)) return true;
      return false;
    }
    case "K": {
      return absDr <=1 && absDc <=1;
    }
    default:
      return false;
  }
}

function isPathClear(game, sr, sc, tr, tc) {
  const dr = tr - sr;
  const dc = tc - sc;
  const stepR = dr === 0 ? 0 : dr/Math.abs(dr);
  const stepC = dc === 0 ? 0 : dc/Math.abs(dc);
  let r = sr + stepR;
  let c = sc + stepC;
  while (r !== tr || c !== tc) {
    if (game.board[r][c]) return false;
    r += stepR;
    c += stepC;
  }
  return true;
}

function findKing(game, color) {
  const kingSymbol = color === "w" ? "K" : "k";
  for(let r=0;r<8;r++) {
    for(let c=0;c<8;c++) {
      if (game.board[r][c] === kingSymbol) return [r,c];
    }
  }
  return null;
}

function generateAllLegalMoves(game) {
  let moves = [];
  for(let r=0;r<8;r++) {
    for(let c=0;c<8;c++) {
      const piece = game.board[r][c];
      if (!piece) continue;
      if((game.turn === "w" && isWhite(piece)) || (game.turn === "b" && isBlack(piece))) {
        moves.push(...generatePieceMoves(game,r,c));
      }
    }
  }
  return moves.filter(m => !moveLeavesKingInCheck(game,m));
}

function isOnBoard(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function moveObj(fromRow, fromCol, toRow, toCol, piece, options = {}) {
    return Object.assign({
        from: [fromRow, fromCol],
        to: [toRow, toCol],
        piece: piece,
        captured: null,
        promotion: false,
        isCastle: false,
        enPassant: false,
        doublePawnPush: false
    }, options);
}

function isOpponent(p1, p2) {
    if (!p1 || !p2) return false;
    return (isWhite(p1) && isBlack(p2)) || (isBlack(p1) && isWhite(p2));
}

function kingHasMoved(game, piece) {
    if (!piece) return true;
    return isWhite(piece) ? game.whiteKingMoved : game.blackKingMoved;
}

function rookHasMoved(game, kingSide, color) {
    return color === "w" ? (kingSide ? game.whiteRookHMoved : game.whiteRookAMoved)
        : (kingSide ? game.blackRookHMoved : game.blackRookAMoved);
}

function canCastle(game, kingSide, color) {
    if (!game.castlingRights[color][kingSide ? "kingSide" : "queenSide"]) return false;

    const row = color === "w" ? 7 : 0;
    if (kingSide) {
        if (game.board[row][5] || game.board[row][6]) return false;
        if (rookHasMoved(game, true, color)) return false;
        if (squareIsAttacked(game, row, 4, opponent(color))) return false;
        if (squareIsAttacked(game, row, 5, opponent(color))) return false;
        if (squareIsAttacked(game, row, 6, opponent(color))) return false;
        return true;
    } else {
        if (game.board[row][1] || game.board[row][2] || game.board[row][3]) return false;
        if (rookHasMoved(game, false, color)) return false;
        if (squareIsAttacked(game, row, 4, opponent(color))) return false;
        if (squareIsAttacked(game, row, 3, opponent(color))) return false;
        if (squareIsAttacked(game, row, 2, opponent(color))) return false;
        return true;
    }
}

function generatePieceMoves(game, row, col) {
    const piece = game.board[row][col];
    if (!piece) return [];
    const moves = [];
    const isWhiteTurn = game.turn === "w";
    const pieceType = piece.toUpperCase();
    const directions = MOVE_DIRECTIONS[pieceType] || [];

    if (pieceType === "P") {
        let dir = isWhiteTurn ? -1 : 1;
        let startRow = isWhiteTurn ? 6 : 1;
        let forwardRow = row + dir;
        if (isOnBoard(forwardRow, col) && !game.board[forwardRow][col]) {
            moves.push(moveObj(row, col, forwardRow, col, piece));
            if (row === startRow) {
                let forwardTwoRow = row + dir * 2;
                if (isOnBoard(forwardTwoRow, col) && !game.board[forwardTwoRow][col]) {
                    moves.push(moveObj(row, col, forwardTwoRow, col, piece, { doublePawnPush: true }));
                }
            }
        }

        for (let dc of [-1, 1]) {
            let captureCol = col + dc;
            if (!isOnBoard(forwardRow, captureCol)) continue;
            let target = game.board[forwardRow][captureCol];
            if (target && isOpponent(piece, target)) {
                moves.push(moveObj(row, col, forwardRow, captureCol, piece, { captured: target }));
            }
            if (
                game.enPassantTarget &&
                game.enPassantTarget[0] === forwardRow &&
                game.enPassantTarget[1] === captureCol
            ) {
                const capturedPawnRow = row;
                const capturedPawnCol = captureCol;
                const capturedPawn = game.board[capturedPawnRow][capturedPawnCol];
                if (
                    capturedPawn &&
                    isOpponent(piece, capturedPawn) &&
                    capturedPawn.toUpperCase() === "P"
                ) {
                    moves.push(moveObj(row, col, forwardRow, captureCol, piece, {
                        captured: capturedPawn,
                        enPassant: true
                    }));
                }
            }
        }
    }
    else if (pieceType === "N") {
        const knightMoves = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        for (const [dr, dc] of knightMoves) {
            let nr = row + dr;
            let nc = col + dc;
            if (!isOnBoard(nr, nc)) continue;
            const target = game.board[nr][nc];
            if (!target || isOpponent(piece, target)) {
                moves.push(moveObj(row, col, nr, nc, piece, { captured: target || null }));
            }
        }
    }
    else if (pieceType === "B" || pieceType === "R" || pieceType === "Q") {
        for (const [dr, dc] of directions) {
            if (pieceType === "B" && Math.abs(dr) !== Math.abs(dc)) continue;
            if (pieceType === "R" && dr !== 0 && dc !== 0) continue;
            let nr = row + dr;
            let nc = col + dc;
            while (isOnBoard(nr, nc)) {
                const target = game.board[nr][nc];
                if (!target) {
                    moves.push(moveObj(row, col, nr, nc, piece));
                } else {
                    if (isOpponent(piece, target)) {
                        moves.push(moveObj(row, col, nr, nc, piece, { captured: target }));
                    }
                    break;
                }
                nr += dr;
                nc += dc;
            }
        }
    }
    else if (pieceType === "K") {
        for (const [dr, dc] of directions) {
            const nr = row + dr;
            const nc = col + dc;
            if (!isOnBoard(nr, nc)) continue;
            const target = game.board[nr][nc];
            if (!target || isOpponent(piece, target)) {
                moves.push(moveObj(row, col, nr, nc, piece, { captured: target || null }));
            }
        }
        if (!kingHasMoved(game, piece)) {
            const color = isWhite(piece) ? "w" : "b";
            if (canCastle(game, true, color)) {
                moves.push(moveObj(row, col, row, col + 2, piece, { isCastle: true }));
            }
            if (canCastle(game, false, color)) {
                moves.push(moveObj(row, col, row, col - 2, piece, { isCastle: true }));
            }
        }
    }
    return moves;
}

function moveLeavesKingInCheck(game, move) {
    const newGame = simulateMove(game, move);
    const kingPos = findKing(newGame, game.turn);
    if (!kingPos) return true;
    return squareIsAttacked(newGame, kingPos[0], kingPos[1], opponent(game.turn));
}


function isInsufficientMaterial(game) {
  const pieces = [];
  for(let r=0;r<8;r++) {
    for(let c=0;c<8;c++) {
      const p = game.board[r][c];
      if(p) pieces.push(p);
    }
  }
  if(pieces.length === 2 && pieces.every(p=>p.toUpperCase()==="K")) return true;
  if(pieces.length === 3) {
    const bOrN = pieces.filter(p=>["B","N"].includes(p.toUpperCase()));
    const kings = pieces.filter(p=>p.toUpperCase()==="K");
    if(kings.length === 2 && bOrN.length===1) return true;
  }
  return false;
}

function deepCloneGame(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function recordMove(game, move) {
  const moveNum = game.history.length + 1;
  const player = (move.piece && isWhite(move.piece)) ? "White" : "Black";
  const notation = moveToNotation(move, moveNum, player);
  game.history.push({ ...move, notation, player: player[0].toLowerCase() });
}

function getStatusMessage(game) {
  if (game.gameResult === "white") return "White wins by checkmate.";
  if (game.gameResult === "black") return "Black wins by checkmate.";
  if (game.gameResult === "draw") return "Game ended in a draw.";
  if (game.isCheckMate) return (game.turn === "w" ? "Black" : "White") + " wins by checkmate.";
  if (game.isCheck) return (game.turn === "w" ? "White" : "Black") + " is in check.";
  if (game.isStaleMate) return "Stalemate - Game is a draw.";
  if (game.isPaused) return "Game is paused.";
  return "";
}

document.getElementById("btn-ai1vai2").addEventListener("click", async () => {
  if (game.currentMode) return;
  game = new GameState();
  initializeGame(game);
  game.currentMode = "AI1 vs AI2";
  renderBoard(game);
  updateInfoPanel(game, "");
  updateButtons(game);
  detectEndConditions(game);
  startWorker();
  sendInitGameToWorker();
  isGameRunning = true;
  sendPlayRequestToWorker();
});

document.getElementById("btn-restart").addEventListener("click", () => {
  if (worker) worker.terminate();
  worker = null;
  aiTimeoutId && clearTimeout(aiTimeoutId);
  aiTimeoutId = null;

  game = new GameState();
  initializeGame(game);
  game.currentMode = null;
  game.whiteScore = 0;
  game.blackScore = 0;
  game.isPaused = false;
  game.history = [];
  renderBoard(game);
  updateInfoPanel(game, "");
  updateButtons(game);
  document.getElementById("history-container").hidden = true;
  isGameRunning = false;
});

document.getElementById("btn-stop").addEventListener("click", () => {
  game.isPaused = true;
  updateButtons(game);
  updateInfoPanel(game, "Game is paused.");
  if (worker) worker.postMessage({ type: "pause" });
  aiTimeoutId && clearTimeout(aiTimeoutId);
  aiTimeoutId = null;
  isGameRunning = false;
});

document.getElementById("btn-playagain").addEventListener("click", async () => {
  if (!worker) startWorker();
  game.isPaused = false;
  updateButtons(game);
  updateInfoPanel(game, getStatusMessage(game));
  if (worker) sendPlayRequestToWorker();
  isGameRunning = true;
});

document.getElementById("btn-history").addEventListener("click", () => {
  const historyContainer = document.getElementById("history-container");
  const historyList = document.getElementById("history-list");
  historyList.innerHTML = "";
  for (const move of game.history) {
    const p = document.createElement("p");
    p.textContent = move.notation;
    historyList.appendChild(p);
  }
  historyContainer.hidden = !historyContainer.hidden;
  if (!historyContainer.hidden) {
    historyList.focus();
  }
});

buildBoardMarkup();
renderBoard(game);
updateButtons(game);
updateInfoPanel(game, "");

