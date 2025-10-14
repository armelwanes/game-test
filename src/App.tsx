import { useState } from 'react';
import MachineANombres from "./MachineANombres";
import { UnityDemo } from './components/UnityDemo';

function App() {
  const [view, setView] = useState<'react' | 'unity'>('react');

  return (
    <div>
      <div style={{ 
        textAlign: 'center', 
        padding: '20px', 
        background: '#f0f0f0',
        borderBottom: '2px solid #ddd'
      }}>
        <h1 style={{ margin: '0 0 15px 0' }}>Counting Machine Game</h1>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={() => setView('react')}
            style={{
              padding: '10px 20px',
              background: view === 'react' ? '#4CAF50' : '#ddd',
              color: view === 'react' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            📊 React Version
          </button>
          <button
            onClick={() => setView('unity')}
            style={{
              padding: '10px 20px',
              background: view === 'unity' ? '#2196F3' : '#ddd',
              color: view === 'unity' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            🎮 Unity Version
          </button>
        </div>
      </div>
      
      {view === 'react' ? <MachineANombres /> : <UnityDemo />}
    </div>
  );
}

export default App;
