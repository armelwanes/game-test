# 📊 FLOW COMPLET DES PHASES DU JEU

Voici le diagramme de flux complet de toutes les phases du jeu éducatif :

## 🎮 Architecture globale
```
DÉMARRAGE DU JEU
         ↓
┌────────────────────────────────────────────────────────────────┐
│             SECTION 1 : INTRODUCTION AMÉLIORÉE                  │
└────────────────────────────────────────────────────────────────┘
         ↓
    [intro-welcome-personalized]
    "Bonjour ! Comment tu t'appelles ?"
    🎯 Action : Saisie optionnelle du prénom
         ↓
    "(Bruits de marteau...) Voilà, j'ai terminé ma nouvelle machine !"
         ↓
    [intro-discover-machine]
    "Comment tu la trouves ?"
    🎯 Action : Choix parmi 4 réponses + timeout 10s
    - "Trop belle ! ✨"
    - "Bof... 😐"
    - "J'y comprends rien ! 🤔"
    - "C'est quoi ? 🧐"
         ↓
    [intro-first-interaction]
    "Clique sur △ VERT pour voir ce qu'il se passe !"
    🎯 Action : Cliquer sur △ pour compter de 0→9
    - Feedback à chaque clic (1, 2, 3... 9 STOP !)
    - Guidage progressif si pas de clic (5s, 10s)
         ↓
    "Essaie le bouton ROUGE ∇ maintenant !"
    🎯 Action : Décrémenter pour comprendre ∇
         ↓
    [intro-count-digits]
    "Combien de chiffres différents as-tu vu ?"
    🎯 Action : Saisie avec système à 3 tentatives
    - Tentative 1 : Encouragement simple
    - Tentative 2 : Indice visuel (affichage 0-9)
    - Tentative 3 : Comptage guidé avec doigts
    - Réponse attendue : 10 (avec aide pour le zéro)
         ↓
    [intro-second-column]
    "Comment compter plus haut que 9 ?"
    🎯 Action : Choix de solution
    - "Ajouter un rouleau ! 🎡"
    - "Faire une plus grande machine ! 📏"
    - "Je ne sais pas ! 🤷"
    → Déblocage de la colonne Dizaines
         ↓
    [intro-discover-carry]
    "Amène le premier rouleau à 9 puis clique sur △"
    🎯 Action : Découverte interactive 9→10
    - Animation de transformation magique
    - Exploration libre aller-retour
    - "10 petites = 1 grosse !"
         ↓
    [intro-max-value-question]
    "Avec 2 rouleaux, jusqu'à combien peut-on compter ?"
    🎯 Action : Saisie avec système à 3 tentatives
    - Tentative 1 : Encouragement selon réponse
    - Tentative 2 : Exploration guidée ou nouvel essai
    - Tentative 3 : Démonstration visuelle (remplissage à 99)
    - Réponse attendue : 99
         ↓
┌────────────────────────────────────────────────────────────────┐
│                    SECTION 2 : TUTORIEL                         │
└────────────────────────────────────────────────────────────────┘
         ↓
    [tutorial]
    "Bienvenue ! Clique sur △"
    🎯 Action : 
    - Clic 1 → "Bravo ! Un rond bleu"
    - Clic 2 → "Super ! Deux ronds"
    - Clic 3 → "Essaie le bouton ROUGE"
         ↓
    L'utilisateur décrémente de 3 à 0 avec ∇
         ↓
    Transition vers apprentissage des nombres
         ↓
┌────────────────────────────────────────────────────────────────┐
│              SECTION 3 : APPRENTISSAGE DES UNITÉS               │
└────────────────────────────────────────────────────────────────┘
         ↓
    [learn-units] (COMPTAGE AUTO)
    La machine compte automatiquement de 1 à 9
    "1 : une bille, UN doigt"
    "2 : deux billes, DEUX doigts"
    ...
    "9 : neuf billes, colonne presque pleine"
    🎯 Pas d'action, juste observation
         ↓
    Réinitialisation à 0
         ↓
    [explore-units]
    "Clique sur △ pour ajouter une bille"
    🎯 Action : L'utilisateur clique 3 fois (1, 2, 3)
         ↓
    [click-add]
    "Continue jusqu'à 9 !"
    🎯 Action : L'utilisateur monte jusqu'à 9
         ↓
    [click-remove]
    "Clique sur ∇ pour descendre à zéro"
    🎯 Action : L'utilisateur descend de 9 à 0
         ↓
┌────────────────────────────────────────────────────────────────┐
│                 SECTION 4 : DÉFIS DES UNITÉS                    │
└────────────────────────────────────────────────────────────────┘
         ↓
    [challenge-unit-1]
    "DÉFI 1 : Affiche le nombre X"
    🎯 Action : Afficher plusieurs nombres (ex: 3, 7, 5)
    ✅ Validation avec bouton VALIDER
         ↓
    [challenge-unit-2]
    "DÉFI 2 : Affiche le nombre Y"
    🎯 Action : Afficher plusieurs nombres (ex: 8, 2, 6)
    ✅ Validation avec bouton VALIDER
         ↓
    [challenge-unit-3]
    "DÉFI 3 : Affiche le nombre Z"
    🎯 Action : Afficher plusieurs nombres (ex: 4, 9, 1)
    ✅ Validation avec bouton VALIDER
         ↓
    🎉 Tous les défis des unités réussis !
         ↓
┌────────────────────────────────────────────────────────────────┐
│           SECTION 5 : APPRENTISSAGE DE LA RETENUE               │
└────────────────────────────────────────────────────────────────┘
         ↓
    [learn-carry]
    "Prêt pour la magie ? Clique sur △ pour l'échange 10 pour 1"
    🎯 Action : L'utilisateur clique sur △ quand Unités = 9
         ↓
    💥 MAGIE : 10 unités → 1 dizaine (9 + 1 = 10)
    "INCROYABLE ! 10 billes deviennent 1 bille dans la colonne suivante"
    "RÈGLE D'OR : 10 billes = 1 bille dans la colonne de gauche"
         ↓
┌────────────────────────────────────────────────────────────────┐
│              SECTION 6 : APPRENTISSAGE DES DIZAINES             │
└────────────────────────────────────────────────────────────────┘
         ↓
    [learn-tens] (COMPTAGE AUTO)
    La machine compte automatiquement par dizaines
    "10 (DIX) ! Une dizaine = 10 unités"
    "20 !"
    "30 !"
    ...
    "90 (QUATRE-VINGT-DIX) ! Presque 100 !"
    🎯 Pas d'action, juste observation
         ↓
    [learn-tens-combination] (COMPTAGE AUTO)
    La machine montre des exemples de combinaisons
    "12 (DOUZE) ! 1 dizaine + 2 unités = 12"
    "25 (VINGT-CINQ) ! 2 dizaines + 5 unités = 25"
    "34 (TRENTE-QUATRE) ! 3 dizaines + 4 unités = 34"
    🎯 Pas d'action, juste observation
         ↓
┌────────────────────────────────────────────────────────────────┐
│                SECTION 7 : DÉFIS DES DIZAINES                   │
└────────────────────────────────────────────────────────────────┘
         ↓
    [challenge-tens-1]
    "DÉFI 1 : Affiche le nombre X" (ex: 23, 45, 67)
    🎯 Action : Combiner dizaines et unités
    ✅ Validation avec bouton VALIDER
         ↓
    [challenge-tens-2]
    "DÉFI 2 : Affiche le nombre Y" (ex: 89, 12, 50)
    🎯 Action : Combiner dizaines et unités
    ✅ Validation avec bouton VALIDER
         ↓
    [challenge-tens-3]
    "DÉFI 3 : Affiche le nombre Z" (ex: 34, 78, 90)
    🎯 Action : Combiner dizaines et unités
    ✅ Validation avec bouton VALIDER
         ↓
    🎉 Tous les défis des dizaines réussis !
    ✅ completedChallenges.tens = true
    🔓 Déblocage de la colonne Centaines
         ↓
┌────────────────────────────────────────────────────────────────┐
│             SECTION 8 : APPRENTISSAGE DES CENTAINES             │
└────────────────────────────────────────────────────────────────┘
         ↓
    [learn-hundreds] (COMPTAGE AUTO)
    La machine compte automatiquement par centaines
    "100 (CENT) ! Une centaine = 100 unités"
    "200 !"
    "300 !"
    ...
    "900 !"
    🎯 Pas d'action, juste observation
         ↓
    [learn-hundreds-combination] (COMPTAGE AUTO)
    La machine montre des exemples
    "123 (CENT-VINGT-TROIS) !"
    "234 (DEUX-CENT-TRENTE-QUATRE) !"
    🎯 Pas d'action, juste observation
         ↓
┌────────────────────────────────────────────────────────────────┐
│               SECTION 9 : DÉFIS DES CENTAINES                   │
└────────────────────────────────────────────────────────────────┘
         ↓
    [challenge-hundreds-1]
    "DÉFI 1 : Affiche le nombre X" (ex: 123, 456, 789)
    🎯 Action : Combiner centaines, dizaines et unités
    ✅ Validation avec bouton VALIDER
         ↓
    [challenge-hundreds-2]
    "DÉFI 2 : Affiche le nombre Y"
    🎯 Action : Combiner centaines, dizaines et unités
    ✅ Validation avec bouton VALIDER
         ↓
    [challenge-hundreds-3]
    "DÉFI 3 : Affiche le nombre Z"
    🎯 Action : Combiner centaines, dizaines et unités
    ✅ Validation avec bouton VALIDER
         ↓
    🎉 Tous les défis des centaines réussis !
    ✅ completedChallenges.hundreds = true
    🔓 Déblocage de la colonne Milliers
         ↓
┌────────────────────────────────────────────────────────────────┐
│              SECTION 10 : APPRENTISSAGE DES MILLIERS            │
└────────────────────────────────────────────────────────────────┘
         ↓
    [learn-thousands] (COMPTAGE AUTO)
    La machine compte automatiquement par milliers
    "1000 !"
    "2000 !"
    ...
    "9000 !"
    🎯 Pas d'action, juste observation
         ↓
    [learn-thousands-combination] (COMPTAGE AUTO)
    La machine montre des exemples
    "1234 (MILLE-DEUX-CENT-TRENTE-QUATRE) !"
    "2345 (DEUX-MILLE-TROIS-CENT-QUARANTE-CINQ) !"
    🎯 Pas d'action, juste observation
         ↓
┌────────────────────────────────────────────────────────────────┐
│                SECTION 11 : DÉFIS DES MILLIERS                  │
└────────────────────────────────────────────────────────────────┘
         ↓
    [challenge-thousands-1]
    "DÉFI 1 : Affiche le nombre X" (ex: 1234, 5678)
    🎯 Action : Combiner toutes les colonnes
    ✅ Validation avec bouton VALIDER
         ↓
    [challenge-thousands-2]
    "DÉFI 2 : Affiche le nombre Y"
    🎯 Action : Combiner toutes les colonnes
    ✅ Validation avec bouton VALIDER
         ↓
    [challenge-thousands-3]
    "DÉFI 3 : Affiche le nombre Z"
    🎯 Action : Combiner toutes les colonnes
    ✅ Validation avec bouton VALIDER
         ↓
    🎉 Tous les défis des milliers réussis !
    ✅ completedChallenges.thousands = true
         ↓
┌────────────────────────────────────────────────────────────────┐
│                   SECTION 12 : MODE NORMAL                      │
└────────────────────────────────────────────────────────────────┘
         ↓
    [normal]
    "Mode exploration ! 🚀 Construis des grands nombres !"
    🎯 L'utilisateur peut :
    - Créer n'importe quel nombre de 0 à 9999
    - Utiliser toutes les colonnes librement
    - Explorer les retenues et emprunts
    
    🏆 FIN DE L'APPRENTISSAGE GUIDÉ
    L'utilisateur maîtrise maintenant le système décimal !
```

