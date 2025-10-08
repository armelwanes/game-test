import { useState, useEffect, useCallback, useMemo } from "react";

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
// Vitesse de l'auto-incrémentation ralentie pour le commentaire
const COUNT_SPEED = 1800; 
const FEEDBACK_DELAY = 1200;
const CHALLENGE_LEARN_GOAL = 5; 
const CHALLENGE_LEARN_GOAL_STRING = CHALLENGE_LEARN_GOAL.toString();

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
  const [feedback, setFeedback] = useState("Bienvenue dans la Machine à Nombres ! 👋 Avant d'apprendre ce qu'est un nombre, je vais te montrer comment utiliser cette machine.");
  const [typedText, setTypedText] = useState("");
  
  // État pour l'auto-incrémentation
  const [isCountingAutomatically, setIsCountingAutomatically] = useState(false);

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

  // Contrôle l'apparition du feedback après l'instruction (pour éviter l'affichage simultané)
  const [showFeedbackInCombined, setShowFeedbackInCombined] = useState(false);

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
          
          let infoMessage = `Le nombre **${nextValue}** : ${nextValue} jeton${nextValue > 1 ? 's' : ''}.`;

          if (nextValue === 0) {
              infoMessage = "**ZÉRO** (0) : aucun jeton, aucun doigt levé. C'est le début du comptage !";
          } else if (nextValue === 1) {
              infoMessage += " UN seul jeton, UN seul doigt levé ! 👆";
          } else if (nextValue === 2) {
              infoMessage += " DEUX jetons, DEUX doigts levés ! ✌️";
          } else if (nextValue === 3) {
              infoMessage += " TROIS jetons, TROIS doigts. Tu connais déjà ce nombre !";
          } else if (nextValue === 4) {
              infoMessage += " QUATRE jetons, QUATRE doigts levés.";
          } else if (nextValue === 5) {
              infoMessage += " C'est **CINQ**, tous les doigts d'une main ! ✋";
          } else if (nextValue === 6) {
              infoMessage += " SIX jetons, SIX doigts (une main + un doigt).";
          } else if (nextValue === 7) {
              infoMessage += " SEPT jetons, SEPT doigts (une main + deux doigts).";
          } else if (nextValue === 8) {
              infoMessage += " HUIT jetons, HUIT doigts (une main + trois doigts).";
          } else if (nextValue === 9) {
              infoMessage = "**Attention !** Le nombre **NEUF** (9). La colonne est presque pleine ! C'est comme si on avait levé **tous nos doigts sauf un** !";
          }

          setFeedback(infoMessage);

        }, speed);

      } 
      
      // PARTIE B: ARRÊT À NEUF (9) et RESET
      else if (unitsValue === 9) {
        // 1. Annonce l'arrêt et l'état "plein"
        setFeedback("STOP ! Le compteur est à 9. La colonne des Unités est **PLEINE** ! Elle ne peut plus rien accepter !");
        
        // 2. Reset et Transition
        timer = setTimeout(() => {
            // Remet à zéro (en gardant la dizaine débloquée)
            const resetCols = initialColumns.map((col, i) => i === 1 ? { ...col, unlocked: true } : col);
            setColumns(resetCols); 

            setFeedback("Retour à zéro. La colonne des Unités est vide, mais celle des Dizaines est prête !");
            setIsCountingAutomatically(false); 
            
            // Lancement du défi manuel
            setTimeout(() => {
                setPhase('challenge-learn-unit');
                setFeedback(`DÉFI : Utilise les boutons pour afficher à nouveau le chiffre **${CHALLENGE_LEARN_GOAL}** aux Unités.`);
            }, FEEDBACK_DELAY);

        }, COUNT_SPEED * 3); 

      }
    }

    return () => clearTimeout(timer);
  }, [phase, isCountingAutomatically, columns]);


  // --- LOGIQUE AJOUTER (HANDLE ADD) ---
  const handleAdd = useCallback((idx: number) => {
    
    // Blocage du clic manuel pendant l'auto-comptage
    if (isCountingAutomatically) return; 

    // Restrictions générales
    if (phase !== 'normal' && !isUnitsColumn(idx) && phase !== 'learn-carry' && phase !== 'challenge-learn-unit' && phase !== 'tutorial' && phase !== 'explore-units' && phase !== 'click-add') {
      setFeedback("Concentrons-nous sur la colonne des Unités pour l'instant.");
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
      sequenceFeedback("Bien joué ! 👍 Tu as cliqué sur le bouton VERT ! Un petit point bleu est apparu. C'est comme ça qu'on ajoute des points à la machine.",
               "Tu vois le petit rond bleu ? Chaque fois que tu cliques sur △, un rond s'allume !");
        } else if (unitsValue === 2) {
      sequenceFeedback("Excellent ! 🎉 Tu as cliqué encore une fois ! Maintenant il y a deux ronds bleus. Tu commences à comprendre comment la machine fonctionne !",
               "Deux ronds bleus maintenant ! Continue à cliquer sur △ pour voir ce qui se passe.");
        } else if (unitsValue === 3) {
      sequenceFeedback("Parfait ! 🌟 Maintenant, essaie le bouton ROUGE (∇) pour voir ce qu'il fait. Clique sur le bouton ROUGE !",
               "Le bouton ROUGE fait l'inverse du VERT. Essaie-le pour découvrir son effet !");
        } else if (unitsValue > 3) {
            // Limiter à 3 dans le tutoriel
            newCols[0].value = 3;
            setFeedback("Stop ! Maintenant, clique sur le bouton ROUGE (∇) pour découvrir son effet !");
            setColumns(newCols);
            return;
        }
        setColumns(newCols);
    }

    // B. explore-units (Introduction et Répétition de UN, DEUX, TROIS)
    else if (phase === 'explore-units') {
        const unitsValue = newCols[0].value;

     if (unitsValue === 1) {
       sequenceFeedback("VOILÀ ! **Répète : UN !** Tu es passé de ZÉRO (rien) à UN. Tu as un jeton, lève UN doigt. C'est le nombre **1** ! 👆",
            `Le nombre **${unitsValue}** représente UNE chose.`);
        } else if (unitsValue === 2) {
       sequenceFeedback("Super ! **Répète : DEUX !** Tu as maintenant DEUX jetons, lève DEUX doigts. C'est le nombre **2** ! ✌️",
            `Le nombre **${unitsValue}** représente DEUX choses.`);
        } else if (unitsValue === 3) {
       sequenceFeedback("Génial ! **Répète : TROIS !** Tu as TROIS jetons, trois doigts levés. Tu comprends maintenant qu'un **NOMBRE** représente une **QUANTITÉ** de choses !",
            `Le nombre **${unitsValue}** représente TROIS choses.`);
             
             // Transition vers la phase de pratique
             setTimeout(() => {
                setPhase('click-add'); 
                setFeedback("Bravo ! Continuons avec **QUATRE**, **CINQ** et **SIX**. Tu vas devenir un expert des nombres !");
             }, FEEDBACK_DELAY * 1.5);
        } else if (unitsValue > 3) {
            newCols[0].value = 3; 
            setFeedback("Stop ! On a fait le UN, DEUX, TROIS. On passe à la pratique.");
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
        setFeedback("Stop ! Tu as atteint **6** jetons (SIX). C'est parfait ! Maintenant, on va apprendre à enlever un par un !");
        setColumns(newCols); 
        
        // Transition immédiate vers click-remove
        setTimeout(() => {
            setPhase('click-remove'); 
            setFeedback("Parfait ! Clique maintenant sur le bouton ROUGE (∇) pour enlever les jetons un par un et revenir à **ZÉRO** (rien).");
        }, FEEDBACK_DELAY);
        return;
      }
      
      setAddClicks(nextClick);

    if (newCols[idx].value === 6) {
      setFeedback("Super ! Tu as atteint **6** jetons. C'est six doigts levés (une main entière + un doigt) !");
    } else if (newCols[idx].value === 4) {
      setFeedback(`**QUATRE** ! Le nombre **${newCols[idx].value}**. Continue à ajouter un jeton à chaque fois !`);
    } else if (newCols[idx].value === 5) {
      setFeedback(`**CINQ** ! Tous les doigts d'une main ! ✋ Continue !`);
    } else {
      setFeedback(`Le nombre est maintenant **${newCols[idx].value}**. Continue à ajouter un jeton à la fois !`);
    }
    // Rappel synthétique après un court délai
    setTimeout(() => setFeedback(`Tu as maintenant ${newCols[idx].value} jetons. **${newCols[idx].value} doigts** levés.`), FEEDBACK_DELAY);
      setColumns(newCols); 

    }
    
    // D. challenge-learn-unit (surveillance du dépassement)
    else if (phase === 'challenge-learn-unit' && newCols[0].value > CHALLENGE_LEARN_GOAL) {
        setFeedback(`Oups, tu as dépassé ${CHALLENGE_LEARN_GOAL}. Utilise le bouton ROUGE !`);
        setColumns(newCols); 
    }

    // E. learn-carry
  else if (phase === 'learn-carry' && hasCarry) {
    sequenceFeedback("INCROYABLE ! Dix unités sont devenues un seul point dans la colonne des Dizaines !",
             "C'est la règle d'or : 10 dans une colonne donne 1 à la colonne suivante.");
        
        // Transition vers le jeu libre
      setTimeout(() => {
      setPhase('normal');
      sequenceFeedback("APPRENTISSAGE TERMINÉ ! Tu peux désormais utiliser les Unités et les Dizaines librement.",
               "Utilise le bouton 'Débloquer la colonne suivante' pour continuer l'aventure !",
               FEEDBACK_DELAY / 1.5);
    }, FEEDBACK_DELAY * 2);
        setColumns(newCols); 
    }

    // F. Feedback en mode normal
    else if (phase === 'normal' && hasCarry) {
         setFeedback("Échange ! 10 points sont passés dans la colonne de gauche. Le système décimal est magique !");
         setColumns(newCols); 
    }
    
    // Mise à jour de l'état si l'on est dans un cas général
    else {
        setColumns(newCols);
        if(phase === 'normal' || phase === 'done' || phase === 'learn-units') {
             setFeedback(`Il y a maintenant ${newCols[idx].value} point${newCols[idx].value > 1 ? 's' : ''} dans la colonne ${newCols[idx].name}.`);
        }
    }


  }, [columns, phase, addClicks, isUnitsColumn, totalNumber, isCountingAutomatically]);


  // --- LOGIQUE SOUSTRAIRE (HANDLE SUBTRACT) ---
  const handleSubtract = useCallback((idx: number) => {
    
    // Blocage du clic manuel pendant l'auto-comptage
    if (isCountingAutomatically) return; 
    
    // Restrictions des clics non Unités pendant le tutoriel
    if (phase !== 'normal' && !isUnitsColumn(idx) && phase !== 'challenge-learn-unit' && phase !== 'click-remove' && phase !== 'tutorial' && phase !== 'explore-units') {
      setFeedback("Concentrons-nous sur la colonne des Unités pour l'instant.");
      return;
    }
    
    if (totalNumber <= 0) {
      setFeedback("C'est **ZÉRO** (0) ! Il n'y a plus rien. On ne peut pas descendre plus bas que ZÉRO.");
  setFeedback("ZÉRO signifie qu'il n'y a aucun jeton, aucune quantité.");
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
        setFeedback(`Il y a maintenant ${newCols[idx].value} point${newCols[idx].value > 1 ? 's' : ''} dans la colonne ${newCols[idx].name}.`);
        }
    }


    // --- LOGIQUE DE PROGRESSION ---
    
    // A. tutorial (Découverte du bouton rouge)
    if (phase === 'tutorial') {
        const unitsValue = newCols[0].value;
        
        if (unitsValue === 2) {
            setFeedback("Super ! 😊 Le bouton ROUGE enlève un point bleu ! Tu vois, il y en a maintenant deux au lieu de trois.");
            setFeedback("Le bouton VERT ajoute, le bouton ROUGE enlève. C'est facile !");
        } else if (unitsValue === 1) {
            setFeedback("Bravo ! 🎉 Clique encore sur le bouton ROUGE pour tout enlever !");
            setFeedback("Plus qu'un seul rond bleu ! Continue à enlever...");
        } else if (unitsValue === 0 && tempTotalBefore === 1) {
            setFeedback("Excellent ! ✨ Tu maîtrises les boutons ! Tous les ronds ont disparu. Maintenant, je vais t'apprendre ce qu'est un **NOMBRE** !");
            setFeedback("Tu as compris comment fonctionne la machine ! Prêt pour la suite ?");
            
            // Transition vers explore-units après un délai
            setTimeout(() => {
                setPhase('explore-units');
                setFeedback("Bienvenue ! 👋 Je vais t'apprendre ce qu'est un **NOMBRE**. Un nombre, c'est une façon de compter des choses. Regarde, tu as **zéro jeton** pour commencer (rien du tout). Prêt à apprendre ?");
              setFeedback("Tu vois la case vide ? C'est **ZÉRO** (0). Zéro signifie qu'il n'y a RIEN, aucun jeton, aucun doigt levé.");
            }, FEEDBACK_DELAY * 2);
        } else if (unitsValue > 0) {
            setFeedback(`Bien ! Continue à cliquer sur le bouton ROUGE pour enlever les ronds bleus un par un.`);
            setFeedback("Le bouton ROUGE enlève un rond à chaque fois que tu cliques dessus.");
        }
    }
    
    // B. explore-units : si on soustrait trop tôt
    else if (phase === 'explore-units' && newCols[0].value < columns[0].value) {
        setFeedback("On n'enlève pas encore, on est en train de découvrir l'ajout !");
    }

    // C. click-remove (La soustraction et le retour à Zéro avec les doigts)
    if (phase === 'click-remove' && isUnitsColumn(idx)) {
      const unitsValue = newCols[0].value;
      
      if (unitsValue === 5) {
          setFeedback(`Le nombre est maintenant **${unitsValue}** (CINQ) ! Une main entière ! ✋`);
          setFeedback(`Bien ! Tu as retiré un jeton. Continue à enlever un par un !`);
      } else if (unitsValue === 3) {
          setFeedback(`Le nombre est maintenant **${unitsValue}** (TROIS) ! Tu te souviens ?`);
          setFeedback(`Bien ! Continue à descendre vers ZÉRO !`);
      } else if (unitsValue === 2) {
          setFeedback(`Le nombre est maintenant **${unitsValue}** (DEUX) ! Deux doigts levés ✌️`);
          setFeedback(`Bien ! Encore un peu et on arrive à ZÉRO !`);
      } else if (unitsValue === 1) {
          setFeedback(`Le nombre est maintenant **${unitsValue}** (UN) ! Un seul doigt 👆`);
          setFeedback(`Presque à ZÉRO ! Un dernier clic !`);
      } else if (unitsValue === 0 && tempTotalBefore === 1) { 
  setFeedback("**ZÉRO** (0) : plus rien ! Aucun jeton, aucun doigt levé !");
        setFeedback("Fantastique ! Le compteur est revenu à **ZÉRO (0)** ! Tu comprends maintenant ce que veut dire compter et revenir à rien !");
        
        // Transition vers la phase 'done'
        setTimeout(() => {
          setPhase('done');
          setFeedback("Félicitations ! Tu maîtrises les nombres de 0 à 6. Clique sur 'Commencer l'apprentissage' pour découvrir l'échange 10 pour 1 !");
        }, FEEDBACK_DELAY);
      } else if (unitsValue > 0) {
          setFeedback(`Le nombre est maintenant **${unitsValue}** ! Baisse un doigt !`);
          setFeedback(`Bien ! Tu as retiré un jeton. Il te reste **${unitsValue} doigts levés**.`);
      }
    }
    
    // D. Feedback sur l'emprunt en mode normal
    if (phase === 'normal' && hasBorrow) {
  setFeedback("Emprunt ! Nous avons dû prendre à la colonne de gauche et laisser 9 ici. C'est le principe de la soustraction !");
    }
  }, [columns, phase, isUnitsColumn, totalNumber, isCountingAutomatically]);


  // --- LOGIQUE BOUTON VALIDER DU DÉFI D'APPRENTISSAGE (5) ---
  const handleValidateLearning = useCallback(() => {
    if (phase === 'challenge-learn-unit') {
      if (columns[0].value === CHALLENGE_LEARN_GOAL) {
        setFeedback("DÉFI RÉUSSI ! Tu as bien compris les unités. Maintenant, le moment magique de l'échange !");
        
        // Transition vers la phase 'learn-carry'
        setTimeout(() => {
          setPhase('learn-carry');
          // Afficher un premier message, puis un rappel après un court délai
          setFeedback("Prêt ? Clique sur le bouton VERT (△) pour faire le dernier pas et forcer la machine à faire l'échange !");
          setTimeout(() => {
            setFeedback("Tu dois maintenant cliquer sur △ pour forcer l'échange 10 pour 1.");
          }, FEEDBACK_DELAY);
        }, FEEDBACK_DELAY);
      } else {
        setFeedback(`Non, il faut afficher ${CHALLENGE_LEARN_GOAL} aux unités. Utilise les deux boutons !`);
      }
    }
  }, [phase, columns]);


  // --- LOGIQUE DÉMARRAGE APPRENTISSAGE (post-tutoriel) ---
  const startLearningPhase = useCallback(() => {
      if (phase === 'done') {
          // S'assurer que le compteur est à zéro au démarrage
          const newCols = initialColumns.map((col, i) => i === 1 ? { ...col, unlocked: true } : col); 
          setColumns(newCols);
          
          setPhase('learn-units'); 
          setIsCountingAutomatically(true); // DÉCLENCHEMENT DE L'AUTO-COMPTAGE
          
          setFeedback("C'est parti ! Regarde bien la machine compter de 1 à 9 et écoute les commentaires...");
          setFeedback("Observe bien le nombre de points qui s'allument à chaque unité.");
      }
  }, [phase]); 


  // --- LOGIQUE JEU LIBRE ---
  const unlockNextColumn = useCallback(() => {
    const nextIdx = columns.findIndex((col, i) => !col.unlocked && i > 0);
    if (nextIdx !== -1) {
      const newCols = [...columns];
      newCols[nextIdx].unlocked = true;
      setColumns(newCols);
      setFeedback(`Colonne ${newCols[nextIdx].name} débloquée ! Maintenant, tu peux manipuler des nombres jusqu'à ${Math.pow(10, nextIdx + 1) - 1}.`);
    }
  }, [columns]);


  // --- Instructions par phase (Typing Effect) ---
  const instruction = useMemo(() => {
    switch (phase) {
      case 'tutorial':
        return "🎮 Bienvenue ! Clique sur le bouton VERT (△) pour découvrir comment fonctionne la machine. Essaie plusieurs fois !";
      case 'explore-units':
        return "👋 Clique sur le bouton VERT (△) pour ajouter un jeton. Lève **UN doigt** à chaque clic. **Répète à haute voix** : ZÉRO (rien), puis UN, DEUX, TROIS !";
      case 'click-add':
        return "Pratique : continue à cliquer jusqu'à **SIX** (six doigts levés). Chaque clic ajoute **UN** jeton de plus !";
      case 'click-remove':
        return "Très bien ! Clique sur le bouton ROUGE (∇) pour enlever les jetons un par un. Baisse **UN doigt** à chaque fois jusqu'à revenir à **ZÉRO** (rien).";
      case 'done':
        return "🎉 Génial ! Clique sur **'Commencer l'apprentissage'** pour découvrir la **règle d'or du système décimal : l'échange 10 pour 1** !";
      case 'learn-units':
          return "Regarde la machine compter toute seule de 1 à 9. Observe comment chaque nombre représente une quantité avec tes doigts.";
      case 'challenge-learn-unit':
          return `DÉFI UNITÉ : Mets **${CHALLENGE_LEARN_GOAL_STRING}** aux unités et clique sur **VALIDER** !`;
      case 'learn-carry':
          return "Vas-y ! Clique sur △ pour faire le dernier pas et forcer la machine à faire l'échange !";
      case 'normal':
        return "Jeu libre ! Construis de grands nombres et observe comment la machine échange les points. 🚀";
      default:
        return "Prépare-toi pour l'apprentissage !";
    }
  }, [phase]);

  // Texte combiné pour l'affichage unifié (instruction + feedback)
  const combinedText = useMemo(() => {
    const parts: string[] = [];
    if (instruction) parts.push(instruction);
    if (showFeedbackInCombined && feedback) parts.push(`✨ ${feedback}`);
    return parts.join('\n\n');
  }, [instruction, feedback, showFeedbackInCombined]);

  // Gestion de l'effet de frappe unifié
  useEffect(() => {
    let i = 0;
    setTypedText("");
    const timer = setInterval(() => {
      i++;
      setTypedText(combinedText.slice(0, i));
      if (i >= combinedText.length) clearInterval(timer);
    }, TYPING_SPEED);
    return () => clearInterval(timer);
  }, [combinedText]);

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
            width: 18,
            height: 18,
            borderRadius: "50%",
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
        borderRadius: 12, 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
      }}>
        <h2 style={{ 
          fontSize: 24, 
          marginBottom: 16, 
          textAlign: 'center',
          color: '#1e293b'
        }}>
          Machine à Nombres 🧠
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
                background: columns[0].value === CHALLENGE_LEARN_GOAL ? '#22c55e' : '#f97316',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'all 0.2s ease'
              }}
            >
              VALIDER LE DÉFI
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
                  background: '#0ea5e9',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease'
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
                  background: '#8b5cf6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease',
                  marginLeft: showStartLearningButton ? '12px' : '0'
                }}
              >
                Débloquer la colonne suivante
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
          <div style={{ fontSize: 14, color: '#64748b', marginBottom: 4 }}>Nombre total</div>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#0ea5e9' }}>
            {totalNumber.toString().padStart(4, '0')}
          </div>
        </div>
      </div>

      {/* Assistant pédagogique */}
      <div style={{ 
        width: 280, 
        minHeight: 240, 
        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', 
        borderRadius: 12, 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
        padding: 20, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 12 
      }}>
        <div style={{ 
          fontWeight: 'bold', 
          fontSize: 20, 
          marginBottom: 4, 
          color: '#b45309',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span style={{ fontSize: 28 }}>🤖</span> 
          <span>Mon prof robot</span>
        </div>
        
        {phase !== 'normal' && (
          <div style={{
            fontSize: 15,
            fontWeight: 'bold',
            color: '#fff',
            background: phase === 'done' ? '#22c55e' : (phase === 'learn-units' || phase === 'challenge-learn-unit' || phase === 'learn-carry' ? '#f59e0b' : (phase === 'tutorial' ? '#8b5cf6' : '#3b82f6')),
            padding: '8px 12px',
            borderRadius: 20,
            textAlign: 'center'
          }}>
            {phase === 'done' ? '🎉 Tutoriel Terminé !' : 
             (phase === 'learn-units' || phase === 'challenge-learn-unit' || phase === 'learn-carry') ? '💡 Apprentissage' : 
             phase === 'tutorial' ? '🎮 Tutoriel de prise en main' : '📚 Commandes & Valeur'}
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
          overflow: 'hidden'
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
          
          {/* Curseur clignotant */}
          <style>{`
            @keyframes blink {
              0%, 49% { opacity: 1; }
              50%, 100% { opacity: 0; }
            }
          `}</style>
          
          <span style={{ position: 'relative', zIndex: 1 }}>
            {typedText}
            {typedText.length < combinedText.length && (
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