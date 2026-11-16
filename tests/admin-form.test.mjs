import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import test from 'node:test';
import ts from 'typescript';

const moduleUrl = (source) => `data:text/javascript,${encodeURIComponent(source)}`;
const screenUrl = new URL('../src/app/admin/plato.tsx', import.meta.url).href;
const routerUrl = moduleUrl(`
  let params = {};
  export const router = { replace() {} };
  export const useLocalSearchParams = () => params;
  export const setParams = (value) => { params = value; };
`);
const storeUrl = moduleUrl(`
  let snapshot;
  export const useRestaurant = () => snapshot;
  export const setRestaurant = (value) => { snapshot = value; };
`);
const stubs = new Map([
  ['expo-router', routerUrl],
  ['@/state/restaurant-store', storeUrl],
  ['@/components/admin/options', moduleUrl('export const categories = [];')],
  ['@/components/admin/use-admin-action', moduleUrl('export const useAdminAction = () => ({});')],
  ['@/constants/konys', moduleUrl('export const space = { xl: 24 };')],
  ['@/components/konys/ui', moduleUrl(
    ['AppText', 'Button', 'Card', 'Chip', 'EmptyState', 'Field', 'Notice', 'Row', 'Screen']
      .map((name) => `export const ${name} = '${name}';`).join('\n'),
  )],
]);

// Se transpila la pantalla real. Solo se simulan sus dependencias de plataforma.
// No se monta DishForm ni se pretende sustituir una prueba de interacción en móvil/web.
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    return stubs.has(specifier)
      ? { url: stubs.get(specifier), shortCircuit: true }
      : nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url !== screenUrl) return nextLoad(url, context);
    const { outputText } = ts.transpileModule(readFileSync(new URL(url), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    });
    return { format: 'module', source: outputText, shortCircuit: true };
  },
});
const { setParams } = await import(routerUrl);
const { setRestaurant } = await import(storeUrl);
const { default: DishScreen } = await import(screenUrl);
hooks.deregister();

test('producción: refrescar datos conserva el tipo y clave del formulario de un plato existente', () => {
  const dish = { id: 'dish-1', name: 'Pizza' };
  setParams({ id: dish.id });
  setRestaurant({ dishes: [dish], loading: false, error: '' });
  const before = DishScreen();
  assert.equal(typeof before.type, 'function');
  assert.equal(before.type.name, 'DishForm');
  setRestaurant({ dishes: [dish], loading: true, error: '' });
  const during = DishScreen();
  assert.equal(during.type, before.type);
  assert.equal(during.key, before.key);
  assert.equal(during.props.dish, dish);
});

test('producción: una carga en segundo plano conserva el formulario de plato nuevo', () => {
  setParams({});
  setRestaurant({ dishes: [], loading: false, error: '' });
  const before = DishScreen();
  setRestaurant({ dishes: [], loading: true, error: '' });
  const during = DishScreen();
  assert.equal(during.type, before.type);
  assert.equal(during.type.name, 'DishForm');
  assert.equal(during.key, 'nuevo');
  assert.equal(before.key, during.key);
});

test('producción: editar un plato aún no cargado muestra espera y después ausencia si no existe', () => {
  setParams({ id: ['missing'] });
  setRestaurant({ dishes: [], loading: true, error: '' });
  const waiting = DishScreen();
  assert.equal(waiting.type, 'Screen');
  assert.equal(waiting.props.children.type, 'Notice');
  setRestaurant({ dishes: [], loading: false, error: '' });
  const missing = DishScreen();
  assert.equal(missing.type, 'Screen');
  assert.equal(missing.props.title, 'Plato no encontrado');
});
