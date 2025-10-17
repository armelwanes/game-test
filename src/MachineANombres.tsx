import { useEffect, useCallback, useMemo, useState, useRef } from "react";
import { useStore } from './store.ts';
import { UNIT_CHALLENGES, TEN_TO_TWENTY_CHALLENGES, TENS_CHALLENGES, HUNDRED_TO_TWO_HUNDRED_CHALLENGES, TWO_HUNDRED_TO_THREE_HUNDRED_CHALLENGES, HUNDREDS_CHALLENGES, THOUSAND_TO_TWO_THOUSAND_CHALLENGES, TWO_THOUSAND_TO_THREE_THOUSAND_CHALLENGES, THOUSANDS_SIMPLE_COMBINATION_CHALLENGES, THOUSANDS_CHALLENGES } from './types.ts';


function MachineANombres() {
  const {
    init,
    columns,
    phase,
    instruction,
    feedback,
    isCountingAutomatically,
    unitTargetIndex,
    tenToTwentyTargetIndex,
    tensTargetIndex,
    hundredsTargetIndex,
    thousandsTargetIndex,
    userInput,
    showInputField,
    handleAdd,
    handleSubtract,
    handleValidateLearning,
    handleValidateTenToTwenty,
    handleValidateTens,
    handleValidateHundredToTwoHundred,
    handleValidateTwoHundredToThreeHundred,
    handleValidateHundreds,
    handleValidateThousands,
    handleValidateThousandToTwoThousand,
    handleValidateTwoThousandToThreeThousand,
    handleValidateThousandsSimpleCombination,
    hundredToTwoHundredTargetIndex,
    twoHundredToThreeHundredTargetIndex,
    thousandToTwoThousandTargetIndex,
    twoThousandToThreeThousandTargetIndex,
    thousandsSimpleCombinationTargetIndex,
    startLearningPhase,
    unlockNextColumn,
    showUnlockButton,
    showStartLearningButton,
    showValidateLearningButton,
    showValidateTensButton,
    showValidateHundredsButton,
    showValidateThousandsButton,
    setUserInput,
    handleUserInputSubmit,
  } = useStore();

  // Local typing animation state
  const [typedInstruction, setTypedInstruction] = useState("");
  const [typedFeedback, setTypedFeedback] = useState("");
  const [isTypingInstruction, setIsTypingInstruction] = useState(false);
  const [isTypingFeedback, setIsTypingFeedback] = useState(false);
  const typingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    init();
  }, [init]);

  const totalNumber = useMemo(() =>
    columns.reduce((acc, col, idx) => acc + col.value * Math.pow(10, idx), 0),
    [columns]
  );

  const isUnitsColumn = useCallback((idx: number) => idx === 0, []);

  // Typing animation effect for instruction
  useEffect(() => {
    if (!instruction) return;
    
    setIsTypingInstruction(true);
    setTypedInstruction("");
    setTypedFeedback("");
    
    let currentIndex = 0;
    const typeNextChar = () => {
      if (currentIndex <= instruction.length) {
        setTypedInstruction(instruction.slice(0, currentIndex));
        currentIndex++;
        typingTimeoutRef.current = setTimeout(typeNextChar, 18);
      } else {
        setIsTypingInstruction(false);
      }
    };
    
    typeNextChar();
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [instruction]);

  // Typing animation effect for feedback
  useEffect(() => {
    if (!feedback) return;
    
    setIsTypingFeedback(true);
    setTypedFeedback("");
    
    const prefixed = ` ${feedback}`;
    let currentIndex = 0;
    const typeNextChar = () => {
      if (currentIndex <= prefixed.length) {
        setTypedFeedback(prefixed.slice(0, currentIndex));
        currentIndex++;
        typingTimeoutRef.current = setTimeout(typeNextChar, 18);
      } else {
        setIsTypingFeedback(false);
      }
    };
    
    typeNextChar();
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [feedback]);

  const displayText = useMemo(() => typedFeedback || typedInstruction, [typedInstruction, typedFeedback]);

  const isTyping = isTypingInstruction || isTypingFeedback;

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
              if (phase === 'intro-welcome' && isUnit) {
                isInteractive = true;
              }
              else if (phase === 'intro-discover' && isUnit) {
                isInteractive = true;
              }
              else if (phase === 'intro-add-roll' && isUnit) {
                isInteractive = true;
              }
              else if (phase === 'normal') {
                isInteractive = true;
              }
              else if ((phase === 'tutorial' || phase === 'explore-units' || phase === 'click-add' || phase === 'click-remove' || phase.startsWith('challenge-unit-') || phase === 'challenge-ten-to-twenty') && isUnit) {
                isInteractive = true;
              }
              else if ((phase === 'learn-carry' || phase === 'practice-ten' || phase === 'learn-ten-to-twenty' || phase === 'learn-twenty-to-thirty') && isUnit) {
                isInteractive = true;
              }
              else if ((phase === 'practice-hundred' || phase === 'learn-hundred-to-hundred-ten' || phase === 'learn-hundred-ten-to-two-hundred' || phase === 'challenge-hundred-to-two-hundred' || phase === 'learn-two-hundred-to-three-hundred' || phase === 'challenge-two-hundred-to-three-hundred') && isUnit) {
                isInteractive = true;
              }
              else if ((phase.startsWith('challenge-tens-') || phase === 'learn-tens-combination') && (isUnit || originalIdx === 1)) {
                isInteractive = true;
              }
              else if ((phase.startsWith('challenge-hundreds-') || phase === 'learn-hundreds-combination' || phase === 'learn-hundreds-simple-combination') && (isUnit || originalIdx === 1 || originalIdx === 2)) {
                isInteractive = true;
              }
              else if ((phase.startsWith('challenge-thousands-') || phase === 'learn-thousands-combination') && (isUnit || originalIdx === 1 || originalIdx === 2 || originalIdx === 3)) {
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
          // Handle challenge-ten-to-twenty separately
          if (phase === 'challenge-ten-to-twenty') {
            const challenge = TEN_TO_TWENTY_CHALLENGES[0];
            const targetNumber = challenge.targets[tenToTwentyTargetIndex];
            const isCorrect = totalNumber === targetNumber;
            
            return (
              <div style={{ marginTop: 20, textAlign: 'center' }}>
                <button
                  onClick={handleValidateTenToTwenty}
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
          }
          
          // Handle regular unit challenges
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
          // Handle new hundreds challenge phases
          if (phase === 'challenge-hundred-to-two-hundred') {
            const challenge = HUNDRED_TO_TWO_HUNDRED_CHALLENGES[0];
            const targetNumber = challenge.targets[hundredToTwoHundredTargetIndex];
            const isCorrect = totalNumber === targetNumber;
            
            return (
              <div style={{ marginTop: 20, textAlign: 'center' }}>
                <button
                  onClick={handleValidateHundredToTwoHundred}
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
          }
          
          if (phase === 'challenge-two-hundred-to-three-hundred') {
            const challenge = TWO_HUNDRED_TO_THREE_HUNDRED_CHALLENGES[0];
            const targetNumber = challenge.targets[twoHundredToThreeHundredTargetIndex];
            const isCorrect = totalNumber === targetNumber;
            
            return (
              <div style={{ marginTop: 20, textAlign: 'center' }}>
                <button
                  onClick={handleValidateTwoHundredToThreeHundred}
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
          }
          
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
          let targetNumber = 0;
          let handleValidate = handleValidateThousands;
          
          if (phase === 'challenge-thousand-to-two-thousand') {
            const challenge = THOUSAND_TO_TWO_THOUSAND_CHALLENGES[0];
            targetNumber = challenge.targets[thousandToTwoThousandTargetIndex];
            handleValidate = handleValidateThousandToTwoThousand;
          } else if (phase === 'challenge-two-thousand-to-three-thousand') {
            const challenge = TWO_THOUSAND_TO_THREE_THOUSAND_CHALLENGES[0];
            targetNumber = challenge.targets[twoThousandToThreeThousandTargetIndex];
            handleValidate = handleValidateTwoThousandToThreeThousand;
          } else if (phase === 'challenge-thousands-simple-combination') {
            const challenge = THOUSANDS_SIMPLE_COMBINATION_CHALLENGES[0];
            targetNumber = challenge.targets[thousandsSimpleCombinationTargetIndex];
            handleValidate = handleValidateThousandsSimpleCombination;
          } else {
            const challengeIndex = ['challenge-thousands-1', 'challenge-thousands-2', 'challenge-thousands-3'].indexOf(phase as string);
            const challenge = THOUSANDS_CHALLENGES[challengeIndex];
            targetNumber = challenge.targets[thousandsTargetIndex];
            handleValidate = handleValidateThousands;
          }
          
          const isCorrect = totalNumber === targetNumber;
          
          return (
            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <button
                onClick={handleValidate}
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
                {phase === 'celebration-before-thousands' ? "🚀 DÉMARRER L'APPRENTISSAGE DES MILLIERS" : 
                 phase === 'celebration-thousands-complete' ? "🎮 MODE LIBRE : CRÉE TES NOMBRES !" :
                 "Commencer l'apprentissage"}
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

        {/* Input field for questions */}
        {showInputField && (
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <input
              type="number"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleUserInputSubmit();
                }
              }}
              placeholder="Ta réponse..."
              style={{
                fontSize: 16,
                padding: '8px 12px',
                borderRadius: 6,
                border: '2px solid #cbd5e1',
                width: '120px',
                textAlign: 'center',
                marginRight: 8
              }}
            />
            <button
              onClick={handleUserInputSubmit}
              style={{
                fontSize: 16,
                padding: '8px 20px',
                background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 4px 8px rgba(14, 165, 233, 0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              ✓ Valider
            </button>
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
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span style={{ fontSize: 20 }} role="img" aria-label="robot">🤖</span>
          <h3 style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 600,
            color: '#334155'
          }}>
            Assistant Pédagogique
          </h3>
        </div>
        <div style={{
          flex: 1,
          padding: '16px',
          fontSize: 14,
          lineHeight: 1.6,
          color: '#475569',
          minHeight: 100,
          position: 'relative'
        }}>
          <p style={{ margin: 0 }} dangerouslySetInnerHTML={{ __html: displayText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
          {isTyping && <span style={{
            display: 'inline-block',
            width: 8,
            height: 14,
            background: '#3b82f6',
            borderRadius: 1,
            animation: 'blink 1s step-end infinite',
            marginLeft: 2,
            verticalAlign: 'text-bottom'
          }}></span>}
        </div>
      </div>

      <style>{`
        @keyframes blink {
          from, to { background: transparent }
          50% { background: #3b82f6; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.9; }
        }
        @keyframes celebration {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

export default MachineANombres;