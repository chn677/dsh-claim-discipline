/**
 * The one runnable check. Loads index.js as a real module, hands it a fake ctx,
 * and asserts it registers exactly one section with a valid shape.
 * Run:  node verify.mjs
 */
import assert from 'node:assert/strict';
import { name, inject, apply } from './index.js';

assert.equal(name, 'claim-discipline', 'plugin name');
assert.deepEqual(inject, ['systemPrompt'], 'inject list');

const effects = [];
const sections = [];
const fakeCtx = {
  effect(fn, label) { effects.push(label); fn(); },
  systemPrompt: { section(s) { sections.push(s); return () => {}; } }
};

apply(fakeCtx);

assert.equal(effects.length, 1, 'exactly one effect');
assert.equal(sections.length, 1, 'exactly one section');
const s = sections[0];
assert.equal(s.name, 'local:claim-discipline', 'section name');
assert.ok(Number.isFinite(s.order), 'order must be finite');
assert.equal(typeof s.text, 'string', 'text must be a string');
assert.ok(s.text.length > 100, 'text must be non-trivial');
['1.', '2.', '3.', '4.', '5.', '6.', '7.'].forEach((n) => {
  assert.ok(s.text.includes(n), 'missing rule ' + n);
});
// Sections are variable-interpolated by default, so a {{...}} group would be
// substituted - this payload must stay literal.
assert.ok(!s.text.includes('{{'), 'text must not contain interpolation braces');

console.log('verify OK: 1 section, order=' + s.order + ', ' + s.text.length + ' chars, 7 rules');