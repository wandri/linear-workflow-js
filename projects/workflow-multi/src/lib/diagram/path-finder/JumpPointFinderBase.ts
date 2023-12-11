class MatrixNode {
  x: number;
  y: number;

  weight: number;
  opened: boolean = false;
  closed: boolean = false;
  parent: MatrixNode | undefined;
  g = 0;
  f = 0;
  h = 0;

  constructor(x: number, y: number, weight: number) {
    this.x = x;
    this.y = y;
    this.weight = weight;
  }
}

class Heap {
  nodes: MatrixNode[];
  fn: (a: MatrixNode, b: MatrixNode) => number;
  top = this.peek;

  constructor(fn: (a: MatrixNode, b: MatrixNode) => number) {
    this.fn = fn;
    this.nodes = [];
  }

  push(x: MatrixNode) {
    return this.TopHeappush(this.nodes, x);
  };

  pop() {
    return this.TopHeappop(this.nodes);
  };

  peek() {
    return this.nodes[0];
  };

  updateItem(x: MatrixNode) {
    return this.TopUpdateItem(this.nodes, x);
  };

  TopUpdateItem(array: MatrixNode[], item: MatrixNode) {
    const pos = array.indexOf(item);
    if (pos === -1) {
      return;
    }
    this.TopSiftdown(array, 0, pos);
    return this.TopSiftup(array, pos);
  };

  TopSiftdown(array: MatrixNode[], startPosition: number, pos: number) {
    const newItem = array[pos];
    while (pos > startPosition) {
      const parentPosition = (pos - 1) >> 1;
      const parent = array[parentPosition];
      if (this.fn(newItem, parent) < 0) {
        array[pos] = parent;
        pos = parentPosition;
        continue;
      }
      break;
    }
    return array[pos] = newItem;
  };

  TopSiftup(array: MatrixNode[], pos: number) {
    const endPosition = array.length;
    const startPosition = pos;
    const newItem = array[pos];
    let childPosition = 2 * pos + 1;
    while (childPosition < endPosition) {
      const rightPosition = childPosition + 1;
      if (rightPosition < endPosition && !(this.fn(array[childPosition], array[rightPosition]) < 0)) {
        childPosition = rightPosition;
      }
      array[pos] = array[childPosition];
      pos = childPosition;
      childPosition = 2 * pos + 1;
    }
    array[pos] = newItem;
    return this.TopSiftdown(array, startPosition, pos);
  };

  TopHeappush(array: MatrixNode[], item: MatrixNode) {
    array.push(item);
    return this.TopSiftdown(array, 0, array.length - 1);
  };

  TopHeappop(array: MatrixNode[]): MatrixNode | undefined {
    const lastElement = array.pop();
    if (array.length > 0) {
      const returnItem = array[0];
      array[0] = lastElement as MatrixNode;
      this.TopSiftup(array, 0);
      return returnItem;
    } else {
      return lastElement;
    }
  };

  empty(): boolean {
    return this.nodes.length === 0;
  };
}

class Heuristic {
  static manhattan(dx: number, dy: number): number {
    return dx + dy;
  };

  static octile(dx: number, dy: number): number {
    const F = Math.SQRT2 - 1;
    return (dx < dy) ? F * dx + dy : F * dy + dx;
  };
}

export class JumpPointFinderBase {

  grid: Grid;
  heuristic: (dx: number, dy: number) => number;
  openList: Heap;
  startNode: MatrixNode | undefined;
  endNode: MatrixNode | undefined;

  constructor(grid: Grid) {
    this.grid = grid.clone();
    this.heuristic = Heuristic.manhattan;
    this.openList = new Heap((nodeA: MatrixNode, nodeB: MatrixNode) => {
      return nodeA.f - nodeB.f;
    });
  }

  findPath(start: [number, number], end: [number, number]): [number, number][] {
    const openList = this.openList = new Heap((nodeA: MatrixNode, nodeB: MatrixNode) => {
      return nodeA.f - nodeB.f;
    });
    const grid = this.grid;
    const startNode: MatrixNode = this.startNode = grid.getNodeAt(start[0], start[1]);
    const endNode: MatrixNode = this.endNode = grid.getNodeAt(end[0], end[1]);

    let node;
    // set the `g` and `f` value of the start node to be 0
    startNode.g = 0;
    startNode.f = 0;

    // push the start node into the open list
    openList.push(startNode);
    startNode.opened = true;

    // while the open list is not empty
    while (!openList.empty()) {
      // pop the position of node which has the minimum `f` value.
      node = openList.pop() as MatrixNode;
      node.closed = true;

      if (node === endNode) {
        return expandPath(this.backtrace(endNode));
      }

      this.identifySuccessors(node);
    }

    // fail to find the path
    return [];
  };

