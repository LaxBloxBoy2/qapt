import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Add any additional scripts or stylesheets here */}
        <script dangerouslySetInnerHTML={{
          __html: `
            // Fix for content.js
            window.content = window.content || {};

            // Fix for main-app.js
            window.mainApp = window.mainApp || {
              initialized: true,
              version: '1.0.0'
            };

            // Fix for app-pages-internals.js
            window.appPagesInternals = window.appPagesInternals || {
              initialized: true,
              version: '1.0.0'
            };

            // Fix for font loading
            (function() {
              const style = document.createElement('style');
              style.textContent = \`
                @font-face {
                  font-family: 'Plus Jakarta Sans';
                  font-style: normal;
                  font-weight: 400;
                  src: local('Plus Jakarta Sans');
                }
              \`;
              document.head.appendChild(style);
            })();
          `
        }} />

        {/* Preload fonts */}
        <link
          rel="preload"
          href="/1b3800ed4c918892-s.p.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
