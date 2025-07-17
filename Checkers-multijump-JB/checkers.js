          "use strict";

/* author Jacek Byzdra https://www.linkedin.com/in/jacek-byzdra/ */

const boardSize = 8;

            const PIECES = {
                RED: "red",
                WHITE: "white-piece",
                RED_KING: "red-king",
                WHITE_KING: "white-king"
            };

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

            let board;
            let currentPlayer = PIECES.WHITE;
            let capturedPieces = { red: 0, white: 0 };
            let selected = null;
            let highlightedSquares = [];
            let multiJumpInProgress = null;

            const boardContainer = document.getElementById("board");
            const messageEl = document.getElementById("message");
            const capturedInfo = document.getElementById("captured-info");
            const resetBtn = document.getElementById("reset");

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

            const squareAt = (row, col) =>
                boardContainer.querySelector(`.square[data-row="${row}"][data-col="${col}"]`);

            // Add ARIA role gridcell for each square after rendering
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
                capturedPieces = { red: 0, white: 0 };
                renderBoard();
                updateMessage();
                updateCapturedInfo();
                clearHighlight();
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
                        square.tabIndex = -1; // avoid tabbing on all squares for better accessibility
                        if ((parseInt(r) + parseInt(c)) % 2 === 0) {
                            square.classList.add("white");
                        } else {
                            square.classList.add("black");
                            square.addEventListener("click", onSquareClick);
                        }
                        const piece = board[r][c];
                        if (piece) {
                            const pieceEl = document.createElement("div");
                            pieceEl.classList.add("piece");
                            if (piece === PIECES.RED || piece === PIECES.RED_KING) pieceEl.classList.add("red");
                            else pieceEl.classList.add("white-piece");
                            if (isKing(piece)) pieceEl.classList.add("king");
                            pieceEl.addEventListener("click", onPieceClick);
                            pieceEl.tabIndex = 0; // make pieces keyboard focusable
                            pieceEl.setAttribute("role", "button");
                            pieceEl.setAttribute(
                                "aria-label",
                                `${isRed(piece) ? "Red" : "White"}${isKing(piece) ? " king" : ""} piece at row ${r + 1} column ${c + 1}`
                            );
                            pieceEl.addEventListener("keydown", (e) => {
                                // Support Enter or Space key to select pieces for keyboard users
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    onPieceClick(e);
                                }
                            });
                            square.appendChild(pieceEl);
                        }
                        boardContainer.appendChild(square);
                    }
                }
                addAriaToSquares();
            };

            const onPieceClick = (evt) => {
                evt.stopPropagation();
                const sq = evt.target.parentElement;
                const row = Number(sq.dataset.row);
                const col = Number(sq.dataset.col);
                if (isCurrentPlayerPiece(row, col)) {
                    selectPiece(row, col);
                }
            };

            const onSquareClick = (evt) => {
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
                    checkGameOver();
                    return;
                }
                board[toRow][toCol] = piece;
                board[fromRow][fromCol] = null;
                jumpPath.forEach((pos) => {
                    board[pos.row][pos.col] = null;
                    countCapturedPieces();
                    updateCapturedInfo();
                });
                maybeCrownKing(toRow, toCol);
                const jumpedPositionsSet = multiJumpInProgress
                    ? new Set(multiJumpInProgress.jumpedPositions)
                    : new Set();
                jumpPath.forEach((jp) => jumpedPositionsSet.add(`${jp.row},${jp.col}`));
                selected = { row: toRow, col: toCol };
                multiJumpInProgress = {
                    row: toRow,
                    col: toCol,
                    piece,
                    jumpedPositions: jumpedPositionsSet
                };
                clearHighlight();
                const furtherJumps = findPossibleJumps(toRow, toCol, piece, jumpedPositionsSet);
                if (furtherJumps.length > 0) {
                    highlightMultiJumpPaths(furtherJumps);
                } else {
                    multiJumpInProgress = null;
                    selected = null;
                    updateCapturedInfo();
                    swapPlayerAndRender();
                    checkGameOver();
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
            };

            const updateMessage = () => {
                messageEl.innerText = `${currentPlayer === PIECES.RED ? "Red" : "White"}'s turn`;
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
                          [1, 1],
                          [1, -1],
                          [-1, 1],
                          [-1, -1]
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

            const highlightMoves = (row, col) => {
                clearHighlight();
                const piece = board[row][col];
                if (!isKing(piece)) {
                    highlightSimpleMoves(row, col, piece);
                    return;
                }
                const jumpPaths = findKingJumps(row, col, piece, new Set());
                if (jumpPaths.length === 0) {
                    findStraightLineMoves(row, col, piece).forEach(({ row, col }) => highlightSquare(row, col));
                } else if (jumpPaths.length === 1) {
                    highlightJumpPath(jumpPaths[0]);
                } else {
                    const maxLen = Math.max(...jumpPaths.map((p) => p.path.length));
                    const bestPaths = jumpPaths.filter((p) => p.path.length === maxLen);
                    bestPaths.forEach((p) => highlightJumpPath(p));
                }
            };
            const highlightJumpPath = (jumpPath) => {
                if (!jumpPath || !jumpPath.path) return;
                jumpPath.path.forEach(({ row, col }) => highlightSquare(row, col));
            };

            const findKingJumps = (
                row,
                col,
                piece,
                visitedSquares,
                originRow = null,
                originCol = null,
                allowTurn = true
            ) => {
                const directions = [
                    [-1, -1],
                    [-1, 1],
                    [1, -1],
                    [1, 1]
                ];
                let allJumpPaths = [];
                const currentKey = `${row},${col}`;
                if (visitedSquares.has(currentKey)) return [];
                visitedSquares.add(currentKey);
                for (let dirIdx = 0; dirIdx < directions.length; dirIdx++) {
                    const [dr, dc] = directions[dirIdx];
                    let r = parseInt(row) + parseInt(dr);
                    let c = parseInt(col) + parseInt(dc);
                    while (isInBounds(r, c) && board[r][c] === null) {
                        r = parseInt(r) + parseInt(dr);
                        c = parseInt(c) + parseInt(dc);
                    }
                    if (!isInBounds(r, c)) continue;
                    if (
                        isOpponent(board[r][c], piece) &&
                        isInBounds(parseInt(r) + parseInt(dr), parseInt(c) + parseInt(dc)) &&
                        board[parseInt(r) + parseInt(dr)][parseInt(c) + parseInt(dc)] === null
                    ) {
                        let jumpR = parseInt(r) + parseInt(dr);
                        let jumpC = parseInt(c) + parseInt(dc);
                        let landings = [];
                        let lr = jumpR;
                        let lc = jumpC;
                        while (isInBounds(lr, lc) && board[lr][lc] === null) {
                            if (!(lr === originRow && lc === originCol) && !visitedSquares.has(`${lr},${lc}`)) {
                                landings.push({ row: lr, col: lc });
                            }
                            lr = parseInt(lr) + parseInt(dr);
                            lc = parseInt(lc) + parseInt(dc);
                        }
                        for (const landing of landings) {
                            let nextVisited = new Set(visitedSquares);
                            nextVisited.add(`${landing.row},${landing.col}`);
                            const furtherPaths = findKingJumps(
                                landing.row,
                                landing.col,
                                piece,
                                nextVisited,
                                originRow ?? row,
                                originCol ?? col,
                                true
                            );
                            if (furtherPaths.length === 0) {
                                allJumpPaths.push({
                                    path: [landing],
                                    jumped: [{ row: r, col: c }],
                                    origin: { row, col }
                                });
                            } else {
                                for (const fp of furtherPaths) {
                                    allJumpPaths.push({
                                        path: [landing, ...fp.path],
                                        jumped: [{ row: r, col: c }, ...fp.jumped],
                                        origin: { row, col }
                                    });
                                }
                            }
                        }
                    }
                }
                return allJumpPaths;
            };

            const findStraightLineMoves = (row, col, piece) => {
                const directions = [
                    [-1, -1],
                    [-1, 1],
                    [1, -1],
                    [1, 1]
                ];
                let moves = [];
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
                toHighlight.forEach((pos) => highlightSquare(pos.row, pos.col));
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
                const dr = rowDiff > 0 ? 1 : -1;
                const dc = colDiff > 0 ? 1 : -1;
                let r = parseInt(fr) + parseInt(dr);
                let c = parseInt(fc) + parseInt(dc);
                let jumpedPieces = [];
                while (r !== tr && c !== tc) {
                    if (board[r][c]) {
                        if (isOpponent(board[r][c], piece)) {
                            jumpedPieces.push({ row: r, col: c });
                        } else {
                            return null;
                        }
                    }
                    r = parseInt(r) + parseInt(dr);
                    c = parseInt(c) + parseInt(dc);
                }
                return jumpedPieces.length === 1 ? jumpedPieces : null;
            };

            const checkGameOver = () => {
                const redExists = board.flat().some((p) => isRed(p) || p === PIECES.RED_KING);
                const whiteExists = board.flat().some((p) => isWhite(p) || p === PIECES.WHITE_KING);
                if (!redExists) {
                    messageEl.innerText = "White wins!";
                } else if (!whiteExists) {
                    messageEl.innerText = "Red wins!";
                }
            };

            const countCapturedPieces = () => {
                if (currentPlayer === PIECES.WHITE) {
                    capturedPieces.red++;
                } else {
                    capturedPieces.white++;
                }
            };

            const updateCapturedInfo = () => {
                capturedInfo.innerText = `Captured: Red - ${capturedPieces.red} | White - ${capturedPieces.white}`;
            };

            resetBtn.addEventListener("click", () => {
                selected = null;
                multiJumpInProgress = null;
                clearHighlight();
                init();
            });

            // Initialize game
            init();