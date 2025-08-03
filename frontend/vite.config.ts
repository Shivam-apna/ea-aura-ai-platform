import { defineConfig, loadEnv } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Define environment variables for staging
  const defineEnv = {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  };
  
  // Add staging-specific environment variables
  if (mode === 'staging') {
    Object.assign(defineEnv, {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify('http://staging.ea-aura.ai/api'),
      'import.meta.env.VITE_KEYCLOAK_URL': JSON.stringify('http://staging.ea-aura.ai/auth'),
      'import.meta.env.VITE_ENVIRONMENT': JSON.stringify('staging'),
    });
  }
  
  return {
    server: {
      host: "::",
      port: 5000,
    },
    plugins: [dyadComponentTagger(), react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: defineEnv,
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            ui: ['@radix-ui/react-tabs', '@radix-ui/react-dialog'],
          },
        },
      },
    },
  };
});