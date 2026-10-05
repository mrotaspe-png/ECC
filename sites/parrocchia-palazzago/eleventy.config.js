// Configurazione di Eleventy: trasforma i file in src/ nel sito pronto in _site/.
// Di solito non serve toccare questo file: i contenuti si modificano in src/.

const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio',
  'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const GIORNI = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];

// Le date nei file sono scritte come "2026-10-12": le leggiamo senza fuso orario
// per evitare che diventino il giorno prima.
function leggiData(valore) {
  if (valore instanceof Date) return valore;
  const [anno, mese, giorno] = String(valore).slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(anno, mese - 1, giorno));
}

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy('src/assets');
  eleventyConfig.addPassthroughCopy('src/admin');

  // Ogni pagina usa il layout "pagina" se non ne indica un altro.
  eleventyConfig.addGlobalData('layout', 'layouts/pagina.njk');

  // "12 ottobre 2026"
  eleventyConfig.addFilter('data', valore => {
    const d = leggiData(valore);
    return `${d.getUTCDate()} ${MESI[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  });
  // "domenica 12 ottobre"
  eleventyConfig.addFilter('dataGiorno', valore => {
    const d = leggiData(valore);
    return `${GIORNI[d.getUTCDay()]} ${d.getUTCDate()} ${MESI[d.getUTCMonth()]}`;
  });
  eleventyConfig.addFilter('giornoNumero', valore => leggiData(valore).getUTCDate());
  eleventyConfig.addFilter('meseBreve', valore => MESI[leggiData(valore).getUTCMonth()].slice(0, 3));
  eleventyConfig.addFilter('iso', valore => leggiData(valore).toISOString().slice(0, 10));
  eleventyConfig.addFilter('euro', valore =>
    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, useGrouping: 'always' }).format(valore));
  eleventyConfig.addFilter('percento', (parte, totale) => (totale ? Math.round((parte / totale) * 100) : 0));
  eleventyConfig.addFilter('ordinaPerData', (elenco, campo = 'data') =>
    [...(elenco || [])].sort((a, b) => leggiData(a[campo]) - leggiData(b[campo])));
  eleventyConfig.addFilter('primi', (elenco, quanti) => (elenco || []).slice(0, quanti));
  eleventyConfig.addFilter('json', valore => JSON.stringify(valore));
  eleventyConfig.addFilter('sezioneDi', (url, menu) =>
    menu.find(voce => voce.url !== '/' && url.startsWith(voce.url)));

  eleventyConfig.addCollection('avvisi', api =>
    api.getFilteredByGlob('src/avvisi/*.md').sort((a, b) => b.date - a.date));
  eleventyConfig.addCollection('giovani', api =>
    api.getFilteredByGlob('src/oratorio/giovani/*.md').sort((a, b) => b.date - a.date));

  return {
    dir: { input: 'src', output: '_site', includes: '_includes', data: '_data' },
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk'
  };
};
