
"use strict";

    /* author Jacek Byzdra https://www.linkedin.com/in/jacek-byzdra/ */

const LETTERS = ["a", "b", "c", "d", "e", "f", "g", "h"];
const ROWS = [8, 7, 6, 5, 4, 3, 2, 1];
const PIECES_SYMBOLS = {
    K: "\u265A",
    Q: "\u265B",
    R: "\u265C",
    B: "\u265D",
    N: "\u265E",
    P: "\u265F",
    k: "\u2659",
    q: "\u265B",
    r: "\u265C",
    b: "\u265D",
    n: "\u265E",
    p: "\u2659"
};

const PIECE_VALUES = {
    P: 100,
    N: 300,
    B: 320,
    R: 500,
    Q: 900,
    K: 10000,
    p: 100,
    n: 300,
    b: 320,
    r: 500,
    q: 900,
    k: 10000
};
const MOVE_DIRECTIONS = {
    N: [],
    B: [
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1]
    ],
    R: [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1]
    ],
    Q: [
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1]
    ],
    K: [
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1]
    ]
};

const CASTLING_MOVE_THRESHOLD = 14;
const MATERIAL_PHASE_THRESHOLD = 2500;
const AI_MOVE_DELAY = 500;

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function coordToIndex(coord) {
    const col = LETTERS.indexOf(coord[0]);
    const row = ROWS.indexOf(parseInt(coord[1], 10));
    if (col === -1 || row === -1) return null;
    return [row, col];
}

function indexToCoord(row, col) {
    if (row < 0 || row > 7 || col < 0 || col > 7) return null;
    return LETTERS[col] + ROWS[row];
}

function isOnBoard(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function isWhite(piece) {
    if (!piece) return false;
    return piece === piece.toUpperCase();
}

function isBlack(piece) {
    if (!piece) return false;
    return piece === piece.toLowerCase();
}

function isSameColor(p1, p2) {
    if (!p1 || !p2) return false;
    return (isWhite(p1) && isWhite(p2)) || (isBlack(p1) && isBlack(p2));
}

function isOpponent(p1, p2) {
    if (!p1 || !p2) return false;
    return (isWhite(p1) && isBlack(p2)) || (isBlack(p1) && isWhite(p2));
}

class GameState {
    constructor() {
        this.board = this.createEmptyBoard();
        this.turn = "w";
        this.moveNumber = 1;
        this.whiteKingMoved = false;
        this.blackKingMoved = false;
        this.whiteRookAMoved = false;
        this.whiteRookHMoved = false;
        this.blackRookAMoved = false;
        this.blackRookHMoved = false;
        this.enPassantTarget = null;
        this.halfMoveClock = 0;
        this.castlingRights = { w: { kingSide: true, queenSide: true }, b: { kingSide: true, queenSide: true } };
        this.history = [];
        this.capturedWhitePieces = [];
        this.capturedBlackPieces = [];
        this.gameResult = null;
        this.isCheck = false;
        this.isCheckMate = false;
        this.isStaleMate = false;
        this.isPaused = false;
        this.currentMode = null;
        this.whiteScore = 0;
        this.blackScore = 0;
        this.positionsCounter = {};
        this.whiteCastled = false;
        this.blackCastled = false;
        this.castledPlayers = { w: false, b: false };
    }
    createEmptyBoard() {
        const board = Array(8)
            .fill(null)
            .map(() => Array(8).fill(null));
        return board;
    }
    copy() {
        const copy = new GameState();
        copy.board = deepClone(this.board);
        copy.turn = this.turn;
        copy.moveNumber = this.moveNumber;
        copy.whiteKingMoved = this.whiteKingMoved;
        copy.blackKingMoved = this.blackKingMoved;
        copy.whiteRookAMoved = this.whiteRookAMoved;
        copy.whiteRookHMoved = this.whiteRookHMoved;
        copy.blackRookAMoved = this.blackRookAMoved;
        copy.blackRookHMoved = this.blackRookHMoved;
        copy.enPassantTarget = this.enPassantTarget ? [...this.enPassantTarget] : null;
        copy.halfMoveClock = this.halfMoveClock;
        copy.castlingRights = deepClone(this.castlingRights);
        copy.history = deepClone(this.history);
        copy.capturedWhitePieces = deepClone(this.capturedWhitePieces);
        copy.capturedBlackPieces = deepClone(this.capturedBlackPieces);
        copy.gameResult = this.gameResult;
        copy.isCheck = this.isCheck;
        copy.isCheckMate = this.isCheckMate;
        copy.isStaleMate = this.isStaleMate;
        copy.isPaused = this.isPaused;
        copy.currentMode = this.currentMode;
        copy.whiteScore = this.whiteScore;
        copy.blackScore = this.blackScore;
        copy.positionsCounter = deepClone(this.positionsCounter);
        copy.whiteCastled = this.whiteCastled;
        copy.blackCastled = this.blackCastled;
        copy.castledPlayers = deepClone(this.castledPlayers);
        return copy;
    }
    getPositionKey() {
        let s = "";
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                s += this.board[r][c] ? this.board[r][c] : ".";
            }
        }
        s += this.turn;
        s += this.castlingRights.w.kingSide ? "K" : "";
        s += this.castlingRights.w.queenSide ? "Q" : "";
        s += this.castlingRights.b.kingSide ? "k" : "";
        s += this.castlingRights.b.queenSide ? "q" : "";
        s += this.enPassantTarget ? indexToCoord(...this.enPassantTarget) : "-";
        return s;
    }
}

function initializeGame(game) {
    game.board = game.createEmptyBoard();
    for (let c = 0; c < 8; c++) {
        game.board[6][c] = "P";
        game.board[1][c] = "p";
    }
    game.board[7][0] = "R";
    game.board[7][7] = "R";
    game.board[0][0] = "r";
    game.board[0][7] = "r";
    game.board[7][1] = "N";
    game.board[7][6] = "N";
    game.board[0][1] = "n";
    game.board[0][6] = "n";
    game.board[7][2] = "B";
    game.board[7][5] = "B";
    game.board[0][2] = "b";
    game.board[0][5] = "b";
    game.board[7][3] = "Q";
    game.board[0][3] = "q";
    game.board[7][4] = "K";
    game.board[0][4] = "k";

    game.turn = "w";
    game.moveNumber = 1;
    game.whiteKingMoved = false;
    game.blackKingMoved = false;
    game.whiteRookAMoved = false;
    game.whiteRookHMoved = false;
    game.blackRookAMoved = false;
    game.blackRookHMoved = false;
    game.enPassantTarget = null;
    game.halfMoveClock = 0;
    game.castlingRights = { w: { kingSide: true, queenSide: true }, b: { kingSide: true, queenSide: true } };
    game.history = [];
    game.capturedWhitePieces = [];
    game.capturedBlackPieces = [];
    game.gameResult = null;
    game.isCheck = false;
    game.isCheckMate = false;
    game.isStaleMate = false;
    game.isPaused = false;
    game.whiteCastled = false;
    game.blackCastled = false;
    game.castledPlayers = { w: false, b: false };
    game.positionsCounter = {};
    game.currentMode = null;
    game.whiteScore = 0;
    game.blackScore = 0;
}

