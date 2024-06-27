<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-green-100">
    <h1 class="text-4xl font-bold mb-4">オセロ</h1>
    <div class="mb-4">
      <span class="mr-4">黒: {{ blackCount }}</span>
      <span>白: {{ whiteCount }}</span>
    </div>
    <div class="board">
      <template v-for="(row, i) in board">
        <button
          v-for="(cell, j) in row"
          :key="`${i}-${j}`"
          :class="{
            'bg-green-500': cell === EMPTY,
            'bg-black': cell === BLACK,
            'bg-white': cell === WHITE
          }"
          class="cell"
          @click="makeMove(i, j)"
          :disabled="gameOver || cell !== EMPTY || (isCPUOpponent && currentPlayer === WHITE)"
        ></button>
      </template>
    </div>
    <div class="mt-4">
      <p v-if="gameOver" class="text-xl font-bold">
        ゲーム終了! {{ blackCount > whiteCount ? '黒' : whiteCount > blackCount ? '白' : '引き分け' }}の勝ち!
      </p>
      <p v-else class="text-xl">現在の手番: {{ currentPlayer === BLACK ? '黒' : '白' }}</p>
    </div>
    <div class="mt-4 space-x-4">
      <button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" @click="resetGame">ゲームをリセット</button>
      <button class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600" @click="toggleCPUOpponent">
        {{ isCPUOpponent ? "2人プレイに切り替え" : "CPUと対戦" }}
      </button>
    </div>
  </div>
</template>

<script>
const BOARD_SIZE = 8;
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1]
];

const initialBoard = () => {
  const board = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(EMPTY));
  const mid = BOARD_SIZE / 2;
  board[mid-1][mid-1] = WHITE;
  board[mid-1][mid] = BLACK;
  board[mid][mid-1] = BLACK;
  board[mid][mid] = WHITE;
  return board;
};

const POSITION_WEIGHTS = [
  [120, -20, 20,  5,  5, 20, -20, 120],
  [-20, -40, -5, -5, -5, -5, -40, -20],
  [ 20,  -5, 15,  3,  3, 15,  -5,  20],
  [  5,  -5,  3,  3,  3,  3,  -5,   5],
  [  5,  -5,  3,  3,  3,  3,  -5,   5],
  [ 20,  -5, 15,  3,  3, 15,  -5,  20],
  [-20, -40, -5, -5, -5, -5, -40, -20],
  [120, -20, 20,  5,  5, 20, -20, 120]
];

