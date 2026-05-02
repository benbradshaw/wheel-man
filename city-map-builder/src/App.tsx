import { useEffect } from 'react';
import { MapCanvas } from './MapCanvas';
import { Sidebar } from './Sidebar';
import { useMapStore } from './useMapStore';

export default function App() {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        useMapStore.getState().undo();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start' }}>
        <MapCanvas />
      </div>
    </div>
  );
}
