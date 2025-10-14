// =============================================================================
// STORE ZUSTAND - MACHINE À NOMBRES
// =============================================================================
// Ce fichier contient toute la logique de gestion d'état de l'application
// "Machine à Nombres", une application éducative pour apprendre les nombres
// de 0 à 9999 en utilisant le système positionnel (unités, dizaines, centaines, milliers).
//
// Architecture:
// - État global: stocke toutes les données (colonnes, phase, feedback, etc.)
// - Actions: fonctions pour modifier l'état et gérer la logique métier
// - Phases: différentes étapes du parcours d'apprentissage (voir types.ts)
// =============================================================================

import { create } from 'zustand';
import type {
    MachineState,
    Column,
} from './types.ts';
import {
    FEEDBACK_DELAY,
    UNIT_CHALLENGES,
    TENS_CHALLENGES,
    HUNDREDS_CHALLENGES,
    THOUSANDS_CHALLENGES
} from './types.ts';

// -----------------------------------------------------------------------------
// CONFIGURATION INITIALE DES COLONNES
// -----------------------------------------------------------------------------
// Chaque colonne représente une position dans le système décimal:
// - Unités (0-9): position des unités
// - Dizaines (0-9): position des dizaines (x10)
// - Centaines (0-9): position des centaines (x100)
// - Milliers (0-9): position des milliers (x1000)
//
// Les colonnes commencent verrouillées (sauf les unités) et sont débloquées
// progressivement au fur et à mesure que l'utilisateur progresse.
// -----------------------------------------------------------------------------
export const initialColumns: Column[] = [
    { name: 'Unités', value: 0, unlocked: true, color: 'bg-green-500' },
    { name: 'Dizaines', value: 0, unlocked: false, color: 'bg-blue-500' },
    { name: 'Centaines', value: 0, unlocked: false, color: 'bg-yellow-500' },
    { name: 'Milliers', value: 0, unlocked: false, color: 'bg-red-500' },
];