export default {
  data() {
    return {
      board: initialBoard(),
      currentPlayer: BLACK,
      gameOver: false,
      isCPUOpponent: false,
      timer: null,
      BLACK: BLACK,
      WHITE: WHITE,
      EMPTY: EMPTY
    };
  },
  computed: {
    blackCount() {
      return this.board.flat().filter(cell => cell === this.BLACK).length;
    },
    whiteCount() {
      return this.board.flat().filter(cell => cell === this.WHITE).length;
    }
  },
  watch: {
    board: 'handleBoardChange',
    currentPlayer: 'handleCurrentPlayerChange'
  },
  methods: {
    handleBoardChange() {
      if (this.isCPUOpponent && this.currentPlayer === this.WHITE && !this.gameOver) {
        clearTimeout(this.timer);
        this.timer = setTimeout(this.makeCPUMove, 1000);
      }
    },
    handleCurrentPlayerChange() {
      if (!this.canMove(this.board, this.currentPlayer)) {
        if (!this.canMove(this.board, 3 - this.currentPlayer)) {
          this.gameOver = true;
        } else {
          this.currentPlayer = 3 - this.currentPlayer;
        }
      }
    },
    canMove(board, player) {
      for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
          if (this.isValidMove(board, i, j, player)) {
            return true;
          }
        }
      }
      return false;
    },
    isValidMove(board, row, col, player) {
      if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE || board[row][col] !== EMPTY) return false;

      for (const [dx, dy] of DIRECTIONS) {
        let x = row + dx;
        let y = col + dy;
        let canFlip = false;

        while (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
          if (board[x] === undefined || board[x][y] === undefined || board[x][y] === EMPTY) break;
          if (board[x][y] === player) {
            if (canFlip) return true;
            break;
          }
          canFlip = true;
          x += dx;
          y += dy;
        }
      }

      return false;
    },
    makeMove(row, col) {
      if (this.gameOver || !this.isValidMove(this.board, row, col, this.currentPlayer)) return;

      const newBoard = this.board.map(row => [...row]);
      newBoard[row][col] = this.currentPlayer;

      for (const [dx, dy] of DIRECTIONS) {
        let x = row + dx;
        let y = col + dy;
        const toFlip = [];

        while (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
          if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE || newBoard[x] === undefined || newBoard[x][y] === undefined || newBoard[x][y] === EMPTY) break;
          if (newBoard[x][y] === this.currentPlayer) {
            for (const [fx, fy] of toFlip) {
              newBoard[fx][fy] = this.currentPlayer;
            }
            break;
          }
          toFlip.push([x, y]);
          x += dx;
          y += dy;
        }
      }

      this.board = newBoard;
      this.currentPlayer = 3 - this.currentPlayer;
    },
    evaluateBoard(board, player) {
      let score = 0;
      for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
          if (board[i][j] === player) {
            score += POSITION_WEIGHTS[i][j];
          } else if (board[i][j] === 3 - player) {
            score -= POSITION_WEIGHTS[i][j];
          }
        }
      }
      return score;
    },
    getValidMoves(board, player) {
      const validMoves = [];
      for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
          if (this.isValidMove(board, i, j, player)) {
            validMoves.push([i, j]);
          }
        }
      }
      return validMoves;
    },
    minimax(board, depth, maximizingPlayer, alpha, beta) {
      if (depth === 0 || (!this.canMove(board, this.BLACK) && !this.canMove(board, this.WHITE))) {
        return this.evaluateBoard(board, this.WHITE);
      }

      const player = maximizingPlayer ? this.WHITE : this.BLACK;
      const validMoves = this.getValidMoves(board, player);

      if (maximizingPlayer) {
        let maxEval = -Infinity;
        for (const [row, col] of validMoves) {
          const newBoard = board.map(row => [...row]);
          newBoard[row][col] = this.WHITE;
          const evalScore = this.minimax(newBoard, depth - 1, false, alpha, beta);
          maxEval = Math.max(maxEval, evalScore);
          alpha = Math.max(alpha, evalScore);
          if (beta <= alpha) break;
        }
        return maxEval;
      } else {
        let minEval = Infinity;
        for (const [row, col] of validMoves) {
          const newBoard = board.map(row => [...row]);
          newBoard[row][col] = this.BLACK;
          const evalScore = this.minimax(newBoard, depth - 1, true, alpha, beta);
          minEval = Math.min(minEval, evalScore);
          beta = Math.min(beta, evalScore);
          if (beta <= alpha) break;
        }
        return minEval;
      }
    },
    makeCPUMove() {
      const validMoves = this.getValidMoves(this.board, this.WHITE);
      let bestScore = -Infinity;
      let bestMove = null;

      for (const [row, col] of validMoves) {
        const newBoard = this.board.map(row => [...row]);
        newBoard[row][col] = this.WHITE;
        const score = this.minimax(newBoard, 3, false, -Infinity, Infinity);
        if (score > bestScore) {
          bestScore = score;
          bestMove = [row, col];
        }
      }

      if (bestMove) {
        this.makeMove(bestMove[0], bestMove[1]);
      }
    },
    resetGame() {
      this.board = initialBoard();
      this.currentPlayer = this.BLACK;
      this.gameOver = false;
    },
    toggleCPUOpponent() {
      this.isCPUOpponent = !this.isCPUOpponent;
    },
    getClass(cell) {
      if (cell === EMPTY) return 'bg-green-500';
      if (cell === this.BLACK) return 'bg-black';
      return 'bg-white';
    }
  },
  beforeUnmount() {
    clearTimeout(this.timer);
  }
};
</script>

<style scoped>
.board {
  display: grid;
  grid-template-rows: repeat(8, 1fr);
  grid-template-columns: repeat(8, 1fr);
  gap: 2px;
  background-color: #2d6a4f;
  width: 400px;
  height: 400px;
  border: 4px solid #1b4332;
}

.cell {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #1b4332;
}

.bg-green-500 {
  background-color: #4caf50;
}

.bg-black {
  background-color: black;
}

.bg-white {
  background-color: white;
}
</style>
