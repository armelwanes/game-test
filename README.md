# Machine à Nombres 🧠

Une application éducative interactive pour apprendre les nombres et le système décimal aux enfants.

## 🎯 Objectif Pédagogique

Cette application enseigne progressivement :
- Le concept de **ZÉRO** (l'absence de quantité)
- Les nombres de **1 à 9** avec une association visuelle (jetons et doigts)
- Le système décimal et la règle d'échange **10 pour 1**
- La manipulation de nombres jusqu'à 9999

## 🚀 Déploiement

L'application est automatiquement déployée sur GitHub Pages à chaque push sur la branche `master`.

**URL de l'application :** `https://armelgeek.github.io/game/`

### Configuration du Déploiement

Le déploiement est géré par GitHub Actions (voir `.github/workflows/deploy.yml`). Pour activer le déploiement :

1. Aller dans les paramètres du repository GitHub
2. Naviguer vers **Pages** dans le menu latéral
3. Dans **Source**, sélectionner **GitHub Actions**
4. Le workflow se déclenchera automatiquement à chaque push

## 💻 Développement Local

### Prérequis
- Node.js 20 ou supérieur
- npm

### Installation

```bash
npm install
```

### Lancer en mode développement

```bash
npm run dev
```

### Build de production

```bash
npm run build
```

### Prévisualiser le build

```bash
npm run preview
```

### Linter

```bash
npm run lint
```

## 📚 Structure Pédagogique

L'application suit un parcours d'apprentissage progressif :

1. **Phase Exploration** (explore-units) : Découverte de ZÉRO, UN, DEUX, TROIS
2. **Phase Pratique** (click-add) : Entraînement jusqu'à SIX
3. **Phase Soustraction** (click-remove) : Retour à ZÉRO
4. **Phase Apprentissage** (learn-units) : Comptage automatique de 1 à 9
5. **Phase Défi** (challenge-learn-unit) : Validation des acquis
6. **Phase Échange** (learn-carry) : Découverte de l'échange 10 pour 1
7. **Mode Libre** (normal) : Manipulation libre des nombres

## 🛠️ Technologies Utilisées

- React 19
- TypeScript
- Vite
- GitHub Actions pour le déploiement

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