function pieceName(piece) {
    if (!piece) return "";
    const map = {
        P: "Pawn",
        p: "Pawn",
        N: "Knight",
        n: "Knight",
        B: "Bishop",
        b: "Bishop",
        R: "Rook",
        r: "Rook",
        Q: "Queen",
        q: "Queen",
        K: "King",
        k: "King"
    };
    return map[piece.toUpperCase()] || "";
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

function generateAllLegalMoves(game) {
    const moves = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = game.board[r][c];
            if (!piece) continue;
            if ((game.turn === "w" && isWhite(piece)) || (game.turn === "b" && isBlack(piece))) {
                moves.push(...generatePieceMoves(game, r, c));
            }
        }
    }
    return moves.filter((m) => !moveLeavesKingInCheck(game, m));
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
                if (capturedPawn && isOpponent(piece, capturedPawn) && capturedPawn.toUpperCase() === "P") {
                    moves.push(
                        moveObj(row, col, forwardRow, captureCol, piece, {
                            captured: capturedPawn,
                            enPassant: true
                        })
                    );
                }
            }
        }
    }
    else if (pieceType === "N") {
        const knightMoves = [
            [-2, -1],
            [-2, 1],
            [-1, -2],
            [-1, 2],
            [1, -2],
            [1, 2],
            [2, -1],
            [2, 1]
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
    } else if (pieceType === "B" || pieceType === "R" || pieceType === "Q") {
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
    } else if (pieceType === "K") {
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

function moveObj(fromRow, fromCol, toRow, toCol, piece, options = {}) {
    return Object.assign(
        {
            from: [fromRow, fromCol],
            to: [toRow, toCol],
            piece: piece,
            captured: null,
            promotion: false,
            isCastle: false,
            enPassant: false,
            doublePawnPush: false
        },
        options
    );
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

function opponent(color) {
    return color === "w" ? "b" : "w";
}

function squareIsAttacked(game, row, col, attackerColor) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = game.board[r][c];
            if (!piece) continue;
            if ((attackerColor === "w" && isWhite(piece)) || (attackerColor === "b" && isBlack(piece))) {
                if (canAttackSquare(game, r, c, row, col)) return true;
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

    switch (pieceType) {
        case "P": {
            const dir = isWhitePiece ? -1 : 1;
            return dr === dir && absDc === 1;
        }
        case "N": {
            return (absDr === 2 && absDc === 1) || (absDr === 1 && absDc === 2);
        }
        case "B": {
            if (absDr === absDc) return isPathClear(game, sr, sc, tr, tc);
            return false;
        }
        case "R": {
            if ((dr === 0 && dc !== 0) || (dc === 0 && dr !== 0)) return isPathClear(game, sr, sc, tr, tc);
            return false;
        }
        case "Q": {
            if (absDr === absDc || dr === 0 || dc === 0) return isPathClear(game, sr, sc, tr, tc);
            return false;
        }
        case "K": {
            return absDr <= 1 && absDc <= 1;
        }
        default:
            return false;
    }
}

function isPathClear(game, sr, sc, tr, tc) {
    const dr = tr - sr;
    const dc = tc - sc;
    const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
    const stepC = dc === 0 ? 0 : dc / Math.abs(dc);
    let r = sr + stepR;
    let c = sc + stepC;
    while (r !== tr || c !== tc) {
        if (game.board[r][c]) return false;
        r += stepR;
        c += stepC;
    }
    return true;
}

function moveLeavesKingInCheck(game, move) {
    const newGame = simulateMove(game, move);
    const kingPos = findKing(newGame, game.turn);
    if (!kingPos) return true;
    return squareIsAttacked(newGame, kingPos[0], kingPos[1], opponent(game.turn));
}

function findKing(game, color) {
    const kingSymbol = color === "w" ? "K" : "k";
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (game.board[r][c] === kingSymbol) return [r, c];
        }
    }
    return null;
}

function findQueen(game, color) {
    const queenSymbol = color === "w" ? "Q" : "q";
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (game.board[r][c] === queenSymbol) return [r, c];
        }
    }
    return null;
}

function simulateMove(game, move) {
    const newGame = game.copy();
    const [fr, fc] = move.from;
    const [tr, tc] = move.to;
    const piece = newGame.board[fr][fc];
    if (!piece) return null;
    if (move.captured) {
        if (move.enPassant) {
            const epRow = fr;
            const epCol = tc;
            newGame.board[epRow][epCol] = null;
            if (isWhite(piece)) {
                newGame.capturedBlackPieces.push(move.captured);
            } else {
                newGame.capturedWhitePieces.push(move.captured);
            }
        } else {
            if (isWhite(move.captured)) {
                newGame.capturedWhitePieces.push(move.captured);
            } else {
                newGame.capturedBlackPieces.push(move.captured);
            }
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
        const isWhiteTurn = newGame.turn === "w";
        const row = isWhiteTurn ? 7 : 0;
        if (tc === 6) {
            const rookCol = 7;
            const rookDestCol = 5;
            const rookSymbol = isWhiteTurn ? "R" : "r";
            newGame.board[row][rookDestCol] = rookSymbol;
            newGame.board[row][rookCol] = null;
        } else if (tc === 2) {
            const rookCol = 0;
            const rookDestCol = 3;
            const rookSymbol = isWhiteTurn ? "R" : "r";
            newGame.board[row][rookDestCol] = rookSymbol;
            newGame.board[row][rookCol] = null;
        }
        if (isWhiteTurn) {
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
        const cr = tr,
            cc = tc;
        if (cr === 7 && cc === 0) newGame.castlingRights.w.queenSide = false;
        if (cr === 7 && cc === 7) newGame.castlingRights.w.kingSide = false;
        if (cr === 0 && cc === 0) newGame.castlingRights.b.queenSide = false;
        if (cr === 0 && cc === 7) newGame.castlingRights.b.kingSide = false;
    }

    if (move.doublePawnPush) {
        newGame.enPassantTarget = [(fr + tr) / 2, fc];
    }
    newGame.turn = opponent(newGame.turn);
    if (newGame.turn === "w") {
        newGame.moveNumber++;
    }
    const posKey = newGame.getPositionKey();
    newGame.positionsCounter[posKey] = (newGame.positionsCounter[posKey] ?? 0) + 1;

    return newGame;
}

function playerHasLegalMoves(game) {
    return generateAllLegalMoves(game).length > 0;
}

function evaluateBoard(game, maximizingPlayer, move) {
    const whiteMaterial = calculateMaterialScore(game, "w");
    const blackMaterial = calculateMaterialScore(game, "b");
    const totalMoves = game.moveNumber;
    const hasWhiteCastled = game.castledPlayers.w;
    const hasBlackCastled = game.castledPlayers.b;

    let phase = "opening";
    if (hasWhiteCastled || hasBlackCastled || (totalMoves >= CASTLING_MOVE_THRESHOLD)) {
        phase = "middle";
    }
    if ((whiteMaterial <= MATERIAL_PHASE_THRESHOLD) || (blackMaterial <= MATERIAL_PHASE_THRESHOLD)) {
        phase = "end";
    }
    let materialScore = whiteMaterial - blackMaterial;
    if (maximizingPlayer === "b" && materialScore !== 0) {
        materialScore = -materialScore;
    }

    const pstScore = evaluatePieceSquareTableForMove(game, phase, maximizingPlayer, move);
    let centerControlScore = 0;
    let centerThreatScore = 0;
    if (phase === "opening") {
        centerControlScore = calculateCenterControlScore(game, maximizingPlayer);
        centerThreatScore = calculateCenterThreatScore(game, phase, maximizingPlayer);
    }
    let castlingScore = 0;
    if (phase === "opening" || phase === "middle") {
        if (game.castledPlayers.w) {
            castlingScore += maximizingPlayer === "w" ? 50 : -50;
        }
        if (game.castledPlayers.b) {
            castlingScore += maximizingPlayer === "b" ? 50 : -50;
        }
    }
    const threatScore = calculateThreatScore(game, phase, maximizingPlayer);
    const checkScore = calculateCheckScore(game, phase, maximizingPlayer);
    const coverScore = calculateCoverScore(game, phase, maximizingPlayer);
    const captureValueScore = calculateCaptureValueScore(game, phase, maximizingPlayer);
    const promotionScore = calculatePromotionScore(game, phase, maximizingPlayer);
    const pieceAttackScore = calculatePieceAttackScore(game, phase, maximizingPlayer);
    const repetitionScore = calculateRepetitionScore(game, maximizingPlayer);
    const kingAdjacencyScore = calculateKingAdjacencyScore(game, phase, maximizingPlayer);
    const queenStillness = calculateQueenStillness(game, phase, maximizingPlayer, totalMoves);
    const kingStillness = calculateKingStillness(game, phase, maximizingPlayer, totalMoves);

    if (game.gameResult === (maximizingPlayer === "w" ? "white" : "black")) {
        return 100000;
    } else if (game.gameResult === (maximizingPlayer === "w" ? "black" : "white")) {
        return -100000;
    } else if (game.gameResult === "draw") {
        return 0;
    }

    return (
        materialScore +
        pstScore +
        centerControlScore +
        castlingScore +
        threatScore +
        centerThreatScore +
        checkScore +
        coverScore +
        captureValueScore +
        promotionScore +
        pieceAttackScore +
        repetitionScore +
        queenStillness +
        kingAdjacencyScore +
        kingStillness
    );
}

function calculateMaterialScore(game, color) {
    let total = 0;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = game.board[r][c];
            if (!p) continue;
            if ((color === "w" && isWhite(p)) || (color === "b" && isBlack(p))) {
                if (p.toUpperCase() !== "K") total += PIECE_VALUES[p];
            }
        }
    }
    return total;
}