  backtrace(node: MatrixNode): [number, number][] {
    const path: [number, number][] = [[node.x, node.y]];
    while (node.parent) {
      node = node.parent;
      path.push([node.x, node.y]);
    }
    return path.reverse();
  }

  identifySuccessors(node: MatrixNode) {
    const grid = this.grid;
    const heuristic = this.heuristic;
    const openList = this.openList;
    const endX = this.endNode?.x || 0;
    const endY = this.endNode?.y || 0;

    let x = node.x;
    let y = node.y;
    const abs = Math.abs;

    const neighbors = this.findNeighbors(node);
    for (let i = 0, l = neighbors.length; i < l; ++i) {
      const neighbor = neighbors[i];
      const jumpPoint = this.jump(neighbor[0], neighbor[1], x, y);
      if (jumpPoint) {
        const jx = jumpPoint[0];
        const jy = jumpPoint[1];
        const jumpNode = grid.getNodeAt(jx, jy);

        if (jumpNode.closed) {
          continue;
        }

        // include distance, as parent may not be immediately adjacent:
        const d = Heuristic.octile(abs(jx - x), abs(jy - y));
        const ng = node.g + d; // next `g` value

        if (!jumpNode.opened || ng < jumpNode.g) {
          jumpNode.g = ng;
          jumpNode.h = jumpNode.h || heuristic(abs(jx - endX), abs(jy - endY));
          jumpNode.f = jumpNode.g + jumpNode.h;
          jumpNode.parent = node;

          if (!jumpNode.opened) {
            openList.push(jumpNode);
            jumpNode.opened = true;
          } else {
            openList.updateItem(jumpNode);
          }
        }
      }
    }
  }

  jump(x: number, y: number, px: number, py: number): [number, number] | null {
    const grid = this.grid;
    const dx = x - px;
    const dy = y - py;

    if (!grid.isWalkableAt(x, y)) {
      return null;
    }

    if (grid.getNodeAt(x, y) === this.endNode) {
      return [x, y];
    }

    if (dy !== 0) {
      if ((grid.isWalkableAt(x - 1, y) && !grid.isWalkableAt(x - 1, y - dy)) ||
        (grid.isWalkableAt(x + 1, y) && !grid.isWalkableAt(x + 1, y - dy))) {
        return [x, y];
      }
    } else if (dx !== 0) {
      if ((grid.isWalkableAt(x, y - 1) && !grid.isWalkableAt(x - dx, y - 1)) ||
        (grid.isWalkableAt(x, y + 1) && !grid.isWalkableAt(x - dx, y + 1))) {
        return [x, y];
      }
      //When moving horizontally, must check for vertical jump points
      if (this.jump(x, y + 1, x, y) || this.jump(x, y - 1, x, y)) {
        return [x, y];
      }
    } else {
      throw new Error("Only horizontal and vertical movements are allowed");
    }

    return this.jump(x + dx, y + dy, x, y);
  };

  findNeighbors(node: MatrixNode): [number, number][] {
    const parent = node.parent;
    const x = node.x
    const y = node.y;
    const grid = this.grid;

    const neighbors: [number, number][] = [];

    // directed pruning: can ignore most neighbors, unless forced.
    if (parent) {
      const px = parent.x;
      const py = parent.y;
      // get the normalized direction of travel
      const dx = (x - px) / Math.max(Math.abs(x - px), 1);
      const dy = (y - py) / Math.max(Math.abs(y - py), 1);

      if (dy !== 0) {
        if (grid.isWalkableAt(x + 1, y)) {
          neighbors.push([x + 1, y]);
        }
        if (grid.isWalkableAt(x - 1, y)) {
          neighbors.push([x - 1, y]);
        }
        if (grid.isWalkableAt(x, y + dy)) {
          neighbors.push([x, y + dy]);
        }
      } else if (dx !== 0) {
        if (grid.isWalkableAt(x + dx, y)) {
          neighbors.push([x + dx, y]);
        }
        if (grid.isWalkableAt(x, y - 1)) {
          neighbors.push([x, y - 1]);
        }
        if (grid.isWalkableAt(x, y + 1)) {
          neighbors.push([x, y + 1]);
        }
      }
    }
    // return all neighbors
    else {
      const neighborNodes = grid.getNeighbors(node);
      for (let i = 0, l = neighborNodes.length; i < l; ++i) {
        const neighborNode = neighborNodes[i];
        neighbors.push([neighborNode.x, neighborNode.y]);
      }
    }

    return neighbors;
  };
}

