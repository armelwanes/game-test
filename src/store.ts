import { create } from 'zustand';
import type {
    MachineState,
    Column,
} from './types.ts';
import {
    FEEDBACK_DELAY,
    UNIT_CHALLENGES,
    TEN_TO_TWENTY_CHALLENGES,
    TENS_CHALLENGES,
    HUNDRED_TO_TWO_HUNDRED_CHALLENGES,
    TWO_HUNDRED_TO_THREE_HUNDRED_CHALLENGES,
    HUNDREDS_CHALLENGES,
    THOUSAND_TO_TWO_THOUSAND_CHALLENGES,
    TWO_THOUSAND_TO_THREE_THOUSAND_CHALLENGES,
    THOUSANDS_SIMPLE_COMBINATION_CHALLENGES,
    THOUSANDS_CHALLENGES
} from './types.ts';
import {
    generateFeedback,
    getSuccessMessage,
    detectFrustration,
    getFrustrationInterventionMessage,
    decomposeNumber,
    getNextGuidedStep,
    getGuidedCompletionMessage,
    getSolutionAnimationStep
} from './feedbackSystem.ts';

export const initialColumns: Column[] = [
    { name: 'Unités', value: 0, unlocked: true, color: 'bg-green-500' },
    { name: 'Dizaines', value: 0, unlocked: false, color: 'bg-blue-500' },
    { name: 'Centaines', value: 0, unlocked: false, color: 'bg-yellow-500' },
    { name: 'Milliers', value: 0, unlocked: false, color: 'bg-red-500' },
];