// =============================================================================
// CRÉATION DU STORE ZUSTAND
// =============================================================================
// Zustand est une bibliothèque de gestion d'état légère.
// create<MachineState>() crée un store avec le type MachineState défini dans types.ts
// set() permet de modifier l'état
// get() permet de lire l'état actuel
// =============================================================================
export const useStore = create<MachineState>((set, get) => ({
    // -------------------------------------------------------------------------
    // ÉTAT DE LA MACHINE
    // -------------------------------------------------------------------------
    // columns: Les 4 colonnes (Unités, Dizaines, Centaines, Milliers)
    columns: initialColumns,
    
    // phase: La phase actuelle du parcours pédagogique (voir types.ts pour la liste complète)
    phase: 'intro-welcome',
    
    // addClicks: Compteur du nombre de clics sur les boutons d'ajout (utilisé pour la progression)
    addClicks: 0,
    
    // feedback: Message de feedback affiché à l'utilisateur (zone assistant)
    feedback: "",
    
    // typedInstruction / typedFeedback: Texte en cours de frappe (effet machine à écrire)
    typedInstruction: "",
    typedFeedback: "",
    
    // isTyping*: Indicateurs si un texte est en cours de frappe (désactive certaines actions)
    isTypingInstruction: false,
    isTypingFeedback: false,
    
    // pendingAutoCount: Indique qu'un auto-comptage est en attente (après fin d'animation texte)
    pendingAutoCount: false,
    
    // isTransitioningToChallenge: Indique une transition en cours vers un défi
    isTransitioningToChallenge: false,
    
    // isCountingAutomatically: Indique si la machine compte automatiquement (mode démonstration)
    isCountingAutomatically: false,
    
    // nextPhaseAfterAuto: Phase cible après la fin d'un auto-comptage
    nextPhaseAfterAuto: null,
    
    // timer: Référence au timer actif (pour pouvoir l'annuler si besoin)
    timer: null,
    
    // -------------------------------------------------------------------------
    // PROGRESSION DES DÉFIS
    // -------------------------------------------------------------------------
    // Suivi des défis complétés (débloque les niveaux suivants)
    completedChallenges: {
        tens: false,        // Défis des dizaines complétés
        hundreds: false,    // Défis des centaines complétés
        thousands: false,   // Défis des milliers complétés
    },
    
    // Indices et compteurs de progression pour chaque type de défi
    unitTargetIndex: 0,      // Index de la cible actuelle dans le défi des unités
    unitSuccessCount: 0,     // Nombre de réussites dans le défi des unités
    tensTargetIndex: 0,      // Index de la cible actuelle dans le défi des dizaines
    tensSuccessCount: 0,     // Nombre de réussites dans le défi des dizaines
    hundredsTargetIndex: 0,  // Index de la cible actuelle dans le défi des centaines
    hundredsSuccessCount: 0, // Nombre de réussites dans le défi des centaines
    thousandsTargetIndex: 0, // Index de la cible actuelle dans le défi des milliers
    thousandsSuccessCount: 0,// Nombre de réussites dans le défi des milliers
    
    // -------------------------------------------------------------------------
    // INTERACTIONS UTILISATEUR
    // -------------------------------------------------------------------------
    // instruction: Consigne affichée en haut de l'assistant pédagogique
    instruction: "(Bruits de marteau sur du métal et de perceuse) Paf, Crac… Bim… Tchac ! Quel vacarme ! Voilà, j'ai terminé ma nouvelle machine !",
    
    // userInput: Réponse saisie par l'utilisateur (pour les questions)
    userInput: "",
    
    // showInputField: Affiche le champ de saisie pour les questions
    showInputField: false,

    // -------------------------------------------------------------------------
    // VISIBILITÉ DES BOUTONS
    // -------------------------------------------------------------------------
    // Ces flags contrôlent l'affichage des différents boutons d'action
    showUnlockButton: false,             // Bouton "Débloquer la colonne suivante"
    showStartLearningButton: false,      // Bouton "Commencer l'apprentissage"
    showValidateLearningButton: false,   // Bouton "Valider" pour les défis des unités
    showValidateTensButton: false,       // Bouton "Valider" pour les défis des dizaines
    showValidateHundredsButton: false,   // Bouton "Valider" pour les défis des centaines
    showValidateThousandsButton: false,  // Bouton "Valider" pour les défis des milliers

    // =========================================================================
    // ACTIONS DE MODIFICATION D'ÉTAT (SETTERS)
    // =========================================================================
    // Ces fonctions permettent de modifier l'état du store.
    // Certaines déclenchent des effets de bord (updateInstruction, updateButtonVisibility)
    // =========================================================================
    
    // -------------------------------------------------------------------------
    // Gestion des colonnes
    // -------------------------------------------------------------------------
    // setColumns: Met à jour les valeurs des colonnes et recalcule la visibilité des boutons
    // Paramètre: updater peut être un tableau de colonnes ou une fonction qui transforme les colonnes actuelles
    setColumns: (updater) => {
        const newColumns = typeof updater === 'function' ? updater(get().columns) : updater;
        set({ columns: newColumns });
        get().updateButtonVisibility();
    },
    
    // -------------------------------------------------------------------------
    // Gestion de la phase
    // -------------------------------------------------------------------------
    // setPhase: Change la phase actuelle (étape du parcours pédagogique)
    // Déclenche la mise à jour de l'instruction et de la visibilité des boutons
    setPhase: (phase) => {
        set({ phase });
        get().updateInstruction();
        get().updateButtonVisibility();
    },
    
    // -------------------------------------------------------------------------
    // Gestion des interactions utilisateur
    // -------------------------------------------------------------------------
    setAddClicks: (clicks) => set({ addClicks: clicks }),
    
    // setFeedback: Affiche un message de feedback dans l'assistant pédagogique
    // Le message est ajouté à la file d'attente pour un effet de frappe progressif
    setFeedback: (feedback) => {
        if (feedback) {
            get().enqueueMessage({ kind: 'feedback', text: feedback });
        }
        set({ feedback });
    },
    
    // -------------------------------------------------------------------------
    // Gestion de l'effet de frappe (typing)
    // -------------------------------------------------------------------------
    setTypedInstruction: (instruction) => set({ typedInstruction: instruction }),
    setTypedFeedback: (feedback) => set({ typedFeedback: feedback }),
    setIsTypingInstruction: (isTyping) => set({ isTypingInstruction: isTyping }),
    setIsTypingFeedback: (isTyping) => set({ isTypingFeedback: isTyping }),
    
    // -------------------------------------------------------------------------
    // Gestion de l'auto-comptage (mode démonstration)
    // -------------------------------------------------------------------------
    setPendingAutoCount: (pending) => set({ pendingAutoCount: pending }),
    setIsTransitioningToChallenge: (isTransitioning) => set({ isTransitioningToChallenge: isTransitioning }),
    setIsCountingAutomatically: (isCounting) => set({ isCountingAutomatically: isCounting }),
    setNextPhaseAfterAuto: (phase) => set({ nextPhaseAfterAuto: phase }),
    
    // -------------------------------------------------------------------------
    // Gestion de la progression des défis
    // -------------------------------------------------------------------------
    setCompletedChallenges: (updater) => set((state) => ({ completedChallenges: typeof updater === 'function' ? updater(state.completedChallenges) : updater })),
    
    // Setters avec mise à jour automatique de l'instruction
    setUnitTargetIndex: (index) => {
        set({ unitTargetIndex: index });
        get().updateInstruction();
    },
    setUnitSuccessCount: (count) => {
        set({ unitSuccessCount: count });
        get().updateInstruction();
    },
    setTensTargetIndex: (index) => {
        set({ tensTargetIndex: index });
        get().updateInstruction();
    },
    setTensSuccessCount: (count) => {
        set({ tensSuccessCount: count });
        get().updateInstruction();
    },
    setHundredsTargetIndex: (index) => {
        set({ hundredsTargetIndex: index });
        get().updateInstruction();
    },
    setHundredsSuccessCount: (count) => {
        set({ hundredsSuccessCount: count });
        get().updateInstruction();
    },
    setThousandsTargetIndex: (index) => {
        set({ thousandsTargetIndex: index });
        get().updateInstruction();
    },
    setThousandsSuccessCount: (count) => {
        set({ thousandsSuccessCount: count });
        get().updateInstruction();
    },
    
    // Fonctions de réinitialisation des défis
    resetUnitChallenge: () => {
        set({ unitTargetIndex: 0, unitSuccessCount: 0 });
        get().updateInstruction();
    },
    resetTensChallenge: () => {
        set({ tensTargetIndex: 0, tensSuccessCount: 0 });
        get().updateInstruction();
    },
    resetHundredsChallenge: () => {
        set({ hundredsTargetIndex: 0, hundredsSuccessCount: 0 });
        get().updateInstruction();
    },
    resetThousandsChallenge: () => {
        set({ thousandsTargetIndex: 0, thousandsSuccessCount: 0 });
        get().updateInstruction();
    },
    
    // -------------------------------------------------------------------------
    // Gestion des champs de saisie (questions)
    // -------------------------------------------------------------------------
    setUserInput: (input) => set({ userInput: input }),
    setShowInputField: (show) => set({ showInputField: show }),
    
    // =========================================================================
    // GESTION DES RÉPONSES AUX QUESTIONS
    // =========================================================================
    // handleUserInputSubmit: Traite la réponse de l'utilisateur aux questions posées
    // Utilisé pour les phases d'introduction qui demandent une interaction textuelle
    // =========================================================================
    handleUserInputSubmit: () => {
        const { phase, userInput, sequenceFeedback } = get();
        const answer = parseInt(userInput.trim());
        
        // Question: "Combien de chiffres différents as-tu vu ?" (Réponse attendue: 10 ou 9)
        if (phase === 'intro-question-digits') {
            if (answer === 9) {
                sequenceFeedback(
                    "Ah je vois pourquoi tu pourrais penser ça, 1, 2, 3, 4, 5, 6, 7, 8, 9, ça fait 9 chiffres...",
                    "Mais rappelle-toi, au début la machine affichait aussi 0 ! Il est un peu particulier et parfois on l'oublie, mais ce 0 est aussi important que les autres chiffres !"
                );
                setTimeout(() => {
                    get().setFeedback("Donc en tout, nous avons bien 10 chiffres différents : 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 !");
                    setTimeout(() => {
                        set({ showInputField: false, userInput: "", phase: 'intro-add-roll' });
                        get().updateInstruction();
                    }, FEEDBACK_DELAY);
                }, FEEDBACK_DELAY * 2);
            } else if (answer === 10) {
                sequenceFeedback(
                    "Tu n'as pas oublié le 0 ! Bravo !",
                    "0, 1, 2, 3, 4, 5, 6, 7, 8, 9, le compte est bon, nous en avons bien 10 ! Il est un peu particulier et parfois on l'oublie, mais ce 0 est aussi important que les autres chiffres !"
                );
                setTimeout(() => {
                    set({ showInputField: false, userInput: "", phase: 'intro-add-roll' });
                    get().updateInstruction();
                }, FEEDBACK_DELAY * 2);
            } else {
                sequenceFeedback(
                    "J'imagine que tu n'y as pas vraiment fait attention, comptons ensemble...",
                    "0, 1, 2, 3, 4, 5, 6, 7, 8, 9, le compte est bon, nous en avons 10 ! Au début la machine affichait aussi 0 et ce 0 est aussi important que les autres chiffres."
                );
                setTimeout(() => {
                    set({ showInputField: false, userInput: "", phase: 'intro-add-roll' });
                    get().updateInstruction();
                }, FEEDBACK_DELAY * 2);
            }
        } else if (phase === 'intro-question-max') {
            if (answer === 100) {
                sequenceFeedback(
                    "Malheureusement pas...",
                    "J'ai bien l'impression qu'il va encore falloir modifier la machine si je veux y arriver !"
                );
                setTimeout(() => {
                    get().setFeedback("Regarde combien chaque rouleau peut afficher de points : 9 et 9, ce qui veut dire qu'on peut compter jusqu'à 99 !");
                    setTimeout(() => {
                        set({ showInputField: false, userInput: "", phase: 'tutorial' });
                        get().updateInstruction();
                    }, FEEDBACK_DELAY);
                }, FEEDBACK_DELAY * 2);
            } else if (answer === 99) {
                sequenceFeedback(
                    "Exactement ! Trop facile comme question !",
                    "Avec deux rouleaux, on peut afficher jusqu'à 99 !"
                );
                setTimeout(() => {
                    set({ showInputField: false, userInput: "", phase: 'tutorial' });
                    get().updateInstruction();
                }, FEEDBACK_DELAY * 2);
            } else {
                sequenceFeedback(
                    "Pas tout à fait...",
                    "Regarde combien chaque rouleau peut afficher de points : 9 et 9, ce qui veut dire qu'on peut compter jusqu'à 99 !"
                );
                setTimeout(() => {
                    set({ showInputField: false, userInput: "", phase: 'tutorial' });
                    get().updateInstruction();
                }, FEEDBACK_DELAY * 2);
            }
        }
    },

    // =========================================================================
    // MISE À JOUR DE LA VISIBILITÉ DES BOUTONS
    // =========================================================================
    // updateButtonVisibility: Détermine quels boutons d'action doivent être affichés
    // en fonction de la phase actuelle et de l'état de la machine
    // =========================================================================
    updateButtonVisibility: () => {
        const { phase, columns } = get();
        const allColumnsUnlocked = columns.every(col => col.unlocked);

        set({
            showUnlockButton: phase === 'normal' && !allColumnsUnlocked,
            showStartLearningButton: phase === 'done',
            showValidateLearningButton: phase.startsWith('challenge-unit-'),
            showValidateTensButton: phase.startsWith('challenge-tens-'),
            showValidateHundredsButton: phase.startsWith('challenge-hundreds-'),
            showValidateThousandsButton: phase.startsWith('challenge-thousands-'),
        });
    },

    // =========================================================================
    // AUTO-COMPTAGE (MODE DÉMONSTRATION)
    // =========================================================================
    // runAutoCount: Fait compter automatiquement la machine pour montrer à l'utilisateur
    // comment fonctionnent les nombres. Utilisé dans les phases d'apprentissage (learn-*)
    //
    // Fonctionnement:
    // 1. Incrémente automatiquement la colonne appropriée (unités, dizaines, centaines, milliers)
    // 2. Affiche des messages pédagogiques à chaque étape
    // 3. S'arrête à 9 et transite vers la phase suivante (challenge)
    // 4. Utilise des setTimeout pour espacer les incrémentations (COUNT_SPEED = 1800ms)
    //
    // Note: Cette fonction utilise setTimeout de manière récursive pour créer l'effet
    // d'animation. Chaque incrément appelle runAutoCount() à nouveau après un délai.
    // =========================================================================
    runAutoCount: () => {
        const { phase, isCountingAutomatically, columns, nextPhaseAfterAuto, timer } = get();
        const COUNT_SPEED = 1800; // Vitesse de l'auto-incrémentation ralentie pour le commentaire

        if (timer) {
            clearTimeout(timer);
            set({ timer: null });
        }

        if (!isCountingAutomatically) {
            return;
        }

        // --- LOGIQUE POUR 'learn-units' ---
        if (phase === 'learn-units') {
            const unitsValue = columns[0].value;

            if (unitsValue < 9) {
                const newTimer = setTimeout(() => {
                    get().setColumns(prevCols => {
                        const newCols = [...prevCols];
                        newCols[0].value++;
                        return newCols;
                    });

                    const nextValue = unitsValue + 1;
                    let infoMessage = "";
                    if (nextValue === 1) infoMessage = "**1** : une bille. UN doigt ✌️";
                    else if (nextValue === 2) infoMessage = "**2** : deux billes. DEUX doigts ! ✌️";
                    else if (nextValue === 3) infoMessage = "**3** : trois billes. TROIS doigts ! 🎈";
                    else if (nextValue === 4) infoMessage = "**4** : quatre billes. QUATRE doigts !";
                    else if (nextValue === 5) infoMessage = "**5** : cinq billes. CINQ ! Tous les doigts d'une main ! ✋";
                    else if (nextValue === 6) infoMessage = "**6** : six billes. SIX doigts !";
                    else if (nextValue === 7) infoMessage = "**7** : sept billes. SEPT doigts !";
                    else if (nextValue === 8) infoMessage = "**8** : huit billes. HUIT doigts !";
                    else if (nextValue === 9) infoMessage = "**9** : neuf billes. 🎯 La colonne est presque pleine ! Plus qu'un espace libre !";
                    get().setFeedback(infoMessage);
                    get().runAutoCount(); // Continue counting
                }, COUNT_SPEED);
                set({ timer: newTimer as unknown as number });
            } else { // unitsValue is 9
                get().setFeedback("STOP ! 🛑 Le compteur est à 9. La colonne est PLEINE ! Attends, la machine va te montrer la suite !");
                const newTimer = setTimeout(() => {
                    const targetPhase = nextPhaseAfterAuto ?? 'challenge-unit-1';
                    get().setColumns(initialColumns);
                    get().setIsCountingAutomatically(false);
                    get().setNextPhaseAfterAuto(null);
                    get().resetUnitChallenge();
                    get().setFeedback("Retour à zéro ! 🔄 Maintenant, c'est à toi de jouer !");

                    setTimeout(() => {
                        get().setPhase(targetPhase);
                    }, FEEDBACK_DELAY);
                }, COUNT_SPEED * 3);
                set({ timer: newTimer as unknown as number });
            }
        }

        // --- LOGIQUE POUR 'learn-tens' ---
        else if (phase === 'learn-tens') {
            const tensValue = columns[1].value;
            if (columns[0].value !== 0) { // Ensure units are 0
                get().setColumns(cols => {
                    const newCols = [...cols];
                    newCols[0].value = 0;
                    return newCols;
                });
            }

            if (tensValue < 9) {
                const newTimer = setTimeout(() => {
                    get().setColumns(prevCols => {
                        const newCols = [...prevCols];
                        newCols[1].value++;
                        return newCols;
                    });

                    const nextValue = tensValue + 1;
                    const displayNumber = nextValue * 10;
                    let infoMessage = "";
                    if (nextValue === 1) infoMessage = `**${displayNumber}** (DIX) ! 🎯 Une dizaine = 10 unités !`;
                    else if (nextValue === 9) infoMessage = `**${displayNumber}** (QUATRE-VINGT-DIX) ! 🎯 Presque 100 !`;
                    else infoMessage = `**${displayNumber}** !`;
                    get().setFeedback(infoMessage);
                    get().runAutoCount(); // Continue counting
                }, COUNT_SPEED);
                set({ timer: newTimer as unknown as number });
            } else { // tensValue is 9
                get().setFeedback("STOP ! 🛑 Le compteur est à 90. Tu as vu tous les nombres avec les dizaines ! Bravo !");
                const newTimer = setTimeout(() => {
                    get().setColumns(initialColumns);
                    get().setIsCountingAutomatically(false);
                    get().setFeedback("Retour à zéro ! 🔄 Maintenant on va apprendre à combiner les dizaines et les unités !");
                    setTimeout(() => {
                        get().setPhase('learn-tens-combination');
                        get().setPendingAutoCount(true);
                    }, FEEDBACK_DELAY);
                }, COUNT_SPEED * 3);
                set({ timer: newTimer as unknown as number });
            }
        }
        
        // --- LOGIQUE POUR 'learn-tens-combination' ---
        else if (phase === 'learn-tens-combination') {
            const examples = [
                { tens: 1, units: 2, name: "DOUZE" },
                { tens: 2, units: 5, name: "VINGT-CINQ" },
                { tens: 3, units: 4, name: "TRENTE-QUATRE" },
            ];
            const currentExampleIndex = examples.findIndex(ex => ex.tens === columns[1].value && ex.units === columns[0].value);

            // If we're at [0, 0], set the first example
            if (currentExampleIndex === -1) {
                const firstExample = examples[0];
                get().setColumns(() => {
                    const newCols = [...initialColumns];
                    newCols[1].value = firstExample.tens;
                    newCols[0].value = firstExample.units;
                    newCols[1].unlocked = true;
                    return newCols;
                });
                const total = firstExample.tens * 10 + firstExample.units;
                get().setFeedback(`**${total}** (${firstExample.name}) ! ${firstExample.tens} dizaine(s) + ${firstExample.units} unité(s) = ${total} !`);
                const newTimer = setTimeout(() => {
                    get().runAutoCount();
                }, COUNT_SPEED);
                set({ timer: newTimer as unknown as number });
            } else if (currentExampleIndex < examples.length - 1) {
                const newTimer = setTimeout(() => {
                    const nextExample = examples[currentExampleIndex + 1];
                     get().setColumns(() => {
                        const newCols = [...initialColumns];
                        newCols[1].value = nextExample.tens;
                        newCols[0].value = nextExample.units;
                        newCols[1].unlocked = true;
                        return newCols;
                    });
                    const total = nextExample.tens * 10 + nextExample.units;
                    get().setFeedback(`**${total}** (${nextExample.name}) ! ${nextExample.tens} dizaine(s) + ${nextExample.units} unité(s) = ${total} !`);
                    get().runAutoCount();
                }, COUNT_SPEED);
                set({ timer: newTimer as unknown as number });
            } else {
                 get().setFeedback("Bravo ! 🎉 Tu as vu comment combiner dizaines et unités ! Maintenant c'est à toi !");
                 const newTimer = setTimeout(() => {
                    get().setColumns(initialColumns.map(c => ({...c, unlocked: c.name === 'Unités' || c.name === 'Dizaines'})));
                    get().setIsCountingAutomatically(false);
                    get().resetTensChallenge();
                    get().setFeedback("Retour à zéro ! 🔄 À toi de jouer maintenant !");
                    setTimeout(() => {
                        get().setPhase('challenge-tens-1');
                    }, FEEDBACK_DELAY);
                }, COUNT_SPEED * 3);
                set({ timer: newTimer as unknown as number });
            }
        }
        // --- LOGIQUE POUR 'learn-hundreds' ---
        else if (phase === 'learn-hundreds') {
            const hundredsValue = columns[2].value;
            if (columns[0].value !== 0 || columns[1].value !== 0) { // Ensure units and tens are 0
                get().setColumns(cols => {
                    const newCols = [...cols];
                    newCols[0].value = 0;
                    newCols[1].value = 0;
                    return newCols;
                });
            }

            if (hundredsValue < 9) {
                const newTimer = setTimeout(() => {
                    get().setColumns(prevCols => {
                        const newCols = [...prevCols];
                        newCols[2].value++;
                        return newCols;
                    });

                    const nextValue = hundredsValue + 1;
                    const displayNumber = nextValue * 100;
                    let infoMessage = `**${displayNumber}** !`;
                    if (nextValue === 1) infoMessage = `**${displayNumber}** (CENT) ! 🎯 Une centaine = 100 unités !`;
                    get().setFeedback(infoMessage);
                    get().runAutoCount(); // Continue counting
                }, COUNT_SPEED);
                set({ timer: newTimer as unknown as number });
            } else { // hundredsValue is 9
                get().setFeedback("STOP ! 🛑 Le compteur est à 900. Tu as vu tous les nombres avec les centaines ! Bravo !");
                const newTimer = setTimeout(() => {
                    get().setColumns(initialColumns);
                    get().setIsCountingAutomatically(false);
                    get().setFeedback("Retour à zéro ! 🔄 Maintenant on va apprendre à combiner les centaines, dizaines et unités !");
                    setTimeout(() => {
                        get().setPhase('learn-hundreds-combination');
                        get().setPendingAutoCount(true);
                    }, FEEDBACK_DELAY);
                }, COUNT_SPEED * 3);
                set({ timer: newTimer as unknown as number });
            }
        }
        // --- LOGIQUE POUR 'learn-hundreds-combination' ---
        else if (phase === 'learn-hundreds-combination') {
            const examples = [
                { hundreds: 1, tens: 2, units: 3, name: "CENT-VINGT-TROIS" },
                { hundreds: 2, tens: 3, units: 4, name: "DEUX-CENT-TRENTE-QUATRE" },
            ];
            const currentExampleIndex = examples.findIndex(ex => ex.hundreds === columns[2].value && ex.tens === columns[1].value && ex.units === columns[0].value);

            // If we're at [0, 0, 0], set the first example
            if (currentExampleIndex === -1) {
                const firstExample = examples[0];
                get().setColumns(() => {
                    const newCols = [...initialColumns];
                    newCols[2].value = firstExample.hundreds;
                    newCols[1].value = firstExample.tens;
                    newCols[0].value = firstExample.units;
                    newCols[1].unlocked = true;
                    newCols[2].unlocked = true;
                    return newCols;
                });
                const total = firstExample.hundreds * 100 + firstExample.tens * 10 + firstExample.units;
                get().setFeedback(`**${total}** (${firstExample.name}) !`);
                const newTimer = setTimeout(() => {
                    get().runAutoCount();
                }, COUNT_SPEED);
                set({ timer: newTimer as unknown as number });
            } else if (currentExampleIndex < examples.length - 1) {
                const newTimer = setTimeout(() => {
                    const nextExample = examples[currentExampleIndex + 1];
                     get().setColumns(() => {
                        const newCols = [...initialColumns];
                        newCols[2].value = nextExample.hundreds;
                        newCols[1].value = nextExample.tens;
                        newCols[0].value = nextExample.units;
                        newCols[1].unlocked = true;
                        newCols[2].unlocked = true;
                        return newCols;
                    });
                    const total = nextExample.hundreds * 100 + nextExample.tens * 10 + nextExample.units;
                    get().setFeedback(`**${total}** (${nextExample.name}) !`);
                    get().runAutoCount();
                }, COUNT_SPEED);
                set({ timer: newTimer as unknown as number });
            } else {
                 get().setFeedback("Bravo ! 🎉 Tu as vu comment combiner les centaines ! C'est à toi !");
                 const newTimer = setTimeout(() => {
                    get().setColumns(initialColumns.map(c => ({...c, unlocked: ['Unités', 'Dizaines', 'Centaines'].includes(c.name)})));
                    get().setIsCountingAutomatically(false);
                    get().resetHundredsChallenge();
                    get().setFeedback("Retour à zéro ! 🔄 À toi de jouer maintenant !");
                    setTimeout(() => {
                        get().setPhase('challenge-hundreds-1');
                    }, FEEDBACK_DELAY);
                }, COUNT_SPEED * 3);
                set({ timer: newTimer as unknown as number });
            }
        }
        // --- LOGIQUE POUR 'learn-thousands' ---
        else if (phase === 'learn-thousands') {
            const thousandsValue = columns[3].value;
            if (columns[0].value !== 0 || columns[1].value !== 0 || columns[2].value !== 0) {
                get().setColumns(cols => {
                    const newCols = [...cols];
                    newCols[0].value = 0; newCols[1].value = 0; newCols[2].value = 0;
                    return newCols;
                });
            }

            if (thousandsValue < 9) {
                const newTimer = setTimeout(() => {
                    get().setColumns(prevCols => {
                        const newCols = [...prevCols];
                        newCols[3].value++;
                        return newCols;
                    });
                    const nextValue = thousandsValue + 1;
                    const displayNumber = nextValue * 1000;
                    get().setFeedback(`**${displayNumber}** !`);
                    get().runAutoCount();
                }, COUNT_SPEED);
                set({ timer: newTimer as unknown as number });
            } else {
                get().setFeedback("STOP ! 🛑 Le compteur est à 9000. Bravo !");
                const newTimer = setTimeout(() => {
                    get().setColumns(initialColumns);
                    get().setIsCountingAutomatically(false);
                    get().setFeedback("Retour à zéro ! 🔄 Apprenons à combiner tous les chiffres !");
                    setTimeout(() => {
                        get().setPhase('learn-thousands-combination');
                        get().setPendingAutoCount(true);
                    }, FEEDBACK_DELAY);
                }, COUNT_SPEED * 3);
                set({ timer: newTimer as unknown as number });
            }
        }
        // --- LOGIQUE POUR 'learn-thousands-combination' ---
        else if (phase === 'learn-thousands-combination') {
            const examples = [
                { thousands: 1, hundreds: 2, tens: 3, units: 4, name: "MILLE-DEUX-CENT-TRENTE-QUATRE" },
                { thousands: 2, hundreds: 3, tens: 4, units: 5, name: "DEUX-MILLE-TROIS-CENT-QUARANTE-CINQ" },
            ];
            const currentExampleIndex = examples.findIndex(ex => ex.thousands === columns[3].value && ex.hundreds === columns[2].value && ex.tens === columns[1].value && ex.units === columns[0].value);

            // If we're at [0, 0, 0, 0], set the first example
            if (currentExampleIndex === -1) {
                const firstExample = examples[0];
                get().setColumns(() => {
                    const newCols = [...initialColumns];
                    newCols[3].value = firstExample.thousands;
                    newCols[2].value = firstExample.hundreds;
                    newCols[1].value = firstExample.tens;
                    newCols[0].value = firstExample.units;
                    newCols.forEach(c => c.unlocked = true);
                    return newCols;
                });
                const total = firstExample.thousands * 1000 + firstExample.hundreds * 100 + firstExample.tens * 10 + firstExample.units;
                get().setFeedback(`**${total}** (${firstExample.name}) !`);
                const newTimer = setTimeout(() => {
                    get().runAutoCount();
                }, COUNT_SPEED);
                set({ timer: newTimer as unknown as number });
            } else if (currentExampleIndex < examples.length - 1) {
                const newTimer = setTimeout(() => {
                    const nextExample = examples[currentExampleIndex + 1];
                     get().setColumns(() => {
                        const newCols = [...initialColumns];
                        newCols[3].value = nextExample.thousands;
                        newCols[2].value = nextExample.hundreds;
                        newCols[1].value = nextExample.tens;
                        newCols[0].value = nextExample.units;
                        newCols.forEach(c => c.unlocked = true);
                        return newCols;
                    });
                    const total = nextExample.thousands * 1000 + nextExample.hundreds * 100 + nextExample.tens * 10 + nextExample.units;
                    get().setFeedback(`**${total}** (${nextExample.name}) !`);
                    get().runAutoCount();
                }, COUNT_SPEED);
                set({ timer: newTimer as unknown as number });
            } else {
                 get().setFeedback("Bravo ! 🎉 Tu es un expert des grands nombres !");
                 const newTimer = setTimeout(() => {
                    get().setColumns(initialColumns.map(c => ({...c, unlocked: true})));
                    get().setIsCountingAutomatically(false);
                    get().resetThousandsChallenge();
                    get().setFeedback("Retour à zéro ! 🔄 À toi de jouer maintenant !");
                    setTimeout(() => {
                        get().setPhase('challenge-thousands-1');
                    }, FEEDBACK_DELAY);
                }, COUNT_SPEED * 3);
                set({ timer: newTimer as unknown as number });
            }
        }
    },

    // =========================================================================
    // LOGIQUE MÉTIER - GESTION DES INTERACTIONS
    // =========================================================================
    // Ces fonctions implémentent la logique principale de l'application:
    // - Affichage de messages en séquence
    // - Gestion des clics sur les boutons +/-
    // - Validation des défis
    // - Progression dans les phases
    // =========================================================================

    // -------------------------------------------------------------------------
    // sequenceFeedback: Affiche deux messages de feedback l'un après l'autre
    // -------------------------------------------------------------------------
    // Paramètres:
    //   - first: Premier message à afficher
    //   - second: Deuxième message à afficher après un délai
    //   - delay: Délai en ms avant d'afficher le second message (défaut: FEEDBACK_DELAY = 2500ms)
    //
    // Utilisation: Permet de créer des dialogues pédagogiques fluides
    // Exemple: "Bravo !" puis après 2.5s "Continue comme ça !"
    //
    // Note: Cette fonction utilise setTimeout pour espacer les messages
    // -------------------------------------------------------------------------
    sequenceFeedback: (first: string, second: string, delay = FEEDBACK_DELAY) => {
        get().setFeedback(first);
        setTimeout(() => get().setFeedback(second), delay);
    },

    // =========================================================================
    // GESTION DU BOUTON AJOUTER (+)
    // =========================================================================
    // handleAdd: Gère les clics sur les boutons "△" (ajouter)
    //
    // Paramètre:
    //   - idx: Index de la colonne cliquée (0=unités, 1=dizaines, 2=centaines, 3=milliers)
    //
    // Logique:
    // 1. Vérifie que l'action est autorisée (pas en auto-comptage, colonne débloquée, etc.)
    // 2. Incrémente la valeur de la colonne
    // 3. Gère les retenues automatiques (9+1 = 0 dans cette colonne, +1 dans la suivante)
    // 4. Affiche des messages pédagogiques adaptés à la phase actuelle
    // 5. Transite vers la phase suivante si nécessaire (ex: après avoir atteint 9)
    //
    // Phases spéciales gérées:
    // - intro-welcome / intro-discover: Introduction à la machine
    // - intro-add-roll: Déverrouillage des dizaines
    // - tutorial: Premiers pas avec les boutons
    // - explore-units: Apprentissage des nombres de 1 à 3
    // - click-add: Compter jusqu'à 9
    // - challenge-unit-*: Défis des unités
    // - learn-carry: Apprentissage de la retenue (9+1 = 10)
    // =========================================================================
    handleAdd: (idx: number) => {
        const { isCountingAutomatically, isTransitioningToChallenge, phase, columns, addClicks, sequenceFeedback } = get();
        const totalNumber = columns.reduce((acc: number, col: Column, idx: number) => acc + col.value * Math.pow(10, idx), 0);

        if (isCountingAutomatically || isTransitioningToChallenge) return;

        const isUnitsColumn = (i: number) => i === 0;

        // Handle intro phases
        if (phase === 'intro-welcome') {
            sequenceFeedback(
                "Oh, tu es là ? Je ne t'avais pas entendu arriver avec tout ce bruit !",
                "J'étais justement en train de terminer la nouvelle invention qui va nous permettre de compter toutes sortes de choses."
            );
            setTimeout(() => {
                sequenceFeedback(
                    "Tu es prêt à la découvrir ?",
                    "Tadaaaaa ! Comment tu la trouves ?"
                );
                setTimeout(() => {
                    set({ phase: 'intro-discover' });
                    get().updateInstruction();
                }, FEEDBACK_DELAY * 2);
            }, FEEDBACK_DELAY * 2);
            return;
        } else if (phase === 'intro-discover') {
            sequenceFeedback(
                "Bon, elle peut paraître un peu compliquée comme ça, mais elle n'aura bientôt plus de secrets pour toi !",
                "Grâce à cette machine bizarre, nous allons comprendre comment fonctionnent les nombres."
            );
            setTimeout(() => {
                sequenceFeedback(
                    "Et hop, je vais la mettre en route pour que tu puisses appuyer sur ses boutons.",
                    "Vas-y clique sur les boutons + et – pour voir ce qu'il se passe."
                );
                setTimeout(() => {
                    const newCols = [...columns];
                    newCols[0].value = 0;
                    set({ columns: newCols });
                    get().setFeedback("Essaie d'afficher le chiffre le plus grand possible en cliquant sur △ !");
                }, FEEDBACK_DELAY * 2);
            }, FEEDBACK_DELAY * 2);
            return;
        }

        const currentPhaseForCheck = get().phase;
        const isAllowedColumn = () => {
            if (currentPhaseForCheck === 'intro-discover' || currentPhaseForCheck === 'intro-add-roll') return isUnitsColumn(idx);
            if (currentPhaseForCheck === 'normal') return true;
            if (isUnitsColumn(idx)) return true;
            if (idx === 1 && (currentPhaseForCheck.startsWith('challenge-tens-') || currentPhaseForCheck === 'learn-tens-combination')) return true;
            if ((idx === 1 || idx === 2) && (currentPhaseForCheck.startsWith('challenge-hundreds-') || currentPhaseForCheck === 'learn-hundreds-combination')) return true;
            if ((idx === 1 || idx === 2 || idx === 3) && (currentPhaseForCheck.startsWith('challenge-thousands-') || currentPhaseForCheck === 'learn-thousands-combination')) return true;
            if (currentPhaseForCheck === 'learn-carry') return isUnitsColumn(idx);
            return false;
        };

        if (!isAllowedColumn()) {
            get().setFeedback("Concentrons-nous sur les colonnes actives pour l'instant !");
            return;
        }

        if (totalNumber >= 9999) return;

        const newCols = JSON.parse(JSON.stringify(columns));
        newCols[idx].value++;
        let hasCarry = false;

        for (let i = idx; i < newCols.length; i++) {
            if (newCols[i].value > 9) {
                newCols[i].value = 0;
                if (i + 1 < newCols.length) {
                    newCols[i + 1].value++;
                    hasCarry = true;
                }
            }
        }

        set({ columns: newCols });

        const { resetUnitChallenge } = get();
        const currentPhase = get().phase;

        if (currentPhase === 'intro-discover' && isUnitsColumn(idx)) {
            const unitsValue = newCols[0].value;
            if (unitsValue === 9) {
                sequenceFeedback(
                    "Et voilà, on a rempli la machine !",
                    "Tu as vu comme les lumières s'allument en même temps que les chiffres changent ?"
                );
                setTimeout(() => {
                    set({ showInputField: true, phase: 'intro-question-digits' });
                    get().updateInstruction();
                }, FEEDBACK_DELAY * 2);
            } else if (unitsValue > 0) {
                get().setFeedback(`${unitsValue}... Continue à cliquer sur △ !`);
            }
        } else if (currentPhase === 'intro-add-roll') {
            const unitsValue = newCols[0].value;
            if (unitsValue === 9) {
                sequenceFeedback(
                    "Je sais, nous allons devoir la modifier pour qu'elle ait une place de plus. Rajoutons un rouleau !",
                    "Je vais l'allumer pour que tu puisses la tester."
                );
                setTimeout(() => {
                    // Unlock the tens column
                    const updatedCols = [...newCols];
                    updatedCols[1].unlocked = true;
                    updatedCols[0].value = 0;
                    set({ columns: updatedCols });
                    sequenceFeedback(
                        "Et voilà le travail ! Tu as vu comment les lumières ont voyagé ?",
                        "Elles se regroupent pour n'allumer qu'une autre lumière du rouleau suivant. C'est un peu comme si chaque lumière du nouveau rouleau avait dix petites lumières à l'intérieur."
                    );
                    setTimeout(() => {
                        set({ showInputField: true, phase: 'intro-question-max' });
                        get().updateInstruction();
                    }, FEEDBACK_DELAY * 2);
                }, FEEDBACK_DELAY * 2);
            } else if (unitsValue > 0) {
                get().setFeedback(`${unitsValue}... Continue à cliquer sur △ jusqu'à 9 !`);
            }
        } else if (currentPhase === 'tutorial') {
            const unitsValue = newCols[0].value;
            if (unitsValue === 1) sequenceFeedback("Bravo ! 🎉 Tu as cliqué sur le bouton VERT ! Un joli rond bleu est apparu !", "Ce rond bleu, c'est comme une bille. Clique encore sur △ pour en ajouter !");
            else if (unitsValue === 2) sequenceFeedback("Super ! 🎉 Maintenant il y a DEUX ronds bleus !", "Deux belles billes ! Continue à cliquer sur △ !");
            else if (unitsValue === 3) sequenceFeedback("Magnifique ! 🎉 Essaie le bouton ROUGE (∇) maintenant !", "Le bouton ROUGE fait l'inverse du VERT ! Essaie-le !");
            else if (unitsValue > 3) {
                newCols[0].value = 3;
                set({ columns: newCols });
                get().setFeedback("Maintenant, clique sur le bouton ROUGE (∇) !");
                return;
            }
        } else if (phase === 'explore-units') {
            const unitsValue = newCols[0].value;
            if (unitsValue === 1) sequenceFeedback("HOURRA ! 🎉 **Dis à haute voix : UN !** Lève UN doigt ! 👆", `UN c'est une seule chose ! Clique sur △ pour continuer !`);
            else if (unitsValue === 2) sequenceFeedback("Fantastique ! 🎉 **Dis : DEUX !** Lève DEUX doigts ! ✌️", `DEUX, c'est une paire ! Clique sur △ !`);
            else if (unitsValue === 3) {
                sequenceFeedback("Merveilleux ! 🎉 **Dis : TROIS !** Trois doigts !", `Clique sur △ pour continuer !`);
                setTimeout(() => {
                    set({ phase: 'click-add', feedback: "Bravo ! Continuons jusqu'à 9 ! Clique sur △ !" });
                    get().updateButtonVisibility();
                }, FEEDBACK_DELAY * 1.5);
            } else if (unitsValue > 3) {
                newCols[0].value = 3;
                set({ columns: newCols });
                get().setFeedback("Attends le signal pour continuer !");
                return;
            }
        } else if (phase === 'click-add') {
            const nextValue = newCols[idx].value;
            if (nextValue > 9) {
                newCols[idx].value = 9;
                set({ columns: newCols });
                get().setFeedback("Parfait ! 🎉 Tu as atteint 9 ! Maintenant clique sur ∇ pour descendre à zéro !");
                setTimeout(() => {
                    set({ phase: 'click-remove' });
                    get().updateButtonVisibility();
                    get().setFeedback("Super ! Clique sur ∇ pour enlever les billes jusqu'à zéro !");
                }, FEEDBACK_DELAY);
                return;
            }
            if (nextValue === 9) {
                set({ isTransitioningToChallenge: true, addClicks: addClicks + 1 });
                sequenceFeedback("Magnifique ! 🎉 Tu as atteint 9 !", "Tu es prêt pour l'évaluation !");
                setTimeout(() => {
                    const resetCols = initialColumns.map((col, i) => i === 1 ? { ...col, unlocked: true } : col);
                    resetUnitChallenge();
                    set({
                        columns: resetCols,
                        addClicks: 0,
                        phase: 'challenge-unit-1',
                        isTransitioningToChallenge: false
                    });
                    get().updateButtonVisibility();
                    get().setFeedback(`🎯 DÉFI 1 : Affiche le nombre **${UNIT_CHALLENGES[0].targets[0]}** avec les boutons, puis clique sur VALIDER !`);
                }, FEEDBACK_DELAY * 2);
                return;
            }
            set({ addClicks: addClicks + 1 });
            if (nextValue >= 4 && nextValue <= 8) get().setFeedback(`**${nextValue}** ! Continue avec △ !`);
            else get().setFeedback(`Maintenant **${nextValue}** ! Clique sur △ !`);
            setTimeout(() => get().setFeedback(`${nextValue} billes. Continue avec △ !`), FEEDBACK_DELAY);
        } else if (phase.startsWith('challenge-unit-')) {
            const challengeIndex = parseInt(phase.split('-')[2]) - 1;
            const challenge = UNIT_CHALLENGES[challengeIndex];
            const targetNumber = challenge.targets[get().unitTargetIndex];
            if (newCols[0].value > targetNumber) {
                get().setFeedback(`Oups ! Tu as dépassé ${targetNumber}. Utilise ∇ pour revenir à ${targetNumber} !`);
                return;
            }
        } else if (phase === 'learn-carry' && hasCarry) {
            sequenceFeedback("INCROYABLE ! 🎆 C'est de la MAGIE ! 10 billes sont devenues 1 bille dans la colonne suivante !", "C'est la RÈGLE D'OR : 10 billes = 1 bille dans la colonne de gauche !");
            setTimeout(() => {
                const resetCols = initialColumns.map((col, i) => i === 1 ? { ...col, unlocked: true } : col);
                set({
                    columns: resetCols,
                    phase: 'learn-tens',
                    pendingAutoCount: true,
                    isCountingAutomatically: false
                });
                get().updateButtonVisibility();
                sequenceFeedback("Bravo ! 🎉 Maintenant on va apprendre les DIZAINES !", "Observe comment la machine compte par dizaines : 10, 20, 30... !");
            }, FEEDBACK_DELAY * 2);
        } else if (phase === 'normal' && hasCarry) {
            get().setFeedback("Échange magique ! 10 billes → 1 bille dans la colonne de gauche ! 🎩");
        } else if (phase === 'normal' || phase === 'done' || phase === 'learn-units') {
            get().setFeedback(`🎈 ${newCols[idx].value} bille${newCols[idx].value > 1 ? 's' : ''} dans ${newCols[idx].name}. Clique sur △ ou ∇ !`);
        }
    },

    // =========================================================================
    // GESTION DU BOUTON SOUSTRAIRE (-)
    // =========================================================================
    // handleSubtract: Gère les clics sur les boutons "∇" (soustraire)
    //
    // Paramètre:
    //   - idx: Index de la colonne cliquée (0=unités, 1=dizaines, 2=centaines, 3=milliers)
    //
    // Logique:
    // 1. Vérifie que l'action est autorisée (pas en auto-comptage, colonne débloquée, etc.)
    // 2. Décrémente la valeur de la colonne
    // 3. Gère les emprunts automatiques (0-1 nécessite d'emprunter à la colonne suivante)
    //    Exemple: 10 - 1 = 09 (emprunte 1 aux dizaines, ajoute 10 aux unités)
    // 4. Affiche des messages pédagogiques adaptés à la phase actuelle
    // 5. Transite vers la phase suivante si nécessaire (ex: après avoir atteint 0)
    //
    // Phases spéciales gérées:
    // - tutorial: Premiers pas avec le bouton soustraire
    // - explore-units: Évite de soustraire pendant l'apprentissage de l'addition
    // - click-remove: Compter à rebours de 9 à 0
    // =========================================================================
    handleSubtract: (idx: number) => {
        const { isCountingAutomatically, phase, columns } = get();
        const totalNumber = columns.reduce((acc: number, col: Column, idx: number) => acc + col.value * Math.pow(10, idx), 0);
        const { sequenceFeedback, resetUnitChallenge } = get();

        if (isCountingAutomatically) return;

        const isUnitsColumn = (i: number) => i === 0;

        const isAllowedColumn = () => {
            if (phase === 'normal') return true;
            if (isUnitsColumn(idx)) return true;
            if (idx === 1 && (phase.startsWith('challenge-tens-') || phase === 'learn-tens-combination')) return true;
            if ((idx === 1 || idx === 2) && (phase.startsWith('challenge-hundreds-') || phase === 'learn-hundreds-combination')) return true;
            if ((idx === 1 || idx === 2 || idx === 3) && (phase.startsWith('challenge-thousands-') || phase === 'learn-thousands-combination')) return true;
            return false;
        };

        if (!isAllowedColumn()) {
            get().setFeedback("Concentrons-nous sur les colonnes actives pour l'instant !");
            return;
        }

        if (totalNumber <= 0) {
            sequenceFeedback("C'est **ZÉRO** (0) ! 🎯 Il n'y a plus rien. On ne peut pas descendre plus bas !", "ZÉRO = aucune bille, aucune quantité !");
            return;
        }

        const newCols = JSON.parse(JSON.stringify(columns));
        const tempTotalBefore = totalNumber;
        let hasBorrow = false;

        if (newCols[idx].value > 0) {
            newCols[idx].value--;
        } else {
            let sourceIdx = idx + 1;
            while (sourceIdx < newCols.length && newCols[sourceIdx].value === 0) {
                sourceIdx++;
            }
            if (sourceIdx < newCols.length) {
                newCols[sourceIdx].value--;
                hasBorrow = true;
                for (let i = sourceIdx - 1; i >= idx; i--) {
                    newCols[i].value = 9;
                }
            }
        }

        if (tempTotalBefore > 0) {
            set({ columns: newCols });
            if (!['click-remove', 'tutorial', 'explore-units'].includes(phase) && !phase.startsWith('challenge-unit-')) {
                get().setFeedback(`🎈 ${newCols[idx].value} bille${newCols[idx].value > 1 ? 's' : ''} dans ${newCols[idx].name}. Clique sur △ ou ∇ !`);
            }
        }

        if (phase === 'tutorial') {
            const unitsValue = newCols[0].value;
            if (unitsValue === 2) sequenceFeedback("Génial ! 🎈 Le bouton ROUGE enlève une bille ! Il en reste deux !", "VERT ajoute, ROUGE enlève. Facile ! Clique encore sur ∇ !");
            else if (unitsValue === 1) sequenceFeedback("Bravo ! Clique encore sur ROUGE pour tout enlever !", "Plus qu'une bille ! Un dernier clic !");
            else if (unitsValue === 0 && tempTotalBefore === 1) {
                sequenceFeedback("Extraordinaire ! 🎉 Tu maîtrises les deux boutons ! Je vais t'apprendre les **NOMBRES** !", "Prépare-toi pour une grande aventure !");
                setTimeout(() => {
                    set({
                        columns: initialColumns.map(col => ({ ...col })),
                        nextPhaseAfterAuto: 'explore-units',
                        phase: 'learn-units',
                        pendingAutoCount: true
                    });
                    get().updateButtonVisibility();
                    sequenceFeedback("Bienvenue dans le monde des NOMBRES ! ✨ Un nombre dit COMBIEN il y a de choses.", "Regarde ! 👀 La machine compte de 1 à 9. Compte avec tes doigts !");
                }, FEEDBACK_DELAY * 2);
            } else if (unitsValue > 0) {
                sequenceFeedback(`Bien joué ! Continue à cliquer sur ROUGE !`, "Le bouton ROUGE retire une bille à chaque fois !");
            }
        } else if (phase === 'explore-units' && newCols[0].value < columns[0].value) {
            get().setFeedback("On n'enlève pas encore ! Clique sur △ pour ajouter !");
        } else if (phase === 'click-remove' && isUnitsColumn(idx)) {
            const unitsValue = newCols[0].value;
            if (unitsValue === 5) sequenceFeedback(`**${unitsValue}** (CINQ) ! ✋ Une main entière !`, `Bien joué ! Continue avec ∇ !`);
            else if (unitsValue === 3) sequenceFeedback(`**${unitsValue}** (TROIS) ! 🎈`, `Continue vers zéro avec ∇ !`);
            else if (unitsValue === 2) sequenceFeedback(`**${unitsValue}** (DEUX) ! ✌️`, `Presque à zéro ! Continue avec ∇ !`);
            else if (unitsValue === 1) sequenceFeedback(`**${unitsValue}** (UN) ! 👆`, `Presque à ZÉRO ! Un dernier clic !`);
            else if (unitsValue === 0 && tempTotalBefore === 1) {
                sequenceFeedback("**ZÉRO** (0) ! 🎉 Plus rien ! On est revenu au début !", "Fantastique ! Tu maîtrises les nombres de 0 à 9 !");
                setTimeout(() => {
                    const newCols = initialColumns.map((col, i) => i === 1 ? { ...col, unlocked: true } : col);
                    resetUnitChallenge();
                    set({
                        columns: newCols,
                        phase: 'challenge-unit-1'
                    });
                    get().updateButtonVisibility();
                    get().setFeedback(`Bravo ! 🎉 Maintenant, DÉFI 1 : Affiche le nombre **${UNIT_CHALLENGES[0].targets[0]}** avec les boutons, puis clique sur VALIDER !`);
                }, FEEDBACK_DELAY);
            } else if (unitsValue > 0) {
                sequenceFeedback(`**${unitsValue}** ! Baisse un doigt !`, `${unitsValue} doigts levés. Continue avec ∇ !`);
            }
        } else if (phase === 'normal' && hasBorrow) {
            get().setFeedback("🔄 Emprunt magique ! Continue avec ∇ si nécessaire !");
        }
    },

    // =========================================================================
    // VALIDATION DES DÉFIS DES UNITÉS
    // =========================================================================
    // handleValidateLearning: Vérifie si l'utilisateur a correctement affiché le nombre demandé
    // dans les défis des unités (challenge-unit-1, challenge-unit-2, challenge-unit-3)
    //
    // Logique:
    // 1. Vérifie que la valeur affichée correspond à la cible
    // 2. Si correct:
    //    - Incrémente le compteur de réussites
    //    - Passe à la cible suivante OU au défi suivant OU à la phase learn-carry
    //    - Affiche un message de félicitations
    // 3. Si incorrect:
    //    - Affiche un message d'encouragement
    //
    // Progression:
    // - Après challenge-unit-3 → learn-carry (apprentissage de la retenue)
    // =========================================================================
    handleValidateLearning: () => {
        const { phase, columns, unitTargetIndex, unitSuccessCount, sequenceFeedback, resetUnitChallenge } = get();
        const challengePhases = ['challenge-unit-1', 'challenge-unit-2', 'challenge-unit-3'] as const;
        const challengeIndex = challengePhases.indexOf(phase as typeof challengePhases[number]);
        if (challengeIndex === -1) return;

        const challenge = UNIT_CHALLENGES[challengeIndex];
        const targetNumber = challenge.targets[unitTargetIndex];
        const currentNumber = columns[0].value;

        if (currentNumber === targetNumber) {
            const newSuccessCount = unitSuccessCount + 1;
            set({ unitSuccessCount: newSuccessCount });

            if (unitTargetIndex + 1 >= challenge.targets.length) {
                if (challengeIndex === UNIT_CHALLENGES.length - 1) {
                    get().setFeedback("🎉 TOUS LES DÉFIS RÉUSSIS ! Bravo ! Tu maîtrises les unités !");
                    setTimeout(() => {
                        set({ phase: 'learn-carry' });
                        get().updateButtonVisibility();
                        sequenceFeedback("Prêt pour la magie ? 🎩 Clique sur △ pour l'échange 10 pour 1 !", "Vas-y ! Clique sur △ pour voir la transformation !");
                    }, FEEDBACK_DELAY);
                } else {
                    get().setFeedback(`✅ DÉFI ${challengeIndex + 1} TERMINÉ ! Bravo !`);
                    setTimeout(() => {
                        const resetCols = initialColumns.map((col, i) => i === 1 ? { ...col, unlocked: true } : col);
                        resetUnitChallenge();
                        const nextPhase = challengePhases[challengeIndex + 1];
                        set({
                            columns: resetCols,
                            phase: nextPhase
                        });
                        get().setFeedback(`🎯 DÉFI ${challengeIndex + 2} : Affiche le nombre **${UNIT_CHALLENGES[challengeIndex + 1].targets[0]}** puis clique sur VALIDER !`);
                    }, FEEDBACK_DELAY);
                }
            } else {
                get().setFeedback("✅ Correct ! Bravo !");
                setTimeout(() => {
                    const resetCols = initialColumns.map((col, i) => i === 1 ? { ...col, unlocked: true } : col);
                    set({
                        columns: resetCols,
                        unitTargetIndex: unitTargetIndex + 1
                    });
                    get().setFeedback(`🎯 DÉFI ${challengeIndex + 1} : Affiche le nombre **${challenge.targets[unitTargetIndex + 1]}** puis clique sur VALIDER ! (${newSuccessCount}/${challenge.targets.length})`);
                }, FEEDBACK_DELAY);
            }
        } else {
            get().setFeedback(`Pas encore ! Il faut ${targetNumber}. Utilise △ et ∇ !`);
        }
    },

    // =========================================================================
    // VALIDATION DES DÉFIS DES DIZAINES
    // =========================================================================
    // handleValidateTens: Vérifie si l'utilisateur a correctement affiché le nombre demandé
    // dans les défis des dizaines (challenge-tens-1, challenge-tens-2, challenge-tens-3)
    //
    // Logique similaire à handleValidateLearning mais:
    // - Vérifie le nombre total (dizaines + unités) au lieu de juste les unités
    // - Après challenge-tens-3 → learn-hundreds (débloque les centaines)
    // - Marque completedChallenges.tens = true
    // =========================================================================
    handleValidateTens: () => {
        const { phase, columns, tensTargetIndex, tensSuccessCount, sequenceFeedback, resetTensChallenge } = get();
        const totalNumber = columns.reduce((acc: number, col: Column, idx: number) => acc + col.value * Math.pow(10, idx), 0);
        const challengePhases = ['challenge-tens-1', 'challenge-tens-2', 'challenge-tens-3'] as const;
        const challengeIndex = challengePhases.indexOf(phase as typeof challengePhases[number]);
        if (challengeIndex === -1) return;

        const challenge = TENS_CHALLENGES[challengeIndex];
        const targetNumber = challenge.targets[tensTargetIndex];

        if (totalNumber === targetNumber) {
            const newSuccessCount = tensSuccessCount + 1;
            set({ tensSuccessCount: newSuccessCount });

            if (tensTargetIndex + 1 >= challenge.targets.length) {
                if (challengeIndex === TENS_CHALLENGES.length - 1) {
                    get().setFeedback("🎉 TOUS LES DÉFIS RÉUSSIS ! Bravo ! Tu maîtrises les dizaines !");
                    set((state: MachineState) => ({ completedChallenges: { ...state.completedChallenges, tens: true } }));
                    setTimeout(() => {
                        const newCols = [...get().columns];
                        if (!newCols[2].unlocked) {
                            newCols[2].unlocked = true;
                            set({ columns: newCols });
                        }
                        const resetCols = initialColumns.map((col, i) => (i === 1 || i === 2) ? { ...col, unlocked: true } : col);
                        set({
                            columns: resetCols,
                            phase: 'learn-hundreds',
                            pendingAutoCount: true,
                            isCountingAutomatically: false
                        });
                        get().updateButtonVisibility();
                        sequenceFeedback("APPRENTISSAGE DES DIZAINES TERMINÉ ! Bravo ! 🎉", "NIVEAU DÉBLOQUÉ : Les CENTAINES ! 💯 La machine va compter par centaines : 100, 200, 300... !");
                    }, FEEDBACK_DELAY * 2);
                } else {
                    const nextChallenge = TENS_CHALLENGES[challengeIndex + 1];
                    get().setFeedback(`🎉 DÉFI ${challengeIndex + 1} RÉUSSIE ! Préparé pour le prochain ?`);
                    setTimeout(() => {
                        resetTensChallenge();
                        const resetCols = initialColumns.map((col, i) => i === 1 ? { ...col, unlocked: true } : col);
                        set({
                            phase: nextChallenge.phase,
                            columns: resetCols
                        });
                        get().updateButtonVisibility();
                        get().setFeedback(`🎯 DÉFI ${challengeIndex + 2} : Affiche le nombre **${nextChallenge.targets[0]}** !`);
                    }, FEEDBACK_DELAY * 2);
                }
            } else {
                const nextTarget = challenge.targets[tensTargetIndex + 1];
                const resetCols = initialColumns.map((col, i) => i === 1 ? { ...col, unlocked: true } : col);
                set({ tensTargetIndex: tensTargetIndex + 1, columns: resetCols });
                sequenceFeedback(`✅ Correct ! ${newSuccessCount}/${challenge.targets.length} réussis !`, `Maintenant affiche **${nextTarget}** !`);
            }
        } else {
            get().setFeedback(`Pas encore ! Il faut ${targetNumber}. Réessaie avec △ et ∇ !`);
        }
    },

    // =========================================================================
    // VALIDATION DES DÉFIS DES CENTAINES
    // =========================================================================
    // handleValidateHundreds: Vérifie si l'utilisateur a correctement affiché le nombre demandé
    // dans les défis des centaines (challenge-hundreds-1, challenge-hundreds-2, challenge-hundreds-3)
    //
    // Logique similaire à handleValidateTens mais:
    // - Après challenge-hundreds-3 → learn-thousands (débloque les milliers)
    // - Marque completedChallenges.hundreds = true
    // =========================================================================
    handleValidateHundreds: () => {
        const { phase, columns, hundredsTargetIndex, hundredsSuccessCount, sequenceFeedback, resetHundredsChallenge } = get();
        const totalNumber = columns.reduce((acc: number, col: Column, idx: number) => acc + col.value * Math.pow(10, idx), 0);
        const challengePhases = ['challenge-hundreds-1', 'challenge-hundreds-2', 'challenge-hundreds-3'] as const;
        const challengeIndex = challengePhases.indexOf(phase as typeof challengePhases[number]);
        if (challengeIndex === -1) return;

        const challenge = HUNDREDS_CHALLENGES[challengeIndex];
        const targetNumber = challenge.targets[hundredsTargetIndex];

        if (totalNumber === targetNumber) {
            const newSuccessCount = hundredsSuccessCount + 1;
            set({ hundredsSuccessCount: newSuccessCount });

            if (hundredsTargetIndex + 1 >= challenge.targets.length) {
                if (challengeIndex === HUNDREDS_CHALLENGES.length - 1) {
                    get().setFeedback("🎉 TOUS LES DÉFIS RÉUSSIS ! Bravo ! Tu maîtrises les centaines !");
                    set((state: MachineState) => ({ completedChallenges: { ...state.completedChallenges, hundreds: true } }));
                    setTimeout(() => {
                        const newCols = [...get().columns];
                        if (!newCols[3].unlocked) {
                            newCols[3].unlocked = true;
                            set({ columns: newCols });
                        }
                        const resetCols = columns.map((col: Column) => ({ ...col, unlocked: true }));
                        set({
                            columns: resetCols,
                            phase: 'learn-thousands',
                            pendingAutoCount: true,
                            isCountingAutomatically: false
                        });
                        get().updateButtonVisibility();
                        sequenceFeedback("APPRENTISSAGE DES CENTAINES TERMINÉ ! Bravo ! 🎉", "NIVEAU MAXIMUM : Les MILLIERS ! 🎉 La machine va compter par milliers : 1000, 2000, 3000... !");
                    }, FEEDBACK_DELAY * 2);
                } else {
                    const nextChallenge = HUNDREDS_CHALLENGES[challengeIndex + 1];
                    get().setFeedback(`🎉 DÉFI ${challengeIndex + 1} RÉUSSIE ! Préparé pour le prochain ?`);
                    setTimeout(() => {
                        resetHundredsChallenge();
                        const resetCols = initialColumns.map((col, i) => (i === 1 || i === 2) ? { ...col, unlocked: true } : col);
                        set({
                            phase: nextChallenge.phase,
                            columns: resetCols
                        });
                        get().updateButtonVisibility();
                        get().setFeedback(`🎯 DÉFI ${challengeIndex + 2} : Affiche le nombre **${nextChallenge.targets[0]}** !`);
                    }, FEEDBACK_DELAY * 2);
                }
            } else {
                const nextTarget = challenge.targets[hundredsTargetIndex + 1];
                const resetCols = initialColumns.map((col, i) => (i === 1 || i === 2) ? { ...col, unlocked: true } : col);
                set({ hundredsTargetIndex: hundredsTargetIndex + 1, columns: resetCols });
                sequenceFeedback(`✅ Correct ! ${newSuccessCount}/${challenge.targets.length} réussis !`, `Maintenant affiche **${nextTarget}** !`);
            }
        } else {
            get().setFeedback(`Pas encore ! Il faut ${targetNumber}. Réessaie avec △ et ∇ !`);
        }
    },

    // =========================================================================
    // VALIDATION DES DÉFIS DES MILLIERS
    // =========================================================================
    // handleValidateThousands: Vérifie si l'utilisateur a correctement affiché le nombre demandé
    // dans les défis des milliers (challenge-thousands-1, challenge-thousands-2, challenge-thousands-3)
    //
    // Logique similaire aux autres validations mais:
    // - Après challenge-thousands-3 → 'normal' (mode libre)
    // - Marque completedChallenges.thousands = true
    // - L'utilisateur a terminé tout le parcours pédagogique 🎉
    // =========================================================================
    handleValidateThousands: () => {
        const { phase, columns, thousandsTargetIndex, thousandsSuccessCount, sequenceFeedback, resetThousandsChallenge } = get();
        const totalNumber = columns.reduce((acc: number, col: Column, idx: number) => acc + col.value * Math.pow(10, idx), 0);
        const challengePhases = ['challenge-thousands-1', 'challenge-thousands-2', 'challenge-thousands-3'] as const;
        const challengeIndex = challengePhases.indexOf(phase as typeof challengePhases[number]);
        if (challengeIndex === -1) return;

        const challenge = THOUSANDS_CHALLENGES[challengeIndex];
        const targetNumber = challenge.targets[thousandsTargetIndex];

        if (totalNumber === targetNumber) {
            const newSuccessCount = thousandsSuccessCount + 1;
            set({ thousandsSuccessCount: newSuccessCount });

            if (thousandsTargetIndex + 1 >= challenge.targets.length) {
                if (challengeIndex === THOUSANDS_CHALLENGES.length - 1) {
                    get().setFeedback("🎉 TOUS LES DÉFIS RÉUSSIS ! Bravo ! Tu maîtrises les milliers !");
                    set((state: MachineState) => ({ completedChallenges: { ...state.completedChallenges, thousands: true } }));
                    setTimeout(() => {
                        set({ phase: 'normal' });
                        get().updateButtonVisibility();
                        sequenceFeedback("APPRENTISSAGE DES MILLIERS TERMINÉ ! Bravo ! 🎉 Tu es un expert des nombres !", "🏆 Tu peux maintenant créer n'importe quel nombre jusqu'à 9999 !", FEEDBACK_DELAY / 1.5);
                    }, FEEDBACK_DELAY * 2);
                } else {
                    const nextChallenge = THOUSANDS_CHALLENGES[challengeIndex + 1];
                    get().setFeedback(`🎉 DÉFI ${challengeIndex + 1} RÉUSSIE ! Préparé pour le prochain ?`);
                    setTimeout(() => {
                        resetThousandsChallenge();
                        const resetCols = get().columns.map((col: Column) => ({ ...col, unlocked: true }));
                        set({
                            phase: nextChallenge.phase,
                            columns: resetCols
                        });
                        get().updateButtonVisibility();
                        get().setFeedback(`🎯 DÉFI ${challengeIndex + 2} : Affiche le nombre **${nextChallenge.targets[0]}** !`);
                    }, FEEDBACK_DELAY * 2);
                }
            } else {
                const nextTarget = challenge.targets[thousandsTargetIndex + 1];
                const resetCols = get().columns.map((col: Column) => ({ ...col, unlocked: true }));
                set({ thousandsTargetIndex: thousandsTargetIndex + 1, columns: resetCols });
                sequenceFeedback(`✅ Correct ! ${newSuccessCount}/${challenge.targets.length} réussis !`, `Maintenant affiche **${nextTarget}** !`);
            }
        } else {
            get().setFeedback(`Pas encore ! Il faut ${targetNumber}. Réessaie avec △ et ∇ !`);
        }
    },

    // =========================================================================
    // MISE À JOUR DE L'INSTRUCTION PÉDAGOGIQUE
    // =========================================================================
    // updateInstruction: Met à jour le texte d'instruction affiché dans l'assistant
    // en fonction de la phase actuelle.
    //
    // L'instruction est le message principal qui guide l'utilisateur.
    // Elle est différente du feedback qui réagit aux actions de l'utilisateur.
    //
    // Pour chaque phase, définit:
    // - Un message d'introduction ou d'explication
    // - Les objectifs à atteindre
    // - Les consignes d'action
    //
    // L'instruction est automatiquement ajoutée à la file d'attente de messages
    // pour créer un effet de frappe progressive.
    // =========================================================================
    updateInstruction: () => {
        const { phase, unitTargetIndex, unitSuccessCount, tensTargetIndex, tensSuccessCount, hundredsTargetIndex, hundredsSuccessCount, thousandsTargetIndex, thousandsSuccessCount, instruction: oldInstruction, enqueueMessage } = get();
        let newInstruction = "";
        switch (phase) {
            // ... (cases from your existing updateInstruction)
            case 'intro-welcome':
                newInstruction = "(Bruits de marteau sur du métal et de perceuse) Paf, Crac… Bim… Tchac ! Quel vacarme ! Voilà, j'ai terminé ma nouvelle machine !";
                break;
            case 'intro-discover':
                newInstruction = "Oh, tu es là ? Je ne t'avais pas entendu arriver avec tout ce bruit ! J'étais justement en train de terminer la nouvelle invention qui va nous permettre de compter toutes sortes de choses.";
                break;
            case 'intro-question-digits':
                newInstruction = "Te rappelles-tu combien de chiffres différents tu as vu ? (Saisis ta réponse)";
                break;
            case 'intro-add-roll':
                newInstruction = "Bon, tout ça c'est très bien, mais comment va-t-on faire pour utiliser cette machine lorsque je veux compter plus haut que 9 ? Pour l'instant elle bloque !";
                break;
            case 'intro-question-max':
                newInstruction = "Jusqu'à combien peut-on compter maintenant ? (Saisis ta réponse)";
                break;
            case 'tutorial':
                newInstruction = "Bienvenue ! Clique sur △ pour découvrir la machine !";
                break;
            case 'explore-units':
                newInstruction = "Clique sur △ pour ajouter une bille. Lève UN doigt à chaque clic. Répète : UN, DEUX, TROIS !";
                break;
            case 'click-add':
                newInstruction = "Continue jusqu'à 9 ! Chaque clic ajoute UNE bille !";
                break;
            case 'click-remove':
                newInstruction = "Clique sur ∇ pour enlever les billes jusqu'à ZÉRO !";
                break;
            case 'done':
                newInstruction = "Génial ! Clique sur 'Commencer l'apprentissage' pour découvrir l'échange 10 pour 1 ! 🎩";
                break;
            case 'learn-units':
                newInstruction = "Regarde ! 👀 La machine compte de 1 à 9. Compte avec tes doigts !";
                break;
            case 'challenge-unit-1':
            case 'challenge-unit-2':
            case 'challenge-unit-3': {
                const challengeIndex = ['challenge-unit-1', 'challenge-unit-2', 'challenge-unit-3'].indexOf(phase);
                const challenge = UNIT_CHALLENGES[challengeIndex];
                const targetNumber = challenge.targets[unitTargetIndex];
                newInstruction = `DÉFI ${challengeIndex + 1} : Affiche **${targetNumber}** puis clique sur VALIDER ! (${unitSuccessCount}/${challenge.targets.length})`;
                break;
            }
            case 'learn-carry':
                newInstruction = "C'est le grand moment ! 🎆 Clique sur △ pour voir la transformation !";
                break;
            case 'learn-tens':
                newInstruction = "Regarde ! 👀 La machine compte par dizaines : 10, 20, 30...";
                break;
            case 'learn-tens-combination':
                newInstruction = "🎯 Observe comment on combine dizaines et unités pour former des nombres !";
                break;
            case 'challenge-tens-1':
            case 'challenge-tens-2':
            case 'challenge-tens-3': {
                const challengeIndex = ['challenge-tens-1', 'challenge-tens-2', 'challenge-tens-3'].indexOf(phase);
                const challenge = TENS_CHALLENGES[challengeIndex];
                const targetNumber = challenge.targets[tensTargetIndex];
                newInstruction = `DÉFI ${challengeIndex + 1} : Affiche **${targetNumber}** puis clique sur VALIDER ! (${tensSuccessCount}/${challenge.targets.length})`;
                break;
            }
            case 'learn-hundreds':
                newInstruction = "Regarde ! 👀 La machine compte par centaines : 100, 200, 300...";
                break;
            case 'learn-hundreds-combination':
                newInstruction = "🎯 Observe comment on combine centaines, dizaines et unités !";
                break;
            case 'challenge-hundreds-1':
            case 'challenge-hundreds-2':
            case 'challenge-hundreds-3': {
                const challengeIndex = ['challenge-hundreds-1', 'challenge-hundreds-2', 'challenge-hundreds-3'].indexOf(phase);
                const challenge = HUNDREDS_CHALLENGES[challengeIndex];
                const targetNumber = challenge.targets[hundredsTargetIndex];
                newInstruction = `DÉFI ${challengeIndex + 1} : Affiche **${targetNumber}** puis clique sur VALIDER ! (${hundredsSuccessCount}/${challenge.targets.length})`;
                break;
            }
            case 'learn-thousands':
                newInstruction = "Regarde ! 👀 La machine compte par milliers : 1000, 2000, 3000...";
                break;
            case 'learn-thousands-combination':
                newInstruction = "🎯 Observe comment on combine tous les chiffres pour former des grands nombres !";
                break;
            case 'challenge-thousands-1':
            case 'challenge-thousands-2':
            case 'challenge-thousands-3': {
                const challengeIndex = ['challenge-thousands-1', 'challenge-thousands-2', 'challenge-thousands-3'].indexOf(phase);
                const challenge = THOUSANDS_CHALLENGES[challengeIndex];
                const targetNumber = challenge.targets[thousandsTargetIndex];
                newInstruction = `DÉFI ${challengeIndex + 1} : Affiche **${targetNumber}** puis clique sur VALIDER ! (${thousandsSuccessCount}/${challenge.targets.length})`;
                break;
            }
            case 'normal':
                newInstruction = "Mode exploration ! 🚀 Construis des grands nombres !";
                break;
            default:
                newInstruction = "Prépare-toi pour l'aventure des nombres !";
        }
        
        if (newInstruction && newInstruction !== oldInstruction) {
            set({ instruction: newInstruction });
            enqueueMessage({ kind: 'instruction', text: newInstruction });
        }
    },

    // =========================================================================
    // DÉMARRAGE DE LA PHASE D'APPRENTISSAGE
    // =========================================================================
    // startLearningPhase: Lance l'apprentissage des nombres avec auto-comptage
    // Appelé quand l'utilisateur clique sur "Commencer l'apprentissage"
    //
    // Configure:
    // - La phase 'learn-units' (apprentissage des nombres 1-9)
    // - Le mode auto-comptage (la machine compte automatiquement)
    // - Les messages pédagogiques
    // =========================================================================
    startLearningPhase: () => {
        const { phase, sequenceFeedback } = get();
        if (phase === 'done') {
            const newCols = initialColumns.map((col, i) => i === 1 ? { ...col, unlocked: true } : col);
            set({
                columns: newCols,
                nextPhaseAfterAuto: 'challenge-unit-1',
                phase: 'learn-units',
                pendingAutoCount: true,
                isCountingAutomatically: false
            });
            get().updateButtonVisibility();
            sequenceFeedback("C'est parti ! 🎉 La machine va compter de 1 à 9 !", "Observe bien les billes ! Compte avec tes doigts !");
        }
    },

    // =========================================================================
    // DÉVERROUILLAGE DE LA COLONNE SUIVANTE
    // =========================================================================
    // unlockNextColumn: Déverrouille la prochaine colonne (dizaines, centaines ou milliers)
    // Appelé quand l'utilisateur clique sur "Débloquer la colonne suivante"
    //
    // Vérifie:
    // - Que les défis précédents sont complétés (completedChallenges)
    // - Lance la phase d'apprentissage correspondante (learn-*)
    //
    // Progression:
    // - Dizaines: nécessite completedChallenges.tens = true
    // - Centaines: nécessite completedChallenges.tens = true
    // - Milliers: nécessite completedChallenges.hundreds = true
    // =========================================================================
    unlockNextColumn: () => {
        const { columns, completedChallenges, sequenceFeedback } = get();
        const nextIdx = columns.findIndex((col: Column, i: number) => !col.unlocked && i > 0);
        if (nextIdx !== -1) {
            const newCols = [...columns];
            if (nextIdx === 1 && !completedChallenges.tens) {
                get().setFeedback("⚠️ Tu dois d'abord compléter le défi des dizaines !");
                return;
            } else if (nextIdx === 2) {
                if (!completedChallenges.tens) {
                    get().setFeedback("⚠️ Tu dois d'abord maîtriser les dizaines !");
                    return;
                }
                newCols[nextIdx].unlocked = true;
                set({ columns: newCols });
                setTimeout(() => {
                    const resetCols = initialColumns.map((col, i) => (i === 1 || i === 2) ? { ...col, unlocked: true } : col);
                    set({
                        columns: resetCols,
                        phase: 'learn-hundreds',
                        pendingAutoCount: true,
                        isCountingAutomatically: false
                    });
                    get().updateButtonVisibility();
                    sequenceFeedback("NIVEAU DÉBLOQUÉ : Les CENTAINES ! 💯", "Regarde ! 👀 La machine va compter par centaines : 100, 200, 300... !");
                }, FEEDBACK_DELAY);
            } else if (nextIdx === 3) {
                if (!completedChallenges.hundreds) {
                    get().setFeedback("⚠️ Tu dois d'abord maîtriser les centaines !");
                    return;
                }
                newCols[nextIdx].unlocked = true;
                set({ columns: newCols });
                setTimeout(() => {
                    const resetCols = columns.map((col: Column) => ({ ...col, unlocked: true }));
                    set({
                        columns: resetCols,
                        phase: 'learn-thousands',
                        pendingAutoCount: true,
                        isCountingAutomatically: false
                    });
                    get().updateButtonVisibility();
                    sequenceFeedback("NIVEAU MAXIMUM : Les MILLIERS ! 🎉", "Regarde ! 👀 La machine va compter par milliers : 1000, 2000, 3000... !");
                }, FEEDBACK_DELAY);
            } else {
                newCols[nextIdx].unlocked = true;
                set({ columns: newCols });
                get().setFeedback(`🔓 Colonne ${newCols[nextIdx].name} débloquée ! Clique sur △ et ∇ pour t'amuser !`);
            }
        }
    },

    // =========================================================================
    // INITIALISATION DU STORE
    // =========================================================================
    // init: Appelé au démarrage de l'application pour afficher l'instruction initiale
    // =========================================================================
    init: () => {
        const { instruction, enqueueMessage } = get();
        if (instruction) {
            enqueueMessage({ kind: 'instruction', text: instruction });
        }
    },

    // =========================================================================
    // SYSTÈME DE FILE D'ATTENTE POUR L'EFFET DE FRAPPE
    // =========================================================================
    // Gère l'affichage progressif des messages avec un effet "machine à écrire".
    // Les messages sont ajoutés à une file d'attente et traités séquentiellement.
    //
    // Fonctionnement:
    // 1. enqueueMessage: Ajoute un message à la file
    // 2. processQueue: Traite la file en affichant chaque message caractère par caractère
    // 3. Attend 3 secondes entre chaque message pour laisser le temps de lire
    //
    // Types de messages:
    // - 'instruction': Message principal (en haut de l'assistant)
    // - 'feedback': Message de réaction (en bas de l'assistant)
    // =========================================================================
    
    // File d'attente des messages à afficher
    queue: [],
    
    // Indicateur si la file est en cours de traitement (évite les doublons)
    isProcessingQueue: false,

    // Ajoute un message à la file et lance le traitement
    enqueueMessage: (message) => {
      set((state) => ({ queue: [...state.queue, message] }));
      get().processQueue();
    },

    // Setter interne pour l'état de traitement
    _setIsProcessingQueue: (isProcessing) => {
      set({ isProcessingQueue: isProcessing });
    },

    // Traite la file d'attente de messages (fonction asynchrone)
    processQueue: async () => {
      const { isProcessingQueue, _setIsProcessingQueue, setTypedInstruction, setTypedFeedback, setIsTypingInstruction, setIsTypingFeedback } = get();
      
      if (isProcessingQueue) return;
      _setIsProcessingQueue(true);

      const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

      while (get().queue.length > 0) {
        const queue = get().queue;
        const item = queue.shift()!;
        set({ queue }); // Update queue after shifting

        setTypedInstruction("");
        setTypedFeedback("");

        if (item.kind === 'instruction') {
          setIsTypingInstruction(true);
          for (let i = 1; i <= item.text.length; i++) {
            setTypedInstruction(item.text.slice(0, i));
            await sleep(18); // TYPING_SPEED
          }
          setIsTypingInstruction(false);
        } else { // feedback
          const prefixed = ` ${item.text}`;
          setIsTypingFeedback(true);
          for (let i = 1; i <= prefixed.length; i++) {
            setTypedFeedback(prefixed.slice(0, i));
            await sleep(18); // TYPING_SPEED
          }
          setIsTypingFeedback(false);
        }

        if (get().queue.length > 0) {
          await sleep(3000); // MESSAGE_READ_DELAY
        }
      }

      _setIsProcessingQueue(false);
    },
}));