const PST = {
    opening: {
        P: [
    0,  0,  0,  0,  0,   0,   0, 0, 
   -5, 31, 45, 68, 68,   45, 31, -5, 
  -20,  0, 10,  51, 48,  10, 0, -20, 
  -22, -2,  8,  49, 48,   8, -2, -22, 
  -25, -3,  6,  45, 47,  6,  3,-25, 
  -30, -5,  5,  25, 25,  5, -5, -30, 
    5, 13, 13, -19, -19, 11, 12, 6, 
    0,  0,  0,  0,   0,   0, 0,  0 
        ],


        N: [
   -37, -60, -45, -44, -43, -45, -60, -35, 
   -58, -2,  -2,  -2,  -2,  -2,  -2, -60, 
   -42, -2,   38,  38,  38,  38,  -2,  -44, 
   -42, -2,   19,  38,  38,  19,  -2, -43, 
   -48, -2,   19,  38,  38,  19,  -2, -42, 
   -46, -2,   19,  19,  19,  19,  -2, -42, 
   -59, -2,   -2,  -2,  -2,  -2,  -2, -57, 
   -35, -63, -46, -42, -48, -42, -57, -35   
        ],
        B: [
   -18, -12, -11, -7, -10, -11, -10, -20, 
   -11,   2,   3,  0,  -3,  -2,   1,  -8, 
   -13,   3,   2, 13,   13,   2,  -3,  -7, 
   -12,   2,  13, 25,   25,   13,   8, -11, 
   -7,    2,  13, 25,   25,   13,   1, -13, 
   -12,  -7,   0,  13,  13,   0,  -13, -12, 
   -7,    5,   3,  3,   1,   3,   7,  -8, 
   -17,  -7, -27, -7,  -9, -22, -11, -17
        ],

        R: [
    2, -1,  3,  1, -1, -3,  2, -1, 
    9, 16, 15, 17, 15, 17, 18,  7, 
   -8,  1,  1,  3,  0, -1,  1, -7, 
   -10, 2, -2, -2,  0, -3,  1, -6, 
   -7,  1,  2, -1,  2,  0, -2, -4, 
   -5,  0,  0, -1,  2,  3,  0, -9, 
   -10, 0, -2,  0,  2, -3, -3, -9, 
   -15, 14, 17, 9,  9,  2,  2, -17
        ],
        Q: [
    32, -14, -15, -6, -8, -16, -15, -28, 
	-12, -3,   2, -2,  0,   3,   2, -12, 
	-14, -2,   6,  5,  8,   8,  -2, -12, 
	-5,  -2,   8,  4,  8,  10,   0,  -4, 
	-3,   2,   8,  5,  4,   6,  -3,  -6, 
	-17, 10,  10, 10,  7,  10,   3, -17, 
	-12, -3,   5, -3,  1,  -1,   1, -15, 
	-27, -12, -17, -7, -9, -12, -16, -27
        ],
        K: [
    -30, -40, -40, -50, -50, -40, -40, -30, 
	-30, -38, -41, -49, -50, -39, -40, -30, 
	-31, -40, -40, -48, -49, -40, -43, -30, 
	-31, -39, -39, -51, -52, -39, -39, -30, 
	-20, -31, -29, -41, -42, -29, -30, -19, 
	-10, -19, -18, -20, -21, -20, -20, -11, 
	 17,  19,   0,   0,   2,   0,  17,  17, 
	 20,  32,  10,   3,   0,  12,  31,  21
        ]
    },
    middle: {
        P: [
    22, 37, 31, 27, 27, 27, 27, 24, 
	47, 74, 56, 55, 55, 61, 46, 32, 
	17, 18, 44, 51, 48, 44, 19, 19,  
	-3, 6,  3,  30, 29,  3,  6, -3, 
	-7, 1,  1,   5,  5,  0,  2, -8, 
	-8, 0, -1,  -3, -1, -2,  5, -5, 
	-9, 4, -1, -12, -10, 3,  9, -8, 
	 0, 0,  0,   0,  0,  0,  0,  0
        ],
        N: [
    -56, -36, -26, -29, 0, -35, -27, -50, 
	-24, -12,  27,  -1, 4,  18,  -5, -19, 
	-14,  20,  10,  26, 29, 27,  21,  -3, 
	-5,    7,  17,  21, 17, 21,   9,  -1, 
	-12,   0,  12,  12, 14, 15,   4,  -9, 
	-16,   0,   5,  10, 10,  7,   6, -13, 
	-22, -17,  -1,   0,  1,  1, -12, -19, 
	-44, -21, -23, -17, -15, -18, -19, -32
        ],
        B: [
    -19, -16, -30, -21, -11, -27, -9, -16, 
	-9,    6,   3, -10,  -2,  13,  3, -14, 
	-6,   12,   2,  16,  15,   7, 10,  -4, 
	 1,    4,   9,  18,  13,  13,  5,  -1, 
	 0,    4,   8,  12,  10,   7,  1,  -2, 
	-1,    7,  10,   8,   7,  10,  8,   0, 
	 0,    5,   5,   1,   2,   4,  8,  -1, 
	 -12, -2,  -9,  -7,  -7,  -7, -10, -10
        ],
        R: [
     11, 11, 12, 9,  17,  7, 15, 15, 
	 14, 13, 22, 24, 24, 24, 13, 17, 
	 1,  10, 10, 12, 10, 11, 14,  3, 
	 -6,  0,  4,  6,  7,  4, -2, -4, 
	-12, -9, -3, -3,  0, -6, -7, -10, 
	-15, -8, -9, -7, -3, -5, -5, -16, 
	-18, -9, -8, -5, -5, -6, -9, -22, 
	 -8, -6, -3,  4,  2, -2, -10, -11
        ],
        Q: [
   -9,   0,   3, -13, 21,   9,  20,   9, 
   -4,   0,  12,   1,  5,  25,  17,  11, 
   -6,   4,   8,  15, 21,  24,  16,   8, 
   -4,  -6,   4,   4, 10,  11,   2,   2, 
   -5,  -3,   1,   2,  2,   1,   0,  -3, 
   -11,  0,  -1,   0, -1,   1,   1,  -5, 
   -15, -6,   0,  -4, -2,  -2,  -6, -11, 
   -13, -11, -10, -5, -8, -15, -14, -23
        ],
        K: [
  -25,   0,    0, -30, -36, -3,   4, -18, 
   -9,  -4,   -1,   1,   1,  4, -11, -10, 
   -18,  0,  -12,   0, -18,  4,   5, -14, 
   -20,  0,   -2,  -8, -11, -3,  -7, -21, 
   -24, -13, -13, -13, -18, -15, -11, -23, 
   -15, -12, -11, -19, -17, -10, -10, -14, 
    -3,   1,  -3, -18, -15,  -5,   3,   1, 
	-5,  11,   0, -13,  -2,  -5,  11,   1  
        ]
    },
    end: {
        P: [
   145, 145, 145, 145, 145, 145, 145, 145, 
    73, 162, 135, 122, 117, 124, 109, 77, 
	53,  74,  72,  72,  65,  69,  68, 47, 
	17,  18,  44,  47,  51,  44,  19, 19, 
	11,  11,  12,  48,  75,   7,  12,  8, 
	 0,   2,   0,  10,   2,   0,   2,  1, 
	-6,  -2,  -2, -13, -17,  -3,  -3, -7, 
	 0,   0,   0,   0,   0,   0,   0,  0 
        ],
        N: [
    -50, -40, -30, -24, -24, -35, -40, -50, 
	-38, -17,   6,  -5,   5,  -4, -15, -40, 
	-24,   3,  15,   9,  15,  10,  -6, -26, 
	-29,   5,  21,  17,  18,   9,  10, -28, 
	-36,  -5,  18,  16,  14,  20,   5, -26, 
	-32,   7,   5,  20,  11,  15,   9, -27, 
	-43, -20,   5,  -1,   5,   1, -22, -40, 
	-50, -40, -32, -27, -30, -25, -35, -50
        ],
        B: [
   -27, -16, -12, -13, -17, -14, -18, -30, 
   -15,   3,   1,  -3,   2,  -1,   2, -12, 
   -15,  -1,   7,  17,  12,   4,  -2, -15, 
   -13,   4,  10,  18,  12,  10,   8, -16, 
   -12,   2,  15,  18,  13,  16,   2, -18, 
   -12,  12,  15,  16,  15,  13,  13, -16, 
   -15,   8,   3,   3,  -1,   1,   5, -13, 
   -27, -12, -15, -12, -15, -15, -13, -28 
        ],
        R: [
    2,  -3, 0, -2, -2, -3,  3, -1, 
    2, 12, 11, 12,  9, 11, 12, -2, 
  -12,  1,  1,  0,  0, -3,  2, -9, 
  -13,  3,  0, -3, -1, -1, -2, -7, 
  -12,  3,  1, -3,  3,  0, -3, -10, 
   -8,  0,  1, -1,  3,  2,  0, -12, 
   -9, -2,  0, -2,  1, -2, -3, -7, 
  -14, 15, 19,  5,  5,  2,  1, -15 
        ],
        Q: [
  -30, -13, -13, -4, -9, -17, -15, -28, 
  -12,  -2,   1, -2,  1,   3,   1, -15, 
  -16,  -1,   8,  6,  8,  10,  -2, -13, 
   -5,  -2,   6,  5,  9,   9,  -1,  -6, 
    0,   3,   9,  5,  4,   5,   0,  -6, 
  -15,  10,   8,  6,  8,   9,   2, -15, 
  -16,  -3,   7,  0,  0,  -2,   2, -15, 
  -30, -13, -13, -8, -7, -16, -14, -30 
        ],
        K: [
    -50, -40, -30, -20, -20, -30, -40, -50, 
	-30, -19, -12,   3,   1,  -8, -22, -30, 
	-32, -13,  20,  31,  32,  17, -10, -30, 
	-32,  -7,  27,  37,  37,  32, -13, -32, 
	-33,  -8,  30,  37,  37,  32, -11, -30, 
	-30,  -8,  17,  31,  33,  18, -11, -31, 
	-33, -28,   2,   1,   2,   0, -30, -31, 
	-49, -28, -28, -28, -29, -27, -30, -50 
        ]
    }
};


