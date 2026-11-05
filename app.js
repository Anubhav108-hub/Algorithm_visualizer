const $ = id => document.getElementById(id);
const grid = new Grid(21, 33);
const board = $('board');
const renderer = new Renderer(board, grid);
const frontierLimit = 8;
const statusNames = ['unvisited', 'frontier', 'visited'];
let astar;
let brute;
let bruteCells;
let hValues;
let currentState;
let frame = 0;
let total = 0;
let timerId = null;
let hoverIndex = -1;
let dragMode = null;

function runSearch(heuristic) {
  const runs = 20;
  const begin = performance.now();
  let result;
  for (let i = 0; i < runs; i++) {
    result = search(grid, heuristic);
  }
  result.time = (performance.now() - begin) / runs;
  return result;
}

function pathLength(result) {
  return result.path.length > 0 ? result.path.length - 1 : '—';
}

function updateComparison() {
  $('astarExpanded').textContent = astar.expanded;
  $('bruteExpanded').textContent = brute.expanded;
  $('astarLength').textContent = pathLength(astar);
  $('bruteLength').textContent = pathLength(brute);
  $('astarTime').textContent = astar.time.toFixed(3);
  $('bruteTime').textContent = brute.time.toFixed(3);
  const reduction = Math.round((1 - astar.expanded / brute.expanded) * 100);
  $('savings').textContent = reduction > 0 ? `A* expanded ${reduction}% fewer nodes than BFS.` : 'A* expanded no fewer nodes than BFS here.';
}

function recompute() {
  pause();
  const heuristic = heuristics[$('heuristic').value];
  astar = runSearch(heuristic);
  brute = runSearch(heuristics.none);
  bruteCells = new Set(brute.steps.map(step => step.current));
  hValues = Array.from({ length: grid.rows * grid.cols }, (_, index) => heuristic(grid, index, grid.goal));
  total = astar.expanded + Math.max(0, astar.path.length - 1);
  frame = 0;
  updateComparison();
  render();
}

function statusMessage() {
  if (frame === 0) {
    return 'Ready';
  }
  if (frame < astar.expanded) {
    return 'Searching';
  }
  if (frame === astar.expanded) {
    return astar.path.length > 0 ? 'Goal found' : 'No path exists';
  }
  return frame < total ? 'Robot moving' : 'Robot reached the goal';
}

function frontierItem(index) {
  const g = currentState.g[index];
  const h = hValues[index];
  return `<li><span>(${grid.rowOf(index)}, ${grid.colOf(index)})</span><span>g ${g} · h ${formatValue(h, 2)} · f ${formatValue(g + h, 2)}</span></li>`;
}

function updatePanels() {
  const { status, g, current } = currentState;
  const frontier = [];
  let visited = 0;
  for (let index = 0; index < status.length; index++) {
    if (status[index] === cellStatus.open) {
      frontier.push(index);
    } else if (status[index] === cellStatus.closed) {
      visited++;
    }
  }
  frontier.sort((a, b) => g[a] + hValues[a] - g[b] - hValues[b] || hValues[a] - hValues[b]);
  const more = frontier.length > frontierLimit ? `<li class="more">and ${frontier.length - frontierLimit} more</li>` : '';
  $('statusText').textContent = statusMessage();
  $('stepText').textContent = `${frame} / ${total}`;
  $('frontierCount').textContent = frontier.length;
  $('visitedCount').textContent = visited;
  $('currentCost').textContent = current >= 0 ? g[current] : 0;
  $('pathCost').textContent = astar.path.length > 0 && frame >= astar.expanded ? astar.path.length - 1 : '—';
  $('frontierList').innerHTML = frontier.slice(0, frontierLimit).map(frontierItem).join('') + more;
}

