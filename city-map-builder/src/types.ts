export type LaneCount = 1 | 2;

export type ToolType = 'road-1' | 'road-2' | 'erase' | 'start' | 'end';

export type TileType =
  | 'H' | 'V'
  | 'NE' | 'NW' | 'SE' | 'SW'
  | 'T-N' | 'T-S' | 'T-E' | 'T-W'
  | 'X'
  | 'dN' | 'dS' | 'dE' | 'dW'
  | 'iso';

export interface Cell {
  lanes: LaneCount | 0;
}

export type GridState = Cell[][];

export type MarkerType = 'start' | 'end';

export interface Marker {
  r: number;
  c: number;
  type: MarkerType;
}
