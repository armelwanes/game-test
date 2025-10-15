export type Column = {
    name: string;
    value: number;
    unlocked: boolean;
    color: string;
};

export type Phase =
    | 'intro-welcome'
    | 'intro-discover'
    | 'intro-question-digits'
    | 'intro-add-roll'
    | 'intro-question-max'
    | 'tutorial'
    | 'explore-units'
    | 'click-add'
    | 'click-remove'
    | 'challenge-unit-1'
    | 'challenge-unit-2'
    | 'challenge-unit-3'
    | 'learn-carry'
    | 'learn-tens'
    | 'learn-tens-combination'
    | 'challenge-tens-1'
    | 'challenge-tens-2'
    | 'challenge-tens-3'
    | 'learn-hundreds'
    | 'learn-hundreds-combination'
    | 'challenge-hundreds-1'
    | 'challenge-hundreds-2'
    | 'challenge-hundreds-3'
    | 'learn-thousands'
    | 'learn-thousands-combination'
    | 'challenge-thousands-1'
    | 'challenge-thousands-2'
    | 'challenge-thousands-3'
    | 'normal'
    | 'done'
    | 'learn-units';

export type Challenge = {
    phase: Phase;
    targets: number[];
};

export const FEEDBACK_DELAY = 2500;

export const UNIT_CHALLENGES: Challenge[] = [
  { phase: 'challenge-unit-1', targets: [3, 5, 7] },
  { phase: 'challenge-unit-2', targets: [2, 6, 8] },
  { phase: 'challenge-unit-3', targets: [4, 9, 1] }
];

export const TENS_CHALLENGES: Challenge[] = [
  { phase: 'challenge-tens-1', targets: [23, 45] },
  { phase: 'challenge-tens-2', targets: [12, 34, 56, 78] },
  { phase: 'challenge-tens-3', targets: [21, 43, 65, 87, 19, 92] }
];

export const HUNDREDS_CHALLENGES: Challenge[] = [
  { phase: 'challenge-hundreds-1', targets: [123, 456] },
  { phase: 'challenge-hundreds-2', targets: [234, 567, 321, 789] },
  { phase: 'challenge-hundreds-3', targets: [145, 268, 392, 514, 637, 851] }
];

export const THOUSANDS_CHALLENGES: Challenge[] = [
  { phase: 'challenge-thousands-1', targets: [1234, 5678] },
  { phase: 'challenge-thousands-2', targets: [2345, 6789, 3210, 7890] },
  { phase: 'challenge-thousands-3', targets: [1456, 2789, 3921, 5147, 6372, 8519] }
];

export interface MachineState {
    columns: Column[];
    phase: Phase;
    addClicks: number;
    feedback: string;
    instruction: string;
    pendingAutoCount: boolean;
    isTransitioningToChallenge: boolean;
    isCountingAutomatically: boolean;
    nextPhaseAfterAuto: Phase | null;
    completedChallenges: {
        tens: boolean;
        hundreds: boolean;
        thousands: boolean;
    };
    unitTargetIndex: number;
    unitSuccessCount: number;
    tensTargetIndex: number;
    tensSuccessCount: number;
    hundredsTargetIndex: number;
    hundredsSuccessCount: number;
    thousandsTargetIndex: number;
    thousandsSuccessCount: number;
    timer: number | null;

  userInput: string;
  showInputField: boolean;

  // Callback pour effet visuel/sonore lors de la transition intro-welcome
  onIntroWelcomeTransition?: (() => void) | null;

    // Button visibility
    showUnlockButton: boolean;
    showStartLearningButton: boolean;
    showValidateLearningButton: boolean;
    showValidateTensButton: boolean;
    showValidateHundredsButton: boolean;
    showValidateThousandsButton: boolean;

    // Actions
    setColumns: (updater: ((columns: Column[]) => Column[]) | Column[]) => void;
    setPhase: (phase: Phase) => void;
    setAddClicks: (clicks: number) => void;
    setFeedback: (feedback: string) => void;
    setInstruction: (instruction: string) => void;
    setPendingAutoCount: (pending: boolean) => void;
    setIsTransitioningToChallenge: (isTransitioning: boolean) => void;
    setIsCountingAutomatically: (isCounting: boolean) => void;
    setNextPhaseAfterAuto: (phase: Phase | null) => void;
    setCompletedChallenges: (updater: ((challenges: MachineState['completedChallenges']) => MachineState['completedChallenges']) | MachineState['completedChallenges']) => void;
    setUnitTargetIndex: (index: number) => void;
    setUnitSuccessCount: (count: number) => void;
    setTensTargetIndex: (index: number) => void;
    setTensSuccessCount: (count: number) => void;
    setHundredsTargetIndex: (index: number) => void;
    setHundredsSuccessCount: (count: number) => void;
    setThousandsTargetIndex: (index: number) => void;
    setThousandsSuccessCount: (count: number) => void;
    resetUnitChallenge: () => void;
    resetTensChallenge: () => void;
    resetHundredsChallenge: () => void;
    resetThousandsChallenge: () => void;
    updateInstruction: () => void;
    runAutoCount: () => void;
    updateButtonVisibility: () => void;
    setUserInput: (input: string) => void;
    setShowInputField: (show: boolean) => void;
    handleUserInputSubmit: () => void;

    // Business logic
    sequenceFeedback: (first: string, second: string, delay?: number) => void;
    handleAdd: (idx: number) => void;
    handleSubtract: (idx: number) => void;
    handleValidateLearning: () => void;
    handleValidateTens: () => void;
    handleValidateHundreds: () => void;
    handleValidateThousands: () => void;
    startLearningPhase: () => void;
    unlockNextColumn: () => void;
    init: () => void;
}
