/**
 * GRADIENT DESCENT — Journal Sheet + Toolbar Injection
 * Custom JournalSheet pour le thème Gradient Descent (Mothership RPG)
 *
 * Pour activer ce thème sur un journal :
 *   flags > core > sheetClass : "fmmoshgradientdescent.GradientDescentJournalSheet"
 */

const MODULE_ID = "mosh-darsh-journal-enhanced";
const CSS_CLASS = "gd-journal-sheet";

/* ====================================================================
   DÉFINITION DES BLOCS GD
   ==================================================================== */

// Sélection sauvegardée au moment de l'ouverture du menu
let _savedRange = null;

const GD_BLOCKS = [
  { title: "Encadré Rouge",   className: "gd box-red" },
  { title: "Encadré Contour", className: "gd box-outline" },
];

/* ====================================================================
   CSS DU DROPDOWN
   ==================================================================== */

function injectDropdownCSS() {
  if (document.getElementById("gd-dropdown-styles")) return;
  const style = document.createElement("style");
  style.id = "gd-dropdown-styles";
  style.textContent = `
    .gd-dropdown-li {
      position: relative !important;
    }
    .gd-dropdown-toggle {
      background: rgba(180,30,0,0.22);
      border: 1px solid #993300;
      color: #e8e4dc;
      font-size: 0.72rem;
      letter-spacing: 0.1em;
      padding: 2px 8px;
      cursor: pointer;
      border-radius: 2px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      height: 22px;
      transition: background 0.2s;
      white-space: nowrap;
    }
    .gd-dropdown-toggle:hover {
      background: rgba(180,30,0,0.5);
      border-color: #cc2200;
    }
    .gd-dropdown-menu {
      display: none;
      position: fixed;
      z-index: 99999;
      background: #060d14;
      border: 1px solid #882200;
      border-radius: 3px;
      min-width: 200px;
      box-shadow: 0 6px 20px rgba(0,0,0,0.85);
      padding: 4px 0;
      list-style: none;
      margin: 0;
    }
    .gd-dropdown-menu.gd-open {
      display: block;
    }
    .gd-menu-header {
      padding: 4px 12px 3px;
      font-size: 0.65rem;
      color: #cc2200;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      border-bottom: 1px solid rgba(180,30,0,0.3);
      margin-bottom: 3px;
      cursor: default;
      user-select: none;
    }
    .gd-dropdown-menu li.gd-item a {
      display: block;
      padding: 5px 16px;
      color: #a0998f;
      font-size: 0.8rem;
      cursor: pointer;
      white-space: nowrap;
      text-decoration: none !important;
      transition: color 0.12s, background 0.12s;
    }
    .gd-dropdown-menu li.gd-item a:hover {
      color: #e8e4dc;
      background: rgba(180,30,0,0.25);
    }
  `;
  document.head.appendChild(style);
}

/* ====================================================================
   INJECTION DANS LA TOOLBAR — MutationObserver (méthode fiable V13)
   ==================================================================== */

function watchForEditors() {
  // Observer : surveille l'apparition de nouveaux nœuds dans le DOM
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1) continue;
        // L'éditeur lui-même
        if (node.classList?.contains("ProseMirror") && node.classList?.contains("editor-content")) {
          _injectIntoEditorParent(node);
        }
        // Ou un conteneur qui contient l'éditeur
        const editor = node.querySelector?.(".editor-content.ProseMirror");
        if (editor) _injectIntoEditorParent(editor);
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // setInterval de secours : ré-injecte si le bouton a disparu
  setInterval(() => {
    document.querySelectorAll("menu.editor-menu").forEach(toolbar => {
      if (!toolbar.querySelector(".gd-dropdown-li")) {
        _addButtonToToolbar(toolbar);
      }
    });
  }, 1500);
}

