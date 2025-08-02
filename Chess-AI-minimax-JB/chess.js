(() => {
    "use strict";
    
    /* author Jacek Byzdra https://www.linkedin.com/in/jacek-byzdra/ */
    
    const columns = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const rows = [8, 7, 6, 5, 4, 3, 2, 1];
    const files = "abcdefgh";
    const ranks = "12345678";
    const playerColors = ["white", "black"];
    const whiteSymbols = {
        k: "\u2654", // King 
        q: "\u2655", // Queen 
        r: "\u2656", // Rook 
        b: "\u2657", // Bishop 
        n: "\u2658", // Knight 
        p: "\u2659" // Pawn 
    };
    const blackSymbols = {
        k: "\u265A", // King 
        q: "\u265B", // Queen 
        r: "\u265C", // Rook 
        b: "\u265D", // Bishop 
        n: "\u265E", // Knight 
        p: "\u2659" // Pawn 
    };
    const pieceValue = { p: 100, n: 300, b: 320, r: 500, q: 900, k: 10000 };
    const HIGHLIGHT_MOVE = "highlight-move";
    const HIGHLIGHT_CAPTURE = "highlight-capture";
    const SELECTED_CLASS = "selected";
    const PHASES = { OPENING: "opening", MIDDLE: "middle", END: "end" };
    const directions = {
        rook: [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1]
        ],
        bishop: [
            [1, 1],
            [1, -1],
            [-1, 1],
            [-1, -1]
        ],
        queen: [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
            [1, 1],
            [1, -1],
            [-1, 1],
            [-1, -1]
        ]
    };
    function posToKey(col, row) {
        return columns[col] + rows[row];
    }
    function keyToPos(key) {
        const c = columns.indexOf(key[0]);
        const r = rows.indexOf(parseInt(key[1], 10));
        return [c, r];
    }
    const boardEl = document.getElementById("board-squares");
    const leftRanks = document.getElementById("row-labels-left");
    const rightRanks = document.getElementById("row-labels-right");
    const topCols = document.getElementById("col-labels-top");
    const bottomCols = document.getElementById("col-labels-bottom");
    const infoEl = document.getElementById("info");
    const btnTwoPlayers = document.getElementById("btn-two-players");
    const btnPvAI = document.getElementById("btn-pvAI");
    const btnRestart = document.getElementById("btn-restart");
    const btnNewGame = document.getElementById("btn-new-game");
    const btnUndo = document.getElementById("btn-undo");
    const btnResign = document.getElementById("btn-resign");
    const btnSave = document.getElementById("btn-save");
    const btnLoad = document.getElementById("btn-load");
    const btnHistory = document.getElementById("btn-history");
    const capturedWhiteEl = document.getElementById("captured-white");
    const capturedBlackEl = document.getElementById("captured-black");
    const promotionModal = document.getElementById("promotion-modal");
    const promotionPieces = document.querySelectorAll(".promotion-piece");
    const historyModal = document.getElementById("history-modal");
    const historyText = document.getElementById("history-text");
    const closeHistoryBtn = document.getElementById("close-history");

    const gameState = {
        board: null, 
        turn: "white", 
        mode: null, 
        moveHistory: [], 
        capturedWhite: [], 
        capturedBlack: [], 
        gameOver: false,
        winner: null, 
        moveCounterSincePawnOrCapture: 0, 
        castlingDone: { white: false, black: false }, 
        undoStack: [], 
        promotionPending: null,
        whiteMaterial: 0,
        blackMaterial: 0
    };

    function createEmptyBoard() {
        const board = new Array(8);
        for (let r = 0; r < 8; r++) {
            board[r] = new Array(8).fill(null);
        }
        return board;
    }

    function setupInitialPosition() {
        const board = createEmptyBoard();
        for (let c = 0; c < 8; c++) {
            board[6][c] = { type: "p", color: "white", hasMoved: false, enPassantEligible: false };
        }
        board[7][0] = { type: "r", color: "white", hasMoved: false };
        board[7][1] = { type: "n", color: "white", hasMoved: false };
        board[7][2] = { type: "b", color: "white", hasMoved: false };
        board[7][3] = { type: "q", color: "white", hasMoved: false };
        board[7][4] = { type: "k", color: "white", hasMoved: false };
        board[7][5] = { type: "b", color: "white", hasMoved: false };
        board[7][6] = { type: "n", color: "white", hasMoved: false };
        board[7][7] = { type: "r", color: "white", hasMoved: false };
        for (let c = 0; c < 8; c++) {
            board[1][c] = { type: "p", color: "black", hasMoved: false, enPassantEligible: false };
        }
        board[0][0] = { type: "r", color: "black", hasMoved: false };
        board[0][1] = { type: "n", color: "black", hasMoved: false };
        board[0][2] = { type: "b", color: "black", hasMoved: false };
        board[0][3] = { type: "q", color: "black", hasMoved: false };
        board[0][4] = { type: "k", color: "black", hasMoved: false };
        board[0][5] = { type: "b", color: "black", hasMoved: false };
        board[0][6] = { type: "n", color: "black", hasMoved: false };
        board[0][7] = { type: "r", color: "black", hasMoved: false };
        return board;
    }

    function cloneBoard(board) {
        return board.map((row) =>
            row.map((piece) => {
                if (!piece) return null;
                return { ...piece };
            })
        );
    }

    function cloneGameState(state) {
        return {
            board: cloneBoard(state.board),
            turn: state.turn,
            mode: state.mode,
            moveHistory: state.moveHistory.slice(),
            capturedWhite: state.capturedWhite.slice(),
            capturedBlack: state.capturedBlack.slice(),
            gameOver: state.gameOver,
            winner: state.winner,
            moveCounterSincePawnOrCapture: state.moveCounterSincePawnOrCapture,
            castlingDone: { ...state.castlingDone },
            undoStack: state.undoStack.slice(),
            promotionPending: state.promotionPending ? { ...state.promotionPending } : null,
            whiteMaterial: state.whiteMaterial,
            blackMaterial: state.blackMaterial
        };
    }

    function createEmptyCorner() {
        const el = document.createElement("div");
        el.className = "empty-corner";
        el.style.gridColumn = "span 1";
        el.style.gridRow = "span 1";
        return el;
    }

    function buildBoardUI() {
        boardEl.innerHTML = "";
        boardEl.appendChild(createEmptyCorner());
        for (const f of columns) {
            const elemTop = document.createElement("div");
            elemTop.className = "col-label-top";
            elemTop.textContent = f;
            elemTop.style.gridRow = "span 1";
            boardEl.appendChild(elemTop);
        }
        boardEl.appendChild(createEmptyCorner());

        for (let r = 0; r < 8; r++) {
            const rankNumTopToBottom = 8 - r;
            const lblLeft = document.createElement("div");
            lblLeft.className = "row-label-left";
            lblLeft.textContent = rankNumTopToBottom;
            boardEl.appendChild(lblLeft);

            for (let c = 0; c < 8; c++) {
                const square = document.createElement("div");
                square.classList.add("square"); 
                if ((r + c) % 2 === 0) square.classList.add("light");
                else square.classList.add("dark");
                square.id = `square-${r}-${c}`;
                square.setAttribute("data-row", r);
                square.setAttribute("data-col", c);
                square.setAttribute("tabindex", 0);
                square.setAttribute("role", "button");
                square.setAttribute("aria-label", `Square ${columns[c]}${rows[r]}`);
                square.textContent = "";
                boardEl.appendChild(square);
            }
            const lblRight = document.createElement("div");
            lblRight.className = "row-label-right";
            lblRight.textContent = rankNumTopToBottom;
            boardEl.appendChild(lblRight);
        }
        boardEl.appendChild(createEmptyCorner());
        for (const f of columns) {
            const elemBottom = document.createElement("div");
            elemBottom.className = "col-label-bottom";
            elemBottom.textContent = f;
            elemBottom.style.gridRow = "span 1";
            boardEl.appendChild(elemBottom);
        }
        boardEl.appendChild(createEmptyCorner());
    }

    function renderBoard() {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const square = document.getElementById(`square-${r}-${c}`);
                const piece = gameState.board[r][c];
                if (piece) {
                    if (piece.color === "white") {
                        square.textContent = whiteSymbols[piece.type];
                        square.style.color = "white";
                        square.style.fontWeight = "200";
                        square.classList.remove("empty");
                    } else {
                        square.textContent = blackSymbols[piece.type];
                        square.style.color = "black";
                        square.style.fontWeight = "600";
                        square.classList.remove("empty");
                    }
                } else {
                    square.innerHTML = "";
                    square.textContent = "";
                    square.classList.add("empty");
                    square.style.color = "";
                    square.style.fontWeight = "";
                }
                square.classList.remove(HIGHLIGHT_MOVE, HIGHLIGHT_CAPTURE, SELECTED_CLASS);
            }
        }
    }

    function onBoard(r, c) {
        return r >= 0 && r < 8 && c >= 0 && c < 8;
    }

    function opponent(color) {
        return color === "white" ? "black" : "white";
    }

    function listPieces(color, board) {
        const pieces = [];
        for (let r = 0; r < 8; r++)
            for (let c = 0; c < 8; c++) {
                const p = board[r][c];
                if (p && p.color === color) {
                    pieces.push({ piece: p, pos: [r, c] });
                }
            }
        return pieces;
    }

    function posEquals(a, b) {
        return a[0] === b[0] && a[1] === b[1];
    }

    function posToString([r, c]) {
        return columns[c] + rows[r];
    }

    const knightOffsets = [
        [-2, -1],
        [-2, 1],
        [-1, -2],
        [-1, 2],
        [1, -2],
        [1, 2],
        [2, -1],
        [2, 1]
    ];

    function isSquareAttacked(r, c, attackerColor, board = gameState.board) {
        let dr = attackerColor === "white" ? -1 : 1;
        for (let dc of [-1, 1]) {
            let rr = r + dr,
                cc = c + dc;
            if (onBoard(rr, cc)) {
                const p = board[rr][cc];
                if (p && p.color === attackerColor && p.type === "p") return true;
            }
        }
        
        for (let [dr, dc] of knightOffsets) {
            let rr = r + dr,
                cc = c + dc;
            if (onBoard(rr, cc)) {
                const p = board[rr][cc];
                if (p && p.color === attackerColor && p.type === "n") return true;
            }
        }
        for (let [dr, dc] of directions.bishop) {
            for (let dist = 1; dist < 8; dist++) {
                let rr = r + dr * dist,
                    cc = c + dc * dist;
                if (!onBoard(rr, cc)) break;
                const p = board[rr][cc];
                if (p) {
                    if (p.color === attackerColor && (p.type === "b" || p.type === "q")) return true;
                    break;
                }
            }
        }

        for (let [dr, dc] of directions.rook) {
            for (let dist = 1; dist < 8; dist++) {
                let rr = r + dr * dist,
                    cc = c + dc * dist;
                if (!onBoard(rr, cc)) break;
                const p = board[rr][cc];
                if (p) {
                    if (p.color === attackerColor && (p.type === "r" || p.type === "q")) return true;
                    break;
                }
            }
        }

        for (let rr = r - 1; rr <= r + 1; rr++) {
            for (let cc = c - 1; cc <= c + 1; cc++) {
                if (!onBoard(rr, cc)) continue;
                if (rr === r && cc === c) continue;
                const p = board[rr][cc];
                if (p && p.color === attackerColor && p.type === "k") return true;
            }
        }
        return false;
    }

    function findKing(color, board = gameState.board) {
        for (let r = 0; r < 8; r++)
            for (let c = 0; c < 8; c++) {
                const p = board[r][c];
                if (p && p.color === color && p.type === "k") return [r, c];
            }
        return null;
    }

    function isInCheck(color, board = gameState.board) {
        const kingPos = findKing(color, board);
        if (!kingPos) return false;
        return isSquareAttacked(kingPos[0], kingPos[1], opponent(color), board);
    }

    function moveIsLegal(from, to, board, color, moveDetails = {}) {
        const tempBoard = cloneBoard(board);
        const piece = tempBoard[from[0]][from[1]];
        if (!piece || piece.color !== color) return false;
        tempBoard[to[0]][to[1]] = { ...piece, hasMoved: true };
        tempBoard[from[0]][from[1]] = null;
        if (moveDetails.enPassant) {
            let capRow = color === "white" ? to[0] + 1 : to[0] - 1;
            tempBoard[capRow][to[1]] = null;
        }
        if (moveDetails.castling) {
            let rookFrom, rookTo;
            if (to[1] === 6) {
                rookFrom = [to[0], 7];
                rookTo = [to[0], 5];
            } else if (to[1] === 2) {
                rookFrom = [to[0], 0];
                rookTo = [to[0], 3];
            }
            const rook = tempBoard[rookFrom[0]][rookFrom[1]];
            if (rook && rook.type === "r" && rook.color === color) {
                tempBoard[rookTo[0]][rookTo[1]] = { ...rook, hasMoved: true };
                tempBoard[rookFrom[0]][rookFrom[1]] = null;
            } else {
                return false;
            }
        }
        if (isInCheck(color, tempBoard)) {
            return false;
        }
        return true;
    }

    function generateValidMoves(r, c, board, color) {
        let moves = [];
        const piece = board[r][c];
        if (!piece || piece.color !== color) return moves;
        const oppColor = opponent(color);
        switch (piece.type) {
            case "p": {
                const forward = color === "white" ? -1 : +1;
                const startRow = color === "white" ? 6 : 1;
                const promotionRow = color === "white" ? 0 : 7;
                let fr = r + forward,
                    fc = c;
                if (onBoard(fr, fc) && !board[fr][fc]) {
                    if (fr === promotionRow) {
                        moves.push({ to: [fr, fc], special: "promotion", isCapture: false });
                    } else {
                        moves.push({ to: [fr, fc], special: null, isCapture: false });
                    }
                    if (r === startRow) {
                        let fr2 = r + 2 * forward;
                        if (onBoard(fr2, fc) && !board[fr2][fc]) {
                            moves.push({ to: [fr2, fc], special: null, isCapture: false, doubleStep: true });
                        }
                    }
                }

                for (let dc of [-1, 1]) {
                    let cr = r + forward,
                        cc = c + dc;
                    if (onBoard(cr, cc)) {
                        const target = board[cr][cc];
                        if (target && target.color === oppColor) {
                            if (cr === promotionRow) {
                                moves.push({ to: [cr, cc], special: "promotion", isCapture: true });
                            } else {
                                moves.push({ to: [cr, cc], special: null, isCapture: true });
                            }
                        }
                    }
                }

                for (let dc of [-1, 1]) {
                    let cc = c + dc;
                    if (onBoard(r, cc)) {
                        const adj = board[r][cc];
                        if (adj && adj.color === oppColor && adj.type === "p" && adj.enPassantEligible) {
                            let epRow = r + forward;
                            moves.push({ to: [epRow, cc], special: "enPassant", isCapture: true });
                        }
                    }
                }
                break;
            }
            case "n": {
                for (const [dr, dc] of knightOffsets) {
                    let rr = r + dr,
                        cc = c + dc;
                    if (onBoard(rr, cc)) {
                        const target = board[rr][cc];
                        if (!target) moves.push({ to: [rr, cc], special: null, isCapture: false });
                        else if (target.color !== color) moves.push({ to: [rr, cc], special: null, isCapture: true });
                    }
                }
                break;
            }
            case "b": {
                for (const [dr, dc] of directions.bishop) {
                    for (let dist = 1; dist < 8; dist++) {
                        let rr = r + dr * dist,
                            cc = c + dc * dist;
                        if (!onBoard(rr, cc)) break;
                        const target = board[rr][cc];
                        if (!target) moves.push({ to: [rr, cc], special: null, isCapture: false });
                        else {
                            if (target.color !== color) moves.push({ to: [rr, cc], special: null, isCapture: true });
                            break;
                        }
                    }
                }
                break;
            }
            case "r": {
                for (const [dr, dc] of directions.rook) {
                    for (let dist = 1; dist < 8; dist++) {
                        let rr = r + dr * dist,
                            cc = c + dc * dist;
                        if (!onBoard(rr, cc)) break;
                        const target = board[rr][cc];
                        if (!target) moves.push({ to: [rr, cc], special: null, isCapture: false });
                        else {
                            if (target.color !== color) moves.push({ to: [rr, cc], special: null, isCapture: true });
                            break;
                        }
                    }
                }
                break;
            }
            case "q": {
                for (const [dr, dc] of directions.queen) {
                    for (let dist = 1; dist < 8; dist++) {
                        let rr = r + dr * dist,
                            cc = c + dc * dist;
                        if (!onBoard(rr, cc)) break;
                        const target = board[rr][cc];
                        if (!target) moves.push({ to: [rr, cc], special: null, isCapture: false });
                        else {
                            if (target.color !== color) moves.push({ to: [rr, cc], special: null, isCapture: true });
                            break;
                        }
                    }
                }
                break;
            }
            case "k": {
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        let rr = r + dr,
                            cc = c + dc;
                        if (onBoard(rr, cc)) {
                            const target = board[rr][cc];
                            if (!target) moves.push({ to: [rr, cc], special: null, isCapture: false });
                            else if (target.color !== color)
                                moves.push({ to: [rr, cc], special: null, isCapture: true });
                        }
                    }
                }

                if (!piece.hasMoved && !isInCheck(color)) {
                    if (canCastle(color, "kingside", board)) {
                        let cTo = c + 2;
                        moves.push({ to: [r, cTo], special: "castling", isCapture: false });
                    }
                    if (canCastle(color, "queenside", board)) {
                        let cTo = c - 2;
                        moves.push({ to: [r, cTo], special: "castling", isCapture: false });
                    }
                }
                break;
            }
        }
        let legalMoves = [];
        for (let move of moves) {
            if (moveIsLegal([r, c], move.to, board, color, move)) {
                legalMoves.push(move);
            }
        }
        return legalMoves;
    }

    function canCastle(color, side, board) {
        const row = color === "white" ? 7 : 0;
        const king = board[row][4];
        if (!king || king.type !== "k" || king.hasMoved) return false;
        const rookCol = side === "kingside" ? 7 : 0;
        const rook = board[row][rookCol];
        if (!rook || rook.type !== "r" || rook.color !== color || rook.hasMoved) return false;
        if (side === "kingside") {
            if (board[row][5] || board[row][6]) return false;
        } else {
            if (board[row][1] || board[row][2] || board[row][3]) return false;
        }

        const passThroughCols = side === "kingside" ? [5, 6] : [3, 2];
        for (let c of passThroughCols) {
            if (isSquareAttacked(row, c, opponent(color), board)) return false;
        }
        return true;
    }

    let selectedSquare = null;
    let legalMovesForSelected = [];
    function highlightMoves() {
        clearHighlights();
        if (!selectedSquare) return;
        const from = selectedSquare;
        const selDot = document.getElementById(`square-${from[0]}-${from[1]}`);
        if (selDot) selDot.classList.add(SELECTED_CLASS);
        legalMovesForSelected.forEach((mv) => {
            const square = document.getElementById(`square-${mv.to[0]}-${mv.to[1]}`);
            if (square) {
                if (mv.isCapture) square.classList.add(HIGHLIGHT_CAPTURE);
                else square.classList.add(HIGHLIGHT_MOVE);
            }
        });
    }
    function clearHighlights() {
        for (let r = 0; r < 8; r++)
            for (let c = 0; c < 8; c++) {
                const sq = document.getElementById(`square-${r}-${c}`);
                sq.classList.remove(HIGHLIGHT_MOVE, HIGHLIGHT_CAPTURE, SELECTED_CLASS);
            }
    }
    function onSquareClick(e) {
        if (gameState.gameOver) return;
        const el = e.currentTarget;
        const r = parseInt(el.getAttribute("data-row"));
        const c = parseInt(el.getAttribute("data-col"));
        const piece = gameState.board[r][c];
        const player = gameState.turn;
        if (gameState.promotionPending) return;
        if (selectedSquare) {
            const mv = legalMovesForSelected.find((m) => m.to[0] === r && m.to[1] === c);
            if (mv) {
                applyMove(selectedSquare, [r, c], mv);
                selectedSquare = null;
                legalMovesForSelected = [];
                clearHighlights();
                return;
            }
            if (piece && piece.color === player) {
                selectedSquare = [r, c];
                legalMovesForSelected = generateValidMoves(r, c, gameState.board, player);
                highlightMoves();
                return;
            }
            selectedSquare = null;
            legalMovesForSelected = [];
            clearHighlights();
        } else {
            if (piece && piece.color === player) {
                selectedSquare = [r, c];
                legalMovesForSelected = generateValidMoves(r, c, gameState.board, player);
                highlightMoves();
            }
        }
    }

    function applyMove(from, to, move) {
        addUndo();
        let board = gameState.board;
        let piece = board[from[0]][from[1]];
        if (!piece) {
            alert("Error: No piece to move.");
            return;
        }
        const color = piece.color;
        if (piece.type === "p" || move.isCapture) {
            gameState.moveCounterSincePawnOrCapture = 0;
        } else {
            gameState.moveCounterSincePawnOrCapture++;
        }
        board[from[0]][from[1]] = null;
        if (move.special === "enPassant") {
            let capRow = color === "white" ? to[0] + 1 : to[0] - 1;
            let capturedPawn = board[capRow][to[1]];
            if (capturedPawn && capturedPawn.color !== color && capturedPawn.type === "p") {
                board[capRow][to[1]] = null;
                recordCapture(capturedPawn);
            }
        }
        else if (move.isCapture) {
            const captured = board[to[0]][to[1]];
            if (captured) {
                recordCapture(captured);
            }
        }

        board[to[0]][to[1]] = { ...piece, hasMoved: true, enPassantEligible: false };
        if (piece.type === "p" && move.doubleStep) {
            board[to[0]][to[1]].enPassantEligible = true;
        }
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = board[r][c];
                if (p && p.color === color && p.type === "p" && (r !== to[0] || c !== to[1])) {
                    p.enPassantEligible = false;
                }
            }
        }
        if (move.special === "castling") {
            const row = to[0];
            if (to[1] === 6) {
                const rook = board[row][7];
                board[row][7] = null;
                board[row][5] = { ...rook, hasMoved: true };
            } else if (to[1] === 2) {
                const rook = board[row][0];
                board[row][0] = null;
                board[row][3] = { ...rook, hasMoved: true };
            }
            gameState.castlingDone[color] = true;
        }
        if (piece.type === "k") {
            gameState.castlingDone[color] = true;
        }
        if (piece.type === "r" && (from[1] === 0 || from[1] === 7)) {
            if (from[0] === (color === "white" ? 7 : 0)) {
                gameState.castlingDone[color] = true;
            }
        }
        if (move.special === "promotion") {
            gameState.promotionPending = { position: to, color: color, from: from, to: to };
            renderBoard();
            renderCapturedPieces();
            updateInfo(`Pawn promotion: Choose piece to promote for ${color}`);
            showPromotionModal(color);
            return;
        }
        gameState.promotionPending = null;
        recordMove(from, to, piece, move);
        gameState.turn = opponent(color);
        for (let r2 = 0; r2 < 8; r2++)
            for (let c2 = 0; c2 < 8; c2++) {
                const pi = board[r2][c2];
                if (pi && pi.color === gameState.turn && pi.type === "p") {
                    pi.enPassantEligible = false;
                }
            }

        checkEndConditions();
        renderBoard();
        renderCapturedPieces();
        updateInfo();
        btnUndo.disabled = false;
        btnHistory.disabled = false;
        btnResign.disabled = false;
        btnSave.disabled = true;
        if (gameState.mode === "playerVsAI" && gameState.turn === "black" && !gameState.gameOver) {
            setTimeout(aiMakeMove, 200);
        }
    }
    function showPromotionModal(color) {
        promotionModal.style.display = "flex";
        function onSelectPiece(evt) {
            const choice = evt.target.dataset.piece;
            if (choice && gameState.promotionPending) {
                const board = gameState.board;
                const { position, from, to } = gameState.promotionPending;
                board[position[0]][position[1]] = { type: choice, color: color, hasMoved: true };
                recordPromotion(from, to, color, choice);
                gameState.promotionPending = null;
                promotionModal.style.display = "none";
                gameState.turn = opponent(color);
                checkEndConditions();
                renderBoard();
                renderCapturedPieces();
                updateInfo();
                btnUndo.disabled = false;
                btnHistory.disabled = false;
                btnResign.disabled = false;
                btnSave.disabled = true;
                if (gameState.mode === "playerVsAI" && gameState.turn === "black" && !gameState.gameOver) {
                    setTimeout(aiMakeMove, 200);
                }
                promotionPieces.forEach((p) => p.removeEventListener("click", onSelectPiece));
            }
        }
        promotionPieces.forEach((p) => p.addEventListener("click", onSelectPiece));
    }

    function recordCapture(piece) {
        const arr = piece.color === "white" ? gameState.capturedBlack : gameState.capturedWhite;
        arr.push(piece);
    }

    function renderCapturedPieces() {
        capturedWhiteEl.innerHTML = "";
        for (const p of gameState.capturedWhite) {
            let symbol = p.color === "white" ? whiteSymbols[p.type] : blackSymbols[p.type];
            const span = document.createElement("span");
            span.textContent = symbol;
            span.style.color = p.color === "white" ? "#fff" : "#fff";
            span.title = `${p.color} ${p.type}`;
            capturedWhiteEl.appendChild(span);
        }
        capturedBlackEl.innerHTML = "";
        for (const p of gameState.capturedBlack) {
            let symbol = p.color === "white" ? whiteSymbols[p.type] : blackSymbols[p.type];
            const span = document.createElement("span");
            span.textContent = symbol;
            span.style.color = p.color === "white" ? "#fff" : "#fff";
            span.title = `${p.color} ${p.type}`;
            capturedBlackEl.appendChild(span);
        }
    }
    renderCapturedPieces();

    function formatMove(from, to, piece, move) {
        const pNotation = piece.type === "p" ? "" : piece.type.toUpperCase();
        const isCapture = move.isCapture || move.special === "enPassant";
        const fromPos = posToString(from);
        const toPos = posToString(to);
        let notation = "";
        if (move.special === "castling") {
            notation = to[1] === 6 ? "O-O" : "O-O-O";
        } else if (move.special === "promotion") {
            const promo = move.promotion || "Q";
            notation = `${fromPos}${isCapture ? "x" : "-"}${toPos}=${promo.toUpperCase()}`;
        } else {
            notation = `${pNotation}${isCapture ? "x" : "-"}${toPos}`;
        }
        return notation;
    }

    function recordMove(from, to, piece, move) {
        const notation = formatMove(from, to, piece, move);
        const check = isInCheck(opponent(piece.color)) ? "check" : null;
        const checkmate = isCheckmate(opponent(piece.color));
        const stalemate = isStalemate(opponent(piece.color));
        const moveRecord = {
            from,
            to,
            piece,
            move,
            notation,
            check: check,
            checkmate: checkmate,
            stalemate: stalemate
        };
        gameState.moveHistory.push(moveRecord);
    }

    function recordPromotion(from, to, color, promoPieceType) {
        let basePiece = { type: "p", color: color };
        const moveObj = { to: to, special: "promotion", promotion: promoPieceType, isCapture: false };
        const notation = formatMove(from, to, basePiece, moveObj);
        const check = isInCheck(opponent(color)) ? "check" : null;
        const checkmate = isCheckmate(opponent(color));
        const stalemate = isStalemate(opponent(color));
        const moveRecord = {
            from,
            to,
            piece: { type: promoPieceType, color: color },
            move: moveObj,
            notation,
            check: check,
            checkmate: checkmate,
            stalemate: stalemate
        };
        gameState.moveHistory.push(moveRecord);
    }

    function getMoveHistoryText() {
        let result = "";
        for (let i = 0; i < gameState.moveHistory.length; i++) {
            const moveNo = Math.floor(i / 2) + 1;
            if (i % 2 === 0) result += `${moveNo}. `;
            const mv = gameState.moveHistory[i];
            result += mv.notation;
            if (mv.checkmate) result += "#";
            else if (mv.check) result += "+";
            result += " ";
            if (i % 2 === 1) result += "\n";
        }
        return result;
    }

    function addUndo() {
        if (gameState.undoStack.length >= 20) gameState.undoStack.shift();
        gameState.undoStack.push(cloneGameState(gameState));
    }

    function undoMove() {
        if (gameState.undoStack.length === 0) return;
        const undoingPlayer = gameState.turn;
        for (let i = gameState.undoStack.length - 1; i >= 0; i--) {
            let prev = gameState.undoStack[i];
            if (prev.turn === undoingPlayer) {
                Object.assign(gameState, cloneGameState(prev));
                gameState.undoStack.splice(i);
                renderBoard();
                renderCapturedPieces();
                updateInfo("Undo completed.");
                btnUndo.disabled = true;
                btnHistory.disabled = false;
                btnResign.disabled = false;
                btnSave.disabled = true;
                clearHighlights();
                selectedSquare = null;
                legalMovesForSelected = [];
                return;
            }
        }
        updateInfo("No undo available.");
    }
    btnUndo.addEventListener("click", undoMove);

    btnResign.addEventListener("click", () => {
        if (gameState.gameOver) return;
        const loser = gameState.turn;
        const winner = opponent(loser);
        endGame(winner, `${capitalize(loser)} resigned. ${capitalize(winner)} wins.`);
    });

    function exportGameState() {
        return {
            board: serializeBoard(gameState.board),
            turn: gameState.turn,
            mode: gameState.mode,
            moveHistory: gameState.moveHistory.map((m) => ({
                from: m.from,
                to: m.to,
                piece: m.piece,
                notation: m.notation,
                move: m.move,
                check: m.check,
                checkmate: m.checkmate,
                stalemate: m.stalemate
            })),
            capturedWhite: gameState.capturedWhite,
            capturedBlack: gameState.capturedBlack,
            gameOver: gameState.gameOver,
            winner: gameState.winner,
            moveCounterSincePawnOrCapture: gameState.moveCounterSincePawnOrCapture,
            castlingDone: gameState.castlingDone
        };
    }

    function serializeBoard(board) {
        return board.map((row) =>
            row.map((p) => {
                if (!p) return null;
                return `${p.type}_${p.color}${p.hasMoved ? "_m" : ""}${p.enPassantEligible ? "_e" : ""}`;
            })
        );
    }

    function deserializeBoard(array) {
        return array.map((row) =>
            row.map((s) => {
                if (!s) return null;
                let [type, color, flag1, flag2] = s.split("_");
                const hasMoved = flag1 === "m";
                const enPassantEligible = flag1 === "e" || flag2 === "e";
                return { type, color, hasMoved: !!hasMoved, enPassantEligible: !!enPassantEligible };
            })
        );
    }

    function importGameState(obj) {
        if (!obj) return;
        gameState.board = deserializeBoard(obj.board);
        gameState.turn = obj.turn;
        gameState.mode = obj.mode;
        gameState.moveHistory = obj.moveHistory || [];
        gameState.capturedWhite = obj.capturedWhite || [];
        gameState.capturedBlack = obj.capturedBlack || [];
        gameState.gameOver = obj.gameOver;
        gameState.winner = obj.winner;
        gameState.moveCounterSincePawnOrCapture = obj.moveCounterSincePawnOrCapture || 0;
        gameState.castlingDone = obj.castlingDone || { white: false, black: false };
        gameState.undoStack = [];
        gameState.promotionPending = null;
        selectedSquare = null;
        legalMovesForSelected = [];
        renderBoard();
        renderCapturedPieces();
        updateInfo();
        btnNewGame.disabled = false;
        btnUndo.disabled = false;
        btnResign.disabled = false;
        btnSave.disabled = false;
        btnHistory.disabled = false;
    }

    btnHistory.addEventListener("click", () => {
        historyText.textContent = getMoveHistoryText();
        historyModal.style.display = "flex";
        historyContentFocus();
    });
    closeHistoryBtn.addEventListener("click", () => {
        historyModal.style.display = "none";
    });
    function historyContentFocus() {
        closeHistoryBtn.focus();
    }

    historyModal.addEventListener("click", (e) => {
        if (e.target === historyModal) {
            historyModal.style.display = "none";
        }
    });

    function initGame(mode) {
        gameState.board = setupInitialPosition();
        gameState.turn = "white";
        gameState.mode = mode;
        gameState.moveHistory = [];
        gameState.capturedWhite = [];
        gameState.capturedBlack = [];
        gameState.gameOver = false;
        gameState.winner = null;
        gameState.moveCounterSincePawnOrCapture = 0;
        gameState.castlingDone = { white: false, black: false };
        gameState.undoStack = [];
        gameState.promotionPending = null;
        selectedSquare = null;
        legalMovesForSelected = [];
        renderBoard();
        renderCapturedPieces();
        updateInfo();
        btnNewGame.disabled = false;
        btnUndo.disabled = true;
        btnResign.disabled = false;
        btnSave.disabled = false;
        btnHistory.disabled = false;
    }

    function capitalize(str) {
        if (!str) return "";
        return str[0].toUpperCase() + str.slice(1);
    }

    function updateInfo(message) {
        if (message) {
            infoEl.textContent = message;
            return;
        }
        if (gameState.gameOver) {
            if (gameState.winner === "draw") {
                infoEl.textContent = "Game ended in a Draw";
            } else if (gameState.winner) {
                infoEl.textContent = `${capitalize(gameState.winner)} wins! Game over.`;
            } else {
                infoEl.textContent = "Game over.";
            }
            return;
        }
        let turn = capitalize(gameState.turn);
        let checkText = "";
        if (isInCheck(gameState.turn)) {
            checkText = " - Check!";
        }
        const whiteCapturedCount = gameState.capturedWhite.length;
        const blackCapturedCount = gameState.capturedBlack.length;
        infoEl.textContent = `${turn}'s turn${checkText} | Captured pieces - White: ${whiteCapturedCount} Black: ${blackCapturedCount}`;
    }

    btnTwoPlayers.addEventListener("click", () => {
        initGame("twoPlayers");
        addBoardListeners();
        updateInfo("Two Players mode started. White moves first.");
        btnTwoPlayers.disabled = true;
        btnPvAI.disabled = true;
    });
    btnPvAI.addEventListener("click", () => {
        initGame("playerVsAI");
        addBoardListeners();
        updateInfo("Player vs AI mode started. White moves first.");
        btnTwoPlayers.disabled = true;
        btnPvAI.disabled = true;
    });
    btnRestart.addEventListener("click", () => {
        gameState.mode = null;
        gameState.gameOver = false;
        gameState.winner = null;
        gameState.moveHistory = [];
        gameState.capturedWhite = [];
        gameState.capturedBlack = [];
        gameState.undoStack = [];
        gameState.promotionPending = null;
        selectedSquare = null;
        legalMovesForSelected = [];
        boardEl.innerHTML = "";
        buildBoardUI();
        initGame();
        updateInfo("Game restarted. Please select mode.");
        btnNewGame.disabled = true;
        btnUndo.disabled = true;
        btnResign.disabled = true;
        btnSave.disabled = true;
        btnHistory.disabled = true;

        btnTwoPlayers.disabled = false;
        btnPvAI.disabled = false;
    });
    btnNewGame.addEventListener("click", () => {
        if (!gameState.mode) return;
        addBoardListeners();
        initGame(gameState.mode);
    });
    
    function isCheckmate(color) {
        if (!isInCheck(color)) return false;
        const moves = allLegalMoves(color);
        return moves.length === 0;
    }

    function isStalemate(color) {
        if (isInCheck(color)) return false;
        const moves = allLegalMoves(color);
        return moves.length === 0;
    }

    function allLegalMoves(color) {
        let moves = [];
        for (let r = 0; r < 8; r++)
            for (let c = 0; c < 8; c++) {
                const p = gameState.board[r][c];
                if (p && p.color === color) {
                    const valid = generateValidMoves(r, c, gameState.board, color);
                    for (const mv of valid) {
                        if (moveIsLegal([r, c], mv.to, gameState.board, color, mv)) {
                            moves.push({ from: [r, c], to: mv.to, move: mv });
                        }
                    }
                }
            }
        return moves;
    }

    function materialValue(color, board = gameState.board) {
        let total = 0;
        for (let r = 0; r < 8; r++)
            for (let c = 0; c < 8; c++) {
                const p = board[r][c];
                if (p && p.color === color) {
                    total += pieceValue[p.type] || 0;
                }
            }
        return total;
    }

    function countPieces(color, board = gameState.board) {
        let count = 0;
        let knights = 0;
        let bishops = 0;
        for (let r = 0; r < 8; r++)
            for (let c = 0; c < 8; c++) {
                const p = board[r][c];
                if (p && p.color === color) {
                    if (p.type !== "k") {
                        count++;
                        if (p.type === "n") knights++;
                        else if (p.type === "b") bishops++;
                    }
                }
            }
        return { count, knights, bishops };
    }

    function insufficientMaterial() {
        let white = countPieces("white");
        let black = countPieces("black");
        if (white.count === 0 && black.count === 0) return true;
        if (
            (white.count === 1 && white.bishops === 1 && black.count === 0) ||
            (black.count === 1 && black.bishops === 1 && white.count === 0)
        )
            return true;
        if (
            (white.count === 1 && white.knights === 1 && black.count === 0) ||
            (black.count === 1 && black.knights === 1 && white.count === 0)
        )
            return true;
        return false;
    }

    function checkDrawConditions() {
        if (gameState.moveCounterSincePawnOrCapture >= 50) {
            endGame("draw", "Draw by 50-move rule.");
            return true;
        }
        if (insufficientMaterial()) {
            endGame("draw", "Draw by insufficient material.");
            return true;
        }
        return false;
    }

    function checkEndConditions() {
        if (gameState.gameOver) return;
        if (isCheckmate(gameState.turn)) {
            endGame(opponent(gameState.turn), `Checkmate! ${capitalize(opponent(gameState.turn))} wins.`);
            return;
        }
        if (isStalemate(gameState.turn)) {
            endGame("draw", "Stalemate - game is a draw.");
            return;
        }
        if (checkDrawConditions()) return;
    }

    function endGame(winner, msg) {
        gameState.gameOver = true;
        gameState.winner = winner;
        updateInfo(msg);
        btnUndo.disabled = true;
        btnResign.disabled = true;
        btnNewGame.disabled = false;
        btnSave.disabled = true;
    }

    function aiMakeMove() {
        if (gameState.gameOver) return;
        updateInfo("AI is thinking...");
        setTimeout(() => {
            const bestMove = findBestMove(gameState, 3);
            if (bestMove) {
                applyMove(bestMove.from, bestMove.to, bestMove.move);
                updateInfo("AI made a move.");
            } else {
                updateInfo("AI has no legal moves. Stalemate or checkmate.");
                checkEndConditions();
            }
        }, 100);
    }

    function findBestMove(state, depth) {
        let bestVal = -Infinity;
        let alpha = -Infinity;
        let beta = Infinity;
        let bestMove = null;
        const moves = generateAllMoves(state, "black");
        for (let move of moves) {
            let newState = makeMoveOnClone(state, move);
            let moveVal = minimax(newState, depth - 1, alpha, beta, false);
            if (moveVal > bestVal) {
                bestVal = moveVal;
                bestMove = move;
            }
            alpha = Math.max(alpha, bestVal);
            if (beta <= alpha) break;
        }
        return bestMove;
    }

    function minimax(state, depth, alpha, beta, maximizingPlayer) {
        if (depth === 0 || state.gameOver) {
            return evaluateBoard(state);
        }
        let color = maximizingPlayer ? "black" : "white";
        const moves = generateAllMoves(state, color);
        if (maximizingPlayer) {
            let maxEval = -Infinity;
            for (let move of moves) {
                let newState = makeMoveOnClone(state, move);
                let evalScore = minimax(newState, depth - 1, alpha, beta, false);
                maxEval = Math.max(maxEval, evalScore);
                alpha = Math.max(alpha, evalScore);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (let move of moves) {
                let newState = makeMoveOnClone(state, move);
                let evalScore = minimax(newState, depth - 1, alpha, beta, true);
                minEval = Math.min(minEval, evalScore);
                beta = Math.min(beta, evalScore);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    function generateAllMoves(state, color) {
        let moves = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = state.board[r][c];
                if (p && p.color === color) {
                    const valid = generateValidMoves(r, c, state.board, color);
                    for (let mv of valid) {
                        if (moveIsLegal([r, c], mv.to, state.board, color, mv)) {
                            moves.push({ from: [r, c], to: mv.to, move: mv });
                        }
                    }
                }
            }
        }
        return moves;
    }

    function makeMoveOnClone(oldState, move) {
        const state = cloneGameState(oldState);
        const { from, to, move: mv } = move;
        const piece = state.board[from[0]][from[1]];
        state.board[from[0]][from[1]] = null;
        if (mv.special === "enPassant") {
            const capRow = piece.color === "white" ? to[0] + 1 : to[0] - 1;
            state.board[capRow][to[1]] = null;
        }
        else if (mv.isCapture) {
            state.board[to[0]][to[1]] = null;
        }
        state.board[to[0]][to[1]] = { ...piece, hasMoved: true, enPassantEligible: false };
        if (piece.type === "p" && mv.doubleStep) {
            state.board[to[0]][to[1]].enPassantEligible = true;
        }
        for (let r = 0; r < 8; r++)
            for (let c = 0; c < 8; c++) {
                const pi = state.board[r][c];
                if (pi && pi.color === piece.color && pi.type === "p" && (r !== to[0] || c !== to[1])) {
                    pi.enPassantEligible = false;
                }
            }
        if (mv.special === "castling") {
            const row = to[0];
            if (to[1] === 6) {
                const rook = state.board[row][7];
                state.board[row][7] = null;
                state.board[row][5] = { ...rook, hasMoved: true };
            } else if (to[1] === 2) {
                const rook = state.board[row][0];
                state.board[row][0] = null;
                state.board[row][3] = { ...rook, hasMoved: true };
            }
            state.castlingDone[piece.color] = true;
        }

        if (mv.special === "promotion") {
            state.board[to[0]][to[1]] = { type: "q", color: piece.color, hasMoved: true };
        }
        state.turn = piece.color === "white" ? "black" : "white";
        if (isCheckmate(state.turn)) {
            state.gameOver = true;
            state.winner = piece.color;
        } else if (isStalemate(state.turn)) {
            state.gameOver = true;
            state.winner = "draw";
        } else if (insufficientMaterial()) {
            state.gameOver = true;
            state.winner = "draw";
        }
        return state;
    }

    function findPawnMovesForBoard(board, r, c, color) {
        let moves = [];
        const piece = board[r][c];
        if (!piece || piece.color !== color) return moves;
        const oppColor = opponent(color);
        const forward = color === "white" ? -1 : +1;
        const startRow = color === "white" ? 6 : 1;
        const promotionRow = color === "white" ? 0 : 7;
        let fr = r + forward,
            fc = c;
        if (onBoard(fr, fc) && !board[fr][fc]) {
            if (fr === promotionRow) {
                moves.push({ to: [fr, fc], special: "promotion", isCapture: false });
            } else {
                moves.push({ to: [fr, fc], special: null, isCapture: false });
            }
            if (r === startRow) {
                let fr2 = r + 2 * forward;
                if (onBoard(fr2, fc) && !board[fr2][fc]) {
                    moves.push({ to: [fr2, fc], special: null, isCapture: false, doubleStep: true });
                }
            }
        }
        for (let dc of [-1, 1]) {
            let cr = r + forward,
                cc = c + dc;
            if (onBoard(cr, cc)) {
                const target = board[cr][cc];
                if (target && target.color === oppColor) {
                    if (cr === promotionRow) {
                        moves.push({ to: [cr, cc], special: "promotion", isCapture: true });
                    } else {
                        moves.push({ to: [cr, cc], special: null, isCapture: true });
                    }
                }
            }
        }

        for (let dc of [-1, 1]) {
            let cc = c + dc;
            if (onBoard(r, cc)) {
                const adj = board[r][cc];
                if (adj && adj.color === oppColor && adj.type === "p" && adj.enPassantEligible) {
                    let epRow = r + forward;
                    moves.push({ to: [epRow, cc], special: "enPassant", isCapture: true });
                }
            }
        }

        return moves;
    }
    function findKnightMovesForBoard(board, r, c, color) {
        let moves = [];
        const piece = board[r][c];
        if (!piece || piece.color !== color) return moves;
        const oppColor = opponent(color);
        for (const [dr, dc] of knightOffsets) {
            let rr = r + dr,
                cc = c + dc;
            if (onBoard(rr, cc)) {
                const target = board[rr][cc];
                if (!target) moves.push({ to: [rr, cc], special: null, isCapture: false });
                else if (target.color !== color) moves.push({ to: [rr, cc], special: null, isCapture: true });
            }
        }
        return moves;
    }
    function findBishopMovesForBoard(board, r, c, color) {
        let moves = [];
        const piece = board[r][c];
        if (!piece || piece.color !== color) return moves;
        const oppColor = opponent(color);
        for (const [dr, dc] of directions.bishop) {
            for (let dist = 1; dist < 8; dist++) {
                let rr = r + dr * dist,
                    cc = c + dc * dist;
                if (!onBoard(rr, cc)) break;
                const target = board[rr][cc];
                if (!target) moves.push({ to: [rr, cc], special: null, isCapture: false });
                else {
                    if (target.color !== color) moves.push({ to: [rr, cc], special: null, isCapture: true });
                    break;
                }
            }
        }
        return moves;
    }

    function findRookMovesForBoard(board, r, c, color) {
        let moves = [];
        const piece = board[r][c];
        if (!piece || piece.color !== color) return moves;
        const oppColor = opponent(color);
        for (const [dr, dc] of directions.rook) {
            for (let dist = 1; dist < 8; dist++) {
                let rr = r + dr * dist,
                    cc = c + dc * dist;
                if (!onBoard(rr, cc)) break;
                const target = board[rr][cc];
                if (!target) moves.push({ to: [rr, cc], special: null, isCapture: false });
                else {
                    if (target.color !== color) moves.push({ to: [rr, cc], special: null, isCapture: true });
                    break;
                }
            }
        }
        return moves;
    }

    function findQueenMovesForBoard(board, r, c, color) {
        let moves = [];
        const piece = board[r][c];
        if (!piece || piece.color !== color) return moves;
        const oppColor = opponent(color);
        for (const [dr, dc] of directions.queen) {
            for (let dist = 1; dist < 8; dist++) {
                let rr = r + dr * dist,
                    cc = c + dc * dist;
                if (!onBoard(rr, cc)) break;
                const target = board[rr][cc];
                if (!target) moves.push({ to: [rr, cc], special: null, isCapture: false });
                else {
                    if (target.color !== color) moves.push({ to: [rr, cc], special: null, isCapture: true });
                    break;
                }
            }
        }
        return moves;
    }

    function findKingMovesForBoard(board, r, c, color) {
        let moves = [];
        const piece = board[r][c];
        if (!piece || piece.color !== color) return moves;
        const oppColor = opponent(color);
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                let rr = r + dr,
                    cc = c + dc;
                if (onBoard(rr, cc)) {
                    const target = board[rr][cc];
                    if (!target) moves.push({ to: [rr, cc], special: null, isCapture: false });
                    else if (target.color !== color) moves.push({ to: [rr, cc], special: null, isCapture: true });
                }
            }
        }

        if (!piece.hasMoved && !isInCheck(color)) {
            if (canCastle(color, "kingside", board)) {
                let cTo = c + 2;
                moves.push({ to: [r, cTo], special: "castling", isCapture: false });
            }
            if (canCastle(color, "queenside", board)) {
                let cTo = c - 2;
                moves.push({ to: [r, cTo], special: "castling", isCapture: false });
            }
        }
        return moves;
    }

    function evaluateCenterControl(boardInst, aiColor) {
        let score = 0;
        const centerSquares = [
            [3, 3],
            [3, 4],
            [4, 3],
            [4, 4]
        ];
        centerSquares.forEach(([r, c]) => {
            const piece = gameState.board[r][c];
            if (piece) {
                if (piece.color === aiColor) score += 5;
                else score -= 5;
            }
        });

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const pc = gameState.board[r][c];
                if (!pc) continue;
                const attackingColor = pc.color;
                const moves = generateMovesForAttack(gameState.board, r, c);
                moves.forEach((mv) => {
                    for (const [cr, cc] of centerSquares) {
                        if (mv[0] === cr && mv[1] === cc) {
                            const occupant = gameState.board[cr][cc];
                            if (occupant) {
                                if (attackingColor === aiColor && occupant.color !== aiColor) score += 6;
                                if (attackingColor !== aiColor && occupant.color === aiColor) score -= 6;
                            }
                        }
                    }
                });
            }
        }
        return score;
    }

    function evaluateControlOfSpace(boardInst, aiColor) {
        let score = 0;

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const pc = gameState.board[r][c];
                if (!pc) continue;
                const attackingColor = pc.color;
                const moves = generateMovesForAttack(gameState.board, r, c);
                moves.forEach((mv) => {
                    if (attackingColor === aiColor && occupant.color !== aiColor) score += 2;
                    if (attackingColor !== aiColor && occupant.color === aiColor) score -= 2;
                });
            }
        }
        return score;
    }

    function generateMovesForAttack(boardInst, r, c) {
        const pc = boardInst[r][c];
        if (!pc) return [];
        switch (pc.type) {
            case "p":
                return findPawnMovesForBoard(boardInst, r, c, pc).map((m) => m.to);
            case "n":
                return findKnightMovesForBoard(boardInst, r, c, pc).map((m) => m.to);
            case "b":
                return findBishopMovesForBoard(boardInst, r, c, pc).map((m) => m.to);
            case "r":
                return findRookMovesForBoard(boardInst, r, c, pc).map((m) => m.to);
            case "q":
                return findQueenMovesForBoard(boardInst, r, c, pc).map((m) => m.to);
            case "k":
                return findKingMovesForBoard(boardInst, r, c, pc).map((m) => m.to);
            default:
                return [];
        }
    }

    function evaluateBoard(state) {
        const board = state.board;
        const phase = getGamePhase(state);
        let score = 0;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = board[r][c];
                if (p) {
                    let val = pieceValue[p.type];
                    const pstVal = getPieceSquareValue(p.type, r, c, p.color, phase);
                    if (p.color === "black") {
                        score += val + pstVal;
                    } else {
                        score -= val + pstVal;
                    }
                }
            }
        }
        score += evaluateCenterControl(board, "black");
        score -= evaluateCenterControl(board, "white");

        score += evaluateControlOfSpace(board, "black");
        score -= evaluateControlOfSpace(board, "white");

        if (isInCheck("white", board)) {
            score += 50;
        }
        if (isInCheck("black", board)) {
            score -= 50;
        }
        if (state.castlingDone.white) {
            score += 5;
        }
        if (state.castlingDone.black) {
            score -= 5;
        }
        if (state.gameOver) {
            if (state.winner === "black") {
                score += 10000;
            } else if (state.winner === "white") {
                score -= 10000;
            }
        }
        return score;
    }
    
    function getGamePhase(state) {
        const movesPlayed = state.moveHistory.length;
        if (state.castlingDone.white || state.castlingDone.black) return PHASES.MIDDLE;
        if (movesPlayed >= 20) return PHASES.MIDDLE;
        const whiteMaterial = materialValue("white", state.board);
        const blackMaterial = materialValue("black", state.board);
        if (whiteMaterial <= 1300 || blackMaterial <= 1300) return PHASES.END;
        return PHASES.OPENING;
    }

    const PST_OPENING_PAWN = [
        0, 0, 0, 0, 0, 0, 0, 0, -5, 31, 45, 68, 68, 45, 31, -5, -20, 0, 10, 51, 48, 10, 0, -20, -22, -2, 8, 49, 48, 8,
        -2, -22, -25, -3, 6, 45, 47, 6, 3, -25, -30, -5, 5, 25, 25, 5, -5, -30, 5, 13, 13, -19, -19, 11, 12, 6, 0, 0, 0,
        0, 0, 0, 0, 0
    ];
    const PST_OPENING_KNIGHT = [
        -37, -60, -45, -44, -43, -45, -60, -35, -58, -2, -2, -2, -2, -2, -2, -60, -42, -2, 38, 38, 38, 38, -2, -44, -42,
        -2, 19, 38, 38, 19, -2, -43, -48, -2, 19, 38, 38, 19, -2, -42, -46, -2, 19, 19, 19, 19, -2, -42, -59, -2, -2,
        -2, -2, -2, -2, -57, -35, -63, -46, -42, -48, -42, -57, -35
    ];
    const PST_OPENING_BISHOP = [
        -18, -12, -11, -7, -10, -11, -10, -20, -11, 2, 3, 0, -3, -2, 1, -8, -13, 3, 2, 13, 13, 2, -3, -7, -12, 2, 13,
        25, 25, 13, 8, -11, -7, 2, 13, 25, 25, 13, 1, -13, -12, -7, 0, 13, 13, 0, -13, -12, -7, 5, 3, 3, 1, 3, 7, -8,
        -17, -7, -27, -7, -9, -22, -11, -17
    ];

    const PST_OPENING_ROOK = [
        2, -1, 3, 1, -1, -3, 2, -1, 9, 16, 15, 17, 15, 17, 18, 7, -8, 1, 1, 3, 0, -1, 1, -7, -10, 2, -2, -2, 0, -3, 1,
        -6, -7, 1, 2, -1, 2, 0, -2, -4, -5, 0, 0, -1, 2, 3, 0, -9, -10, 0, -2, 0, 2, -3, -3, -9, -15, 14, 17, 9, 9, 2,
        2, -17
    ];
    const PST_OPENING_QUEEN = [
        32, -14, -15, -6, -8, -16, -15, -28, -12, -3, 2, -2, 0, 3, 2, -12, -14, -2, 6, 5, 8, 8, -2, -12, -5, -2, 8, 4,
        8, 10, 0, -4, -3, 2, 8, 5, 4, 6, -3, -6, -17, 10, 10, 10, 7, 10, 3, -17, -12, -3, 5, -3, 1, -1, 1, -15, -27,
        -12, -17, -7, -9, -12, -16, -27
    ];

    const PST_OPENING_KING = [
        -30, -40, -40, -50, -50, -40, -40, -30, -30, -38, -41, -49, -50, -39, -40, -30, -31, -40, -40, -48, -49, -40,
        -43, -30, -31, -39, -39, -51, -52, -39, -39, -30, -20, -31, -29, -41, -42, -29, -30, -19, -10, -19, -18, -20,
        -21, -20, -20, -11, 17, 19, 0, 0, 2, 0, 17, 17, 20, 32, 10, 3, 0, 12, 31, 21
    ];

    const PST_MIDDLE_PAWN = [
        22, 37, 31, 27, 27, 27, 27, 24, 47, 74, 56, 55, 55, 61, 46, 32, 17, 18, 44, 51, 48, 44, 19, 19, -3, 6, 3, 30,
        29, 3, 6, -3, -7, 1, 1, 5, 5, 0, 2, -8, -8, 0, -1, -3, -1, -2, 5, -5, -9, 4, -1, -12, -10, 3, 9, -8, 0, 0, 0, 0,
        0, 0, 0, 0
    ];
    const PST_MIDDLE_KNIGHT = [
        -56, -36, -26, -29, 0, -35, -27, -50, -24, -12, 27, -1, 4, 18, -5, -19, -14, 20, 10, 26, 29, 27, 21, -3, -5, 7,
        17, 21, 17, 21, 9, -1, -12, 0, 12, 12, 14, 15, 4, -9, -16, 0, 5, 10, 10, 7, 6, -13, -22, -17, -1, 0, 1, 1, -12,
        -19, -44, -21, -23, -17, -15, -18, -19, -32
    ];
    const PST_MIDDLE_BISHOP = [
        -19, -16, -30, -21, -11, -27, -9, -16, -9, 6, 3, -10, -2, 13, 3, -14, -6, 12, 2, 16, 15, 7, 10, -4, 1, 4, 9, 18,
        13, 13, 5, -1, 0, 4, 8, 12, 10, 7, 1, -2, -1, 7, 10, 8, 7, 10, 8, 0, 0, 5, 5, 1, 2, 4, 8, -1, -12, -2, -9, -7,
        -7, -7, -10, -10
    ];

    const PST_MIDDLE_ROOK = [
        11, 11, 12, 9, 17, 7, 15, 15, 14, 13, 22, 24, 24, 24, 13, 17, 1, 10, 10, 12, 10, 11, 14, 3, -6, 0, 4, 6, 7, 4,
        -2, -4, -12, -9, -3, -3, 0, -6, -7, -10, -15, -8, -9, -7, -3, -5, -5, -16, -18, -9, -8, -5, -5, -6, -9, -22, -8,
        -6, -3, 4, 2, -2, -10, -11
    ];
    const PST_MIDDLE_QUEEN = [
        -9, 0, 3, -13, 21, 9, 20, 9, -4, 0, 12, 1, 5, 25, 17, 11, -6, 4, 8, 15, 21, 24, 16, 8, -4, -6, 4, 4, 10, 11, 2,
        2, -5, -3, 1, 2, 2, 1, 0, -3, -11, 0, -1, 0, -1, 1, 1, -5, -15, -6, 0, -4, -2, -2, -6, -11, -13, -11, -10, -5,
        -8, -15, -14, -23
    ];

    const PST_MIDDLE_KING = [
        -25, 0, 0, -30, -36, -3, 4, -18, -9, -4, -1, 1, 1, 4, -11, -10, -18, 0, -12, 0, -18, 4, 5, -14, -20, 0, -2, -8,
        -11, -3, -7, -21, -24, -13, -13, -13, -18, -15, -11, -23, -15, -12, -11, -19, -17, -10, -10, -14, -3, 1, -3,
        -18, -15, -5, 3, 1, -5, 11, 0, -13, -2, -5, 11, 1
    ];

    const PST_END_PAWN = [
        145, 145, 145, 145, 145, 145, 145, 145, 73, 162, 135, 122, 117, 124, 109, 77, 53, 74, 72, 72, 65, 69, 68, 47,
        17, 18, 44, 47, 51, 44, 19, 19, 11, 11, 12, 48, 75, 7, 12, 8, 0, 2, 0, 10, 2, 0, 2, 1, -6, -2, -2, -13, -17, -3,
        -3, -7, 0, 0, 0, 0, 0, 0, 0, 0
    ];
    const PST_END_KNIGHT = [
        -50, -40, -30, -24, -24, -35, -40, -50, -38, -17, 6, -5, 5, -4, -15, -40, -24, 3, 15, 9, 15, 10, -6, -26, -29,
        5, 21, 17, 18, 9, 10, -28, -36, -5, 18, 16, 14, 20, 5, -26, -32, 7, 5, 20, 11, 15, 9, -27, -43, -20, 5, -1, 5,
        1, -22, -40, -50, -40, -32, -27, -30, -25, -35, -50
    ];
    const PST_END_BISHOP = [
        -27, -16, -12, -13, -17, -14, -18, -30, -15, 3, 1, -3, 2, -1, 2, -12, -15, -1, 7, 17, 12, 4, -2, -15, -13, 4,
        10, 18, 12, 10, 8, -16, -12, 2, 15, 18, 13, 16, 2, -18, -12, 12, 15, 16, 15, 13, 13, -16, -15, 8, 3, 3, -1, 1,
        5, -13, -27, -12, -15, -12, -15, -15, -13, -28
    ];

    const PST_END_ROOK = [
        2, -3, 0, -2, -2, -3, 3, -1, 2, 12, 11, 12, 9, 11, 12, -2, -12, 1, 1, 0, 0, -3, 2, -9, -13, 3, 0, -3, -1, -1,
        -2, -7, -12, 3, 1, -3, 3, 0, -3, -10, -8, 0, 1, -1, 3, 2, 0, -12, -9, -2, 0, -2, 1, -2, -3, -7, -14, 15, 19, 5,
        5, 2, 1, -15
    ];
    const PST_END_QUEEN = [
        -30, -13, -13, -4, -9, -17, -15, -28, -12, -2, 1, -2, 1, 3, 1, -15, -16, -1, 8, 6, 8, 10, -2, -13, -5, -2, 6, 5,
        9, 9, -1, -6, 0, 3, 9, 5, 4, 5, 0, -6, -15, 10, 8, 6, 8, 9, 2, -15, -16, -3, 7, 0, 0, -2, 2, -15, -30, -13, -13,
        -8, -7, -16, -14, -30
    ];

    const PST_END_KING = [
        -50, -40, -30, -20, -20, -30, -40, -50, -30, -19, -12, 3, 1, -8, -22, -30, -32, -13, 20, 31, 32, 17, -10, -30,
        -32, -7, 27, 37, 37, 32, -13, -32, -33, -8, 30, 37, 37, 32, -11, -30, -30, -8, 17, 31, 33, 18, -11, -31, -33,
        -28, 2, 1, 2, 0, -30, -31, -49, -28, -28, -28, -29, -27, -30, -50
    ];

    function rotateTable(table) {
        let pstMirror = [];
        let x = table.length - 1;
        while (x - 7 >= 0) {
            for (let i = x - 7; i <= x; i++) {
                pstMirror.push(table[i]);
            }
            x = x - 8;
        }
        return pstMirror;
    }

    const PST_OPENING_WHITE = {
        p: PST_OPENING_PAWN,
        n: PST_OPENING_KNIGHT,
        b: PST_OPENING_BISHOP,
        r: PST_OPENING_ROOK,
        q: PST_OPENING_QUEEN,
        k: PST_OPENING_KING
    };
    const PST_OPENING_BLACK = {
        p: rotateTable(PST_OPENING_PAWN),
        n: rotateTable(PST_OPENING_KNIGHT),
        b: rotateTable(PST_OPENING_BISHOP),
        r: rotateTable(PST_OPENING_ROOK),
        q: rotateTable(PST_OPENING_QUEEN),
        k: rotateTable(PST_OPENING_KING)
    };

    const PST_MIDDLE_WHITE = {
        p: PST_MIDDLE_PAWN,
        n: PST_MIDDLE_KNIGHT,
        b: PST_MIDDLE_BISHOP,
        r: PST_MIDDLE_ROOK,
        q: PST_MIDDLE_QUEEN,
        k: PST_MIDDLE_KING
    };
    const PST_MIDDLE_BLACK = {
        p: rotateTable(PST_MIDDLE_PAWN),
        n: rotateTable(PST_MIDDLE_KNIGHT),
        b: rotateTable(PST_MIDDLE_BISHOP),
        r: rotateTable(PST_MIDDLE_ROOK),
        q: rotateTable(PST_MIDDLE_QUEEN),
        k: rotateTable(PST_MIDDLE_KING)
    };

    const PST_END_WHITE = {
        p: PST_END_PAWN,
        n: PST_END_KNIGHT,
        b: PST_END_BISHOP,
        r: PST_END_ROOK,
        q: PST_END_QUEEN,
        k: PST_END_KING
    };
    const PST_END_BLACK = {
        p: rotateTable(PST_END_PAWN),
        n: rotateTable(PST_END_KNIGHT),
        b: rotateTable(PST_END_BISHOP),
        r: rotateTable(PST_END_ROOK),
        q: rotateTable(PST_END_QUEEN),
        k: rotateTable(PST_END_KING)
    };

    function getPieceSquareValue(type, r, c, color, phase) {
        const idx = r * 8 + c;
        if (phase === "opening") {
            if (color === "white") {
                return PST_OPENING_WHITE[type] ? PST_OPENING_WHITE[type][idx] || 0 : 0;
            } else {
                return PST_OPENING_BLACK[type] ? PST_OPENING_BLACK[type][idx] || 0 : 0;
            }
        }
        if (phase === "middle") {
            if (color === "white") {
                return PST_MIDDLE_WHITE[type] ? PST_MIDDLE_WHITE[type][idx] || 0 : 0;
            } else {
                return PST_MIDDLE_BLACK[type] ? PST_MIDDLE_BLACK[type][idx] || 0 : 0;
            }
        }
        if (phase === "end") {
            if (color === "white") {
                return PST_END_WHITE[type] ? PST_END_WHITE[type][idx] || 0 : 0;
            } else {
                return PST_END_BLACK[type] ? PST_END_BLACK[type][idx] || 0 : 0;
            }
        }
    }

    function addBoardListeners() {
        for (let r = 0; r < 8; r++)
            for (let c = 0; c < 8; c++) {
                const sq = document.getElementById(`square-${r}-${c}`);
                if (sq) {
                    sq.onclick = onSquareClick;
                }
            }
    }

    buildBoardUI();
    initGame();
    updateInfo("Please select game mode: Two Players or Player vs AI.");

    btnNewGame.disabled = true;
    btnUndo.disabled = true;
    btnResign.disabled = true;
    btnSave.disabled = true;
    btnHistory.disabled = true;

    btnTwoPlayers.disabled = false;
    btnPvAI.disabled = false;
})();