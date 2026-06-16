import Phaser from 'phaser';
import LZString from 'lz-string';

function ottieniDatiDaURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const dataRaw = urlParams.get('data');

  // Dati di fallback per i test in locale
  const datiDefault = {
    personaggio: "Pagina non trovata",
    colore: "#ff0000",
    frase: "Ti sei perso?"
  };

  if (!dataRaw) return datiDefault;

  try {
    const stringaDecodificata = LZString.decompressFromEncodedURIComponent(dataRaw);
    if (!stringaDecodificata) {
      console.error("Errore", e);
      return datiDefault;
    }

    return JSON.parse(stringaDecodificata);
  } catch (e) {
    console.error("Errore", e);
    return datiDefault;
  }
}

class GiocoQR extends Phaser.Scene {
  constructor() {
    super({ key: 'GiocoQR' });
  }

  init() {
    // Recuperiamo i dati dall'URL (personaggio, colore, frase)
    this.datiConfig = ottieniDatiDaURL();
  }

  preload() {
    // Non servono asset esterni, creiamo tutto via codice per massima leggerezza!
  }

  async create() {
    await this.introStellare();
  }

  async introStellare() {
    // --- 1. CREAZIONE DELLO STARFIELD (QUADRATINI BIANCHI) ---
    this.stelle = [];
    const numeroStelle = 40; // Quanti quadratini vuoi a schermo

    for (let i = 0; i < numeroStelle; i++) {
      // Posizione X casuale, Y casuale su tutto lo schermo
      const x = Phaser.Math.Between(0, this.sys.game.config.width);
      const y = Phaser.Math.Between(0, this.sys.game.config.height);

      // Dimensione casuale del quadratino (da 2x2 a 5x5 pixel)
      const dimensione = Phaser.Math.Between(2, 5);

      // Creiamo il quadratino bianco
      const stella = this.add.rectangle(x, y, dimensione, dimensione, parseInt(this.datiConfig.colore.replace('#', ''), 16));

      // Opacità casuale per dare profondità
      stella.setAlpha(Phaser.Math.FloatBetween(0.3, 1));

      // Salviamo la stella con una velocità casuale associata (più è grande, più va veloce)
      this.stelle.push({
        oggetto: stella,
        velocita: Phaser.Math.FloatBetween(0.5, 3) // Velocità di scorrimento in alto
      });

      // --- 2. SETUP DEL LAYOUT ---
      this.titolo = this.add.text(100, 150, '', {
        fontSize: '48px',
        fill: this.datiConfig.colore,
        fontFamily: 'Courier New',
        wordWrap: { width: 320 },
        lineSpacing: 10
      });

      this.testoAnimato = this.add.text(40, 200, '', {
        fontSize: '22px',
        fill: '#ffffff',
        // fill: this.datiConfig.colore,
        fontFamily: 'Courier New', // Font stile terminale/retro
        wordWrap: { width: 320 },
        lineSpacing: 10
      });
    }

    console.log(this.datiConfig);

    await this.mostraScrittaAnimata(this.testoAnimato, "Grazie per aver accettato la scommessa.\n\nPremetto che questo 'gioco' non salverà nessun dato, e appena chiuderai, tutto andrà perso.          ");

    await this.mostraPulsanteProsegui("Ho capito! Iniziamo!");

    await this.mostraScrittaAnimata(this.testoAnimato, "Ora, una piccola domanda!");

    await this.mostraPulsanteProsegui("Continua");

    await this.mostraScrittaAnimata(this.testoAnimato, "In questo momento, a che gioco giocheresti più volentieri?");

    let scelta = await this.mostraScelteAwait(["Rompicapo", "Platformer", "Nessuno, non gioco!"]);
    if (scelta === 2) {
      await this.mostraScrittaAnimata(this.testoAnimato, `Sei sicura? Non ti nego che ho letteralmente programmato dei giochini veloci per questa occasione!`);
      scelta = await this.mostraScelteAwait(["Rompicapo", "Platformer", "Sono sicura, no!"]);
      if (scelta === 2) {
        await this.mostraScrittaAnimata(this.testoAnimato, `Ok, ok, non ti forzo! Allora andiamo subito al dunque, ${this.datiConfig.personaggio}!`);
        await this.mostraPulsanteProsegui();
        await this.mostraScrittaAnimata(this.testoAnimato, `Ho fatto tutto ciò per strapparti un sorriso, e dirti che ${this.datiConfig.frase}`);
        await this.mostraPulsanteProsegui();
        await this.mostraScrittaAnimata(this.testoAnimato, `Guarda, avevo pure disegnato il tuo personaggio!`);
        // ToDo: Spawna personaggio custom
        await this.mostraPulsanteProsegui();
        // ToDo: Nascondi personaggio
        await this.mostraScrittaAnimata(this.testoAnimato, `Prima di salutarci, ti mostro al volo una cartolina ricordo che puoi salvare sul tuo telefono!`);
        // ToDo: Spawna cartolina con frase e personaggio

        let sceltaCartolina = 0;
        while (sceltaCartolina === 0) {
          sceltaCartolina = await this.mostraScelteAwait(["Scarica immagine", "Continua"]);
          if(sceltaCartolina === 0) {
            // ToDo: Genera immagine da scaricare (con html2canvas o simili) e triggera download
          }
        }

        await this.mostraScrittaAnimata(this.testoAnimato, `Spero di averti lasciato un ricordo unico e differente dal solito! E si, l'ho fatto anche per lasciarti il mio numero ;)`);
        await this.mostraScelteAwait(["Sei stato interessante!", "Ok, te lo concedo.", "Nah, pessimo!"]);
        await this.mostraScrittaAnimata(this.testoAnimato, `Non ho account social 'personali' al momento, ma se vuoi contattarmi, scrivimi pure su whatsapp! Ti mostro il mio contatto tra un secondo!`);
        await this.mostraScelteAwait(["Perfetto, lo farò!", "Ci penserò su!", "No, grazie!"]);
        return; // Finiamo qui se non vuole giocare
      }
    }

    switch (scelta) {
      case 0:
        await this.mostraScrittaAnimata(this.testoAnimato, `Ottimo! Allora, ${this.datiConfig.personaggio}, spero che il mio gioco sia all'altezza delle tue aspettative!`);
        break;
      case 1:
        await this.mostraScrittaAnimata(this.testoAnimato, `Una fan dei platformer! Preparati, ${this.datiConfig.personaggio}, è il momento di saltare!`);
        break;
      case 2:

        break;
    }

    await this.mostraPulsanteProsegui();

    await this.mostraScrittaAnimata(this.testoAnimato, this.datiConfig.frase);
    // await this.mostraScrittaAnimata(this.titolo, this.datiConfig.personaggio);

  }