---

## 📊 Diagramme simplifié des transitions
```
PHASES D'INTRO          TUTORIEL           UNITÉS              RETENUE
─────────────────       ─────────          ──────              ───────
intro-welcome      →    tutorial      →    learn-units    →    learn-carry
intro-discover          ↓                   explore-units       ↓
intro-question-digits   (décrémentation)    click-add           (10 pour 1)
intro-add-roll          ↓                   click-remove
intro-question-max      Transition          ↓
                                           challenge-unit-1
                                           challenge-unit-2
                                           challenge-unit-3

DIZAINES                CENTAINES           MILLIERS            FINAL
────────                ─────────           ────────            ─────
learn-tens         →    learn-hundreds  →   learn-thousands →   normal
learn-tens-combo        learn-hund-combo    learn-thou-combo    (libre)
challenge-tens-1        challenge-hund-1    challenge-thou-1
challenge-tens-2        challenge-hund-2    challenge-thou-2
challenge-tens-3        challenge-hund-3    challenge-thou-3
```

---

## 🔑 Phases clés et transitions

### 1️⃣ Phases avec comptage automatique
**`isCountingAutomatically = true`**

- `learn-units` : Compte 1→9
- `learn-tens` : Compte 10→90
- `learn-tens-combination` : Exemples 12, 25, 34
- `learn-hundreds` : Compte 100→900
- `learn-hundreds-combination` : Exemples 123, 234
- `learn-thousands` : Compte 1000→9000
- `learn-thousands-combination` : Exemples 1234, 2345

