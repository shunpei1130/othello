let pegs = [[], [], []];
let heldDisk = null;
let heldFrom = null;
let diskCount = 3;

function setup() {
  const input = document.getElementById('disk-count');
  diskCount = parseInt(input.value, 10);
  if (isNaN(diskCount) || diskCount < 1) diskCount = 3;
  pegs = [[], [], []];
  for (let i = diskCount; i >= 1; i--) {
    pegs[0].push(i);
  }
  heldDisk = null;
  heldFrom = null;
  render();
  document.getElementById('message').textContent = '';
}

function render() {
  for (let i = 0; i < 3; i++) {
    const pegEl = document.getElementById(`peg-${i}`);
    pegEl.innerHTML = '';
    pegs[i].forEach(size => {
      const d = document.createElement('div');
      d.className = 'disk';
      d.style.width = 20 + size * 15 + 'px';
      d.style.marginLeft = (60 - (20 + size * 15) / 2) + 'px';
      pegEl.appendChild(d);
    });
  }
}

function handlePegClick(index) {
  if (heldDisk === null) {
    if (pegs[index].length === 0) return;
    heldDisk = pegs[index].pop();
    heldFrom = index;
  } else {
    if (pegs[index].length === 0 || pegs[index][pegs[index].length - 1] > heldDisk) {
      pegs[index].push(heldDisk);
      heldDisk = null;
      heldFrom = null;
      if (pegs[2].length === diskCount) {
        document.getElementById('message').textContent = 'You solved it!';
      }
    } else {
      // invalid move
      pegs[heldFrom].push(heldDisk);
      heldDisk = null;
      heldFrom = null;
    }
  }
  render();
}

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('start-btn').addEventListener('click', setup);
  for (let i = 0; i < 3; i++) {
    document.getElementById(`peg-${i}`).addEventListener('click', () => handlePegClick(i));
  }
  setup();
});
