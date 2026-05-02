import {
  TILE, BAND_1, BAND_2,
  ASPHALT, GRASS_A, GRASS_B, CENTRE,
  START_COLOR, END_COLOR, HOVER_COLOR,
  ROWS, COLS,
} from './constants';
import { classify } from './grid';
import type { GridState, LaneCount, Marker, MarkerType, TileType } from './types';

export class Renderer {
  constructor(private ctx: CanvasRenderingContext2D) {}

  drawBg(): void {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        this.drawGrass(r, c);
      }
    }
  }

  drawGrass(r: number, c: number): void {
    const ctx = this.ctx;
    ctx.fillStyle = (r + c) % 2 === 0 ? GRASS_A : GRASS_B;
    ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
  }

  drawRoad(r: number, c: number, type: TileType, lanes: LaneCount): void {
    const ctx = this.ctx;
    this.drawGrass(r, c);

    const ox = c * TILE;
    const oy = r * TILE;
    const b = lanes === 1 ? BAND_1 : BAND_2;
    const off = (TILE - b) / 2;
    const half = TILE / 2;
    const armLen = half + b / 2; // from edge to centre + half band

    ctx.fillStyle = ASPHALT;

    // Each case draws the asphalt arm(s) for the tile type.
    // Suffixes: dN/dS/dE/dW = dead-end (lone open direction)
    // T-E = opens N+S+E, W closed; T-W = opens N+S+W, E closed;
    // T-N = opens N+E+W, S closed; T-S = opens S+E+W, N closed
    switch (type) {
      case 'H':
        ctx.fillRect(ox, oy + off, TILE, b);
        break;
      case 'V':
        ctx.fillRect(ox + off, oy, b, TILE);
        break;
      case 'dN':
        ctx.fillRect(ox + off, oy, b, armLen);
        break;
      case 'dS':
        ctx.fillRect(ox + off, oy + half - b / 2, b, armLen);
        break;
      case 'dE':
        ctx.fillRect(ox + half - b / 2, oy + off, armLen, b);
        break;
      case 'dW':
        ctx.fillRect(ox, oy + off, armLen, b);
        break;
      case 'iso':
        ctx.fillRect(ox + off, oy + off, b, b);
        break;
      case 'NE':
        ctx.fillRect(ox + off, oy, b, armLen);         // N arm
        ctx.fillRect(ox + half - b / 2, oy + off, armLen, b); // E arm
        break;
      case 'NW':
        ctx.fillRect(ox + off, oy, b, armLen);         // N arm
        ctx.fillRect(ox, oy + off, armLen, b);         // W arm
        break;
      case 'SE':
        ctx.fillRect(ox + off, oy + half - b / 2, b, armLen); // S arm
        ctx.fillRect(ox + half - b / 2, oy + off, armLen, b); // E arm
        break;
      case 'SW':
        ctx.fillRect(ox + off, oy + half - b / 2, b, armLen); // S arm
        ctx.fillRect(ox, oy + off, armLen, b);                 // W arm
        break;
      case 'T-N': // N+E+W open, S closed
        ctx.fillRect(ox, oy + off, TILE, b);           // full H
        ctx.fillRect(ox + off, oy, b, armLen);         // N arm
        break;
      case 'T-S': // S+E+W open, N closed
        ctx.fillRect(ox, oy + off, TILE, b);           // full H
        ctx.fillRect(ox + off, oy + half - b / 2, b, armLen); // S arm
        break;
      case 'T-E': // N+S+E open, W closed
        ctx.fillRect(ox + off, oy, b, TILE);           // full V
        ctx.fillRect(ox + half - b / 2, oy + off, armLen, b); // E arm
        break;
      case 'T-W': // N+S+W open, E closed
        ctx.fillRect(ox + off, oy, b, TILE);           // full V
        ctx.fillRect(ox, oy + off, armLen, b);         // W arm
        break;
      case 'X':
        ctx.fillRect(ox, oy + off, TILE, b);
        ctx.fillRect(ox + off, oy, b, TILE);
        break;
    }

    // Centre line for 2-lane straight tiles only
    if (lanes === 2) {
      ctx.strokeStyle = CENTRE;
      ctx.lineWidth = 1;
      if (type === 'H') {
        ctx.beginPath();
        ctx.moveTo(ox, oy + half);
        ctx.lineTo(ox + TILE, oy + half);
        ctx.stroke();
      } else if (type === 'V') {
        ctx.beginPath();
        ctx.moveTo(ox + half, oy);
        ctx.lineTo(ox + half, oy + TILE);
        ctx.stroke();
      }
    }
  }

  drawMarker(r: number, c: number, type: MarkerType): void {
    const ctx = this.ctx;
    const cx = c * TILE + TILE / 2;
    const cy = r * TILE + TILE / 2;
    const radius = TILE / 2 - 2;

    ctx.fillStyle = type === 'start' ? START_COLOR : END_COLOR;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${TILE - 8}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(type === 'start' ? 'S' : 'E', cx, cy);
  }

  renderCell(r: number, c: number, grid: GridState, markers: Marker[]): void {
    const cell = grid[r][c];
    if (cell.lanes > 0) {
      this.drawRoad(r, c, classify(grid, r, c), cell.lanes as LaneCount);
    } else {
      this.drawGrass(r, c);
    }
    for (const m of markers) {
      if (m.r === r && m.c === c) this.drawMarker(r, c, m.type);
    }
  }

  renderAll(grid: GridState, markers: Marker[]): void {
    this.drawBg();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = grid[r][c];
        if (cell.lanes > 0) {
          this.drawRoad(r, c, classify(grid, r, c), cell.lanes as LaneCount);
        }
      }
    }
    for (const m of markers) {
      this.drawMarker(m.r, m.c, m.type);
    }
  }

  drawHover(r: number, c: number): void {
    const ctx = this.ctx;
    ctx.fillStyle = HOVER_COLOR;
    ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
  }
}
