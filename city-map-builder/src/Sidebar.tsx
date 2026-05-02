import { useEffect, useRef } from 'react';
import { TILE, BAND_1, BAND_2, ASPHALT, GRASS_A, GRASS_B } from './constants';
import { Renderer } from './renderer';
import { useMapStore } from './useMapStore';
import { exportGodotTilemap } from './utils/export';
import type { ToolType } from './types';

function RoadPreview({ lanes }: { lanes: 1 | 2 }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const r = new Renderer(ctx);
    // Draw a minimal 1-cell preview of a horizontal road
    ctx.fillStyle = (0 + 0) % 2 === 0 ? GRASS_A : GRASS_B;
    ctx.fillRect(0, 0, TILE, TILE);
    r.drawRoad(0, 0, 'H', lanes);
  }, [lanes]);

  return (
    <canvas
      ref={canvasRef}
      width={TILE}
      height={TILE}
      style={{ imageRendering: 'pixelated', flexShrink: 0 }}
    />
  );
}

const TOOLS: Array<{ id: ToolType; label: string }> = [
  { id: 'road-1', label: '1-Lane Road' },
  { id: 'road-2', label: '2-Lane Road' },
  { id: 'start',  label: 'Start Point' },
  { id: 'end',    label: 'End Point' },
  { id: 'erase',  label: 'Eraser' },
];

const ACTIVE_STYLE: React.CSSProperties = { borderLeft: '3px solid #00aaff' };
const INACTIVE_STYLE: React.CSSProperties = { borderLeft: '3px solid transparent' };

export function Sidebar() {
  const tool = useMapStore(s => s.tool);
  const setTool = useMapStore(s => s.setTool);
  const markers = useMapStore(s => s.markers);
  const validation = useMapStore(s => s.validation);
  const clearMap = useMapStore(s => s.clearMap);
  const grid = useMapStore(s => s.grid);

  const canExport = markers.length >= 2;

  return (
    <aside style={{
      width: 160,
      minWidth: 160,
      background: '#252520',
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
      borderRight: '1px solid #3a3a36',
      overflowY: 'auto',
    }}>
      <div style={{ padding: '10px 8px 4px', fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
        Tools
      </div>

      {TOOLS.map(t => (
        <button
          key={t.id}
          onClick={() => setTool(t.id)}
          style={{
            background: tool === t.id ? '#2e2e28' : 'transparent',
            color: '#e0dbd0',
            border: 'none',
            ...( tool === t.id ? ACTIVE_STYLE : INACTIVE_STYLE),
            padding: '7px 10px',
            textAlign: 'left',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
          }}
        >
          {(t.id === 'road-1' || t.id === 'road-2') && (
            <RoadPreview lanes={t.id === 'road-1' ? 1 : 2} />
          )}
          {t.id === 'start' && <span style={{ width: TILE, height: TILE, borderRadius: '50%', background: '#00cc44', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 'bold', flexShrink: 0 }}>S</span>}
          {t.id === 'end' && <span style={{ width: TILE, height: TILE, borderRadius: '50%', background: '#cc2200', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 'bold', flexShrink: 0 }}>E</span>}
          {t.id === 'erase' && <span style={{ width: TILE, height: TILE, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>⌫</span>}
          {t.label}
        </button>
      ))}

      <div style={{ flex: 1 }} />

      {/* Validation status */}
      {validation && (
        <div style={{ margin: '8px', fontSize: 11 }}>
          {validation.valid ? (
            <div style={{ color: '#00cc44', padding: '4px 0' }}>✓ Map valid — ready to export</div>
          ) : (
            <ul style={{ color: '#ff6b6b', listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {validation.errors.map((e, i) => <li key={i}>✕ {e}</li>)}
            </ul>
          )}
        </div>
      )}

      {!canExport && (
        <div style={{ margin: '4px 8px', fontSize: 11, color: '#888' }}>
          Place start + end first
        </div>
      )}

      <button
        disabled={!canExport}
        onClick={() => exportGodotTilemap(grid, markers)}
        style={{
          margin: '4px 8px',
          padding: '7px 0',
          background: canExport ? '#1a4a2e' : '#2a2a28',
          color: canExport ? '#00cc44' : '#555',
          border: `1px solid ${canExport ? '#00cc44' : '#444'}`,
          borderRadius: 4,
          cursor: canExport ? 'pointer' : 'not-allowed',
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        Export for Godot
      </button>

      <button
        onClick={clearMap}
        style={{
          margin: '4px 8px 10px',
          padding: '7px 0',
          background: 'transparent',
          color: '#888',
          border: '1px solid #444',
          borderRadius: 4,
          cursor: 'pointer',
          fontSize: 12,
        }}
      >
        Clear Map
      </button>
    </aside>
  );
}