function getPSTForPiece(piece, phase, row, col) {
    if (!piece) return 0;
    const pieceType = piece.toUpperCase();
    if (!(pieceType in PST[phase])) return 0;

    let index;
    if (isWhite(piece)) {
        index = row * 8 + col;
    } else {
        const mirroredRow = 7 - row;
        index = mirroredRow * 8 + col;
    }
    let pstVal = PST[phase][pieceType][index];
    return PST[phase][pieceType][index] || 0;
}

function evaluatePieceSquareTableForMove(game, phase, maximizingPlayer, move) {
    if (!move) return 0;
    const [r, c] = move.to;
    const piece = game.board[r][c];
    let score = 0;

    if (!piece) return 0;
    let val = getPSTForPiece(piece, phase, r, c);
    const threatCountFromOpponent = countAttackers(game, r, c, opponent(maximizingPlayer));
    const threatCountFromPlayer = countAttackers(game, r, c, maximizingPlayer);
    const isMaxPiece = (maximizingPlayer === "w" && isWhite(piece)) || (maximizingPlayer === "b" && isBlack(piece));
    if (isMaxPiece) {
        if (squareIsAttacked(game, r, c, opponent(maximizingPlayer))) {
            if (threatCountFromPlayer === 0) {
                score = -50;
            } else {
                score = val;
            }
        } else {
            score = val;
        }
        return score;
    } else {
        if (squareIsAttacked(game, r, c, maximizingPlayer)) {
            if (threatCountFromOpponent === 0) {
                score = val;
            } else {
                score = -50;
            }
        } else {
            score = val;
        }
        return score;
    }
}

