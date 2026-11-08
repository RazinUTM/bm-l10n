(function (root) {
const CARDS = { flood: { title: 'Amaran banjir', text: 'Pakar hidrologi memberi amaran bahawa tanah rendah mungkin dilanda banjir.', L: 'Ambil risiko.' },
  bad: { title: 'Tawaran', text: 'Anda bisa memuat turun fail di sini karena ia percuma.' } };
function sayMS(t) { return t; }
root.IMPAK_MS = { CARDS, sayMS };
})(typeof window !== 'undefined' ? window : globalThis);
