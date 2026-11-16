import { registerHooks } from 'node:module';

const sourceRoot = new URL('../../src/', import.meta.url);

// Node ejecuta el TypeScript real; este hook solo resuelve las rutas que usa Expo.
export function registerTypeScriptPaths() {
  return registerHooks({
    resolve(specifier, context, nextResolve) {
      const mapped = specifier.startsWith('@/')
        ? new URL(specifier.slice(2), sourceRoot).href
        : specifier;
      try {
        return nextResolve(mapped, context);
      } catch (error) {
        if (error.code !== 'ERR_MODULE_NOT_FOUND'
          || !/^(?:\.{1,2}\/|file:)/.test(mapped)
          || /\.[a-z0-9]+$/i.test(mapped)) throw error;
        return nextResolve(`${mapped}.ts`, context);
      }
    },
  });
}
