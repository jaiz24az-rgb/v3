import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import fs from 'fs';

// Automatically synchronize generated RT08 high-quality neon branding logo to public asset directory
const copyBrandingAssets = () => {
  const publicDir = path.resolve(__dirname, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  const imagesDir = path.resolve(__dirname, 'src/assets/images');
  if (fs.existsSync(imagesDir)) {
    const files = fs.readdirSync(imagesDir);
    const neonLogoFile = files.find(f => f.startsWith('logo_rt08_neon') && f.endsWith('.png'));
    if (neonLogoFile) {
      const sourcePath = path.join(imagesDir, neonLogoFile);
      fs.copyFileSync(sourcePath, path.join(publicDir, 'favicon.png'));
      fs.copyFileSync(sourcePath, path.join(publicDir, 'icon-192.png'));
      fs.copyFileSync(sourcePath, path.join(publicDir, 'icon-512.png'));
      console.log('Successfully synchronized RT 08 PWA launcher icons and favicons.');
    }
  }
};
copyBrandingAssets();

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
