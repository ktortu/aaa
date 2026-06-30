# Aaa (Monorepo)

[![CI](https://github.com/ktortu/aaa/actions/workflows/ci.yml/badge.svg)](https://github.com/ktortu/aaa/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Ce dépôt est un monorepo contenant la bibliothèque Angular **@ktortu/aaa** ainsi que son application de démonstration et de documentation interactive.

> 🚀 **Démo & documentation en ligne** : [ktortu-aaa-demo.web.app](https://ktortu-aaa-demo.web.app/)

---

## 📁 Structure du projet

Le projet est organisé sous forme de monorepo Angular CLI :

- **`projects/ktortu/aaa`** : Le code source de la bibliothèque de composants. C'est une bibliothèque de composants **headless** (accessibles, basés sur `@angular/aria` et le CDK d'Angular) dont le style est entièrement personnalisable via des tokens CSS (`--kt-*`).
  - 📖 Voir le [README de la bibliothèque](projects/ktortu/aaa/README.md) pour les détails d'intégration et d'utilisation.
- **`projects/demo`** : L'application Angular servant de vitrine de démonstration, d'exemples interactifs et de documentation pour chaque composant.
- **`.github/workflows/ci.yml`** : Le workflow GitHub Actions configuré pour exécuter les tests (unitaires, E2E, mutation) et le linting à chaque modification.

---

## 🛠️ Installation et Développement

### Prérequis

- **Node.js** (version 22 recommandée)
- **npm** (inclus avec Node.js)

### Installation des dépendances

À la racine du projet, installez l'ensemble des paquets requis via `npm ci` pour garantir l'utilisation des versions du `package-lock.json` :

```bash
npm ci
```

### Lancer l'application de démonstration en local

Pour démarrer le serveur de développement local et visualiser la documentation interactive :

```bash
npm start
# ou
ng serve
```

Une fois le serveur démarré, ouvrez votre navigateur sur `http://localhost:4210/`.

### Compiler la bibliothèque

Pour générer les fichiers de production de la bibliothèque `@ktortu/aaa` dans le dossier `dist/` :

```bash
npm run build:lib
```

---

## 🧪 Tests et Qualité

Le projet possède une suite complète de tests automatiques afin de garantir la qualité et l'accessibilité des composants.

### Tests Unitaires (Vitest)

Les tests unitaires sont propulsés par [Vitest](https://vitest.dev/). Pour les exécuter :

```bash
npm test
```

Pour la CI, vous pouvez exécuter le script suivant qui applique la configuration de couverture :

```bash
npm run test:ci
```

### Tests End-to-End (Playwright + Axe A11y)

Les tests de bout en bout et les audits d'accessibilité automatique s'appuient sur [Playwright](https://playwright.dev/) et `@axe-core/playwright`.

Pour exécuter les tests E2E :

```bash
# S'assurer d'abord que les navigateurs Playwright sont installés
npx playwright install --with-deps

# Exécuter les tests
npm run e2e
```

### Tests de Mutation (Stryker)

Pour mesurer la robustesse de la suite de tests unitaires, le projet utilise [Stryker Mutator](https://stryker-mutator.io/). Vous pouvez lancer les tests de mutation sur différentes parties de la bibliothèque :

```bash
# Mutation globale
npm run mutation

# Mutation ciblée par module
npm run mutation:forms
npm run mutation:i18n-cdk
npm run mutation:temporal
```

### Qualité du Code (Linting et Formatage)

Le projet utilise **ESLint** et **Prettier**. Des hooks **Husky** et **lint-staged** sont installés pour s'assurer que le code commité respecte ces règles.

Pour vérifier ou corriger manuellement le formatage :

```bash
# Vérifier le formatage et le lint
npm run lint
npm run format:check

# Appliquer les corrections automatiques de formatage
npm run format:write
```

---

## ♿ Accessibilité (A11y)

L'accessibilité est au cœur de la conception de `@ktortu/aaa`.

- Des tests automatisés Axe sont intégrés dans la suite de tests Playwright.
- Pour en savoir plus sur les revues d'accessibilité et les choix de design, consultez le document [POST-REVIEW-A11Y.md](projects/ktortu/aaa/POST-REVIEW-A11Y.md).

---

## 📄 Licence

Ce projet est distribué sous la licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.