  mostraScrittaAnimata(testoObj, testoCompleto, highlightColor = null, highlightIndices = []) {
    return new Promise((resolve) => {
      // Reset del testo corrente
      testoObj.setText('');

      // Controllo di sicurezza se la stringa è vuota
      if (!testoCompleto || testoCompleto.length === 0) {
        resolve();
        return;
      }

      let indiceCarattere = 0;

      // Creiamo un timer loop di Phaser che si ripete per ogni carattere
      this.time.addEvent({
        delay: 50,
        callback: () => {
          // Aggiunge il carattere corrente al testo a schermo
          testoObj.text += testoCompleto[indiceCarattere];
          indiceCarattere++;

          // Quando ha finito di scrivere tutto il testo, risolve la Promise
          if (indiceCarattere >= testoCompleto.length) {
            resolve();
          }
        },
        repeat: testoCompleto.length - 1
      });
    });
  }

  mostraPulsanteProsegui(testo = 'PROSEGUI') {
    return new Promise((resolve) => {
      // Calcoliamo il centro dello schermo per posizionare il pulsante
      const xCentro = this.sys.game.config.width / 2;
      const yPos = 550; // Posizionato in basso rispetto al testo animato

      // 1. Creiamo l'oggetto di testo che fa da pulsante
      const pulsante = this.add.text(xCentro, yPos, `[ ${testo} ]`, {
        fontSize: '24px',
        fill: this.datiConfig.colore, // Usa il colore del QR
        fontStyle: 'bold',
        fontFamily: 'Courier New',
        backgroundColor: '#000000',
        padding: { x: 15, y: 10 }
      });

      // Centriamo il perno per farlo essere perfettamente in mezzo
      pulsante.setOrigin(0.5);

      // 2. Rendiamo il pulsante cliccabile/tappabile sullo schermo dello smartphone
      pulsante.setInteractive({ useHandCursor: true });

      // Effetto visivo al volo: diventa leggermente più luminoso quando ci passi sopra (su PC)
      pulsante.on('pointerover', () => pulsante.setAlpha(0.8));
      pulsante.on('pointerout', () => pulsante.setAlpha(1));

      // 3. IL LOCK REALE: L'evento di click/tap
      pulsante.once('pointerdown', () => {
        // Usiamo .once anziché .on così l'evento si attiva una sola volta (evita doppi click molesti)

        // Distruggiamo il pulsante per farlo sparire dallo schermo
        pulsante.destroy();

        // RISOLVIAMO LA PROMISE: Questo sblocca l'await nel tuo flusso lineare!
        resolve();
      });
    });
  }

