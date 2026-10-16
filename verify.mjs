/**
 * 唯一的一个可跑自检。把 index.js 当真模块加载，喂它一个假 ctx，
 * 断言它只注册一个 section 且字段形状合法。
 * 跑法:  node verify.mjs
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
// 段文本默认做变量插值，出现 {{...}} 会被替换掉 —— 本插件必须保持原样
assert.ok(!s.text.includes('{{'), 'text must not contain interpolation braces');

console.log('verify OK: 1 section, order=' + s.order + ', ' + s.text.length + ' chars, 7 rules');