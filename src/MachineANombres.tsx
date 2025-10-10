import { useState, useEffect, useCallback, useMemo, useRef } from "react";

// --- Types et Constantes ---
interface Column {
  name: string;
  value: number;
  unlocked: boolean;
}

// Phases du flux d'apprentissage
type Phase = 'tutorial' | 'explore-units' | 'click-add' | 'click-remove' | 'done' |
  'learn-units' | 'challenge-unit-1' | 'challenge-unit-2' | 'challenge-unit-3' | 'learn-carry' | 
  'learn-tens' | 'learn-tens-combination' | 'challenge-tens-1' | 'challenge-tens-2' | 'challenge-tens-3' | 
  'learn-hundreds' | 'learn-hundreds-combination' | 'challenge-hundreds-1' | 'challenge-hundreds-2' | 'challenge-hundreds-3' |
  'learn-thousands' | 'learn-thousands-combination' | 'challenge-thousands-1' | 'challenge-thousands-2' | 'challenge-thousands-3' |
  'normal';

const COLUMN_NAMES = ["Unités", "Dizaines", "Centaines", "Milliers"];
const TYPING_SPEED = 18;
const MESSAGE_READ_DELAY = 3000;
// Vitesse de l'auto-incrémentation ralentie pour le commentaire
const COUNT_SPEED = 1800;
const FEEDBACK_DELAY = 1200;

// Défis pour les unités - progression graduelle
const UNIT_CHALLENGES = [
  { phase: 'challenge-unit-1' as const, targets: [3, 5, 7] },     // 3 nombres
  { phase: 'challenge-unit-2' as const, targets: [2, 6, 8] },     // 3 nombres  
  { phase: 'challenge-unit-3' as const, targets: [4, 9, 1] }      // 3 nombres
];

// Défis pour les dizaines - nombre augmente de 2 par étape
const TENS_CHALLENGES = [
  { phase: 'challenge-tens-1' as const, targets: [23, 45] },           // 2 nombres
  { phase: 'challenge-tens-2' as const, targets: [12, 34, 56, 78] },  // 4 nombres
  { phase: 'challenge-tens-3' as const, targets: [21, 43, 65, 87, 19, 92] }  // 6 nombres
];

// Défis pour les centaines - progression graduelle
const HUNDREDS_CHALLENGES = [
  { phase: 'challenge-hundreds-1' as const, targets: [123, 456] },           // 2 nombres
  { phase: 'challenge-hundreds-2' as const, targets: [234, 567, 321, 789] },  // 4 nombres
  { phase: 'challenge-hundreds-3' as const, targets: [145, 268, 392, 514, 637, 851] }  // 6 nombres
];

// Défis pour les milliers - progression graduelle
const THOUSANDS_CHALLENGES = [
  { phase: 'challenge-thousands-1' as const, targets: [1234, 5678] },           // 2 nombres
  { phase: 'challenge-thousands-2' as const, targets: [2345, 6789, 3210, 7890] },  // 4 nombres
  { phase: 'challenge-thousands-3' as const, targets: [1456, 2789, 3921, 5147, 6372, 8519] }  // 6 nombres
];

const initialColumns: Column[] = COLUMN_NAMES.map((name, idx) => ({
  name,
  value: 0,
  unlocked: idx === 0
}));

