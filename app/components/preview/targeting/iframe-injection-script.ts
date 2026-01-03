/**
 * Iframe injection script for element targeting
 * Inlined into preview iframe srcDoc to enable click-to-select functionality
 *
 * IMPORTANT: This script is stringified and injected, so it must be self-contained
 * and not reference any external modules or TypeScript features.
 *
 * Security: Uses nonce-based authentication and validates message structure.
 * Note: postMessage uses '*' because srcdoc iframes have null origin, but nonce
 * prevents unauthorized message injection.
 */

/**
 * Generate the targeting script to inject into iframe
 * @param messageNonce - Nonce for postMessage authentication
 */
export function generateTargetingScript(messageNonce: string): string {
  // Escape nonce to prevent injection
  const escapedNonce = messageNonce.replace(/'/g, "\\'").replace(/\\/g, '\\\\');

  return `
(function() {
  var targetingEnabled = false;
  var hoveredElement = null;
  var selectedElement = null;
  var messageNonce = '${escapedNonce}';

  // Selector generation with proper escaping
  function generateUniqueSelector(element) {
    if (element.id) {
      return '#' + CSS.escape(element.id);
    }
    var dataAttrs = Array.from(element.attributes)
      .filter(function(attr) { return attr.name.startsWith('data-'); })
      .slice(0, 2);
    if (dataAttrs.length > 0) {
      var sel = dataAttrs.map(function(attr) {
        // Escape both attribute name and value for security
        return '[' + CSS.escape(attr.name) + '="' + CSS.escape(attr.value) + '"]';
      }).join('');
      if (document.querySelectorAll(sel).length === 1) return sel;
    }
    if (element.className && typeof element.className === 'string') {
      var classes = element.className.trim().split(/\\s+/).slice(0, 2);
      if (classes.length > 0 && classes[0]) {
        // Use tag + class for more accurate nth-of-type
        var tagName = element.tagName.toLowerCase();
        var classSelector = tagName + '.' + classes.map(function(c) { return CSS.escape(c); }).join('.');
        var matches = document.querySelectorAll(classSelector);
        if (matches.length === 1) return classSelector;
        var idx = Array.from(matches).indexOf(element);
        if (idx >= 0) return classSelector + ':nth-of-type(' + (idx + 1) + ')';
      }
    }
    var parent = element.parentElement;
    if (parent && parent !== document.body) {
      var siblings = Array.from(parent.children).filter(function(c) {
        return c.tagName === element.tagName;
      });
      var index = siblings.indexOf(element);
      var parentSelector = generateUniqueSelector(parent);
      return parentSelector + ' > ' + element.tagName.toLowerCase() + ':nth-of-type(' + (index + 1) + ')';
    }
    return element.tagName.toLowerCase();
  }

  function getAncestorPath(element, maxDepth) {
    maxDepth = maxDepth || 4;
    var path = [];
    var current = element;
    while (current && path.length < maxDepth && current !== document.body) {
      var tag = current.tagName.toLowerCase();
      var className = typeof current.className === 'string' ? current.className.split(' ')[0] : '';
      path.unshift(className ? tag + '.' + className : tag);
      current = current.parentElement;
    }
    return path;
  }

  // Store element references for efficient cleanup
  var highlightedSelected = null;
  var highlightedHover = null;

  function highlightElement(el, type) {
    if (type === 'selected') {
      // Clear previous selected highlight
      if (highlightedSelected && highlightedSelected !== el) {
        highlightedSelected.style.outline = '';
        highlightedSelected.style.outlineOffset = '';
        highlightedSelected.removeAttribute('data-targeting-selected');
      }
      el.style.outline = '3px solid #0070f3';
      el.style.outlineOffset = '2px';
      el.setAttribute('data-targeting-selected', 'true');
      highlightedSelected = el;
    } else if (type === 'hover') {
      el.style.outline = '2px dashed #0070f3';
      el.setAttribute('data-targeting-hover', 'true');
      highlightedHover = el;
    }
  }

  function clearHighlights() {
    if (highlightedSelected) {
      highlightedSelected.style.outline = '';
      highlightedSelected.style.outlineOffset = '';
      highlightedSelected.removeAttribute('data-targeting-selected');
      highlightedSelected = null;
    }
    if (highlightedHover) {
      highlightedHover.style.outline = '';
      highlightedHover.removeAttribute('data-targeting-hover');
      highlightedHover = null;
    }
  }

  // Event handlers stored for cleanup
  var clickHandler = null;
  var hoverHandler = null;
  var mouseoutHandler = null;

  function attachListeners() {
    clickHandler = function(event) {
      if (!targetingEnabled) return;
      event.preventDefault();
      event.stopPropagation();

      var element = event.target;
      if (!element || element === document.body || element === document.documentElement) return;

      selectedElement = element;
      highlightElement(element, 'selected');

      var selector = generateUniqueSelector(element);
      var rect = element.getBoundingClientRect();
      var textContent = (element.textContent || '').slice(0, 100).trim();

      window.parent.postMessage({
        type: 'ELEMENT_SELECTED',
        nonce: messageNonce,
        element: {
          selector: selector,
          tagName: element.tagName.toLowerCase(),
          className: element.className || '',
          textContent: textContent,
          boundingRect: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          },
          path: getAncestorPath(element)
        }
      }, '*');
    };

    hoverHandler = function(event) {
      if (!targetingEnabled) return;
      var element = event.target;
      if (element === hoveredElement || element === selectedElement) return;
      if (element === document.body || element === document.documentElement) return;

      if (hoveredElement && hoveredElement !== selectedElement) {
        hoveredElement.style.outline = '';
        hoveredElement.removeAttribute('data-targeting-hover');
      }

      hoveredElement = element;
      if (element !== selectedElement) {
        element.style.outline = '2px dashed #0070f3';
        element.setAttribute('data-targeting-hover', 'true');
      }
    };

    mouseoutHandler = function(event) {
      if (!targetingEnabled) return;
      var element = event.target;
      if (element === hoveredElement && element !== selectedElement) {
        element.style.outline = '';
        element.removeAttribute('data-targeting-hover');
        hoveredElement = null;
      }
    };

    document.addEventListener('click', clickHandler, true);
    document.addEventListener('mouseover', hoverHandler, true);
    document.addEventListener('mouseout', mouseoutHandler, true);
  }

  function removeListeners() {
    if (clickHandler) document.removeEventListener('click', clickHandler, true);
    if (hoverHandler) document.removeEventListener('mouseover', hoverHandler, true);
    if (mouseoutHandler) document.removeEventListener('mouseout', mouseoutHandler, true);
    clickHandler = null;
    hoverHandler = null;
    mouseoutHandler = null;
  }

  // Message handler from parent with validation
  window.addEventListener('message', function(event) {
    var data = event.data;
    if (!data || typeof data !== 'object') return;
    // Validate nonce to prevent spoofed messages
    if (data.nonce !== messageNonce) return;

    if (data.type === 'ENABLE_TARGETING') {
      var wasEnabled = targetingEnabled;
      targetingEnabled = !!data.enabled;
      document.body.style.cursor = targetingEnabled ? 'crosshair' : '';

      if (targetingEnabled && !wasEnabled) {
        attachListeners();
      } else if (!targetingEnabled && wasEnabled) {
        removeListeners();
        clearHighlights();
        hoveredElement = null;
        selectedElement = null;
      }
    }

    if (data.type === 'HIGHLIGHT_ELEMENT') {
      if (data.selector && typeof data.selector === 'string') {
        try {
          var el = document.querySelector(data.selector);
          if (el) highlightElement(el, 'selected');
        } catch (e) {
          // Invalid selector, ignore
        }
      } else {
        clearHighlights();
      }
    }

    if (data.type === 'CLEAR_SELECTION') {
      clearHighlights();
      selectedElement = null;
    }
  });
})();
`;
}