### 2️⃣ Phases avec validation
**Boutons VALIDER**

- `challenge-unit-1/2/3` → `handleValidateLearning()`
- `challenge-tens-1/2/3` → `handleValidateTens()`
- `challenge-hundreds-1/2/3` → `handleValidateHundreds()`
- `challenge-thousands-1/2/3` → `handleValidateThousands()`

### 3️⃣ Phases avec saisie utilisateur
**`showInputField = true`**

- `intro-question-digits` : Combien de chiffres ? (attendu: 10)
- `intro-question-max` : Jusqu'à combien ? (attendu: 99)

### 4️⃣ Phases interactives libres

- `tutorial` : Apprendre △ et ∇
- `explore-units` : Pratiquer 1, 2, 3
- `click-add` : Monter jusqu'à 9
- `click-remove` : Descendre à 0
- `learn-carry` : Clic pour voir 9→10
- `normal` : Exploration libre

---

## 🎯 Conditions de progression

### ✅ Déblocages

| Phase source | Condition | Phase destination | Effet |
|-------------|-----------|-------------------|-------|
| `intro-question-max` | Réponse 99 | `tutorial` | - |
| `tutorial` | Descente à 0 | `learn-units` | - |
| `challenge-unit-3` | Tous les défis | `learn-carry` | - |
| `learn-carry` | Clic sur △ à 9 | `learn-tens` | - |
| `challenge-tens-3` | Tous les défis | `learn-hundreds` | `completedChallenges.tens = true` |
| `challenge-hundreds-3` | Tous les défis | `learn-thousands` | `completedChallenges.hundreds = true` |
| `challenge-thousands-3` | Tous les défis | `normal` | `completedChallenges.thousands = true` |

