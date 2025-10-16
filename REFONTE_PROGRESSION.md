# 🎓 Refonte de la Progression Pédagogique pour les 5-6 ans

## 📋 Résumé des changements

Cette mise à jour introduit une progression pédagogique plus graduelle et adaptée aux enfants de 5-6 ans pour l'apprentissage des nombres de 10 à 30, avant de découvrir les dizaines rondes (40, 50, 60...).

## 🆕 Nouvelles phases ajoutées

### 1. **Phase 2-BIS : `practice-ten`** - Ancrage du concept de 10
**Objectif** : Répéter l'échange magique 9→10 trois fois pour ancrer le concept de "paquet de 10"

**Déroulement** :
- L'enfant vient de voir 9→10 (l'échange magique dans `learn-carry`)
- Feedback : "WOW ! 10 petites billes = 1 PAQUET de 10 !"
- Instruction : "Clique sur ∇ pour revenir à 9"
- L'enfant enlève 1 → Retour à 9
- "Refais la magie ! Clique sur △"
- L'enfant ajoute 1 → 10 à nouveau !
- **Répéter 3 fois** pour ancrer le concept
- Transition vers `learn-ten-to-twenty`

### 2. **Phase 3 : `learn-ten-to-twenty`** - Construction guidée de 10 à 20
**Objectif** : L'enfant manipule et compte lui-même de 10 à 20

**État initial** : [1 dizaine, 0 unités] = 10

