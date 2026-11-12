import test from 'node:test';
import assert from 'node:assert/strict';
import { expressions, largestFace, smoothScores } from '../src/expressions.js';
test('selects largest face regardless of order, handles no faces', () => {
  const small = { detection: { box: { width: 50, height: 100 } } };
  const large = { detection: { box: { width: 120, height: 100 } } };
  assert.equal(largestFace([small, large]), large);
  assert.equal(largestFace([large, small]), large);
  assert.equal(largestFace([]), null);
});
test('smoothing preserves normalized scores and damps rapid changes', () => {
  const before = Object.fromEntries(expressions.map(e => [e.key, e.key === 'neutral' ? 1 : 0]));
  const after = Object.fromEntries(expressions.map(e => [e.key, e.key === 'happy' ? 1 : 0]));
  assert.deepEqual(smoothScores(null, after), after);
  const result = smoothScores(before, after);
  assert.equal(result.neutral, .6);
  assert.equal(result.happy, .4);
  assert.equal(Object.values(result).reduce((a, b) => a + b), 1);
});