### 🔓 Colonnes débloquées par phase

| Phase(s) | Colonnes actives |
|---------|------------------|
| `intro-welcome` | Unités |
| `intro-add-roll` et après | Unités, Dizaines |
| `challenge-unit-*` | Unités, Dizaines |
| `challenge-tens-*` | Unités, Dizaines |
| `challenge-hundreds-*` | Unités, Dizaines, Centaines |
| `challenge-thousands-*` | Unités, Dizaines, Centaines, Milliers |
| `normal` | Toutes |

---

## ⏱️ Durée approximative

| Section | Durée estimée |
|---------|---------------|
| Introduction améliorée | 10-15 minutes |
| Tutoriel | 1-2 minutes |
| Unités (apprentissage + défis) | 5-7 minutes |
| Dizaines (apprentissage + défis) | 5-7 minutes |
| Centaines (apprentissage + défis) | 5-7 minutes |
| Milliers (apprentissage + défis) | 5-7 minutes |

**TOTAL : 32-45 minutes** pour compléter tout l'apprentissage guidé 🎓

---

## 📋 Liste complète des phases

### Introduction (7 phases améliorées)
1. `intro-welcome-personalized` - Accueil personnalisé avec saisie du prénom
2. `intro-discover-machine` - Découverte de la machine avec 4 choix de réponses
3. `intro-first-interaction` - Première manipulation guidée (0→9→0)
4. `intro-count-digits` - Question sur les chiffres (système à 3 tentatives)
5. `intro-second-column` - Résolution de problème (choix de solution)
6. `intro-discover-carry` - Découverte interactive de la retenue 9→10
7. `intro-max-value-question` - Question sur le maximum (système à 3 tentatives)

### Tutoriel (4 phases)
6. `tutorial` - Apprentissage des boutons △ et ∇
7. `explore-units` - Exploration guidée 1-3
8. `click-add` - Montée jusqu'à 9
9. `click-remove` - Descente jusqu'à 0

### Unités (5 phases)
10. `learn-units` - Comptage auto 1-9
11. `challenge-unit-1` - Premier défi
12. `challenge-unit-2` - Deuxième défi
13. `challenge-unit-3` - Troisième défi
14. `learn-carry` - Apprentissage de la retenue

### Dizaines (5 phases)
15. `learn-tens` - Comptage auto par dizaines
16. `learn-tens-combination` - Exemples de combinaisons
17. `challenge-tens-1` - Premier défi
18. `challenge-tens-2` - Deuxième défi
19. `challenge-tens-3` - Troisième défi