function updateCellInfo() {
  const box = $('cellInfo');
  if (hoverIndex < 0) {
    box.textContent = 'Hover over the grid to inspect a cell.';
    return;
  }
  const label = `Cell (${grid.rowOf(hoverIndex)}, ${grid.colOf(hoverIndex)})`;
  const status = currentState.status[hoverIndex];
  const h = hValues[hoverIndex];
  if (grid.walls[hoverIndex]) {
    box.textContent = `${label}: obstacle`;
  } else if (status === cellStatus.unseen) {
    box.textContent = `${label}: unvisited, h ${formatValue(h, 2)}`;
  } else {
    const g = currentState.g[hoverIndex];
    box.textContent = `${label}: ${statusNames[status]}, g ${g}, h ${formatValue(h, 2)}, f ${formatValue(g + h, 2)}`;
  }
}

function render() {
  const found = astar.path.length > 0;
  const moves = Math.max(0, frame - astar.expanded);
  currentState = replay(astar.steps, Math.min(frame, astar.expanded), grid.rows * grid.cols);
  renderer.draw({
    status: currentState.status,
    g: currentState.g,
    h: hValues,
    current: currentState.current,
    overlay: $('showOverlay').checked ? bruteCells : null,
    path: found && frame >= astar.expanded ? astar.path.slice(0, moves + 1) : [],
    robot: found ? astar.path[moves] : grid.start,
    showValues: $('showValues').checked
  });
  updatePanels();
  updateCellInfo();
}

function stepBy(delta) {
  frame = Math.min(total, Math.max(0, frame + delta));
  render();
  if (frame === total) {
    pause();
  }
}

function startTimer() {
  clearInterval(timerId);
  timerId = setInterval(() => stepBy(1), 1000 / Number($('speed').value));
}

function play() {
  if (frame >= total) {
    frame = 0;
    render();
  }
  $('playBtn').textContent = 'Pause';
  startTimer();
}

function pause() {
  clearInterval(timerId);
  timerId = null;
  $('playBtn').textContent = 'Play';
}

function applyDrag(index) {
  const changed = dragMode === 'start' || dragMode === 'goal' ? grid.moveEndpoint(dragMode, index) : grid.setWall(index, dragMode === 'draw' ? 1 : 0);
  if (changed) {
    recompute();
  }
}

board.addEventListener('pointerdown', event => {
  const index = renderer.cellAt(event);
  if (index < 0) {
    return;
  }
  board.setPointerCapture(event.pointerId);
  if (index === grid.start) {
    dragMode = 'start';
  } else if (index === grid.goal) {
    dragMode = 'goal';
  } else {
    dragMode = grid.walls[index] ? 'erase' : 'draw';
    applyDrag(index);
  }
});

board.addEventListener('pointermove', event => {
  const index = renderer.cellAt(event);
  hoverIndex = index;
  if (dragMode && index >= 0) {
    applyDrag(index);
  }
  updateCellInfo();
});

board.addEventListener('pointerup', () => {
  dragMode = null;
});

board.addEventListener('pointercancel', () => {
  dragMode = null;
});

board.addEventListener('pointerleave', () => {
  hoverIndex = -1;
  updateCellInfo();
});

$('playBtn').addEventListener('click', () => {
  if (timerId === null) {
    play();
  } else {
    pause();
  }
});

$('forwardBtn').addEventListener('click', () => {
  pause();
  stepBy(1);
});

$('backBtn').addEventListener('click', () => {
  pause();
  stepBy(-1);
});

$('resetBtn').addEventListener('click', () => {
  pause();
  frame = 0;
  render();
});

$('speed').addEventListener('input', () => {
  $('speedLabel').textContent = `${$('speed').value} steps/s`;
  if (timerId !== null) {
    startTimer();
  }
});

$('density').addEventListener('input', () => {
  $('densityLabel').textContent = `${$('density').value}%`;
});

$('heuristic').addEventListener('change', recompute);

$('randomBtn').addEventListener('click', () => {
  grid.randomize(Number($('density').value) / 100);
  recompute();
});

$('mazeBtn').addEventListener('click', () => {
  grid.generateMaze();
  recompute();
});

$('clearBtn').addEventListener('click', () => {
  grid.clearWalls();
  recompute();
});

$('showOverlay').addEventListener('change', render);
$('showValues').addEventListener('change', render);

grid.randomize(0.25);
recompute();