function expandPath(path: [number, number][]): [number, number][] {
  const expanded: [number, number][] = [];
  const len = path.length;
  if (len < 2) {
    return expanded;
  }

  for (let i = 0; i < len - 1; ++i) {
    const coord0 = path[i];
    const coord1 = path[i + 1];

    const interpolated: [number, number][] = interpolate(coord0[0], coord0[1], coord1[0], coord1[1]);
    const interpolatedLen = interpolated.length;
    for (let j = 0; j < interpolatedLen - 1; ++j) {
      expanded.push(interpolated[j]);
    }
  }
  expanded.push(path[len - 1]);

  return expanded;
}

function interpolate(x0: number, y0: number, x1: number, y1: number): [number, number][] {
  const abs = Math.abs;
  const line: [number, number][] = [];

  const dx = abs(x1 - x0);
  const dy = abs(y1 - y0);

  const sx = (x0 < x1) ? 1 : -1;
  const sy = (y0 < y1) ? 1 : -1;

  let err = dx - dy;

  while (true) {
    line.push([x0, y0]);

    if (x0 === x1 && y0 === y1) {
      break;
    }

    const e2 = 2 * err;
    if (e2 > -dy) {
      err = err - dy;
      x0 = x0 + sx;
    }
    if (e2 < dx) {
      err = err + dx;
      y0 = y0 + sy;
    }
  }

  return line;
}

export class Grid {

  height: number;
  width: number;
  nodes: MatrixNode[][];
  matrix: Array<Array<number>>;

  constructor(matrix: Array<Array<number>>) {
    this.height = matrix.length;
    this.width = matrix[0].length;
    this.matrix = matrix;
    this.nodes = this.buildNodes(this.width, this.height, matrix);
  }

  buildNodes(width: number, height: number, matrix: Array<Array<number>>): MatrixNode[][] {
    const nodes = new Array(height);

    for (let i = 0; i < height; ++i) {
      nodes[i] = new Array(width);
      for (let j = 0; j < width; ++j) {
        nodes[i][j] = new MatrixNode(j, i, matrix[i][j]);
      }
    }
    if (matrix === undefined) {
      return nodes;
    }
    if (matrix.length !== height || matrix[0].length !== width) {
      throw new Error('Matrix size does not fit');
    }

    return nodes;
  };

  getNodeAt(x: number, y: number): MatrixNode {
    return this.nodes[y][x];
  };

  isWalkableAt(x: number, y: number): boolean {
    return this.isInside(x, y) && this.nodes[y][x].weight > 0;
  };

  isInside(x: number, y: number): boolean {
    return (x >= 0 && x < this.width) && (y >= 0 && y < this.height);
  };

  getNeighbors(node: MatrixNode): MatrixNode[] {
    const x = node.x;
    const y = node.y;
    const neighbors = [];
    const nodes = this.nodes;

    // →
    if (this.isWalkableAt(x + 1, y)) {
      neighbors.push(nodes[y][x + 1]);
    }
    // ↑
    if (this.isWalkableAt(x, y - 1)) {
      neighbors.push(nodes[y - 1][x]);
    }
    // ↓
    if (this.isWalkableAt(x, y + 1)) {
      neighbors.push(nodes[y + 1][x]);
    }
    // ←
    if (this.isWalkableAt(x - 1, y)) {
      neighbors.push(nodes[y][x - 1]);
    }

    return neighbors;
  };

  clone() {
    const width = this.width;
    const height = this.height;
    const thisNodes = this.nodes;

    const newGrid = new Grid(this.matrix);
    const newNodes = new Array(height);

    for (let i = 0; i < height; ++i) {
      newNodes[i] = new Array(width);
      for (let j = 0; j < width; ++j) {
        newNodes[i][j] = new MatrixNode(j, i, thisNodes[i][j].weight);
      }
    }

    newGrid.nodes = newNodes;

    return newGrid;
  };

}
