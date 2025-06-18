
  export let currentMode = null; 
  export let puzzle = null;
  export let solution = null; 
  export let hintsShown = false; 


  const sudokuContainer = document.getElementById('sudoku-container');
  const easyBtn = document.getElementById('easyBtn');
  const mediumBtn = document.getElementById('mediumBtn');
  const hardBtn = document.getElementById('hardBtn');
  const hintBtn = document.getElementById('hintBtn');
  const solutionBtn = document.getElementById('solutionBtn');
  const restartBtn = document.getElementById('restartBtn');
  const messageDiv = document.getElementById('message');
  const newBtn = document.getElementById('newBtn');


  class Cell {
    constructor(row, col, value = null, readonly = false) {
      this.row = row;
      this.col = col;
      this.block = 3 * Math.floor(row / 3) + Math.floor(col / 3);
      this.value = value; 
      this.readonly = readonly; 
      this.possible = new Set(); 
    }
  }


  let cells = [];


  function initCells() {
    cells = [];
    for (let r = 0; r < 9; r++) {
      const rowCells = [];
      for (let c = 0; c < 9; c++) {
        rowCells.push(new Cell(r, c));
      }
      cells.push(rowCells);
    }
  }


  function clearMessage() {
    messageDiv.textContent = '';
    messageDiv.style.color = '#d32f2f'; 
  }

  async function generatePuzzle(mode) {
    currentMode = mode;
    clearMessage();
    disableAllButtons(true);

    const fullSolution = await generateFullSolution();

    const puzzleGrid = removeCellsForMode(fullSolution, mode);

    initCells();
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        let val = puzzleGrid[r][c];
        if (val !== null) {
          cells[r][c].value = val;
          cells[r][c].readonly = true;
        } else {
          cells[r][c].value = null;
          cells[r][c].readonly = false;
        }
      }
    }

    puzzle = puzzleGrid;
    solution = fullSolution;
    hintsShown = false;

    drawBoard();
    enableGameButtons(true);
  }

  function disableAllButtons(disabled) {
    easyBtn.disabled = disabled;
    mediumBtn.disabled = disabled;
    hardBtn.disabled = disabled;
    hintBtn.disabled = disabled || currentMode === null;
    solutionBtn.disabled = disabled || currentMode === null;
    restartBtn.disabled = disabled || currentMode === null;
    newBtn.disabled = disabled || currentMode === null;
  }

  function enableGameButtons(enabled) {
    hintBtn.disabled = !enabled;
    solutionBtn.disabled = !enabled;
    restartBtn.disabled = !enabled;
    newBtn.disabled = !enabled;
  }

  async function generateFullSolution() {
    const board = Array.from({ length: 9 }, () => Array(9).fill(null));
    const isValid = (board, row, col, num) => {
      for (let x = 0; x < 9; x++) {
        if (board[row][x] === num) return false;
        if (board[x][col] === num) return false;
      }
      const startRow = Math.floor(row / 3) * 3;
      const startCol = Math.floor(col / 3) * 3;
      for (let r = startRow; r < startRow + 3; r++) {
        for (let c = startCol; c < startCol + 3; c++) {
          if (board[r][c] === num) return false;
        }
      }
      return true;
    };

    const shuffleArray = (arr) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    function fillBoard(board) {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (board[r][c] === null) {
            let numbers = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
            for (const num of numbers) {
              if (isValid(board, r, c, num)) {
                board[r][c] = num;
                if (fillBoard(board)) return true;
                board[r][c] = null;
              }
            }
            return false;
          }
        }
      }
      return true;
    }

    fillBoard(board);
    return board;
  }

  function removeCellsForMode(fullBoard, mode) {
    const puzzleBoard = fullBoard.map(row => row.slice());
    const cluesPerBlock = { easy: 5, medium: 4, hard: 3 };
    const totalClues = { easy: 45, medium: 36, hard: 27 };
    const perBlock = cluesPerBlock[mode];
    const targetTotal = totalClues[mode];
    const blocksCells = Array(9)
      .fill(0)
      .map(() => []);
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const blockIndex = 3 * Math.floor(r / 3) + Math.floor(c / 3);
        blocksCells[blockIndex].push({ r, c });
      }
    }

    for (let b = 0; b < 9; b++) {
      const blockCells = blocksCells[b].slice();
      for (let i = blockCells.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [blockCells[i], blockCells[j]] = [blockCells[j], blockCells[i]];
      }
      for (let i = perBlock; i < blockCells.length; i++) {
        const { r, c } = blockCells[i];
        puzzleBoard[r][c] = null;
      }
    }

    let currentClues = puzzleBoard.flat().filter(v => v !== null).length;
    if (currentClues > targetTotal) {
      const clueCells = [];
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (puzzleBoard[r][c] !== null) {
            clueCells.push({ r, c });
          }
        }
      }
      while (currentClues > targetTotal && clueCells.length > 0) {
        const idx = Math.floor(Math.random() * clueCells.length);
        const cell = clueCells[idx];
        const blockIndex = 3 * Math.floor(cell.r / 3) + Math.floor(cell.c / 3);
        const blockCluesCount = blocksCells[blockIndex].reduce(
          (acc, { r, c }) => (puzzleBoard[r][c] !== null ? acc + 1 : acc),
          0
        );
        if (blockCluesCount > perBlock) {
          puzzleBoard[cell.r][cell.c] = null;
          clueCells.splice(idx, 1);
          currentClues--;
        } else {
          clueCells.splice(idx, 1);
        }
      }
    } else if (currentClues < targetTotal) {
      const emptyCells = [];
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (puzzleBoard[r][c] === null) emptyCells.push({ r, c });
        }
      }
      while (currentClues < targetTotal && emptyCells.length > 0) {
        const idx = Math.floor(Math.random() * emptyCells.length);
        const cell = emptyCells[idx];
        puzzleBoard[cell.r][cell.c] = fullBoard[cell.r][cell.c];
        emptyCells.splice(idx, 1);
        currentClues++;
      }
    }
    return puzzleBoard;
  }

  function drawBoard() {
    sudokuContainer.innerHTML = '';
    hintsShown = false;

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = cells[r][c];
        const div = document.createElement('div');
        div.setAttribute('role', 'gridcell');
        div.setAttribute('aria-label', `Row ${r + 1} column ${c + 1}`);
        div.classList.add('cell');
        if (((Math.floor(r / 3) + Math.floor(c / 3)) % 2) === 0) {
          div.classList.add('block-even');
        } else {
          div.classList.add('block-odd');
        }
        if (cell.readonly) {
          div.classList.add('readonly');
          div.textContent = cell.value;
        } else {
          div.tabIndex = 0;
          div.textContent = cell.value || '';
          div.addEventListener('click', () => {
            selectCell(r, c);
          });
          div.addEventListener('keydown', (e) => {
            if (e.key >= '1' && e.key <= '9') {
              e.preventDefault();
              setCellValue(r, c, Number(e.key));
            } else if (e.key === 'Backspace' || e.key === 'Delete') {
              e.preventDefault();
              setCellValue(r, c, null);
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              selectCell((r + 8) % 9, c);
            } else if (e.key === 'ArrowDown') {
              e.preventDefault();
              selectCell((r + 1) % 9, c);
            } else if (e.key === 'ArrowLeft') {
              e.preventDefault();
              selectCell(r, (c + 8) % 9);
            } else if (e.key === 'ArrowRight') {
              e.preventDefault();
              selectCell(r, (c + 1) % 9);
            }
          });
        }
        if (r === 2 || r === 5) div.classList.add('border-bottom');
        if (c === 2 || c === 5) div.classList.add('border-right');

        div.dataset.row = r.toString();
        div.dataset.col = c.toString();

        sudokuContainer.appendChild(div);
      }
    }
    clearMessage();
    selectedCell = null;
  }

  let selectedCell = null;

  function selectCell(r, c) {
    const cell = cells[r][c];
    if (cell.readonly) return;
    if (selectedCell) {
      const oldDiv = sudokuContainer.querySelector(
        `div.cell.selected`
      );
      if (oldDiv) oldDiv.classList.remove('selected');
    }
    const div = sudokuContainer.querySelector(
      `div.cell[data-row="${r}"][data-col="${c}"]`
    );
    if (div) {
      div.classList.add('selected');
      div.focus();
      selectedCell = { r, c };
    }
  }

  function setCellValue(r, c, val) {
    if (cells[r][c].readonly) return;
    if (val !== null && (val < 1 || val > 9)) return;

    cells[r][c].value = val;
    updateCellInView(r, c);
    clearMessage();
    hintsShown = false;
    hintBtn.setAttribute('aria-pressed', 'false');
    removeAllHints();
    const errors = getAllErrors();
    markErrors(errors);

    if (isBoardComplete()) {
      if (errors.length === 0) {
        showMessage("Congratulations! You solved the puzzle!", "green");
      } else {
        showMessage("There are mistakes. Use 'Hint' or 'Solution' buttons.", "#d32f2f");
      }
    }
  }

  function updateCellInView(r, c) {
    const div = sudokuContainer.querySelector(
      `div.cell[data-row="${r}"][data-col="${c}"]`
    );
    if (!div) return;
    div.textContent = cells[r][c].value || '';
    div.classList.remove('error');
    if (hintsShown && !cells[r][c].readonly && !cells[r][c].value) {
      showPossibleNumbersInCell(div, r, c);
    } else {
      removeHintsFromCell(div);
    }
  }

  function showMessage(msg, color = '#d32f2f') {
    messageDiv.textContent = msg;
    messageDiv.style.color = color;
  }

  function isBoardComplete() {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (!cells[r][c].value) return false;
      }
    }
    return true;
  }

  function getAllErrors() {
    const errors = [];
    const rows = Array(9).fill(0).map(() => []);
    const cols = Array(9).fill(0).map(() => []);
    const blocks = Array(9).fill(0).map(() => []);

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const val = cells[r][c].value;
        if (!val) continue;
        rows[r].push({ c, val });
        cols[c].push({ r, val });
        const b = 3 * Math.floor(r / 3) + Math.floor(c / 3);
        blocks[b].push({ r, c, val });
      }
    }

    const findDuplicates = (arr, posKey) => {
      const seen = new Map();
      const dupCoords = [];
      for (const obj of arr) {
        if (seen.has(obj.val)) {
          dupCoords.push(obj);
          dupCoords.push(seen.get(obj.val));
        } else {
          seen.set(obj.val, obj);
        }
      }
      return dupCoords;
    };

    let duplicates = [];

    for (let i = 0; i < 9; i++) {
      duplicates = duplicates.concat(
        findDuplicates(rows[i], 'c'),
        findDuplicates(cols[i], 'r'),
        findDuplicates(blocks[i], 'r')
      );
    }

    const errorSet = new Set();
    for (const d of duplicates) {
      let key;
      if ('r' in d && 'c' in d) key = `${d.r}-${d.c}`;
      else if ('r' in d && 'val' in d && 'c' in d) key = `${d.r}-${d.c}`;
      else if ('c' in d && 'val' in d && !('r' in d)) key = `${i}-${d.c}`; 
      else key = JSON.stringify(d);
      errorSet.add(key);
    }

    const errorCoords = [];
    errorSet.forEach((key) => {
      if (typeof key === 'string') {
        const parts = key.split('-');
        if (parts.length === 2) {
          const r = parseInt(parts[0], 10);
          const c = parseInt(parts[1], 10);
          errorCoords.push({ r, c });
        }
      }
    });

    return errorCoords;
  }

  function markErrors(errors) {
    document.querySelectorAll('.cell.error').forEach((div) => div.classList.remove('error'));
    errors.forEach(({ r, c }) => {
      const div = sudokuContainer.querySelector(
        `div.cell[data-row="${r}"][data-col="${c}"]`
      );
      if (div) div.classList.add('error');
    });
  }

  function showAllHints() {
    if (hintsShown) {
      removeAllHints();
      hintsShown = false;
      hintBtn.setAttribute('aria-pressed', 'false');
      return;
    }
    hintsShown = true;
    hintBtn.setAttribute('aria-pressed', 'true');
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (!cells[r][c].readonly && !cells[r][c].value) {
          const div = sudokuContainer.querySelector(
            `div.cell[data-row="${r}"][data-col="${c}"]`
          );
          if (div) {
            showPossibleNumbersInCell(div, r, c);
          }
        }
      }
    }
  }

  function removeAllHints() {
    document.querySelectorAll('.cell .hint-numbers').forEach(el => el.remove());
  }

  function computePossibleNumbers(r, c) {
    if (cells[r][c].readonly || cells[r][c].value) return new Set();

    let possible = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);

    for (let col = 0; col < 9; col++) {
      const val = cells[r][col].value;
      if (val) possible.delete(val);
    }
    for (let row = 0; row < 9; row++) {
      const val = cells[row][c].value;
      if (val) possible.delete(val);
    }
    const startRow = 3 * Math.floor(r / 3);
    const startCol = 3 * Math.floor(c / 3);
    for (let row = startRow; row < startRow + 3; row++) {
      for (let col = startCol; col < startCol + 3; col++) {
        const val = cells[row][col].value;
        if (val) possible.delete(val);
      }
    }
    return possible;
  }

  function showPossibleNumbersInCell(div, r, c) {
    removeHintsFromCell(div);
    const possibles = computePossibleNumbers(r, c);
    if (possibles.size === 0) return;

    const hintContainer = document.createElement('div');
    hintContainer.classList.add('hint-numbers');
    for (let num = 1; num <= 9; num++) {
      const span = document.createElement('span');
      if (possibles.has(num)) {
        span.textContent = num.toString();
        span.classList.add(`hint-${num}`);
      } else {
        span.textContent = '\u00A0';
      }
      hintContainer.appendChild(span);
    }
    div.appendChild(hintContainer);
  }

  function removeHintsFromCell(div) {
    const hint = div.querySelector('.hint-numbers');
    if (hint) hint.remove();
  }

  function restartGame() {
    if (!currentMode) return;
    generatePuzzle(currentMode);
    clearMessage();
  }