**Déroulement GUIDÉ** (l'enfant clique, pas automatique) :
| Nombre | Feedback | Instruction |
|--------|----------|-------------|
| 10 | "DIX ! Tu as 1 paquet !" | "Ajoute 1 bille ! △ sur UNITÉS" |
| 11 | "ONZE ! 1 paquet + 1 bille" | "Continue ! △" |
| 12 | "DOUZE ! 1 paquet + 2 billes" | "Encore ! △" |
| 13-16 | Feedback progressif | "Continue !" |
| 17 | "DIX-SEPT ! Tu entends ? DIX-SEPT !" | "△" |
| 18 | "DIX-HUIT !" | "△" |
| 19 | "DIX-NEUF ! STOP ✋ Tout est presque plein !" | "Que va-t-il se passer ? △" |
| 20 | "💥 VINGT ! 2 paquets de 10 !" | "Bravo ! 🎉" |

**Protections** :
- Si clique sur △ dizaines → "Non ! Clique sur les UNITÉS !"
- Si clique sur ∇ → "On ne descend pas ! On MONTE ! △ !"

### 3. **Phase 4 : `challenge-ten-to-twenty`** - Mini-défis 10-20
**Objectif** : Vérifier que l'enfant a compris la composition 10+X

**3 défis simples** :
1. "Montre-moi **DOUZE** (12) !" → 1 dizaine + 2 unités
2. "Montre-moi **QUINZE** (15) !" → 1 dizaine + 5 unités
3. "Montre-moi **DIX-HUIT** (18) !" → 1 dizaine + 8 unités

### 4. **Phase 5 : `learn-twenty-to-thirty`** - Le passage à 30
**Objectif** : L'enfant comprend que c'est le même principe que 9→10 et 19→20

**Scénario guidé** :
1. Partir de 20 (2 dizaines, 0 unités)
2. "Maintenant, remplis la colonne des unités jusqu'à 9 !"
3. L'enfant clique 9 fois → arrive à 29
4. "29 ! VINGT-NEUF ! Que va-t-il se passer ? △"
5. 💥 30 ! "TROIS paquets ! TRENTE !"

### 5. **Phase 6 modifiée : `learn-tens`** - Les dizaines rondes
**Changements** :
- **Commence à 30** au lieu de 10
- **Vitesse ralentie** : 2500ms au lieu de 1800ms
- Compte : 30 → 40 → 50 → 60 → 70 → 80 → 90
- Feedback enrichi : "QUARANTE ! Compte les paquets : UN, DEUX, TROIS, QUATRE !"

## 🔧 Changements techniques

### Fichier `types.ts`

#### Nouveaux types de phase ajoutés :
```typescript
| 'practice-ten'
| 'learn-ten-to-twenty'
| 'challenge-ten-to-twenty'
| 'learn-twenty-to-thirty'
```

#### Nouvelle constante de défis :
```typescript
export const TEN_TO_TWENTY_CHALLENGES: Challenge[] = [
  { phase: 'challenge-ten-to-twenty', targets: [12, 15, 18] }
];
```

#### Nouveaux états dans MachineState :
```typescript
tenToTwentyTargetIndex: number;
tenToTwentySuccessCount: number;
practiceTenRepetitions: number;
```

#### Nouvelles actions :
```typescript
setTenToTwentyTargetIndex: (index: number) => void;
setTenToTwentySuccessCount: (count: number) => void;
setPracticeTenRepetitions: (count: number) => void;
resetTenToTwentyChallenge: () => void;
handleValidateTenToTwenty: () => void;
```

### Fichier `store.ts`

#### Initialisation des nouveaux états :
```typescript
tenToTwentyTargetIndex: 0,
tenToTwentySuccessCount: 0,
practiceTenRepetitions: 0,
```

#### Nouvelle logique dans `handleAdd` :

1. **`practice-ten`** : Compteur de répétitions de l'échange 9→10
   - Après 3 répétitions, transition vers `learn-ten-to-twenty`

2. **`learn-ten-to-twenty`** : Guidage pas à pas de 10 à 20
   - Validation que l'enfant clique sur les unités uniquement
   - Feedback personnalisé pour chaque nombre
   - Transition vers `challenge-ten-to-twenty` à 20

3. **`challenge-ten-to-twenty`** : Validation des cibles
   - Empêche de dépasser la cible

4. **`learn-twenty-to-thirty`** : Comptage de 20 à 30
   - Validation que l'enfant clique sur les unités uniquement
   - Transition vers `learn-tens` (modifié) à 30

#### Modification de `runAutoCount` :
```typescript
else if (phase === 'learn-tens') {
    const COUNT_SPEED_SLOW = 2500; // Ralenti
    // Start from 3 (30) instead of 0
    if (tensValue < 3) {
        get().setColumns(cols => {
            newCols[1].value = 3;
            return newCols;
        });
    }
    // Continue counting to 90...
}
```

#### Nouvelle fonction `handleValidateTenToTwenty` :
- Valide les réponses pour les défis 12, 15, 18
- Gère la progression vers le défi suivant
- Transition vers `learn-twenty-to-thirty` après tous les défis

#### Mise à jour de `updateInstruction` :
Ajout des instructions pour les 4 nouvelles phases

#### Mise à jour de `updateButtonVisibility` :
```typescript
showValidateLearningButton: phase.startsWith('challenge-unit-') || phase === 'challenge-ten-to-twenty',
```

### Fichier `MachineANombres.tsx`

#### Import de la nouvelle constante :
```typescript
import { TEN_TO_TWENTY_CHALLENGES } from './types.ts';
```

#### Ajout du nouveau handler :
```typescript
handleValidateTenToTwenty,
tenToTwentyTargetIndex,
```

#### Mise à jour de l'interactivité :
```typescript
else if ((phase === 'learn-carry' || phase === 'practice-ten' || 
          phase === 'learn-ten-to-twenty' || phase === 'learn-twenty-to-thirty') && isUnit) {
    isInteractive = true;
}
```

#### Nouveau bouton de validation :
Gère spécifiquement la phase `challenge-ten-to-twenty` avec le bon handler

## 📊 Nouvelle séquence d'apprentissage

```
learn-carry (Découverte 9→10)
    ↓
practice-ten (Répéter 3 fois l'échange 9→10)
    ↓
learn-ten-to-twenty (Compter de 10 à 20 en manipulant)
    ↓
challenge-ten-to-twenty (Défis : 12, 15, 18)
    ↓
learn-twenty-to-thirty (Compter de 20 à 30)
    ↓
learn-tens (Comptage automatique 30→90, ralenti)
    ↓
learn-tens-combination (Exemples de combinaisons)
    ↓
challenge-tens-1/2/3 (Défis existants)
```

## ✅ Bénéfices attendus

1. **Meilleure compréhension** : L'enfant manipule 3x plus dans la zone critique 0-20
2. **Moins de frustration** : Progression très graduelle, pas de saut conceptuel brutal
3. **Ancrage solide** : Répétition du concept "paquet de 10" avant d'aller plus loin
4. **Plus engageant** : L'enfant est actif, pas spectateur passif
5. **Adapté à l'âge** : Respecte le rythme cognitif d'un enfant de 5-6 ans

## 📝 Vocabulaire utilisé

- ✅ "paquet de 10" (au lieu de "dizaine" trop abstrait)
- ✅ "bille" pour les unités
- ✅ Noms directs : "ONZE", "DOUZE" (pas "DIX-ET-UN")
- ✅ Mais souligner la logique pour 17, 18, 19 : "DIX-SEPT", "DIX-HUIT"

## 🧪 Tests effectués

- ✅ Lint : Aucune erreur
- ✅ Build : Compilation réussie
- ✅ TypeScript : Pas d'erreur de typage
- ⏳ Tests manuels : À effectuer avec un enfant de 5-6 ans

## 🎯 Prochaines étapes

1. Tester l'application avec un enfant de 5-6 ans
2. Ajuster les feedbacks et le rythme selon les retours
3. Vérifier la fluidité des transitions entre phases
4. Ajuster les temps de pause si nécessaire
