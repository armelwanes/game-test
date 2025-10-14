import { useEffect, useCallback } from 'react';
import { Unity } from 'react-unity-webgl';
import { useUnity } from '../hooks/useUnity';

interface UnityGameProps {
  onUnityMessage?: (message: string) => void;
}

export function UnityGame({ onUnityMessage }: UnityGameProps) {
  const {
    unityProvider,
    isLoaded,
    loadingProgression,
    addEventListener,
    removeEventListener,
  } = useUnity();

  // Handle messages from Unity
  const handleUnityMessage = useCallback((message: string) => {
    console.log('[UnityBridge] Message from Unity:', message);
    if (onUnityMessage) {
      onUnityMessage(message);
    }
  }, [onUnityMessage]);

  useEffect(() => {
    addEventListener('UnityMessage', handleUnityMessage);
    return () => {
      removeEventListener('UnityMessage', handleUnityMessage);
    };
  }, [addEventListener, removeEventListener, handleUnityMessage]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {!isLoaded && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: '#ffffff',
            zIndex: 10,
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              marginBottom: '20px',
            }}
          >
            <img
              src="/counting-machine/assets/logo.webp"
              alt="Loading"
              style={{
                width: '100%',
                height: '100%',
                animation: 'flickerAnimation 1s infinite',
              }}
            />
          </div>
          <div
            style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#000',
            }}
          >
            Loading... {Math.round(loadingProgression * 100)}%
          </div>
        </div>
      )}
      <Unity
        unityProvider={unityProvider}
        style={{
          width: '100%',
          height: '100%',
          visibility: isLoaded ? 'visible' : 'hidden',
        }}
      />
      <style>{`
        @keyframes flickerAnimation {
          0% { opacity: 1; }
          50% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