  mostraScelteAwait(opzioniArray) {
    return new Promise((resolve) => {
      const xCentro = this.sys.game.config.width / 2;
      // Punto di partenza verticale per il primo pulsante
      let yPos = 450;
      // Spazio in pixel tra un pulsante e l'altro
      const spaziatura = 60;

      // Array temporaneo per tenere traccia di tutti i pulsanti creati, per poterli eliminare insieme
      const pulsantiCreati = [];

      // Cicliamo l'array di stringhe che ci hai passato
      opzioniArray.forEach((testoOpzione, indice) => {

        // 1. Creiamo il pulsante di testo per questa opzione
        const pulsante = this.add.text(xCentro, yPos, `[ ${testoOpzione} ]`, {
          fontSize: '20px',
          fill: this.datiConfig.colore, // Usa il colore del QR
          fontStyle: 'bold',
          fontFamily: 'Courier New',
          backgroundColor: '#000000',
          padding: { x: 12, y: 8 },
          align: 'center'
        });

        pulsante.setOrigin(0.5);
        pulsante.setInteractive({ useHandCursor: true });

        // Effetti visivi al passaggio del mouse/tocco
        pulsante.on('pointerover', () => pulsante.setAlpha(0.7));
        pulsante.on('pointerout', () => pulsante.setAlpha(1));

        // 2. Gestiamo il click singolo (.once)
        pulsante.once('pointerdown', () => {

          // Pulizia totale: distruggiamo TUTTI i pulsanti di questa scelta multipla
          pulsantiCreati.forEach(p => p.destroy());

          // RISOLVIAMO LA PROMISE: ritorniamo l'indice del pulsante cliccato!
          resolve(indice);
        });

        // Salva il pulsante nella lista e aumenta la Y per il prossimo elemento
        pulsantiCreati.push(pulsante);
        yPos += spaziatura;
      });
    });
  }

  update() {
    // --- 4. ANIMAZIONE DELLE STELLE (LOOP A 60 FPS) ---
    const altezzaSchermo = this.sys.game.config.height;

    this.stelle.forEach(stella => {
      // Muoviamo il quadratino verso L'ALTO (sottraendo la velocità alla Y)
      stella.oggetto.y -= stella.velocita;

      // Se la stella esce dal bordo superiore dello schermo...
      if (stella.oggetto.y < -10) {
        // ...la rimettiamo in fondo allo schermo con una nuova X casuale
        stella.oggetto.y = altezzaSchermo + 10;
        stella.oggetto.x = Phaser.Math.Between(0, this.sys.game.config.width);
      }
    });
  }
}

// --- 3. CONFIGURAZIONE DEL MOTORE DI GIOCO ---
const config = {
  type: Phaser.AUTO, // Usa WebGL se disponibile, altrimenti Canvas (super leggero)
  parent: 'game-container',
  width: 400,
  height: 700,
  scale: {
    mode: Phaser.Scale.FIT, // Si adatta allo schermo del telefono
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [GiocoQR],
  fps: {
    target: 60,
    forceSetTimeOut: true // Aiuta la stabilità sui browser mobile vecchi
  }
};

const game = new Phaser.Game(config);