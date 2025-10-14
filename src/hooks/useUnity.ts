import { useUnityContext } from 'react-unity-webgl';

export function useUnity() {
  const unityContext = useUnityContext({
    loaderUrl: '/counting-machine/Build/counting-machine.loader.js',
    dataUrl: '/counting-machine/Build/counting-machine.data.br',
    frameworkUrl: '/counting-machine/Build/counting-machine.framework.js.br',
    codeUrl: '/counting-machine/Build/counting-machine.wasm.br',
    streamingAssetsUrl: '/counting-machine/StreamingAssets',
    companyName: 'Mena Mena Games',
    productName: 'Counting Machine',
    productVersion: '0.0.5',
  });

  const { unityProvider, sendMessage, addEventListener, removeEventListener, isLoaded, loadingProgression } = unityContext;

  // Function to change the current value displayed on the machine
  // SetValue322 -> the machine will display 0322
  const changeCurrentValue = (value: string | number) => {
    if (isLoaded) {
      sendMessage('WebBridge', 'ReceiveStringMessageFromJs', `SetValue${value}`);
    }
  };

  // Function to send the list of goals to Unity
  // ChangeList544/1352/9871 -> goals will be 544 then 1352 then 9871
  const changeCurrentGoalList = (value: string) => {
    if (isLoaded) {
      sendMessage('WebBridge', 'ReceiveStringMessageFromJs', `ChangeList${value}`);
    }
  };

  // Function to lock/unlock the thousands roll
  const lockThousandRoll = (locked: boolean) => {
    if (isLoaded) {
      sendMessage('WebBridge', 'ReceiveStringMessageFromJs', `LockThousand:${locked ? 1 : 0}`);
    }
  };

  // Function to lock/unlock the hundreds roll
  const lockHundredRoll = (locked: boolean) => {
    if (isLoaded) {
      sendMessage('WebBridge', 'ReceiveStringMessageFromJs', `LockHundred:${locked ? 1 : 0}`);
    }
  };

  // Function to lock/unlock the tens roll
  const lockTenRoll = (locked: boolean) => {
    if (isLoaded) {
      sendMessage('WebBridge', 'ReceiveStringMessageFromJs', `LockTen:${locked ? 1 : 0}`);
    }
  };

  // Function to lock/unlock the units roll
  const lockUnitRoll = (locked: boolean) => {
    if (isLoaded) {
      sendMessage('WebBridge', 'ReceiveStringMessageFromJs', `LockUnit:${locked ? 1 : 0}`);
    }
  };

  return {
    unityProvider,
    isLoaded,
    loadingProgression,
    changeCurrentValue,
    changeCurrentGoalList,
    lockThousandRoll,
    lockHundredRoll,
    lockTenRoll,
    lockUnitRoll,
    addEventListener,
    removeEventListener,
  };
}
