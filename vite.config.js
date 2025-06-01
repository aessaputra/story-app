import { defineConfig } from 'vite';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  root: resolve(__dirname, 'src'),
  publicDir: resolve(__dirname, 'src', 'public'),
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    minify: 'terser', // Menggunakan Terser untuk minifikasi
    terserOptions: {
      compress: {
        drop_console: true, // Menghapus semua console.* calls
        drop_debugger: true, // Menghapus debugger statements
      },
    },
    rollupOptions: {
      // Opsi Rollup tambahan jika diperlukan
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});