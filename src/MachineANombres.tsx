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
const CHALLENGE_LEARN_GOAL = 5;

const initialColumns: Column[] = COLUMN_NAMES.map((name, idx) => ({
  name,
  value: 0,
  unlocked: idx === 0
}));

function MachineANombres() {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [phase, setPhase] = useState<Phase>('tutorial');
  // addClicks sert maintenant à suivre la progression dans explore-units
  const [addClicks, setAddClicks] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [typedInstruction, setTypedInstruction] = useState("");
  const [typedFeedback, setTypedFeedback] = useState("");
  const [isTypingInstruction, setIsTypingInstruction] = useState(false);
  const [isTypingFeedback, setIsTypingFeedback] = useState(false);

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

          let infoMessage = `Le nombre **${nextValue}** : ${nextValue} bille${nextValue > 1 ? 's' : ''}.`;

          if (nextValue === 0) {
            infoMessage = "**ZÉRO** (0) : aucune bille, aucun doigt levé. C'est le début du comptage, le point de départ de ton aventure !  Continue à regarder la machine et dis 'zéro' à voix haute !";
          } else if (nextValue === 1) {
            infoMessage += " UN seul bille, UN seul doigt levé ! C'est le début de tout ! 👆 Continue à regarder la colonne et prépare-toi à annoncer 'deux' quand la prochaine bille arrive !";
          } else if (nextValue === 2) {
            infoMessage += " DEUX billes, DEUX doigts levés ! Comme une paire ! ✌️ Reste attentif et annonce 'trois' dès que la prochaine bille s'allume !";
          } else if (nextValue === 3) {
            infoMessage += " TROIS billes, TROIS doigts. Tu connais déjà bien ce nombre maintenant ! 🎈 Garde les yeux sur la colonne et prépare-toi à dire 'quatre' quand la suivante arrive !";
          } else if (nextValue === 4) {
            infoMessage += " QUATRE billes, QUATRE doigts levés. Comme les quatre saisons ! Reste concentré et annonce 'cinq' quand tu vois la prochaine bille !";
          } else if (nextValue === 5) {
            infoMessage += " C'est **CINQ**, tous les doigts d'une main ! C'est la moitié de dix ! ✋ Continue à compter avec moi et prépare-toi à dire 'six' à voix haute !";
          } else if (nextValue === 6) {
            infoMessage += " SIX billes, SIX doigts (une main + un doigt). Tu grandis bien ! Garde ton attention sur la colonne et annonce 'sept' dès que la bille suivante apparaît !";
          } else if (nextValue === 7) {
            infoMessage += " SEPT billes, SEPT doigts (une main + deux doigts). On se rapproche de dix ! Prépare-toi à dire 'huit' quand la magie continue !";
          } else if (nextValue === 8) {
            infoMessage += " HUIT billes, HUIT doigts (une main + trois doigts). Encore un peu ! Reste concentré et annonce 'neuf' quand tu vois la prochaine bille !";
          } else if (nextValue === 9) {
            infoMessage = "**Attention champion !** 🎯 Le nombre **NEUF** (9). La colonne est presque pleine ! C'est comme si on avait levé **tous nos doigts sauf un** ! Plus qu'un seul espace libre ! Prépare-toi à découvrir ce qui se passe quand la colonne est remplie !";
          }

          setFeedback(infoMessage);

        }, speed);

      }

      // PARTIE B: ARRÊT À NEUF (9) et RESET
      else if (unitsValue === 9) {
        // 1. Annonce l'arrêt et l'état "plein"
        setFeedback("STOP ! 🛑 Le compteur est à 9. La colonne des Unités est **PLEINE** à craquer ! Elle ne peut plus accepter de nouvelles billes ! Attends quelques instants sans cliquer, la machine va te montrer une astuce magique !");

        // 2. Reset et Transition
        timer = setTimeout(() => {
          const targetPhase = nextPhaseAfterAuto ?? 'challenge-learn-unit';

          if (targetPhase === 'challenge-learn-unit') {
            const resetCols = initialColumns.map((col, i) => i === 1 ? { ...col, unlocked: true } : col);
            setColumns(resetCols);
            setIsCountingAutomatically(false);
            setNextPhaseAfterAuto(null);

            setFeedback("Retour à zéro ! 🔄 La colonne des Unités est vide maintenant, mais celle des Dizaines est prête à accueillir ses premières billes ! Prépare ton doigt sur le bouton VERT (△) pour remplir la nouvelle colonne !");

            // Lancement du défi manuel
            setTimeout(() => {
              setPhase('challenge-learn-unit');
              setFeedback(` DÉFI POUR TOI ! Utilise les boutons VERT et ROUGE pour afficher à nouveau le nombre **${CHALLENGE_LEARN_GOAL}** dans les Unités. Tu es capable !`);
            }, FEEDBACK_DELAY);
          } else {
            setColumns(initialColumns.map(col => ({ ...col })));
            setIsCountingAutomatically(false);
            setNextPhaseAfterAuto(null);
            setAddClicks(0);
            setPhase(targetPhase);
            sequenceFeedback(
              "Spectacle terminé ! La machine a compté toute seule de 1 à 9 pour te montrer comment ça marche.",
              "À toi maintenant ! Clique sur le bouton VERT (△) pour recommencer depuis ZÉRO et créer les nombres avec tes propres doigts !"
            );
          }

        }, COUNT_SPEED * 3);

      }
    }

    return () => clearTimeout(timer);
  }, [phase, isCountingAutomatically, columns, nextPhaseAfterAuto, sequenceFeedback]);


  // --- LOGIQUE AJOUTER (HANDLE ADD) ---
  const handleAdd = useCallback((idx: number) => {

    // Blocage du clic manuel pendant l'auto-comptage
    if (isCountingAutomatically) return;

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
        sequenceFeedback("Bravo champion !   Tu as cliqué sur le bouton VERT ! Regarde : un joli rond bleu est apparu comme par magie !",
          "Ce petit rond bleu, c'est comme une bille que tu ajoutes dans ta tirelire. Clique encore sur △ pour ajouter une nouvelle bille lumineuse !");
      } else if (unitsValue === 2) {
        sequenceFeedback("Super champion !  Tu continues à découvrir la machine ! Maintenant il y a DEUX ronds bleus qui brillent !",
          "Deux belles billes bleues ! La machine se remplit petit à petit. Continue à cliquer sur △ pour voir la suite !");
      } else if (unitsValue === 3) {
        sequenceFeedback("Magnifique !  Maintenant, essaie le bouton ROUGE (∇) pour découvrir son pouvoir magique. Clique dessus !",
          "Le bouton ROUGE a un pouvoir spécial : il fait l'inverse du VERT ! Essaie-le vite pour découvrir sa magie !");
      } else if (unitsValue > 3) {
        // Limiter à 3 dans le tutoriel
        newCols[0].value = 3;
        setFeedback("Doucement petit explorateur !  Maintenant, clique sur le bouton ROUGE (∇) pour découvrir son pouvoir magique !");
        setColumns(newCols);
        return;
      }
      setColumns(newCols);
    }

    // B. explore-units (Introduction et Répétition de UN, DEUX, TROIS)
    else if (phase === 'explore-units') {
      const unitsValue = newCols[0].value;

      if (unitsValue === 1) {
        sequenceFeedback("HOURRA !  **Dis à haute voix : UN !** Tu viens de passer de ZÉRO à UN. Lève UN doigt et regarde la bille ! 👆",
          `UN c'est une seule chose : un bonbon, une bille, un sourire ! Clique sur le bouton VERT (△) pour continuer !`);
      } else if (unitsValue === 2) {
        sequenceFeedback("Fantastique !  **Dis à haute voix : DEUX !** Tu as maintenant DEUX billes, lève DEUX doigts ! ✌️",
          `DEUX, c'est une paire, comme tes deux chaussures ! Clique sur le bouton VERT (△) pour continuer !`);
      } else if (unitsValue === 3) {
        sequenceFeedback("Merveilleux !  **Dis à haute voix : TROIS !** Trois billes, trois doigts levés !",
          `Comme les trois petits cochons ! Clique sur le bouton VERT (△) pour continuer !`);

        // Transition vers la phase de pratique
        setTimeout(() => {
          setPhase('click-add');
          setFeedback("Bravo petit génie !  Continuons l'aventure avec **QUATRE**, **CINQ** et **SIX**. Clique sur le bouton VERT (△) pour continuer à ajouter des billes et devenir un champion des nombres !");
        }, FEEDBACK_DELAY * 1.5);
      } else if (unitsValue > 3) {
        newCols[0].value = 3;
        setFeedback("Doucement explorateur !  On a bien appris UN, DEUX, TROIS. Reste attentif et clique sur le bouton VERT (△) quand je te dis de continuer la suite de l'aventure !");
        setColumns(newCols);
        return;
      }
      setColumns(newCols);

    }

    // C. click-add (Pratique de 4, 5, 6 - Total de 6)
    else if (phase === 'click-add') {
      const nextClick = addClicks + 1;

      // Blocage si l'on dépasse le nombre de clics requis (total = 6)
      if (newCols[idx].value > 6) {
        newCols[idx].value = 6;
        setFeedback("Parfait champion !  Tu as atteint **6** billes (SIX) ! C'est une main entière plus un doigt ! Pose ton doigt sur le bouton ROUGE (∇) : on va apprendre à retirer les billes une par une !");
        setColumns(newCols);

        // Transition immédiate vers click-remove
        setTimeout(() => {
          setPhase('click-remove');
          setFeedback("Super travail !  Clique maintenant sur le bouton ROUGE (∇) pour enlever les billes une par une, comme si tu les remettais dans le sac, jusqu'à revenir à **ZÉRO** (plus rien) !");
        }, FEEDBACK_DELAY);
        return;
      }

      setAddClicks(nextClick);

      if (newCols[idx].value === 6) {
        setFeedback("Magnifique !  Tu as atteint **6** billes. C'est six doigts levés : une main entière (5 doigts) plus un doigt de l'autre main ! Clique encore sur le bouton VERT (△) si tu veux revoir ce nombre ou attends mon signal pour passer à la suite !");
      } else if (newCols[idx].value === 4) {
        setFeedback(`**QUATRE** !  Le nombre **${newCols[idx].value}**. Comme les quatre pattes d'un chat ! Clique encore sur le bouton VERT (△) pour ajouter une nouvelle bille !`);
      } else if (newCols[idx].value === 5) {
        setFeedback(`**CINQ** ! ✋ Tous les doigts d'une main levés ! C'est magique ! Continue en cliquant sur le bouton VERT (△) pour voir le nombre suivant !`);
      } else {
        setFeedback(`Le nombre est maintenant **${newCols[idx].value}**. 🎈 Appuie à nouveau sur le bouton VERT (△) pour continuer à grandir le nombre !`);
      }
      // Rappel synthétique après un court délai
      setTimeout(() => setFeedback(`Tu as maintenant ${newCols[idx].value} billes. **${newCols[idx].value} doigts** levés. Continue ton aventure en appuyant encore sur le bouton VERT (△) !`), FEEDBACK_DELAY);
      setColumns(newCols);

    }

    // D. challenge-learn-unit (surveillance du dépassement)
    else if (phase === 'challenge-learn-unit' && newCols[0].value > CHALLENGE_LEARN_GOAL) {
      setFeedback(`Oups petit champion !  Tu as dépassé ${CHALLENGE_LEARN_GOAL}. Utilise le bouton ROUGE pour revenir pile sur ${CHALLENGE_LEARN_GOAL} !`);
      setColumns(newCols);
    }

    // E. learn-carry
    else if (phase === 'learn-carry' && hasCarry) {
      sequenceFeedback("INCROYABLE ! 🎆  C'est de la MAGIE ! Dix billes dans la colonne des Unités se sont transformées en une seule bille dans la colonne des Dizaines !",
        "C'est la RÈGLE D'OR du système décimal : 10 petites billes dans une colonne deviennent 1 grosse bille dans la colonne suivante. C'est comme échanger 10 pièces de 1 centime contre 1 pièce de 10 centimes !");

      // Marquer le défi des dizaines comme complété
      setCompletedChallenges(prev => ({ ...prev, tens: true }));

      // Transition vers le jeu libre
      setTimeout(() => {
        setPhase('normal');
        sequenceFeedback(" APPRENTISSAGE TERMINÉ ! Bravo champion !  Tu peux maintenant utiliser les Unités et les Dizaines librement pour créer tous les nombres que tu veux !",
          "🔓 Utilise le bouton 'Débloquer la colonne suivante' pour continuer ta grande aventure et découvrir les CENTAINES (100, 200, 300...) ! Des nombres encore PLUS GRANDS t'attendent !",
          FEEDBACK_DELAY / 1.5);
      }, FEEDBACK_DELAY * 2);
      setColumns(newCols);
    }

    // F. Feedback en mode normal
    else if (phase === 'normal' && hasCarry) {
      setFeedback(" Échange magique ! 10 billes sont passées dans la colonne de gauche et se sont transformées en 1 ! Le système décimal est vraiment magique ! 🎩 Continue à cliquer pour voir d'autres transformations !");
      setColumns(newCols);
    }

    // Mise à jour de l'état si l'on est dans un cas général
    else {
      setColumns(newCols);
      if (phase === 'normal' || phase === 'done' || phase === 'learn-units') {
        setFeedback(`🎈 Il y a maintenant ${newCols[idx].value} bille${newCols[idx].value > 1 ? 's' : ''} dans la colonne ${newCols[idx].name}. Clique sur le bouton VERT (△) pour en ajouter d'autres ou sur le ROUGE (∇) pour en retirer !`);
      }
    }


  }, [columns, phase, addClicks, isUnitsColumn, totalNumber, isCountingAutomatically, sequenceFeedback]);


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
        "C'est **ZÉRO** (0) ! 🎯 Il n'y a plus rien du tout. On ne peut pas descendre plus bas que ZÉRO. C'est le plus petit nombre !",
        "ZÉRO signifie qu'il n'y a aucune bille, aucune quantité. C'est le début et la fin du comptage !"
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
        setFeedback(`🎈 Il y a maintenant ${newCols[idx].value} bille${newCols[idx].value > 1 ? 's' : ''} dans la colonne ${newCols[idx].name}. Choisis : clique sur le bouton VERT (△) pour ajouter ou sur le ROUGE (∇) pour en retirer encore !`);
      }
    }


    // --- LOGIQUE DE PROGRESSION ---

    // A. tutorial (Découverte du bouton rouge)
    if (phase === 'tutorial') {
      const unitsValue = newCols[0].value;

      if (unitsValue === 2) {
        sequenceFeedback(
          "Génial !  🎈 Le bouton ROUGE enlève une bille bleue ! Regarde : il en reste deux maintenant au lieu de trois !",
          "Le bouton VERT ajoute des billes, le bouton ROUGE les enlève. C'est comme remplir et vider un seau ! Facile, non ? Clique encore sur le bouton ROUGE (∇) pour continuer l'expérience !"
        );
      } else if (unitsValue === 1) {
        sequenceFeedback(
          "Bravo petit champion !  Clique encore sur le bouton ROUGE pour tout enlever et voir la magie du ZÉRO !",
          "Plus qu'une seule bille bleue ! Un dernier clic et tu découvriras un secret..."
        );
      } else if (unitsValue === 0 && tempTotalBefore === 1) {
        sequenceFeedback(
          "Extraordinaire !   Tu maîtrises parfaitement les deux boutons ! Toutes les billes ont disparu. Maintenant, je vais t'apprendre quelque chose de SUPER important : les **NOMBRES** !",
          "Tu es prêt pour une grande aventure ! Les nombres vont t'aider à compter TOUT ce que tu veux ! Prépare ton doigt pour le bouton VERT (△) quand je te dirai de recommencer !"
        );

            // Transition vers un comptage automatique d'introduction avant l'exploration libre
            setTimeout(() => {
                setColumns(initialColumns.map(col => ({ ...col })));
                setNextPhaseAfterAuto('explore-units');
                setPhase('learn-units');
                setIsCountingAutomatically(true);
                sequenceFeedback(
                  "Bienvenue dans le monde des NOMBRES ! 👋 ✨ Un nombre, c'est comme une recette magique qui nous dit COMBIEN il y a de quelque chose. Regarde ta machine : elle est vide, tu as **zéro bille**. C'est-à-dire... RIEN du tout !",
                  "Observe sans toucher : la machine va compter toute seule de 1 à 9 pour te montrer comment les nombres grandissent. Après le spectacle, ce sera à toi de jouer !"
                );
            }, FEEDBACK_DELAY * 2);
      } else if (unitsValue > 0) {
        sequenceFeedback(
          `Bien joué !  Continue à cliquer sur le bouton ROUGE pour enlever les billes bleues une par une, comme si tu les retirais de ton sac !`,
          "Le bouton ROUGE retire une bille à chaque fois que tu cliques. C'est toi le chef de la machine !"
        );
      }
    }

    // B. explore-units : si on soustrait trop tôt
    else if (phase === 'explore-units' && newCols[0].value < columns[0].value) {
      setFeedback("On n'enlève pas encore, on est en train de découvrir l'ajout ! Clique sur le bouton VERT (△) pour continuer à faire apparaître les nouvelles billes !");
    }

    // C. click-remove (La soustraction et le retour à Zéro avec les doigts)
    if (phase === 'click-remove' && isUnitsColumn(idx)) {
      const unitsValue = newCols[0].value;

      if (unitsValue === 5) {
        sequenceFeedback(
          `Le nombre est maintenant **${unitsValue}** (CINQ) ! ✋ Une main entière de doigts levés !`,
          `Bien joué !  Tu as retiré une bille. Continue à enlever une par une en cliquant sur le bouton ROUGE (∇), comme si tu rangeais tes jouets !`
        );
      } else if (unitsValue === 3) {
        sequenceFeedback(
          `Le nombre est maintenant **${unitsValue}** (TROIS) ! 🎈 Tu te souviens ? Trois petits cochons !`,
          `Génial ! Continue à descendre vers ZÉRO en cliquant sur le bouton ROUGE (∇) ! Chaque bille que tu retires rend le nombre plus petit !`
        );
      } else if (unitsValue === 2) {
        sequenceFeedback(
          `Le nombre est maintenant **${unitsValue}** (DEUX) ! ✌️ Deux doigts levés, comme le signe de la victoire !`,
          `Super ! Encore un peu et on arrive à ZÉRO ! Tu y es presque ! Clique encore sur le bouton ROUGE (∇) !`
        );
      } else if (unitsValue === 1) {
        sequenceFeedback(
          `Le nombre est maintenant **${unitsValue}** (UN) ! 👆 Un seul doigt levé !`,
          `Presque à ZÉRO ! Un dernier petit clic et tu découvriras le retour au début !`
        );
      } else if (unitsValue === 0 && tempTotalBefore === 1) {
        sequenceFeedback(
          "**ZÉRO** (0) !  Plus rien du tout ! Aucune bille, aucun doigt levé ! On est revenu au début !",
          "Fantastique champion !  ⭐ Le compteur est revenu à **ZÉRO (0)** ! Tu comprends maintenant ce que veut dire compter en avant et compter en arrière ! C'est comme monter et descendre les escaliers !"
        );

        // Transition vers la phase 'done'
        setTimeout(() => {
          setPhase('done');
          setFeedback("Félicitations petit génie !  🏅 Tu maîtrises les nombres de 0 à 6 ! Clique sur 'Commencer l'apprentissage' pour découvrir le SECRET MAGIQUE de l'échange 10 pour 1 ! C'est une règle extraordinaire !");
        }, FEEDBACK_DELAY);
      } else if (unitsValue > 0) {
        sequenceFeedback(
          `Le nombre est maintenant **${unitsValue}** !  Baisse un doigt et clique sur ROUGE !`,
          `Bien joué ! Tu as retiré une bille. Il te reste **${unitsValue} doigts levés**. Continue en cliquant sur le bouton ROUGE (∇) jusqu'à revenir à ZÉRO !`
        );
      }
    }

    // D. Feedback sur l'emprunt en mode normal
    if (phase === 'normal' && hasBorrow) {
      setFeedback("🔄 Emprunt magique ! Nous avons dû emprunter à la colonne de gauche et laisser 9 ici. C'est le principe de la soustraction dans le système décimal ! Intelligent, non ? Continue ta soustraction en cliquant encore sur le bouton ROUGE (∇) si nécessaire !");
    }
  }, [columns, phase, isUnitsColumn, totalNumber, isCountingAutomatically, sequenceFeedback]);


  // --- LOGIQUE BOUTON VALIDER DU DÉFI D'APPRENTISSAGE (5) ---
  const handleValidateLearning = useCallback(() => {
    if (phase === 'challenge-learn-unit') {
      if (columns[0].value === CHALLENGE_LEARN_GOAL) {
        setFeedback(" DÉFI RÉUSSI ! Bravo champion !  Tu as parfaitement compris les unités. Reste prêt à cliquer sur le bouton VERT (△) pour déclencher le MOMENT MAGIQUE de l'échange !");

        // Transition vers la phase 'learn-carry'
        setTimeout(() => {
          setPhase('learn-carry');
          // Afficher un premier message, puis un rappel après un court délai
          sequenceFeedback(
            "Prêt pour la magie ? 🎩 Clique sur le bouton VERT (△) pour faire le dernier pas et forcer la machine à faire son tour de magie : l'échange 10 pour 1 !",
            "Vas-y champion ! Clique sur △ pour voir la transformation magique : 10 petites billes deviennent 1 grosse bille !"
          );
        }, FEEDBACK_DELAY);
      } else {
        setFeedback(`Pas encore !  Il faut afficher exactement ${CHALLENGE_LEARN_GOAL} dans les unités. Utilise les deux boutons (VERT et ROUGE) pour y arriver !`);
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
  setIsCountingAutomatically(true); // DÉCLENCHEMENT DE L'AUTO-COMPTAGE

      sequenceFeedback(
        "C'est parti pour l'aventure !  Regarde bien la machine compter de 1 à 9 et écoute les commentaires magiques...",
        "Observe bien le nombre de billes qui s'allument à chaque unité. Garde tes mains tranquilles et compte avec tes yeux et tes doigts comme si tu suivais un spectacle de lumières !"
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
        setFeedback("⚠️ Attention ! Tu dois d'abord compléter le défi des dizaines avant de débloquer ce niveau. Retourne cliquer sur les boutons VERT (△) et ROUGE (∇) de la colonne des Unités pour réussir le défi !");
        return;
      } else if (nextIdx === 2) {
        if (!completedChallenges.tens) {
          setFeedback("⚠️ Attention ! Tu dois d'abord maîtriser les dizaines avant de découvrir les centaines. Reviens compléter le défi des dizaines en utilisant les boutons VERT (△) et ROUGE (∇) avant de réessayer !");
          newCols[nextIdx].unlocked = false;
          setColumns(newCols);
          return;
        }
        setCompletedChallenges(prev => ({ ...prev, hundreds: true }));
        sequenceFeedback(
          ` NIVEAU DÉBLOQUÉ : Les CENTAINES ! 💯 Bienvenue dans le monde des GRANDS nombres !`,
          `Les CENTAINES, ce sont des nombres comme 100, 200, 300... Imagine : 100 c'est comme avoir 10 paquets de 10 bonbons ! C'est BEAUCOUP ! Utilise les boutons pour construire ces grands nombres jusqu'à 999 ! 🚀`
        );
      } else if (nextIdx === 3) {
        if (!completedChallenges.hundreds) {
          setFeedback("⚠️ Attention ! Tu dois d'abord maîtriser les centaines avant de découvrir les milliers. Continue à t'entraîner avec les boutons VERT (△) et ROUGE (∇) sur les colonnes déjà débloquées avant de revenir !");
          newCols[nextIdx].unlocked = false;
          setColumns(newCols);
          return;
        }
        setCompletedChallenges(prev => ({ ...prev, thousands: true }));
        sequenceFeedback(
          ` NIVEAU MAXIMUM DÉBLOQUÉ : Les MILLIERS !  Tu es maintenant un MAÎTRE des nombres !`,
          `Les MILLIERS, ce sont des nombres GIGANTESQUES comme 1000, 2000, 3000... Imagine : 1000 c'est comme avoir 10 paquets de 100 bonbons ! C'est ÉNORME ! Amuse-toi à cliquer sur les boutons pour fabriquer ces nombres géants jusqu'à 9999 ! `
        );
      } else {
        setFeedback(`🔓 Colonne ${newCols[nextIdx].name} débloquée ! Maintenant, tu peux créer des nombres jusqu'à ${Math.pow(10, nextIdx + 1) - 1}. Clique sur les boutons VERT (△) et ROUGE (∇) pour expérimenter et t'amuser !`);
      }
    }
  }, [columns, completedChallenges, sequenceFeedback]);


  // --- Instructions par phase (Typing Effect) ---
  const instruction = useMemo(() => {
    switch (phase) {
      case 'tutorial':
        return " Bienvenue petit explorateur ! Clique sur le bouton VERT (△) pour découvrir comment fonctionne cette machine magique. Essaie plusieurs fois pour voir ce qui se passe !";
      case 'explore-units':
        return " Clique sur le bouton VERT (△) pour ajouter une bille. Lève **UN doigt** à chaque clic. **Répète à haute voix** : ZÉRO (rien), puis UN, DEUX, TROIS !";
      case 'click-add':
        return "Pratique maintenant ! 🎯 Continue à cliquer jusqu'à **SIX** (six doigts levés). Chaque clic ajoute **UNE** bille de plus dans ta machine !";
      case 'click-remove':
        return "Très bien champion !  Clique maintenant sur le bouton ROUGE (∇) pour enlever les billes une par une. Baisse **UN doigt** à chaque fois jusqu'à revenir à **ZÉRO** (plus rien).";
      case 'done':
        return " Génial ! Tu es un champion ! Clique sur **'Commencer l'apprentissage'** pour découvrir la **RÈGLE D'OR du système décimal : l'échange magique 10 pour 1** ! 🎩";
      case 'learn-units':
        return "Regarde bien ! 👀 La machine va compter toute seule de 1 à 9. Observe comment chaque nombre représente une quantité. Tu peux compter avec tes doigts !";
      case 'challenge-learn-unit':
        return ` DÉFI DES UNITÉS : Utilise les boutons pour afficher exactement le nombre **${CHALLENGE_LEARN_GOAL}** dans les unités, puis clique sur **VALIDER** !`;
      case 'learn-carry':
        return "C'est le grand moment ! 🎆 Clique sur △ pour faire le dernier pas et observer la transformation magique de l'échange !";
      case 'normal':
        return "Mode exploration ! 🚀 Construis de grands nombres et observe comment la machine fait ses échanges magiques. Tu es maintenant un expert !";
      default:
        return "Prépare-toi pour une grande aventure dans le monde des nombres ! ";
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