function _injectIntoEditorParent(editorEl) {
  // Remonter pour trouver prose-mirror ou le parent direct du menu
  const proseMirror = editorEl.closest("prose-mirror") ?? editorEl.parentElement;
  const toolbar = proseMirror?.querySelector("menu.editor-menu");
  if (toolbar) _addButtonToToolbar(toolbar);
}

/* ====================================================================
   CONSTRUCTION DU BOUTON GD DANS LA TOOLBAR
   ==================================================================== */

function _addButtonToToolbar(toolbar) {
  if (!toolbar || toolbar.querySelector(".gd-dropdown-li")) return;

  // Créer le <li> comme les autres items de la toolbar Foundry V13
  const li = document.createElement("li");
  li.className = "text gd-dropdown-li";

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "gd-dropdown-toggle";
  toggle.innerHTML = `GD <i class="fa-solid fa-caret-down" style="font-size:0.6em;opacity:0.8;"></i>`;
  toggle.title = "Insérer un bloc Gradient Descent";

  // Le menu est attaché au BODY pour éviter les overflow/clip de la toolbar
  const menu = document.createElement("ul");
  menu.className = "gd-dropdown-menu";
  menu.dataset.gdMenu = "true";
  document.body.appendChild(menu);

  // En-tête non cliquable
  const headerLi = document.createElement("li");
  headerLi.className = "gd-menu-header";
  headerLi.textContent = "Blocs Gradient Descent";
  menu.appendChild(headerLi);

  // Items
  GD_BLOCKS.forEach(block => {
    const itemLi = document.createElement("li");
    itemLi.className = "gd-item";
    const a = document.createElement("a");
    a.textContent = block.title;
    a.title = block.title;
    a.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      _closeAllGDMenus();
      // Restaurer la sélection sauvegardée avant l'insertion
      if (_savedRange) {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(_savedRange);
        _savedRange = null;
      }
      _insertBlockAtCursor(block);
    });
    itemLi.appendChild(a);
    menu.appendChild(itemLi);
  });

  li.appendChild(toggle);

  // Insérer avant le bouton source-code (le dernier à droite)
  const rightLi = toolbar.querySelector("li.right, li.source-code-edit");
  rightLi ? toolbar.insertBefore(li, rightLi) : toolbar.appendChild(li);

  // Toggle ouverture
  toggle.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isOpen = menu.classList.contains("gd-open");
    _closeAllGDMenus();
    if (!isOpen) {
      // Sauvegarder la sélection courante AVANT que le clic ne la détruise
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        _savedRange = sel.getRangeAt(0).cloneRange();
      } else {
        _savedRange = null;
      }
      const rect = toggle.getBoundingClientRect();
      menu.style.top  = `${rect.bottom + window.scrollY + 2}px`;
      menu.style.left = `${rect.left + window.scrollX}px`;
      menu.classList.add("gd-open");
    }
  });

  // Fermer au clic extérieur
  document.addEventListener("mousedown", (e) => {
    if (!li.contains(e.target) && !menu.contains(e.target)) _closeAllGDMenus();
  });
}

/* ====================================================================
   INSERTION VIA RANGE API (méthode fiable — pas ProseMirror)
   ==================================================================== */

function _expandSelectionToBlocks(sel) {
  if (!sel.rangeCount) return;
  const range = sel.getRangeAt(0);
  const validTags = ["P","DIV","H1","H2","H3","H4","H5","H6","BLOCKQUOTE","SECTION","UL","OL","PRE","LI"];

  const getBlockParent = (node) => {
    let cur = node;
    while (cur && !cur.classList?.contains("ProseMirror")) {
      if (cur.nodeType === 1 && validTags.includes(cur.tagName)) return cur;
      cur = cur.parentNode;
    }
    return null;
  };

  let start = range.startContainer.nodeType === 3 ? range.startContainer.parentNode : range.startContainer;
  let end   = range.endContainer.nodeType === 3   ? range.endContainer.parentNode   : range.endContainer;

  let startBlock = getBlockParent(start);
  let endBlock   = getBlockParent(end);

  if (startBlock && endBlock) {
    if (startBlock.tagName === "LI") startBlock = startBlock.closest("ul,ol") || startBlock;
    if (endBlock.tagName   === "LI") endBlock   = endBlock.closest("ul,ol")   || endBlock;
    const newRange = document.createRange();
    newRange.setStartBefore(startBlock);
    newRange.setEndAfter(endBlock);
    sel.removeAllRanges();
    sel.addRange(newRange);
  }
}

