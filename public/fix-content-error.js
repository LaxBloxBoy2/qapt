// This script fixes the "Cannot read properties of null (reading 'content')" error
// by providing a safe fallback for window.content

(function() {
  // Only define window.content if it doesn't already exist
  if (window.content === undefined || window.content === null) {
    // Create a safe empty object
    Object.defineProperty(window, 'content', {
      value: {},
      writable: false,
      configurable: true
    });
    console.log('Fixed window.content property');
  }
})();
