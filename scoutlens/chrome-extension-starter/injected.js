// Injected Script - Runs in the context of the web page
// This script has access to the page's JavaScript context

console.log('Injected script loaded');

// This script runs in the main world (same as page scripts)
// It can access page variables and functions that content scripts cannot

// Example: Access page variables
if (typeof window.myPageVariable !== 'undefined') {
    console.log('Page variable found:', window.myPageVariable);
}

// Example: Listen for custom events from content script
document.addEventListener('extensionMessage', (event) => {
    console.log('Message from content script:', event.detail);
    
    // You can interact with page JavaScript here
    // For example, call page functions or modify page behavior
});

// Example: Expose functions to the page
window.extensionAPI = {
    version: '1.0.0',
    
    // Example function that page scripts can call
    sendToExtension: function(data) {
        document.dispatchEvent(new CustomEvent('pageToExtension', {
            detail: data
        }));
    },
    
    // Example utility function
    highlightText: function(text) {
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        const textNodes = [];
        let node;
        
        while (node = walker.nextNode()) {
            if (node.textContent.includes(text)) {
                textNodes.push(node);
            }
        }
        
        textNodes.forEach(textNode => {
            const parent = textNode.parentNode;
            const highlighted = textNode.textContent.replace(
                new RegExp(text, 'gi'),
                `<mark style="background: yellow; padding: 2px 4px; border-radius: 2px;">${text}</mark>`
            );
            
            const wrapper = document.createElement('span');
            wrapper.innerHTML = highlighted;
            parent.replaceChild(wrapper, textNode);
        });
    }
};

// Example: Monitor page changes
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
            // Notify extension about page changes
            document.dispatchEvent(new CustomEvent('pageChanged', {
                detail: {
                    type: 'childList',
                    addedNodes: mutation.addedNodes.length,
                    removedNodes: mutation.removedNodes.length
                }
            }));
        }
    });
});

// Start observing
observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Example: Performance monitoring
function reportPerformance() {
    const performance = window.performance;
    const timing = performance.timing;
    
    const metrics = {
        loadTime: timing.loadEventEnd - timing.navigationStart,
        domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
        firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
        resources: performance.getEntriesByType('resource').length
    };
    
    document.dispatchEvent(new CustomEvent('performanceReport', {
        detail: metrics
    }));
}

// Report performance after page load
if (document.readyState === 'complete') {
    setTimeout(reportPerformance, 1000);
} else {
    window.addEventListener('load', () => {
        setTimeout(reportPerformance, 1000);
    });
}
