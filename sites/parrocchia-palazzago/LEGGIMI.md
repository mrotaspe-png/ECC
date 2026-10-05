# Sito della Parrocchia e dell'Oratorio di Palazzago

Un sito statico: veloce, senza database e senza aggiornamenti di sicurezza da rincorrere.
Ogni contenuto sta in un file di testo. Quando un file cambia, il sito si ricostruisce da solo.

## Come si modifica

Ci sono tre modi, dal più semplice al più tecnico.

1. **Pannello di modifica** all'indirizzo `/admin/` del sito. Si entra con email e password,
   si cambia un orario o si aggiunge un avviso, si preme "Pubblica". Dopo un minuto è online.
   È pensato per la segreteria, gli educatori e l'équipe social.
2. **Direttamente su GitHub**: si apre il file, si clicca la matita, si salva.
3. **Sul proprio computer** (vedi "Per chi sviluppa" più sotto).

## Dove sta cosa

| Voglio cambiare… | File | Nel pannello |
| --- | --- | --- |
| Orari delle Messe, confessioni, variazioni | `src/_data/orari.json` | Orari, calendario e avvisi rapidi |
| Appuntamenti del calendario | `src/_data/eventi.json` | Orari, calendario e avvisi rapidi |
| Avvisi della settimana (LetteRina) | un file per settimana in `src/avvisi/` | Avvisi (LetteRina) |
| In Paradiso con il Signore | `src/_data/defunti.json` | Orari, calendario e avvisi rapidi |
| Letture e canti della domenica | `src/_data/liturgia.json` | Orari, calendario e avvisi rapidi |
| CRE: aggiornamenti, menu, canzoni | `src/_data/cre.json` | Oratorio |
| Articoli dello Spazio Giovani | un file per articolo in `src/oratorio/giovani/` | Spazio Giovani |
| Come posso aiutare? | `src/_data/necessita.json` | Comunità e servizi |
| Bilancio aperto | `src/_data/bilancio.json` | Comunità e servizi |
| Contatti, gruppi, sale prenotabili, moduli | `src/_data/*.json` | Comunità e servizi |
| Chiese, parroci, archivio della Lettera | `src/_data/*.json` | Chiese e storia |
| Telefono, email, canali, calendari, webhook | `src/_data/sito.json` | Impostazioni |
| Voci del menu | `src/_data/menu.json` | (solo da file) |
| Testi delle pagine (sacramenti, Caritas…) | i file `.md` e `.njk` in `src/` | (solo da file) |
| Colori e caratteri | in cima a `src/assets/css/stile.css` | (solo da file) |

Regole per chi scrive a mano nei file `.json`:

- le date si scrivono `2026-10-31` (anno-mese-giorno);
- gli orari si scrivono `18:00`;
- i giorni si scrivono per esteso e minuscoli: `domenica`, `lunedì`…;
- dopo ogni voce va una virgola, tranne dopo l'ultima.

Se si sbaglia, `npm run verifica` dice cosa e dove. La pubblicazione si ferma finché l'errore non è corretto,
quindi il sito online non si rompe.

## Cose che il sito fa da solo

- **Messe di oggi**: la pagina iniziale mostra solo le Messe del giorno. Quando sono finite, passa a quelle di domani.
- **Variazioni degli orari**: compaiono in evidenza solo tra le date "dal" e "al".
- **Appuntamenti passati**: spariscono da soli dalla pagina iniziale e dal calendario.
- **Data di oggi** in testa alla pagina.

## Da fare prima di andare online

1. Sostituire i dati di esempio: orari, eventi, numeri di telefono, bilancio, nomi.
2. In `src/_data/sito.json` mettere `"datiDiEsempio": false`. Sparisce la striscia gialla in alto.
3. Scrivere l'informativa privacy (`src/privacy.md`) seguendo il Decreto CEI sulla privacy.
4. Completare i testi segnati "da completare".
5. Collegare i servizi esterni (vedi sotto).

## Collegamenti esterni

Tutti si impostano in `src/_data/sito.json` (o dal pannello, scheda Impostazioni).

### Google Calendar

In `calendari.comunita` va l'ID del calendario pubblico della comunità, che si trova in
Google Calendar › Impostazioni del calendario › Integra calendario. Il calendario compare nella pagina Calendario.
In `calendari.prenotazioni` va l'ID del calendario delle sale.

### Moduli (prenotazioni e certificati) con Make.com

Finché `moduli.endpoint` è vuoto, i moduli aprono un'email già compilata verso `moduli.emailRiserva`.
Per automatizzare:

1. Su Make.com si crea uno scenario che parte da un **Custom webhook** e si copia l'indirizzo in `moduli.endpoint`.
2. Il modulo invia questi campi: `modulo`, `spazio`, `data`, `inizio`, `fine`, `motivo`, `persone`,
   `nome`, `telefono`, `email`, `note` (prenotazioni), oppure `tipo`, `intestatario`, `nascita`, `uso` (certificati).
3. Per le prenotazioni, lo scenario consigliato è:
   - Google Calendar: controlla che lo spazio sia libero in quella fascia;
   - se è libero, crea l'evento "DA CONFERMARE · nome spazio" nel calendario prenotazioni;
   - manda un'email alla segreteria con i dati;
   - quando la segreteria conferma, aggiorna il titolo dell'evento e manda la conferma a chi ha prenotato.
4. Fare una richiesta di prova dal sito e controllare che arrivi nello scenario.

### Defunti, liturgia e canti

Anche queste automazioni possono aggiornare il sito: uno scenario Make.com (o Airtable)
scrive il file JSON nel repository attraverso il modulo GitHub "Create or update a file", e il sito si ricostruisce.
Per i defunti è bene che lo scenario preveda un'approvazione da parte di una persona prima della pubblicazione.

### Newsletter, canali, foto

- `social.newsletter`: link al modulo di iscrizione di Brevo.
- `social.whatsapp`, `social.telegram`, `social.telegramRagazzi`, `social.instagram`: link ai canali.
- `mediateca`: indirizzo della galleria Piwigo.

## Pubblicazione su Netlify

1. Su Netlify: "Add new site" › "Import from Git" › si sceglie questo repository.
2. **Base directory**: `sites/parrocchia-palazzago`. Il resto lo legge da `netlify.toml`.
3. Per il pannello: Site configuration › Identity › Enable, poi Services › Git Gateway › Enable.
   In "Registration" scegliere "Invite only" e invitare per email chi deve modificare il sito.
4. Collegare il dominio (per esempio `oratoriopalazzago.it`) da Domain management.

## Per chi sviluppa

Serve Node.js 18 o più recente.

```bash
npm install
npm start          # sito in prova su http://localhost:8080, si aggiorna a ogni modifica
npm run build      # controlla i dati e prepara il sito in _site/
npm test           # test del controllo dati
```

Il sito è fatto con [Eleventy](https://www.11ty.dev/). I modelli delle pagine sono in `src/_includes/`.
I caratteri (Spectral e Atkinson Hyperlegible, licenza OFL) sono serviti dal sito stesso: non si caricano da Google.
