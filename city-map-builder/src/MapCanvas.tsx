import { useEffect, useRef } from 'react';
import { COLS, ROWS, TILE } from './constants';
import { Renderer } from './renderer';
import { registerRenderCallbacks, useMapStore } from './useMapStore';
import type { Marker } from './types';
import type { GridState } from './types';

export function MapCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const isDrawingRef = useRef(false);
  const lastCellRef = useRef<[number, number] | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    rendererRef.current = new Renderer(ctx);

    const { grid, markers } = useMapStore.getState();
    rendererRef.current.renderAll(grid, markers);

    function onCells(cells: Array<[number, number]>, grid: GridState, markers: Marker[]) {
      const r = rendererRef.current!;
      for (const [row, col] of cells) {
        r.renderCell(row, col, grid, markers);
      }
      const { hoverCell } = useMapStore.getState();
      if (hoverCell) r.drawHover(hoverCell[0], hoverCell[1]);
    }

    function onFull(grid: GridState, markers: Marker[]) {
      const r = rendererRef.current!;
      r.renderAll(grid, markers);
      const { hoverCell } = useMapStore.getState();
      if (hoverCell) r.drawHover(hoverCell[0], hoverCell[1]);
    }

    registerRenderCallbacks(onCells, onFull);
  }, []);

  function eventToCell(e: { clientX: number; clientY: number }): [number, number] {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = (COLS * TILE) / rect.width;
    const scaleY = (ROWS * TILE) / rect.height;
    const c = Math.floor((e.clientX - rect.left) * scaleX / TILE);
    const r = Math.floor((e.clientY - rect.top) * scaleY / TILE);
    return [
      Math.max(0, Math.min(ROWS - 1, r)),
      Math.max(0, Math.min(COLS - 1, c)),
    ];
  }

  function getCursor(): string {
    const tool = useMapStore.getState().tool;
    if (tool === 'start' || tool === 'end') return 'pointer';
    return 'crosshair';
  }

  function handleMouseDown(e: React.MouseEvent) {
    isDrawingRef.current = true;
    const cell = eventToCell(e);
    lastCellRef.current = cell;
    useMapStore.getState().paintAt(cell[0], cell[1]);
  }

  function handleMouseMove(e: React.MouseEvent) {
    const cell = eventToCell(e);
    const store = useMapStore.getState();

    // Update hover
    store.setHover(cell[0], cell[1]);
    // Draw hover highlight on top
    rendererRef.current?.drawHover(cell[0], cell[1]);

    if (!isDrawingRef.current) return;
    const last = lastCellRef.current;
    if (last && last[0] === cell[0] && last[1] === cell[1]) return;
    lastCellRef.current = cell;
    store.paintAt(cell[0], cell[1]);
  }

  function handleMouseUp() {
    isDrawingRef.current = false;
    lastCellRef.current = null;
  }

  function handleMouseLeave() {
    isDrawingRef.current = false;
    lastCellRef.current = null;
    useMapStore.getState().clearHover();
  }

  function handleTouchStart(e: React.TouchEvent) {
    e.preventDefault();
    isDrawingRef.current = true;
    const cell = eventToCell(e.touches[0]);
    lastCellRef.current = cell;
    useMapStore.getState().paintAt(cell[0], cell[1]);
  }

  function handleTouchMove(e: React.TouchEvent) {
    e.preventDefault();
    const cell = eventToCell(e.touches[0]);
    const store = useMapStore.getState();
    store.setHover(cell[0], cell[1]);
    rendererRef.current?.drawHover(cell[0], cell[1]);
    if (!isDrawingRef.current) return;
    const last = lastCellRef.current;
    if (last && last[0] === cell[0] && last[1] === cell[1]) return;
    lastCellRef.current = cell;
    store.paintAt(cell[0], cell[1]);
  }

  function handleTouchEnd() {
    isDrawingRef.current = false;
    lastCellRef.current = null;
  }

  const tool = useMapStore(s => s.tool);
  const cursor = tool === 'start' || tool === 'end' ? 'pointer' : 'crosshair';

  return (
    <canvas
      ref={canvasRef}
      width={COLS * TILE}
      height={ROWS * TILE}
      style={{ display: 'block', imageRendering: 'pixelated', cursor }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  );
}
