// Fix for "Cannot read properties of null (reading 'content')" error
(function() {
  // Only run this script once
  if (window.__contentFixApplied) return;
  
  // Define window.content if it doesn't exist
  if (typeof window.content === 'undefined' || window.content === null) {
    Object.defineProperty(window, 'content', {
      value: window,
      writable: false,
      configurable: true
    });
    console.log('Fixed window.content property');
  }
  
  // Mark as applied
  window.__contentFixApplied = true;
})();