function calculateCenterControlScore(game, maximizingPlayer) {
    const centerSquaresCoord = ["d4", "e4", "d5", "e5"];
    let score = 0;
    for (const sc of centerSquaresCoord) {
        const [r, c] = coordToIndex(sc);
        const piece = game.board[r][c];
        if (!piece) continue;
        const isMaxPiece = (maximizingPlayer === "w" && isWhite(piece)) || (maximizingPlayer === "b" && isBlack(piece));
        const threatCountFromOpponent = countAttackers(game, r, c, opponent(maximizingPlayer));
        const threatCountFromPlayer = countAttackers(game, r, c, maximizingPlayer);

        if (isMaxPiece) {
            if (piece.toUpperCase() === "P") {
                if (threatCountFromOpponent === 0) {
                    score += 60;
                }
                if (threatCountFromOpponent != 0 && threatCountFromPlayer != 0) {
                    score += 60;
                }
                if (threatCountFromOpponent != 0 && threatCountFromPlayer === 0) {
                    score += -200;
                }
            } else if (piece.toUpperCase() === "N") {
                if (threatCountFromOpponent === 0) {
                    score += 5;
                }
                if (threatCountFromOpponent != 0 && threatCountFromPlayer != 0) {
                    score += 5;
                }
                if (threatCountFromOpponent != 0 && threatCountFromPlayer === 0) {
                    score += -200;
                }
            }
        } else {
            if (piece.toUpperCase() === "P") {
                if (threatCountFromPlayer === 0) {
                    score -= 60;
                }
                if (threatCountFromPlayer != 0 && threatCountFromOpponent != 0) {
                    score -= 60;
                }
                if (threatCountFromPlayer != 0 && threatCountFromOpponent === 0) {
                    score -= -200;
                }
            } else if (piece.toUpperCase() === "N") {
                if (threatCountFromPlayer === 0) {
                    score -= 5;
                }
                if (threatCountFromPlayer != 0 && threatCountFromOpponent != 0) {
                    score -= 5;
                }
                if (threatCountFromPlayer != 0 && threatCountFromOpponent === 0) {
                    score -= -200;
                }
            }
        }
    }
    return score;
}


function countAttackers(game, row, col, attackerColor) {
    let count = 0;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = game.board[r][c];
            if (!piece) continue;
            if ((attackerColor === "w" && isWhite(piece)) || (attackerColor === "b" && isBlack(piece))) {
                if (canAttackSquare(game, r, c, row, col)) count++;
            }
        }
    }
    return count;
}

function calculateThreatScore(game, phase, maximizingPlayer) {
    let mult = 0;
    if (phase === "opening") return 0;
    if (phase === "middle" || phase === "end") mult = 1;
    const playerThreats = countThreatenedSquares(game, maximizingPlayer);
    const opponentThreats = countThreatenedSquares(game, opponent(maximizingPlayer));
    return mult * (playerThreats - opponentThreats);
}

function countThreatenedSquares(game, color) {
    const threatenedSquares = new Set();
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = game.board[r][c];
            if (!piece) continue;
            if ((color === "w" && isWhite(piece)) || (color === "b" && isBlack(piece))) {
                const squares = getAttackedSquares(game, r, c);
                for (const sq of squares) {
                    threatenedSquares.add(sq[0] * 8 + sq[1]);
                }
            }
        }
    }
    return threatenedSquares.size;
}

function calculateCenterThreatScore(game, phase, maximizingPlayer) {
    let mult = 5;
    if (phase === "middle" || phase === "end") return 0;
    const playerThreats = countCenterThreatenedSquares(game, maximizingPlayer);
    const opponentThreats = countCenterThreatenedSquares(game, opponent(maximizingPlayer));
    return mult * (playerThreats - opponentThreats);
}

function countCenterThreatenedSquares(game, color) {
    let centerthreatenedSquaresSize = 0;
    const centerSquaresCoord = ["d4", "e4", "d5", "e5"];
    const centersquares = [];
    for (const sc of centerSquaresCoord) {
        const [r, c] = coordToIndex(sc);
        centersquares.push([r, c]);
    }
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = game.board[r][c];
            if (!piece) continue;
            if ((color === "w" && isWhite(piece)) || (color === "b" && isBlack(piece))) {
                const squares = getAttackedSquares(game, r, c);
                for (const sq of squares) {
                    for (const el of centersquares) {
                        if (sq.tr === el.r && sq.tc === el.c) {
                            centerthreatenedSquaresSize++;
                        }
                    }
                }
            }
        }
    }
    return centerthreatenedSquaresSize;
}

function getAttackedSquares(game, row, col) {
    const attacked = [];
    const piece = game.board[row][col];
    if (!piece) return attacked;
    const pieceType = piece.toUpperCase();
    const isWhitePiece = isWhite(piece);
    switch (pieceType) {
        case "P": {
            const dir = isWhitePiece ? -1 : 1;
            for (let dc of [-1, 1]) {
                let tr = row + dir;
                let tc = col + dc;
                if (isOnBoard(tr, tc)) attacked.push([tr, tc]);
            }
            break;
        }
        case "N": {
            const knightMoves = [
                [-2, -1],
                [-2, 1],
                [-1, -2],
                [-1, 2],
                [1, -2],
                [1, 2],
                [2, -1],
                [2, 1]
            ];
            for (const [dr, dc] of knightMoves) {
                const tr = row + dr;
                const tc = col + dc;
                if (isOnBoard(tr, tc)) attacked.push([tr, tc]);
            }
            break;
        }
        case "B":
        case "R":
        case "Q": {
            const directions = MOVE_DIRECTIONS[pieceType];
            for (const [dr, dc] of directions) {
                if ((pieceType === "B" && Math.abs(dr) !== Math.abs(dc)) || (pieceType === "R" && dr !== 0 && dc !== 0)) continue;

                let tr = row + dr;
                let tc = col + dc;
                while (isOnBoard(tr, tc)) {
                    attacked.push([tr, tc]);
                    if (game.board[tr][tc]) break;
                    tr += dr;
                    tc += dc;
                }
            }
            break;
        }
        case "K": {
            const directions = MOVE_DIRECTIONS.K;
            for (const [dr, dc] of directions) {
                const tr = row + dr;
                const tc = col + dc;
                if (isOnBoard(tr, tc)) attacked.push([tr, tc]);
            }
            break;
        }
        default:
            break;
    }
    return attacked;
}


