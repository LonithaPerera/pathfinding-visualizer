# Pathfinding Visualizer

An interactive visualizer for 6 classic pathfinding algorithms. Draw walls, place weighted nodes, generate mazes, and watch the algorithms find the shortest path in real time.

![Pathfinding Visualizer Screenshot](screenshot.png)

## Features

- **6 algorithms** — A*, Dijkstra's, BFS, DFS, Greedy Best-First, Bidirectional BFS
- **Draw modes** — walls, weighted nodes (cost ×5), set start/end, erase
- **Diagonal movement** toggle
- **Recursive division maze generator**
- **Clear path** — reset visited/path cells while keeping your walls
- **Color-coded animation** — blue (visited), purple (reverse search), gold (path)
- **Stats** — visited node count and final path length

## Algorithms

| Algorithm | Weighted | Shortest Path |
|-----------|----------|---------------|
| A* Search | Yes | Yes |
| Dijkstra's | Yes | Yes |
| BFS | No | Yes (unweighted) |
| DFS | No | No |
| Greedy Best-First | No | No |
| Bidirectional BFS | No | Yes |

## How to Use

1. **Draw walls** — click and drag on the grid
2. **Add weights** — switch to Weight mode, click cells (costs 5× to cross)
3. **Move start/end** — select Start or End mode, click a cell
4. **Generate a maze** — click "Generate Maze"
5. **Run** — pick an algorithm and click "Visualize"
6. **Clear path** — keep walls, reset the search to try another algorithm

## How to Run

No installation needed.

```bash
git clone https://github.com/LonithaPerera/pathfinding-visualizer
cd pathfinding-visualizer
# open index.html in your browser
```

## Tech Stack

- HTML5
- CSS3 (grid layout, keyframe animations)
- Vanilla JavaScript (min-heap priority queue, recursive division)

## Topics

`javascript` `pathfinding` `a-star` `dijkstra` `algorithm-visualizer` `bfs` `dfs` `maze-generation`
