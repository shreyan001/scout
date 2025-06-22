// Content Script - Runs on web pages
// This script is injected into web pages and can interact with the DOM

console.log('Content script loaded');

// Initialize content script
function initContentScript() {
  // Add extension indicator
  const indicator = document.createElement('div');
  indicator.id = 'chrome-extension-indicator';
  indicator.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: #4285f4;
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    z-index: 10000;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    transition: opacity 0.3s ease;
    cursor: pointer;
  `;
  indicator.textContent = 'Extension Active';
  document.body.appendChild(indicator);

  // Auto-hide indicator after 3 seconds
  setTimeout(() => {
    indicator.style.opacity = '0';
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
      }
    }, 300);
  }, 3000);

  // Click handler for indicator
  indicator.addEventListener('click', () => {
    sendMessageToBackground('CONTENT_SCRIPT_CLICKED', {
      url: window.location.href,
      title: document.title
    });
  });
}

// Send message to background script
function sendMessageToBackground(type, data) {
  chrome.runtime.sendMessage({
    type: type,
    data: data,
    timestamp: Date.now(),
    url: window.location.href
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error sending message:', chrome.runtime.lastError);
    } else {
      console.log('Message response:', response);
    }
  });
}

// Listen for messages from background script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received in content script:', message);
  
  switch (message.type) {
    case 'HIGHLIGHT_ELEMENT':
      highlightElement(message.selector);
      sendResponse({ success: true });
      break;
      
    case 'GET_PAGE_INFO':
      const pageInfo = {
        title: document.title,
        url: window.location.href,
        domain: window.location.hostname,
        wordCount: document.body.innerText.split(/\s+/).length,
        images: document.images.length,
        links: document.links.length
      };
      sendResponse({ success: true, pageInfo });
      break;
      
    case 'INJECT_CSS':
      injectCSS(message.css);
      sendResponse({ success: true });
      break;
      
    case 'SCROLL_TO_TOP':
      window.scrollTo({ top: 0, behavior: 'smooth' });
      sendResponse({ success: true });
      break;
      
    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }
  
  return true; // Keep message channel open
});

// Utility functions
function highlightElement(selector) {
  const elements = document.querySelectorAll(selector);
  elements.forEach(el => {
    el.style.cssText += `
      background-color: yellow !important;
      transition: background-color 0.3s ease !important;
    `;
    
    setTimeout(() => {
      el.style.backgroundColor = '';
    }, 2000);
  });
}

function injectCSS(css) {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
}

// DOM manipulation helpers
function addFloatingButton() {
  const button = document.createElement('button');
  button.id = 'extension-floating-button';
  button.textContent = '🚀';
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: #4285f4;
    color: white;
    border: none;
    cursor: pointer;
    font-size: 20px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    transition: transform 0.2s ease;
  `;
  
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.1)';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1)';
  });
  
  button.addEventListener('click', () => {
    sendMessageToBackground('FLOATING_BUTTON_CLICKED', {
      pageTitle: document.title,
      pageUrl: window.location.href
    });
  });
  
  document.body.appendChild(button);
  return button;
}

// Page analysis functions
function analyzePagePerformance() {
  return {
    loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
    domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
    resourceCount: performance.getEntriesByType('resource').length,
    userAgent: navigator.userAgent,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    }
  };
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initContentScript);
} else {
  initContentScript();
}

// Optional: Add floating button (uncomment if needed)
// setTimeout(() => {
//   addFloatingButton();
// }, 1000);

// Send initial load message
sendMessageToBackground('CONTENT_SCRIPT_LOADED', {
  performance: analyzePagePerformance()
});
