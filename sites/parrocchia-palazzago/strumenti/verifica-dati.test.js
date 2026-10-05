// Test del controllo dati. Uso: npm test
const test = require('node:test');
const assert = require('node:assert');
const { verifica, dataValida } = require('./verifica-dati');

test('le date devono esistere davvero', () => {
  assert.strictEqual(dataValida('2026-10-31'), true);
  assert.strictEqual(dataValida('2026-02-30'), false);
  assert.strictEqual(dataValida('31/10/2026'), false);
});

test('i dati attuali del sito sono validi', () => {
  assert.deepStrictEqual(verifica(), []);
});
