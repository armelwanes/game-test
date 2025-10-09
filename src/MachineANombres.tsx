import { useState, useEffect, useCallback, useMemo, useRef } from "react";

// --- Types et Constantes ---
interface Column {
  name: string;
  value: number;
  unlocked: boolean;
}

// Phases du flux d'apprentissage
type Phase = 'tutorial' | 'explore-units' | 'click-add' | 'click-remove' | 'done' |
  'learn-units' | 'challenge-learn-unit' | 'learn-carry' | 'normal';

const COLUMN_NAMES = ["Unités", "Dizaines", "Centaines", "Milliers"];
const TYPING_SPEED = 18;
const MESSAGE_READ_DELAY = 3000;
// Vitesse de l'auto-incrémentation ralentie pour le commentaire
const COUNT_SPEED = 1800;
const FEEDBACK_DELAY = 1200;
const CHALLENGE_LEARN_GOAL = 9;

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
          const targetPhase = nextPhaseAfterAuto ?? 'challenge-learn-unit';

          if (targetPhase === 'challenge-learn-unit') {
            const resetCols = initialColumns.map((col, i) => i === 1 ? { ...col, unlocked: true } : col);
            setColumns(resetCols);
            setIsCountingAutomatically(false);
            setNextPhaseAfterAuto(null);

            setFeedback("Retour à zéro ! 🔄 Maintenant, affiche le nombre 9 avec les boutons !");

            // Lancement du défi manuel
            setTimeout(() => {
              setPhase('challenge-learn-unit');
              setFeedback(` DÉFI : Affiche le nombre **${CHALLENGE_LEARN_GOAL}** avec les boutons, puis clique sur VALIDER !`);
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
  }, [phase, isCountingAutomatically, columns, nextPhaseAfterAuto, sequenceFeedback]);


  // --- LOGIQUE AJOUTER (HANDLE ADD) ---
  const handleAdd = useCallback((idx: number) => {

  // Blocage du clic manuel pendant l'auto-comptage ou la transition vers le défi
  if (isCountingAutomatically || isTransitioningToChallenge) return;

    // Restrictions générales
    if (phase !== 'normal' && !isUnitsColumn(idx) && phase !== 'learn-carry' && phase !== 'challenge-learn-unit' && phase !== 'tutorial' && phase !== 'explore-units' && phase !== 'click-add') {
      setFeedback("Concentrons-nous sur la colonne des Unités pour l'instant. Clique uniquement sur les boutons VERT (△) ou ROUGE (∇) de cette colonne pour continuer la mission !");
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
          setPhase('challenge-learn-unit');
          setFeedback(`DÉFI : Affiche le nombre **${CHALLENGE_LEARN_GOAL}** avec les boutons, puis clique sur VALIDER !`);
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

    // D. challenge-learn-unit (surveillance du dépassement)
    else if (phase === 'challenge-learn-unit' && newCols[0].value > CHALLENGE_LEARN_GOAL) {
      setFeedback(`Oups ! Tu as dépassé ${CHALLENGE_LEARN_GOAL}. Utilise ∇ pour revenir à ${CHALLENGE_LEARN_GOAL} !`);
      setColumns(newCols);
    }

    // E. learn-carry
    else if (phase === 'learn-carry' && hasCarry) {
      sequenceFeedback("INCROYABLE ! 🎆 C'est de la MAGIE ! 10 billes sont devenues 1 bille dans la colonne suivante !",
        "C'est la RÈGLE D'OR : 10 billes = 1 bille dans la colonne de gauche !");

      // Marquer le défi des dizaines comme complété
      setCompletedChallenges(prev => ({ ...prev, tens: true }));

      // Transition vers le jeu libre ET déblocage automatique des centaines
      setTimeout(() => {
        setPhase('normal');
        // Débloquer automatiquement la colonne des centaines
        const newCols = [...columns];
        const hundredsIdx = 2;
        if (!newCols[hundredsIdx].unlocked) {
          newCols[hundredsIdx].unlocked = true;
          setColumns(newCols);
          setCompletedChallenges(prev => ({ ...prev, hundreds: true }));
        }
        sequenceFeedback("APPRENTISSAGE TERMINÉ ! Bravo ! 🎉 Tu peux maintenant utiliser librement les nombres !",
          "🔓 Les CENTAINES sont débloquées ! Utilise le bouton pour débloquer les MILLIERS !",
          FEEDBACK_DELAY / 1.5);
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

    // Restrictions des clics non Unités pendant le tutoriel
    if (phase !== 'normal' && !isUnitsColumn(idx) && phase !== 'challenge-learn-unit' && phase !== 'click-remove' && phase !== 'tutorial' && phase !== 'explore-units') {
      setFeedback("Concentrons-nous sur la colonne des Unités pour l'instant. Clique uniquement sur les boutons VERT (△) ou ROUGE (∇) de cette colonne pour continuer la mission !");
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

      if (phase !== 'click-remove' && phase !== 'tutorial' && phase !== 'explore-units' && phase !== 'challenge-learn-unit') {
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
          setPhase('challenge-learn-unit');
          setFeedback(`Bravo ! 🎉 Maintenant, DÉFI : Affiche le nombre **${CHALLENGE_LEARN_GOAL}** avec les boutons, puis clique sur VALIDER !`);
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


  // --- LOGIQUE BOUTON VALIDER DU DÉFI D'APPRENTISSAGE (9) ---
  const handleValidateLearning = useCallback(() => {
    if (phase === 'challenge-learn-unit') {
      if (columns[0].value === CHALLENGE_LEARN_GOAL) {
        setFeedback("DÉFI RÉUSSI ! Bravo ! 🎉 Prépare-toi pour l'échange magique !");

        // Transition vers la phase 'learn-carry'
        setTimeout(() => {
          setPhase('learn-carry');
          // Afficher un premier message, puis un rappel après un court délai
          sequenceFeedback(
            "Prêt pour la magie ? 🎩 Clique sur △ pour l'échange 10 pour 1 !",
            "Vas-y ! Clique sur △ pour voir la transformation !"
          );
        }, FEEDBACK_DELAY);
      } else {
        setFeedback(`Pas encore ! Il faut ${CHALLENGE_LEARN_GOAL}. Utilise △ et ∇ !`);
      }
    }
  }, [phase, columns, sequenceFeedback]);


  // --- LOGIQUE DÉMARRAGE APPRENTISSAGE (post-tutoriel) ---
  const startLearningPhase = useCallback(() => {
    if (phase === 'done') {
      // S'assurer que le compteur est à zéro au démarrage
      const newCols = initialColumns.map((col, i) => i === 1 ? { ...col, unlocked: true } : col);
      setColumns(newCols);

  setNextPhaseAfterAuto('challenge-learn-unit');
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
      newCols[nextIdx].unlocked = true;
      setColumns(newCols);

      // Générer un message d'explication adapté au niveau
      if (nextIdx === 1 && !completedChallenges.tens) {
        setFeedback("⚠️ Tu dois d'abord compléter le défi des dizaines !");
        return;
      } else if (nextIdx === 2) {
        // Pas besoin de vérifier tens car déjà débloqué automatiquement après learn-carry
        setCompletedChallenges(prev => ({ ...prev, hundreds: true }));
        sequenceFeedback(
          "NIVEAU DÉBLOQUÉ : Les CENTAINES ! 💯",
          `Les CENTAINES : 100, 200, 300... Crée des grands nombres jusqu'à 999 ! 🚀`
        );
      } else if (nextIdx === 3) {
        if (!completedChallenges.hundreds) {
          setFeedback("⚠️ Tu dois d'abord maîtriser les centaines !");
          newCols[nextIdx].unlocked = false;
          setColumns(newCols);
          return;
        }
        setCompletedChallenges(prev => ({ ...prev, thousands: true }));
        sequenceFeedback(
          "NIVEAU MAXIMUM : Les MILLIERS ! 🎉",
          `Les MILLIERS : 1000, 2000, 3000... Crée des nombres géants jusqu'à 9999 !`
        );
      } else {
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
      case 'challenge-learn-unit':
        return `DÉFI : Affiche le nombre **${CHALLENGE_LEARN_GOAL}** puis clique sur VALIDER !`;
      case 'learn-carry':
        return "C'est le grand moment ! 🎆 Clique sur △ pour voir la transformation !";
      case 'normal':
        return "Mode exploration ! 🚀 Construis des grands nombres !";
      default:
        return "Prépare-toi pour l'aventure des nombres !";
    }
  }, [phase]);

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
    // On veut démarrer le comptage auto uniquement après la phase 'learn-units',
    // lorsque toutes les animations de texte sont terminées
    if (
      phase === 'learn-units' &&
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
  const showValidateLearningButton = phase === 'challenge-learn-unit';

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
              else if ((phase === 'tutorial' || phase === 'explore-units' || phase === 'click-add' || phase === 'click-remove' || phase === 'challenge-learn-unit') && isUnit) {
                isInteractive = true;
              }
              else if (phase === 'learn-carry' && isUnit) {
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
        {showValidateLearningButton && (
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <button
              onClick={handleValidateLearning}
              style={{
                fontSize: 16,
                padding: '10px 30px',
                background: columns[0].value === CHALLENGE_LEARN_GOAL
                  ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                  : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: columns[0].value === CHALLENGE_LEARN_GOAL
                  ? '0 4px 8px rgba(34, 197, 94, 0.3)'
                  : '0 4px 8px rgba(249, 115, 22, 0.3)',
                transition: 'all 0.2s ease',
                animation: columns[0].value === CHALLENGE_LEARN_GOAL ? 'celebration 0.6s ease-in-out infinite' : 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {columns[0].value === CHALLENGE_LEARN_GOAL ? ' VALIDER LE DÉFI ' : '🎯 VALIDER LE DÉFI'}
            </button>
          </div>
        )}

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
              (phase === 'learn-units' || phase === 'challenge-learn-unit' || phase === 'learn-carry' ? 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)' :
                (phase === 'tutorial' ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)')),
            padding: '8px 12px',
            borderRadius: 20,
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
            animation: phase === 'challenge-learn-unit' ? 'pulse 2s ease-in-out infinite' : 'none'
          }}>
            {phase === 'done' ? ' Tutoriel Terminé !' :
              (phase === 'learn-units' || phase === 'challenge-learn-unit' || phase === 'learn-carry') ? '💡 Apprentissage en cours' :
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