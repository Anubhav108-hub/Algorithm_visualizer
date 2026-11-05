const palette = {
  empty: '#ffffff',
  wall: '#374151',
  line: '#d9dde3',
  open: '#fcd34d',
  closed: '#93c5fd',
  current: '#f97316',
  path: '#4ade80',
  overlay: '#fecaca',
  start: '#16a34a',
  goal: '#dc2626',
  robot: '#111827',
  text: '#1f2933'
};

function formatValue(value, digits) {
  return Number.isInteger(value) ? String(value) : value.toFixed(digits);
}

class Renderer {
  constructor(canvas, grid) {
    const ratio = window.devicePixelRatio || 1;
    this.canvas = canvas;
    this.grid = grid;
    this.cellSize = 27;
    canvas.width = grid.cols * this.cellSize * ratio;
    canvas.height = grid.rows * this.cellSize * ratio;
    this.context = canvas.getContext('2d');
    this.context.scale(ratio, ratio);
  }
  cellAt(event) {
    const rect = this.canvas.getBoundingClientRect();
    const col = Math.floor((event.clientX - rect.left) / rect.width * this.grid.cols);
    const row = Math.floor((event.clientY - rect.top) / rect.height * this.grid.rows);
    return this.grid.inBounds(row, col) ? this.grid.index(row, col) : -1;
  }
  centerOf(index) {
    return [(this.grid.colOf(index) + 0.5) * this.cellSize, (this.grid.rowOf(index) + 0.5) * this.cellSize];
  }
  fillCell(index, color) {
    this.context.fillStyle = color;
    this.context.fillRect(this.grid.colOf(index) * this.cellSize, this.grid.rowOf(index) * this.cellSize, this.cellSize, this.cellSize);
  }
  cellColor(index, view) {
    if (this.grid.walls[index]) {
      return palette.wall;
    }
    if (index === view.current) {
      return palette.current;
    }
    if (view.status[index] === cellStatus.closed) {
      return palette.closed;
    }
    if (view.status[index] === cellStatus.open) {
      return palette.open;
    }
    return view.overlay && view.overlay.has(index) ? palette.overlay : palette.empty;
  }
  drawLines() {
    const { context, cellSize, grid } = this;
    context.strokeStyle = palette.line;
    context.lineWidth = 1;
    context.beginPath();
    for (let row = 0; row <= grid.rows; row++) {
      context.moveTo(0, row * cellSize);
      context.lineTo(grid.cols * cellSize, row * cellSize);
    }
    for (let col = 0; col <= grid.cols; col++) {
      context.moveTo(col * cellSize, 0);
      context.lineTo(col * cellSize, grid.rows * cellSize);
    }
    context.stroke();
  }
  drawValues(view) {
    const { context, grid, cellSize } = this;
    context.fillStyle = palette.text;
    context.font = `${cellSize * 0.4}px system-ui, sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    for (let index = 0; index < grid.walls.length; index++) {
      if (!grid.walls[index] && view.status[index] !== cellStatus.unseen) {
        const [x, y] = this.centerOf(index);
        context.fillText(formatValue(view.g[index] + view.h[index], 1), x, y);
      }
    }
  }
  drawMarker(index, color, label) {
    this.fillCell(index, color);
    if (label) {
      const [x, y] = this.centerOf(index);
      this.context.fillStyle = '#ffffff';
      this.context.font = `bold ${this.cellSize * 0.5}px system-ui, sans-serif`;
      this.context.textAlign = 'center';
      this.context.textBaseline = 'middle';
      this.context.fillText(label, x, y);
    }
  }
  drawRobot(index) {
    const [x, y] = this.centerOf(index);
    this.context.beginPath();
    this.context.arc(x, y, this.cellSize * 0.3, 0, Math.PI * 2);
    this.context.fillStyle = palette.robot;
    this.context.fill();
    this.context.lineWidth = 2;
    this.context.strokeStyle = '#ffffff';
    this.context.stroke();
  }
  draw(view) {
    const { grid, cellSize } = this;
    this.context.clearRect(0, 0, grid.cols * cellSize, grid.rows * cellSize);
    for (let index = 0; index < grid.walls.length; index++) {
      this.fillCell(index, this.cellColor(index, view));
    }
    for (const index of view.path) {
      this.fillCell(index, palette.path);
    }
    this.drawLines();
    if (view.showValues) {
      this.drawValues(view);
    }
    this.drawMarker(grid.start, palette.start, '');
    this.drawMarker(grid.goal, palette.goal, 'G');
    this.drawRobot(view.robot);
  }
}