function newGame() {
  initCells();
  drawBoard();
  disableAllButtons(false);
}

  function readCurrentBoard() {
    const currentBoard = [];
    for (let r = 0; r < 9; r++) {
      const row = [];
      for (let c = 0; c < 9; c++) {
        row.push(cells[r][c].value);
      }
      currentBoard.push(row);
    }
    return currentBoard;
  }

  function solvePuzzle(board) {
    const b = board.map(row => row.slice());
    
    function getPossible(b, row, col) {
      if (b[row][col] !== null) return new Set();
      const s = new Set([1,2,3,4,5,6,7,8,9]);
      for(let i=0;i<9;i++){
        if(b[row][i]!==null) s.delete(b[row][i]);
        if(b[i][col]!==null) s.delete(b[i][col]);
      }
      const startRow = Math.floor(row/3)*3;
      const startCol = Math.floor(col/3)*3;
      for(let r=startRow;r<startRow+3;r++){
        for(let c=startCol;c<startCol+3;c++){
          if(b[r][c]!==null) s.delete(b[r][c]);
        }
      }
      return s;
    }

    function findNextCell(b){
      let minLen = 10;
      let nextCell = null;
      for(let r=0;r<9;r++){
        for(let c=0;c<9;c++){
          if(b[r][c]===null){
            const poss = getPossible(b,r,c);
            if(poss.size === 0) return null; 
            if(poss.size < minLen){
              minLen=poss.size;
              nextCell = {r,c, poss};
              if(minLen === 1) return nextCell;
            }
          }
        }
      }
      return nextCell;
    }

    function backtrack(b){
      const next = findNextCell(b);
      if(!next) {
        for(let r=0;r<9;r++){
          for(let c=0;c<9;c++){
            if(b[r][c]===null) return false;
          }
        }
        return true; 
      }
      const {r, c, poss} = next;
      const arrPoss = Array.from(poss);
      for(let val of arrPoss){
        b[r][c] = val;
        if(backtrack(b)) return true;
        b[r][c] = null;
      }
      return false;
    }

    if(backtrack(b)){
      return b;
    }
    return null;
  }

  function displaySolution() {
    if (!currentMode) return;
    clearMessage();
    const userBoard = readCurrentBoard();
    let solvedBoard = solvePuzzle(userBoard);

    if (!solvedBoard) {
      showMessage("This puzzle cannot be solved with current entries.", "#d32f2f");
      solvedBoard = solution;
      let incorrectCount = 0;
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          const userVal = userBoard[r][c];
          const solVal = solvedBoard[r][c];
          if (cells[r][c].readonly) {
            continue;
          }
          if (userVal === null) {
            continue;
          } else if (userVal !== solVal) {
            incorrectCount++;
            const div = sudokuContainer.querySelector(
              `div.cell[data-row="${r}"][data-col="${c}"]`
            );
            if (div) div.classList.add('error'); 
          }
        }
     }
      return;
    }

    let incorrectCount = 0;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const userVal = userBoard[r][c];
        const solVal = solvedBoard[r][c];
        if (cells[r][c].readonly) {
          continue;
        }
        if (userVal === null) {
          setCellValue(r, c, solVal);
        } else if (userVal !== solVal) {
          incorrectCount++;
          const div = sudokuContainer.querySelector(
            `div.cell[data-row="${r}"][data-col="${c}"]`
          );
          if (div) div.classList.add('error');
          setTimeout(() => {
            setCellValue(r, c, solVal);
          }, 2000);
        }
      }
    }
    if(incorrectCount > 0){
      showMessage(`Found and corrected ${incorrectCount} incorrect entries.`, "#d32f2f");
    } else {
      showMessage("Puzzle solved successfully!", "green");
    }
  }

  easyBtn.onclick = () => generatePuzzle('easy');
  mediumBtn.onclick = () => generatePuzzle('medium');
  hardBtn.onclick = () => generatePuzzle('hard');

  hintBtn.onclick = () => {
    if (!currentMode) return;
    showAllHints();
  };

  restartBtn.onclick = () => {
    restartGame();
  };

  newBtn.onclick = () => {
    newGame();
  };

  solutionBtn.onclick = () => {
    displaySolution();
  };

  initCells();
  drawBoard();
  disableAllButtons(false);

  export {
    generatePuzzle,
    showAllHints,
    restartGame,
    displaySolution,
    setCellValue,
    selectCell,
    newGame
  };