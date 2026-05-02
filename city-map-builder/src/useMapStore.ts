import { create } from 'zustand';
import { makeGrid, getAffected } from './grid';
import { validateMap, type ValidationResult } from './utils/validate';
import type { GridState, LaneCount, Marker, ToolType } from './types';

interface MapState {
  grid: GridState;
  tool: ToolType;
  markers: Marker[];
  history: GridState[];
  hoverCell: [number, number] | null;
  validation: ValidationResult | null;
}

interface MapActions {
  setTool: (t: ToolType) => void;
  paintAt: (r: number, c: number) => void;
  setHover: (r: number, c: number) => void;
  clearHover: () => void;
  undo: () => void;
  clearMap: () => void;
}

// Render callbacks registered by MapCanvas on mount
let _onCells: ((cells: Array<[number, number]>, grid: GridState, markers: Marker[]) => void) | null = null;
let _onFull: ((grid: GridState, markers: Marker[]) => void) | null = null;

export function registerRenderCallbacks(
  onCells: (cells: Array<[number, number]>, grid: GridState, markers: Marker[]) => void,
  onFull: (grid: GridState, markers: Marker[]) => void
): void {
  _onCells = onCells;
  _onFull = onFull;
}

function deepClone(grid: GridState): GridState {
  return JSON.parse(JSON.stringify(grid)) as GridState;
}

function pushHistory(history: GridState[], grid: GridState): GridState[] {
  const next = [...history, deepClone(grid)];
  return next.length > 30 ? next.slice(next.length - 30) : next;
}

export const useMapStore = create<MapState & MapActions>((set, get) => ({
  grid: makeGrid(),
  tool: 'road-1',
  markers: [],
  history: [],
  hoverCell: null,
  validation: null,

  setTool: (t) => set({ tool: t }),

  paintAt: (r, c) => {
    const { tool, grid, markers, history } = get();

    if (tool === 'start' || tool === 'end') {
      const markerType = tool === 'start' ? 'start' : 'end';
      const filtered = markers.filter(m => m.type !== markerType);
      const newMarkers = [...filtered, { r, c, type: markerType } as Marker];
      const validation = validateMap(grid, newMarkers);
      set({ markers: newMarkers, validation });
      // Re-render old marker location(s) + new cell
      const oldMarker = markers.find(m => m.type === markerType);
      const cells: Array<[number, number]> = [[r, c]];
      if (oldMarker && (oldMarker.r !== r || oldMarker.c !== c)) {
        cells.push([oldMarker.r, oldMarker.c]);
      }
      _onCells?.(cells, grid, newMarkers);
      return;
    }

    if (tool === 'erase') {
      if (grid[r][c].lanes === 0) return;
      const newGrid = deepClone(grid);
      newGrid[r][c] = { lanes: 0 };
      const validation = validateMap(newGrid, markers);
      set({ grid: newGrid, history: pushHistory(history, grid), validation });
      document.title = 'City Map Builder — [unsaved changes]';
      _onCells?.(getAffected(r, c), newGrid, markers);
      return;
    }

    // road-1 or road-2
    const lanes: LaneCount = tool === 'road-1' ? 1 : 2;
    if (grid[r][c].lanes === lanes) return;
    const newGrid = deepClone(grid);
    newGrid[r][c] = { lanes };
    const validation = validateMap(newGrid, markers);
    set({ grid: newGrid, history: pushHistory(history, grid), validation });
    document.title = 'City Map Builder — [unsaved changes]';
    _onCells?.(getAffected(r, c), newGrid, markers);
  },

  setHover: (r, c) => {
    const prev = get().hoverCell;
    if (prev && prev[0] === r && prev[1] === c) return;
    set({ hoverCell: [r, c] });
    // Re-render previous hover cell to clear old highlight
    if (prev) {
      const { grid, markers } = get();
      _onCells?.([prev], grid, markers);
    }
  },

  clearHover: () => {
    const prev = get().hoverCell;
    set({ hoverCell: null });
    if (prev) {
      const { grid, markers } = get();
      _onCells?.([prev], grid, markers);
    }
  },

  undo: () => {
    const { history, markers } = get();
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    const validation = validateMap(prev, markers);
    set({ grid: prev, history: history.slice(0, -1), validation });
    const { markers: m } = get();
    _onFull?.(prev, m);
  },

  clearMap: () => {
    const { grid, history } = get();
    const newGrid = makeGrid();
    set({ grid: newGrid, markers: [], history: pushHistory(history, grid), validation: null });
    document.title = 'City Map Builder';
    _onFull?.(newGrid, []);
  },
}));