function MachineANombres() {
  // ...existing code...
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [phase, setPhase] = useState<Phase>('tutorial');
  // addClicks sert maintenant à suivre la progression dans explore-units
  const [addClicks, setAddClicks] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [typedInstruction, setTypedInstruction] = useState("");
  const [typedFeedback, setTypedFeedback] = useState("");
  const [isTypingInstruction, setIsTypingInstruction] = useState(false);
  const [isTypingFeedback, setIsTypingFeedback] = useState(false);
  const [pendingAutoCount, setPendingAutoCount] = useState(false);
  const [isTransitioningToChallenge, setIsTransitioningToChallenge] = useState(false);

  // État pour l'auto-incrémentation
  const [isCountingAutomatically, setIsCountingAutomatically] = useState(false);
  const [nextPhaseAfterAuto, setNextPhaseAfterAuto] = useState<Phase | null>(null);

  // Tracking des défis complétés pour contrôler le déblocage des niveaux
  const [completedChallenges, setCompletedChallenges] = useState({
    tens: false,      // Dizaines
    hundreds: false,  // Centaines
    thousands: false  // Milliers
  });

  // État pour les défis des unités
  const [unitTargetIndex, setUnitTargetIndex] = useState(0); // Index du nombre cible actuel
  const [unitSuccessCount, setUnitSuccessCount] = useState(0); // Nombre de réussites dans le défi actuel

  // État pour les défis des dizaines
  const [tensTargetIndex, setTensTargetIndex] = useState(0); // Index du nombre cible actuel
  const [tensSuccessCount, setTensSuccessCount] = useState(0); // Nombre de réussites dans le défi actuel

  // État pour les défis des centaines
  const [hundredsTargetIndex, setHundredsTargetIndex] = useState(0);
  const [hundredsSuccessCount, setHundredsSuccessCount] = useState(0);

  // État pour les défis des milliers
  const [thousandsTargetIndex, setThousandsTargetIndex] = useState(0);
  const [thousandsSuccessCount, setThousandsSuccessCount] = useState(0);

  const totalNumber = useMemo(() =>
    columns.reduce((acc, col, idx) => acc + col.value * Math.pow(10, idx), 0),
    [columns]
  );

  const isUnitsColumn = useCallback((idx: number) => idx === 0, []);

  // Helper: affiche un message puis un second message après un délai
  const sequenceFeedback = useCallback((first: string, second: string, delay = FEEDBACK_DELAY) => {
    setFeedback(first);
    setTimeout(() => setFeedback(second), delay);
  }, []);

  // (L'effet qui surveille `instruction` est placé plus bas, après sa déclaration)


  // 🚀 EFFECT : Gère l'auto-comptage (0 -> 9) avec commentaires détaillés
  useEffect(() => {
    let timer: number | undefined;

    if (phase === 'learn-units' && isCountingAutomatically) {

      const unitsValue = columns[0].value;

      // PARTIE A: COMPTAGE LENT (0 à 8) avec commentaires
      if (unitsValue < 9) {
        const speed = COUNT_SPEED;
        const nextValue = unitsValue + 1;

        timer = setTimeout(() => {
          setColumns(prevCols => {
            const newCols = [...prevCols];
            if (newCols[0].value === unitsValue) {
              newCols[0].value++;
            }
            return newCols;
          });

          let infoMessage = "";
          if (nextValue === 1) {
            infoMessage = "**1** : une bille. UN doigt ✌️";
          } else if (nextValue === 2) {
            infoMessage = "**2** : deux billes. DEUX doigts ! ✌️";
          } else if (nextValue === 3) {
            infoMessage = "**3** : trois billes. TROIS doigts ! 🎈";
          } else if (nextValue === 4) {
            infoMessage = "**4** : quatre billes. QUATRE doigts !";
          } else if (nextValue === 5) {
            infoMessage = "**5** : cinq billes. CINQ ! Tous les doigts d'une main ! ✋";
          } else if (nextValue === 6) {
            infoMessage = "**6** : six billes. SIX doigts !";
          } else if (nextValue === 7) {
            infoMessage = "**7** : sept billes. SEPT doigts !";
          } else if (nextValue === 8) {
            infoMessage = "**8** : huit billes. HUIT doigts !";
          } else if (nextValue === 9) {
            infoMessage = "**9** : neuf billes. 🎯 La colonne est presque pleine ! Plus qu'un espace libre !";
          }

          setFeedback(infoMessage);

        }, speed);

      }

      // PARTIE B: ARRÊT À NEUF (9) et RESET
      else if (unitsValue === 9) {
        // 1. Annonce l'arrêt et l'état "plein"
        setFeedback("STOP ! 🛑 Le compteur est à 9. La colonne est PLEINE ! Attends, la machine va te montrer la suite !");

        // 2. Reset et Transition
        timer = setTimeout(() => {
          const targetPhase = nextPhaseAfterAuto ?? 'challenge-unit-1';

          if (targetPhase === 'challenge-unit-1') {
            const resetCols = initialColumns.map((col, i) => i === 1 ? { ...col, unlocked: true } : col);
            setColumns(resetCols);
            setIsCountingAutomatically(false);
            setNextPhaseAfterAuto(null);
            setUnitTargetIndex(0);
            setUnitSuccessCount(0);

            setFeedback("Retour à zéro ! 🔄 Maintenant, c'est à toi de jouer !");

            // Lancement du premier défi manuel
            setTimeout(() => {
              setPhase('challenge-unit-1');
              const firstTarget = UNIT_CHALLENGES[0].targets[0];
              setFeedback(`🎯 DÉFI 1 : Affiche le nombre **${firstTarget}** avec les boutons, puis clique sur VALIDER !`);
            }, FEEDBACK_DELAY);
          } else {
            setColumns(initialColumns.map(col => ({ ...col })));
            setIsCountingAutomatically(false);
            setNextPhaseAfterAuto(null);
            setAddClicks(0);
            setPhase(targetPhase);
            sequenceFeedback(
              "Spectacle terminé ! La machine a compté de 1 à 9.",
              "À toi maintenant ! Clique sur △ pour créer les nombres !"
            );
          }

        }, COUNT_SPEED * 3);

      }
    }

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isCountingAutomatically, columns[0].value, nextPhaseAfterAuto]);


  // 🚀 EFFECT : Gère l'auto-comptage pour les dizaines (10, 20, 30, ... 90)
  useEffect(() => {
    let timer: number | undefined;

    if (phase === 'learn-tens' && isCountingAutomatically) {
      const tensValue = columns[1].value;
      const unitsValue = columns[0].value;

      // S'assurer que les unités sont à 0 pour l'apprentissage des dizaines
      if (unitsValue !== 0) {
        setColumns(prevCols => {
          const newCols = [...prevCols];
          newCols[0].value = 0;
          return newCols;
        });
        return;
      }

      // PARTIE A: COMPTAGE des dizaines (0 à 8)
      if (tensValue < 9) {
        const speed = COUNT_SPEED;
        const nextValue = tensValue + 1;

        timer = setTimeout(() => {
          setColumns(prevCols => {
            const newCols = [...prevCols];
            if (newCols[1].value === tensValue && newCols[0].value === 0) {
              newCols[1].value++;
            }
            return newCols;
          });

          let infoMessage = "";
          const displayNumber = nextValue * 10;
          if (nextValue === 1) {
            infoMessage = `**${displayNumber}** (DIX) ! 🎯 Une dizaine = 10 unités !`;
          } else if (nextValue === 2) {
            infoMessage = `**${displayNumber}** (VINGT) ! Deux dizaines = 20 unités !`;
          } else if (nextValue === 3) {
            infoMessage = `**${displayNumber}** (TRENTE) ! Trois paquets de 10 !`;
          } else if (nextValue === 4) {
            infoMessage = `**${displayNumber}** (QUARANTE) ! Quatre dizaines !`;
          } else if (nextValue === 5) {
            infoMessage = `**${displayNumber}** (CINQUANTE) ! La moitié de 100 ! ✋`;
          } else if (nextValue === 6) {
            infoMessage = `**${displayNumber}** (SOIXANTE) ! Six dizaines !`;
          } else if (nextValue === 7) {
            infoMessage = `**${displayNumber}** (SOIXANTE-DIX) ! Sept dizaines !`;
          } else if (nextValue === 8) {
            infoMessage = `**${displayNumber}** (QUATRE-VINGTS) ! Huit dizaines !`;
          } else if (nextValue === 9) {
            infoMessage = `**${displayNumber}** (QUATRE-VINGT-DIX) ! 🎯 Presque 100 !`;
          }

          setFeedback(infoMessage);

        }, speed);

      }

      // PARTIE B: ARRÊT À 90 (9 dizaines) et RESET
      else if (tensValue === 9) {
        setFeedback("STOP ! 🛑 Le compteur est à 90. Tu as vu tous les nombres avec les dizaines ! Bravo !");

        // Reset et Transition vers la phase de combinaison
        timer = setTimeout(() => {
          const resetCols = initialColumns.map((col, i) => i === 1 ? { ...col, unlocked: true } : col);
          setColumns(resetCols);
          setIsCountingAutomatically(false);

          setFeedback("Retour à zéro ! 🔄 Maintenant on va apprendre à combiner les dizaines et les unités !");

          // Lancement de la phase de combinaison
          setTimeout(() => {
            setPhase('learn-tens-combination');
            setPendingAutoCount(true);
            setIsCountingAutomatically(false);
            sequenceFeedback(
              "🎯 Apprends à combiner ! Par exemple : 2 dizaines + 3 unités = 23 !",
              "Regarde bien : la machine va te montrer des exemples !"
            );
          }, FEEDBACK_DELAY);
        }, COUNT_SPEED * 3);

      }
    }

    // Auto-comptage pour learn-tens-combination (exemples de combinaisons)
    if (phase === 'learn-tens-combination' && isCountingAutomatically) {
      const tensValue = columns[1].value;
      const unitsValue = columns[0].value;

      // Exemples à montrer: 12, 25, 34, 47, 56, 83
      const examples = [
        { tens: 1, units: 2, name: "DOUZE" },
        { tens: 2, units: 5, name: "VINGT-CINQ" },
        { tens: 3, units: 4, name: "TRENTE-QUATRE" },
        { tens: 4, units: 7, name: "QUARANTE-SEPT" },
        { tens: 5, units: 6, name: "CINQUANTE-SIX" },
        { tens: 8, units: 3, name: "QUATRE-VINGT-TROIS" }
      ];

      // Trouver l'index de l'exemple actuel
      const currentExampleIndex = examples.findIndex(ex => ex.tens === tensValue && ex.units === unitsValue);
      
      if (currentExampleIndex === -1) {
        // Initialiser au premier exemple
        timer = setTimeout(() => {
          setColumns(prevCols => {
            const newCols = [...prevCols];
            newCols[1].value = examples[0].tens;
            newCols[0].value = examples[0].units;
            return newCols;
          });
          const total = examples[0].tens * 10 + examples[0].units;
          setFeedback(`**${total}** (${examples[0].name}) ! ${examples[0].tens} dizaine${examples[0].tens > 1 ? 's' : ''} + ${examples[0].units} unité${examples[0].units > 1 ? 's' : ''} = ${total} !`);
        }, COUNT_SPEED);
      } else if (currentExampleIndex < examples.length - 1) {
        // Passer à l'exemple suivant
        timer = setTimeout(() => {
          const nextExample = examples[currentExampleIndex + 1];
          setColumns(prevCols => {
            const newCols = [...prevCols];
            newCols[1].value = nextExample.tens;
            newCols[0].value = nextExample.units;
            return newCols;
          });
          const total = nextExample.tens * 10 + nextExample.units;
          setFeedback(`**${total}** (${nextExample.name}) ! ${nextExample.tens} dizaine${nextExample.tens > 1 ? 's' : ''} + ${nextExample.units} unité${nextExample.units > 1 ? 's' : ''} = ${total} !`);
        }, COUNT_SPEED);
      } else {
        // Fin des exemples, transition vers les défis
        setFeedback("Bravo ! 🎉 Tu as vu comment combiner dizaines et unités ! Maintenant c'est à toi !");
        
        timer = setTimeout(() => {
          const resetCols = initialColumns.map((col, i) => i === 1 ? { ...col, unlocked: true } : col);
          setColumns(resetCols);
          setIsCountingAutomatically(false);
          setTensTargetIndex(0);
          setTensSuccessCount(0);

          setFeedback("Retour à zéro ! 🔄 À toi de jouer maintenant !");

          setTimeout(() => {
            setPhase('challenge-tens-1');
            const firstTarget = TENS_CHALLENGES[0].targets[0];
            setFeedback(`🎯 DÉFI 1 : Affiche le nombre **${firstTarget}** avec les boutons, puis clique sur VALIDER !`);
          }, FEEDBACK_DELAY);
        }, COUNT_SPEED * 3);
      }
    }

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isCountingAutomatically, columns[0].value, columns[1].value]);


  // 🚀 EFFECT : Gère l'auto-comptage pour les centaines (100, 200, 300, ... 900)
  useEffect(() => {
    let timer: number | undefined;

    if (phase === 'learn-hundreds' && isCountingAutomatically) {
      const hundredsValue = columns[2].value;
      const tensValue = columns[1].value;
      const unitsValue = columns[0].value;

      // S'assurer que les dizaines et unités sont à 0
      if (unitsValue !== 0 || tensValue !== 0) {
        setColumns(prevCols => {
          const newCols = [...prevCols];
          newCols[0].value = 0;
          newCols[1].value = 0;
          return newCols;
        });
        return;
      }

      // PARTIE A: COMPTAGE des centaines (0 à 8)
      if (hundredsValue < 9) {
        const speed = COUNT_SPEED;
        const nextValue = hundredsValue + 1;

        timer = setTimeout(() => {
          setColumns(prevCols => {
            const newCols = [...prevCols];
            if (newCols[2].value === hundredsValue && newCols[1].value === 0 && newCols[0].value === 0) {
              newCols[2].value++;
            }
            return newCols;
          });

          let infoMessage = "";
          const displayNumber = nextValue * 100;
          if (nextValue === 1) {
            infoMessage = `**${displayNumber}** (CENT) ! 🎯 Une centaine = 100 unités !`;
          } else if (nextValue === 2) {
            infoMessage = `**${displayNumber}** (DEUX-CENTS) ! Deux centaines = 200 unités !`;
          } else if (nextValue === 3) {
            infoMessage = `**${displayNumber}** (TROIS-CENTS) ! Trois paquets de 100 !`;
          } else if (nextValue === 4) {
            infoMessage = `**${displayNumber}** (QUATRE-CENTS) ! Quatre centaines !`;
          } else if (nextValue === 5) {
            infoMessage = `**${displayNumber}** (CINQ-CENTS) ! La moitié de 1000 ! ✋`;
          } else if (nextValue === 6) {
            infoMessage = `**${displayNumber}** (SIX-CENTS) ! Six centaines !`;
          } else if (nextValue === 7) {
            infoMessage = `**${displayNumber}** (SEPT-CENTS) ! Sept centaines !`;
          } else if (nextValue === 8) {
            infoMessage = `**${displayNumber}** (HUIT-CENTS) ! Huit centaines !`;
          } else if (nextValue === 9) {
            infoMessage = `**${displayNumber}** (NEUF-CENTS) ! 🎯 Presque 1000 !`;
          }

          setFeedback(infoMessage);

        }, speed);

      }

      // PARTIE B: ARRÊT À 900 (9 centaines) et RESET
      else if (hundredsValue === 9) {
        setFeedback("STOP ! 🛑 Le compteur est à 900. Tu as vu tous les nombres avec les centaines ! Bravo !");

        // Reset et Transition vers la phase de combinaison
        timer = setTimeout(() => {
          const resetCols = initialColumns.map((col, i) => (i === 1 || i === 2) ? { ...col, unlocked: true } : col);
          setColumns(resetCols);
          setIsCountingAutomatically(false);

          setFeedback("Retour à zéro ! 🔄 Maintenant on va apprendre à combiner les centaines, dizaines et unités !");

          // Lancement de la phase de combinaison
          setTimeout(() => {
            setPhase('learn-hundreds-combination');
            setPendingAutoCount(true);
            setIsCountingAutomatically(false);
            sequenceFeedback(
              "🎯 Apprends à combiner ! Par exemple : 2 centaines + 3 dizaines + 4 unités = 234 !",
              "Regarde bien : la machine va te montrer des exemples !"
            );
          }, FEEDBACK_DELAY);
        }, COUNT_SPEED * 3);

      }
    }

    // Auto-comptage pour learn-hundreds-combination (exemples de combinaisons)
    if (phase === 'learn-hundreds-combination' && isCountingAutomatically) {
      const hundredsValue = columns[2].value;
      const tensValue = columns[1].value;
      const unitsValue = columns[0].value;

      // Exemples à montrer: 123, 234, 345, 456, 567, 678
      const examples = [
        { hundreds: 1, tens: 2, units: 3, name: "CENT-VINGT-TROIS" },
        { hundreds: 2, tens: 3, units: 4, name: "DEUX-CENT-TRENTE-QUATRE" },
        { hundreds: 3, tens: 4, units: 5, name: "TROIS-CENT-QUARANTE-CINQ" },
        { hundreds: 4, tens: 5, units: 6, name: "QUATRE-CENT-CINQUANTE-SIX" },
        { hundreds: 5, tens: 6, units: 7, name: "CINQ-CENT-SOIXANTE-SEPT" },
        { hundreds: 6, tens: 7, units: 8, name: "SIX-CENT-SOIXANTE-DIX-HUIT" }
      ];

      // Trouver l'index de l'exemple actuel
      const currentExampleIndex = examples.findIndex(
        ex => ex.hundreds === hundredsValue && ex.tens === tensValue && ex.units === unitsValue
      );
      
      if (currentExampleIndex === -1) {
        // Initialiser au premier exemple
        timer = setTimeout(() => {
          setColumns(prevCols => {
            const newCols = [...prevCols];
            newCols[2].value = examples[0].hundreds;
            newCols[1].value = examples[0].tens;
            newCols[0].value = examples[0].units;
            return newCols;
          });
          const total = examples[0].hundreds * 100 + examples[0].tens * 10 + examples[0].units;
          setFeedback(`**${total}** (${examples[0].name}) ! ${examples[0].hundreds} centaine${examples[0].hundreds > 1 ? 's' : ''} + ${examples[0].tens} dizaine${examples[0].tens > 1 ? 's' : ''} + ${examples[0].units} unité${examples[0].units > 1 ? 's' : ''} = ${total} !`);
        }, COUNT_SPEED);
      } else if (currentExampleIndex < examples.length - 1) {
        // Passer à l'exemple suivant
        timer = setTimeout(() => {
          const nextExample = examples[currentExampleIndex + 1];
          setColumns(prevCols => {
            const newCols = [...prevCols];
            newCols[2].value = nextExample.hundreds;
            newCols[1].value = nextExample.tens;
            newCols[0].value = nextExample.units;
            return newCols;
          });
          const total = nextExample.hundreds * 100 + nextExample.tens * 10 + nextExample.units;
          setFeedback(`**${total}** (${nextExample.name}) ! ${nextExample.hundreds} centaine${nextExample.hundreds > 1 ? 's' : ''} + ${nextExample.tens} dizaine${nextExample.tens > 1 ? 's' : ''} + ${nextExample.units} unité${nextExample.units > 1 ? 's' : ''} = ${total} !`);
        }, COUNT_SPEED);
      } else {
        // Fin des exemples, transition vers les défis
        setFeedback("Bravo ! 🎉 Tu as vu comment combiner centaines, dizaines et unités ! Maintenant c'est à toi !");
        
        timer = setTimeout(() => {
          const resetCols = initialColumns.map((col, i) => (i === 1 || i === 2) ? { ...col, unlocked: true } : col);
          setColumns(resetCols);
          setIsCountingAutomatically(false);
          setHundredsTargetIndex(0);
          setHundredsSuccessCount(0);

          setFeedback("Retour à zéro ! 🔄 À toi de jouer maintenant !");

          setTimeout(() => {
            setPhase('challenge-hundreds-1');
            const firstTarget = HUNDREDS_CHALLENGES[0].targets[0];
            setFeedback(`🎯 DÉFI 1 : Affiche le nombre **${firstTarget}** avec les boutons, puis clique sur VALIDER !`);
          }, FEEDBACK_DELAY);
        }, COUNT_SPEED * 3);
      }
    }

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isCountingAutomatically, columns[0].value, columns[1].value, columns[2].value]);


  // 🚀 EFFECT : Gère l'auto-comptage pour les milliers (1000, 2000, 3000, ... 9000)
  useEffect(() => {
    let timer: number | undefined;

    if (phase === 'learn-thousands' && isCountingAutomatically) {
      const thousandsValue = columns[3].value;
      const hundredsValue = columns[2].value;
      const tensValue = columns[1].value;
      const unitsValue = columns[0].value;

      // S'assurer que les centaines, dizaines et unités sont à 0
      if (unitsValue !== 0 || tensValue !== 0 || hundredsValue !== 0) {
        setColumns(prevCols => {
          const newCols = [...prevCols];
          newCols[0].value = 0;
          newCols[1].value = 0;
          newCols[2].value = 0;
          return newCols;
        });
        return;
      }

      // PARTIE A: COMPTAGE des milliers (0 à 8)
      if (thousandsValue < 9) {
        const speed = COUNT_SPEED;
        const nextValue = thousandsValue + 1;

        timer = setTimeout(() => {
          setColumns(prevCols => {
            const newCols = [...prevCols];
            if (newCols[3].value === thousandsValue && newCols[2].value === 0 && newCols[1].value === 0 && newCols[0].value === 0) {
              newCols[3].value++;
            }
            return newCols;
          });

          let infoMessage = "";
          const displayNumber = nextValue * 1000;
          if (nextValue === 1) {
            infoMessage = `**${displayNumber}** (MILLE) ! 🎯 Un millier = 1000 unités !`;
          } else if (nextValue === 2) {
            infoMessage = `**${displayNumber}** (DEUX-MILLE) ! Deux milliers = 2000 unités !`;
          } else if (nextValue === 3) {
            infoMessage = `**${displayNumber}** (TROIS-MILLE) ! Trois paquets de 1000 !`;
          } else if (nextValue === 4) {
            infoMessage = `**${displayNumber}** (QUATRE-MILLE) ! Quatre milliers !`;
          } else if (nextValue === 5) {
            infoMessage = `**${displayNumber}** (CINQ-MILLE) ! La moitié de 10000 ! ✋`;
          } else if (nextValue === 6) {
            infoMessage = `**${displayNumber}** (SIX-MILLE) ! Six milliers !`;
          } else if (nextValue === 7) {
            infoMessage = `**${displayNumber}** (SEPT-MILLE) ! Sept milliers !`;
          } else if (nextValue === 8) {
            infoMessage = `**${displayNumber}** (HUIT-MILLE) ! Huit milliers !`;
          } else if (nextValue === 9) {
            infoMessage = `**${displayNumber}** (NEUF-MILLE) ! 🎯 Tu maîtrises les grands nombres !`;
          }

          setFeedback(infoMessage);

        }, speed);

      }

      // PARTIE B: ARRÊT À 9000 (9 milliers) et RESET
      else if (thousandsValue === 9) {
        setFeedback("STOP ! 🛑 Le compteur est à 9000. Tu as vu tous les nombres avec les milliers ! Bravo !");

        // Reset et Transition vers la phase de combinaison
        timer = setTimeout(() => {
          const resetCols = columns.map(col => ({ ...col, unlocked: true }));
          setColumns(resetCols);
          setIsCountingAutomatically(false);

          setFeedback("Retour à zéro ! 🔄 Maintenant on va apprendre à combiner tous les chiffres !");

          // Lancement de la phase de combinaison
          setTimeout(() => {
            setPhase('learn-thousands-combination');
            setPendingAutoCount(true);
            setIsCountingAutomatically(false);
            sequenceFeedback(
              "🎯 Apprends à combiner ! Par exemple : 1 millier + 2 centaines + 3 dizaines + 4 unités = 1234 !",
              "Regarde bien : la machine va te montrer des exemples !"
            );
          }, FEEDBACK_DELAY);
        }, COUNT_SPEED * 3);

      }
    }

    // Auto-comptage pour learn-thousands-combination (exemples de combinaisons)
    if (phase === 'learn-thousands-combination' && isCountingAutomatically) {
      const thousandsValue = columns[3].value;
      const hundredsValue = columns[2].value;
      const tensValue = columns[1].value;
      const unitsValue = columns[0].value;

      // Exemples à montrer: 1234, 2345, 3456, 4567, 5678, 6789
      const examples = [
        { thousands: 1, hundreds: 2, tens: 3, units: 4, name: "MILLE-DEUX-CENT-TRENTE-QUATRE" },
        { thousands: 2, hundreds: 3, tens: 4, units: 5, name: "DEUX-MILLE-TROIS-CENT-QUARANTE-CINQ" },
        { thousands: 3, hundreds: 4, tens: 5, units: 6, name: "TROIS-MILLE-QUATRE-CENT-CINQUANTE-SIX" },
        { thousands: 4, hundreds: 5, tens: 6, units: 7, name: "QUATRE-MILLE-CINQ-CENT-SOIXANTE-SEPT" },
        { thousands: 5, hundreds: 6, tens: 7, units: 8, name: "CINQ-MILLE-SIX-CENT-SOIXANTE-DIX-HUIT" },
        { thousands: 6, hundreds: 7, tens: 8, units: 9, name: "SIX-MILLE-SEPT-CENT-QUATRE-VINGT-NEUF" }
      ];

      // Trouver l'index de l'exemple actuel
      const currentExampleIndex = examples.findIndex(
        ex => ex.thousands === thousandsValue && ex.hundreds === hundredsValue && 
              ex.tens === tensValue && ex.units === unitsValue
      );
      
      if (currentExampleIndex === -1) {
        // Initialiser au premier exemple
        timer = setTimeout(() => {
          setColumns(prevCols => {
            const newCols = [...prevCols];
            newCols[3].value = examples[0].thousands;
            newCols[2].value = examples[0].hundreds;
            newCols[1].value = examples[0].tens;
            newCols[0].value = examples[0].units;
            return newCols;
          });
          const total = examples[0].thousands * 1000 + examples[0].hundreds * 100 + examples[0].tens * 10 + examples[0].units;
          setFeedback(`**${total}** (${examples[0].name}) ! Un nombre géant !`);
        }, COUNT_SPEED);
      } else if (currentExampleIndex < examples.length - 1) {
        // Passer à l'exemple suivant
        timer = setTimeout(() => {
          const nextExample = examples[currentExampleIndex + 1];
          setColumns(prevCols => {
            const newCols = [...prevCols];
            newCols[3].value = nextExample.thousands;
            newCols[2].value = nextExample.hundreds;
            newCols[1].value = nextExample.tens;
            newCols[0].value = nextExample.units;
            return newCols;
          });
          const total = nextExample.thousands * 1000 + nextExample.hundreds * 100 + nextExample.tens * 10 + nextExample.units;
          setFeedback(`**${total}** (${nextExample.name}) ! Un nombre géant !`);
        }, COUNT_SPEED);
      } else {
        // Fin des exemples, transition vers les défis
        setFeedback("Bravo ! 🎉 Tu as vu comment combiner tous les chiffres ! Maintenant c'est à toi !");
        
        timer = setTimeout(() => {
          const resetCols = columns.map(col => ({ ...col, unlocked: true }));
          setColumns(resetCols);
          setIsCountingAutomatically(false);
          setThousandsTargetIndex(0);
          setThousandsSuccessCount(0);

          setFeedback("Retour à zéro ! 🔄 À toi de jouer maintenant !");

          setTimeout(() => {
            setPhase('challenge-thousands-1');
            const firstTarget = THOUSANDS_CHALLENGES[0].targets[0];
            setFeedback(`🎯 DÉFI 1 : Affiche le nombre **${firstTarget}** avec les boutons, puis clique sur VALIDER !`);
          }, FEEDBACK_DELAY);
        }, COUNT_SPEED * 3);
      }
    }

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isCountingAutomatically, columns[0].value, columns[1].value, columns[2].value, columns[3].value]);


  // --- LOGIQUE AJOUTER (HANDLE ADD) ---
  const handleAdd = useCallback((idx: number) => {

  // Blocage du clic manuel pendant l'auto-comptage ou la transition vers le défi
  if (isCountingAutomatically || isTransitioningToChallenge) return;

    // Définir quelles colonnes sont interactives selon la phase
    const isAllowedColumn = () => {
      if (phase === 'normal') return true;
      if (isUnitsColumn(idx)) return true; // Unités toujours actives sauf en mode normal
      if (idx === 1 && (phase === 'challenge-tens-1' || phase === 'challenge-tens-2' || phase === 'challenge-tens-3' || phase === 'learn-tens-combination')) return true;
      if ((idx === 1 || idx === 2) && (phase === 'challenge-hundreds-1' || phase === 'challenge-hundreds-2' || phase === 'challenge-hundreds-3' || phase === 'learn-hundreds-combination')) return true;
      if ((idx === 1 || idx === 2 || idx === 3) && (phase === 'challenge-thousands-1' || phase === 'challenge-thousands-2' || phase === 'challenge-thousands-3' || phase === 'learn-thousands-combination')) return true;
      if (phase === 'learn-carry') return isUnitsColumn(idx);
      return false;
    };

    if (!isAllowedColumn()) {
      setFeedback("Concentrons-nous sur les colonnes actives pour l'instant !");
      return;
    }

    if (totalNumber >= 9999) return;

    const newCols = [...columns];
    newCols[idx].value++;
    let hasCarry = false;

    // Gérer le carry-over (échange 10 pour 1)
    for (let i = idx; i < newCols.length; i++) {
      if (newCols[i].value > 9) {
        newCols[i].value = 0;
        if (i + 1 < newCols.length) {
          newCols[i + 1].value++;
          hasCarry = true;
        }
      }
    }

    // --- LOGIQUE DE PROGRESSION ---

    // A. tutorial (Prise en main de la machine - sans concept de nombre)
    if (phase === 'tutorial') {
      const unitsValue = newCols[0].value;

      if (unitsValue === 1) {
        sequenceFeedback("Bravo ! 🎉 Tu as cliqué sur le bouton VERT ! Un joli rond bleu est apparu !",
          "Ce rond bleu, c'est comme une bille. Clique encore sur △ pour en ajouter !");
      } else if (unitsValue === 2) {
        sequenceFeedback("Super ! 🎉 Maintenant il y a DEUX ronds bleus !",
          "Deux belles billes ! Continue à cliquer sur △ !");
      } else if (unitsValue === 3) {
        sequenceFeedback("Magnifique ! 🎉 Essaie le bouton ROUGE (∇) maintenant !",
          "Le bouton ROUGE fait l'inverse du VERT ! Essaie-le !");
      } else if (unitsValue > 3) {
        // Limiter à 3 dans le tutoriel
        newCols[0].value = 3;
        setFeedback("Maintenant, clique sur le bouton ROUGE (∇) !");
        setColumns(newCols);
        return;
      }
      setColumns(newCols);
    }

    // B. explore-units (Introduction et Répétition de UN, DEUX, TROIS)
    else if (phase === 'explore-units') {
      const unitsValue = newCols[0].value;

      if (unitsValue === 1) {
        sequenceFeedback("HOURRA ! 🎉 **Dis à haute voix : UN !** Lève UN doigt ! 👆",
          `UN c'est une seule chose ! Clique sur △ pour continuer !`);
      } else if (unitsValue === 2) {
        sequenceFeedback("Fantastique ! 🎉 **Dis : DEUX !** Lève DEUX doigts ! ✌️",
          `DEUX, c'est une paire ! Clique sur △ !`);
      } else if (unitsValue === 3) {
        sequenceFeedback("Merveilleux ! 🎉 **Dis : TROIS !** Trois doigts !",
          `Clique sur △ pour continuer !`);

        // Transition vers la phase de pratique
        setTimeout(() => {
          setPhase('click-add');
          setFeedback("Bravo ! Continuons jusqu'à 9 ! Clique sur △ !");
        }, FEEDBACK_DELAY * 1.5);
      } else if (unitsValue > 3) {
        newCols[0].value = 3;
        setFeedback("Attends le signal pour continuer !");
        setColumns(newCols);
        return;
      }
      setColumns(newCols);

    }

    // C. click-add (Pratique de 4 à 9)
    else if (phase === 'click-add') {
      const nextClick = addClicks + 1;
      const nextValue = newCols[idx].value;

      // Blocage si l'on dépasse le nombre de clics requis (total = 9)
      if (nextValue > 9) {
        newCols[idx].value = 9;
        setFeedback("Parfait ! 🎉 Tu as atteint 9 ! Maintenant clique sur ∇ pour descendre à zéro !");
        setColumns(newCols);

        // Transition immédiate vers click-remove
        setTimeout(() => {
          setPhase('click-remove');
          setFeedback("Super ! Clique sur ∇ pour enlever les billes jusqu'à zéro !");
        }, FEEDBACK_DELAY);
        return;
      }

      if (nextValue === 9) {
        setIsTransitioningToChallenge(true);
        setAddClicks(nextClick);
        setColumns(newCols);

        sequenceFeedback(
          "Magnifique ! 🎉 Tu as atteint 9 !",
          "Tu es prêt pour l'évaluation !"
        );

        setTimeout(() => {
          const resetCols = initialColumns.map((col, i) => i === 1 ? { ...col, unlocked: true } : col);
          setColumns(resetCols);
          setAddClicks(0);
          setUnitTargetIndex(0);
          setUnitSuccessCount(0);
          setPhase('challenge-unit-1');
          const firstTarget = UNIT_CHALLENGES[0].targets[0];
          setFeedback(`🎯 DÉFI 1 : Affiche le nombre **${firstTarget}** avec les boutons, puis clique sur VALIDER !`);
          setIsTransitioningToChallenge(false);
        }, FEEDBACK_DELAY * 2);

        return;
      }

      setAddClicks(nextClick);

      if (nextValue >= 4 && nextValue <= 8) {
        setFeedback(`**${nextValue}** ! Continue avec △ !`);
      } else {
        setFeedback(`Maintenant **${nextValue}** ! Clique sur △ !`);
      }
      // Rappel synthétique après un court délai
      setTimeout(() => setFeedback(`${nextValue} billes. Continue avec △ !`), FEEDBACK_DELAY);
      setColumns(newCols);

    }

    // D. Unit challenges (surveillance du dépassement)
    const unitChallengePhases = ['challenge-unit-1', 'challenge-unit-2', 'challenge-unit-3'] as const;
    if (unitChallengePhases.includes(phase as typeof unitChallengePhases[number])) {
      const challengeIndex = unitChallengePhases.indexOf(phase as typeof unitChallengePhases[number]);
      const challenge = UNIT_CHALLENGES[challengeIndex];
      const targetNumber = challenge.targets[unitTargetIndex];
      
      if (newCols[0].value > targetNumber) {
        setFeedback(`Oups ! Tu as dépassé ${targetNumber}. Utilise ∇ pour revenir à ${targetNumber} !`);
        setColumns(newCols);
        return;
      }
    }

    // E. learn-carry
    else if (phase === 'learn-carry' && hasCarry) {
      sequenceFeedback("INCROYABLE ! 🎆 C'est de la MAGIE ! 10 billes sont devenues 1 bille dans la colonne suivante !",
        "C'est la RÈGLE D'OR : 10 billes = 1 bille dans la colonne de gauche !");

      // Transition vers l'apprentissage des dizaines
      setTimeout(() => {
        // Réinitialiser les colonnes pour l'apprentissage des dizaines
        const resetCols = initialColumns.map((col, i) => i === 1 ? { ...col, unlocked: true } : col);
        setColumns(resetCols);
        setPhase('learn-tens');
        setPendingAutoCount(true);
        setIsCountingAutomatically(false);

        sequenceFeedback(
          "Bravo ! 🎉 Maintenant on va apprendre les DIZAINES !",
          "Observe comment la machine compte par dizaines : 10, 20, 30... !"
        );
      }, FEEDBACK_DELAY * 2);
      setColumns(newCols);
    }

    // F. Feedback en mode normal
    else if (phase === 'normal' && hasCarry) {
      setFeedback("Échange magique ! 10 billes → 1 bille dans la colonne de gauche ! 🎩");
      setColumns(newCols);
    }

    // Mise à jour de l'état si l'on est dans un cas général
    else {
      setColumns(newCols);
      if (phase === 'normal' || phase === 'done' || phase === 'learn-units') {
        setFeedback(`🎈 ${newCols[idx].value} bille${newCols[idx].value > 1 ? 's' : ''} dans ${newCols[idx].name}. Clique sur △ ou ∇ !`);
      }
    }


  }, [columns, phase, addClicks, isUnitsColumn, totalNumber, isCountingAutomatically, isTransitioningToChallenge, sequenceFeedback]);


  // --- LOGIQUE SOUSTRAIRE (HANDLE SUBTRACT) ---
  const handleSubtract = useCallback((idx: number) => {

    // Blocage du clic manuel pendant l'auto-comptage
    if (isCountingAutomatically) return;

    // Définir quelles colonnes sont interactives selon la phase
    const isAllowedColumn = () => {
      if (phase === 'normal') return true;
      if (isUnitsColumn(idx)) return true;
      if (idx === 1 && (phase === 'challenge-tens-1' || phase === 'challenge-tens-2' || phase === 'challenge-tens-3' || phase === 'learn-tens-combination')) return true;
      if ((idx === 1 || idx === 2) && (phase === 'challenge-hundreds-1' || phase === 'challenge-hundreds-2' || phase === 'challenge-hundreds-3' || phase === 'learn-hundreds-combination')) return true;
      if ((idx === 1 || idx === 2 || idx === 3) && (phase === 'challenge-thousands-1' || phase === 'challenge-thousands-2' || phase === 'challenge-thousands-3' || phase === 'learn-thousands-combination')) return true;
      return false;
    };

    if (!isAllowedColumn()) {
      setFeedback("Concentrons-nous sur les colonnes actives pour l'instant !");
      return;
    }

    if (totalNumber <= 0) {
      sequenceFeedback(
        "C'est **ZÉRO** (0) ! 🎯 Il n'y a plus rien. On ne peut pas descendre plus bas !",
        "ZÉRO = aucune bille, aucune quantité !"
      );
      return;
    }

    const newCols = [...columns];
    const tempTotalBefore = totalNumber;
    let hasBorrow = false;


    if (newCols[idx].value > 0) {
      newCols[idx].value--;
    } else {
      // Tenter l'emprunt (propagation de droite à gauche)
      let sourceIdx = idx + 1;
      while (sourceIdx < newCols.length && newCols[sourceIdx].value === 0) {
        sourceIdx++;
      }

      if (sourceIdx < newCols.length) {
        newCols[sourceIdx].value--;
        hasBorrow = true;
        // Remplir les colonnes intermédiaires et la colonne initiale à 9
        for (let i = sourceIdx - 1; i >= idx; i--) {
          newCols[i].value = 9;
        }
      }
    }

    // Si la valeur est toujours positive après soustraction
    if (tempTotalBefore > 0) {
      setColumns(newCols);

      if (phase !== 'click-remove' && phase !== 'tutorial' && phase !== 'explore-units' && phase !== 'challenge-unit-1' && phase !== 'challenge-unit-2' && phase !== 'challenge-unit-3') {
        setFeedback(`🎈 ${newCols[idx].value} bille${newCols[idx].value > 1 ? 's' : ''} dans ${newCols[idx].name}. Clique sur △ ou ∇ !`);
      }
    }


    // --- LOGIQUE DE PROGRESSION ---

    // A. tutorial (Découverte du bouton rouge)
    if (phase === 'tutorial') {
      const unitsValue = newCols[0].value;

      if (unitsValue === 2) {
        sequenceFeedback(
          "Génial ! 🎈 Le bouton ROUGE enlève une bille ! Il en reste deux !",
          "VERT ajoute, ROUGE enlève. Facile ! Clique encore sur ∇ !"
        );
      } else if (unitsValue === 1) {
        sequenceFeedback(
          "Bravo ! Clique encore sur ROUGE pour tout enlever !",
          "Plus qu'une bille ! Un dernier clic !"
        );
      } else if (unitsValue === 0 && tempTotalBefore === 1) {
        // 1. Message d'aventure, puis transition vers phase d'observation
        sequenceFeedback(
          "Extraordinaire ! 🎉 Tu maîtrises les deux boutons ! Je vais t'apprendre les **NOMBRES** !",
          "Prépare-toi pour une grande aventure !"
        );

        // 2. Après le délai, passer à la phase d'observation, mais NE PAS démarrer le compteur auto tout de suite
        setTimeout(() => {
          setColumns(initialColumns.map(col => ({ ...col })));
          setNextPhaseAfterAuto('explore-units');
          setPhase('learn-units');
          setPendingAutoCount(true);
          // Afficher le message d'observation, le compteur auto démarrera à la fin du typing
          sequenceFeedback(
            "Bienvenue dans le monde des NOMBRES ! ✨ Un nombre dit COMBIEN il y a de choses.",
            "Regarde ! 👀 La machine compte de 1 à 9. Compte avec tes doigts !"
          );
        }, FEEDBACK_DELAY * 2);
      } else if (unitsValue > 0) {
        sequenceFeedback(
          `Bien joué ! Continue à cliquer sur ROUGE !`,
          "Le bouton ROUGE retire une bille à chaque fois !"
        );
      }
    }

    // B. explore-units : si on soustrait trop tôt
    else if (phase === 'explore-units' && newCols[0].value < columns[0].value) {
      setFeedback("On n'enlève pas encore ! Clique sur △ pour ajouter !");
    }

    // C. click-remove (La soustraction et le retour à Zéro avec les doigts)
    if (phase === 'click-remove' && isUnitsColumn(idx)) {
      const unitsValue = newCols[0].value;

      if (unitsValue === 5) {
        sequenceFeedback(
          `**${unitsValue}** (CINQ) ! ✋ Une main entière !`,
          `Bien joué ! Continue avec ∇ !`
        );
      } else if (unitsValue === 3) {
        sequenceFeedback(
          `**${unitsValue}** (TROIS) ! 🎈`,
          `Continue vers zéro avec ∇ !`
        );
      } else if (unitsValue === 2) {
        sequenceFeedback(
          `**${unitsValue}** (DEUX) ! ✌️`,
          `Presque à zéro ! Continue avec ∇ !`
        );
      } else if (unitsValue === 1) {
        sequenceFeedback(
          `**${unitsValue}** (UN) ! 👆`,
          `Presque à ZÉRO ! Un dernier clic !`
        );
      } else if (unitsValue === 0 && tempTotalBefore === 1) {
        sequenceFeedback(
          "**ZÉRO** (0) ! 🎉 Plus rien ! On est revenu au début !",
          "Fantastique ! Tu maîtrises les nombres de 0 à 9 !"
        );

        // Transition directe vers le défi d'évaluation
        setTimeout(() => {
          // Débloquer la colonne des dizaines pour préparer le défi
          const newCols = initialColumns.map((col, i) => i === 1 ? { ...col, unlocked: true } : col);
          setColumns(newCols);
          setUnitTargetIndex(0);
          setUnitSuccessCount(0);
          setPhase('challenge-unit-1');
          const firstTarget = UNIT_CHALLENGES[0].targets[0];
          setFeedback(`Bravo ! 🎉 Maintenant, DÉFI 1 : Affiche le nombre **${firstTarget}** avec les boutons, puis clique sur VALIDER !`);
        }, FEEDBACK_DELAY);
      } else if (unitsValue > 0) {
        sequenceFeedback(
          `**${unitsValue}** ! Baisse un doigt !`,
          `${unitsValue} doigts levés. Continue avec ∇ !`
        );
      }
    }

    // D. Feedback sur l'emprunt en mode normal
    if (phase === 'normal' && hasBorrow) {
      setFeedback("🔄 Emprunt magique ! Continue avec ∇ si nécessaire !");
    }
  }, [columns, phase, isUnitsColumn, totalNumber, isCountingAutomatically, sequenceFeedback]);


  // --- LOGIQUE BOUTON VALIDER DES DÉFIS DES UNITÉS ---
  const handleValidateLearning = useCallback(() => {
    const challengePhases = ['challenge-unit-1', 'challenge-unit-2', 'challenge-unit-3'] as const;
    const challengeIndex = challengePhases.indexOf(phase as typeof challengePhases[number]);
    
    if (challengeIndex === -1) return;

    const challenge = UNIT_CHALLENGES[challengeIndex];
    const targetNumber = challenge.targets[unitTargetIndex];
    const currentNumber = columns[0].value;

    if (currentNumber === targetNumber) {
      const newSuccessCount = unitSuccessCount + 1;
      setUnitSuccessCount(newSuccessCount);

      // Si tous les nombres du défi actuel sont validés
      if (unitTargetIndex + 1 >= challenge.targets.length) {
        // Si c'est le dernier défi
        if (challengeIndex === UNIT_CHALLENGES.length - 1) {
          setFeedback("🎉 TOUS LES DÉFIS RÉUSSIS ! Bravo ! Tu maîtrises les unités !");
          
          setTimeout(() => {
            setPhase('learn-carry');
            sequenceFeedback(
              "Prêt pour la magie ? 🎩 Clique sur △ pour l'échange 10 pour 1 !",
              "Vas-y ! Clique sur △ pour voir la transformation !"
            );
          }, FEEDBACK_DELAY);
        } else {
          // Passer au défi suivant
          setFeedback(`✅ DÉFI ${challengeIndex + 1} TERMINÉ ! Bravo !`);
          
          setTimeout(() => {
            const resetCols = initialColumns.map((col, i) => i === 1 ? { ...col, unlocked: true } : col);
            setColumns(resetCols);
            setUnitTargetIndex(0);
            setUnitSuccessCount(0);
            
            const nextPhase = challengePhases[challengeIndex + 1];
            setPhase(nextPhase);
            const firstTarget = UNIT_CHALLENGES[challengeIndex + 1].targets[0];
            setFeedback(`🎯 DÉFI ${challengeIndex + 2} : Affiche le nombre **${firstTarget}** puis clique sur VALIDER !`);
          }, FEEDBACK_DELAY);
        }
      } else {
        // Nombre validé, passer au suivant dans le même défi
        setFeedback("✅ Correct ! Bravo !");
        
        setTimeout(() => {
          const resetCols = initialColumns.map((col, i) => i === 1 ? { ...col, unlocked: true } : col);
          setColumns(resetCols);
          setUnitTargetIndex(unitTargetIndex + 1);
          
          const nextTarget = challenge.targets[unitTargetIndex + 1];
          setFeedback(`🎯 DÉFI ${challengeIndex + 1} : Affiche le nombre **${nextTarget}** puis clique sur VALIDER ! (${newSuccessCount}/${challenge.targets.length})`);
        }, FEEDBACK_DELAY);
      }
    } else {
      setFeedback(`Pas encore ! Il faut ${targetNumber}. Utilise △ et ∇ !`);
    }
  }, [phase, columns, unitTargetIndex, unitSuccessCount, sequenceFeedback]);


  // --- LOGIQUE BOUTON VALIDER DES DÉFIS DES DIZAINES ---
  const handleValidateTens = useCallback(() => {
    const challengePhases = ['challenge-tens-1', 'challenge-tens-2', 'challenge-tens-3'] as const;
    const challengeIndex = challengePhases.indexOf(phase as typeof challengePhases[number]);
    
    if (challengeIndex === -1) return;

    const challenge = TENS_CHALLENGES[challengeIndex];
    const targetNumber = challenge.targets[tensTargetIndex];
    const currentNumber = totalNumber;

    if (currentNumber === targetNumber) {
      const newSuccessCount = tensSuccessCount + 1;
      setTensSuccessCount(newSuccessCount);

      // Si tous les nombres du défi actuel sont validés
      if (tensTargetIndex + 1 >= challenge.targets.length) {
        // Si c'est le dernier défi
        if (challengeIndex === TENS_CHALLENGES.length - 1) {
          setFeedback("🎉 TOUS LES DÉFIS RÉUSSIS ! Bravo ! Tu maîtrises les dizaines !");
          
          // Marquer les dizaines comme complétées et débloquer les centaines
          setCompletedChallenges(prev => ({ ...prev, tens: true }));
          
          setTimeout(() => {
            setPhase('normal');
            const newCols = [...columns];
            const hundredsIdx = 2;
            if (!newCols[hundredsIdx].unlocked) {
              newCols[hundredsIdx].unlocked = true;
              setColumns(newCols);
              setCompletedChallenges(prev => ({ ...prev, hundreds: true }));
            }
            sequenceFeedback(
              "APPRENTISSAGE DES DIZAINES TERMINÉ ! Bravo ! 🎉 Tu peux maintenant utiliser librement les nombres !",
              "🔓 Les CENTAINES sont débloquées ! Utilise le bouton pour débloquer les MILLIERS !",
              FEEDBACK_DELAY / 1.5
            );
          }, FEEDBACK_DELAY * 2);
        } else {
          // Passer au défi suivant
          const nextChallenge = TENS_CHALLENGES[challengeIndex + 1];
          setFeedback(`🎉 DÉFI ${challengeIndex + 1} RÉUSSI ! Préparé pour le prochain ?`);
          
          setTimeout(() => {
            setTensTargetIndex(0);
            setTensSuccessCount(0);
            setPhase(nextChallenge.phase);
            
            // Réinitialiser les colonnes
            const resetCols = initialColumns.map((col, i) => i === 1 ? { ...col, unlocked: true } : col);
            setColumns(resetCols);
            
            setFeedback(`🎯 DÉFI ${challengeIndex + 2} : Affiche le nombre **${nextChallenge.targets[0]}** !`);
          }, FEEDBACK_DELAY * 2);
        }
      } else {
        // Passer au nombre suivant dans le même défi
        setTensTargetIndex(tensTargetIndex + 1);
        const nextTarget = challenge.targets[tensTargetIndex + 1];
        
        // Réinitialiser les colonnes
        const resetCols = initialColumns.map((col, i) => i === 1 ? { ...col, unlocked: true } : col);
        setColumns(resetCols);
        
        sequenceFeedback(
          `✅ Correct ! ${newSuccessCount}/${challenge.targets.length} réussis !`,
          `Maintenant affiche **${nextTarget}** !`
        );
      }
    } else {
      setFeedback(`Pas encore ! Il faut ${targetNumber}. Réessaie avec △ et ∇ !`);
    }
  }, [phase, columns, totalNumber, tensTargetIndex, tensSuccessCount, sequenceFeedback]);


  // --- LOGIQUE BOUTON VALIDER DES DÉFIS DES CENTAINES ---
  const handleValidateHundreds = useCallback(() => {
    const challengePhases = ['challenge-hundreds-1', 'challenge-hundreds-2', 'challenge-hundreds-3'] as const;
    const challengeIndex = challengePhases.indexOf(phase as typeof challengePhases[number]);
    
    if (challengeIndex === -1) return;

    const challenge = HUNDREDS_CHALLENGES[challengeIndex];
    const targetNumber = challenge.targets[hundredsTargetIndex];
    const currentNumber = totalNumber;

    if (currentNumber === targetNumber) {
      const newSuccessCount = hundredsSuccessCount + 1;
      setHundredsSuccessCount(newSuccessCount);

      // Si tous les nombres du défi actuel sont validés
      if (hundredsTargetIndex + 1 >= challenge.targets.length) {
        // Si c'est le dernier défi
        if (challengeIndex === HUNDREDS_CHALLENGES.length - 1) {
          setFeedback("🎉 TOUS LES DÉFIS RÉUSSIS ! Bravo ! Tu maîtrises les centaines !");
          
          // Marquer les centaines comme complétées et débloquer les milliers
          setCompletedChallenges(prev => ({ ...prev, hundreds: true }));
          
          setTimeout(() => {
            setPhase('normal');
            const newCols = [...columns];
            const thousandsIdx = 3;
            if (!newCols[thousandsIdx].unlocked) {
              newCols[thousandsIdx].unlocked = true;
              setColumns(newCols);
              setCompletedChallenges(prev => ({ ...prev, thousands: true }));
            }
            sequenceFeedback(
              "APPRENTISSAGE DES CENTAINES TERMINÉ ! Bravo ! 🎉 Tu peux maintenant utiliser librement les nombres !",
              "🔓 Les MILLIERS sont débloqués ! Utilise le bouton pour explorer les milliers !",
              FEEDBACK_DELAY / 1.5
            );
          }, FEEDBACK_DELAY * 2);
        } else {
          // Passer au défi suivant
          const nextChallenge = HUNDREDS_CHALLENGES[challengeIndex + 1];
          setFeedback(`🎉 DÉFI ${challengeIndex + 1} RÉUSSI ! Préparé pour le prochain ?`);
          
          setTimeout(() => {
            setHundredsTargetIndex(0);
            setHundredsSuccessCount(0);
            setPhase(nextChallenge.phase);
            
            // Réinitialiser les colonnes
            const resetCols = initialColumns.map((col, i) => (i === 1 || i === 2) ? { ...col, unlocked: true } : col);
            setColumns(resetCols);
            
            setFeedback(`🎯 DÉFI ${challengeIndex + 2} : Affiche le nombre **${nextChallenge.targets[0]}** !`);
          }, FEEDBACK_DELAY * 2);
        }
      } else {
        // Passer au nombre suivant dans le même défi
        setHundredsTargetIndex(hundredsTargetIndex + 1);
        const nextTarget = challenge.targets[hundredsTargetIndex + 1];
        
        // Réinitialiser les colonnes
        const resetCols = initialColumns.map((col, i) => (i === 1 || i === 2) ? { ...col, unlocked: true } : col);
        setColumns(resetCols);
        
        sequenceFeedback(
          `✅ Correct ! ${newSuccessCount}/${challenge.targets.length} réussis !`,
          `Maintenant affiche **${nextTarget}** !`
        );
      }
    } else {
      setFeedback(`Pas encore ! Il faut ${targetNumber}. Réessaie avec △ et ∇ !`);
    }
  }, [phase, columns, totalNumber, hundredsTargetIndex, hundredsSuccessCount, sequenceFeedback]);


  // --- LOGIQUE BOUTON VALIDER DES DÉFIS DES MILLIERS ---
  const handleValidateThousands = useCallback(() => {
    const challengePhases = ['challenge-thousands-1', 'challenge-thousands-2', 'challenge-thousands-3'] as const;
    const challengeIndex = challengePhases.indexOf(phase as typeof challengePhases[number]);
    
    if (challengeIndex === -1) return;

    const challenge = THOUSANDS_CHALLENGES[challengeIndex];
    const targetNumber = challenge.targets[thousandsTargetIndex];
    const currentNumber = totalNumber;

    if (currentNumber === targetNumber) {
      const newSuccessCount = thousandsSuccessCount + 1;
      setThousandsSuccessCount(newSuccessCount);

      // Si tous les nombres du défi actuel sont validés
      if (thousandsTargetIndex + 1 >= challenge.targets.length) {
        // Si c'est le dernier défi
        if (challengeIndex === THOUSANDS_CHALLENGES.length - 1) {
          setFeedback("🎉 TOUS LES DÉFIS RÉUSSIS ! Bravo ! Tu maîtrises les milliers !");
          
          // Marquer les milliers comme complétés
          setCompletedChallenges(prev => ({ ...prev, thousands: true }));
          
          setTimeout(() => {
            setPhase('normal');
            sequenceFeedback(
              "APPRENTISSAGE DES MILLIERS TERMINÉ ! Bravo ! 🎉 Tu es un expert des nombres !",
              "🏆 Tu peux maintenant créer n'importe quel nombre jusqu'à 9999 !",
              FEEDBACK_DELAY / 1.5
            );
          }, FEEDBACK_DELAY * 2);
        } else {
          // Passer au défi suivant
          const nextChallenge = THOUSANDS_CHALLENGES[challengeIndex + 1];
          setFeedback(`🎉 DÉFI ${challengeIndex + 1} RÉUSSI ! Préparé pour le prochain ?`);
          
          setTimeout(() => {
            setThousandsTargetIndex(0);
            setThousandsSuccessCount(0);
            setPhase(nextChallenge.phase);
            
            // Réinitialiser les colonnes
            const resetCols = columns.map(col => ({ ...col, unlocked: true }));
            setColumns(resetCols);
            
            setFeedback(`🎯 DÉFI ${challengeIndex + 2} : Affiche le nombre **${nextChallenge.targets[0]}** !`);
          }, FEEDBACK_DELAY * 2);
        }
      } else {
        // Passer au nombre suivant dans le même défi
        setThousandsTargetIndex(thousandsTargetIndex + 1);
        const nextTarget = challenge.targets[thousandsTargetIndex + 1];
        
        // Réinitialiser les colonnes
        const resetCols = columns.map(col => ({ ...col, unlocked: true }));
        setColumns(resetCols);
        
        sequenceFeedback(
          `✅ Correct ! ${newSuccessCount}/${challenge.targets.length} réussis !`,
          `Maintenant affiche **${nextTarget}** !`
        );
      }
    } else {
      setFeedback(`Pas encore ! Il faut ${targetNumber}. Réessaie avec △ et ∇ !`);
    }
  }, [phase, columns, totalNumber, thousandsTargetIndex, thousandsSuccessCount, sequenceFeedback]);


  // --- LOGIQUE DÉMARRAGE APPRENTISSAGE (post-tutoriel) ---
  const startLearningPhase = useCallback(() => {
    if (phase === 'done') {
      // S'assurer que le compteur est à zéro au démarrage
      const newCols = initialColumns.map((col, i) => i === 1 ? { ...col, unlocked: true } : col);
      setColumns(newCols);

  setNextPhaseAfterAuto('challenge-unit-1');
  setPhase('learn-units');
  setPendingAutoCount(true);
  setIsCountingAutomatically(false);

      sequenceFeedback(
        "C'est parti ! 🎉 La machine va compter de 1 à 9 !",
        "Observe bien les billes ! Compte avec tes doigts !"
      );
    }
  }, [phase, sequenceFeedback]);


  // --- LOGIQUE JEU LIBRE ---
  const unlockNextColumn = useCallback(() => {
    const nextIdx = columns.findIndex((col, i) => !col.unlocked && i > 0);
    if (nextIdx !== -1) {
      const newCols = [...columns];
      
      // Générer un message d'explication adapté au niveau
      if (nextIdx === 1 && !completedChallenges.tens) {
        setFeedback("⚠️ Tu dois d'abord compléter le défi des dizaines !");
        return;
      } else if (nextIdx === 2) {
        // Débloquer et lancer l'apprentissage des centaines
        if (!completedChallenges.tens) {
          setFeedback("⚠️ Tu dois d'abord maîtriser les dizaines !");
          return;
        }
        
        newCols[nextIdx].unlocked = true;
        setColumns(newCols);
        
        // Lancer la phase d'apprentissage des centaines
        setTimeout(() => {
          const resetCols = initialColumns.map((col, i) => (i === 1 || i === 2) ? { ...col, unlocked: true } : col);
          setColumns(resetCols);
          setPhase('learn-hundreds');
          setPendingAutoCount(true);
          setIsCountingAutomatically(false);
          
          sequenceFeedback(
            "NIVEAU DÉBLOQUÉ : Les CENTAINES ! 💯",
            "Regarde ! 👀 La machine va compter par centaines : 100, 200, 300... !"
          );
        }, FEEDBACK_DELAY);
      } else if (nextIdx === 3) {
        if (!completedChallenges.hundreds) {
          setFeedback("⚠️ Tu dois d'abord maîtriser les centaines !");
          return;
        }
        
        newCols[nextIdx].unlocked = true;
        setColumns(newCols);
        
        // Lancer la phase d'apprentissage des milliers
        setTimeout(() => {
          const resetCols = columns.map(col => ({ ...col, unlocked: true }));
          setColumns(resetCols);
          setPhase('learn-thousands');
          setPendingAutoCount(true);
          setIsCountingAutomatically(false);
          
          sequenceFeedback(
            "NIVEAU MAXIMUM : Les MILLIERS ! 🎉",
            "Regarde ! 👀 La machine va compter par milliers : 1000, 2000, 3000... !"
          );
        }, FEEDBACK_DELAY);
      } else {
        newCols[nextIdx].unlocked = true;
        setColumns(newCols);
        setFeedback(`🔓 Colonne ${newCols[nextIdx].name} débloquée ! Clique sur △ et ∇ pour t'amuser !`);
      }
    }
  }, [columns, completedChallenges, sequenceFeedback]);


  // --- Instructions par phase (Typing Effect) ---
  const instruction = useMemo(() => {
    switch (phase) {
      case 'tutorial':
        return "Bienvenue ! Clique sur △ pour découvrir la machine !";
      case 'explore-units':
        return "Clique sur △ pour ajouter une bille. Lève UN doigt à chaque clic. Répète : UN, DEUX, TROIS !";
      case 'click-add':
        return "Continue jusqu'à 9 ! Chaque clic ajoute UNE bille !";
      case 'click-remove':
        return "Clique sur ∇ pour enlever les billes jusqu'à ZÉRO !";
      case 'done':
        return "Génial ! Clique sur 'Commencer l'apprentissage' pour découvrir l'échange 10 pour 1 ! 🎩";
      case 'learn-units':
        return "Regarde ! 👀 La machine compte de 1 à 9. Compte avec tes doigts !";
      case 'challenge-unit-1':
      case 'challenge-unit-2':
      case 'challenge-unit-3': {
        const challengeIndex = ['challenge-unit-1', 'challenge-unit-2', 'challenge-unit-3'].indexOf(phase);
        const challenge = UNIT_CHALLENGES[challengeIndex];
        const targetNumber = challenge.targets[unitTargetIndex];
        return `DÉFI ${challengeIndex + 1} : Affiche **${targetNumber}** puis clique sur VALIDER ! (${unitSuccessCount}/${challenge.targets.length})`;
      }
      case 'learn-carry':
        return "C'est le grand moment ! 🎆 Clique sur △ pour voir la transformation !";
      case 'learn-tens':
        return "Regarde ! 👀 La machine compte par dizaines : 10, 20, 30...";
      case 'learn-tens-combination':
        return "🎯 Observe comment on combine dizaines et unités pour former des nombres !";
      case 'challenge-tens-1':
      case 'challenge-tens-2':
      case 'challenge-tens-3': {
        const challengeIndex = ['challenge-tens-1', 'challenge-tens-2', 'challenge-tens-3'].indexOf(phase);
        const challenge = TENS_CHALLENGES[challengeIndex];
        const targetNumber = challenge.targets[tensTargetIndex];
        return `DÉFI ${challengeIndex + 1} : Affiche **${targetNumber}** puis clique sur VALIDER ! (${tensSuccessCount}/${challenge.targets.length})`;
      }
      case 'learn-hundreds':
        return "Regarde ! 👀 La machine compte par centaines : 100, 200, 300...";
      case 'learn-hundreds-combination':
        return "🎯 Observe comment on combine centaines, dizaines et unités !";
      case 'challenge-hundreds-1':
      case 'challenge-hundreds-2':
      case 'challenge-hundreds-3': {
        const challengeIndex = ['challenge-hundreds-1', 'challenge-hundreds-2', 'challenge-hundreds-3'].indexOf(phase);
        const challenge = HUNDREDS_CHALLENGES[challengeIndex];
        const targetNumber = challenge.targets[hundredsTargetIndex];
        return `DÉFI ${challengeIndex + 1} : Affiche **${targetNumber}** puis clique sur VALIDER ! (${hundredsSuccessCount}/${challenge.targets.length})`;
      }
      case 'learn-thousands':
        return "Regarde ! 👀 La machine compte par milliers : 1000, 2000, 3000...";
      case 'learn-thousands-combination':
        return "🎯 Observe comment on combine tous les chiffres pour former des grands nombres !";
      case 'challenge-thousands-1':
      case 'challenge-thousands-2':
      case 'challenge-thousands-3': {
        const challengeIndex = ['challenge-thousands-1', 'challenge-thousands-2', 'challenge-thousands-3'].indexOf(phase);
        const challenge = THOUSANDS_CHALLENGES[challengeIndex];
        const targetNumber = challenge.targets[thousandsTargetIndex];
        return `DÉFI ${challengeIndex + 1} : Affiche **${targetNumber}** puis clique sur VALIDER ! (${thousandsSuccessCount}/${challenge.targets.length})`;
      }
      case 'normal':
        return "Mode exploration ! 🚀 Construis des grands nombres !";
      default:
        return "Prépare-toi pour l'aventure des nombres !";
    }
  }, [phase, unitTargetIndex, unitSuccessCount, tensTargetIndex, tensSuccessCount, hundredsTargetIndex, hundredsSuccessCount, thousandsTargetIndex, thousandsSuccessCount]);

  // Typing queue to ensure messages are typed one after another
  const queueRef = useRef<Array<{ kind: 'instruction' | 'feedback'; text: string }>>([]);
  const processingRef = useRef(false);
  const prevInstructionRef = useRef<string>("");

  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;

    while (queueRef.current.length > 0) {
      const item = queueRef.current.shift()!;
      setTypedInstruction("");
      setTypedFeedback("");

      if (item.kind === 'instruction') {
        setIsTypingInstruction(true);

        for (let i = 1; i <= item.text.length; i++) {
          setTypedInstruction(item.text.slice(0, i));
          // await each character
          await sleep(TYPING_SPEED);
        }

        setIsTypingInstruction(false);
      } else {
        const prefixed = ` ${item.text}`;
        setIsTypingFeedback(true);

        for (let i = 1; i <= prefixed.length; i++) {
          setTypedFeedback(prefixed.slice(0, i));
          await sleep(TYPING_SPEED);
        }

        setIsTypingFeedback(false);
      }

      if (queueRef.current.length > 0) {
        await sleep(MESSAGE_READ_DELAY);
      }
    }

    processingRef.current = false;
  }, []);

  // Enqueue instruction when it changes (only once per new instruction)
  useEffect(() => {
    if (!instruction) return;
    if (prevInstructionRef.current === instruction) return;
    prevInstructionRef.current = instruction;

    queueRef.current.push({ kind: 'instruction', text: instruction });
    void processQueue();
  }, [instruction, processQueue]);

  // Enqueue feedback whenever it changes (always queued so each click produces its feedback)
  useEffect(() => {
    if (!feedback) return;

    queueRef.current.push({ kind: 'feedback', text: feedback });
    void processQueue();
  }, [feedback, processQueue]);

  const displayText = useMemo(() => typedFeedback || typedInstruction, [typedInstruction, typedFeedback]);

  const isTyping = isTypingInstruction || isTypingFeedback;

  // --- Démarrage du compteur auto après le texte d'observation ---
  useEffect(() => {
    // On veut démarrer le comptage auto uniquement après les phases d'apprentissage,
    // lorsque toutes les animations de texte sont terminées
    if (
      (phase === 'learn-units' || phase === 'learn-tens' || phase === 'learn-tens-combination' || 
       phase === 'learn-hundreds' || phase === 'learn-hundreds-combination' ||
       phase === 'learn-thousands' || phase === 'learn-thousands-combination') &&
      pendingAutoCount &&
      !isCountingAutomatically &&
      !isTypingInstruction &&
      !isTypingFeedback
    ) {
      setIsCountingAutomatically(true);
      setPendingAutoCount(false);
    }
  }, [phase, pendingAutoCount, isCountingAutomatically, isTypingInstruction, isTypingFeedback]);

  const allColumnsUnlocked = columns.every(col => col.unlocked);
  const showUnlockButton = phase === 'normal' && !allColumnsUnlocked;
  const showStartLearningButton = phase === 'done';
  const showValidateLearningButton = phase === 'challenge-unit-1' || phase === 'challenge-unit-2' || phase === 'challenge-unit-3';
  const showValidateTensButton = phase === 'challenge-tens-1' || phase === 'challenge-tens-2' || phase === 'challenge-tens-3';
  const showValidateHundredsButton = phase === 'challenge-hundreds-1' || phase === 'challenge-hundreds-2' || phase === 'challenge-hundreds-3';
  const showValidateThousandsButton = phase === 'challenge-thousands-1' || phase === 'challenge-thousands-2' || phase === 'challenge-thousands-3';

  // --- Rendu des jetons visuels ---
  const renderTokens = useCallback((value: number) => (
    <div style={{ display: "flex", gap: 4, justifyContent: "center", minHeight: 22 }}>
      {[...Array(9)].map((_, i) => (
        <span
          key={i}
          style={{
            width: 16,
            height: 16,
            borderRadius: "100%",
            background: i < value ? "#38bdf8" : "#e5e7eb",
            display: "inline-block",
            transition: "background 0.2s ease",
          }}
          aria-hidden="true"
        />
      ))}
    </div>
  ), []);

  return (
    <div style={{
      fontFamily: 'sans-serif',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      gap: 24,
      margin: '2rem auto',
      flexWrap: 'wrap',
      padding: '0 1rem',
      maxWidth: 900
    }}>
      {/* Machine principale */}
      <div style={{
        maxWidth: 450,
        width: '100%',
        padding: 16,
        background: '#fff',
        borderRadius: 4,
        border: '1px solid #cbd5e1',
      }}>
        <h2 style={{
          fontSize: 24,
          marginBottom: 16,
          textAlign: 'center',
          color: '#1e293b'
        }}>
          Machine à Nombres
        </h2>

        <div style={{
          display: 'flex',
          gap: 8,
          justifyContent: 'center',
          marginBottom: 16
        }}>
          {/* Rendu des colonnes (Milliers à gauche, Unités à droite) */}
          {columns.slice().reverse().map((col, idx) => {
            const originalIdx = columns.length - 1 - idx;
            const isUnit = isUnitsColumn(originalIdx);

            // Logique d'activation des boutons
            let isInteractive = false;
            if (col.unlocked) {
              if (phase === 'normal') {
                isInteractive = true;
              }
              else if ((phase === 'tutorial' || phase === 'explore-units' || phase === 'click-add' || phase === 'click-remove' || phase === 'challenge-unit-1' || phase === 'challenge-unit-2' || phase === 'challenge-unit-3') && isUnit) {
                isInteractive = true;
              }
              else if (phase === 'learn-carry' && isUnit) {
                isInteractive = true;
              }
              else if ((phase === 'challenge-tens-1' || phase === 'challenge-tens-2' || phase === 'challenge-tens-3' || phase === 'learn-tens-combination') && (isUnit || originalIdx === 1)) {
                // Pendant les défis des dizaines, activer à la fois les unités et les dizaines
                isInteractive = true;
              }
              else if ((phase === 'challenge-hundreds-1' || phase === 'challenge-hundreds-2' || phase === 'challenge-hundreds-3' || phase === 'learn-hundreds-combination') && (isUnit || originalIdx === 1 || originalIdx === 2)) {
                // Pendant les défis des centaines, activer unités, dizaines et centaines
                isInteractive = true;
              }
              else if ((phase === 'challenge-thousands-1' || phase === 'challenge-thousands-2' || phase === 'challenge-thousands-3' || phase === 'learn-thousands-combination') && (isUnit || originalIdx === 1 || originalIdx === 2 || originalIdx === 3)) {
                // Pendant les défis des milliers, activer toutes les colonnes
                isInteractive = true;
              }
            }

            // Désactiver pendant l'auto-comptage
            if (isCountingAutomatically) {
              isInteractive = false;
            }


            return (
              <div
                key={col.name}
                style={{
                  opacity: col.unlocked ? 1 : 0.4,
                  textAlign: 'center',
                  minWidth: 70,
                  transition: 'opacity 0.3s ease'
                }}
              >
                <div style={{
                  fontWeight: 'bold',
                  fontSize: 13,
                  marginBottom: 8,
                  color: '#475569'
                }}>
                  {col.name}
                </div>

                {renderTokens(col.value)}

                <div style={{ marginTop: 8, display: 'flex', gap: 4, justifyContent: 'center' }}>
                  {/* Bouton Ajouter */}
                  <button
                    onClick={() => handleAdd(originalIdx)}
                    disabled={!isInteractive}
                    aria-label={`Ajouter une unité dans ${col.name}`}
                    style={{
                      fontSize: 18,
                      padding: '4px 10px',
                      background: isInteractive && isUnit ? '#22c55e' : isInteractive ? '#10b981' : '#e5e7eb',
                      color: isInteractive ? '#fff' : '#9ca3af',
                      border: 'none',
                      borderRadius: 6,
                      cursor: isInteractive ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s ease',
                      fontWeight: 'bold'
                    }}
                  >
                    △
                  </button>
                  {/* Bouton Soustraire */}
                  <button
                    onClick={() => handleSubtract(originalIdx)}
                    disabled={!isInteractive}
                    aria-label={`Retirer une unité de ${col.name}`}
                    style={{
                      fontSize: 18,
                      padding: '4px 10px',
                      background: isInteractive && isUnit ? '#ef4444' : isInteractive ? '#f87171' : '#e5e7eb',
                      color: isInteractive ? '#fff' : '#9ca3af',
                      border: 'none',
                      borderRadius: 6,
                      cursor: isInteractive ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s ease',
                      fontWeight: 'bold'
                    }}
                  >
                    ∇
                  </button>
                </div>

                <div style={{
                  fontSize: 20,
                  marginTop: 6,
                  fontWeight: 'bold',
                  color: '#0ea5e9'
                }}>
                  {col.value}
                </div>
              </div>
            );
          })}
        </div>

        {/* BOUTON VALIDER (Défi d'apprentissage 5) */}
        {showValidateLearningButton && (() => {
          const challengeIndex = ['challenge-unit-1', 'challenge-unit-2', 'challenge-unit-3'].indexOf(phase as string);
          const challenge = UNIT_CHALLENGES[challengeIndex];
          const targetNumber = challenge.targets[unitTargetIndex];
          const isCorrect = columns[0].value === targetNumber;
          
          return (
            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <button
                onClick={handleValidateLearning}
                style={{
                  fontSize: 16,
                  padding: '10px 30px',
                  background: isCorrect
                    ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                    : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  boxShadow: isCorrect
                    ? '0 4px 8px rgba(34, 197, 94, 0.3)'
                    : '0 4px 8px rgba(249, 115, 22, 0.3)',
                  transition: 'all 0.2s ease',
                  animation: isCorrect ? 'celebration 0.6s ease-in-out infinite' : 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {isCorrect ? '✅ VALIDER LE DÉFI' : '🎯 VALIDER LE DÉFI'}
              </button>
            </div>
          );
        })()}

        {/* BOUTON VALIDER (Défis des dizaines) */}
        {showValidateTensButton && (() => {
          const challengeIndex = ['challenge-tens-1', 'challenge-tens-2', 'challenge-tens-3'].indexOf(phase as string);
          const challenge = TENS_CHALLENGES[challengeIndex];
          const targetNumber = challenge.targets[tensTargetIndex];
          const isCorrect = totalNumber === targetNumber;
          
          return (
            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <button
                onClick={handleValidateTens}
                style={{
                  fontSize: 16,
                  padding: '10px 30px',
                  background: isCorrect
                    ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                    : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  boxShadow: isCorrect
                    ? '0 4px 8px rgba(34, 197, 94, 0.3)'
                    : '0 4px 8px rgba(249, 115, 22, 0.3)',
                  transition: 'all 0.2s ease',
                  animation: isCorrect ? 'celebration 0.6s ease-in-out infinite' : 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {isCorrect ? '✅ VALIDER LE DÉFI ' : '🎯 VALIDER LE DÉFI'}
              </button>
            </div>
          );
        })()}

        {/* BOUTON VALIDER (Défis des centaines) */}
        {showValidateHundredsButton && (() => {
          const challengeIndex = ['challenge-hundreds-1', 'challenge-hundreds-2', 'challenge-hundreds-3'].indexOf(phase as string);
          const challenge = HUNDREDS_CHALLENGES[challengeIndex];
          const targetNumber = challenge.targets[hundredsTargetIndex];
          const isCorrect = totalNumber === targetNumber;
          
          return (
            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <button
                onClick={handleValidateHundreds}
                style={{
                  fontSize: 16,
                  padding: '10px 30px',
                  background: isCorrect
                    ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                    : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  boxShadow: isCorrect
                    ? '0 4px 8px rgba(34, 197, 94, 0.3)'
                    : '0 4px 8px rgba(249, 115, 22, 0.3)',
                  transition: 'all 0.2s ease',
                  animation: isCorrect ? 'celebration 0.6s ease-in-out infinite' : 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {isCorrect ? '✅ VALIDER LE DÉFI' : '🎯 VALIDER LE DÉFI'}
              </button>
            </div>
          );
        })()}

        {/* BOUTON VALIDER (Défis des milliers) */}
        {showValidateThousandsButton && (() => {
          const challengeIndex = ['challenge-thousands-1', 'challenge-thousands-2', 'challenge-thousands-3'].indexOf(phase as string);
          const challenge = THOUSANDS_CHALLENGES[challengeIndex];
          const targetNumber = challenge.targets[thousandsTargetIndex];
          const isCorrect = totalNumber === targetNumber;
          
          return (
            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <button
                onClick={handleValidateThousands}
                style={{
                  fontSize: 16,
                  padding: '10px 30px',
                  background: isCorrect
                    ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                    : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  boxShadow: isCorrect
                    ? '0 4px 8px rgba(34, 197, 94, 0.3)'
                    : '0 4px 8px rgba(249, 115, 22, 0.3)',
                  transition: 'all 0.2s ease',
                  animation: isCorrect ? 'celebration 0.6s ease-in-out infinite' : 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {isCorrect ? '✅ VALIDER LE DÉFI' : '🎯 VALIDER LE DÉFI'}
              </button>
            </div>
          );
        })()}

        {/* Boutons de phase (Débloquer / Commencer) */}
        {(showUnlockButton || showStartLearningButton) && (
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            {showStartLearningButton && (
              <button
                onClick={startLearningPhase}
                style={{
                  fontSize: 16,
                  padding: '10px 24px',
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 8px rgba(14, 165, 233, 0.3)',
                  transition: 'all 0.2s ease',
                  animation: 'pulse 2s ease-in-out infinite'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 12px rgba(14, 165, 233, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(14, 165, 233, 0.3)';
                }}
              >
                 Commencer l'apprentissage
              </button>
            )}
            {showUnlockButton && (
              <button
                onClick={unlockNextColumn}
                style={{
                  fontSize: 15,
                  padding: '8px 20px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease',
                  marginLeft: showStartLearningButton ? '12px' : '0',
                  boxShadow: '0 4px 8px rgba(139, 92, 246, 0.3)',
                  animation: 'pulse 2s ease-in-out infinite'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 12px rgba(139, 92, 246, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(139, 92, 246, 0.3)';
                }}
              >
                🔓 Débloquer la colonne suivante
              </button>
            )}
          </div>
        )}

        {/* Affichage du nombre total */}
        <div style={{
          marginTop: 20,
          padding: '12px',
          background: '#f1f5f9',
          borderRadius: 8,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#0ea5e9' }}>
            {totalNumber.toString().padStart(4, '0')}
          </div>
        </div>
      </div>

      {/* Assistant pédagogique */}
      <div style={{
        width: 280,
        minHeight: 240,
        borderRadius: 12,
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>

        {phase !== 'normal' && (
          <div style={{
            fontSize: 15,
            fontWeight: 'bold',
            color: '#fff',
            background: phase === 'done' ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' :
              (phase === 'learn-units' || phase === 'challenge-unit-1' || phase === 'challenge-unit-2' || phase === 'challenge-unit-3' || 
               phase === 'learn-carry' || phase === 'learn-tens' || phase === 'learn-tens-combination' || 
               phase === 'challenge-tens-1' || phase === 'challenge-tens-2' || phase === 'challenge-tens-3' ||
               phase === 'learn-hundreds' || phase === 'learn-hundreds-combination' ||
               phase === 'challenge-hundreds-1' || phase === 'challenge-hundreds-2' || phase === 'challenge-hundreds-3' ||
               phase === 'learn-thousands' || phase === 'learn-thousands-combination' ||
               phase === 'challenge-thousands-1' || phase === 'challenge-thousands-2' || phase === 'challenge-thousands-3' 
               ? 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)' :
                (phase === 'tutorial' ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)')),
            padding: '8px 12px',
            borderRadius: 20,
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
            animation: (phase === 'challenge-unit-1' || phase === 'challenge-unit-2' || phase === 'challenge-unit-3' || 
                       phase === 'challenge-tens-1' || phase === 'challenge-tens-2' || phase === 'challenge-tens-3' ||
                       phase === 'challenge-hundreds-1' || phase === 'challenge-hundreds-2' || phase === 'challenge-hundreds-3' ||
                       phase === 'challenge-thousands-1' || phase === 'challenge-thousands-2' || phase === 'challenge-thousands-3') ? 'pulse 2s ease-in-out infinite' : 'none'
          }}>
            {phase === 'done' ? ' Tutoriel Terminé !' :
              (phase === 'learn-units' || phase === 'challenge-unit-1' || phase === 'challenge-unit-2' || phase === 'challenge-unit-3' || 
               phase === 'learn-carry' || phase === 'learn-tens' || phase === 'learn-tens-combination' || 
               phase === 'challenge-tens-1' || phase === 'challenge-tens-2' || phase === 'challenge-tens-3' ||
               phase === 'learn-hundreds' || phase === 'learn-hundreds-combination' ||
               phase === 'challenge-hundreds-1' || phase === 'challenge-hundreds-2' || phase === 'challenge-hundreds-3' ||
               phase === 'learn-thousands' || phase === 'learn-thousands-combination' ||
               phase === 'challenge-thousands-1' || phase === 'challenge-thousands-2' || phase === 'challenge-thousands-3') ? '💡 Apprentissage en cours' :
                phase === 'tutorial' ? ' Découverte de la machine' : '📚 Exploration'}
          </div>
        )}

        {/* CARTE UNIQUE POUR TOUS LES TEXTES */}
        <div style={{
          fontSize: 15,
          minHeight: 120,
          color: '#1e293b',
          lineHeight: 1.6,
          background: 'linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%)',
          padding: 16,
          borderRadius: 12,
          border: '3px solid rgba(251, 191, 36, 0.3)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07), inset 0 2px 4px rgba(255, 255, 255, 0.9)',
          whiteSpace: 'pre-wrap',
          position: 'relative',
          overflow: 'hidden',
          animation: 'fadeIn 0.5s ease-in'
        }}>
          {/* Effet de brillance */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '40%',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)',
            pointerEvents: 'none'
          }}></div>

          {/* Curseur clignotant et animations */}
          <style>{`
            @keyframes blink {
              0%, 49% { opacity: 1; }
              50%, 100% { opacity: 0; }
            }
            @keyframes pulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.05); }
            }
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(-10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes celebration {
              0%, 100% { transform: rotate(0deg); }
              25% { transform: rotate(5deg); }
              75% { transform: rotate(-5deg); }
            }
          `}</style>

          <span style={{ position: 'relative', zIndex: 1 }}>
            {displayText}
            {isTyping && (
              <span style={{
                display: 'inline-block',
                width: 2,
                height: '1em',
                backgroundColor: '#f59e0b',
                marginLeft: 2,
                animation: 'blink 1s infinite',
                verticalAlign: 'text-bottom'
              }}></span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

export default MachineANombres;