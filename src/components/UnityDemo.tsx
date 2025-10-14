import { useState, useCallback } from 'react';
import { UnityGame } from './UnityGame';
import { useUnity } from '../hooks/useUnity';

export function UnityDemo() {
  const [currentValue, setCurrentValue] = useState('0322');
  const [goalList, setGoalList] = useState('544/1352/9871');
  const [unityMessages, setUnityMessages] = useState<string[]>([]);

  const {
    changeCurrentValue,
    changeCurrentGoalList,
    lockThousandRoll,
    lockHundredRoll,
    lockTenRoll,
    lockUnitRoll,
    isLoaded,
  } = useUnity();

  const handleUnityMessage = useCallback((message: string) => {
    setUnityMessages((prev) => [...prev.slice(-4), message]);
  }, []);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Unity Integration Demo</h1>
      
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {/* Controls Panel */}
        <div style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ 
            padding: '15px', 
            background: '#f5f5f5', 
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Controls</h3>
            
            {/* Set Value */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Set Value:
              </label>
              <input
                type="text"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                placeholder="9999"
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  marginBottom: '5px'
                }}
              />
              <button
                onClick={() => changeCurrentValue(currentValue)}
                disabled={!isLoaded}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: isLoaded ? '#4CAF50' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isLoaded ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold'
                }}
              >
                Change Current Value
              </button>
            </div>

            {/* Goal List */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Goal List:
              </label>
              <input
                type="text"
                value={goalList}
                onChange={(e) => setGoalList(e.target.value)}
                placeholder="9/999/9999/99"
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  marginBottom: '5px'
                }}
              />
              <button
                onClick={() => changeCurrentGoalList(goalList)}
                disabled={!isLoaded}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: isLoaded ? '#2196F3' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isLoaded ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold'
                }}
              >
                Change Goal List
              </button>
            </div>

            {/* Lock Controls */}
            <div>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                Lock/Unlock Rolls:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button
                    onClick={() => lockThousandRoll(true)}
                    disabled={!isLoaded}
                    style={{
                      flex: 1,
                      padding: '6px',
                      background: isLoaded ? '#f44336' : '#ccc',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: isLoaded ? 'pointer' : 'not-allowed',
                      fontSize: '12px'
                    }}
                  >
                    🔒 1000
                  </button>
                  <button
                    onClick={() => lockThousandRoll(false)}
                    disabled={!isLoaded}
                    style={{
                      flex: 1,
                      padding: '6px',
                      background: isLoaded ? '#4CAF50' : '#ccc',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: isLoaded ? 'pointer' : 'not-allowed',
                      fontSize: '12px'
                    }}
                  >
                    🔓 1000
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button
                    onClick={() => lockHundredRoll(true)}
                    disabled={!isLoaded}
                    style={{
                      flex: 1,
                      padding: '6px',
                      background: isLoaded ? '#f44336' : '#ccc',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: isLoaded ? 'pointer' : 'not-allowed',
                      fontSize: '12px'
                    }}
                  >
                    🔒 100
                  </button>
                  <button
                    onClick={() => lockHundredRoll(false)}
                    disabled={!isLoaded}
                    style={{
                      flex: 1,
                      padding: '6px',
                      background: isLoaded ? '#4CAF50' : '#ccc',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: isLoaded ? 'pointer' : 'not-allowed',
                      fontSize: '12px'
                    }}
                  >
                    🔓 100
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button
                    onClick={() => lockTenRoll(true)}
                    disabled={!isLoaded}
                    style={{
                      flex: 1,
                      padding: '6px',
                      background: isLoaded ? '#f44336' : '#ccc',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: isLoaded ? 'pointer' : 'not-allowed',
                      fontSize: '12px'
                    }}
                  >
                    🔒 10
                  </button>
                  <button
                    onClick={() => lockTenRoll(false)}
                    disabled={!isLoaded}
                    style={{
                      flex: 1,
                      padding: '6px',
                      background: isLoaded ? '#4CAF50' : '#ccc',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: isLoaded ? 'pointer' : 'not-allowed',
                      fontSize: '12px'
                    }}
                  >
                    🔓 10
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button
                    onClick={() => lockUnitRoll(true)}
                    disabled={!isLoaded}
                    style={{
                      flex: 1,
                      padding: '6px',
                      background: isLoaded ? '#f44336' : '#ccc',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: isLoaded ? 'pointer' : 'not-allowed',
                      fontSize: '12px'
                    }}
                  >
                    🔒 1
                  </button>
                  <button
                    onClick={() => lockUnitRoll(false)}
                    disabled={!isLoaded}
                    style={{
                      flex: 1,
                      padding: '6px',
                      background: isLoaded ? '#4CAF50' : '#ccc',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: isLoaded ? 'pointer' : 'not-allowed',
                      fontSize: '12px'
                    }}
                  >
                    🔓 1
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Messages Panel */}
          <div style={{ 
            padding: '15px', 
            background: '#f5f5f5', 
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '10px' }}>Unity Messages</h3>
            <div style={{ 
              minHeight: '100px',
              maxHeight: '200px',
              overflowY: 'auto',
              background: 'white',
              padding: '10px',
              borderRadius: '4px',
              fontSize: '12px',
              fontFamily: 'monospace'
            }}>
              {unityMessages.length === 0 ? (
                <div style={{ color: '#999' }}>No messages yet...</div>
              ) : (
                unityMessages.map((msg, idx) => (
                  <div key={idx} style={{ marginBottom: '5px' }}>
                    {msg}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Unity Game Container */}
        <div style={{ 
          flex: '1', 
          minWidth: '600px',
          height: '600px',
          border: '2px solid #ddd',
          borderRadius: '8px',
          overflow: 'hidden',
          background: '#000'
        }}>
          <UnityGame onUnityMessage={handleUnityMessage} />
        </div>
      </div>

      {/* Info Section */}
      <div style={{ 
        marginTop: '30px',
        padding: '20px',
        background: '#e3f2fd',
        borderRadius: '8px',
        border: '1px solid #90caf9'
      }}>
        <h3 style={{ marginTop: 0 }}>ℹ️ About Roll Locking</h3>
        <ul style={{ lineHeight: '1.8' }}>
          <li><strong>Units (1):</strong> When locked, cannot increase/decrease by 1</li>
          <li><strong>Tens (10):</strong> When locked, cannot increase/decrease by 1 if next value is outside range (e.g., 5895 locked on 9: range 5890-5899); cannot increase/decrease by 10</li>
          <li><strong>Hundreds (100):</strong> When locked, cannot increase/decrease by 1 or 10 if next value is outside range; cannot increase/decrease by 100</li>
          <li><strong>Thousands (1000):</strong> When locked, cannot increase/decrease by 1, 10, or 100 if next value is outside range; cannot increase/decrease by 1000</li>
        </ul>
        <p style={{ margin: 0, marginTop: '10px' }}>
          <strong>Note:</strong> Multiple rolls can be locked simultaneously, and locked rolls show an animation in Unity.
        </p>
      </div>
    </div>
  );
}
