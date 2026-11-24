import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import {fileURLToPath} from 'node:url';
export default defineConfig({plugins:[react(),tailwind()],build:{outDir:'dist/components',emptyOutDir:false,lib:{entry:fileURLToPath(new URL('./src/components-entry.ts',import.meta.url)),formats:['es'],fileName:'index',cssFileName:'styles'},rollupOptions:{external:['react','react-dom','react/jsx-runtime','lucide-react','@radix-ui/react-dialog','@radix-ui/react-tooltip']}}});