function calculateCheckScore(game, phase, maximizingPlayer) {
    if (phase === "opening") return 0;
    const playerColor = maximizingPlayer;
    const opponentColor = opponent(maximizingPlayer);
    const kingPos = findKing(game, opponentColor);
    if (!kingPos) return 0;

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = game.board[r][c];
            if (!piece) continue;
            if (
                ((playerColor === "w" && isWhite(piece)) || (playerColor === "b" && isBlack(piece))) &&
                canAttackSquare(game, r, c, ...kingPos)
            ) {
                if (countAttackers(game, r, c, opponentColor) === 0) {
                    if (phase === "middle") {
                        if (piece.toUpperCase() === "Q" || piece.toUpperCase() === "R") {
                            return 20;
                        } else if (piece.toUpperCase() === "B") {
                            return 12;
                        } else if (piece.toUpperCase() === "N") {
                            return 10;
                        } else {
                            return 5;
                        }
                    } else if (phase === "end") {
                        if (piece.toUpperCase() === "Q" || piece.toUpperCase() === "R") {
                            return 30;
                        } else if (piece.toUpperCase() === "B") {
                            return 20;
                        } else if (piece.toUpperCase() === "N") {
                            return 15;
                        } else {
                            return 10;
                        }
                    }
                }
                if (countAttackers(game, r, c, opponentColor) != 0) {
                    if (phase === "middle") {
                        if (piece.toUpperCase() === "Q" || piece.toUpperCase() === "R") {
                            return -20;
                        } else if (piece.toUpperCase() === "B") {
                            return -12;
                        } else if (piece.toUpperCase() === "N") {
                            return -10;
                        } else {
                            return -5;
                        }
                    } else if (phase === "end") {
                        if (piece.toUpperCase() === "Q" || piece.toUpperCase() === "R") {
                            return -30;
                        } else if (piece.toUpperCase() === "B") {
                            return -20;
                        } else if (piece.toUpperCase() === "N") {
                            return -15;
                        } else {
                            return -10;
                        }
                    }
                }
            }
        }
    }

    const ownKingPos = findKing(game, playerColor);
    if (!ownKingPos) return 0;

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = game.board[r][c];
            if (!piece) continue;
            if (
                ((opponentColor === "w" && isWhite(piece)) || (opponentColor === "b" && isBlack(piece))) &&
                canAttackSquare(game, r, c, ...ownKingPos)
            ) {
                if (countAttackers(game, r, c, playerColor) === 0) {
                    if (phase === "middle") {
                        if (piece.toUpperCase() === "Q" || piece.toUpperCase() === "R") {
                            return -20;
                        } else if (piece.toUpperCase() === "B") {
                            return -12;
                        } else if (piece.toUpperCase() === "N") {
                            return -10;
                        } else {
                            return -5;
                        }
                    } else if (phase === "end") {
                        if (piece.toUpperCase() === "Q" || piece.toUpperCase() === "R") {
                            return -30;
                        } else if (piece.toUpperCase() === "B") {
                            return -20;
                        } else if (piece.toUpperCase() === "N") {
                            return -15;
                        } else {
                            return -10;
                        }
                    }
                }
                if (countAttackers(game, r, c, playerColor) != 0) {
                    if (phase === "middle") {
                        if (piece.toUpperCase() === "Q" || piece.toUpperCase() === "R") {
                            return 20;
                        } else if (piece.toUpperCase() === "B") {
                            return 12;
                        } else if (piece.toUpperCase() === "N") {
                            return 10;
                        } else {
                            return 5;
                        }
                    } else if (phase === "end") {
                        if (piece.toUpperCase() === "Q" || piece.toUpperCase() === "R") {
                            return 30;
                        } else if (piece.toUpperCase() === "B") {
                            return 20;
                        } else if (piece.toUpperCase() === "N") {
                            return 15;
                        } else {
                            return 10;
                        }
                    }
                }
            }
        }
    }

    return 0;
}


function calculateCoverScore(game, phase, maximizingPlayer) {
    if (phase === "opening") return 0;
    const playerColor = maximizingPlayer;
    const opponentColor = opponent(maximizingPlayer);
    const playerKingPos = findKing(game, playerColor);
    const opponentKingPos = findKing(game, opponentColor);
    let score = 0;
    if (!playerKingPos) return score;
    if (!opponentKingPos) return score;

    if (squareIsAttacked(game, playerKingPos[0], playerKingPos[1], opponentColor)) {
        const blockers = findBlockersToKing(game, playerColor);
        for (const b of blockers) {
            if (countAttackers(game, b[0], b[1], opponentColor) === 0) {
                score += 200;
                break;
            }
        }
    }
    if (squareIsAttacked(game, opponentKingPos[0], opponentKingPos[1], playerColor)) {
        const blockers = findBlockersToKing(game, opponentColor);
        for (const b of blockers) {
            if (countAttackers(game, b[0], b[1], playerColor) === 0) {
                score -= 200;
                break;
            }
        }
    }

    return score;
}

function findBlockersToKing(game, color) {
    const kingPos = findKing(game, color);
    if (!kingPos) return [];
    const blockers = [];
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = kingPos[0] + dr;
            const nc = kingPos[1] + dc;
            if (isOnBoard(nr, nc)) {
                const p = game.board[nr][nc];
                if (p && ((color === "w" && isWhite(p)) || (color === "b" && isBlack(p)))) {
                    blockers.push([nr, nc]);
                }
            }
        }
    }
    return blockers;
}

function calculateCaptureValueScore(game, phase, maximizingPlayer) {
    let score = 0;
    for (const move of game.history) {
        if (move.captured) {
            const capVal = PIECE_VALUES[move.captured];
            const capperVal = PIECE_VALUES[move.piece];
            if (move.player === maximizingPlayer) {
                if (capVal > capperVal && capVal - capperVal <= 20) {
                    score += capVal;
                }
                if (capVal > capperVal && capVal - capperVal > 20 && capVal - capperVal <= 200) {
                    score += capVal * 1.2;
                }
                if (capVal > capperVal && capVal - capperVal > 200) {
                    score += capVal - capperVal;
                }
                if (capVal <= capperVal) {
                    score += capVal;
                }
            } else {
                if (capVal > capperVal && capVal - capperVal <= 20) {
                    score -= capVal;
                }
                if (capVal > capperVal && capVal - capperVal > 20 && capVal - capperVal <= 200) {
                    score -= capVal * 1.2;
                }
                if (capVal > capperVal && capVal - capperVal > 200) {
                    score -= capVal - capperVal;
                }
                if (capVal <= capperVal) {
                    score -= capVal;
                }
            }
        }
    }
    return score;
}

function calculatePromotionScore(game, phase, maximizingPlayer) {
    if (phase === "opening" || phase === "middle") return 0;
    let score = 0;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = game.board[r][c];
            if (!p) continue;
            if (p.toUpperCase() === "Q") {
                if (
                    (maximizingPlayer === "w" && isWhite(p) && r === 0) ||
                    (maximizingPlayer === "b" && isBlack(p) && r === 7)
                ) {
                    if (!squareIsAttacked(game, r, c, opponent(maximizingPlayer))) score += 900;
                }
                if (
                    (maximizingPlayer === "w" && isBlack(p) && r === 7) ||
                    (maximizingPlayer === "b" && isWhite(p) && r === 0)
                ) {
                    if (!squareIsAttacked(game, r, c, maximizingPlayer)) score -= 900;
                }
            }
        }
    }
    return score;
}