export const useStore = create<MachineState>((set, get) => ({
    columns: initialColumns,
    phase: 'intro-welcome-personalized',
    addClicks: 0,
    feedback: "",
    instruction: "",
    pendingAutoCount: false,
    isTransitioningToChallenge: false,
    isCountingAutomatically: false,
    nextPhaseAfterAuto: null,
    timer: null,
    completedChallenges: {
        tens: false,
        hundreds: false,
        thousands: false,
    },
    unitTargetIndex: 0,
    unitSuccessCount: 0,
    tenToTwentyTargetIndex: 0,
    tenToTwentySuccessCount: 0,
    practiceTenRepetitions: 0,
    tensTargetIndex: 0,
    tensSuccessCount: 0,
    practiceHundredCount: 0,
    hundredToTwoHundredTargetIndex: 0,
    hundredToTwoHundredSuccessCount: 0,
    twoHundredToThreeHundredTargetIndex: 0,
    twoHundredToThreeHundredSuccessCount: 0,
    hundredsTargetIndex: 0,
    hundredsSuccessCount: 0,
    thousandsTargetIndex: 0,
    thousandsSuccessCount: 0,
    practiceThousandCount: 0,
    thousandToTwoThousandTargetIndex: 0,
    thousandToTwoThousandSuccessCount: 0,
    twoThousandToThreeThousandTargetIndex: 0,
    twoThousandToThreeThousandSuccessCount: 0,
    thousandsSimpleCombinationTargetIndex: 0,
    thousandsSimpleCombinationSuccessCount: 0,
    userInput: "",
    showInputField: false,
    
    // Error management and feedback system
    attemptCount: 0,
    consecutiveFailures: 0,
    frustrationLevel: 'low',
    showHelpOptions: false,
    guidedMode: false,
    guidedStep: 0,
    totalChallengesCompleted: 0,
    helpChoice: null,
    showSolutionAnimation: false,
    solutionAnimationStep: 0,
    currentTarget: 0,
    lastFeedbackMessage: '',

    // Personalization and intro state
    userName: "",
    introClickCount: 0,
    introDigitsAttempt: 0,
    introMaxAttempt: 0,
    showResponseButtons: false,
    selectedResponse: null,

    // Callbacks pour effets visuels/sonores (à connecter côté UI)
    onIntroWelcomeTransition: null,

    // Button visibility
    showUnlockButton: false,
    showStartLearningButton: false,
    showValidateLearningButton: false,
    showValidateTensButton: false,
    showValidateHundredsButton: false,
    showValidateThousandsButton: false,

    // Actions
    setColumns: (updater) => {
        const newColumns = typeof updater === 'function' ? updater(get().columns) : updater;
        set({ columns: newColumns });
        get().updateButtonVisibility();
    },
    setPhase: (phase) => {
        // Nettoyage du timer existant
        const { timer } = get();
        if (timer) {
            clearTimeout(timer);
            set({ timer: null });
        }

        set({ phase });
        console.log('set phase', phase);
        
        // Handle auto-transitions for intro phases
        if (phase === 'intro-welcome-personalized') {
            set({ showInputField: true, feedback: "", instruction: "" });
        } else if (phase === 'intro-discover-machine') {
            set({ showResponseButtons: true, selectedResponse: null });
            // Auto-timeout after 10 seconds if no response
            const newTimer = setTimeout(() => {
                const currentState = get();
                if (currentState.phase === 'intro-discover-machine' && !currentState.selectedResponse) {
                    currentState.setSelectedResponse('timeout');
                    currentState.handleIntroMachineResponse();
                }
            }, 10000);
            set({ timer: newTimer as unknown as number });
        } else if (phase === 'intro-welcome') {
            const newTimer = setTimeout(() => {
                set({ phase: 'intro-discover', timer: null });
                get().updateButtonVisibility();
                get().updateInstruction();
            }, 3000); // ≈ 3 secondes
            set({ timer: newTimer as unknown as number });
        }

        get().updateButtonVisibility();
        get().updateInstruction();
    },
    setAddClicks: (clicks) => set({ addClicks: clicks }),
    setFeedback: (feedback) => set({ feedback }),
    setInstruction: (instruction) => set({ instruction }),
    setPendingAutoCount: (pending) => set({ pendingAutoCount: pending }),
    setIsTransitioningToChallenge: (isTransitioning) => set({ isTransitioningToChallenge: isTransitioning }),
    setIsCountingAutomatically: (isCounting) => set({ isCountingAutomatically: isCounting }),
    setNextPhaseAfterAuto: (phase) => set({ nextPhaseAfterAuto: phase }),
    setCompletedChallenges: (updater) => set((state) => ({ completedChallenges: typeof updater === 'function' ? updater(state.completedChallenges) : updater })),
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
    setTenToTwentyTargetIndex: (index) => {
        set({ tenToTwentyTargetIndex: index });
        get().updateInstruction();
    },
    setTenToTwentySuccessCount: (count) => {
        set({ tenToTwentySuccessCount: count });
        get().updateInstruction();
    },
    setPracticeTenRepetitions: (count) => {
        set({ practiceTenRepetitions: count });
    },
    setPracticeHundredCount: (count) => {
        set({ practiceHundredCount: count });
    },
    setHundredToTwoHundredTargetIndex: (index) => {
        set({ hundredToTwoHundredTargetIndex: index });
        get().updateInstruction();
    },
    setHundredToTwoHundredSuccessCount: (count) => {
        set({ hundredToTwoHundredSuccessCount: count });
        get().updateInstruction();
    },
    setTwoHundredToThreeHundredTargetIndex: (index) => {
        set({ twoHundredToThreeHundredTargetIndex: index });
        get().updateInstruction();
    },
    setTwoHundredToThreeHundredSuccessCount: (count) => {
        set({ twoHundredToThreeHundredSuccessCount: count });
        get().updateInstruction();
    },
    setPracticeThousandCount: (count) => {
        set({ practiceThousandCount: count });
    },
    setThousandToTwoThousandTargetIndex: (index) => {
        set({ thousandToTwoThousandTargetIndex: index });
        get().updateInstruction();
    },
    setThousandToTwoThousandSuccessCount: (count) => {
        set({ thousandToTwoThousandSuccessCount: count });
        get().updateInstruction();
    },
    setTwoThousandToThreeThousandTargetIndex: (index) => {
        set({ twoThousandToThreeThousandTargetIndex: index });
        get().updateInstruction();
    },
    setTwoThousandToThreeThousandSuccessCount: (count) => {
        set({ twoThousandToThreeThousandSuccessCount: count });
        get().updateInstruction();
    },
    setThousandsSimpleCombinationTargetIndex: (index) => {
        set({ thousandsSimpleCombinationTargetIndex: index });
        get().updateInstruction();
    },
    setThousandsSimpleCombinationSuccessCount: (count) => {
        set({ thousandsSimpleCombinationSuccessCount: count });
        get().updateInstruction();
    },
    resetUnitChallenge: () => {
        set({ unitTargetIndex: 0, unitSuccessCount: 0 });
        get().resetAttempts();
        get().updateInstruction();
    },
    resetTenToTwentyChallenge: () => {
        set({ tenToTwentyTargetIndex: 0, tenToTwentySuccessCount: 0 });
        get().resetAttempts();
        get().updateInstruction();
    },
    resetHundredToTwoHundredChallenge: () => {
        set({ hundredToTwoHundredTargetIndex: 0, hundredToTwoHundredSuccessCount: 0 });
        get().resetAttempts();
        get().updateInstruction();
    },
    resetTwoHundredToThreeHundredChallenge: () => {
        set({ twoHundredToThreeHundredTargetIndex: 0, twoHundredToThreeHundredSuccessCount: 0 });
        get().resetAttempts();
        get().updateInstruction();
    },
    resetTensChallenge: () => {
        set({ tensTargetIndex: 0, tensSuccessCount: 0 });
        get().resetAttempts();
        get().updateInstruction();
    },
    resetHundredsChallenge: () => {
        set({ hundredsTargetIndex: 0, hundredsSuccessCount: 0 });
        get().resetAttempts();
        get().updateInstruction();
    },
    resetThousandsChallenge: () => {
        set({ thousandsTargetIndex: 0, thousandsSuccessCount: 0 });
        get().resetAttempts();
        get().updateInstruction();
    },
    resetThousandToTwoThousandChallenge: () => {
        set({ thousandToTwoThousandTargetIndex: 0, thousandToTwoThousandSuccessCount: 0 });
        get().resetAttempts();
        get().updateInstruction();
    },
    resetTwoThousandToThreeThousandChallenge: () => {
        set({ twoThousandToThreeThousandTargetIndex: 0, twoThousandToThreeThousandSuccessCount: 0 });
        get().resetAttempts();
        get().updateInstruction();
    },
    resetThousandsSimpleCombinationChallenge: () => {
        set({ thousandsSimpleCombinationTargetIndex: 0, thousandsSimpleCombinationSuccessCount: 0 });
        get().resetAttempts();
        get().updateInstruction();
    },
    setUserInput: (input) => set({ userInput: input }),
    setShowInputField: (show) => set({ showInputField: show }),
    setTimer: (timer) => set({ timer }),
    
    // New error management actions
    setAttemptCount: (count) => set({ attemptCount: count }),
    setConsecutiveFailures: (count) => {
        set({ consecutiveFailures: count });
        // Auto-update frustration level
        const frustrationLevel = count >= 3 ? 'high' : count >= 2 ? 'medium' : 'low';
        set({ frustrationLevel });
    },
    setFrustrationLevel: (level) => set({ frustrationLevel: level }),
    setShowHelpOptions: (show) => set({ showHelpOptions: show }),
    setGuidedMode: (guided) => set({ guidedMode: guided }),
    setGuidedStep: (step) => set({ guidedStep: step }),
    setTotalChallengesCompleted: (count) => set({ totalChallengesCompleted: count }),
    setHelpChoice: (choice) => set({ helpChoice: choice }),
    setShowSolutionAnimation: (show) => set({ showSolutionAnimation: show }),
    setSolutionAnimationStep: (step) => set({ solutionAnimationStep: step }),
    setCurrentTarget: (target) => set({ currentTarget: target }),
    setLastFeedbackMessage: (message) => set({ lastFeedbackMessage: message }),
    resetAttempts: () => set({ 
        attemptCount: 0, 
        showHelpOptions: false, 
        guidedMode: false, 
        guidedStep: 0,
        helpChoice: null,
        showSolutionAnimation: false,
        solutionAnimationStep: 0
    }),
    
    // New intro state setters
    setUserName: (name) => set({ userName: name }),
    setIntroClickCount: (count) => set({ introClickCount: count }),
    setIntroDigitsAttempt: (attempt) => set({ introDigitsAttempt: attempt }),
    setIntroMaxAttempt: (attempt) => set({ introMaxAttempt: attempt }),
    setShowResponseButtons: (show) => set({ showResponseButtons: show }),
    setSelectedResponse: (response) => set({ selectedResponse: response }),
    
    
    // New intro phase handlers
    handleIntroNameSubmit: () => {
        const { userInput, sequenceFeedback } = get();
        const name = userInput.trim() || "l'enfant";
        set({ userName: name, showInputField: false, userInput: "" });
        
        sequenceFeedback(
            `Enchanté ${name} ! Moi c'est Professeur Numérix ! 🎩`,
            "(Bruits de marteau sur du métal et de perceuse) Paf, Crac… Bim… Tchac ! Quel vacarme !"
        );
        
        setTimeout(() => {
            set({ feedback: "Voilà, j'ai terminé ma nouvelle machine !" });
            setTimeout(() => {
                set({ phase: 'intro-discover-machine' });
                get().updateInstruction();
            }, FEEDBACK_DELAY);
        }, FEEDBACK_DELAY * 2);
    },

    handleIntroMachineResponse: () => {
        const { selectedResponse, userName, sequenceFeedback } = get();
        const name = userName || "l'enfant";
        
        set({ showResponseButtons: false });
        
        if (selectedResponse === 'belle') {
            sequenceFeedback(
                "Merci ! J'ai passé beaucoup de temps dessus ! 😊",
                "Tu vas voir, elle est aussi MAGIQUE que belle !"
            );
        } else if (selectedResponse === 'bof') {
            sequenceFeedback(
                "Haha ! Je comprends, elle n'a pas l'air très impressionnante comme ça ! 😅",
                "Mais attends de voir ce qu'elle peut faire !"
            );
        } else if (selectedResponse === 'comprends-rien') {
            sequenceFeedback(
                "C'est NORMAL ! Même moi j'avais du mal au début ! 😄",
                "C'est justement pour ça qu'on va l'explorer ENSEMBLE !"
            );
        } else if (selectedResponse === 'cest-quoi') {
            sequenceFeedback(
                "Excellente question ! 🎓 C'est une MACHINE À COMPTER !",
                "Elle va nous apprendre comment fonctionnent les nombres !"
            );
        } else { // timeout
            sequenceFeedback(
                `Tu es peut-être un peu timide ${name} ? Pas de problème ! 😊`,
                "Laisse-moi te la présenter..."
            );
        }
        
        setTimeout(() => {
            set({ feedback: "Prêt(e) à découvrir ses secrets ?" });
            setTimeout(() => {
                set({ phase: 'intro-first-interaction' });
                get().updateInstruction();
            }, FEEDBACK_DELAY);
        }, FEEDBACK_DELAY * 2);
    },

    handleIntroFirstClick: () => {
        const { introClickCount, columns, sequenceFeedback } = get();
        const newCols = [...columns];
        
        if (introClickCount === 0) {
            newCols[0].value = 1;
            set({ columns: newCols, introClickCount: 1 });
            sequenceFeedback(
                "SUPER ! Tu as vu ? Une lumière s'est allumée ! 💡",
                "Et le chiffre est passé de 0 à 1 ! Continue ! Clique encore sur △ !"
            );
        } else if (introClickCount < 9) {
            newCols[0].value = introClickCount + 1;
            set({ columns: newCols, introClickCount: introClickCount + 1 });
            
            const messages = [
                "", // 0
                "", // 1 - already handled above
                "2 ! Continue !",
                "3 ! Tu vois comme c'est facile ?",
                "4 ! Les lumières s'allument une par une !",
                "5 ! La moitié !",
                "6 ! Continue jusqu'au bout !",
                "7 !",
                "8 ! Presque plein !",
                "9 ! STOP ! C'est PLEIN ! 🎯"
            ];
            
            if (messages[introClickCount + 1]) {
                set({ feedback: messages[introClickCount + 1] });
            }
            
            if (introClickCount + 1 === 9) {
                setTimeout(() => {
                    sequenceFeedback(
                        "Et voilà, on a REMPLI la machine ! 🎉",
                        "Tu as vu comme les lumières s'allument en même temps que les chiffres changent ?"
                    );
                    setTimeout(() => {
                        set({ feedback: "Maintenant essaie le bouton ROUGE avec la flèche vers le BAS ∇ !" });
                    }, FEEDBACK_DELAY * 2);
                }, 1000);
            }
        }
    },

    handleIntroDigitsSubmit: () => {
        const { userInput, introDigitsAttempt, sequenceFeedback } = get();
        const answer = parseInt(userInput.trim());
        const newAttempt = introDigitsAttempt + 1;
        
        set({ introDigitsAttempt: newAttempt, userInput: "" });
        
        if (answer === 10) {
            // Correct answer!
            sequenceFeedback(
                "BRAVO ! 🎉🎉🎉 C'est EXACT ! Il y a 10 chiffres différents !",
                "Tu n'as pas oublié le ZÉRO ! 👏"
            );
            setTimeout(() => {
                set({ feedback: "0, 1, 2, 3, 4, 5, 6, 7, 8, 9 = 10 chiffres ! Le zéro est un peu spécial, mais il est TRÈS important !" });
                setTimeout(() => {
                    set({ feedback: "Donc en tout, nous avons bien 10 chiffres différents !" });
                    setTimeout(() => {
                        set({ showInputField: false, phase: 'intro-second-column', introDigitsAttempt: 0 });
                        get().updateInstruction();
                    }, FEEDBACK_DELAY);
                }, FEEDBACK_DELAY);
            }, FEEDBACK_DELAY * 2);
        } else if (answer === 9) {
            if (newAttempt === 1) {
                sequenceFeedback(
                    "Hmm... pas tout à fait ! 🤔 Je comprends pourquoi tu penses ça !",
                    "Tu as compté : 1, 2, 3, 4, 5, 6, 7, 8, 9... ça fait 9 !"
                );
                setTimeout(() => {
                    set({ feedback: "Mais... tu n'oublies pas quelque chose ? 😉 Réfléchis bien et réessaie !" });
                }, FEEDBACK_DELAY * 2);
            } else if (newAttempt === 2) {
                sequenceFeedback(
                    "Presque ! Mais regarde le PREMIER chiffre ! 👀",
                    "Celui tout au début, avant le 1... C'est le... ? 🤔"
                );
            } else {
                // Attempt 3: guided counting
                set({ showInputField: false });
                sequenceFeedback(
                    "Ce n'est pas grave ! On va compter ENSEMBLE ! 🤝",
                    "Regarde l'écran et compte avec moi à voix haute !"
                );
                setTimeout(() => {
                    get().runIntroDigitsGuided();
                }, FEEDBACK_DELAY * 2);
            }
        } else {
            if (newAttempt === 1) {
                sequenceFeedback(
                    "Hmm... ce n'est pas ça ! 🤔",
                    "Tu veux que je te donne un indice ?"
                );
                set({ showHelpOptions: true });
            } else if (newAttempt === 2) {
                set({ showInputField: false });
                sequenceFeedback(
                    "D'accord, regarde bien !",
                    "Voici TOUS les chiffres que la machine peut afficher :"
                );
                setTimeout(() => {
                    get().showIntroDigitsVisual();
                }, FEEDBACK_DELAY * 2);
            } else {
                // Attempt 3: guided counting
                set({ showInputField: false });
                sequenceFeedback(
                    "Ce n'est pas grave ! On va compter ENSEMBLE ! 🤝",
                    "Regarde l'écran et compte avec moi à voix haute !"
                );
                setTimeout(() => {
                    get().runIntroDigitsGuided();
                }, FEEDBACK_DELAY * 2);
            }
        }
    },

    showIntroDigitsVisual: () => {
        const { setFeedback, setShowInputField } = get();
        const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        let index = 0;
        
        const showNextDigit = () => {
            if (index < digits.length) {
                setFeedback(`${digits.slice(0, index + 1).join(', ')}...`);
                index++;
                setTimeout(showNextDigit, 600);
            } else {
                setTimeout(() => {
                    setFeedback("Maintenant, combien en vois-tu ? Compte-les bien ! 👆");
                    setShowInputField(true);
                }, 1000);
            }
        };
        
        showNextDigit();
    },

    runIntroDigitsGuided: () => {
        const { setFeedback, columns } = get();
        const steps = [
            { value: 0, text: "ZÉRO ! C'est le premier ! Lève 1 doigt ! ☝️" },
            { value: 1, text: "UN ! Maintenant 2 doigts ! ✌️" },
            { value: 2, text: "DEUX ! 3 doigts ! 🤟" },
            { value: 3, text: "TROIS ! 4 doigts !" },
            { value: 4, text: "QUATRE ! 5 doigts ! ✋" },
            { value: 5, text: "CINQ ! 6 doigts !" },
            { value: 6, text: "SIX ! 7 doigts !" },
            { value: 7, text: "SEPT ! 8 doigts !" },
            { value: 8, text: "HUIT ! 9 doigts !" },
            { value: 9, text: "NEUF ! 10 doigts ! 🙌" }
        ];
        
        let index = 0;
        const newCols = [...columns];
        
        const showNextStep = () => {
            if (index < steps.length) {
                newCols[0].value = steps[index].value;
                set({ columns: [...newCols] });
                setFeedback(steps[index].text);
                index++;
                setTimeout(showNextStep, 2000);
            } else {
                setTimeout(() => {
                    setFeedback("Et voilà ! Compte tes doigts : 10 doigts = 10 chiffres ! Tu as compris maintenant ? 😊");
                    setTimeout(() => {
                        setFeedback("Donc en tout, nous avons bien 10 chiffres différents ! 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 !");
                        setTimeout(() => {
                            setFeedback("Le ZÉRO est un peu particulier... on l'oublie parfois, mais il est AUSSI important que les autres !");
                            setTimeout(() => {
                                set({ phase: 'intro-second-column', introDigitsAttempt: 0 });
                                get().updateInstruction();
                            }, FEEDBACK_DELAY);
                        }, FEEDBACK_DELAY);
                    }, FEEDBACK_DELAY);
                }, 2000);
            }
        };
        
        showNextStep();
    },

    handleIntroSecondColumnChoice: (choice: string) => {
        const { sequenceFeedback } = get();
        
        if (choice === 'ajouter-rouleau' || choice === 'plus-grande') {
            sequenceFeedback(
                "EXACTEMENT ! Quelle bonne idée ! 💡",
                "On va ajouter un DEUXIÈME ROULEAU ! Comme ça on aura plus de place pour compter !"
            );
        } else {
            sequenceFeedback(
                "Pas de souci ! Je vais te montrer MON idée ! 😊",
                "On va ajouter un DEUXIÈME ROULEAU !"
            );
        }
        
        setTimeout(() => {
            set({ feedback: "Regarde bien, je vais modifier la machine !" });
            setTimeout(() => {
                const newCols = [...initialColumns];
                newCols[1].unlocked = true;
                set({ columns: newCols });
                sequenceFeedback(
                    "(Bruits : tic tic tic, bzzzz, clic !) Et voilààààà ! 🎉",
                    "Maintenant il y a DEUX rouleaux ! Je vais l'allumer pour que tu la testes !"
                );
                setTimeout(() => {
                    set({ feedback: "(Bruit d'allumage : bzzzz, ding !)" });
                    setTimeout(() => {
                        set({ phase: 'intro-discover-carry' });
                        get().updateInstruction();
                    }, FEEDBACK_DELAY);
                }, FEEDBACK_DELAY * 2);
            }, FEEDBACK_DELAY);
        }, FEEDBACK_DELAY * 2);
    },

    handleIntroMaxSubmit: () => {
        const { userInput, introMaxAttempt, sequenceFeedback } = get();
        const answer = parseInt(userInput.trim());
        const newAttempt = introMaxAttempt + 1;
        
        set({ introMaxAttempt: newAttempt, userInput: "" });
        
        if (answer === 99) {
            // Correct answer!
            sequenceFeedback(
                "BRAVO ! 🎉🎉🎉 C'est EXACT ! On peut compter jusqu'à 99 !",
                "Tu as bien réfléchi ! Chaque rouleau peut afficher 9, donc : 9 et 9 = 99 !"
            );
            setTimeout(() => {
                set({ showInputField: false, phase: 'tutorial', introMaxAttempt: 0 });
                get().updateInstruction();
            }, FEEDBACK_DELAY * 2);
        } else if (answer === 100) {
            if (newAttempt === 1) {
                sequenceFeedback(
                    "Hmm... pas tout à fait ! 🤔",
                    "100 c'est un très bon nombre, mais... malheureusement la machine ne peut pas y arriver pour l'instant !"
                );
                setTimeout(() => {
                    set({ feedback: "Regarde bien les rouleaux... Quel est le PLUS GRAND chiffre sur chaque rouleau ? 🔍 Réessaie !" });
                }, FEEDBACK_DELAY * 2);
            } else if (newAttempt === 2) {
                sequenceFeedback(
                    "Tu veux que je t'aide à trouver ? 😊",
                    "On va le découvrir ENSEMBLE ! 🤝"
                );
                setTimeout(() => {
                    get().runIntroMaxGuided();
                }, FEEDBACK_DELAY * 2);
            } else {
                get().runIntroMaxGuided();
            }
        } else if (answer < 99) {
            if (newAttempt === 1) {
                sequenceFeedback(
                    "Tu peux aller PLUS HAUT que ça ! 📈",
                    "Regarde : chaque rouleau peut aller jusqu'à 9 ! Remplis les DEUX rouleaux au maximum !"
                );
            } else {
                sequenceFeedback(
                    "Tu veux que je t'aide à trouver ? 😊",
                    "On va le découvrir ENSEMBLE ! 🤝"
                );
                setTimeout(() => {
                    get().runIntroMaxGuided();
                }, FEEDBACK_DELAY * 2);
            }
        } else {
            if (newAttempt === 1) {
                sequenceFeedback(
                    "Woaw, c'est beaucoup ! 😄",
                    "Mais malheureusement la machine ne peut pas compter aussi haut !"
                );
                setTimeout(() => {
                    set({ feedback: "Regarde bien : combien de rouleaux il y a ? 👀 Seulement 2 ! Et chaque rouleau va jusqu'à 9 ! Réessaie !" });
                }, FEEDBACK_DELAY * 2);
            } else {
                get().runIntroMaxGuided();
            }
        }
    },

    runIntroMaxGuided: () => {
        const { setFeedback, setShowInputField, columns } = get();
        
        setShowInputField(false);
        setFeedback("Clique sur △ pour remplir le PREMIER rouleau au maximum !");
        
        const newCols = [...columns];
        newCols[0].value = 0;
        newCols[1].value = 0;
        set({ columns: newCols, introMaxAttempt: -1 }); // -1 indicates guided mode
    },

    completeIntroMaxGuided: () => {
        const { sequenceFeedback } = get();
        
        sequenceFeedback(
            "STOP ! Regarde l'écran ! Quel nombre tu vois ? 👀",
            "C'est 99 ! QUATRE-VINGT-DIX-NEUF ! C'est le MAXIMUM que peut afficher la machine !"
        );
        
        setTimeout(() => {
            set({ feedback: "Maintenant tu sais la réponse ! 😊" });
            setTimeout(() => {
                sequenceFeedback(
                    "Donc, avec DEUX rouleaux, on peut compter jusqu'à 99 !",
                    "C'est BEAUCOUP plus que 9 ! On est passé de 9... à 99 ! Ça fait 90 nombres de plus ! 🚀"
                );
                setTimeout(() => {
                    set({ feedback: "Mais... si je veux compter jusqu'à 100 ou plus... il faudra encore modifier la machine ! 🔧 Tu es prêt(e) pour la suite de l'aventure ? 🎉" });
                    setTimeout(() => {
                        set({ phase: 'tutorial', introMaxAttempt: 0 });
                        get().updateInstruction();
                    }, FEEDBACK_DELAY);
                }, FEEDBACK_DELAY * 2);
            }, FEEDBACK_DELAY);
        }, FEEDBACK_DELAY * 2);
    },

    handleUserInputSubmit: () => {
        const { phase, userInput, sequenceFeedback } = get();
        const answer = parseInt(userInput.trim());

        if (phase === 'intro-question-digits') {
            if (answer === 9) {
                sequenceFeedback(
                    "Paf, Crac… Bim… Tchac ! Quel vacarme ! Voilà, j'ai terminé ma nouvelle machine !,Ah je vois pourquoi tu pourrais penser ça, 1, 2, 3, 4, 5, 6, 7, 8, 9, ça fait 9 chiffres...",
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

    updateButtonVisibility: () => {
        const { phase, columns } = get();
        const allColumnsUnlocked = columns.every(col => col.unlocked);

        set({
            showUnlockButton: phase === 'normal' && !allColumnsUnlocked,
            showStartLearningButton: phase === 'done' || phase === 'celebration-before-thousands' || phase === 'celebration-thousands-complete',
            showValidateLearningButton: phase.startsWith('challenge-unit-') || phase === 'challenge-ten-to-twenty',
            showValidateTensButton: phase.startsWith('challenge-tens-'),
            showValidateHundredsButton: phase.startsWith('challenge-hundreds-') || phase === 'challenge-hundred-to-two-hundred' || phase === 'challenge-two-hundred-to-three-hundred',
            showValidateThousandsButton: phase.startsWith('challenge-thousands-') || phase === 'challenge-thousand-to-two-thousand' || phase === 'challenge-two-thousand-to-three-thousand' || phase === 'challenge-thousands-simple-combination',
        });
    },

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

        // --- LOGIQUE POUR 'learn-ten-to-twenty' ---
        else if (phase === 'learn-ten-to-twenty') {
            // This phase is NOT auto-counting, it's user-driven
            // The logic is handled in handleAdd
            return;
        }

        // --- LOGIQUE POUR 'learn-twenty-to-thirty' ---
        else if (phase === 'learn-twenty-to-thirty') {
            // This phase is NOT auto-counting, it's user-driven
            // The logic is handled in handleAdd
            return;
        }

        // --- LOGIQUE POUR 'learn-tens' ---
        else if (phase === 'learn-tens') {
            const COUNT_SPEED_SLOW = 2500; // Ralenti à 2.5 secondes
            const tensValue = columns[1].value;
            if (columns[0].value !== 0) { // Ensure units are 0
                get().setColumns(cols => {
                    const newCols = [...cols];
                    newCols[0].value = 0;
                    return newCols;
                });
            }

            // Start from 3 (30) instead of 0
            if (tensValue < 3) {
                get().setColumns(cols => {
                    const newCols = [...cols];
                    newCols[1].value = 3;
                    newCols[0].value = 0;
                    return newCols;
                });
                get().setFeedback("**30** (TRENTE) ! Compte avec moi les paquets : UN, DEUX, TROIS !");
                const newTimer = setTimeout(() => {
                    get().runAutoCount();
                }, COUNT_SPEED_SLOW);
                set({ timer: newTimer as unknown as number });
            } else if (tensValue < 9) {
                const newTimer = setTimeout(() => {
                    get().setColumns(prevCols => {
                        const newCols = [...prevCols];
                        newCols[1].value++;
                        return newCols;
                    });

                    const nextValue = tensValue + 1;
                    const displayNumber = nextValue * 10;
                    let infoMessage = "";
                    if (nextValue === 4) infoMessage = `**${displayNumber}** (QUARANTE) ! 🎯 Compte les paquets : UN, DEUX, TROIS, QUATRE !`;
                    else if (nextValue === 5) infoMessage = `**${displayNumber}** (CINQUANTE) ! 🎯 5 paquets de 10 !`;
                    else if (nextValue === 6) infoMessage = `**${displayNumber}** (SOIXANTE) ! 🎯 6 paquets de 10 !`;
                    else if (nextValue === 7) infoMessage = `**${displayNumber}** (SOIXANTE-DIX) ! 🎯 7 paquets de 10 !`;
                    else if (nextValue === 8) infoMessage = `**${displayNumber}** (QUATRE-VINGTS) ! 🎯 8 paquets de 10 !`;
                    else if (nextValue === 9) infoMessage = `**${displayNumber}** (QUATRE-VINGT-DIX) ! 🎯 Presque 100 !`;
                    else infoMessage = `**${displayNumber}** !`;
                    get().setFeedback(infoMessage);
                    get().runAutoCount(); // Continue counting
                }, COUNT_SPEED_SLOW);
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
                }, COUNT_SPEED_SLOW * 3);
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
                    get().setColumns(initialColumns.map(c => ({ ...c, unlocked: c.name === 'Unités' || c.name === 'Dizaines' })));
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
            const COUNT_SPEED_HUNDREDS = 3000; // Ralenti à 3 secondes pour les centaines
            const hundredsValue = columns[2].value;
            if (columns[0].value !== 0 || columns[1].value !== 0) { // Ensure units and tens are 0
                get().setColumns(cols => {
                    const newCols = [...cols];
                    newCols[0].value = 0;
                    newCols[1].value = 0;
                    return newCols;
                });
            }

            // Start from 3 (300) instead of 0
            if (hundredsValue < 3) {
                get().setColumns(cols => {
                    const newCols = [...cols];
                    newCols[2].value = 3;
                    newCols[0].value = 0;
                    newCols[1].value = 0;
                    return newCols;
                });
                get().setFeedback("**300** (TROIS-CENTS) ! Compte avec moi les GRANDS paquets : UN, DEUX, TROIS !");
                const newTimer = setTimeout(() => {
                    get().runAutoCount();
                }, COUNT_SPEED_HUNDREDS);
                set({ timer: newTimer as unknown as number });
            } else if (hundredsValue < 9) {
                const newTimer = setTimeout(() => {
                    get().setColumns(prevCols => {
                        const newCols = [...prevCols];
                        newCols[2].value++;
                        return newCols;
                    });

                    const nextValue = hundredsValue + 1;
                    const displayNumber = nextValue * 100;
                    let infoMessage = `**${displayNumber}** !`;
                    if (nextValue === 4) infoMessage = `**${displayNumber}** (QUATRE-CENTS) ! 🎯 Compte les GRANDS paquets : UN, DEUX, TROIS, QUATRE !`;
                    else if (nextValue === 5) infoMessage = `**${displayNumber}** (CINQ-CENTS) ! 🎯 5 grands paquets de 100 !`;
                    else if (nextValue === 6) infoMessage = `**${displayNumber}** (SIX-CENTS) ! 🎯 6 grands paquets de 100 !`;
                    else if (nextValue === 7) infoMessage = `**${displayNumber}** (SEPT-CENTS) ! 🎯 7 grands paquets de 100 !`;
                    else if (nextValue === 8) infoMessage = `**${displayNumber}** (HUIT-CENTS) ! 🎯 8 grands paquets de 100 !`;
                    else if (nextValue === 9) infoMessage = `**${displayNumber}** (NEUF-CENTS) ! 🎯 Presque 1000 !`;
                    get().setFeedback(infoMessage);
                    get().runAutoCount(); // Continue counting
                }, COUNT_SPEED_HUNDREDS);
                set({ timer: newTimer as unknown as number });
            } else { // hundredsValue is 9
                get().setFeedback("STOP ! 🛑 Le compteur est à 900. Tu as vu tous les nombres avec les centaines ! Bravo !");
                const newTimer = setTimeout(() => {
                    get().setColumns(initialColumns);
                    get().setIsCountingAutomatically(false);
                    get().setFeedback("Retour à zéro ! 🔄 Maintenant on va apprendre à combiner les centaines avec des exemples simples !");
                    setTimeout(() => {
                        get().setPhase('learn-hundreds-simple-combination');
                        get().setPendingAutoCount(true);
                    }, FEEDBACK_DELAY);
                }, COUNT_SPEED_HUNDREDS * 2);
                set({ timer: newTimer as unknown as number });
            }
        }
        // --- LOGIQUE POUR 'learn-hundreds-simple-combination' ---
        else if (phase === 'learn-hundreds-simple-combination') {
            const COUNT_SPEED_COMBINATION = 2500;
            const examples = [
                { hundreds: 1, tens: 0, units: 0, name: "CENT" },
                { hundreds: 1, tens: 1, units: 0, name: "CENT-DIX" },
                { hundreds: 2, tens: 0, units: 0, name: "DEUX-CENTS" },
                { hundreds: 2, tens: 5, units: 0, name: "DEUX-CENT-CINQUANTE" },
                { hundreds: 3, tens: 0, units: 0, name: "TROIS-CENTS" },
                { hundreds: 1, tens: 0, units: 5, name: "CENT-CINQ" },
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
                get().setFeedback(`**${total}** (${firstExample.name}) ! 1 grand paquet de 100 !`);
                const newTimer = setTimeout(() => {
                    get().runAutoCount();
                }, COUNT_SPEED_COMBINATION);
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
                    let detailMsg = "";
                    if (nextExample.tens > 0 && nextExample.units === 0) {
                        detailMsg = ` ! ${nextExample.hundreds} grand paquet + ${nextExample.tens} paquet${nextExample.tens > 1 ? 's' : ''} de 10 !`;
                    } else if (nextExample.units > 0 && nextExample.tens === 0) {
                        detailMsg = ` ! ${nextExample.hundreds} grand paquet + ${nextExample.units} bille${nextExample.units > 1 ? 's' : ''} !`;
                    } else if (nextExample.tens === 0 && nextExample.units === 0) {
                        detailMsg = ` ! ${nextExample.hundreds} grand${nextExample.hundreds > 1 ? 's' : ''} paquet${nextExample.hundreds > 1 ? 's' : ''} de 100 !`;
                    }
                    get().setFeedback(`**${total}** (${nextExample.name})${detailMsg}`);
                    get().runAutoCount();
                }, COUNT_SPEED_COMBINATION);
                set({ timer: newTimer as unknown as number });
            } else {
                get().setFeedback("Bravo ! 🎉 Tu as vu des exemples simples avec les centaines ! Maintenant on va voir des combinaisons complètes !");
                const newTimer = setTimeout(() => {
                    get().setColumns(initialColumns.map(c => ({ ...c, unlocked: ['Unités', 'Dizaines', 'Centaines'].includes(c.name) })));
                    get().setIsCountingAutomatically(false);
                    get().setFeedback("Observe maintenant des combinaisons avec centaines, dizaines ET unités !");
                    setTimeout(() => {
                        get().setPhase('learn-hundreds-combination');
                        get().setPendingAutoCount(true);
                    }, FEEDBACK_DELAY);
                }, COUNT_SPEED_COMBINATION * 2);
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
                get().setFeedback(`**${total}** (${firstExample.name}) ! 1 grand paquet + 2 paquets + 3 billes !`);
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
                    get().setFeedback(`**${total}** (${nextExample.name}) ! ${nextExample.hundreds} grand${nextExample.hundreds > 1 ? 's' : ''} paquet${nextExample.hundreds > 1 ? 's' : ''} + ${nextExample.tens} paquets + ${nextExample.units} billes !`);
                    get().runAutoCount();
                }, COUNT_SPEED);
                set({ timer: newTimer as unknown as number });
            } else {
                get().setFeedback("Bravo ! 🎉 Tu as vu comment combiner les centaines ! C'est à toi !");
                const newTimer = setTimeout(() => {
                    get().setColumns(initialColumns.map(c => ({ ...c, unlocked: ['Unités', 'Dizaines', 'Centaines'].includes(c.name) })));
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
            const COUNT_SPEED_SLOW = 2500; // Ralenti comme pour learn-tens
            const thousandsValue = columns[3].value;
            if (columns[0].value !== 0 || columns[1].value !== 0 || columns[2].value !== 0) {
                get().setColumns(cols => {
                    const newCols = [...cols];
                    newCols[0].value = 0; newCols[1].value = 0; newCols[2].value = 0;
                    return newCols;
                });
            }

            // Start from 3 (3000) instead of 0
            if (thousandsValue < 3) {
                get().setColumns(cols => {
                    const newCols = [...cols];
                    newCols[3].value = 3;
                    return newCols;
                });
                get().setFeedback("**3000** ! Trois ÉNORMES paquets !");
                const newTimer = setTimeout(() => {
                    get().runAutoCount();
                }, COUNT_SPEED_SLOW);
                set({ timer: newTimer as unknown as number });
            } else if (thousandsValue < 9) {
                const newTimer = setTimeout(() => {
                    get().setColumns(prevCols => {
                        const newCols = [...prevCols];
                        newCols[3].value++;
                        return newCols;
                    });
                    const nextValue = thousandsValue + 1;
                    const displayNumber = nextValue * 1000;
                    const numberWords = ["", "", "", "TROIS", "QUATRE", "CINQ", "SIX", "SEPT", "HUIT", "NEUF"];
                    get().setFeedback(`**${displayNumber}** ! ${numberWords[nextValue]} ÉNORMES paquets ! Imagine ${displayNumber} billes !`);
                    get().runAutoCount();
                }, COUNT_SPEED_SLOW);
                set({ timer: newTimer as unknown as number });
            } else {
                get().setFeedback("STOP ! 🛑 Le compteur est à 9000. C'est GIGANTESQUE !");
                const newTimer = setTimeout(() => {
                    get().setColumns(initialColumns);
                    get().setIsCountingAutomatically(false);
                    get().setFeedback("Retour à zéro ! 🔄 Apprenons les combinaisons SIMPLES !");
                    setTimeout(() => {
                        get().setPhase('learn-thousands-very-simple-combination');
                        get().setPendingAutoCount(true);
                    }, FEEDBACK_DELAY);
                }, COUNT_SPEED_SLOW * 3);
                set({ timer: newTimer as unknown as number });
            }
        }
        // --- LOGIQUE POUR 'learn-thousands-very-simple-combination' ---
        else if (phase === 'learn-thousands-very-simple-combination') {
            const examples = [
                { thousands: 1, hundreds: 0, tens: 0, units: 0, name: "MILLE" },
                { thousands: 1, hundreds: 1, tens: 0, units: 0, name: "MILLE-CENT" },
                { thousands: 1, hundreds: 2, tens: 0, units: 0, name: "MILLE-DEUX-CENTS" },
                { thousands: 2, hundreds: 0, tens: 0, units: 0, name: "DEUX-MILLE" },
                { thousands: 2, hundreds: 5, tens: 0, units: 0, name: "DEUX-MILLE-CINQ-CENTS" },
                { thousands: 3, hundreds: 0, tens: 0, units: 0, name: "TROIS-MILLE" },
            ];
            const currentExampleIndex = examples.findIndex(ex => 
                ex.thousands === columns[3].value && 
                ex.hundreds === columns[2].value && 
                ex.tens === columns[1].value && 
                ex.units === columns[0].value
            );

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
                get().setFeedback(`**${total}** (${firstExample.name}) ! C'est des nombres RONDS !`);
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
                    get().setFeedback(`**${total}** (${nextExample.name}) ! Facile avec des nombres RONDS !`);
                    get().runAutoCount();
                }, COUNT_SPEED);
                set({ timer: newTimer as unknown as number });
            } else {
                get().setFeedback("Bravo ! 🎉 Tu maîtrises les combinaisons SIMPLES !");
                const newTimer = setTimeout(() => {
                    get().setColumns(initialColumns.map(c => ({ ...c, unlocked: true })));
                    get().setIsCountingAutomatically(false);
                    get().resetThousandsSimpleCombinationChallenge();
                    get().setFeedback("Retour à zéro ! 🔄 À toi de jouer avec des nombres RONDS !");
                    setTimeout(() => {
                        get().setPhase('challenge-thousands-simple-combination');
                    }, FEEDBACK_DELAY);
                }, COUNT_SPEED * 3);
                set({ timer: newTimer as unknown as number });
            }
        }
        // --- LOGIQUE POUR 'learn-thousands-full-combination' ---
        else if (phase === 'learn-thousands-full-combination') {
            const examples = [
                { thousands: 1, hundreds: 2, tens: 3, units: 4, name: "MILLE-DEUX-CENT-TRENTE-QUATRE" },
                { thousands: 2, hundreds: 3, tens: 4, units: 5, name: "DEUX-MILLE-TROIS-CENT-QUARANTE-CINQ" },
            ];
            const currentExampleIndex = examples.findIndex(ex => 
                ex.thousands === columns[3].value && 
                ex.hundreds === columns[2].value && 
                ex.tens === columns[1].value && 
                ex.units === columns[0].value
            );

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
                get().setFeedback(`**${total}** (${firstExample.name}) ! C'est ${firstExample.thousands} énorme + ${firstExample.hundreds} grands + ${firstExample.tens} paquets + ${firstExample.units} billes !`);
                const newTimer = setTimeout(() => {
                    get().runAutoCount();
                }, COUNT_SPEED * 2);
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
                    get().setFeedback(`**${total}** (${nextExample.name}) ! Décomposition : ${nextExample.thousands} énorme + ${nextExample.hundreds} grands + ${nextExample.tens} paquets + ${nextExample.units} billes !`);
                    get().runAutoCount();
                }, COUNT_SPEED * 2);
                set({ timer: newTimer as unknown as number });
            } else {
                get().setFeedback("Bravo ! 🎉 Tu comprends les nombres COMPLETS ! C'est long à dire mais tu vois la logique !");
                const newTimer = setTimeout(() => {
                    get().setColumns(initialColumns.map(c => ({ ...c, unlocked: true })));
                    get().setIsCountingAutomatically(false);
                    get().resetThousandsChallenge();
                    get().setFeedback("Retour à zéro ! 🔄 Maintenant les VRAIS défis !");
                    setTimeout(() => {
                        get().setPhase('challenge-thousands-1');
                    }, FEEDBACK_DELAY);
                }, COUNT_SPEED * 3);
                set({ timer: newTimer as unknown as number });
            }
        }
        // --- LOGIQUE POUR 'learn-thousands-combination' (LEGACY - kept for compatibility) ---
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
                    get().setColumns(initialColumns.map(c => ({ ...c, unlocked: true })));
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

  
    sequenceFeedback: (first: string, second?: string) => {
        const combined = second ? `${first} - ${second}` : first;
        get().setFeedback(combined);
    },

    handleAdd: (idx: number) => {
        const { isCountingAutomatically, isTransitioningToChallenge, phase, columns, addClicks, sequenceFeedback } = get();
        const totalNumber = columns.reduce((acc: number, col: Column, idx: number) => acc + col.value * Math.pow(10, idx), 0);

        if (isCountingAutomatically || isTransitioningToChallenge) return;

        const isUnitsColumn = (i: number) => i === 0;

        // Handle new intro phases
        if (phase === 'intro-first-interaction') {
            if (idx === 0) {
                get().handleIntroFirstClick();
            }
            return;
        } else if (phase === 'intro-discover-carry') {
            if (idx === 0) {
                const newCols = [...columns];
                newCols[0].value++;
                
                // Handle carry
                if (newCols[0].value > 9) {
                    newCols[0].value = 0;
                    newCols[1].value++;
                    set({ columns: newCols });
                    
                    setTimeout(() => {
                        sequenceFeedback(
                            "WAOUH ! Tu as vu ça ??? 🤩 C'était MAGIQUE non ?",
                            "Les 10 lumières ont VOYAGÉ ! Elles se sont regroupées pour devenir UNE seule lumière sur le deuxième rouleau !"
                        );
                        setTimeout(() => {
                            set({ feedback: "C'est comme si... chaque lumière du nouveau rouleau avait 10 petites lumières à l'intérieur ! 🎒 10 petites = 1 grosse ! C'est le SECRET des nombres ! 🔑" });
                            setTimeout(() => {
                                set({ feedback: "Maintenant, refais l'inverse ! Clique sur ∇ pour voir ce qu'il se passe !" });
                            }, FEEDBACK_DELAY);
                        }, FEEDBACK_DELAY * 2);
                    }, 500);
                } else {
                    set({ columns: newCols });
                }
            }
            return;
        } else if (phase === 'intro-count-digits') {
            // During guided counting, allow clicking through the digits
            if (get().introDigitsAttempt === 0 && idx === 0) {
                const newCols = [...columns];
                if (newCols[0].value < 9) {
                    newCols[0].value++;
                    set({ columns: newCols });
                }
            }
            return;
        } else if (phase === 'intro-max-value-question') {
            // In guided mode for max value
            if (get().introMaxAttempt === -1 && idx === 0) {
                const newCols = [...columns];
                newCols[idx].value++;
                
                // Handle carry
                for (let i = idx; i < newCols.length; i++) {
                    if (newCols[i].value > 9) {
                        newCols[i].value = 0;
                        if (i + 1 < newCols.length) {
                            newCols[i + 1].value++;
                        }
                    }
                }
                
                set({ columns: newCols });
                
                // Check if we reached 99
                if (newCols[0].value === 9 && newCols[1].value === 9) {
                    setTimeout(() => {
                        get().completeIntroMaxGuided();
                    }, 500);
                } else if (newCols[0].value === 9 && newCols[1].value < 9) {
                    set({ feedback: "Parfait ! Le premier rouleau est à 9 ! Maintenant clique sur △ du DEUXIÈME rouleau !" });
                }
            }
            return;
        }

        // Handle intro phases
        /**if (phase === 'intro-welcome') {

            setTimeout(() => {

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
        }**/

        const currentPhaseForCheck = get().phase;
        const isAllowedColumn = () => {
            if (currentPhaseForCheck === 'intro-discover' || currentPhaseForCheck === 'intro-add-roll') return isUnitsColumn(idx);
            if (currentPhaseForCheck === 'normal') return true;
            if (isUnitsColumn(idx)) return true;
            if (currentPhaseForCheck === 'practice-ten' || currentPhaseForCheck === 'learn-ten-to-twenty' || currentPhaseForCheck === 'challenge-ten-to-twenty' || currentPhaseForCheck === 'learn-twenty-to-thirty') return isUnitsColumn(idx);
            if (idx === 1 && (currentPhaseForCheck.startsWith('challenge-tens-') || currentPhaseForCheck === 'learn-tens-combination')) return true;
            if (currentPhaseForCheck === 'practice-hundred' || currentPhaseForCheck === 'learn-hundred-to-hundred-ten' || currentPhaseForCheck === 'learn-hundred-ten-to-two-hundred' || currentPhaseForCheck === 'challenge-hundred-to-two-hundred') return isUnitsColumn(idx);
            if (currentPhaseForCheck === 'learn-two-hundred-to-three-hundred' || currentPhaseForCheck === 'challenge-two-hundred-to-three-hundred') return isUnitsColumn(idx);
            if ((idx === 1 || idx === 2) && (currentPhaseForCheck.startsWith('challenge-hundreds-') || currentPhaseForCheck === 'learn-hundreds-combination' || currentPhaseForCheck === 'learn-hundreds-simple-combination')) return true;
            if (currentPhaseForCheck === 'practice-thousand' || currentPhaseForCheck === 'learn-thousand-to-thousand-ten' || currentPhaseForCheck === 'learn-thousand-to-thousand-hundred' || currentPhaseForCheck === 'learn-thousand-hundred-to-two-thousand' || currentPhaseForCheck === 'challenge-thousand-to-two-thousand') return isUnitsColumn(idx);
            if (currentPhaseForCheck === 'learn-two-thousand-to-three-thousand' || currentPhaseForCheck === 'challenge-two-thousand-to-three-thousand') return isUnitsColumn(idx);
            if ((idx === 1 || idx === 2 || idx === 3) && (currentPhaseForCheck.startsWith('challenge-thousands-') || currentPhaseForCheck === 'learn-thousands-combination' || currentPhaseForCheck === 'learn-thousands-very-simple-combination' || currentPhaseForCheck === 'learn-thousands-full-combination' || currentPhaseForCheck === 'challenge-thousands-simple-combination')) return true;
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

        /**if (currentPhase === 'intro-discover' && isUnitsColumn(idx)) {
            const unitsValue = newCols[0].value;
            if (unitsValue === 9) {
                sequenceFeedback(
                    "Et voilà, on a rempli la machine !",
                    "Tu as vu comme les lumières s'allument en même temps que les chiffres changent ?"
                );
                setTimeout(() => {
                    set({ showInputField: true, phase: 'tutorial' });
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
        } else**/
        if (currentPhase === 'tutorial') {
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
            sequenceFeedback("INCROYABLE ! 🎆 C'est de la MAGIE ! 10 petites billes sont devenues 1 PAQUET de 10 !", "C'est la RÈGLE D'OR : 10 billes = 1 paquet dans la colonne de gauche !");
            setTimeout(() => {
                const resetCols = initialColumns.map((col, i) => i === 1 ? { ...col, unlocked: true } : col);
                set({
                    columns: resetCols,
                    phase: 'practice-ten',
                    practiceTenRepetitions: 0
                });
                get().updateButtonVisibility();
                sequenceFeedback("WOW ! 10 petites billes = 1 PAQUET de 10 !", "Clique sur ∇ pour revenir à 9 !");
            }, FEEDBACK_DELAY * 2);
        } else if (phase === 'practice-ten') {
            const tensValue = newCols[1].value;
            const { practiceTenRepetitions } = get();
            
            if (isUnitsColumn(idx) && hasCarry && tensValue === 1) {
                const newRepetitions = practiceTenRepetitions + 1;
                set({ practiceTenRepetitions: newRepetitions });
                
                if (newRepetitions >= 3) {
                    sequenceFeedback("Parfait ! 🎉 Tu as bien compris le concept de paquet !", "Maintenant on va compter AVEC les paquets !");
                    setTimeout(() => {
                        // Start at 10 (1 ten, 0 units)
                        const startCols = initialColumns.map((col, i) => ({ ...col, unlocked: i <= 1 }));
                        startCols[1].value = 1;
                        startCols[0].value = 0;
                        set({
                            columns: startCols,
                            phase: 'learn-ten-to-twenty'
                        });
                        get().updateButtonVisibility();
                        get().setFeedback("DIX ! Tu as 1 paquet ! Ajoute 1 bille ! △ sur UNITÉS");
                    }, FEEDBACK_DELAY * 2);
                } else {
                    get().setFeedback("Encore ! 🎉 Clique sur ∇ pour revenir à 9, puis refais la magie avec △ !");
                }
            }
        } else if (phase === 'learn-ten-to-twenty') {
            const unitsValue = newCols[0].value;
            const tensValue = newCols[1].value;
            
            if (!isUnitsColumn(idx)) {
                get().setFeedback("Non ! Clique sur les UNITÉS (△ sur la colonne de droite) !");
                const revertCols = [...columns];
                set({ columns: revertCols });
                return;
            }
            
            if (unitsValue === 0 && tensValue === 2) {
                // Reached 20!
                sequenceFeedback("💥 VINGT ! 2 paquets de 10 !", "Bravo ! 🎉 Tu as compté de 10 à 20 tout seul !");
                setTimeout(() => {
                    const resetCols = initialColumns.map((col, i) => i === 1 ? { ...col, unlocked: true } : col);
                    set({
                        columns: resetCols,
                        phase: 'challenge-ten-to-twenty'
                    });
                    get().resetTenToTwentyChallenge();
                    get().updateButtonVisibility();
                    get().setFeedback(`🎯 Mini-défi ! Montre-moi **DOUZE** (12) avec les boutons !`);
                }, FEEDBACK_DELAY * 2);
            } else if (unitsValue === 1 && tensValue === 1) {
                get().setFeedback("ONZE ! 1 paquet + 1 bille. Continue ! △");
            } else if (unitsValue === 2 && tensValue === 1) {
                get().setFeedback("DOUZE ! 1 paquet + 2 billes. Encore ! △");
            } else if (unitsValue === 3 && tensValue === 1) {
                get().setFeedback("TREIZE ! Continue ! △");
            } else if (unitsValue === 4 && tensValue === 1) {
                get().setFeedback("QUATORZE ! Encore ! △");
            } else if (unitsValue === 5 && tensValue === 1) {
                get().setFeedback("QUINZE ! Continue ! △");
            } else if (unitsValue === 6 && tensValue === 1) {
                get().setFeedback("SEIZE ! Encore ! △");
            } else if (unitsValue === 7 && tensValue === 1) {
                get().setFeedback("DIX-SEPT ! Tu entends ? DIX-SEPT ! △");
            } else if (unitsValue === 8 && tensValue === 1) {
                get().setFeedback("DIX-HUIT ! Continue ! △");
            } else if (unitsValue === 9 && tensValue === 1) {
                sequenceFeedback("DIX-NEUF ! STOP ✋ Tout est presque plein !", "Que va-t-il se passer ? Clique sur △ !");
            }
        } else if (phase.startsWith('challenge-ten-to-twenty')) {
            const challenge = TEN_TO_TWENTY_CHALLENGES[0];
            const targetNumber = challenge.targets[get().tenToTwentyTargetIndex];
            if (newCols.reduce((acc: number, col: Column, idx: number) => acc + col.value * Math.pow(10, idx), 0) > targetNumber) {
                get().setFeedback(`Oups ! Tu as dépassé ${targetNumber}. Utilise ∇ pour revenir à ${targetNumber} !`);
                return;
            }
        } else if (phase === 'learn-twenty-to-thirty') {
            const unitsValue = newCols[0].value;
            const tensValue = newCols[1].value;
            
            if (!isUnitsColumn(idx)) {
                get().setFeedback("Non ! Continue avec les UNITÉS ! △ sur la colonne de droite !");
                const revertCols = [...columns];
                set({ columns: revertCols });
                return;
            }
            
            if (unitsValue === 0 && tensValue === 3) {
                // Reached 30!
                sequenceFeedback("💥 TRENTE ! TROIS paquets de 10 !", "Bravo ! 🎉 Tu as compris que c'est le même principe que 9→10 et 19→20 !");
                setTimeout(() => {
                    const resetCols = initialColumns.map((col, i) => i === 1 ? { ...col, unlocked: true } : col);
                    // Now move to learn-tens which will start at 30 and count to 90
                    set({
                        columns: resetCols,
                        phase: 'learn-tens',
                        pendingAutoCount: true,
                        isCountingAutomatically: false
                    });
                    get().updateButtonVisibility();
                    sequenceFeedback("Maintenant, regarde la machine compter les dizaines rondes !", "40, 50, 60... Observe bien !");
                }, FEEDBACK_DELAY * 2);
            } else if (unitsValue < 9 && tensValue === 2) {
                const number = tensValue * 10 + unitsValue;
                get().setFeedback(`${number} ! Continue à remplir jusqu'à 29 ! △`);
            } else if (unitsValue === 9 && tensValue === 2) {
                sequenceFeedback("29 ! VINGT-NEUF ! Que va-t-il se passer ?", "Clique sur △ pour découvrir !");
            }
        } else if (phase === 'practice-hundred') {
            const hundredsValue = newCols[2].value;
            const tensValue = newCols[1].value;
            const unitsValue = newCols[0].value;
            const { practiceHundredCount } = get();
            
            if (isUnitsColumn(idx) && hasCarry && hundredsValue === 1 && tensValue === 0 && unitsValue === 0) {
                const newRepetitions = practiceHundredCount + 1;
                set({ practiceHundredCount: newRepetitions });
                
                if (newRepetitions >= 3) {
                    sequenceFeedback("Parfait ! 🎉 Tu as bien compris le concept de GRAND paquet de 100 !", "Maintenant on va compter AVEC ce grand paquet !");
                    setTimeout(() => {
                        const startCols = initialColumns.map((col, i) => ({ ...col, unlocked: i <= 2 }));
                        startCols[2].value = 1;
                        startCols[1].value = 0;
                        startCols[0].value = 0;
                        set({
                            columns: startCols,
                            phase: 'learn-hundred-to-hundred-ten'
                        });
                        get().updateButtonVisibility();
                        get().setFeedback("CENT ! Tu as 1 grand paquet ! Ajoute 1 bille ! △ sur UNITÉS");
                    }, FEEDBACK_DELAY * 2);
                } else {
                    get().setFeedback("Encore ! 🎉 Clique sur ∇ pour revenir à 99, puis refais la magie avec △ !");
                }
            }
        } else if (phase === 'learn-hundred-to-hundred-ten') {
            const unitsValue = newCols[0].value;
            const tensValue = newCols[1].value;
            const hundredsValue = newCols[2].value;
            
            if (!isUnitsColumn(idx)) {
                get().setFeedback("Non ! Clique sur les UNITÉS (△ sur la colonne de droite) !");
                const revertCols = [...columns];
                set({ columns: revertCols });
                return;
            }
            
            if (unitsValue === 0 && tensValue === 1 && hundredsValue === 1) {
                // Reached 110!
                sequenceFeedback("💥 CENT-DIX ! Les billes deviennent 1 paquet de 10 !", "Bravo ! 🎉 Tu vois, ça marche pareil qu'avant, mais avec un grand paquet de base !");
                setTimeout(() => {
                    const startCols = initialColumns.map((col, i) => ({ ...col, unlocked: i <= 2 }));
                    startCols[2].value = 1;
                    startCols[1].value = 1;
                    startCols[0].value = 0;
                    set({
                        columns: startCols,
                        phase: 'learn-hundred-ten-to-two-hundred'
                    });
                    get().updateButtonVisibility();
                    get().setFeedback("CENT-DIX ! Maintenant monte à 120 ! △ sur DIZAINES ou UNITÉS");
                }, FEEDBACK_DELAY * 2);
            } else if (unitsValue === 1 && tensValue === 0 && hundredsValue === 1) {
                get().setFeedback("CENT-UN ! 1 grand paquet + 1 bille. Continue ! △");
            } else if (unitsValue === 2 && tensValue === 0 && hundredsValue === 1) {
                get().setFeedback("CENT-DEUX ! Continue ! △");
            } else if (unitsValue === 3 && tensValue === 0 && hundredsValue === 1) {
                get().setFeedback("CENT-TROIS ! △");
            } else if (unitsValue >= 4 && unitsValue <= 8 && tensValue === 0 && hundredsValue === 1) {
                const number = hundredsValue * 100 + tensValue * 10 + unitsValue;
                get().setFeedback(`${number} ! Continue ! △`);
            } else if (unitsValue === 9 && tensValue === 0 && hundredsValue === 1) {
                sequenceFeedback("CENT-NEUF ! Presque 10 billes !", "Clique sur △ pour voir la transformation !");
            }
        } else if (phase === 'learn-hundred-ten-to-two-hundred') {
            const unitsValue = newCols[0].value;
            const tensValue = newCols[1].value;
            const hundredsValue = newCols[2].value;
            const number = hundredsValue * 100 + tensValue * 10 + unitsValue;
            
            if (!isUnitsColumn(idx)) {
                get().setFeedback("Continue avec les UNITÉS pour l'instant ! △ sur la colonne de droite !");
                const revertCols = [...columns];
                set({ columns: revertCols });
                return;
            }
            
            if (hundredsValue === 2 && tensValue === 0 && unitsValue === 0) {
                // Reached 200!
                sequenceFeedback("💥💥 DEUX-CENTS ! 2 grands paquets de 100 !", "🎉 Bravo ! Tu comprends maintenant que 100-200 = comme 0-100 mais décalé !");
                setTimeout(() => {
                    const resetCols = initialColumns.map((col, i) => ({ ...col, unlocked: i <= 2 }));
                    set({
                        columns: resetCols,
                        phase: 'challenge-hundred-to-two-hundred'
                    });
                    get().resetHundredToTwoHundredChallenge();
                    get().updateButtonVisibility();
                    get().setFeedback(`🎯 Mini-défi ! Montre-moi **${HUNDRED_TO_TWO_HUNDRED_CHALLENGES[0].targets[0]}** (CENT-DIX) !`);
                }, FEEDBACK_DELAY * 2);
            } else if (tensValue === 2 && unitsValue === 0) {
                get().setFeedback(`${number} ! CENT-VINGT ! 1 grand paquet + 2 paquets ! Continue vers 130 ! △`);
            } else if (tensValue === 3 && unitsValue === 0) {
                get().setFeedback(`${number} ! CENT-TRENTE ! → 140 ! △`);
            } else if (tensValue === 4 && unitsValue === 0) {
                get().setFeedback(`${number} ! CENT-QUARANTE ! → 150 ! △`);
            } else if (tensValue === 5 && unitsValue === 0) {
                get().setFeedback(`${number} ! CENT-CINQUANTE ! C'est la moitié de 100+100 ! → 160 ! △`);
            } else if (tensValue === 6 && unitsValue === 0) {
                get().setFeedback(`${number} ! CENT-SOIXANTE ! → 170 ! △`);
            } else if (tensValue === 7 && unitsValue === 0) {
                get().setFeedback(`${number} ! CENT-SOIXANTE-DIX ! → 180 ! △`);
            } else if (tensValue === 8 && unitsValue === 0) {
                get().setFeedback(`${number} ! CENT-QUATRE-VINGT ! → 190 ! △`);
            } else if (tensValue === 9 && unitsValue === 0) {
                get().setFeedback(`${number} ! CENT-QUATRE-VINGT-DIX ! Presque 200 ! Remplis jusqu'à 199 ! △`);
            } else if (tensValue === 9 && unitsValue === 9) {
                sequenceFeedback(`${number} ! CENT-QUATRE-VINGT-DIX-NEUF ! TOUT est plein !`, "Que va-t-il se passer ? △");
            } else {
                get().setFeedback(`${number} ! Continue ! △`);
            }
        } else if (phase.startsWith('challenge-hundred-to-two-hundred')) {
            const challenge = HUNDRED_TO_TWO_HUNDRED_CHALLENGES[0];
            const targetNumber = challenge.targets[get().hundredToTwoHundredTargetIndex];
            if (newCols.reduce((acc: number, col: Column, idx: number) => acc + col.value * Math.pow(10, idx), 0) > targetNumber) {
                get().setFeedback(`Oups ! Tu as dépassé ${targetNumber}. Utilise ∇ pour revenir à ${targetNumber} !`);
                return;
            }
        } else if (phase === 'learn-two-hundred-to-three-hundred') {
            const unitsValue = newCols[0].value;
            const tensValue = newCols[1].value;
            const hundredsValue = newCols[2].value;
            const number = hundredsValue * 100 + tensValue * 10 + unitsValue;
            
            if (!isUnitsColumn(idx)) {
                get().setFeedback("Continue avec les UNITÉS ! △ sur la colonne de droite !");
                const revertCols = [...columns];
                set({ columns: revertCols });
                return;
            }
            
            if (hundredsValue === 3 && tensValue === 0 && unitsValue === 0) {
                // Reached 300!
                sequenceFeedback("💥 TROIS-CENTS ! TROIS grands paquets !", "Bravo ! 🎉 Tu as compris le principe 99→100, 199→200, maintenant 299→300 !");
                setTimeout(() => {
                    const resetCols = initialColumns.map((col, i) => ({ ...col, unlocked: i <= 2 }));
                    set({
                        columns: resetCols,
                        phase: 'challenge-two-hundred-to-three-hundred'
                    });
                    get().resetTwoHundredToThreeHundredChallenge();
                    get().updateButtonVisibility();
                    get().setFeedback(`🎯 Mini-défi ! Montre-moi **${TWO_HUNDRED_TO_THREE_HUNDRED_CHALLENGES[0].targets[0]}** (DEUX-CENT-DIX) !`);
                }, FEEDBACK_DELAY * 2);
            } else if (number === 299) {
                sequenceFeedback("DEUX-CENT-QUATRE-VINGT-DIX-NEUF ! Regarde, TOUT est plein !", "Que va-t-il se passer ? △");
            } else if (number >= 200 && number < 299) {
                if (number % 10 === 0) {
                    get().setFeedback(`${number} ! Continue par dizaines ! △`);
                } else {
                    get().setFeedback(`${number} ! Continue à remplir ! △`);
                }
            }
        } else if (phase.startsWith('challenge-two-hundred-to-three-hundred')) {
            const challenge = TWO_HUNDRED_TO_THREE_HUNDRED_CHALLENGES[0];
            const targetNumber = challenge.targets[get().twoHundredToThreeHundredTargetIndex];
            if (newCols.reduce((acc: number, col: Column, idx: number) => acc + col.value * Math.pow(10, idx), 0) > targetNumber) {
                get().setFeedback(`Oups ! Tu as dépassé ${targetNumber}. Utilise ∇ pour revenir à ${targetNumber} !`);
                return;
            }
        } else if (phase === 'practice-thousand') {
            const thousandsValue = newCols[3].value;
            const hundredsValue = newCols[2].value;
            const tensValue = newCols[1].value;
            const unitsValue = newCols[0].value;
            const { practiceThousandCount } = get();
            
            if (isUnitsColumn(idx) && hasCarry && thousandsValue === 1 && hundredsValue === 0 && tensValue === 0 && unitsValue === 0) {
                const newRepetitions = practiceThousandCount + 1;
                set({ practiceThousandCount: newRepetitions });
                
                if (newRepetitions >= 5) {
                    sequenceFeedback("Parfait ! 🎉 Tu as bien compris le concept d'ÉNORME paquet de 1000 !", "C'est MILLE ! Maintenant on va compter AVEC ce millier !");
                    setTimeout(() => {
                        const startCols = initialColumns.map((col) => ({ ...col, unlocked: true }));
                        startCols[3].value = 1;
                        startCols[2].value = 0;
                        startCols[1].value = 0;
                        startCols[0].value = 0;
                        set({
                            columns: startCols,
                            phase: 'learn-thousand-to-thousand-ten'
                        });
                        get().updateButtonVisibility();
                        get().setFeedback("MILLE ! Tu as 1 ÉNORME paquet ! Ajoute 1 bille ! △ sur UNITÉS");
                    }, FEEDBACK_DELAY * 2);
                } else {
                    get().setFeedback(`Encore ! (${newRepetitions}/5) 🎉 Clique sur ∇ pour revenir à 999, puis refais la magie avec △ !`);
                }
            }
        } else if (phase === 'learn-thousand-to-thousand-ten') {
            const unitsValue = newCols[0].value;
            const tensValue = newCols[1].value;
            const hundredsValue = newCols[2].value;
            const thousandsValue = newCols[3].value;
            const number = thousandsValue * 1000 + hundredsValue * 100 + tensValue * 10 + unitsValue;
            
            if (!isUnitsColumn(idx)) {
                get().setFeedback("Non ! Clique sur les UNITÉS (△ sur la colonne de droite) !");
                const revertCols = [...columns];
                set({ columns: revertCols });
                return;
            }
            
            if (number === 1010) {
                sequenceFeedback("💥 MILLE-DIX ! Les billes deviennent 1 paquet de 10 !", "Bravo ! 🎉 Tu vois, ça marche pareil qu'avant !");
                setTimeout(() => {
                    const startCols = initialColumns.map((col) => ({ ...col, unlocked: true }));
                    startCols[3].value = 1;
                    startCols[1].value = 1;
                    startCols[0].value = 0;
                    set({
                        columns: startCols,
                        phase: 'learn-thousand-to-thousand-hundred'
                    });
                    get().updateButtonVisibility();
                    get().setFeedback("MILLE-DIX ! Maintenant monte à 1100 ! △ sur UNITÉS");
                }, FEEDBACK_DELAY * 2);
            } else if (number === 1001) {
                get().setFeedback("MILLE-UN ! 1 énorme paquet + 1 bille. C'est facile ! △");
            } else if (number === 1002) {
                get().setFeedback("MILLE-DEUX ! Tu vois, c'est comme avant ! △");
            } else if (number === 1003) {
                get().setFeedback("MILLE-TROIS ! Continue ! △");
            } else if (number >= 1004 && number <= 1008) {
                get().setFeedback(`${number} ! Continue ! △`);
            } else if (number === 1009) {
                sequenceFeedback("MILLE-NEUF ! Presque 10 billes !", "Clique sur △ pour voir la transformation !");
            }
        } else if (phase === 'learn-thousand-to-thousand-hundred') {
            const unitsValue = newCols[0].value;
            const tensValue = newCols[1].value;
            const hundredsValue = newCols[2].value;
            const thousandsValue = newCols[3].value;
            const number = thousandsValue * 1000 + hundredsValue * 100 + tensValue * 10 + unitsValue;
            
            if (!isUnitsColumn(idx)) {
                get().setFeedback("Continue avec les UNITÉS pour l'instant ! △ sur la colonne de droite !");
                const revertCols = [...columns];
                set({ columns: revertCols });
                return;
            }
            
            if (number === 1100) {
                sequenceFeedback("💥 MILLE-CENT ! 1 énorme paquet + 1 grand paquet !", "🎉 Bravo ! Tu maîtrises 1000-1100 !");
                setTimeout(() => {
                    const startCols = initialColumns.map((col) => ({ ...col, unlocked: true }));
                    startCols[3].value = 1;
                    startCols[2].value = 1;
                    startCols[0].value = 0;
                    set({
                        columns: startCols,
                        phase: 'learn-thousand-hundred-to-two-thousand'
                    });
                    get().updateButtonVisibility();
                    get().setFeedback("MILLE-CENT ! Maintenant monte jusqu'à 2000 ! △ sur UNITÉS");
                }, FEEDBACK_DELAY * 2);
            } else if (number % 10 === 0 && number >= 1010 && number < 1100) {
                const tens = Math.floor((number % 100) / 10);
                const tensWords = ["", "DIX", "VINGT", "TRENTE", "QUARANTE", "CINQUANTE", "SOIXANTE", "SOIXANTE-DIX", "QUATRE-VINGT", "QUATRE-VINGT-DIX"];
                get().setFeedback(`MILLE-${tensWords[tens]} ! 1 énorme + ${tens} paquets ! Continue ! △`);
            } else if (number >= 1010 && number < 1100) {
                get().setFeedback(`${number} ! Continue à remplir ! △`);
            }
        } else if (phase === 'learn-thousand-hundred-to-two-thousand') {
            const unitsValue = newCols[0].value;
            const tensValue = newCols[1].value;
            const hundredsValue = newCols[2].value;
            const thousandsValue = newCols[3].value;
            const number = thousandsValue * 1000 + hundredsValue * 100 + tensValue * 10 + unitsValue;
            
            if (!isUnitsColumn(idx)) {
                get().setFeedback("Continue avec les UNITÉS pour l'instant ! △");
                const revertCols = [...columns];
                set({ columns: revertCols });
                return;
            }
            
            if (number === 2000) {
                sequenceFeedback("💥💥 DEUX-MILLE ! 2 ÉNORMES paquets !", "🎆 Incroyable ! Tu comprends maintenant que 1000-2000 = comme 0-1000 mais décalé !");
                setTimeout(() => {
                    const resetCols = initialColumns.map((col) => ({ ...col, unlocked: true }));
                    set({
                        columns: resetCols,
                        phase: 'challenge-thousand-to-two-thousand'
                    });
                    get().resetThousandToTwoThousandChallenge();
                    get().updateButtonVisibility();
                    get().setFeedback(`🎯 Mini-défis 1000-2000 ! Montre-moi **${THOUSAND_TO_TWO_THOUSAND_CHALLENGES[0].targets[0]}** (MILLE-UN) !`);
                }, FEEDBACK_DELAY * 2);
            } else if (number === 1999) {
                sequenceFeedback("MILLE-NEUF-CENT-QUATRE-VINGT-DIX-NEUF ! TOUT est plein !", "△ pour la magie !");
            } else if (number >= 1100 && number < 2000) {
                if (number % 100 === 0) {
                    const hundreds = Math.floor((number % 1000) / 100);
                    const hundredsWords = ["", "CENT", "DEUX-CENTS", "TROIS-CENTS", "QUATRE-CENTS", "CINQ-CENTS", "SIX-CENTS", "SEPT-CENTS", "HUIT-CENTS", "NEUF-CENTS"];
                    get().setFeedback(`MILLE-${hundredsWords[hundreds]} ! Continue ! △`);
                } else {
                    get().setFeedback(`${number} ! Continue à remplir ! △`);
                }
            }
        } else if (phase.startsWith('challenge-thousand-to-two-thousand')) {
            const challenge = THOUSAND_TO_TWO_THOUSAND_CHALLENGES[0];
            const targetNumber = challenge.targets[get().thousandToTwoThousandTargetIndex];
            if (newCols.reduce((acc: number, col: Column, idx: number) => acc + col.value * Math.pow(10, idx), 0) > targetNumber) {
                get().setFeedback(`Oups ! Tu as dépassé ${targetNumber}. Utilise ∇ pour revenir à ${targetNumber} !`);
                return;
            }
        } else if (phase === 'learn-two-thousand-to-three-thousand') {
            const unitsValue = newCols[0].value;
            const tensValue = newCols[1].value;
            const hundredsValue = newCols[2].value;
            const thousandsValue = newCols[3].value;
            const number = thousandsValue * 1000 + hundredsValue * 100 + tensValue * 10 + unitsValue;
            
            if (!isUnitsColumn(idx)) {
                get().setFeedback("Continue avec les UNITÉS ! △");
                const revertCols = [...columns];
                set({ columns: revertCols });
                return;
            }
            
            if (number === 3000) {
                sequenceFeedback("💥 TROIS-MILLE ! TROIS ÉNORMES paquets !", "Bravo ! 🎉 Tu as compris le principe 999→1000, 1999→2000, maintenant 2999→3000 !");
                setTimeout(() => {
                    const resetCols = initialColumns.map((col) => ({ ...col, unlocked: true }));
                    set({
                        columns: resetCols,
                        phase: 'challenge-two-thousand-to-three-thousand'
                    });
                    get().resetTwoThousandToThreeThousandChallenge();
                    get().updateButtonVisibility();
                    get().setFeedback(`🎯 Mini-défi ! Montre-moi **${TWO_THOUSAND_TO_THREE_THOUSAND_CHALLENGES[0].targets[0]}** (DEUX-MILLE) !`);
                }, FEEDBACK_DELAY * 2);
            } else if (number === 2999) {
                sequenceFeedback("DEUX-MILLE-NEUF-CENT-QUATRE-VINGT-DIX-NEUF ! Regarde, TOUT est plein !", "Que va-t-il se passer ? △");
            } else if (number >= 2000 && number < 3000) {
                if (number === 2500) {
                    get().setFeedback(`DEUX-MILLE-CINQ-CENTS ! À mi-chemin ! Continue ! △`);
                } else if (number === 2900) {
                    get().setFeedback(`DEUX-MILLE-NEUF-CENTS ! Remplis tout jusqu'à 2999 ! △`);
                } else if (number % 100 === 0) {
                    get().setFeedback(`${number} ! Continue ! △`);
                } else {
                    get().setFeedback(`${number} ! Continue à remplir ! △`);
                }
            }
        } else if (phase.startsWith('challenge-two-thousand-to-three-thousand')) {
            const challenge = TWO_THOUSAND_TO_THREE_THOUSAND_CHALLENGES[0];
            const targetNumber = challenge.targets[get().twoThousandToThreeThousandTargetIndex];
            if (newCols.reduce((acc: number, col: Column, idx: number) => acc + col.value * Math.pow(10, idx), 0) > targetNumber) {
                get().setFeedback(`Oups ! Tu as dépassé ${targetNumber}. Utilise ∇ pour revenir à ${targetNumber} !`);
                return;
            }
        } else if (phase.startsWith('challenge-thousands-simple-combination')) {
            const challenge = THOUSANDS_SIMPLE_COMBINATION_CHALLENGES[0];
            const targetNumber = challenge.targets[get().thousandsSimpleCombinationTargetIndex];
            if (newCols.reduce((acc: number, col: Column, idx: number) => acc + col.value * Math.pow(10, idx), 0) > targetNumber) {
                get().setFeedback(`Oups ! Tu as dépassé ${targetNumber}. Utilise ∇ pour revenir à ${targetNumber} !`);
                return;
            }
        } else if (phase === 'normal' && hasCarry) {
            get().setFeedback("Échange magique ! 10 billes → 1 bille dans la colonne de gauche ! 🎩");
        } else if (phase === 'normal' || phase === 'done' || phase === 'learn-units') {
            get().setFeedback(`🎈 ${newCols[idx].value} bille${newCols[idx].value > 1 ? 's' : ''} dans ${newCols[idx].name}. Clique sur △ ou ∇ !`);
        }
    },

    handleSubtract: (idx: number) => {
        const { isCountingAutomatically, phase, columns } = get();
        const totalNumber = columns.reduce((acc: number, col: Column, idx: number) => acc + col.value * Math.pow(10, idx), 0);
        const { sequenceFeedback, resetUnitChallenge } = get();

        if (isCountingAutomatically) return;

        const isUnitsColumn = (i: number) => i === 0;

        // Handle new intro phases
        if (phase === 'intro-discover-carry') {
            if (idx === 0 && columns[0].value === 0 && columns[1].value > 0) {
                // Borrow from tens
                const newCols = [...columns];
                newCols[1].value--;
                newCols[0].value = 9;
                set({ columns: newCols });
                
                setTimeout(() => {
                    sequenceFeedback(
                        "Tu as vu ? La GROSSE lumière est redevenue 10 PETITES !",
                        "C'est INCROYABLE ! 🎪 Refais l'aller-retour plusieurs fois pour bien comprendre !"
                    );
                    setTimeout(() => {
                        set({ feedback: "Alors, tu as compris le truc ? 😊 Continue à explorer !" });
                        setTimeout(() => {
                            set({ showInputField: true, phase: 'intro-count-digits' });
                            get().updateInstruction();
                        }, FEEDBACK_DELAY * 2);
                    }, FEEDBACK_DELAY);
                }, 500);
                return;
            } else if (idx === 0 && columns[0].value > 0) {
                const newCols = [...columns];
                newCols[0].value--;
                set({ columns: newCols });
                return;
            }
            return;
        } else if (phase === 'intro-first-interaction') {
            // Allow decrementing during first interaction
            if (idx === 0 && columns[0].value > 0) {
                const newCols = [...columns];
                newCols[0].value--;
                set({ columns: newCols });
                
                if (get().introClickCount === 9 && columns[0].value > 0) {
                    set({ feedback: "Le bouton ROUGE enlève les lumières ! △ ajoute, ∇ enlève ! C'est simple ! 😊" });
                    setTimeout(() => {
                        set({ showInputField: true, phase: 'intro-count-digits' });
                        get().updateInstruction();
                    }, 2000);
                }
            }
            return;
        }

        const isAllowedColumn = () => {
            if (phase === 'normal') return true;
            if (isUnitsColumn(idx)) return true;
            if (phase === 'practice-ten' || phase === 'learn-ten-to-twenty' || phase === 'challenge-ten-to-twenty' || phase === 'learn-twenty-to-thirty') return isUnitsColumn(idx);
            if (phase === 'practice-hundred' || phase === 'learn-hundred-to-hundred-ten' || phase === 'learn-hundred-ten-to-two-hundred' || phase === 'challenge-hundred-to-two-hundred') return isUnitsColumn(idx);
            if (phase === 'learn-two-hundred-to-three-hundred' || phase === 'challenge-two-hundred-to-three-hundred') return isUnitsColumn(idx);
            if (idx === 1 && (phase.startsWith('challenge-tens-') || phase === 'learn-tens-combination')) return true;
            if ((idx === 1 || idx === 2) && (phase.startsWith('challenge-hundreds-') || phase === 'learn-hundreds-combination' || phase === 'learn-hundreds-simple-combination')) return true;
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
            if (phase === 'practice-ten' && newCols[0].value === 9 && newCols[1].value === 0) {
                get().setFeedback("Bien ! Tu es revenu à 9. Maintenant, refais la magie ! Clique sur △ pour transformer 10 billes en 1 paquet !");
            } else if (phase === 'practice-hundred' && newCols[0].value === 9 && newCols[1].value === 9 && newCols[2].value === 0) {
                get().setFeedback("Bien ! Tu es revenu à 99. Maintenant, refais la magie ! Clique sur △ pour voir 100 !");
            } else if (phase === 'practice-thousand' && newCols[0].value === 9 && newCols[1].value === 9 && newCols[2].value === 9 && newCols[3].value === 0) {
                get().setFeedback("Bien ! Tu es revenu à 999. Maintenant, refais la magie ! Clique sur △ pour voir 1000 !");
            } else if (phase === 'learn-ten-to-twenty') {
                get().setFeedback("On ne descend pas ! Continue à monter avec △ sur UNITÉS !");
            } else if (phase === 'learn-twenty-to-thirty') {
                get().setFeedback("On ne descend pas ! Continue à monter avec △ sur UNITÉS !");
            } else if (phase === 'learn-hundred-to-hundred-ten') {
                get().setFeedback("On ne descend pas ! Continue à monter avec △ sur UNITÉS !");
            } else if (phase === 'learn-hundred-ten-to-two-hundred') {
                get().setFeedback("On ne descend pas ! Continue à monter avec △ sur UNITÉS !");
            } else if (phase === 'learn-two-hundred-to-three-hundred') {
                get().setFeedback("On ne descend pas ! Continue à monter avec △ sur UNITÉS !");
            } else if (phase === 'learn-thousand-to-thousand-ten') {
                get().setFeedback("On ne descend pas ! Continue à monter avec △ sur UNITÉS !");
            } else if (phase === 'learn-thousand-to-thousand-hundred') {
                get().setFeedback("On ne descend pas ! Continue à monter avec △ sur UNITÉS !");
            } else if (phase === 'learn-thousand-hundred-to-two-thousand') {
                get().setFeedback("On ne descend pas ! Continue à monter avec △ sur UNITÉS !");
            } else if (phase === 'learn-two-thousand-to-three-thousand') {
                get().setFeedback("On ne descend pas ! Continue à monter avec △ sur UNITÉS !");
            } else if (!['click-remove', 'tutorial', 'explore-units'].includes(phase) && !phase.startsWith('challenge-unit-') && phase !== 'challenge-ten-to-twenty') {
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

    handleValidateLearning: () => {
        const { phase, columns, unitTargetIndex, unitSuccessCount, sequenceFeedback, resetUnitChallenge, attemptCount, consecutiveFailures, resetAttempts, setAttemptCount, setConsecutiveFailures, setShowHelpOptions, totalChallengesCompleted, setTotalChallengesCompleted, setCurrentTarget } = get();
        const challengePhases = ['challenge-unit-1', 'challenge-unit-2', 'challenge-unit-3'] as const;
        const challengeIndex = challengePhases.indexOf(phase as typeof challengePhases[number]);
        if (challengeIndex === -1) return;

        const challenge = UNIT_CHALLENGES[challengeIndex];
        const targetNumber = challenge.targets[unitTargetIndex];
        const currentNumber = columns[0].value;
        
        // Set current target for help system
        setCurrentTarget(targetNumber);

        if (currentNumber === targetNumber) {
            // SUCCESS!
            const successMsg = getSuccessMessage(attemptCount + 1, false);
            get().setFeedback(successMsg);
            
            // Reset attempts and update stats
            resetAttempts();
            setConsecutiveFailures(0);
            setTotalChallengesCompleted(totalChallengesCompleted + 1);
            
            const newSuccessCount = unitSuccessCount + 1;
            set({ unitSuccessCount: newSuccessCount });

            if (unitTargetIndex + 1 >= challenge.targets.length) {
                if (challengeIndex === UNIT_CHALLENGES.length - 1) {
                    setTimeout(() => {
                        set({ phase: 'learn-carry' });
                        get().updateButtonVisibility();
                        sequenceFeedback("Prêt pour la magie ? 🎩 Clique sur △ pour l'échange 10 pour 1 !", "Vas-y ! Clique sur △ pour voir la transformation !");
                    }, FEEDBACK_DELAY);
                } else {
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
            // FAILURE - Generate progressive feedback
            const newAttemptCount = attemptCount + 1;
            setAttemptCount(newAttemptCount);
            
            const feedbackMsg = generateFeedback({
                attemptCount: newAttemptCount,
                consecutiveFailures,
                frustrationLevel: detectFrustration(consecutiveFailures),
                currentTarget: targetNumber,
                lastUserAnswer: currentNumber
            });
            
            get().setFeedback(feedbackMsg.message);
            
            // Show help options on 4th attempt
            if (feedbackMsg.showHelp) {
                setShowHelpOptions(true);
            }
            
            // If too many attempts, increase consecutive failures
            if (newAttemptCount >= 4) {
                const newConsecutiveFailures = consecutiveFailures + 1;
                setConsecutiveFailures(newConsecutiveFailures);
                
                // Check for high frustration
                if (newConsecutiveFailures >= 3) {
                    setTimeout(() => {
                        get().setFeedback(getFrustrationInterventionMessage());
                    }, FEEDBACK_DELAY * 2);
                }
            }
        }
    },

    handleValidateTenToTwenty: () => {
        const { phase, columns, tenToTwentyTargetIndex, tenToTwentySuccessCount, sequenceFeedback, attemptCount, consecutiveFailures, resetAttempts, setAttemptCount, setConsecutiveFailures, setShowHelpOptions, totalChallengesCompleted, setTotalChallengesCompleted } = get();
        const totalNumber = columns.reduce((acc: number, col: Column, idx: number) => acc + col.value * Math.pow(10, idx), 0);
        
        if (phase !== 'challenge-ten-to-twenty') return;

        const challenge = TEN_TO_TWENTY_CHALLENGES[0];
        const targetNumber = challenge.targets[tenToTwentyTargetIndex];

        if (totalNumber === targetNumber) {
            // SUCCESS!
            const successMsg = getSuccessMessage(attemptCount + 1, false);
            get().setFeedback(successMsg);
            
            // Reset attempts and update stats
            resetAttempts();
            setConsecutiveFailures(0);
            setTotalChallengesCompleted(totalChallengesCompleted + 1);
            
            const newSuccessCount = tenToTwentySuccessCount + 1;
            set({ tenToTwentySuccessCount: newSuccessCount });

            if (tenToTwentyTargetIndex + 1 >= challenge.targets.length) {
                // All challenges completed!
                setTimeout(() => {
                    // Start learn-twenty-to-thirty at 20 (2 tens, 0 units)
                    const startCols = initialColumns.map((col, i) => ({ ...col, unlocked: i <= 1 }));
                    startCols[1].value = 2;
                    startCols[0].value = 0;
                    set({
                        columns: startCols,
                        phase: 'learn-twenty-to-thirty'
                    });
                    get().updateButtonVisibility();
                    sequenceFeedback("Maintenant, remplis la colonne des unités jusqu'à 9 !", "Clique sur △ pour ajouter des billes !");
                }, FEEDBACK_DELAY * 2);
            } else {
                const nextTarget = challenge.targets[tenToTwentyTargetIndex + 1];
                const resetCols = initialColumns.map((col, i) => i === 1 ? { ...col, unlocked: true } : col);
                set({ tenToTwentyTargetIndex: tenToTwentyTargetIndex + 1, columns: resetCols });
                sequenceFeedback(`✅ Correct ! ${newSuccessCount}/${challenge.targets.length} réussis !`, `Maintenant affiche **${nextTarget}** !`);
            }
        } else {
            // FAILURE - Generate progressive feedback
            const newAttemptCount = attemptCount + 1;
            setAttemptCount(newAttemptCount);
            
            const feedbackMsg = generateFeedback({
                attemptCount: newAttemptCount,
                consecutiveFailures,
                frustrationLevel: detectFrustration(consecutiveFailures),
                currentTarget: targetNumber,
                lastUserAnswer: totalNumber
            });
            
            get().setFeedback(feedbackMsg.message);
            
            // Show help options on 4th attempt
            if (feedbackMsg.showHelp) {
                setShowHelpOptions(true);
            }
            
            // If too many attempts, increase consecutive failures
            if (newAttemptCount >= 4) {
                const newConsecutiveFailures = consecutiveFailures + 1;
                setConsecutiveFailures(newConsecutiveFailures);
                
                // Check for high frustration
                if (newConsecutiveFailures >= 3) {
                    setTimeout(() => {
                        get().setFeedback(getFrustrationInterventionMessage());
                    }, FEEDBACK_DELAY * 2);
                }
            }
        }
    },

    handleValidateTens: () => {
        const { phase, columns, tensTargetIndex, tensSuccessCount, sequenceFeedback, resetTensChallenge, attemptCount, consecutiveFailures, resetAttempts, setAttemptCount, setConsecutiveFailures, setShowHelpOptions, totalChallengesCompleted, setTotalChallengesCompleted, setCurrentTarget } = get();
        const totalNumber = columns.reduce((acc: number, col: Column, idx: number) => acc + col.value * Math.pow(10, idx), 0);
        const challengePhases = ['challenge-tens-1', 'challenge-tens-2', 'challenge-tens-3'] as const;
        const challengeIndex = challengePhases.indexOf(phase as typeof challengePhases[number]);
        if (challengeIndex === -1) return;

        const challenge = TENS_CHALLENGES[challengeIndex];
        const targetNumber = challenge.targets[tensTargetIndex];
        
        // Set current target for help system
        setCurrentTarget(targetNumber);

        if (totalNumber === targetNumber) {
            // SUCCESS!
            const successMsg = getSuccessMessage(attemptCount + 1, false);
            get().setFeedback(successMsg);
            
            // Reset attempts and update stats
            resetAttempts();
            setConsecutiveFailures(0);
            setTotalChallengesCompleted(totalChallengesCompleted + 1);
            
            const newSuccessCount = tensSuccessCount + 1;
            set({ tensSuccessCount: newSuccessCount });

            if (tensTargetIndex + 1 >= challenge.targets.length) {
                if (challengeIndex === TENS_CHALLENGES.length - 1) {
                    set((state: MachineState) => ({ completedChallenges: { ...state.completedChallenges, tens: true } }));
                    setTimeout(() => {
                        const newCols = [...get().columns];
                        if (!newCols[2].unlocked) {
                            newCols[2].unlocked = true;
                            set({ columns: newCols });
                        }
                        // Set up for practice-hundred: start at 99
                        const resetCols = initialColumns.map((col, i) => (i === 1 || i === 2) ? { ...col, unlocked: true } : col);
                        resetCols[1].value = 9;
                        resetCols[0].value = 9;
                        set({
                            columns: resetCols,
                            phase: 'practice-hundred',
                            practiceHundredCount: 0
                        });
                        get().updateButtonVisibility();
                        sequenceFeedback("APPRENTISSAGE DES DIZAINES TERMINÉ ! Bravo ! 🎉", "NIVEAU DÉBLOQUÉ : Les CENTAINES ! 💯 STOP ! Regarde bien : TOUT est plein ! 9 paquets de 10 + 9 billes. Clique sur △ pour voir une GRANDE MAGIE ! ✨");
                    }, FEEDBACK_DELAY * 2);
                } else {
                    const nextChallenge = TENS_CHALLENGES[challengeIndex + 1];
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
            // FAILURE - Generate progressive feedback
            const newAttemptCount = attemptCount + 1;
            setAttemptCount(newAttemptCount);
            
            const feedbackMsg = generateFeedback({
                attemptCount: newAttemptCount,
                consecutiveFailures,
                frustrationLevel: detectFrustration(consecutiveFailures),
                currentTarget: targetNumber,
                lastUserAnswer: totalNumber
            });
            
            get().setFeedback(feedbackMsg.message);
            
            // Show help options on 4th attempt
            if (feedbackMsg.showHelp) {
                setShowHelpOptions(true);
            }
            
            // If too many attempts, increase consecutive failures
            if (newAttemptCount >= 4) {
                const newConsecutiveFailures = consecutiveFailures + 1;
                setConsecutiveFailures(newConsecutiveFailures);
                
                // Check for high frustration
                if (newConsecutiveFailures >= 3) {
                    setTimeout(() => {
                        get().setFeedback(getFrustrationInterventionMessage());
                    }, FEEDBACK_DELAY * 2);
                }
            }
        }
    },

    handleValidateHundredToTwoHundred: () => {
        const { phase, columns, hundredToTwoHundredTargetIndex, hundredToTwoHundredSuccessCount, sequenceFeedback, attemptCount, consecutiveFailures, resetAttempts, setAttemptCount, setConsecutiveFailures, setShowHelpOptions, totalChallengesCompleted, setTotalChallengesCompleted } = get();
        const totalNumber = columns.reduce((acc: number, col: Column, idx: number) => acc + col.value * Math.pow(10, idx), 0);
        
        if (phase !== 'challenge-hundred-to-two-hundred') return;

        const challenge = HUNDRED_TO_TWO_HUNDRED_CHALLENGES[0];
        const targetNumber = challenge.targets[hundredToTwoHundredTargetIndex];

        if (totalNumber === targetNumber) {
            // SUCCESS!
            const successMsg = getSuccessMessage(attemptCount + 1, false);
            get().setFeedback(successMsg);
            
            // Reset attempts and update stats
            resetAttempts();
            setConsecutiveFailures(0);
            setTotalChallengesCompleted(totalChallengesCompleted + 1);
            
            const newSuccessCount = hundredToTwoHundredSuccessCount + 1;
            set({ hundredToTwoHundredSuccessCount: newSuccessCount });

            if (hundredToTwoHundredTargetIndex + 1 >= challenge.targets.length) {
                // All challenges completed!
                setTimeout(() => {
                    // Start learn-two-hundred-to-three-hundred at 200
                    const startCols = initialColumns.map((col, i) => ({ ...col, unlocked: i <= 2 }));
                    startCols[2].value = 2;
                    startCols[1].value = 0;
                    startCols[0].value = 0;
                    set({
                        columns: startCols,
                        phase: 'learn-two-hundred-to-three-hundred'
                    });
                    get().updateButtonVisibility();
                    sequenceFeedback("Maintenant, remplis tout jusqu'à 299 !", "Clique sur △ pour ajouter des billes !");
                }, FEEDBACK_DELAY * 2);
            } else {
                const nextTarget = challenge.targets[hundredToTwoHundredTargetIndex + 1];
                const resetCols = initialColumns.map((col, i) => ({ ...col, unlocked: i <= 2 }));
                set({ hundredToTwoHundredTargetIndex: hundredToTwoHundredTargetIndex + 1, columns: resetCols });
                sequenceFeedback(`✅ Correct ! ${newSuccessCount}/${challenge.targets.length} réussis !`, `Maintenant affiche **${nextTarget}** !`);
            }
        } else {
            // FAILURE - Generate progressive feedback
            const newAttemptCount = attemptCount + 1;
            setAttemptCount(newAttemptCount);
            
            const feedbackMsg = generateFeedback({
                attemptCount: newAttemptCount,
                consecutiveFailures,
                frustrationLevel: detectFrustration(consecutiveFailures),
                currentTarget: targetNumber,
                lastUserAnswer: totalNumber
            });
            
            get().setFeedback(feedbackMsg.message);
            
            // Show help options on 4th attempt
            if (feedbackMsg.showHelp) {
                setShowHelpOptions(true);
            }
            
            // If too many attempts, increase consecutive failures
            if (newAttemptCount >= 4) {
                const newConsecutiveFailures = consecutiveFailures + 1;
                setConsecutiveFailures(newConsecutiveFailures);
                
                // Check for high frustration
                if (newConsecutiveFailures >= 3) {
                    setTimeout(() => {
                        get().setFeedback(getFrustrationInterventionMessage());
                    }, FEEDBACK_DELAY * 2);
                }
            }
        }
    },

    handleValidateTwoHundredToThreeHundred: () => {
        const { phase, columns, twoHundredToThreeHundredTargetIndex, twoHundredToThreeHundredSuccessCount, sequenceFeedback, attemptCount, consecutiveFailures, resetAttempts, setAttemptCount, setConsecutiveFailures, setShowHelpOptions, totalChallengesCompleted, setTotalChallengesCompleted } = get();
        const totalNumber = columns.reduce((acc: number, col: Column, idx: number) => acc + col.value * Math.pow(10, idx), 0);
        
        if (phase !== 'challenge-two-hundred-to-three-hundred') return;

        const challenge = TWO_HUNDRED_TO_THREE_HUNDRED_CHALLENGES[0];
        const targetNumber = challenge.targets[twoHundredToThreeHundredTargetIndex];

        if (totalNumber === targetNumber) {
            // SUCCESS!
            const successMsg = getSuccessMessage(attemptCount + 1, false);
            get().setFeedback(successMsg);
            
            // Reset attempts and update stats
            resetAttempts();
            setConsecutiveFailures(0);
            setTotalChallengesCompleted(totalChallengesCompleted + 1);
            
            const newSuccessCount = twoHundredToThreeHundredSuccessCount + 1;
            set({ twoHundredToThreeHundredSuccessCount: newSuccessCount });

            if (twoHundredToThreeHundredTargetIndex + 1 >= challenge.targets.length) {
                // All challenges completed!
                setTimeout(() => {
                    const resetCols = initialColumns.map((col, i) => ({ ...col, unlocked: i <= 2 }));
                    set({
                        columns: resetCols,
                        phase: 'learn-hundreds',
                        pendingAutoCount: true,
                        isCountingAutomatically: false
                    });
                    get().updateButtonVisibility();
                    sequenceFeedback("Bravo ! Maintenant regarde la machine compter les centaines rondes !", "300, 400, 500... Observe bien !");
                }, FEEDBACK_DELAY * 2);
            } else {
                const nextTarget = challenge.targets[twoHundredToThreeHundredTargetIndex + 1];
                const resetCols = initialColumns.map((col, i) => ({ ...col, unlocked: i <= 2 }));
                set({ twoHundredToThreeHundredTargetIndex: twoHundredToThreeHundredTargetIndex + 1, columns: resetCols });
                sequenceFeedback(`✅ Correct ! ${newSuccessCount}/${challenge.targets.length} réussis !`, `Maintenant affiche **${nextTarget}** !`);
            }
        } else {
            // FAILURE - Generate progressive feedback
            const newAttemptCount = attemptCount + 1;
            setAttemptCount(newAttemptCount);
            
            const feedbackMsg = generateFeedback({
                attemptCount: newAttemptCount,
                consecutiveFailures,
                frustrationLevel: detectFrustration(consecutiveFailures),
                currentTarget: targetNumber,
                lastUserAnswer: totalNumber
            });
            
            get().setFeedback(feedbackMsg.message);
            
            // Show help options on 4th attempt
            if (feedbackMsg.showHelp) {
                setShowHelpOptions(true);
            }
            
            // If too many attempts, increase consecutive failures
            if (newAttemptCount >= 4) {
                const newConsecutiveFailures = consecutiveFailures + 1;
                setConsecutiveFailures(newConsecutiveFailures);
                
                // Check for high frustration
                if (newConsecutiveFailures >= 3) {
                    setTimeout(() => {
                        get().setFeedback(getFrustrationInterventionMessage());
                    }, FEEDBACK_DELAY * 2);
                }
            }
        }
    },

    handleValidateHundreds: () => {
        const { phase, columns, hundredsTargetIndex, hundredsSuccessCount, sequenceFeedback, resetHundredsChallenge, attemptCount, consecutiveFailures, resetAttempts, setAttemptCount, setConsecutiveFailures, setShowHelpOptions, totalChallengesCompleted, setTotalChallengesCompleted } = get();
        const totalNumber = columns.reduce((acc: number, col: Column, idx: number) => acc + col.value * Math.pow(10, idx), 0);
        const challengePhases = ['challenge-hundreds-1', 'challenge-hundreds-2', 'challenge-hundreds-3'] as const;
        const challengeIndex = challengePhases.indexOf(phase as typeof challengePhases[number]);
        if (challengeIndex === -1) return;

        const challenge = HUNDREDS_CHALLENGES[challengeIndex];
        const targetNumber = challenge.targets[hundredsTargetIndex];

        if (totalNumber === targetNumber) {
            // SUCCESS!
            const successMsg = getSuccessMessage(attemptCount + 1, false);
            get().setFeedback(successMsg);
            
            // Reset attempts and update stats
            resetAttempts();
            setConsecutiveFailures(0);
            setTotalChallengesCompleted(totalChallengesCompleted + 1);
            
            const newSuccessCount = hundredsSuccessCount + 1;
            set({ hundredsSuccessCount: newSuccessCount });

            if (hundredsTargetIndex + 1 >= challenge.targets.length) {
                if (challengeIndex === HUNDREDS_CHALLENGES.length - 1) {
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
                            phase: 'celebration-before-thousands',
                            pendingAutoCount: false,
                            isCountingAutomatically: false
                        });
                        get().updateButtonVisibility();
                        sequenceFeedback("APPRENTISSAGE DES CENTAINES TERMINÉ ! Bravo ! 🎉", "🏆 BRAVO CHAMPION ! Tu maîtrises les centaines ! C'est INCROYABLE !");
                    }, FEEDBACK_DELAY * 2);
                } else {
                    const nextChallenge = HUNDREDS_CHALLENGES[challengeIndex + 1];
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
            // FAILURE - Generate progressive feedback
            const newAttemptCount = attemptCount + 1;
            setAttemptCount(newAttemptCount);
            
            const feedbackMsg = generateFeedback({
                attemptCount: newAttemptCount,
                consecutiveFailures,
                frustrationLevel: detectFrustration(consecutiveFailures),
                currentTarget: targetNumber,
                lastUserAnswer: totalNumber
            });
            
            get().setFeedback(feedbackMsg.message);
            
            // Show help options on 4th attempt
            if (feedbackMsg.showHelp) {
                setShowHelpOptions(true);
            }
            
            // If too many attempts, increase consecutive failures
            if (newAttemptCount >= 4) {
                const newConsecutiveFailures = consecutiveFailures + 1;
                setConsecutiveFailures(newConsecutiveFailures);
                
                // Check for high frustration
                if (newConsecutiveFailures >= 3) {
                    setTimeout(() => {
                        get().setFeedback(getFrustrationInterventionMessage());
                    }, FEEDBACK_DELAY * 2);
                }
            }
        }
    },

    handleValidateThousandToTwoThousand: () => {
        const { phase, columns, thousandToTwoThousandTargetIndex, thousandToTwoThousandSuccessCount, sequenceFeedback, attemptCount, consecutiveFailures, resetAttempts, setAttemptCount, setConsecutiveFailures, setShowHelpOptions, totalChallengesCompleted, setTotalChallengesCompleted } = get();
        const totalNumber = columns.reduce((acc: number, col: Column, idx: number) => acc + col.value * Math.pow(10, idx), 0);
        
        if (phase !== 'challenge-thousand-to-two-thousand') return;

        const challenge = THOUSAND_TO_TWO_THOUSAND_CHALLENGES[0];
        const targetNumber = challenge.targets[thousandToTwoThousandTargetIndex];

        if (totalNumber === targetNumber) {
            // SUCCESS!
            const successMsg = getSuccessMessage(attemptCount + 1, false);
            get().setFeedback(successMsg);
            
            // Reset attempts and update stats
            resetAttempts();
            setConsecutiveFailures(0);
            setTotalChallengesCompleted(totalChallengesCompleted + 1);
            
            const newSuccessCount = thousandToTwoThousandSuccessCount + 1;
            set({ thousandToTwoThousandSuccessCount: newSuccessCount });

            if (thousandToTwoThousandTargetIndex + 1 >= challenge.targets.length) {
                // All challenges completed!
                get().setFeedback("🎉 Tous les mini-défis 1000-2000 réussis ! Tu maîtrises la zone 1000-2000 !");
                setTimeout(() => {
                    const resetCols = initialColumns.map((col) => ({ ...col, unlocked: true }));
                    resetCols[3].value = 2;
                    resetCols[2].value = 0;
                    resetCols[1].value = 0;
                    resetCols[0].value = 0;
                    set({
                        columns: resetCols,
                        phase: 'learn-two-thousand-to-three-thousand',
                        pendingAutoCount: false,
                        isCountingAutomatically: false
                    });
                    get().updateButtonVisibility();
                    sequenceFeedback("Bravo ! Maintenant on va découvrir 2000-3000 !", "DEUX-MILLE ! Monte directement à 2500 ! △");
                }, FEEDBACK_DELAY * 2);
            } else {
                const nextTarget = challenge.targets[thousandToTwoThousandTargetIndex + 1];
                const resetCols = initialColumns.map((col) => ({ ...col, unlocked: true }));
                set({ thousandToTwoThousandTargetIndex: thousandToTwoThousandTargetIndex + 1, columns: resetCols });
                sequenceFeedback(`✅ Correct ! ${newSuccessCount}/${challenge.targets.length} réussis !`, `Maintenant affiche **${nextTarget}** !`);
            }
        } else {
            // FAILURE - Generate progressive feedback
            const newAttemptCount = attemptCount + 1;
            setAttemptCount(newAttemptCount);
            
            const feedbackMsg = generateFeedback({
                attemptCount: newAttemptCount,
                consecutiveFailures,
                frustrationLevel: detectFrustration(consecutiveFailures),
                currentTarget: targetNumber,
                lastUserAnswer: totalNumber
            });
            
            get().setFeedback(feedbackMsg.message);
            
            // Show help options on 4th attempt
            if (feedbackMsg.showHelp) {
                setShowHelpOptions(true);
            }
            
            // If too many attempts, increase consecutive failures
            if (newAttemptCount >= 4) {
                const newConsecutiveFailures = consecutiveFailures + 1;
                setConsecutiveFailures(newConsecutiveFailures);
                
                // Check for high frustration
                if (newConsecutiveFailures >= 3) {
                    setTimeout(() => {
                        get().setFeedback(getFrustrationInterventionMessage());
                    }, FEEDBACK_DELAY * 2);
                }
            }
        }
    },

    handleValidateTwoThousandToThreeThousand: () => {
        const { phase, columns, twoThousandToThreeThousandTargetIndex, twoThousandToThreeThousandSuccessCount, sequenceFeedback, attemptCount, consecutiveFailures, resetAttempts, setAttemptCount, setConsecutiveFailures, setShowHelpOptions, totalChallengesCompleted, setTotalChallengesCompleted } = get();
        const totalNumber = columns.reduce((acc: number, col: Column, idx: number) => acc + col.value * Math.pow(10, idx), 0);
        
        if (phase !== 'challenge-two-thousand-to-three-thousand') return;

        const challenge = TWO_THOUSAND_TO_THREE_THOUSAND_CHALLENGES[0];
        const targetNumber = challenge.targets[twoThousandToThreeThousandTargetIndex];

        if (totalNumber === targetNumber) {
            // SUCCESS!
            const successMsg = getSuccessMessage(attemptCount + 1, false);
            get().setFeedback(successMsg);
            
            // Reset attempts and update stats
            resetAttempts();
            setConsecutiveFailures(0);
            setTotalChallengesCompleted(totalChallengesCompleted + 1);
            
            const newSuccessCount = twoThousandToThreeThousandSuccessCount + 1;
            set({ twoThousandToThreeThousandSuccessCount: newSuccessCount });

            if (twoThousandToThreeThousandTargetIndex + 1 >= challenge.targets.length) {
                // All challenges completed!
                get().setFeedback("🎉 Tous les mini-défis 2000-3000 réussis ! Tu maîtrises la zone 2000-3000 !");
                setTimeout(() => {
                    const resetCols = initialColumns.map((col) => ({ ...col, unlocked: true }));
                    set({
                        columns: resetCols,
                        phase: 'learn-thousands',
                        pendingAutoCount: true,
                        isCountingAutomatically: false
                    });
                    get().updateButtonVisibility();
                    sequenceFeedback("Bravo ! Maintenant regarde la machine compter les milliers RONDS !", "3000, 4000, 5000... Observe bien !");
                }, FEEDBACK_DELAY * 2);
            } else {
                const nextTarget = challenge.targets[twoThousandToThreeThousandTargetIndex + 1];
                const resetCols = initialColumns.map((col) => ({ ...col, unlocked: true }));
                set({ twoThousandToThreeThousandTargetIndex: twoThousandToThreeThousandTargetIndex + 1, columns: resetCols });
                sequenceFeedback(`✅ Correct ! ${newSuccessCount}/${challenge.targets.length} réussis !`, `Maintenant affiche **${nextTarget}** !`);
            }
        } else {
            // FAILURE - Generate progressive feedback
            const newAttemptCount = attemptCount + 1;
            setAttemptCount(newAttemptCount);
            
            const feedbackMsg = generateFeedback({
                attemptCount: newAttemptCount,
                consecutiveFailures,
                frustrationLevel: detectFrustration(consecutiveFailures),
                currentTarget: targetNumber,
                lastUserAnswer: totalNumber
            });
            
            get().setFeedback(feedbackMsg.message);
            
            // Show help options on 4th attempt
            if (feedbackMsg.showHelp) {
                setShowHelpOptions(true);
            }
            
            // If too many attempts, increase consecutive failures
            if (newAttemptCount >= 4) {
                const newConsecutiveFailures = consecutiveFailures + 1;
                setConsecutiveFailures(newConsecutiveFailures);
                
                // Check for high frustration
                if (newConsecutiveFailures >= 3) {
                    setTimeout(() => {
                        get().setFeedback(getFrustrationInterventionMessage());
                    }, FEEDBACK_DELAY * 2);
                }
            }
        }
    },

    handleValidateThousandsSimpleCombination: () => {
        const { phase, columns, thousandsSimpleCombinationTargetIndex, thousandsSimpleCombinationSuccessCount, sequenceFeedback, attemptCount, consecutiveFailures, resetAttempts, setAttemptCount, setConsecutiveFailures, setShowHelpOptions, totalChallengesCompleted, setTotalChallengesCompleted } = get();
        const totalNumber = columns.reduce((acc: number, col: Column, idx: number) => acc + col.value * Math.pow(10, idx), 0);
        
        if (phase !== 'challenge-thousands-simple-combination') return;

        const challenge = THOUSANDS_SIMPLE_COMBINATION_CHALLENGES[0];
        const targetNumber = challenge.targets[thousandsSimpleCombinationTargetIndex];

        if (totalNumber === targetNumber) {
            // SUCCESS!
            const successMsg = getSuccessMessage(attemptCount + 1, false);
            get().setFeedback(successMsg);
            
            // Reset attempts and update stats
            resetAttempts();
            setConsecutiveFailures(0);
            setTotalChallengesCompleted(totalChallengesCompleted + 1);
            
            const newSuccessCount = thousandsSimpleCombinationSuccessCount + 1;
            set({ thousandsSimpleCombinationSuccessCount: newSuccessCount });

            if (thousandsSimpleCombinationTargetIndex + 1 >= challenge.targets.length) {
                // All challenges completed!
                get().setFeedback("🎉 Tous les défis de combinaisons SIMPLES réussis ! Bravo !");
                setTimeout(() => {
                    const resetCols = initialColumns.map((col) => ({ ...col, unlocked: true }));
                    set({
                        columns: resetCols,
                        phase: 'learn-thousands-full-combination',
                        pendingAutoCount: true,
                        isCountingAutomatically: false
                    });
                    get().updateButtonVisibility();
                    sequenceFeedback("Bravo ! Maintenant regardons les nombres COMPLETS !", "1234, 2345... C'est long à dire mais tu vas voir la logique !");
                }, FEEDBACK_DELAY * 2);
            } else {
                const nextTarget = challenge.targets[thousandsSimpleCombinationTargetIndex + 1];
                const resetCols = initialColumns.map((col) => ({ ...col, unlocked: true }));
                set({ thousandsSimpleCombinationTargetIndex: thousandsSimpleCombinationTargetIndex + 1, columns: resetCols });
                sequenceFeedback(`✅ Correct ! ${newSuccessCount}/${challenge.targets.length} réussis !`, `Maintenant affiche **${nextTarget}** !`);
            }
        } else {
            // FAILURE - Generate progressive feedback
            const newAttemptCount = attemptCount + 1;
            setAttemptCount(newAttemptCount);
            
            const feedbackMsg = generateFeedback({
                attemptCount: newAttemptCount,
                consecutiveFailures,
                frustrationLevel: detectFrustration(consecutiveFailures),
                currentTarget: targetNumber,
                lastUserAnswer: totalNumber
            });
            
            get().setFeedback(feedbackMsg.message);
            
            // Show help options on 4th attempt
            if (feedbackMsg.showHelp) {
                setShowHelpOptions(true);
            }
            
            // If too many attempts, increase consecutive failures
            if (newAttemptCount >= 4) {
                const newConsecutiveFailures = consecutiveFailures + 1;
                setConsecutiveFailures(newConsecutiveFailures);
                
                // Check for high frustration
                if (newConsecutiveFailures >= 3) {
                    setTimeout(() => {
                        get().setFeedback(getFrustrationInterventionMessage());
                    }, FEEDBACK_DELAY * 2);
                }
            }
        }
    },

    handleValidateThousands: () => {
        const { phase, columns, thousandsTargetIndex, thousandsSuccessCount, sequenceFeedback, resetThousandsChallenge, attemptCount, consecutiveFailures, resetAttempts, setAttemptCount, setConsecutiveFailures, setShowHelpOptions, totalChallengesCompleted, setTotalChallengesCompleted } = get();
        const totalNumber = columns.reduce((acc: number, col: Column, idx: number) => acc + col.value * Math.pow(10, idx), 0);
        const challengePhases = ['challenge-thousands-1', 'challenge-thousands-2', 'challenge-thousands-3'] as const;
        const challengeIndex = challengePhases.indexOf(phase as typeof challengePhases[number]);
        if (challengeIndex === -1) return;

        const challenge = THOUSANDS_CHALLENGES[challengeIndex];
        const targetNumber = challenge.targets[thousandsTargetIndex];

        if (totalNumber === targetNumber) {
            // SUCCESS!
            const successMsg = getSuccessMessage(attemptCount + 1, false);
            get().setFeedback(successMsg);
            
            // Reset attempts and update stats
            resetAttempts();
            setConsecutiveFailures(0);
            setTotalChallengesCompleted(totalChallengesCompleted + 1);
            
            const newSuccessCount = thousandsSuccessCount + 1;
            set({ thousandsSuccessCount: newSuccessCount });

            if (thousandsTargetIndex + 1 >= challenge.targets.length) {
                if (challengeIndex === THOUSANDS_CHALLENGES.length - 1) {
                    set((state: MachineState) => ({ completedChallenges: { ...state.completedChallenges, thousands: true } }));
                    setTimeout(() => {
                        set({ phase: 'celebration-thousands-complete' });
                        get().updateButtonVisibility();
                        sequenceFeedback("🏆🎉 INCROYABLE ! TU ES UN CHAMPION DES NOMBRES !", "Tu sais maintenant compter jusqu'à 9999 ! C'est ÉNORME !");
                    }, FEEDBACK_DELAY * 2);
                } else {
                    const nextChallenge = THOUSANDS_CHALLENGES[challengeIndex + 1];
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
            // FAILURE - Generate progressive feedback
            const newAttemptCount = attemptCount + 1;
            setAttemptCount(newAttemptCount);
            
            const feedbackMsg = generateFeedback({
                attemptCount: newAttemptCount,
                consecutiveFailures,
                frustrationLevel: detectFrustration(consecutiveFailures),
                currentTarget: targetNumber,
                lastUserAnswer: totalNumber
            });
            
            get().setFeedback(feedbackMsg.message);
            
            // Show help options on 4th attempt
            if (feedbackMsg.showHelp) {
                setShowHelpOptions(true);
            }
            
            // If too many attempts, increase consecutive failures
            if (newAttemptCount >= 4) {
                const newConsecutiveFailures = consecutiveFailures + 1;
                setConsecutiveFailures(newConsecutiveFailures);
                
                // Check for high frustration
                if (newConsecutiveFailures >= 3) {
                    setTimeout(() => {
                        get().setFeedback(getFrustrationInterventionMessage());
                    }, FEEDBACK_DELAY * 2);
                }
            }
        }
    },

    updateInstruction: () => {
        const { phase, unitTargetIndex, unitSuccessCount, tensTargetIndex, tensSuccessCount, hundredsTargetIndex, hundredsSuccessCount, thousandsTargetIndex, thousandsSuccessCount } = get();
        console.log('phase', phase);

        let newInstruction = "";

        switch (phase) {
            // ... (cases from your existing updateInstruction)
            case 'intro-welcome-personalized':
                newInstruction = "Bonjour ! Bienvenue dans mon atelier ! 👋 Comment tu t'appelles ? (Tu peux aussi sauter cette étape)";
                break;
            case 'intro-discover-machine':
                newInstruction = `Oh, tu es là ${get().userName || 'l\'enfant'} ? Je ne t'avais pas entendu arriver avec tout ce bruit ! J'étais justement en train de terminer cette invention... qui va nous permettre de compter toutes sortes de choses ! Tu es prêt(e) à la découvrir ? Tadaaaaa ! 🎉 Comment tu la trouves ?`;
                break;
            case 'intro-first-interaction':
                if (get().introClickCount === 0) {
                    newInstruction = "Bon, elle peut paraître un peu compliquée comme ça... mais elle n'aura bientôt plus de secrets pour toi ! Grâce à cette machine bizarre, nous allons comprendre comment fonctionnent les nombres ! Et hop, je vais la mettre en route ! (Animation + bruit d'allumage : bzzzz, clic, ding !) Maintenant tu peux appuyer sur ses boutons ! Clique sur le bouton △ VERT pour voir ce qu'il se passe !";
                } else if (get().introClickCount < 9) {
                    newInstruction = `Continue à cliquer sur △ pour remplir la machine !`;
                } else {
                    newInstruction = "La machine est pleine ! Essaie maintenant le bouton ROUGE ∇ pour voir ce qu'il fait !";
                }
                break;
            case 'intro-count-digits':
                newInstruction = "Maintenant, une petite question pour voir si tu as bien regardé ! 🤔 Te rappelles-tu combien de chiffres DIFFÉRENTS tu as vu ? Prends ton temps pour réfléchir... 🤔";
                break;
            case 'intro-second-column':
                newInstruction = "Bon, tout ça c'est très bien... Mais j'ai un PROBLÈME ! 🤔 Comment va-t-on faire pour compter plus haut que 9 ? Pour l'instant, la machine BLOQUE à 9 ! Tu vois ? Ça ne bouge plus ! 😅 À ton avis, que peut-on faire ?";
                break;
            case 'intro-discover-carry':
                if (get().columns[0].value < 9) {
                    newInstruction = "Maintenant, on va voir quelque chose de MAGIQUE ! ✨ Amène le premier rouleau à 9 !";
                } else if (get().columns[0].value === 9 && get().columns[1].value === 0) {
                    newInstruction = "Parfait ! Tout est PLEIN ! 9 lumières allumées ! Maintenant... que va-t-il se passer si tu cliques encore une fois sur △ ? Réfléchis bien... 🤔 Tu ne sais pas ? C'est normal ! Clique et tu verras ! 😊";
                } else {
                    newInstruction = "WAOUH ! Tu as vu ça ??? 🤩 C'était MAGIQUE non ? Les 10 lumières ont VOYAGÉ ! Elles se sont regroupées pour devenir UNE seule lumière sur le deuxième rouleau ! Maintenant, refais l'inverse ! Clique sur ∇ pour voir ce qu'il se passe !";
                }
                break;
            case 'intro-max-value-question':
                if (get().introMaxAttempt === -1) {
                    // Guided mode
                    if (get().columns[0].value < 9) {
                        newInstruction = "Clique sur △ pour remplir le PREMIER rouleau au maximum !";
                    } else if (get().columns[1].value < 9) {
                        newInstruction = "Parfait ! Maintenant clique sur △ du DEUXIÈME rouleau pour le remplir aussi !";
                    } else {
                        newInstruction = "C'est le MAXIMUM ! 99 !";
                    }
                } else {
                    newInstruction = "Maintenant que tu as vu comment ça marche... J'ai une question pour toi ! 🎯 Avec DEUX rouleaux, jusqu'à combien peut-on compter ? Réfléchis bien ! 🤔";
                }
                break;
            case 'intro-welcome':
                newInstruction = "Paf, Crac… Bim… Tchac ! Quel vacarme ! Voilà, j'ai terminé ma nouvelle machine !";
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
            case 'practice-ten':
                newInstruction = "Pratique le concept de paquet ! Clique sur ∇ pour revenir à 9, puis △ pour refaire l'échange magique !";
                break;
            case 'learn-ten-to-twenty':
                newInstruction = "Compte de 10 à 20 ! Clique sur △ pour ajouter des billes dans les UNITÉS !";
                break;
            case 'challenge-ten-to-twenty': {
                const challenge = TEN_TO_TWENTY_CHALLENGES[0];
                const targetNumber = challenge.targets[get().tenToTwentyTargetIndex];
                newInstruction = `Mini-défi : Affiche **${targetNumber}** puis clique sur VALIDER ! (${get().tenToTwentySuccessCount}/${challenge.targets.length})`;
                break;
            }
            case 'learn-twenty-to-thirty':
                newInstruction = "Remplis la colonne des unités jusqu'à 9 ! Clique sur △ sur les UNITÉS !";
                break;
            case 'learn-tens':
                newInstruction = "Regarde ! 👀 La machine compte par dizaines : 40, 50, 60...";
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
            case 'practice-hundred':
                newInstruction = "Pratique le concept de GRAND paquet ! Clique sur ∇ pour revenir à 99, puis △ pour refaire l'échange magique vers 100 !";
                break;
            case 'learn-hundred-to-hundred-ten':
                newInstruction = "Compte de 100 à 110 ! Clique sur △ pour ajouter des billes dans les UNITÉS !";
                break;
            case 'learn-hundred-ten-to-two-hundred':
                newInstruction = "Monte vers 200 ! Clique sur △ pour remplir ! Observe les dizaines rondes !";
                break;
            case 'challenge-hundred-to-two-hundred': {
                const challenge = HUNDRED_TO_TWO_HUNDRED_CHALLENGES[0];
                const targetNumber = challenge.targets[get().hundredToTwoHundredTargetIndex];
                newInstruction = `Mini-défi 100-200 : Affiche **${targetNumber}** puis clique sur VALIDER ! (${get().hundredToTwoHundredSuccessCount}/${challenge.targets.length})`;
                break;
            }
            case 'learn-two-hundred-to-three-hundred':
                newInstruction = "Remplis tout jusqu'à 299 ! Clique sur △ pour ajouter des billes !";
                break;
            case 'challenge-two-hundred-to-three-hundred': {
                const challenge = TWO_HUNDRED_TO_THREE_HUNDRED_CHALLENGES[0];
                const targetNumber = challenge.targets[get().twoHundredToThreeHundredTargetIndex];
                newInstruction = `Mini-défi 200-300 : Affiche **${targetNumber}** puis clique sur VALIDER ! (${get().twoHundredToThreeHundredSuccessCount}/${challenge.targets.length})`;
                break;
            }
            case 'learn-hundreds':
                newInstruction = "Regarde ! 👀 La machine compte par centaines : 300, 400, 500...";
                break;
            case 'learn-hundreds-simple-combination':
                newInstruction = "🎯 Observe des exemples SIMPLES avec les centaines !";
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
            case 'celebration-before-thousands':
                newInstruction = "🏆 BRAVO CHAMPION ! Tu maîtrises les centaines ! Maintenant, on va découvrir les MILLE ! C'est le niveau EXPERT ! 🎓 Si tu es fatigué, tu peux faire une pause. Sinon, clique sur DÉMARRER L'APPRENTISSAGE DES MILLIERS !";
                break;
            case 'practice-thousand':
                newInstruction = "STOP ! 🛑 Regarde bien : TOUT, TOUT, TOUT est plein ! 999 ! Que va-t-il se passer si on ajoute encore 1 toute petite bille ? Clique sur △ pour voir !";
                break;
            case 'learn-thousand-to-thousand-ten':
                newInstruction = "MILLE ! 1 énorme paquet ! Compte de 1000 à 1010 en cliquant sur △ sur les UNITÉS !";
                break;
            case 'learn-thousand-to-thousand-hundred':
                newInstruction = "MILLE-DIX ! Maintenant monte jusqu'à 1100 ! Clique sur △ sur les UNITÉS !";
                break;
            case 'learn-thousand-hundred-to-two-thousand':
                newInstruction = "MILLE-CENT ! Continue à remplir jusqu'à 2000 ! Clique sur △ sur les UNITÉS !";
                break;
            case 'challenge-thousand-to-two-thousand': {
                const challenge = THOUSAND_TO_TWO_THOUSAND_CHALLENGES[0];
                const targetNumber = challenge.targets[get().thousandToTwoThousandTargetIndex];
                newInstruction = `Mini-défi 1000-2000 ! Affiche **${targetNumber}** puis clique sur VALIDER ! (${get().thousandToTwoThousandSuccessCount}/${challenge.targets.length})`;
                break;
            }
            case 'learn-two-thousand-to-three-thousand':
                newInstruction = "DEUX-MILLE ! Monte directement à 2500, puis 2900, puis 2999, puis 3000 ! Clique sur △ sur les UNITÉS !";
                break;
            case 'challenge-two-thousand-to-three-thousand': {
                const challenge = TWO_THOUSAND_TO_THREE_THOUSAND_CHALLENGES[0];
                const targetNumber = challenge.targets[get().twoThousandToThreeThousandTargetIndex];
                newInstruction = `Mini-défi 2000-3000 ! Affiche **${targetNumber}** puis clique sur VALIDER ! (${get().twoThousandToThreeThousandSuccessCount}/${challenge.targets.length})`;
                break;
            }
            case 'learn-thousands':
                newInstruction = "Regarde ! 👀 La machine compte par milliers : 3000, 4000, 5000... Imagine combien de billes ça fait !";
                break;
            case 'learn-thousands-very-simple-combination':
                newInstruction = "🎯 Observe les combinaisons SIMPLES avec des nombres RONDS : 1000, 1100, 2000, 2500...";
                break;
            case 'challenge-thousands-simple-combination': {
                const challenge = THOUSANDS_SIMPLE_COMBINATION_CHALLENGES[0];
                const targetNumber = challenge.targets[get().thousandsSimpleCombinationTargetIndex];
                newInstruction = `Défi nombres RONDS ! Affiche **${targetNumber}** puis clique sur VALIDER ! (${get().thousandsSimpleCombinationSuccessCount}/${challenge.targets.length})`;
                break;
            }
            case 'learn-thousands-full-combination':
                newInstruction = "🎯 Maintenant regarde les nombres COMPLETS : 1234, 2345... Décomposition : 1 énorme + 2 grands + 3 paquets + 4 billes !";
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
                const difficultyNames = ['FACILE', 'MOYEN', 'DIFFICILE'];
                newInstruction = `DÉFI ${challengeIndex + 1} (${difficultyNames[challengeIndex]}) : Affiche **${targetNumber}** puis clique sur VALIDER ! (${thousandsSuccessCount}/${challenge.targets.length})`;
                break;
            }
            case 'celebration-thousands-complete':
                newInstruction = "🏆🎉 INCROYABLE ! TU ES UN CHAMPION DES NOMBRES ! Tu sais maintenant compter jusqu'à 9999 ! Très peu d'enfants de ton âge savent faire ça ! Tu peux être très fier de toi ! 💪 Clique sur MODE LIBRE pour créer tes nombres !";
                break;
            case 'normal':
                newInstruction = "Mode exploration ! 🚀 Construis des grands nombres !";
                break;
            default:
                newInstruction = "Prépare-toi pour l'aventure des nombres !";
        }

        console.log('newInstruction', newInstruction);
        set({ instruction: newInstruction });
    },

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
        } else if (phase === 'celebration-before-thousands') {
            // Start thousands learning
            const resetCols = initialColumns.map((col) => ({ ...col, unlocked: true }));
            resetCols[3].value = 0;
            resetCols[2].value = 9;
            resetCols[1].value = 9;
            resetCols[0].value = 9;
            set({
                columns: resetCols,
                phase: 'practice-thousand',
                pendingAutoCount: false,
                isCountingAutomatically: false
            });
            get().updateButtonVisibility();
            sequenceFeedback("STOP ! 🛑 Regarde bien : TOUT, TOUT, TOUT est plein !", "9 GRANDS paquets + 9 paquets + 9 billes. C'est le MAXIMUM ! Que va-t-il se passer si on ajoute encore 1 toute petite bille ? Clique sur △");
        } else if (phase === 'celebration-thousands-complete') {
            // Go to normal mode
            const resetCols = initialColumns.map((col) => ({ ...col, unlocked: true }));
            set({
                columns: resetCols,
                phase: 'normal',
                pendingAutoCount: false,
                isCountingAutomatically: false
            });
            get().updateButtonVisibility();
            sequenceFeedback("Mode libre activé ! 🚀", "Tu peux maintenant créer TOUS les nombres que tu veux jusqu'à 9999 !");
        }
    },

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

    // Handle help choice in assisted mode (attempt 4+)
    handleHelpChoice: (choice: 'tryAgain' | 'guided' | 'showSolution') => {
        const { setHelpChoice, setShowHelpOptions, setGuidedMode, setShowSolutionAnimation, currentTarget, columns } = get();
        
        setHelpChoice(choice);
        setShowHelpOptions(false);
        
        if (choice === 'tryAgain') {
            // Option 1: Try again with all hints visible
            const decomp = decomposeNumber(currentTarget);
            get().setFeedback(`D'accord champion ! Dernier essai ! 🎯
Je laisse TOUS les indices affichés pour t'aider !

RAPPEL : Il faut faire ${currentTarget}

DÉCOMPOSITION :
${decomp.thousands > 0 ? `- ${decomp.thousands} milliers = ${decomp.thousands * 1000}\n` : ''}${decomp.hundreds > 0 ? `- ${decomp.hundreds} centaines = ${decomp.hundreds * 100}\n` : ''}${decomp.tens > 0 ? `- ${decomp.tens} dizaines = ${decomp.tens * 10}\n` : ''}${decomp.units > 0 ? `- ${decomp.units} unités = ${decomp.units}\n` : ''}
TOTAL = ${currentTarget}

Tu peux le faire ! Je crois en toi ! ⭐
Prends ton temps ! Pas de pression ! 😊`);
        } else if (choice === 'guided') {
            // Option 2: Guided step-by-step construction
            setGuidedMode(true);
            set({ guidedStep: 0 });
            
            // Reset all columns to 0
            const resetCols = columns.map(col => ({ ...col, value: 0 }));
            set({ columns: resetCols });
            
            get().setFeedback(`On va le construire ENSEMBLE ! 🤝
Je vais te guider colonne par colonne !
Tu fais exactement ce que je te dis, d'accord ? 😊`);
            
            // Start guided mode after a delay
            setTimeout(() => {
                get().advanceGuidedStep();
            }, FEEDBACK_DELAY);
        } else if (choice === 'showSolution') {
            // Option 3: Show solution animation
            setShowSolutionAnimation(true);
            set({ solutionAnimationStep: 0 });
            
            // Reset columns
            const resetCols = columns.map(col => ({ ...col, value: 0 }));
            set({ columns: resetCols });
            
            get().setFeedback(`D'accord ! 👀
Je vais te MONTRER comment on fait !
Regarde bien l'écran ! 👁️
Tu vas VOIR comment se construit ce nombre !`);
            
            // Start animation
            setTimeout(() => {
                get().advanceSolutionAnimation();
            }, FEEDBACK_DELAY);
        }
    },

    // Advance to next step in guided mode
    advanceGuidedStep: () => {
        const { currentTarget, columns, guidedStep, setGuidedStep, setGuidedMode, resetAttempts, setFeedback } = get();
        
        const currentValues = [columns[0].value, columns[1].value, columns[2].value, columns[3].value];
        const nextStep = getNextGuidedStep(currentTarget, currentValues);
        
        if (!nextStep) {
            // Completed! Show success message
            setGuidedMode(false);
            resetAttempts();
            const completionMsg = getGuidedCompletionMessage(currentTarget);
            setFeedback(completionMsg);
            
            // Move to next challenge after delay
            setTimeout(() => {
                // This will be handled by the existing validation success flow
                get().setConsecutiveFailures(0);
                get().setTotalChallengesCompleted(get().totalChallengesCompleted + 1);
            }, FEEDBACK_DELAY * 3);
            
            return;
        }
        
        // Show the next step instruction
        setFeedback(nextStep.message);
        setGuidedStep(guidedStep + 1);
    },

    // Advance solution animation
    advanceSolutionAnimation: () => {
        const { currentTarget, columns, solutionAnimationStep, setSolutionAnimationStep, setColumns, setShowSolutionAnimation, setFeedback } = get();
        
        const decomp = decomposeNumber(currentTarget);
        const targetArray = [decomp.units, decomp.tens, decomp.hundreds, decomp.thousands];
        
        // Animate from highest to lowest column
        const animationOrder = [3, 2, 1, 0]; // thousands, hundreds, tens, units
        const currentStep = solutionAnimationStep;
        
        if (currentStep === 0) {
            setFeedback("On commence à ZÉRO !");
            setSolutionAnimationStep(1);
            setTimeout(() => get().advanceSolutionAnimation(), 1000);
            return;
        }
        
        const stepIndex = currentStep - 1;
        if (stepIndex < 4) {
            const columnIndex = animationOrder[stepIndex];
            const targetValue = targetArray[columnIndex];
            
            // Update the column
            const newCols = [...columns];
            newCols[columnIndex] = { ...newCols[columnIndex], value: targetValue };
            setColumns(newCols);
            
            // Calculate running total
            const runningTotal = newCols.reduce((acc, col, idx) => acc + col.value * Math.pow(10, idx), 0);
            
            // Show step message
            const stepMsg = getSolutionAnimationStep(columnIndex, targetValue, runningTotal);
            setFeedback(stepMsg);
            
            setSolutionAnimationStep(currentStep + 1);
            setTimeout(() => get().advanceSolutionAnimation(), 2000);
        } else {
            // Animation complete
            setShowSolutionAnimation(false);
            setFeedback(`Voilà ! C'est comme ça qu'on fait ${currentTarget} ! 🎯
Tu as vu les étapes ? 👀

Maintenant tu sais comment faire ! 💡
Tu veux :

[1] 🔄 Refaire ce nombre moi-même !
[2] ➡️ Passer au suivant !`);
        }
    },

    init: () => {
        get().updateInstruction();
    },
}));

// Subscriber for automatic phase transitions
useStore.subscribe(
    (state, previousState) => {
        // Automatically trigger transitions and auto-counting when conditions are met

        // Handle intro-welcome phase transition
        if (state.phase === 'intro-welcome') {
            // Clear any existing timer first
            if (state.timer) {
                clearTimeout(state.timer);
            }

            setTimeout(() => {
                const currentState = useStore.getState();
                // Verify we're still in the same phase before transitioning
                if (currentState.phase === 'intro-welcome') {
                    currentState.setPhase('intro-discover');
                    currentState.setTimer(null);
                    currentState.updateButtonVisibility();
                    currentState.updateInstruction();
                }
            }, 3000);
        }

        // Handle intro-discover phase transition
        if (state.phase === 'intro-discover') {
            // Clear any existing timer first
            if (state.timer) {
                clearTimeout(state.timer);
            }

            setTimeout(() => {
                const currentState = useStore.getState();
                // Verify we're still in the same phase before transitioning
                if (currentState.phase === 'intro-discover') {
                    currentState.setPhase('tutorial');
            //    currentState.setTimer(null);
                    currentState.updateButtonVisibility();
                    currentState.updateInstruction();
                }
            }, 3000);

            //useStore.getState().setTimer(newTimer as unknown as number);
        }

    

        // Handle auto-counting trigger for learn phases
        if (
            state.phase.startsWith('learn-') &&
            state.pendingAutoCount &&
            !state.isCountingAutomatically &&
            // Only trigger when pendingAutoCount changed to true or phase changed
            (state.pendingAutoCount !== previousState.pendingAutoCount ||
                state.phase !== previousState.phase)
        ) {
            // Use a small delay to ensure state updates are processed
            setTimeout(() => {
                const currentState = useStore.getState();
                // Re-verify conditions before executing
                if (
                    currentState.phase.startsWith('learn-') &&
                    currentState.pendingAutoCount &&
                    !currentState.isCountingAutomatically
                ) {
                    currentState.setIsCountingAutomatically(true);
                    currentState.setPendingAutoCount(false);
                    currentState.runAutoCount();
                }
            }, 100);
        }
    }
);