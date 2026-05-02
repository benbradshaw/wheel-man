import { classify } from '../grid';
import { COLS, ROWS } from '../constants';
import type { GridState, Marker } from '../types';

export function exportGodotTilemap(grid: GridState, markers: Marker[]): void {
  const tiles = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = grid[r][c];
      if (cell.lanes > 0) {
        tiles.push({ col: c, row: r, lanes: cell.lanes, type: classify(grid, r, c) });
      }
    }
  }

  const out = {
    version: 'godot4',
    cols: COLS,
    rows: ROWS,
    tile_size: 80,
    tiles,
    markers: markers.map(m => ({ type: m.type, col: m.c, row: m.r })),
  };

  const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'map.json';
  a.click();
  URL.revokeObjectURL(url);

  document.title = 'City Map Builder';
}
