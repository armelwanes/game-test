/**
 * Système de gestion des ERREURS et FEEDBACK pédagogique
 * Pour enfants de 5-6 ans
 */

export interface AttemptState {
  attemptCount: number;
  consecutiveFailures: number;
  frustrationLevel: 'low' | 'medium' | 'high';
  currentTarget: number;
  lastUserAnswer: number;
}

export interface FeedbackMessage {
  message: string;
  type: 'encouragement' | 'directional' | 'decomposition' | 'assisted';
  showHelp: boolean;
  helpOptions?: {
    tryAgain: boolean;
    guided: boolean;
    showSolution: boolean;
  };
}

/**
 * Calculate the difference between user input and target
 */
export function calculateDistance(userAnswer: number, target: number): number {
  return Math.abs(userAnswer - target);
}

/**
 * Get proximity level based on distance
 */
export function getProximityLevel(distance: number): 'very-close' | 'close' | 'medium' | 'far' | 'very-far' {
  if (distance < 5) return 'very-close';
  if (distance < 10) return 'close';
  if (distance < 50) return 'medium';
  if (distance < 100) return 'far';
  return 'very-far';
}

/**
 * Décompose un nombre en ses composantes (milliers, centaines, dizaines, unités)
 */
export function decomposeNumber(num: number): { thousands: number; hundreds: number; tens: number; units: number } {
  const thousands = Math.floor(num / 1000);
  const hundreds = Math.floor((num % 1000) / 100);
  const tens = Math.floor((num % 100) / 10);
  const units = num % 10;
  return { thousands, hundreds, tens, units };
}

/**
 * Generate encouragement message for first attempt (Tentative 1)
 */
function getAttempt1Message(proximity: string): string {
  const messages = {
    'very-close': [
      "Ooh ! Tu es TOUT PROCHE ! 🔥",
      "Tu y es presque ! Continue !",
      "C'est presque ça ! Tu brûles !"
    ],
    'close': [
      "Pas mal ! Tu n'es pas loin ! 👍",
      "Presque ! Essaie encore !",
      "Tu t'approches ! Réessaie !"
    ],
    'medium': [
      "Ce n'est pas encore ça, mais continue ! 💪",
      "Pas tout à fait ! Essaie à nouveau !",
      "Hmm, pas encore ! Réfléchis bien !"
    ],
    'far': [
      "Ce n'est pas le bon nombre, mais c'est normal ! 😊",
      "Oups ! Réessaie, tu peux le faire !",
      "Pas encore ! Regarde bien les colonnes !"
    ],
    'very-far': [
      "Ce n'est pas ça, mais ne t'inquiète pas ! 🌟",
      "Oups ! Prends ton temps et réessaie !",
      "Pas le bon nombre, mais tu vas trouver !"
    ]
  };
  
  const msgArray = messages[proximity as keyof typeof messages] || messages['medium'];
  return msgArray[Math.floor(Math.random() * msgArray.length)];
}

/**
 * Generate directional hint message for second attempt (Tentative 2)
 */
function getAttempt2Message(userAnswer: number, target: number): string {
  const diff = target - userAnswer;
  
  if (diff > 0) {
    // User answer is too small
    return Math.random() < 0.5 
      ? "C'est trop petit ! 📈 Essaie un nombre plus GRAND !"
      : "Monte un peu ! △ Essaie un nombre plus GRAND !";
  } else {
    // User answer is too big
    return Math.random() < 0.5
      ? "C'est un peu trop grand ! 📉 Essaie un nombre plus PETIT !"
      : "Descends un peu ! ∇ Essaie un nombre plus PETIT !";
  }
}

/**
 * Generate decomposition guidance for third attempt (Tentative 3)
 */
function getAttempt3Message(target: number): string {
  const { thousands, hundreds, tens, units } = decomposeNumber(target);
  
  // For units only (0-9)
  if (target < 10) {
    return `Il faut ${units} bille${units > 1 ? 's' : ''} dans la colonne UNITÉS ! Regarde : ${units} bille${units > 1 ? 's' : ''} toute${units > 1 ? 's' : ''} seule${units > 1 ? 's' : ''} !`;
  }
  
  // For tens (10-99)
  if (target < 100) {
    return `Il faut :
- ${tens} paquet${tens > 1 ? 's' : ''} de 10 dans les DIZAINES
- ${units} bille${units > 1 ? 's' : ''} dans les UNITÉS

Total : ${tens * 10} + ${units} = ${target} !
Maintenant c'est plus clair ? Essaie avec ces indices ! 💡`;
  }
  
  // For hundreds (100-999)
  if (target < 1000) {
    return `Il faut :
- ${hundreds} grand${hundreds > 1 ? 's' : ''} paquet${hundreds > 1 ? 's' : ''} de 100 dans les CENTAINES
- ${tens} paquet${tens > 1 ? 's' : ''} de 10 dans les DIZAINES
- ${units} bille${units > 1 ? 's' : ''} dans les UNITÉS

Total : ${hundreds * 100} + ${tens * 10} + ${units} = ${target} !
Tu as toutes les infos ! Tu vas y arriver ! 💪`;
  }
  
  // For thousands (1000-9999)
  return `Il faut :
- ${thousands} paquet${thousands > 1 ? 's' : ''} GÉANT${thousands > 1 ? 'S' : ''} de 1000 dans les MILLIERS
- ${hundreds} grand${hundreds > 1 ? 's' : ''} paquet${hundreds > 1 ? 's' : ''} de 100 dans les CENTAINES
- ${tens} paquet${tens > 1 ? 's' : ''} de 10 dans les DIZAINES
- ${units} bille${units > 1 ? 's' : ''} dans les UNITÉS

Total : ${thousands * 1000} + ${hundreds * 100} + ${tens * 10} + ${units} = ${target} !
Lis bien la décomposition et réessaie ! 🌟`;
}

