const gameBoard = document.getElementById('game-board');
const messageElement = document.getElementById('message');
const startButton = document.getElementById('start-button');
const rowsInput = document.getElementById('rows');
const colsInput = document.getElementById('cols');
const minesInput = document.getElementById('mines');

let rows = 10;
let cols = 10;
let mineCount = 10;
let board = [];
let revealedCells = 0;
let flaggedCells = 0;
let gameOver = false;
let firstClick = true;

startButton.addEventListener('click', startGame);

function startGame() {
    rows = parseInt(rowsInput.value);
    cols = parseInt(colsInput.value);
    mineCount = parseInt(minesInput.value);

    // 入力値のバリデーション
    if (rows < 5 || rows > 20 || cols < 5 || cols > 20 || mineCount < 1 || mineCount >= rows * cols) {
        messageElement.textContent = '無効な設定です。行/列は5-20、地雷数は1以上かつセル数未満にしてください。';
        return;
    }

    revealedCells = 0;
    flaggedCells = 0;
    gameOver = false;
    firstClick = true;
    messageElement.textContent = '';
    gameBoard.innerHTML = ''; // Clear previous board
    gameBoard.style.gridTemplateColumns = `repeat(${cols}, 30px)`;
    board = createBoard(rows, cols);
    renderBoard();
}

function createBoard(rows, cols) {
    const newBoard = [];
    for (let r = 0; r < rows; r++) {
        newBoard[r] = [];
        for (let c = 0; c < cols; c++) {
            newBoard[r][c] = {
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                adjacentMines: 0,
                element: null // DOM element reference
            };
        }
    }
    return newBoard;
}

function placeMines(board, mineCount, initialClickRow, initialClickCol) {
    let minesPlaced = 0;
    while (minesPlaced < mineCount) {
        const r = Math.floor(Math.random() * rows);
        const c = Math.floor(Math.random() * cols);

        // Ensure the first clicked cell and its neighbors are not mines
        const isInitialClickArea = Math.abs(r - initialClickRow) <= 1 && Math.abs(c - initialClickCol) <= 1;

        if (!board[r][c].isMine && !(firstClick && isInitialClickArea)) {
            board[r][c].isMine = true;
            minesPlaced++;
        }
    }
}

function calculateAdjacentMines(board) {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (board[r][c].isMine) continue;
            let count = 0;
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].isMine) {
                        count++;
                    }
                }
            }
            board[r][c].adjacentMines = count;
        }
    }
}

function renderBoard() {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cellElement = document.createElement('div');
            cellElement.classList.add('cell');
            cellElement.dataset.row = r;
            cellElement.dataset.col = c;
            cellElement.addEventListener('click', handleCellClick);
            cellElement.addEventListener('contextmenu', handleCellRightClick); // Right-click
            gameBoard.appendChild(cellElement);
            board[r][c].element = cellElement; // Store reference
        }
    }
}

function handleCellClick(event) {
    if (gameOver) return;

    const cellElement = event.target;
    const r = parseInt(cellElement.dataset.row);
    const c = parseInt(cellElement.dataset.col);
    const cell = board[r][c];

    if (cell.isFlagged || cell.isRevealed) return;

    // First click logic: place mines after the first click
    if (firstClick) {
        placeMines(board, mineCount, r, c);
        calculateAdjacentMines(board);
        firstClick = false;
    }

    if (cell.isMine) {
        gameOverHandler(false); // Lose
        cellElement.classList.add('mine');
        cellElement.textContent = '💣';
    } else {
        revealCell(r, c);
        if (cell.adjacentMines === 0) {
            revealNeighbors(r, c);
        }
        checkWinCondition();
    }
}

function handleCellRightClick(event) {
    event.preventDefault(); // Prevent context menu
    if (gameOver) return;

    const cellElement = event.target;
    const r = parseInt(cellElement.dataset.row);
    const c = parseInt(cellElement.dataset.col);
    const cell = board[r][c];

    if (cell.isRevealed) return;

    cell.isFlagged = !cell.isFlagged;
    cellElement.classList.toggle('flagged');
    flaggedCells += cell.isFlagged ? 1 : -1;
    // Optional: Update mine counter display if you add one
    // checkWinCondition(); // Win condition can also be checked here if flagging all mines wins
}

function revealCell(r, c) {
    const cell = board[r][c];
    if (cell.isRevealed || cell.isFlagged) return; // Don't reveal flagged cells

    cell.isRevealed = true;
    cell.element.classList.add('revealed');
    revealedCells++;

    if (cell.adjacentMines > 0) {
        cell.element.textContent = cell.adjacentMines;
        // Add number coloring based on count
        cell.element.classList.add(`num-${cell.adjacentMines}`);
    } else {
        // Keep it empty for 0 adjacent mines
        cell.element.textContent = '';
    }
}

function revealNeighbors(r, c) {
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr;
            const nc = c + dc;

            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                const neighbor = board[nr][nc];
                if (!neighbor.isRevealed && !neighbor.isFlagged && !neighbor.isMine) {
                    revealCell(nr, nc);
                    if (neighbor.adjacentMines === 0) {
                        revealNeighbors(nr, nc); // Recursive call
                    }
                }
            }
        }
    }
}

function gameOverHandler(isWin) {
    gameOver = true;
    messageElement.textContent = isWin ? 'クリア！おめでとう！' : 'ゲームオーバー！';

    // Reveal all mines
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cell = board[r][c];
            if (cell.isMine) {
                cell.element.classList.add('revealed'); // Show mine location
                if (!cell.isFlagged) { // Only show bomb if not correctly flagged
                     cell.element.classList.add('mine');
                     cell.element.textContent = '💣';
                }
            }
            // Disable further clicks visually (optional, handled by gameOver flag)
            cell.element.style.cursor = 'default';
        }
    }
}

function checkWinCondition() {
    const totalNonMineCells = rows * cols - mineCount;
    if (revealedCells === totalNonMineCells) {
        gameOverHandler(true); // Win
    }
}


// Initial call to render an empty board placeholder or default size
startGame(); // Start with default values
