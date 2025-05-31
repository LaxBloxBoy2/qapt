// This file is used to fix the "Failed to load resource: the server responded with a status of 404 (Not Found)" error
(function() {
  // Create a global object for app pages internals
  window.appPagesInternals = window.appPagesInternals || {
    initialized: true,
    version: '1.0.0'
  };

  console.log('app-pages-internals.js loaded');
})();
