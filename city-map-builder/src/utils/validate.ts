import { COLS, ROWS } from '../constants';
import { isRoad } from '../grid';
import type { GridState, Marker } from '../types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateMap(grid: GridState, markers: Marker[]): ValidationResult {
  const errors: string[] = [];

  const start = markers.find(m => m.type === 'start');
  const end = markers.find(m => m.type === 'end');

  if (!start) errors.push('No start marker placed.');
  if (!end) errors.push('No end marker placed.');
  if (errors.length > 0) return { valid: false, errors };

  if (start!.r === end!.r && start!.c === end!.c) {
    errors.push('Start and end markers are on the same cell.');
    return { valid: false, errors };
  }

  if (!isRoad(grid, start!.r, start!.c)) {
    errors.push('Start marker is not on a road.');
  }
  if (!isRoad(grid, end!.r, end!.c)) {
    errors.push('End marker is not on a road.');
  }
  if (errors.length > 0) return { valid: false, errors };

  // BFS from start through road cells
  const visited = new Set<string>();
  const key = (r: number, c: number) => `${r},${c}`;
  const queue: Array<[number, number]> = [[start!.r, start!.c]];
  visited.add(key(start!.r, start!.c));

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    for (const [nr, nc] of [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]] as Array<[number,number]>) {
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !visited.has(key(nr, nc)) && isRoad(grid, nr, nc)) {
        visited.add(key(nr, nc));
        queue.push([nr, nc]);
      }
    }
  }

  if (!visited.has(key(end!.r, end!.c))) {
    errors.push('No connected road path between start and end.');
  }

  // Count isolated road cells (not reachable from start)
  let isolated = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (isRoad(grid, r, c) && !visited.has(key(r, c))) isolated++;
    }
  }
  if (isolated > 0) {
    errors.push(`${isolated} isolated road cell${isolated > 1 ? 's' : ''} with no connection to start.`);
  }

  return { valid: errors.length === 0, errors };
}
