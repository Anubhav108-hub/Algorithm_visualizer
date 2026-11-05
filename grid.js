const directions = [[-1, 0], [0, 1], [1, 0], [0, -1]];

class Grid {
  constructor(rows, cols) {
    this.rows = rows;
    this.cols = cols;
    this.walls = new Uint8Array(rows * cols);
    this.start = this.index(Math.floor(rows / 2), 3);
    this.goal = this.index(Math.floor(rows / 2), cols - 4);
  }
  index(row, col) {
    return row * this.cols + col;
  }
  rowOf(index) {
    return Math.floor(index / this.cols);
  }
  colOf(index) {
    return index % this.cols;
  }
  inBounds(row, col) {
    return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
  }
  neighbors(index) {
    const row = this.rowOf(index);
    const col = this.colOf(index);
    const result = [];
    for (const [rowStep, colStep] of directions) {
      const nextRow = row + rowStep;
      const nextCol = col + colStep;
      if (this.inBounds(nextRow, nextCol) && !this.walls[this.index(nextRow, nextCol)]) {
        result.push(this.index(nextRow, nextCol));
      }
    }
    return result;
  }
  setWall(index, value) {
    if (index === this.start || index === this.goal || this.walls[index] === value) {
      return false;
    }
    this.walls[index] = value;
    return true;
  }
  moveEndpoint(kind, index) {
    const other = kind === 'start' ? this.goal : this.start;
    if (index === this[kind] || index === other || this.walls[index]) {
      return false;
    }
    this[kind] = index;
    return true;
  }
  clearWalls() {
    this.walls.fill(0);
  }
  randomize(density) {
    for (let index = 0; index < this.walls.length; index++) {
      this.walls[index] = Math.random() < density ? 1 : 0;
    }
    this.walls[this.start] = 0;
    this.walls[this.goal] = 0;
  }
  generateMaze() {
    this.walls.fill(1);
    const first = this.index(1, 1);
    const stack = [first];
    this.walls[first] = 0;
    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const row = this.rowOf(current);
      const col = this.colOf(current);
      const options = [[-2, 0], [0, 2], [2, 0], [0, -2]].filter(([rowStep, colStep]) => {
        const nextRow = row + rowStep;
        const nextCol = col + colStep;
        return nextRow > 0 && nextRow < this.rows - 1 && nextCol > 0 && nextCol < this.cols - 1 && this.walls[this.index(nextRow, nextCol)] === 1;
      });
      if (options.length === 0) {
        stack.pop();
        continue;
      }
      const [rowStep, colStep] = options[Math.floor(Math.random() * options.length)];
      const next = this.index(row + rowStep, col + colStep);
      this.walls[this.index(row + rowStep / 2, col + colStep / 2)] = 0;
      this.walls[next] = 0;
      stack.push(next);
    }
    for (let row = 1; row < this.rows - 1; row++) {
      for (let col = 1; col < this.cols - 1; col++) {
        if (Math.random() < 0.08) {
          this.walls[this.index(row, col)] = 0;
        }
      }
    }
    this.start = this.index(1, 1);
    this.goal = this.index(this.rows - 2, this.cols - 2);
  }
}
