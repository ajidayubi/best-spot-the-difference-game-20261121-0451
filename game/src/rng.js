// Seeded random helpers for Lantern Harbour.
// Every decorative element (stars, pebbles, blades of grass) is a pure
// function of its seed, so a screenshot of the same scene is identical
// on every machine and every run.
(function (root) {
  'use strict';

  // mulberry32: a small, fast, well-behaved seeded PRNG.
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // A random helper bound to one seed, with the small utilities the
  // scene painters use: ranges, picks, and coin flips.
  function makeRng(seed) {
    const next = mulberry32(seed);
    return {
      next: next,
      range: function (lo, hi) { return lo + next() * (hi - lo); },
      int: function (lo, hi) { return lo + Math.floor(next() * (hi - lo + 1)); },
      pick: function (arr) { return arr[Math.floor(next() * arr.length)]; },
      chance: function (p) { return next() < p; },
    };
  }

  const api = { mulberry32: mulberry32, makeRng: makeRng };
  root.SpotRng = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
