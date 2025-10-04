/* Single-player Tic Tac Toe
   Player = X (uses Baby-Moose image)
   AI     = O (uses Acorn image)
   Background image applied in CSS (user-provided)
   AI adds a 500ms delay for natural play
*/

/* Image URLs provided by user */
const IMG_X = "https://i.ibb.co/Kjj1tz2f/Baby-Moose.png";
const IMG_O = "https://i.ibb.co/d09pFB9N/acorn.png";

/* DOM */
const boardEl = document.getElementById('board');
const cells = Array.from(document.querySelectorAll('.cell'));
const statusEl = document.getElementById('status');
const restartBtn = document.getElementById('restart-button');

/* Game state */
const PLAYER = 'X';
const AI = 'O';
let boardState = Array(9).fill('');
let gameActive = true;      // false when game ended
let isProcessing = false;   // true while AI is thinking to prevent double moves
const THINK_DELAY = 500;    // ms

/* Winning combinations */
const winConditions = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

/* Preload images for smooth play */
function preloadImages(urls) {
  urls.forEach(url => {
    const img = new Image();
    img.src = url;
  });
}
preloadImages([IMG_X, IMG_O]);

/* Utility: check for winner or draw
   Returns: 'X' or 'O' if winner, 'draw' if no moves left, null if game continues
*/
function checkWinner() {
  for (const combo of winConditions) {
    const [a,b,c] = combo;
    if (boardState[a] && boardState[a] === boardState[b] && boardState[b] === boardState[c]) {
      return boardState[a]; // 'X' or 'O'
    }
  }
  if (!boardState.includes('')) return 'draw';
  return null;
}

/* Apply visual mark to a cell (adds img) */
function renderMark(index, player) {
  const cell = cells[index];
  if (!cell) return;
  cell.classList.add('has-mark');
  cell.setAttribute('data-mark', player);
  cell.innerHTML = ''; // clear any content (safe)
  const img = document.createElement('img');
  img.className = 'mark-image';
  img.alt = player === PLAYER ? 'X mark' : 'O mark';
  img.src = player === PLAYER ? IMG_X : IMG_O;
  cell.appendChild(img);

  // Ensure pop animation by forcing reflow then adding class (some browsers auto-handle)
  void img.offsetWidth;
  // Add a small delay to add final state (transition defined in CSS)
  setTimeout(() => {
    // adding class already not necessary (CSS targets .has-mark), but keep safe
    cell.classList.add('marked-animated');
  }, 10);
}

/* Clear visual marks */
function clearBoardVisuals() {
  cells.forEach(c => {
    c.innerHTML = '';
    c.classList.remove('has-mark','win','marked-animated');
    c.removeAttribute('data-mark');
  });
}

/* Player action */
function handlePlayerMove(index) {
  if (!gameActive || isProcessing) return;
  if (boardState[index] !== '') return; // already occupied

  // Player marks immediately
  boardState[index] = PLAYER;
  renderMark(index, PLAYER);

  // Check outcome
  const result = checkWinner();
  if (result === PLAYER) {
    finishGame(PLAYER);
    return;
  }
  if (result === 'draw') {
    finishGame('draw');
    return;
  }

  // Otherwise, AI's turn
  statusEl.textContent = "AI's Turn";
  isProcessing = true;

  setTimeout(() => {
    aiMove();
    isProcessing = false;
  }, THINK_DELAY);
}

/* AI logic:
   1) if AI can win in one move -> take it
   2) else if player can win in one move -> block it
   3) else take center if available
   4) else random corner/side
*/
function aiMove() {
  if (!gameActive) return;

  const emptyIndices = boardState
    .map((v,i) => v === '' ? i : null)
    .filter(i => i !== null);

  // Helper to find winning move for a given player
  const findWinningMove = (player) => {
    for (const [a,b,c] of winConditions) {
      const line = [a,b,c];
      const marks = line.map(i => boardState[i]);
      const countPlayer = marks.filter(m => m === player).length;
      const countEmpty = marks.filter(m => m === '').length;
      if (countPlayer === 2 && countEmpty === 1) {
        const emptyIndex = line.find(i => boardState[i] === '');
        return emptyIndex;
      }
    }
    return null;
  };

  // 1. Win if possible
  let chosen = findWinningMove(AI);

  // 2. Block player
  if (chosen === null) chosen = findWinningMove(PLAYER);

  // 3. Take center
  if (chosen === null && boardState[4] === '') chosen = 4;

  // 4. Take a corner if available
  const corners = [0,2,6,8].filter(i => boardState[i] === '');
  if (chosen === null && corners.length) {
    chosen = corners[Math.floor(Math.random()*corners.length)];
  }

  // 5. Random fallback
  if (chosen === null) {
    const avail = emptyIndices;
    if (avail.length === 0) {
      // Shouldn't happen because we check draw earlier
      const res = checkWinner();
      if (res === 'draw') finishGame('draw');
      return;
    }
    chosen = avail[Math.floor(Math.random()*avail.length)];
  }

  // Apply AI move
  boardState[chosen] = AI;
  renderMark(chosen, AI);

  // Check result
  const result = checkWinner();
  if (result === AI) {
    finishGame(AI);
    return;
  }
  if (result === 'draw') {
    finishGame('draw');
    return;
  }

  // Continue play
  statusEl.textContent = "Your Turn";
}

/* Finish: show result and highlight winning cells if any */
function finishGame(result) {
  gameActive = false;
  isProcessing = false;

  if (result === PLAYER) {
    statusEl.textContent = "You Win 🎉";
    statusEl.classList.remove('lose','draw');
    statusEl.classList.add('win');
    highlightWinningCells(PLAYER);
  } else if (result === AI) {
    statusEl.textContent = "You Lose 😞";
    statusEl.classList.remove('win','draw');
    statusEl.classList.add('lose');
    highlightWinningCells(AI);
  } else {
    statusEl.textContent = "It's a Draw 🤝";
    statusEl.classList.remove('win','lose');
    statusEl.classList.add('draw');
  }
}

/* Add .win class to the winning trio for visual emphasis */
function highlightWinningCells(player) {
  for (const combo of winConditions) {
    const [a,b,c] = combo;
    if (boardState[a] === player && boardState[b] === player && boardState[c] === player) {
      cells[a].classList.add('win');
      cells[b].classList.add('win');
      cells[c].classList.add('win');
      break;
    }
  }
}

/* Restart game */
function resetGame() {
  boardState = Array(9).fill('');
  gameActive = true;
  isProcessing = false;
  clearBoardVisuals();
  statusEl.textContent = "Your Turn";
  statusEl.classList.remove('win','lose','draw');
}

/* Event delegation for clicks (and keyboard Enter/Space) */
boardEl.addEventListener('click', (e) => {
  const cell = e.target.closest('.cell');
  if (!cell) return;
  const index = Number(cell.getAttribute('data-index'));
  handlePlayerMove(index);
});

boardEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    const cell = e.target.closest('.cell');
    if (!cell) return;
    e.preventDefault();
    const index = Number(cell.getAttribute('data-index'));
    handlePlayerMove(index);
  }
});

restartBtn.addEventListener('click', resetGame);

/* Initialize board visuals just in case */
resetGame();