function calculatePieceAttackScore(game, phase, maximizingPlayer) {
    let score = 0;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = game.board[r][c];
            if (!p) continue;
            const color = isWhite(p) ? "w" : "b";
            const isMaxPlayerPiece = color === maximizingPlayer;
            const opponentColor = opponent(color);
            const attackedSquares = getAttackedSquares(game, r, c);
            for (const [tr, tc] of attackedSquares) {
                const target = game.board[tr][tc];
                if (target && isOpponent(p, target)) {
                    const attackedByOpponent = countAttackers(game, r, c, opponentColor) > 0;
                    const qtyAttackedByPlayer = countAttackers(game, r, c, color);
                    const qtyAttackedByOpponent = countAttackers(game, r, c, opponentColor);
                    if (isMaxPlayerPiece) {
                        if (PIECE_VALUES[p] >= PIECE_VALUES[target]) {
                            if (attackedByOpponent && qtyAttackedByOpponent === 1) {
                                if (!qtyAttackedByPlayer) {
                                    score += -200;
                                }
                                if (qtyAttackedByPlayer) {
                                    score += 2;
                                }
                            }
                            if (attackedByOpponent && qtyAttackedByOpponent > 1) {
                                score += -200;
                            }
                            if (!attackedByOpponent) {
                                score += 2;
                            }
                        } else if (PIECE_VALUES[p] < PIECE_VALUES[target]) {
                            if (attackedByOpponent && qtyAttackedByOpponent === 1) {
                                if (!qtyAttackedByPlayer) {
                                    score += -200;
                                }
                                if (qtyAttackedByPlayer) {
                                    score += 5;
                                }
                            }
                            if (attackedByOpponent && qtyAttackedByOpponent > 1) {
                                score += -200;
                            }
                            if (!attackedByOpponent) {
                                score += 5;
                            }
                        }
                    } else {
                        if (PIECE_VALUES[p] >= PIECE_VALUES[target]) {
                            if (attackedByOpponent && qtyAttackedByOpponent === 1) {
                                if (!qtyAttackedByPlayer) {
                                    score += 200;
                                }
                                if (qtyAttackedByPlayer) {
                                    score += -2;
                                }
                            }
                            if (attackedByOpponent && qtyAttackedByOpponent > 1) {
                                score += 200;
                            }
                            if (!attackedByOpponent) {
                                score += -2;
                            }
                        } else if (PIECE_VALUES[p] < PIECE_VALUES[target]) {
                            if (attackedByOpponent && qtyAttackedByOpponent === 1) {
                                if (!qtyAttackedByPlayer) {
                                    score += 200;
                                }
                                if (qtyAttackedByPlayer) {
                                    score += -5;
                                }
                            }
                            if (attackedByOpponent && qtyAttackedByOpponent > 1) {
                                score += 200;
                            }
                            if (!attackedByOpponent) {
                                score += -5;
                            }
                        }
                    }
                }
            }
        }
    }
    return score;
}


function calculateRepetitionScore(game, maximizingPlayer) {
    for (const posKey in game.positionsCounter) {
        if (game.positionsCounter[posKey] >= 3) {
            const lastChar = posKey.charAt(posKey.length - 1);
            if (lastChar === maximizingPlayer) return -90000;
            else return 90000;
        }
    }
    return 0;
}


function calculateQueenStillness(game, phase, maximizingPlayer, totalMoves) {
    let score = 0;
    if (phase === "opening" && totalMoves < 6) {
        const opponentColor = opponent(maximizingPlayer);
        const opponentQueenPos = findQueen(game, opponentColor);
        const playerQueenPos = findQueen(game, maximizingPlayer);
        if (playerQueenPos) {
            const [r, c] = playerQueenPos;
            if (game.board[r][c]) {
                const pColor = isWhite(game.board[r][c]) ? "w" : "b";
                if (pColor === maximizingPlayer) {
                    if (r !== 0 && c !== 3 && r !== 7 && c !== 3) score -= 150;
                    else score += 150;
                }
            }
        }
        if (opponentQueenPos) {
            const [rr, cc] = opponentQueenPos;
            if (game.board[rr][cc]) {
                const pColor = isWhite(game.board[rr][cc]) ? "w" : "b";
                if (pColor === opponentColor) {
                    if (rr !== 0 && cc !== 3 && rr !== 7 && cc !== 3) score += 150;
                    else score -= 150;
                }
            }
        }
    }
    return score;
}

function calculateKingStillness(game, phase, maximizingPlayer, totalMoves) {
    let score = 0;
    if (phase === "opening" && totalMoves < 10) {
        const opponentColor = opponent(maximizingPlayer);
        const opponentQueenPos = findKing(game, opponentColor);
        const playerQueenPos = findKing(game, maximizingPlayer);
        if (playerQueenPos) {
            const [r, c] = playerQueenPos;
            if (game.board[r][c]) {
                const pColor = isWhite(game.board[r][c]) ? "w" : "b";
                if (pColor === maximizingPlayer) {
                    if (r !== 0 && c !== 4 && r !== 7 && c !== 4) score -= 10;
                    else score += 20;
                }
            }
        }
        if (opponentQueenPos) {
            const [rr, cc] = opponentQueenPos;
            if (game.board[rr][cc]) {
                const pColor = isWhite(game.board[rr][cc]) ? "w" : "b";
                if (pColor === opponentColor) {
                    if (rr !== 0 && cc !== 4 && rr !== 7 && cc !== 4) score += 10;
                    else score -= 20;
                }
            }
        }
    }
    return score;
}


function calculateKingAdjacencyScore(game, phase, maximizingPlayer) {
    if (phase === "opening" || phase === "middle") return 0;
    let score = 0;
    const opponentColor = opponent(maximizingPlayer);
    const opponentKingPos = findKing(game, opponentColor);
    if (!opponentKingPos) return 0;

    const adjSquares = [];
    const [r, c] = opponentKingPos;
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr;
            const nc = c + dc;
            if (isOnBoard(nr, nc)) adjSquares.push([nr, nc]);
        }
    }

    for (const [sr, sc] of adjSquares) {
        const targetPiece = game.board[sr][sc];
        if (targetPiece === null) {
            for (let rr = 0; rr < 8; rr++) {
                for (let cc = 0; cc < 8; cc++) {
                    const p = game.board[rr][cc];
                    if (!p) continue;
                    if ((isWhite(p) ? "w" : "b") !== maximizingPlayer) continue;
                    if (canAttackSquare(game, rr, cc, sr, sc)) {
                        if (countAttackers(game, rr, cc, opponentColor) === 0) {
                            if (p.toUpperCase() === "K" && Math.abs(rr - sr) < 2 && Math.abs(cc - sc) < 2) {
                                score += 20;
                            } else {
                                score += 15;
                            }
                        }
                    }
                }
            }
        }
    }

    const playerKingPos = findKing(game, maximizingPlayer);
    if (!playerKingPos) return score;

    const adjPlayerSquares = [];
    const [pr, pc] = playerKingPos;
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = pr + dr;
            const nc = pc + dc;
            if (isOnBoard(nr, nc)) adjPlayerSquares.push([nr, nc]);
        }
    }

    for (const [sr, sc] of adjPlayerSquares) {
        const targetPiece = game.board[sr][sc];
        if (targetPiece === null) {
            for (let rr = 0; rr < 8; rr++) {
                for (let cc = 0; cc < 8; cc++) {
                    const p = game.board[rr][cc];
                    if (!p) continue;
                    if ((isWhite(p) ? "w" : "b") !== opponent(maximizingPlayer)) continue;
                    if (canAttackSquare(game, rr, cc, sr, sc)) {
                        if (countAttackers(game, rr, cc, maximizingPlayer) === 0) {
                            if (p.toUpperCase() === "K" && Math.abs(rr - sr) < 2 && Math.abs(cc - sc) < 2) {
                                score -= 20;
                            } else {
                                score -= 15;
                            }
                        }
                    }
                }
            }
        }
    }
    return score;
}

