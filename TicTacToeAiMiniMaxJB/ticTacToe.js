"use strict";

/* author Jacek Byzdra https://www.linkedin.com/in/jacek-byzdra/ */

const SIZE = 3;
const EMPTY = " ";
const HUMAN = "O";
const AI = "X";

//Board manager
class PlayBoard {
  static board = Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY));

  static getBoard() {
    return this.board;
  }

  static setBoard(dummyboard) {
    this.board = dummyboard;
  }
  static setValue(row, col, name) {
    this.board[row][col] = name;
  }
}
// Game mode manager
class GameMode {
  static mode = "twoPlayer";

  static getMode() {
    return this.mode;
  }
  static setMode(mode) {
    this.mode = mode;
  }
}

// Player manager
class Player {
  static current = HUMAN;
  static get currentPlayer() {
    return this.current;
  }
  static set currentPlayer(player) {
    this.current = player;
  }
}

// Move number tracker
class MoveNumber {
  static move = 0;
  static get count() {
    return this.move;
  }
  static set count(n) {
    this.move = n;
  }
}

// Game state tracker
class GameActive {
  static active = true;
  static get isActive() {
    return this.active;
  }
  static set isActive(val) {
    this.active = val;
  }
}

// Board management
class BoardPanel {
  static maxAvailableMoves = [];

  static createBoard() {
    PlayBoard.setBoard(Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY)));
    this.maxAvailableMoves = this._generateMaxAvailableMoves();
    return PlayBoard.getBoard();
  }

  static resetBoard() {
    this.createBoard();
  }

  static _generateMaxAvailableMoves() {
    return Array.from({ length: SIZE }, (_, row) => Array.from({ length: SIZE }, (_, col) => row * SIZE + col));
  }

  static getMaxAvailableMoves() {
    return this.maxAvailableMoves;
  }

  static setMaxAvailableMoves(moves) {
    this.maxAvailableMoves = moves;
  }
}

// Display panel for DOM updates
class DisplayPanel {
  static createCells() {
    const boardEl = document.getElementById("board");
    boardEl.innerHTML = "";
    let cnt = 0;

    for (let row = 0; row < SIZE; row++) {
      for (let col = 0; col < SIZE; col++) {
        const cellBtn = document.createElement("button");
        cellBtn.classList.add("cell");
        cellBtn.dataset.row = row;
        cellBtn.dataset.col = col;
        cellBtn.dataset.index = cnt;
        cellBtn.id = String(cnt);
        cellBtn.textContent = EMPTY;
        boardEl.appendChild(cellBtn);
        cnt++;
      }
    }
  }

  static clearCells() {
    document.querySelectorAll(".cell").forEach((cell) => cell.remove());
  }
  static updateCells() {
    document.querySelectorAll(".cell").forEach((cell) => {
      const { row, col } = cell.dataset; // Destructuring
      cell.textContent = PlayBoard.getBoard()[row][col];
      cell.disabled = PlayBoard.getBoard()[row][col] !== EMPTY || !GameActive.isActive;
    });
  }

  static stopCellsPropagation() {
    document.querySelectorAll(".cell").forEach((cell) => (cell.disabled = true));
  }

  static updateStatus(message) {
    const statusEl = document.getElementById("status");
    if (statusEl) statusEl.textContent = message;
  }

  static updateMoveNumber(message) {
    const moveNumberEl = document.getElementById("moveNumber");
    if (moveNumberEl) moveNumberEl.textContent = message;
  }
}

// The core game logic and AI
class Action {
  static boardCreate() {
    BoardPanel.resetBoard();
  }

  static setPlayer(player) {
    Player.currentPlayer = player;
  }

  static checkWin(player) {
    return CheckWin.check(PlayBoard.getBoard(), player).isValid;
  }

  static isBoardFull() {
    return PlayBoard.getBoard()
      .flat()
      .every((cell) => cell !== EMPTY);
  }

  static checkGameEnd(player) {
    if (this.checkWin(player)) {
      DisplayPanel.updateStatus(`${player} Wins!`);
      DisplayPanel.stopCellsPropagation();
      GameActive.isActive = false;
      return true;
    }

    if (this.isBoardFull()) {
      DisplayPanel.updateStatus("It's a draw!");
      GameActive.isActive = false;
      return true;
    }

    return false;
  }

  static playMove(row, col) {
    if (PlayBoard.getBoard()[row][col] !== EMPTY || !GameActive.isActive) return;
    PlayBoard.setValue(row, col, Player.currentPlayer);
    DisplayPanel.updateCells();
    MoveNumber.count++;
    DisplayPanel.updateMoveNumber(`Move number ${MoveNumber.count}`);

    if (!this.checkGameEnd(Player.currentPlayer)) {
      Player.currentPlayer = Player.currentPlayer === AI ? HUMAN : AI;
      DisplayPanel.updateStatus(`${Player.currentPlayer}'s turn`);

      if (GameMode.getMode() === "onePlayer" && Player.currentPlayer === AI) {
        this.computerMove();
      }
    }
  }

