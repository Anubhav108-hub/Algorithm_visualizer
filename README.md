# Algorithm Visualizer

Interactive visualization of A* on a 2D grid with static obstacles. A robot follows the optimal path once the search finishes, and the heuristic-guided search is compared against a brute-force breadth-first search.

## Run

Open `index.html` in any modern browser. No build step or dependencies.

## Features

- Draw or erase obstacles by clicking and dragging on the grid
- Drag the start and goal cells to new positions
- Random obstacle generator with adjustable density and a maze generator
- Manhattan and Euclidean heuristics
- Step back, play/pause, step forward, reset and a speed slider
- Live frontier (open list), visited (closed list), current g(n) and final path cost
- Optional f(n) values on every explored cell and hover details with g, h and f
- Brute-force overlay shading the cells BFS would have expanded
- Comparison panel with nodes expanded, path length and time for A* and BFS

## Project structure

| File | Responsibility |
| --- | --- |
| `algorithms.js` | A* search, binary heap, heuristics, step replay |
| `renderer.js` | Canvas drawing of the grid, search state, path and robot |
| `app.js` | Controls, playback, panels and pointer input |
| `grid.js` | Grid model, obstacle editing, random and maze generators |
| `index.html`, `style.css` | Page layout and styling |

## Algorithm notes

- Movement is 4-directional with unit cost per move.
- Both heuristics are admissible and consistent, so each node is expanded at most once and the path is optimal.
- Ties on f are broken by the smaller h, then by insertion order.
- Brute force is the same search with the heuristic set to zero, which expands nodes in breadth-first order.
- Each search is recorded as a list of steps (the expanded node and the cost updates it caused). The animation replays this list up to the current step, which is what makes stepping backward possible.
- Reported times are the mean of 20 runs of each search.