async function minimax(game, depth, alpha, beta, maximizingPlayer, move = null) {
    if (depth === 0 || game.gameResult !== null) {
        return { score: evaluateBoard(game, maximizingPlayer, move), move: null };
    }

    const maximizing = game.turn === maximizingPlayer;
    let bestMove = null;

    const legalMoves = generateAllLegalMoves(game);
    if (!legalMoves.length) {
        const kingPos = findKing(game, game.turn);
        if (kingPos && squareIsAttacked(game, kingPos[0], kingPos[1], opponent(game.turn))) {
            return { score: maximizing ? -100000 : 100000, move: null };
        }
        return { score: 0, move: null };
    }

    if (maximizing) {
        let maxEval = -Infinity;
        for (const m of legalMoves) {
            const newGame = simulateMove(game, m);
            detectEndConditions(newGame);
            const result = await minimax(newGame, depth - 1, alpha, beta, maximizingPlayer, m);

            if (result.score > maxEval) {
                maxEval = result.score;
                bestMove = m;
            }
            alpha = Math.max(alpha, maxEval);
            if (beta <= alpha) break;
        }
        return { score: maxEval, move: bestMove };
    } else {
        let minEval = Infinity;
        for (const m of legalMoves) {
            const newGame = simulateMove(game, m);
            detectEndConditions(newGame);
            const result = await minimax(newGame, depth - 1, alpha, beta, maximizingPlayer, m);

            if (result.score < minEval) {
                minEval = result.score;
                bestMove = m;
            }
            beta = Math.min(beta, minEval);
            if (beta <= alpha) break;
        }
        return { score: minEval, move: bestMove };
    }
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
    const posKey = game.getPositionKey();
    if ((game.positionsCounter[posKey] ?? 0) >= 3) {
        game.gameResult = "draw";
        return;
    }
}


function isInsufficientMaterial(game) {
    const pieces = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = game.board[r][c];
            if (p) pieces.push(p);
        }
    }
    if (pieces.length === 2 && pieces.every((p) => p.toUpperCase() === "K")) return true;
    if (pieces.length === 3) {
        const bishopsOrKnights = pieces.filter((p) => ["B", "N"].includes(p.toUpperCase()));
        const kings = pieces.filter((p) => p.toUpperCase() === "K");
        if (kings.length === 2 && bishopsOrKnights.length === 1) return true;
    }
    return false;
}

function createEmptyBoard() {
    const board = Array(8)
        .fill(null)
        .map(() => Array(8).fill(null));
    return board;
}

let currentGame = new GameState();

function recordMove(move) {
    const moveNum = currentGame.history.length + 1;
    const player = move.piece && isWhite(move.piece) ? "White" : "Black";
    const notation = moveToNotation(move, moveNum, player);
    currentGame.history.push({ ...move, notation, player: player[0].toLowerCase() });
}

async function playGameAI1vsAI2() {
    if (currentGame.gameResult || currentGame.isPaused) {
        postMessage({ type: "move_result", payload: { move: null } });
        return;
    }

    if (currentGame.turn === "w" && currentGame.history.length === 0) {
        const rand = Math.random();
        let firstMove = "d2d4";
        if (rand <= 0.5) {
            if (rand <= 0.2) firstMove = "e2e4";
            if (rand > 0.2 && rand < 0.4) firstMove = "e2e3";
            else firstMove = "d2d3";
        } else if (rand > 0.5 && rand < 0.7) {
            firstMove = "d2d4";
        } else if(rand >= 0.7 && rand < 0.8) {
            firstMove = "b1c3";
        } else {
            firstMove = "g1f3";
        }
        const from = coordToIndex(firstMove.slice(0, 2));
        const to = coordToIndex(firstMove.slice(2, 4));
        const piece = currentGame.board[from[0]][from[1]];
        const move = moveObj(from[0], from[1], to[0], to[1], piece);
        if (!moveLeavesKingInCheck(currentGame, move)) {
            await applyMoveAndUpdate(move);
            postMessage({ type: "move_result", payload: { move } });
            return;
        }
    }
    const depth = 3;
    const result = await minimax(currentGame, depth, -Infinity, Infinity, currentGame.turn);

    if (result.move) {
        await applyMoveAndUpdate(result.move);
        postMessage({ type: "move_result", payload: { move: result.move } });
        return;
    } else {
        postMessage({ type: "move_result", payload: { move: null } });

        return;
    }
}

async function applyMoveAndUpdate(move) {
    if (!move) return;
    const newGame = simulateMove(currentGame, move);
    detectEndConditions(newGame);
    recordMove(move);
    if (newGame.gameResult === "white") newGame.whiteScore += 1;
    else if (newGame.gameResult === "black") newGame.blackScore += 1;
    else if (newGame.gameResult === "draw") {
        newGame.whiteScore += 0.5;
        newGame.blackScore += 0.5;
    }
    Object.assign(currentGame, newGame);
}

onmessage = async (e) => {
    const { type, payload } = e.data;
    try {
        switch (type) {
            case "init_game":
                currentGame = new GameState();
                initializeGame(currentGame);
                currentGame.currentMode = "AI1 vs AI2";
                postMessage({ type: "init_complete", payload: { game: currentGame } });
                break;
            case "play_move":
                if (!payload || !payload.gameData) {
                    postMessage({ type: "error", payload: { message: "Invalid game data" } });
                    return;
                }
                currentGame = Object.assign(new GameState(), payload.gameData);
                await playGameAI1vsAI2();
                break;
            case "pause":
                currentGame.isPaused = true;
                break;
            default:
                postMessage({ type: "error", payload: { message: "Unknown message type" } });
        }
    } catch (ex) {
        postMessage({ type: "error", payload: { message: ex.message } });
    }
};

export {
GameState,
coordToIndex,
indexToCoord,
PIECES_SYMBOLS,
initializeGame,
createEmptyBoard
    
};
