(function (root) {
const C = root.IMPAK.CFG;            // throws in the sandbox: root.IMPAK is undefined
const CHECKS = { occ: { en: 'Occupancy now', ms: 'Penghunian sekarang', v: (t) => t } };
root.ADVICE = { CHECKS };
})(typeof window !== 'undefined' ? window : globalThis);
