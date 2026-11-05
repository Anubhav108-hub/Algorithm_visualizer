const cellStatus = { unseen: 0, open: 1, closed: 2 };

const heuristics = {
  manhattan: (grid, a, b) => Math.abs(grid.rowOf(a) - grid.rowOf(b)) + Math.abs(grid.colOf(a) - grid.colOf(b)),
  euclidean: (grid, a, b) => Math.hypot(grid.rowOf(a) - grid.rowOf(b), grid.colOf(a) - grid.colOf(b)),
  none: () => 0
};

function compareNodes(a, b) {
  return a.f - b.f || a.h - b.h || a.seq - b.seq;
}

class MinHeap {
  constructor() {
    this.items = [];
  }
  get size() {
    return this.items.length;
  }
  push(item) {
    const items = this.items;
    items.push(item);
    let child = items.length - 1;
    while (child > 0) {
      const parent = (child - 1) >> 1;
      if (compareNodes(items[parent], items[child]) <= 0) {
        break;
      }
      [items[parent], items[child]] = [items[child], items[parent]];
      child = parent;
    }
  }
  pop() {
    const items = this.items;
    const top = items[0];
    const last = items.pop();
    if (items.length > 0) {
      items[0] = last;
      let parent = 0;
      while (true) {
        const left = parent * 2 + 1;
        const right = left + 1;
        let smallest = parent;
        if (left < items.length && compareNodes(items[left], items[smallest]) < 0) {
          smallest = left;
        }
        if (right < items.length && compareNodes(items[right], items[smallest]) < 0) {
          smallest = right;
        }
        if (smallest === parent) {
          break;
        }
        [items[parent], items[smallest]] = [items[smallest], items[parent]];
        parent = smallest;
      }
    }
    return top;
  }
}

function tracePath(parents, goal) {
  const path = [];
  for (let node = goal; node !== -1; node = parents[node]) {
    path.push(node);
  }
  return path.reverse();
}

function search(grid, heuristic) {
  const { start, goal } = grid;
  const size = grid.rows * grid.cols;
  const costs = new Array(size).fill(Infinity);
  const parents = new Array(size).fill(-1);
  const closed = new Array(size).fill(false);
  const heap = new MinHeap();
  const steps = [{ current: -1, updates: [{ index: start, g: 0 }] }];
  const startH = heuristic(grid, start, goal);
  let sequence = 0;
  costs[start] = 0;
  heap.push({ index: start, f: startH, h: startH, seq: sequence++ });
  while (heap.size > 0) {
    const node = heap.pop();
    if (closed[node.index]) {
      continue;
    }
    closed[node.index] = true;
    const updates = [];
    steps.push({ current: node.index, updates });
    if (node.index === goal) {
      return { steps, path: tracePath(parents, goal), expanded: steps.length - 1 };
    }
    for (const next of grid.neighbors(node.index)) {
      const g = costs[node.index] + 1;
      if (closed[next] || g >= costs[next]) {
        continue;
      }
      const h = heuristic(grid, next, goal);
      costs[next] = g;
      parents[next] = node.index;
      heap.push({ index: next, f: g + h, h, seq: sequence++ });
      updates.push({ index: next, g });
    }
  }
  return { steps, path: [], expanded: steps.length - 1 };
}

function replay(steps, upTo, size) {
  const g = new Array(size).fill(Infinity);
  const status = new Uint8Array(size);
  for (let i = 0; i <= upTo; i++) {
    const { current, updates } = steps[i];
    if (current >= 0) {
      status[current] = cellStatus.closed;
    }
    for (const update of updates) {
      g[update.index] = update.g;
      if (status[update.index] === cellStatus.unseen) {
        status[update.index] = cellStatus.open;
      }
    }
  }
  return { g, status, current: steps[upTo].current };
}
