import assert from 'node:assert/strict';
import test from 'node:test';
import { svgDataUri } from '../src/components/konys/svg-data-uri.ts';

test('las ilustraciones usan Base64 válido para expo-image en Android y conservan su SVG', () => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg"><text>Ilustración KONYS 🍕</text></svg>';
  // Cubre UTF-8 y las tres posibilidades de relleno Base64.
  for (const suffix of ['', ' ', '  ']) {
    const content = svg + suffix;
    const uri = svgDataUri(content);
    assert.equal(uri, `data:image/svg+xml;base64,${Buffer.from(content, 'utf8').toString('base64')}`);
    assert.equal(Buffer.from(uri.split(',')[1], 'base64').toString('utf8'), content);
  }
});
