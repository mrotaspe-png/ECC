#!/usr/bin/env node
// Controlla i file in src/_data prima della pubblicazione:
// date scritte bene, giorni della settimana esistenti, orari validi, campi obbligatori.
// Uso: npm run verifica

const fs = require('fs');
const path = require('path');

const CARTELLA = path.join(__dirname, '..', 'src', '_data');
const GIORNI = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
const DATA = /^\d{4}-\d{2}-\d{2}$/;
const ORA = /^\d{1,2}[:.]\d{2}$/;

function leggi(nome) {
  const file = path.join(CARTELLA, `${nome}.json`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function dataValida(valore) {
  if (!DATA.test(String(valore))) return false;
  const d = new Date(`${valore}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === valore;
}

function verifica() {
  const problemi = [];
  const segnala = (file, testo) => problemi.push(`${file}: ${testo}`);

  for (const nome of fs.readdirSync(CARTELLA).filter(f => f.endsWith('.json'))) {
    try {
      JSON.parse(fs.readFileSync(path.join(CARTELLA, nome), 'utf8'));
    } catch (errore) {
      segnala(nome, `non è un JSON valido (${errore.message}). Controlla virgole e virgolette.`);
    }
  }
  if (problemi.length) return problemi;

  const orari = leggi('orari');
  orari.messe.forEach((m, i) => {
    if (!GIORNI.includes(m.giorno)) segnala('orari.json', `Messa n. ${i + 1}: giorno "${m.giorno}" non riconosciuto (usa: ${GIORNI.join(', ')})`);
    if (!ORA.test(m.ora)) segnala('orari.json', `Messa n. ${i + 1}: ora "${m.ora}" da scrivere come 18:00`);
    if (!m.luogo) segnala('orari.json', `Messa n. ${i + 1}: manca il luogo`);
  });
  orari.variazioni.forEach((v, i) => {
    if (!dataValida(v.dal) || !dataValida(v.al)) segnala('orari.json', `variazione n. ${i + 1}: date da scrivere come 2026-10-31`);
    else if (v.al < v.dal) segnala('orari.json', `variazione n. ${i + 1}: la data "al" viene prima di "dal"`);
  });

  leggi('eventi').elenco.forEach((e, i) => {
    if (!dataValida(e.data)) segnala('eventi.json', `evento n. ${i + 1} ("${e.titolo}"): data "${e.data}" da scrivere come 2026-10-31`);
    if (!e.titolo) segnala('eventi.json', `evento n. ${i + 1}: manca il titolo`);
    if (!['parrocchia', 'oratorio'].includes(e.ambito)) segnala('eventi.json', `evento n. ${i + 1}: ambito deve essere "parrocchia" o "oratorio"`);
  });

  leggi('defunti').elenco.forEach((d, i) => {
    if (!d.nome) segnala('defunti.json', `voce n. ${i + 1}: manca il nome`);
    if (d.morte && !dataValida(d.morte)) segnala('defunti.json', `voce n. ${i + 1}: data "${d.morte}" da scrivere come 2026-10-31`);
  });

  const slug = new Set();
  leggi('chiese').elenco.forEach((c, i) => {
    if (!/^[a-z0-9-]+$/.test(c.slug || '')) segnala('chiese.json', `chiesa n. ${i + 1}: lo slug usa solo lettere minuscole, numeri e trattini`);
    if (slug.has(c.slug)) segnala('chiese.json', `slug "${c.slug}" ripetuto`);
    slug.add(c.slug);
  });

  const spazi = new Set();
  leggi('spazi').elenco.forEach((s, i) => {
    if (!s.id || spazi.has(s.id)) segnala('spazi.json', `spazio n. ${i + 1}: codice mancante o ripetuto`);
    spazi.add(s.id);
  });

  const bilancio = leggi('bilancio');
  [...bilancio.entrate, ...bilancio.uscite].forEach(v => {
    if (typeof v.importo !== 'number') segnala('bilancio.json', `"${v.voce}": l'importo va scritto come numero, senza euro né punti`);
  });
  bilancio.debiti.forEach(d => {
    if (d.restituito > d.totale) segnala('bilancio.json', `"${d.nome}": restituito supera il totale`);
  });

  return problemi;
}

module.exports = { verifica, dataValida };

if (require.main === module) {
  const problemi = verifica();
  if (problemi.length) {
    console.error('Ci sono da sistemare alcune cose:\n');
    problemi.forEach(p => console.error(`  - ${p}`));
    process.exit(1);
  }
  console.log('Dati a posto.');
}
