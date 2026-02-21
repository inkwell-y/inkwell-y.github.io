function _toggleZenMode(zendModeButton, options = { scrollToHeader: true }) {
  // Nodes selection
  const body = document.querySelector("body");
  const footer = document.querySelector("footer");
  const tocRight = document.querySelector(".toc-right");
  const tocInside = document.querySelector(".toc-inside");
  const articleContent = document.querySelector(".article-content");
  const header = document.querySelector("#single_header");

  // Add semantic class into body tag
  body.classList.toggle("zen-mode-enable");

  const isImmersive = body.classList.contains("zen-mode-enable");

  // Show/Hide 'toc right' and 'toc inside'
  if (tocRight) {
    tocRight.classList.toggle("lg:block", !isImmersive);
    tocRight.classList.toggle("hidden", isImmersive);
  }
  if (tocInside) {
    tocInside.classList.toggle("lg:hidden", isImmersive);
    tocInside.classList.toggle("hidden", isImmersive);
  }

  // Change width of article content
  articleContent.classList.toggle("max-w-fit");
  articleContent.classList.toggle("max-w-3xl");

  // Keep header width stable so meta-row tags don't shift on mode toggle.
  // Only footer width is toggled for immersive reading balance.
  if (footer) {
    footer.classList.toggle("max-w-full");
    footer.classList.toggle("max-w-3xl");
  }

  // Read i18n title from data-attributes
  const titleI18nDisable = zendModeButton.getAttribute("data-title-i18n-disable");
  const titleI18nEnable = zendModeButton.getAttribute("data-title-i18n-enable");
  const zenModeLabel = document.getElementById("zen-mode-label");
  const nextTitle = isImmersive ? titleI18nEnable : titleI18nDisable;

  if (isImmersive) {
    // Persist configuration
    //localStorage.setItem('blowfish-zen-mode-enabled', 'true');

    // Change title to enable
    if (nextTitle) {
      zendModeButton.setAttribute("title", nextTitle);
    }
    // Auto-scroll to title article
    if (options.scrollToHeader) {
      window.scrollTo(window.scrollX, header.getBoundingClientRect().top - 90);
    }
  } else {
    //localStorage.setItem('blowfish-zen-mode-enabled', 'false');
    if (nextTitle) {
      zendModeButton.setAttribute("title", nextTitle);
    }
    if (options.scrollToHeader) {
      document.querySelector("body").scrollIntoView();
    }
  }

  if (zenModeLabel && nextTitle) {
    zenModeLabel.textContent = nextTitle;
  }
}

function _registerZendModeButtonClick(zendModeButton) {
  zendModeButton.addEventListener("click", function (event) {
    event.preventDefault();

    // Toggle zen-mode
    _toggleZenMode(zendModeButton);
  });
}

(function init() {
  window.addEventListener("DOMContentLoaded", (event) => {
    // Register click on 'zen-mode-button' node element
    const zendModeButton = document.getElementById("zen-mode-button");
    if (zendModeButton !== null && zendModeButton !== undefined) {
      _registerZendModeButtonClick(zendModeButton);
      _toggleZenMode(zendModeButton, { scrollToHeader: false });
    }
  });
})();