/**
 * Generate help options message for fourth attempt (Tentative 4)
 */
function getAttempt4Message(): string {
  return `C'est difficile ce nombre, hein ? 😊
Pas de problème ! Même les grands ont du mal parfois !
Je vais t'aider à le faire ensemble, d'accord ? 🤝`;
}

/**
 * Generate success message based on attempt count
 */
export function getSuccessMessage(attemptCount: number, wasGuided: boolean = false): string {
  if (wasGuided) {
    const messages = [
      "BRAVO ! Tu as appris comment faire ! 🤝",
      "SUPER ! Maintenant tu sais ! 💡",
      "TU AS RÉUSSI ! Avec un peu d'aide, c'est OK ! 🌟",
      "L'important c'est de COMPRENDRE ! Bravo ! 🎉"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }
  
  if (attemptCount === 1) {
    const messages = [
      "WAOUH ! DU PREMIER COUP ! 🎯🎯🎯",
      "INCROYABLE ! Tu es un PRO ! 🏆",
      "PARFAIT ! Tu as tout compris ! ⭐⭐⭐",
      "CHAMPION ! Du premier coup ! 💪"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }
  
  if (attemptCount === 2) {
    const messages = [
      "BRAVO ! Tu as réussi ! 🎉",
      "SUPER ! 2ème essai et c'est bon ! 👍",
      "TU L'AS EU ! Bien joué ! ⭐"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }
  
  if (attemptCount === 3) {
    const messages = [
      "BRAVO ! Tu as persévéré ! 💪",
      "TU AS RÉUSSI ! Tu n'as pas abandonné ! 🌟",
      "GÉNIAL ! La persévérance paie ! 🏆"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }
  
  // 4+ attempts
  const messages = [
    "YESSS ! TU L'AS EU ! 🎉🎉🎉",
    "Tu n'as pas abandonné ! BRAVO ! 🏆",
    `${attemptCount} essais mais tu as réussi ! CHAMPION ! 💪`
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Main feedback generator function
 */
export function generateFeedback(state: AttemptState): FeedbackMessage {
  const distance = calculateDistance(state.lastUserAnswer, state.currentTarget);
  const proximity = getProximityLevel(distance);
  
  // Attempt 1: Simple encouragement
  if (state.attemptCount === 1) {
    return {
      message: getAttempt1Message(proximity),
      type: 'encouragement',
      showHelp: false
    };
  }
  
  // Attempt 2: Directional hint
  if (state.attemptCount === 2) {
    return {
      message: getAttempt2Message(state.lastUserAnswer, state.currentTarget),
      type: 'directional',
      showHelp: false
    };
  }
  
  // Attempt 3: Decomposition guidance
  if (state.attemptCount === 3) {
    return {
      message: getAttempt3Message(state.currentTarget),
      type: 'decomposition',
      showHelp: false
    };
  }
  
  // Attempt 4+: Offer help
  return {
    message: getAttempt4Message(),
    type: 'assisted',
    showHelp: true,
    helpOptions: {
      tryAgain: true,
      guided: true,
      showSolution: true
    }
  };
}

/**
 * Detect frustration level based on consecutive failures
 */
export function detectFrustration(consecutiveFailures: number): 'low' | 'medium' | 'high' {
  if (consecutiveFailures >= 3) return 'high';
  if (consecutiveFailures >= 2) return 'medium';
  return 'low';
}

/**
 * Get intervention message for high frustration
 */
export function getFrustrationInterventionMessage(): string {
  return `Hey ! 🤗 Je vois que ces défis sont difficiles !
C'est NORMAL ! Tu apprends des choses TRÈS compliquées !
Tu veux faire une PAUSE, essayer un défi PLUS FACILE, ou continuer avec PLUS d'aide ?`;
}

/**
 * Generate step-by-step guided instructions for a specific column
 */
export function getGuidedStepMessage(
  targetValue: number, 
  currentValue: number, 
  columnName: string,
  columnIndex: number
): string {
  const remaining = targetValue - currentValue;
  
  if (remaining === 0) {
    return `PARFAIT ! ${columnName} est bon ! ✅`;
  }
  
  const columnNames = {
    0: 'UNITÉS',
    1: 'DIZAINES', 
    2: 'CENTAINES',
    3: 'MILLIERS'
  };
  
  const columnEmoji = {
    0: '🔵',
    1: '📦',
    2: '📦📦',
    3: '📦📦📦'
  };
  
  if (remaining > 0) {
    return `Il faut ${remaining} dans les ${columnNames[columnIndex as keyof typeof columnNames]} ! 
Clique ${remaining} fois sur △ dans les ${columnNames[columnIndex as keyof typeof columnNames]} ! ${columnEmoji[columnIndex as keyof typeof columnEmoji]}`;
  } else {
    return `Il y a trop dans les ${columnNames[columnIndex as keyof typeof columnNames]} ! 
Clique ${Math.abs(remaining)} fois sur ∇ dans les ${columnNames[columnIndex as keyof typeof columnNames]} !`;
  }
}

/**
 * Get attempt indicator emoji
 */
export function getAttemptIndicator(attemptCount: number): string {
  if (attemptCount === 1) return '⭐';
  if (attemptCount === 2) return '💪';
  if (attemptCount === 3) return '💡';
  return '🤝';
}

/**
 * Get attempt color
 */
export function getAttemptColor(attemptCount: number): string {
  if (attemptCount === 1) return '#3b82f6'; // Blue - neutral
  if (attemptCount === 2) return '#fbbf24'; // Yellow - attention
  if (attemptCount === 3) return '#f97316'; // Orange - help
  return '#ef4444'; // Red light - assistance
}
