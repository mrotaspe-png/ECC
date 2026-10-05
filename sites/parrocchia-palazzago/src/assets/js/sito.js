// Piccole funzioni che rendono "viva" la pagina: messe di oggi, eventi passati
// nascosti, filtri del calendario, invio dei moduli. Il sito funziona anche senza.
(function () {
  'use strict';

  const GIORNI = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
  const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio',
    'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

  // "lunedì", "Lunedi", "LUNEDÌ" diventano tutti "lunedi"
  function normalizza(testo) {
    return String(testo || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  }

  function oggiIso() {
    const d = new Date();
    const due = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${due(d.getMonth() + 1)}-${due(d.getDate())}`;
  }

  function maiuscola(testo) {
    return testo.charAt(0).toUpperCase() + testo.slice(1);
  }

  // Menu su telefono
  function menu() {
    const bottone = document.querySelector('.apri-menu');
    const nav = document.getElementById('menu-principale');
    if (!bottone || !nav) return;
    bottone.addEventListener('click', () => {
      const aperto = nav.classList.toggle('aperto');
      bottone.setAttribute('aria-expanded', String(aperto));
    });
  }

  // Data di oggi in testa alla pagina
  function dataDiOggi() {
    const d = new Date();
    document.querySelectorAll('[data-oggi]').forEach(el => {
      el.textContent = `${maiuscola(GIORNI[d.getDay()])} ${d.getDate()} ${MESI[d.getMonth()]} ${d.getFullYear()}`;
    });
  }

  // Mostra solo le Messe di oggi. Se sono già finite tutte, mostra quelle di domani.
  function messeDiOggi() {
    const elenco = document.querySelector('[data-messe-oggi]');
    if (!elenco) return;
    const righe = Array.from(elenco.querySelectorAll('li'));
    const adesso = new Date();
    const minutiOra = adesso.getHours() * 60 + adesso.getMinutes();
    const minutiDi = riga => {
      const [h, m] = riga.querySelector('.ora').textContent.split(/[:.]/).map(Number);
      return h * 60 + (m || 0);
    };
    const delGiorno = indice => righe.filter(r => normalizza(r.dataset.giorno) === normalizza(GIORNI[indice]));

    let giorno = adesso.getDay();
    let daMostrare = delGiorno(giorno).filter(r => minutiDi(r) + 45 > minutiOra);
    let titolo = 'Messe di oggi';
    if (!daMostrare.length) {
      // Cerca il primo giorno successivo con almeno una Messa
      for (let i = 1; i <= 7 && !daMostrare.length; i++) {
        giorno = (adesso.getDay() + i) % 7;
        daMostrare = delGiorno(giorno);
      }
      titolo = giorno === (adesso.getDay() + 1) % 7 ? 'Messe di domani' : `Prossime Messe: ${GIORNI[giorno]}`;
    }
    righe.forEach(r => { r.hidden = !daMostrare.includes(r); });
    const intestazione = document.querySelector('[data-titolo-messe]');
    if (intestazione) intestazione.textContent = titolo;
  }

  // Avvisi di variazione orari: visibili solo nel periodo indicato
  function variazioni() {
    const oggi = oggiIso();
    document.querySelectorAll('[data-dal][data-al]').forEach(el => {
      el.hidden = oggi < el.dataset.dal || oggi > el.dataset.al;
    });
  }

  // Eventi: nasconde quelli passati, limita il numero e gestisce i filtri
  function eventi() {
    const oggi = oggiIso();
    document.querySelectorAll('[data-eventi]').forEach(elenco => {
      const massimo = Number(elenco.dataset.massimo) || Infinity;
      const futuri = Array.from(elenco.querySelectorAll('.evento')).filter(ev => {
        const valido = ev.dataset.data >= oggi;
        if (!valido) ev.remove();
        return valido;
      });
      const contenitore = elenco.closest('section, .testo') || document;
      const vuoto = contenitore.querySelector('[data-vuoto]');
      const filtri = contenitore.querySelector('[data-filtri]');

      function mostra(ambito) {
        let contati = 0;
        futuri.forEach(ev => {
          const adatto = ambito === 'tutti' || ev.dataset.ambito === ambito;
          ev.hidden = !adatto || contati >= massimo;
          if (adatto) contati++;
        });
        if (vuoto) vuoto.hidden = contati > 0;
      }

      if (filtri) {
        filtri.hidden = false;
        filtri.addEventListener('click', e => {
          const bottone = e.target.closest('button');
          if (!bottone) return;
          filtri.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === bottone)));
          mostra(bottone.dataset.ambito);
        });
      }
      mostra('tutti');
    });
  }

  // Moduli: inviati all'indirizzo indicato in data-endpoint (es. un webhook di Make.com).
  // Se l'indirizzo non è impostato, si apre una email già compilata.
  function moduli() {
    document.querySelectorAll('form[data-modulo]').forEach(form => {
      const esito = form.querySelector('.esito');
      const scrivi = (testo, tipo) => {
        if (!esito) return;
        esito.textContent = testo;
        esito.className = `esito ${tipo}`;
        esito.hidden = false;
      };

      form.addEventListener('submit', async e => {
        e.preventDefault();
        const dati = Object.fromEntries(new FormData(form).entries());
        if (dati.sito_web) return; // compilato solo dai programmi di spam
        delete dati.sito_web;
        if (dati.data && dati.data < oggiIso()) {
          scrivi('La data scelta è già passata.', 'errore');
          return;
        }
        if (dati.inizio && dati.fine && dati.fine <= dati.inizio) {
          scrivi("L'ora di fine deve essere dopo l'ora di inizio.", 'errore');
          return;
        }
        dati.modulo = form.dataset.modulo;
        dati.inviatoIl = new Date().toISOString();

        const endpoint = form.dataset.endpoint;
        if (!endpoint) {
          const corpo = Object.entries(dati).map(([k, v]) => `${k}: ${v}`).join('\n');
          window.location.href = `mailto:${form.dataset.email}?subject=${encodeURIComponent(`Richiesta: ${form.dataset.modulo}`)}&body=${encodeURIComponent(corpo)}`;
          scrivi('Si è aperto il programma di posta con la richiesta già compilata: basta inviarla.', 'ok');
          return;
        }

        const bottone = form.querySelector('button[type="submit"]');
        bottone.disabled = true;
        try {
          const risposta = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dati)
          });
          if (!risposta.ok) throw new Error(String(risposta.status));
          form.reset();
          scrivi(form.dataset.grazie || 'Richiesta inviata. Ti risponderemo al più presto.', 'ok');
        } catch (_errore) {
          scrivi(`Non è stato possibile inviare la richiesta. Riprova o scrivi a ${form.dataset.email}.`, 'errore');
        } finally {
          bottone.disabled = false;
        }
      });
    });
  }

  menu();
  dataDiOggi();
  messeDiOggi();
  variazioni();
  eventi();
  moduli();
}());
