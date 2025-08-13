import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// cPanel-optimized Vite configuration for static deployment
export default defineConfig({
  // Build configuration for cPanel static hosting
  build: {
    outDir: "dist/cpanel",
    assetsDir: "assets",
    sourcemap: false, // Disable sourcemaps for production
    minify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor dependencies for better caching
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-select", "@radix-ui/react-tabs"],
          icons: ["lucide-react"],
          charts: ["recharts"],
          utils: ["clsx", "tailwind-merge", "date-fns"]
        },
        // Clean asset naming for cPanel compatibility
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const extType = info[info.length - 1];
          if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(assetInfo.name)) {
            return `assets/media/[name]-[hash].${extType}`;
          }
          if (/\.(png|jpe?g|gif|svg|ico|webp)(\?.*)?$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash].${extType}`;
          }
          if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(assetInfo.name)) {
            return `assets/fonts/[name]-[hash].${extType}`;
          }
          return `assets/[name]-[hash].${extType}`;
        }
      }
    },
    // Optimize for production
    chunkSizeWarningLimit: 1000,
    target: "es2015" // Ensure broad browser compatibility
  },
  
  // Base path for cPanel deployment (can be customized)
  base: "./",
  
  plugins: [
    react({
      // Optimize React for production
      plugins: [
        ["@swc/plugin-styled-components", {}]
      ]
    })
  ],
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  
  // CSS configuration
  css: {
    postcss: {
      plugins: [
        require("tailwindcss"),
        require("autoprefixer"),
      ]
    }
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      "react", 
      "react-dom", 
      "react-router-dom",
      "lucide-react"
    ]
  },
  
  // Preview configuration for testing build locally
  preview: {
    port: 3000,
    host: true
  }
});
