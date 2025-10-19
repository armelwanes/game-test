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
  decomposition?: {
    thousands: number;
    hundreds: number;
    tens: number;
    units: number;
  };
}

/**
 * Calculate the difference between user input and target
 */
export function calculateDistance(userAnswer: number, target: number): number {
  return Math.abs(userAnswer - target);
}

/**
 * Get proximity level based on distance (according to specification)
 * Type 1: 1-5 (very close)
 * Type 2: 6-20 (close)
 * Type 3: 21-50 (medium)
 * Type 4: 51-100 (far)
 * Type 5: >100 (very far)
 */
export function getProximityLevel(distance: number): 'very-close' | 'close' | 'medium' | 'far' | 'very-far' {
  if (distance >= 1 && distance <= 5) return 'very-close';
  if (distance >= 6 && distance <= 20) return 'close';
  if (distance >= 21 && distance <= 50) return 'medium';
  if (distance >= 51 && distance <= 100) return 'far';
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
 * Error type classification
 */
export type ErrorType = 'column' | 'composition' | 'magnitude' | 'direction' | 'random';

/**
 * Detect the type of error the child made
 */
export function detectErrorType(userAnswer: number, target: number): ErrorType {
  const userDecomp = decomposeNumber(userAnswer);
  const targetDecomp = decomposeNumber(target);
  
  // Check for column error (digits are correct but in wrong positions)
  const userDigits = [userDecomp.units, userDecomp.tens, userDecomp.hundreds, userDecomp.thousands].filter(d => d > 0).sort();
  const targetDigits = [targetDecomp.units, targetDecomp.tens, targetDecomp.hundreds, targetDecomp.thousands].filter(d => d > 0).sort();
  
  if (JSON.stringify(userDigits) === JSON.stringify(targetDigits) && userAnswer !== target) {
    return 'column';
  }
  
  // Check for composition error (partially filled)
  const userNonZero = [userDecomp.thousands, userDecomp.hundreds, userDecomp.tens, userDecomp.units].filter(d => d > 0).length;
  const targetNonZero = [targetDecomp.thousands, targetDecomp.hundreds, targetDecomp.tens, targetDecomp.units].filter(d => d > 0).length;
  
  if (userNonZero < targetNonZero && userAnswer < target) {
    // Check if some columns match
    let matchingColumns = 0;
    if (userDecomp.thousands === targetDecomp.thousands) matchingColumns++;
    if (userDecomp.hundreds === targetDecomp.hundreds) matchingColumns++;
    if (userDecomp.tens === targetDecomp.tens) matchingColumns++;
    if (userDecomp.units === targetDecomp.units) matchingColumns++;
    
    if (matchingColumns > 0) {
      return 'composition';
    }
  }
  
  // Check for magnitude error (factor of 10, 100, or 1000)
  const ratio = userAnswer / target;
  if (ratio === 10 || ratio === 0.1 || ratio === 100 || ratio === 0.01 || ratio === 1000 || ratio === 0.001) {
    return 'magnitude';
  }
  
  // Check for direction error (in right ballpark)
  const distance = Math.abs(userAnswer - target);
  if (distance <= 100 && distance > 0) {
    return 'direction';
  }
  
  // Random/completely off
  return 'random';
}

/**
 * Get error-specific hint message for attempt 2
 */
export function getErrorTypeHint(errorType: ErrorType, userAnswer: number, target: number): string {
  switch (errorType) {
    case 'column':
      return "Attention ! Les chiffres sont bons mais pas à la bonne place ! 🔄\nRegarde bien les COLONNES : Milliers, Centaines, Dizaines, Unités ! 👀";
    
    case 'composition':
      return "Tu as commencé, mais il manque des choses ! 🧩\nN'oublie pas de remplir TOUTES les colonnes nécessaires ! 📊";
    
    case 'magnitude':
      return "Attention à l'ordre de grandeur ! 🔍\nRegarde combien de colonnes tu dois utiliser ! 📏";
    
    case 'direction':
      const diff = target - userAnswer;
      if (diff > 0) {
        return "C'est trop petit ! 📈\nLe nombre est PLUS GRAND que ça !\nMonte ! Utilise △ !";
      } else {
        return "C'est un peu trop grand ! 📉\nLe nombre est PLUS PETIT que ça !\nDescends ! Utilise ∇ !";
      }
    
    case 'random':
    default:
      const difference = target - userAnswer;
      if (difference > 0) {
        return "Le nombre est beaucoup PLUS GRAND ! 📈\nRecommence tranquillement ! 😊";
      } else {
        return "Le nombre est beaucoup PLUS PETIT ! 📉\nRecommence tranquillement ! 😊";
      }
  }
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
 * Now includes error type detection
 */
function getAttempt2Message(userAnswer: number, target: number): string {
  const errorType = detectErrorType(userAnswer, target);
  const distance = calculateDistance(userAnswer, target);
  const proximity = getProximityLevel(distance);
  
  // Get error-specific hint
  let message = getErrorTypeHint(errorType, userAnswer, target);
  
  // Add range hint for medium to very far errors
  if (proximity === 'medium' || proximity === 'far' || proximity === 'very-far') {
    const lowerBound = Math.floor(target * 0.8);
    const upperBound = Math.ceil(target * 1.2);
    message += `\n\n💡 Indice : Le nombre est entre ${lowerBound} et ${upperBound} !`;
  }
  
  return message;
}

/**
 * Generate decomposition guidance for third attempt (Tentative 3)
 */
function getAttempt3Message(target: number): string {
  const { thousands, hundreds, tens, units } = decomposeNumber(target);
  
  // For units only (0-9)
  if (target < 10) {
    return `Il faut ${units} bille${units > 1 ? 's' : ''} dans la colonne UNITÉS ! 
Compte sur tes doigts : ${units} doigt${units > 1 ? 's' : ''} = ${units} bille${units > 1 ? 's' : ''} ! ✋
Regarde : ${units} petite${units > 1 ? 's' : ''} lumière${units > 1 ? 's' : ''} dans la colonne de DROITE ! 💡`;
  }
  
  // For tens (10-99)
  if (target < 100) {
    return `Il faut :
- ${tens} paquet${tens > 1 ? 's' : ''} de 10 dans les DIZAINES = ${tens * 10}
- ${units} bille${units > 1 ? 's' : ''} dans les UNITÉS = ${units}

Calcul : ${tens} paquet${tens > 1 ? 's' : ''} (${tens * 10}) + ${units} bille${units > 1 ? 's' : ''} (${units}) = ${target} ! 🎯

Maintenant tu as toutes les informations ! 💡
Lis bien la décomposition et construis le nombre ! 🔨`;
  }
  
  // For hundreds (100-999)
  if (target < 1000) {
    return `Il faut :
- ${hundreds} grand${hundreds > 1 ? 's' : ''} paquet${hundreds > 1 ? 's' : ''} de 100 dans les CENTAINES = ${hundreds * 100}
- ${tens} paquet${tens > 1 ? 's' : ''} de 10 dans les DIZAINES = ${tens * 10}
- ${units} bille${units > 1 ? 's' : ''} dans les UNITÉS = ${units}

Calcul : ${hundreds * 100} + ${tens * 10} + ${units} = ${target} ! 🎯

Tu as toutes les infos ! Tu peux le faire avec ces indices ! 💪
Essaie avec ces explications ! 🌟`;
  }
  
  // For thousands (1000-9999)
  return `Il faut :
- ${thousands} paquet${thousands > 1 ? 's' : ''} GÉANT${thousands > 1 ? 'S' : ''} de 1000 dans les MILLIERS = ${thousands * 1000}
- ${hundreds} grand${hundreds > 1 ? 's' : ''} paquet${hundreds > 1 ? 's' : ''} de 100 dans les CENTAINES = ${hundreds * 100}
- ${tens} paquet${tens > 1 ? 's' : ''} de 10 dans les DIZAINES = ${tens * 10}
- ${units} bille${units > 1 ? 's' : ''} dans les UNITÉS = ${units}

Calcul : ${thousands * 1000} + ${hundreds * 100} + ${tens * 10} + ${units} = ${target} ! 🎯

Maintenant tu as toutes les informations ! 💡
Lis bien la décomposition et construis le nombre ! 🔨
Tu peux le faire avec ces indices ! 💪`;
}

/**
 * Generate help options message for fourth attempt (Tentative 4)
 */
function getAttempt4Message(): string {
  return `C'est un nombre difficile celui-là, hein ? 😊
Pas de problème ! Même les grands ont du mal parfois ! 🤗
Tu as fait de ton mieux, bravo d'avoir essayé ! 👏
Maintenant, je vais t'aider à réussir ! 🤝

Comment veux-tu continuer ? 🤔`;
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
  
  // Attempt 2: Directional hint with error type
  if (state.attemptCount === 2) {
    return {
      message: getAttempt2Message(state.lastUserAnswer, state.currentTarget),
      type: 'directional',
      showHelp: false
    };
  }
  
  // Attempt 3: Decomposition guidance
  if (state.attemptCount === 3) {
    const decomp = decomposeNumber(state.currentTarget);
    return {
      message: getAttempt3Message(state.currentTarget),
      type: 'decomposition',
      showHelp: false,
      decomposition: decomp
    };
  }
  
  // Attempt 4+: Offer help with decomposition
  const decomp = decomposeNumber(state.currentTarget);
  return {
    message: getAttempt4Message(),
    type: 'assisted',
    showHelp: true,
    helpOptions: {
      tryAgain: true,
      guided: true,
      showSolution: true
    },
    decomposition: decomp
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

/**
 * Get guided step instructions for building a number column by column
 */
export interface GuidedStepInfo {
  columnIndex: number; // 0=units, 1=tens, 2=hundreds, 3=thousands
  columnName: string;
  targetValue: number;
  currentValue: number;
  action: 'increase' | 'decrease' | 'complete';
  message: string;
}

/**
 * Calculate next guided step
 */
export function getNextGuidedStep(
  target: number,
  currentColumns: number[]
): GuidedStepInfo | null {
  const targetDecomp = decomposeNumber(target);
  const targetArray = [targetDecomp.units, targetDecomp.tens, targetDecomp.hundreds, targetDecomp.thousands];
  
  const columnNames = ['UNITÉS', 'DIZAINES', 'CENTAINES', 'MILLIERS'];
  
  // Check from highest to lowest column
  for (let i = 3; i >= 0; i--) {
    if (currentColumns[i] !== targetArray[i]) {
      const diff = targetArray[i] - currentColumns[i];
      const action = diff > 0 ? 'increase' : 'decrease';
      const clicksNeeded = Math.abs(diff);
      
      let message = '';
      if (i === 3) {
        message = `ÉTAPE ${4-i}/4 : Les ${columnNames[i]}\n(La colonne de GAUCHE)\n\n`;
        message += `Il faut ${targetArray[i]} paquet${targetArray[i] > 1 ? 's' : ''} GÉANT${targetArray[i] > 1 ? 'S' : ''} !\n\n`;
      } else if (i === 2) {
        message = `ÉTAPE ${4-i}/4 : Les ${columnNames[i]}\n(La 2ème colonne en partant de la gauche)\n\n`;
        message += `Il faut ${targetArray[i]} grand${targetArray[i] > 1 ? 's' : ''} paquet${targetArray[i] > 1 ? 's' : ''} !\n\n`;
      } else if (i === 1) {
        message = `ÉTAPE ${4-i}/4 : Les ${columnNames[i]}\n(La 3ème colonne)\n\n`;
        message += `Il faut ${targetArray[i]} paquet${targetArray[i] > 1 ? 's' : ''} !\n\n`;
      } else {
        message = `ÉTAPE ${4-i}/4 : Les ${columnNames[i]}\n(La dernière colonne à DROITE)\n\n`;
        message += `Il faut ${targetArray[i]} bille${targetArray[i] > 1 ? 's' : ''} !\n\n`;
      }
      
      if (action === 'increase') {
        message += `Clique ${clicksNeeded} FOIS sur △ dans la colonne des ${columnNames[i]} !`;
      } else {
        message += `Clique ${clicksNeeded} FOIS sur ∇ dans la colonne des ${columnNames[i]} !`;
      }
      
      return {
        columnIndex: i,
        columnName: columnNames[i],
        targetValue: targetArray[i],
        currentValue: currentColumns[i],
        action,
        message
      };
    }
  }
  
  // All columns complete
  return null;
}

/**
 * Get click feedback message during guided mode
 */
export function getGuidedClickFeedback(remaining: number): string {
  if (remaining === 0) {
    return "PARFAIT ! ✅\nOn passe à l'étape suivante ! ➡️";
  }
  
  if (remaining === 1) {
    return "Encore un ! 💪";
  }
  
  return `${remaining} ! Continue ! 👍`;
}

/**
 * Get completion message for guided mode
 */
export function getGuidedCompletionMessage(target: number): string {
  const decomp = decomposeNumber(target);
  
  let breakdown = '';
  if (decomp.thousands > 0) {
    breakdown += `- ${decomp.thousands * 1000} (milliers)\n`;
  }
  if (decomp.hundreds > 0) {
    breakdown += `- + ${decomp.hundreds * 100} (centaines)\n`;
  }
  if (decomp.tens > 0) {
    breakdown += `- + ${decomp.tens * 10} (dizaines)\n`;
  }
  if (decomp.units > 0) {
    breakdown += `- + ${decomp.units} (unités)\n`;
  }
  
  return `🎉🎉🎉 BRAVO ! TU L'AS CONSTRUIT ! 🎉🎉🎉

${target} ! TU L'AS FAIT ! 🏗️

Tu vois ? ENSEMBLE on y arrive ! 🤝

Tu as fait :
${breakdown}
= ${target} ! PARFAIT ! ✅

Maintenant tu sais comment faire ! 💡
Le prochain, tu pourras le faire TOUT SEUL ! 💪`;
}

/**
 * Get animation step message for solution display
 */
export function getSolutionAnimationStep(
  columnIndex: number,
  value: number,
  runningTotal: number
): string {
  const columnNames = ['UNITÉS', 'DIZAINES', 'CENTAINES', 'MILLIERS'];
  
  if (columnIndex === 3) {
    return `D'abord, ${value} paquet${value > 1 ? 's' : ''} GÉANT${value > 1 ? 'S' : ''} dans les ${columnNames[columnIndex]} !\n${runningTotal} ! ✨`;
  } else if (columnIndex === 2) {
    return `Ensuite, ${value} grand${value > 1 ? 's' : ''} paquet${value > 1 ? 's' : ''} dans les ${columnNames[columnIndex]} !\n${runningTotal} ! ✨`;
  } else if (columnIndex === 1) {
    return `Puis, ${value} paquet${value > 1 ? 's' : ''} dans les ${columnNames[columnIndex]} !\n${runningTotal} ! ✨`;
  } else {
    return `Enfin, ${value} bille${value > 1 ? 's' : ''} dans les ${columnNames[columnIndex]} !\n${runningTotal} ! ✨`;
  }
}

/**
 * Frustration intervention messages by level
 */
export function getFrustrationMessage(level: 'low' | 'medium' | 'high'): string {
  if (level === 'low') {
    return `Hey ! 🤗
Je vois que ces défis sont un peu difficiles !
C'est NORMAL ! Tu apprends des choses compliquées ! 📚
Tu veux faire une petite pause ou continuer ? 😊`;
  }
  
  if (level === 'medium') {
    return `STOP ! On fait une pause ! 🛑
Tu travailles depuis longtemps ! ⏰
Tu as besoin d'une pause !
Choisis ce que tu veux faire :`;
  }
  
  // high
  return `Hey ! 🤗 Je vois que tu as beaucoup de mal...
C'est VRAIMENT difficile ce que tu essaies de faire !
Même des enfants plus grands ont du mal ! 😊
Tu as déjà fait BEAUCOUP ! Tu peux être fier de toi ! 🏆
Je pense qu'on devrait choisir ensemble comment continuer :`;
}
