document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("langToggleBtn");
  const label = document.getElementById("langLabel");
  if (!btn || !label) return;

  const langMap = { s: "cn", t: "hk" };
  const skipSelectors = [
    "#langToggleBtn",
    "#langLabel",
    "[data-lang-toggle-ignore]",
    "script",
    "style",
    "noscript",
    "pre",
    "code",
    "kbd",
    "samp",
    "textarea",
    "input",
    "select",
    "option",
    "svg",
    "math",
  ];

  const nodeState = new WeakMap();
  const contentRoot =
    document.querySelector(".article-content") ||
    document.querySelector("article") ||
    document.body;

  let originalLang = "s";
  let currentLang = "s";
  let converter = null;

  function shouldSkipNode(node) {
    if (!node || !node.textContent || !node.textContent.trim()) return true;
    const parent = node.parentElement;
    if (!parent) return true;

    for (const selector of skipSelectors) {
      if (parent.closest(selector)) return true;
    }

    if (parent.closest(".logo") || parent.closest('a[href="/"]')) {
      return true;
    }

    return false;
  }

  function collectTextNodes(root) {
    const nodes = [];
    if (!root) return nodes;

    if (root.nodeType === Node.TEXT_NODE) {
      if (!shouldSkipNode(root)) nodes.push(root);
      return nodes;
    }

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) =>
        shouldSkipNode(node)
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT,
    });

    while (walker.nextNode()) {
      nodes.push(walker.currentNode);
    }

    return nodes;
  }

  function detectInitialLang() {
    const text =
      (contentRoot && contentRoot.innerText) ||
      document.body.innerText ||
      "";
    const simplifiedChars = [
      "个",
      "简",
      "么",
      "国",
      "这",
      "没",
      "图",
      "发",
      "为",
      "与",
      "门",
    ];
    const traditionalChars = [
      "個",
      "簡",
      "麼",
      "國",
      "這",
      "沒",
      "圖",
      "發",
      "為",
      "與",
      "門",
    ];
    let simplifiedCount = 0;
    let traditionalCount = 0;

    simplifiedChars.forEach((char) => {
      if (text.includes(char)) simplifiedCount += 1;
    });
    traditionalChars.forEach((char) => {
      if (text.includes(char)) traditionalCount += 1;
    });

    if (simplifiedCount === 0 && traditionalCount === 0) {
      return "t";
    }

    return traditionalCount >= simplifiedCount ? "t" : "s";
  }

  function updateButtonUI(lang) {
    if (lang === "s") {
      label.textContent = "简体";
      btn.title = "当前为简体中文，切换为繁体中文";
    } else {
      label.textContent = "繁體";
      btn.title = "當前為繁體中文，切換為簡體中文";
    }
  }

  function getNodeState(node) {
    let state = nodeState.get(node);
    if (!state) {
      state = { original: node.textContent, converted: null };
      nodeState.set(node, state);
    }
    return state;
  }

  function ensureConverter(targetLang) {
    if (!window.OpenCC || !OpenCC.Converter) return null;
    if (targetLang === originalLang) return null;
    return OpenCC.Converter({
      from: langMap[originalLang],
      to: langMap[targetLang],
    });
  }

  function applyLanguage(targetLang, nodes) {
    const targetNodes = nodes || collectTextNodes(document.body);
    if (targetLang === originalLang) {
      targetNodes.forEach((node) => {
        const state = getNodeState(node);
        node.textContent = state.original;
      });
      return;
    }

    if (!converter) {
      converter = ensureConverter(targetLang);
      if (!converter) return;
    }

    targetNodes.forEach((node) => {
      const state = getNodeState(node);
      if (state.converted === null) {
        state.converted = converter(state.original);
      }
      node.textContent = state.converted;
    });
  }

  function disableToggle(reason) {
    btn.disabled = true;
    btn.title = reason;
    label.textContent = "简繁切换";
  }

  originalLang = detectInitialLang();
  currentLang = originalLang;
  updateButtonUI(currentLang);

  if (!window.OpenCC || !OpenCC.Converter) {
    disableToggle("简繁转换库未加载");
    return;
  }

  btn.addEventListener("click", () => {
    currentLang =
      currentLang === originalLang
        ? originalLang === "s"
          ? "t"
          : "s"
        : originalLang;
    converter = null;
    applyLanguage(currentLang);
    updateButtonUI(currentLang);
  });

  const observer = new MutationObserver((mutations) => {
    if (currentLang === originalLang) return;

    const addedNodes = [];
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          if (!shouldSkipNode(node)) addedNodes.push(node);
          return;
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
          addedNodes.push(...collectTextNodes(node));
        }
      });
    });

    if (!addedNodes.length) return;
    converter = converter || ensureConverter(currentLang);
    if (!converter) return;
    applyLanguage(currentLang, addedNodes);
  });

  observer.observe(document.body, { childList: true, subtree: true });
});
