# mosh-darsh-journal-enhanced — Contexte module

## Identité

| Élément | Valeur |
|---|---|
| ID technique | `mosh-darsh-journal-enhanced` |
| Version | `1.0.0` |
| Foundry VTT | V13 (13.351+) |
| Système | indépendant de `mosh` (juste listé en `relationships.systems`) |

## Rôle

Fournit des **thèmes visuels custom** pour des JournalEntry spécifiques,
via des `JournalSheet` enregistrées à la carte (jamais imposées par défaut).
Architecture extensible : un thème = un sous-dossier `themes/<nom>/`
autonome (assets, scripts, styles), ajoutable sans toucher aux thèmes existants.

Thème actuel : **Gradient Descent** (inspiré du module éponyme, Tuesday Knight Games).

## Structure

```
mosh-darsh-journal-enhanced/
├── module.json
└── themes/
    └── gradient-descent/
        ├── assets/{GD_bg.webp, fonts/{routed-gothic-wide,routed-gothic}.ttf}
        ├── scripts/gradient-descent-journal-sheet.mjs
        └── styles/{variables,journal,blocks}.css
```

## Activation d'un thème (jamais globale)

```json
"flags": {
  "core": { "sheetClass": "mosh-darsh-journal-enhanced.GradientDescentJournalSheet" }
}
```
Enregistrement au hook `init` via `DocumentSheetConfig.registerSheet(JournalEntry, ..., { makeDefault: false })`.

## Techniques V13 spécifiques à ce module — ne pas les "simplifier"

Ces choix viennent de bugs réels rencontrés, ne pas revenir à une approche
plus "naturelle" sans revalider :

| Problème rencontré | Cause | Solution retenue |
|---|---|---|
| Menu GD invisible | Hook `renderJournalTextPageSheet` inexistant en V13 | `MutationObserver` sur `document.body` |
| Toolbar mal ciblée | Parent réel est `<prose-mirror>`, pas `.editor` | `toolbar.closest("prose-mirror")` |
| Dropdown coupé | `<ul>` dans `<li>` coupé par `overflow:hidden` de la toolbar | Menu attaché au `<body>`, `position: fixed` calculé via `getBoundingClientRect()` |
| Insertion efface le texte | `range.deleteContents()` appelé avant l'insertion | Sauvegarder la sélection au `mousedown` du toggle (avant que le clic ne détruise le focus) |
| Bloc custom non appliqué | `<aside>`/`<section>` sanitisés par ProseMirror | Utiliser `<div class="gd ...">` |
| Warning jQuery V13 | `JournalSheet._contextMenu()` reçoit encore du jQuery | Surcharger et convertir en `HTMLElement` |
| Boutons GD manquants | Hook `getProseMirrorMenuDropDowns` ne se comporte pas comme attendu | `MutationObserver` + `setInterval` (1.5s) de secours |

Injection : bouton GD en `<li class="text gd-dropdown-li">` dans
`<menu class="editor-menu">`, avant `li.right` (bouton source code).
Insertion de bloc via **Range API native**, pas l'API ProseMirror (qui
sanitise `<aside>`/`<section>`).

## CSS — 3 fichiers scopés à `.gd-journal-sheet`

- `variables.css` : `@font-face`, palette (`--gd-bg-dark: #0d1a22`, `--gd-red: #cc2200`, `--gd-red-bright: #e63010`, `--gd-text-primary: #e8e4dc`), polices titres/corps
- `journal.css` : mise en page générale (H1–H6, listes `▶`/`↳`, liens, blockquote)
- `blocks.css` : `.gd.box-red` (style BRAINSCANS), `.gd.box-outline` (style ZERO-G), `.gd-red` (span inline)

⚠️ Ne jamais écrire `▶`/`→`/`↳` en dur dans le texte des `<li>` — le CSS les
ajoute via `::before`, ça les doublerait.

## Ajouter un nouveau thème (checklist)

1. `themes/mon-theme/` avec `scripts/`, `styles/`, `assets/`
2. `MonThemeJournalSheet extends foundry.appv1.sheets.JournalSheet`
3. Enregistrement dans `Hooks.once("init")` via `DocumentSheetConfig.registerSheet`
4. Déclarer `esmodules`/`styles` dans `module.json`
5. Activer via `flags.core.sheetClass: "mosh-darsh-journal-enhanced.MonThemeJournalSheet"` sur le journal ciblé

## Règle ID (rappel, héritée du monorepo)

Tous les `_id` (pages, `exportSource.uuid`) : exactement `^[a-zA-Z0-9]{16}$`.
