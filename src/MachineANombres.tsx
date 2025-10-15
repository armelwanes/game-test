import { useEffect, useCallback, useMemo } from "react";
import { useStore } from './store.ts';
import { UNIT_CHALLENGES, TENS_CHALLENGES, HUNDREDS_CHALLENGES, THOUSANDS_CHALLENGES } from './types.ts';


function MachineANombres() {
  const {
    init,
    columns,
    phase,
    typedInstruction,
    typedFeedback,
    isTypingInstruction,
    isTypingFeedback,
    pendingAutoCount,
    isCountingAutomatically,
    unitTargetIndex,
    tensTargetIndex,
    hundredsTargetIndex,
    thousandsTargetIndex,
    userInput,
    showInputField,
    setPendingAutoCount,
    setIsCountingAutomatically,
    handleAdd,
    handleSubtract,
    handleValidateLearning,
    handleValidateTens,
    handleValidateHundreds,
    handleValidateThousands,
    startLearningPhase,
    unlockNextColumn,
    runAutoCount,
    showUnlockButton,
    showStartLearningButton,
    showValidateLearningButton,
    showValidateTensButton,
    showValidateHundredsButton,
    showValidateThousandsButton,
    showContinueButton,
    setUserInput,
    handleUserInputSubmit,
    handleContinue,
  } = useStore();

  useEffect(() => {
    init();
  }, [init]);

  const totalNumber = useMemo(() =>
    columns.reduce((acc, col, idx) => acc + col.value * Math.pow(10, idx), 0),
    [columns]
  );

  const isUnitsColumn = useCallback((idx: number) => idx === 0, []);

  const displayText = useMemo(() => typedFeedback || typedInstruction, [typedInstruction, typedFeedback]);

  const isTyping = isTypingInstruction || isTypingFeedback;

  // --- Démarrage du compteur auto après le texte d'observation ---
  useEffect(() => {
    // On veut démarrer le comptage auto uniquement après les phases d'apprentissage,
    // lorsque toutes les animations de texte sont terminées
    if (
      (phase.startsWith('learn-')) &&
      pendingAutoCount &&
      !isCountingAutomatically &&
      !isTypingInstruction &&
      !isTypingFeedback
    ) {
      setIsCountingAutomatically(true);
      setPendingAutoCount(false);
      runAutoCount();
    }
  }, [phase, pendingAutoCount, isCountingAutomatically, isTypingInstruction, isTypingFeedback, setIsCountingAutomatically, setPendingAutoCount, runAutoCount]);

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
              else if ((phase === 'tutorial' || phase === 'explore-units' || phase === 'click-add' || phase === 'click-remove' || phase.startsWith('challenge-unit-')) && isUnit) {
                isInteractive = true;
              }
              else if (phase === 'learn-carry' && isUnit) {
                isInteractive = true;
              }
              else if ((phase.startsWith('challenge-tens-') || phase === 'learn-tens-combination') && (isUnit || originalIdx === 1)) {
                isInteractive = true;
              }
              else if ((phase.startsWith('challenge-hundreds-') || phase === 'learn-hundreds-combination') && (isUnit || originalIdx === 1 || originalIdx === 2)) {
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

        {/* Boutons de phase (Débloquer / Commencer / Continuer) */}
        {(showUnlockButton || showStartLearningButton || showContinueButton) && (
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
            {showContinueButton && (
              <button
                onClick={handleContinue}
                style={{
                  fontSize: 16,
                  padding: '10px 30px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 8px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.2s ease',
                  animation: 'pulse 2s ease-in-out infinite'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 12px rgba(16, 185, 129, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.3)';
                }}
              >
                ▶️ Continuer
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
                  marginLeft: (showStartLearningButton || showContinueButton) ? '12px' : '0',
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