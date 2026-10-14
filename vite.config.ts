import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig, type Plugin} from 'vite';

// Vite normally emits the module script before the extracted stylesheet. Some
// Android in-app browsers paint the React tree in that gap, then reflow it a
// moment later. Put the final stylesheet first so the first paint is stable.
const stylesBeforeEntryScript = (): Plugin => ({
  name: 'styles-before-entry-script',
  transformIndexHtml: {
    order: 'post',
    handler(html) {
      const stylesheet = html.match(/<link rel="stylesheet" crossorigin href="\/assets\/index-[^"]+\.css">/);
      const entryScript = html.match(/<script type="module" crossorigin src="\/assets\/index-[^"]+\.js"><\/script>/);
      if (!stylesheet || !entryScript) return html;
      return html
        .replace(stylesheet[0], '')
        .replace(entryScript[0], `${stylesheet[0]}\n    ${entryScript[0]}`);
    },
  },
});

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), stylesBeforeEntryScript()],
    build: {
      // Firebase Firestore requires BigInt support; ES2020 covers current
      // Android WebView and mobile Safari without requiring desktop mode.
      target: 'es2020',
      cssTarget: 'safari12',
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
