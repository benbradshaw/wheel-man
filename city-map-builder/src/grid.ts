import { COLS, ROWS } from './constants';
import type { GridState, TileType } from './types';

export function makeGrid(): GridState {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ lanes: 0 as 0 }))
  );
}

export function isRoad(grid: GridState, r: number, c: number): boolean {
  return r >= 0 && r < ROWS && c >= 0 && c < COLS && grid[r][c].lanes > 0;
}

export function classify(grid: GridState, r: number, c: number): TileType {
  const N = isRoad(grid, r - 1, c) ? 1 : 0;
  const S = isRoad(grid, r + 1, c) ? 1 : 0;
  const E = isRoad(grid, r, c + 1) ? 1 : 0;
  const W = isRoad(grid, r, c - 1) ? 1 : 0;

  if (N && S && E && W) return 'X';
  if (N && S && E && !W) return 'T-E';
  if (N && S && !E && W) return 'T-W';
  if (N && !S && E && W) return 'T-N';
  if (!N && S && E && W) return 'T-S';
  if (N && S && !E && !W) return 'V';
  if (!N && !S && E && W) return 'H';
  if (N && !S && E && !W) return 'NE';
  if (N && !S && !E && W) return 'NW';
  if (!N && S && E && !W) return 'SE';
  if (!N && S && !E && W) return 'SW';
  if (N && !S && !E && !W) return 'dN';
  if (!N && S && !E && !W) return 'dS';
  if (!N && !S && E && !W) return 'dE';
  if (!N && !S && !E && W) return 'dW';
  return 'iso';
}

export function getAffected(r: number, c: number): Array<[number, number]> {
  return ([
    [r, c], [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1],
  ] as Array<[number, number]>).filter(
    ([rr, cc]) => rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS
  );
}