  static RandomChoice(choices) {
    const index = Math.floor(Math.random() * choices.length);
    return choices[index];
  }
  static getCellPosition(el) {
    let l = 0;
    let t = 0;
    while (el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop)) {
      l += el.offsetLeft - el.scrollLeft;
      t += el.offsetTop - el.scrollTop;
      el = el.offsetParent;
    }
    return { top: t, left: l };
  }
  static AIclickMouse(x, y, cellnr) {
    const TARGET = document.getElementById(cellnr);
    TARGET.dispatchEvent(
      new MouseEvent("click", {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y
      })
    );
  }
  static InvokeAIclickMouse() {
    const availableMoves = BoardPanel.getMaxAvailableMoves().flat();
    const randCellId = this.RandomChoice(availableMoves);
    const { left: x1, top: y1 } = this.getCellPosition(document.getElementById(randCellId));
    this.AIclickMouse(x1, y1, randCellId);
  }
  static computerMove() {
    const { row, col } = this.getBestMove(PlayBoard.getBoard());
    setTimeout(() => this.playMove(row, col), 100); // small delay for UX
  }

  static getBestMove(dummyBoard) {
    let best = { score: -Infinity, row: -1, col: -1 };
    for (let row = 0; row < SIZE; row++) {
      for (let col = 0; col < SIZE; col++) {
        if (dummyBoard[row][col] === EMPTY) {
          dummyBoard[row][col] = AI;
          const score = this.minimax(dummyBoard, 0, -Infinity, Infinity, false);
          dummyBoard[row][col] = EMPTY;
          if (score > best.score) {
            best = { score, row, col };
          }
        }
      }
    }
    return best;
  }

  static minimax(dummyBoard, depth, alpha, beta, isMaximizing) {
    if (CheckWin.check(dummyBoard, AI).winner === AI) return 500 - depth;
    if (CheckWin.check(dummyBoard, HUMAN).winner === HUMAN) return -500 + depth;
    if (dummyBoard.flat().every((cell) => cell !== EMPTY)) return 0;

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (let row = 0; row < SIZE; row++) {
        for (let col = 0; col < SIZE; col++) {
          if (dummyBoard[row][col] === EMPTY) {
            dummyBoard[row][col] = AI;
            const evalScore = this.minimax(dummyBoard, depth + 1, alpha, beta, false);
            dummyBoard[row][col] = EMPTY;
            maxEval = Math.max(maxEval, evalScore);
            alpha = Math.max(alpha, evalScore);
            if (beta <= alpha) return maxEval;
          }
        }
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (let row = 0; row < SIZE; row++) {
        for (let col = 0; col < SIZE; col++) {
          if (dummyBoard[row][col] === EMPTY) {
            dummyBoard[row][col] = HUMAN;
            const evalScore = this.minimax(dummyBoard, depth + 1, alpha, beta, true);
            dummyBoard[row][col] = EMPTY;
            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) return minEval;
          }
        }
      }
      return minEval;
    }
  }

  static startPlayerVsAI() {
    DisplayPanel.clearCells();
    GameMode.setMode("onePlayer");
    this.boardCreate();
    this.setPlayer(HUMAN);
    GameActive.isActive = true;
    MoveNumber.count = 0;
    DisplayPanel.createCells();
    DisplayPanel.updateStatus("Player vs AI game - " + `${Player.currentPlayer}'s turn`);
    DisplayPanel.updateMoveNumber(`Move number ${MoveNumber.count}`);
  }

  static startTwoPlayerMode() {
    DisplayPanel.clearCells();
    GameMode.setMode("twoPlayer");
    this.boardCreate();
    this.setPlayer(HUMAN);
    GameActive.isActive = true;
    MoveNumber.count = 0;
    DisplayPanel.createCells();
    DisplayPanel.updateStatus("Two players game - " + `${Player.currentPlayer}'s turn`);
    DisplayPanel.updateMoveNumber(`Move number ${MoveNumber.count}`);
  }

  static startAIvsPlayer() {
    DisplayPanel.clearCells();
    GameMode.setMode("onePlayer");
    this.boardCreate();
    this.setPlayer(AI);
    GameActive.isActive = true;
    MoveNumber.count = 0;
    DisplayPanel.createCells();
    DisplayPanel.updateStatus("AI vs Player game - " + `${Player.currentPlayer}'s turn`);
    DisplayPanel.updateMoveNumber(`Move number ${MoveNumber.count}`);
    Action.InvokeAIclickMouse();
  }

  static resetGame() {
    MoveNumber.count = 0;
    GameActive.isActive = true;
    MoveNumber.count = 0;
    BoardPanel.resetBoard();
    DisplayPanel.clearCells();
    DisplayPanel.createCells();
    this.setPlayer(HUMAN);
    DisplayPanel.updateStatus("Two players game - " + `${Player.currentPlayer}'s turn`);
    DisplayPanel.updateMoveNumber(`Move number ${MoveNumber.count}`);
  }
}

// Winning logic
const CheckWin = {
  check(board, player) {
    const winPatterns = [
      // Rows, columns, diagonals
      ...Array.from({length: SIZE}, (_, i) => [[i, 0], [i, 1], [i, 2]]), // Rows
      ...Array.from({length: SIZE}, (_, i) => [[0, i], [1, i], [2, i]]), // Columns
      [[0, 0], [1, 1], [2, 2]], // Diagonal
      [[0, 2], [1, 1], [2, 0]]  // Anti-diagonal
    ];

    for (const pattern of winPatterns) {
      if (pattern.every(([r, c]) => board[r][c] === player)) {
        return { isValid: true, winner: player };
      }
    }
    return { isValid: false, winner: null };
  }
};

export {
  SIZE,
  EMPTY,
  HUMAN,
  AI,
  PlayBoard,
  GameMode,
  Player,
  MoveNumber,
  GameActive,
  BoardPanel,
  DisplayPanel,
  Action,
  CheckWin
};
