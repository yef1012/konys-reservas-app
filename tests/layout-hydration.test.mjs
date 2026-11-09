import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import test from 'node:test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { Dimensions } from 'react-native-web';

// El mismo alias de React Native que usa Expo al compilar para web.
const aliases = registerHooks({
  resolve(specifier, context, nextResolve) {
    return nextResolve(specifier === 'react-native' ? 'react-native-web' : specifier, context);
  },
});
const { useLayoutWidth } = await import('../src/hooks/use-layout-width.ts');
aliases.deregister();

function ResponsiveLayout() {
  const width = useLayoutWidth();
  return createElement('main', {
    className: width >= 760 ? 'wide' : 'compact',
    style: { padding: width >= 760 ? 36 : 20 },
  },
  createElement('header', null, 'KONYS PIZZA',
    width >= 420 && createElement('span', null, 'BUCARAMANGA')),
  createElement('article', { style: { width: width >= 1000 ? '31.8%' : width >= 640 ? '48%' : '100%' } }, 'Carta'));
}

test('el HTML inicial no cambia con los anchos que activan el diseño adaptable', () => {
  const original = Dimensions.get('window');
  try {
    Dimensions.set({ window: { ...original, width: 0 } });
    const html = renderToString(createElement(ResponsiveLayout));
    assert.match(html, /KONYS PIZZA/);
    assert.match(html, /Carta/);
    // React usa getServerSnapshot tanto al renderizar SSR como al hidratarlo.
    // Se prueban ambos lados de cada punto de cambio de los componentes reales.
    for (const width of [320, 419, 420, 639, 640, 759, 760, 999, 1000, 1440]) {
      Dimensions.set({ window: { ...original, width } });
      assert.equal(Dimensions.get('window').width, width);
      assert.equal(renderToString(createElement(ResponsiveLayout)), html, `Ancho ${width}`);
    }
  } finally {
    Dimensions.set({ window: original });
  }
});
