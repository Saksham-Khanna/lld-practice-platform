import path from 'path';
import { fileURLToPath } from 'url';
import type { Plugin } from 'vite';
import { loadEnv } from 'vite';
import { handleApiRequest } from './apiHandler';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');

dotenv.config({ path: envPath });

export function lldApiServerPlugin(): Plugin {
  return {
    name: 'lld-api-server',
    configureServer(server) {
      const rootDir = server.config.root || path.resolve(__dirname, '../../');
      const loadedEnv = loadEnv(server.config.mode || 'development', rootDir, '');
      if (loadedEnv.GEMINI_API_KEY) {
        process.env.GEMINI_API_KEY = loadedEnv.GEMINI_API_KEY;
      }
      if (loadedEnv.GEMINI_MODEL) {
        process.env.GEMINI_MODEL = loadedEnv.GEMINI_MODEL;
      }

      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith('/api/')) {
          try {
            // Recheck/sync env if needed
            if (!process.env.GEMINI_API_KEY) {
              dotenv.config({ path: envPath, override: true });
            }
            const handled = await handleApiRequest(req, res);
            if (!handled) {
              next();
            }
          } catch (err) {
            next(err);
          }
        } else {
          next();
        }
      });
    },
    configurePreviewServer(server) {
      const rootDir = server.config.root || path.resolve(__dirname, '../../');
      const loadedEnv = loadEnv(server.config.mode || 'production', rootDir, '');
      if (loadedEnv.GEMINI_API_KEY) {
        process.env.GEMINI_API_KEY = loadedEnv.GEMINI_API_KEY;
      }
      if (loadedEnv.GEMINI_MODEL) {
        process.env.GEMINI_MODEL = loadedEnv.GEMINI_MODEL;
      }

      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith('/api/')) {
          try {
            const handled = await handleApiRequest(req, res);
            if (!handled) {
              next();
            }
          } catch (err) {
            next(err);
          }
        } else {
          next();
        }
      });
    },
  };
}