function _insertBlockAtCursor(block) {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) {
    ui.notifications.warn("GD | Sélectionne du texte d'abord.");
    return;
  }

  // Étendre la sélection aux blocs complets
  _expandSelectionToBlocks(sel);

  const range = sel.getRangeAt(0);

  // Créer un div wrapper (ProseMirror accepte div, pas aside)
  const wrapper = document.createElement("div");
  wrapper.className = block.className;

  try {
    const extracted = range.extractContents();
    if (!extracted.textContent.trim() && extracted.children.length === 0) {
      const p = document.createElement("p");
      p.textContent = "Contenu...";
      wrapper.appendChild(p);
    } else {
      wrapper.appendChild(extracted);
    }

    range.insertNode(wrapper);

    // Sélectionner le bloc inséré
    const newRange = document.createRange();
    newRange.selectNode(wrapper);
    sel.removeAllRanges();
    sel.addRange(newRange);

    ui.notifications.info(`GD | Bloc "${block.title}" appliqué.`);
  } catch(e) {
    console.error("GD | Erreur insertion:", e);
    ui.notifications.error("GD | Erreur : " + e.message);
  }
}

function _closeAllGDMenus() {
  document.querySelectorAll(".gd-dropdown-menu.gd-open").forEach(m => m.classList.remove("gd-open"));
}

function _fallbackCopy(html) {
  navigator.clipboard?.writeText(html).then(() => {
    ui.notifications.warn("GD | HTML copié dans le presse-papier — colle en mode source (</>).");
  });
}

/* ====================================================================
   JOURNAL SHEET
   ==================================================================== */

export class GradientDescentJournalSheet extends foundry.appv1.sheets.JournalSheet {

  constructor(doc, options) {
    super(doc, options);
    this.options.classes.push(CSS_CLASS);
  }

  /** @inheritdoc */
  async _render(...args) {
    await super._render(...args);
    const [html] = this._element;

    html.style.background      = "transparent";
    html.style.backgroundColor = "transparent";

    const windowContent = html.querySelector(".window-content");
    if (windowContent) windowContent.style.backgroundColor = "transparent";

    const journalContent = html.querySelector(".journal-entry-content");
    if (journalContent) journalContent.style.backgroundColor = "transparent";

    const aside = html.querySelector("aside.sidebar");
    if (aside) aside.style.backgroundColor = "rgba(5, 12, 18, 0.92)";

    const header = html.querySelector("header");
    if (header) header.style.backgroundColor = "rgba(5, 12, 18, 0.95)";

    html.querySelectorAll(".content-link").forEach(link => {
      link.style.color      = "var(--gd-red-bright)";
      link.style.fontWeight = "600";
    });
  }

  /**
   * Surcharge _contextMenu pour corriger le warning jQuery V13.
   * @override
   */
  _contextMenu(html) {
    const element = html instanceof HTMLElement ? html : html[0];
    return super._contextMenu(element);
  }

  static register() {
    DocumentSheetConfig.registerSheet(
      JournalEntry,
      MODULE_ID,
      GradientDescentJournalSheet,
      { label: "Gradient Descent — Darsh Journal", makeDefault: false }
    );
  }
}

/* ====================================================================
   INIT
   ==================================================================== */

Hooks.once("init", () => {
  GradientDescentJournalSheet.register();
  injectDropdownCSS();
  console.log("Gradient Descent Journal Theme | Initialized");
});

Hooks.once("ready", () => {
  watchForEditors();
  console.log("Gradient Descent Journal Theme | Watching for editors");
});
