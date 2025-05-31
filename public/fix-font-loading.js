// This script fixes font loading issues
(function() {
  // Create a style element
  const style = document.createElement('style');
  
  // Add font-face definitions
  style.textContent = `
    @font-face {
      font-family: 'Plus Jakarta Sans';
      font-style: normal;
      font-weight: 400;
      src: url('/1b3800ed4c918892-s.p.woff2') format('woff2');
    }
    
    @font-face {
      font-family: 'Plus Jakarta Sans';
      font-style: normal;
      font-weight: 500;
      src: url('/1b3800ed4c918892-s.p.woff2') format('woff2');
    }
    
    @font-face {
      font-family: 'Plus Jakarta Sans';
      font-style: normal;
      font-weight: 600;
      src: url('/1b3800ed4c918892-s.p.woff2') format('woff2');
    }
    
    @font-face {
      font-family: 'Plus Jakarta Sans';
      font-style: normal;
      font-weight: 700;
      src: url('/1b3800ed4c918892-s.p.woff2') format('woff2');
    }
  `;
  
  // Append the style element to the head
  document.head.appendChild(style);
  
  console.log('Font loading fix applied');
})();