### Centaines (5 phases)
20. `learn-hundreds` - Comptage auto par centaines
21. `learn-hundreds-combination` - Exemples de combinaisons
22. `challenge-hundreds-1` - Premier défi
23. `challenge-hundreds-2` - Deuxième défi
24. `challenge-hundreds-3` - Troisième défi

### Milliers (5 phases)
25. `learn-thousands` - Comptage auto par milliers
26. `learn-thousands-combination` - Exemples de combinaisons
27. `challenge-thousands-1` - Premier défi
28. `challenge-thousands-2` - Deuxième défi
29. `challenge-thousands-3` - Troisième défi

### Mode libre (1 phase)
30. `normal` - Exploration libre jusqu'à 9999

**TOTAL : 32 phases distinctes** 🎮 (7 intro + 4 tutorial + 5 units + 5 tens + 5 hundreds + 5 thousands + 1 normal)

---

## 🎓 Progression pédagogique

Le jeu suit une approche pédagogique en spirale :

1. **Introduction** : Découverte du concept
2. **Démonstration** : La machine montre (comptage auto)
3. **Pratique guidée** : L'utilisateur essaie avec feedback
4. **Évaluation** : Défis à relever
5. **Transition** : Apprentissage du concept suivant

Chaque niveau (unités, dizaines, centaines, milliers) suit ce même schéma, permettant une consolidation progressive des acquis. 📚✨

---

## 🎨 AMÉLIORATION DE L'INTRODUCTION (Nouvelle Version)

La séquence d'introduction a été entièrement repensée pour offrir une expérience plus engageante et personnalisée.

### ✨ Nouvelles Fonctionnalités

#### 1. **Personnalisation** (Phase 0)
- Saisie optionnelle du prénom de l'enfant
- Utilisation du prénom tout au long de l'expérience
- Message de bienvenue chaleureux et inclusif

#### 2. **Choix de Réponses** (Phase 1)
- 4 options de réponse pour exprimer son ressenti
- Réponses adaptées à chaque choix
- Timeout automatique après 10 secondes si pas de réponse
- Validation de toutes les émotions de l'enfant

#### 3. **Guidage Progressif** (Phase 2)
- Feedback immédiat à chaque clic
- Aide progressive si l'enfant ne clique pas (5s, 10s)
- Animation et pointage vers le bon bouton
- Encouragements spécifiques à chaque étape (1, 2, 3... 9)

#### 4. **Système à 3 Tentatives** (Phases 3 et 6)

**Tentative 1** : Encouragement simple
- Feedback positif et constructif
- Indice subtil pour guider la réflexion

**Tentative 2** : Aide visuelle
- Affichage séquentiel des éléments
- Possibilité de compter visuellement
- Explication plus détaillée

**Tentative 3** : Guidage complet
- Comptage guidé avec animations
- Utilisation des doigts comme référence
- Démonstration visuelle complète
- **Jamais de situation d'échec**

#### 5. **Résolution de Problème** (Phase 4)
- Implication de l'enfant dans la solution
- Choix entre différentes approches
- Valorisation de toutes les réponses
- Encouragement de la créativité

#### 6. **Exploration Interactive** (Phase 5)
- Découverte active de la retenue 9→10
- Animation "magique" de transformation
- Exploration libre aller-retour
- Ancrage du concept "10 petites = 1 grosse"

### 📈 Améliorations Pédagogiques

| Aspect | Avant | Après |
|--------|-------|-------|
| **Personnalisation** | Aucune | Prénom utilisé partout |
| **Choix de réponses** | 3 options fixes | 4-5 options + timeout |
| **Aide progressive** | Non | Oui (3 niveaux) |
| **Manipulation active** | Minimale | Maximale |
| **Feedback adaptatif** | Générique | Selon réponse précise |
| **Guidage si bloqué** | Non | Oui (animations, pointage) |
| **Exploration libre** | Non | Oui (phase découverte) |
| **Durée** | ~5 min | ~10-15 min |
| **Engagement** | Passif | Actif |

### 🎯 Objectifs Atteints

1. ✅ **Zéro abandon** : L'enfant ne peut pas rester bloqué
2. ✅ **Confiance en soi** : Toujours valorisé, jamais en échec
3. ✅ **Compréhension profonde** : Manipulation + exploration = meilleur ancrage
4. ✅ **Engagement maximal** : L'enfant est acteur, pas spectateur
5. ✅ **Plaisir** : Moments "magiques", surprises, découvertes
6. ✅ **Adaptabilité** : S'adapte au rythme et aux réponses de l'enfant

---