import Phaser from 'phaser';
import LZString from 'lz-string';

function ottieniDatiDaURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const dataRaw = urlParams.get('data');

  // Dati di fallback aggiornati con isInglese
  const datiDefault = {
    personaggio: "Pagina non trovata",
    colore: "#ff0000",
    frase: "-",
    isInglese: false // Impostato a false di default per i test locali
  };

  if (!dataRaw) return datiDefault;

  try {
    const stringaDecodificata = LZString.decompressFromEncodedURIComponent(dataRaw);
    if (!stringaDecodificata) {
      console.error("Errore: Stringa decodificata vuota o non valida con LZ-String");
      return datiDefault;
    }

    // Ritorna l'oggetto JSON completo che ora include personaggio, colore, frase e isInglese
    return JSON.parse(stringaDecodificata);
  } catch (e) {
    console.error("Errore nel parsing dei dati URL", e);
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
    if (this.datiConfig.frase === "-") {
      // 1. Controlliamo se la texture è già stata caricata (per evitare duplicati se il codice si ripete)
      if (!this.textures.exists('fotoEzio')) {
        // Carichiamo l'immagine al volo usando il loader asincrono di Phaser
        this.load.image('fotoEzio', 'ezio.jpg');
        this.load.audio('musicaEzio', 'estate.mp3');

        // Creiamo una Promise per aspettare che Phaser finisca di scaricare il file
        await new Promise((resolve) => {
          this.load.once('complete', resolve);
          this.load.start(); // Avvia il caricamento forzato
        });
      }

      // RIPRODUZIONE AUDIO
      // Se la musica non sta già suonando, la creiamo e la avviamo
      if (!this.sound.get('musicaEzio')) {
        const musica = this.sound.add('musicaEzio', {
          loop: true,   // Ricomincia da capo quando finisce
          volume: 0.4   // Volume da 0.0 a 1.0 (0.4 è ottimo come sottofondo)
        });

        musica.play();

        // Salva-vita per i browser rigidi: se l'autoplay fallisce, parte al primo tocco dello schermo
        this.input.once('pointerdown', async () => {
          if (this.sound.context && this.sound.context.state === 'suspended') {
            await this.sound.context.resume();
          }
          if (!musica.isPlaying) {
            musica.play();
          }
        });
      }

      // 2. Ora che siamo sicuri che l'immagine è in memoria, la mostriamo al centro dello schermo
      const immagine = this.add.image(this.sys.game.config.width / 2, this.sys.game.config.height / 2, 'fotoEzio');
      immagine.setOrigin(0.5, 0.5);
      immagine.setScale(0.4); // Regola la scala come desideri

      // 1. La nostra pool di parole casuali
      const poolParole = [
        "L'estate sta finendo e un anno se ne va",
        "Sto diventando grande lo sai che non mi va",
        "In spiaggia di ombrelloni non ce ne sono più",
        "È il solito rituale ma ora manchi tu",
        "La-languidi bri-brividi",
        "Come il ghiaccio bruciano quando sto con te",
        "Ba-ba-baciami siamo due satelliti in orbita sul mar",
        "È tempo che i gabbiani arrivino in città",
        "L'estate sta finendo lo sai che non mi va",
        "Io sono ancora solo non e una novità",
        "Tu hai già chi ti consola a me chi penserà",
        "Una fotografia è tutto quel che ho",
        "Ma stanne pur sicura io non ti scorderò"
      ];

      // 2. Funzione interna per generare una singola parola fluttuante
      const generaParolaFluttuante = () => {
        // Se la scena si sta chiudendo o non esiste più, ferma il loop
        if (!this.sys.isActive()) return;

        const larghezzaSchermo = this.sys.game.config.width;
        const altezzaSchermo = this.sys.game.config.height;

        // Scegliamo una parola a caso dalla pool
        const parolaCasuale = Phaser.Utils.Array.GetRandom(poolParole);

        // Parametri randomici: altezza, dimensione font e velocità
        const yCasuale = Phaser.Math.Between(50, altezzaSchermo - 100);
        const dimensioneFont = Phaser.Math.Between(16, 42) + 'px';
        const durataMovimento = Phaser.Math.Between(12000, 20000); // Tra i 12 e i 20 secondi

        // Scegliamo la direzione (50% di possibilità destra->sinistra o viceversa)
        const daSinistraADestra = Phaser.Math.RND.pick([true, false]);

        let xIniziale, xFinale;
        if (daSinistraADestra) {
          xIniziale = -600; // Parte fuori dallo schermo a sinistra
          xFinale = larghezzaSchermo + 600; // Arriva fuori a destra
        } else {
          xIniziale = larghezzaSchermo + 600; // Parte fuori a destra
          xFinale = -600; // Arriva fuori a sinistra
        }

        // Creiamo l'oggetto di testo in Phaser
        const testoFluttuante = this.add.text(xIniziale, yCasuale, parolaCasuale, {
          fontSize: dimensioneFont,
          fontFamily: 'Courier New',
          fill: '#ffffff', // Usa il colore del QR per coerenza grafica
          fontStyle: 'bold'
        });
        testoFluttuante.setOrigin(0.5);
        // Un pizzico di opacità casuale per dare profondità
        testoFluttuante.setAlpha(Phaser.Math.FloatBetween(0.6, 1));

        // Muoviamo la parola usando i Tween di Phaser
        this.tweens.add({
          targets: testoFluttuante,
          x: xFinale,
          duration: durataMovimento,
          ease: 'Linear',
          onComplete: () => {
            testoFluttuante.destroy(); // Distruggiamo il testo quando esce per non intasare la memoria
          }
        });
      };

      // 3. Avviamo un timer ciclico che genera una nuova parola ogni Tot millisecondi
      this.time.addEvent({
        delay: 1500, // Genera una parola ogni 1500ms (abbassa per averne di più, alza per meno)
        callback: generaParolaFluttuante,
        loop: true
      });

      return;
    }

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

    await this.mostraScrittaAnimata(this.testoAnimato,
      this.datiConfig.isInglese,
      "Thank you for giving me a chance.\n\nI'm gonna be honest with you: I didn't have time to make what I wanted to make, but I wouldn't have slept if I didn't show this to you.",
      "Grazie per avermi dato una possibilità.\n\nSarò sincero con te: non ho avuto tempo di fare ciò che volevo fare, ma tu vali qualsiasi tentativo.");

    await this.mostraPulsanteProsegui(this.datiConfig.isInglese ? "I understand! Let's start!" : "Ho capito! Iniziamo!");

    await this.mostraScrittaAnimata(this.testoAnimato,
      this.datiConfig.isInglese,
      "At this point, I should have asked you some questions, but since we're running late, I'll skip everything and get straight to the point: as soon as I saw you, I thought you were an interesting person, and I'd like to get to know you better.",
      "In questo momento, avrei dovuto porti alcune domande, ma dato che siamo in ritardo, salto tutto e vado dritto al punto: appena ti ho vista ho pensato che tu fossi una persona interessante, e mi piacerebbe conoscerti meglio.");

    await this.mostraPulsanteProsegui(this.datiConfig.isInglese ? "Continue" : "Continua");

    await this.mostraScrittaAnimata(this.testoAnimato, true, this.datiConfig.frase, this.datiConfig.frase);

    const ingChoices = ["Aw, that's cute", "Hmm, you could have done better", "Ew, that's cringe"];
    const itChoices = ["Aw, che carino", "Mmm, potevi impegnarti di più", "Ew, che cringe"];
    let scelta = await this.mostraScelteAwait(this.datiConfig.isInglese ? ingChoices : itChoices);

    switch (scelta) {
      case 0:
        await this.mostraScrittaAnimata(this.testoAnimato,
          this.datiConfig.isInglese,
          `I'm glad you like it! I hope I can surprise you again, ${this.datiConfig.personaggio}!`,
          `Sono contento che ti piaccia! Spero di riuscire a sorprenderti ancora, ${this.datiConfig.personaggio}!`);

        await this.mostraPulsanteProsegui(this.datiConfig.isInglese ? "Oh, that's my name!" : "Oh, è il mio nome!");

        await this.mostraScrittaAnimata(this.testoAnimato,
          this.datiConfig.isInglese,
          `Yeah, and I hope I'll hear about you again ;)`,
          `Già, e spero che ne sentirò ancora parlare ;)`);

        await this.mostraPulsanteProsegui(this.datiConfig.isInglese ? "Continue" : "Continua");

        break;
      case 1:
        await this.mostraScrittaAnimata(this.testoAnimato,
          this.datiConfig.isInglese,
          `I'm glad you like it! I hope I can surprise you again, ${this.datiConfig.personaggio}!`,
          `Se mi dai una settimana, giuro che farò addirittura dei videogiochi su di te, ${this.datiConfig.personaggio}!`);

        await this.mostraPulsanteProsegui(this.datiConfig.isInglese ? "Continue" : "Continua");

        await this.mostraScrittaAnimata(this.testoAnimato,
          this.datiConfig.isInglese,
          `I'm totally serious about that, I just need some time to prepare something worthy of you!`,
          `Sono totalmente serio, ho solo bisogno di un po' di tempo per preparare qualcosa degno di te!`);

        await this.mostraPulsanteProsegui(this.datiConfig.isInglese ? "Continue" : "Continua");

        break;
      case 2:
        await this.mostraScrittaAnimata(this.testoAnimato,
          this.datiConfig.isInglese,
          `Oh, I see, ${this.datiConfig.personaggio}, I'm sure a lot of guys have used this method before!`,
          `Ah si immagino, ${this.datiConfig.personaggio}, di sicuro un sacco di ragazzi hanno usato questo metodo!`);

        await this.mostraPulsanteProsegui(this.datiConfig.isInglese ? "Continue" : "Continua");

        await this.mostraScrittaAnimata(this.testoAnimato,
          this.datiConfig.isInglese,
          `Well, actually no!\n\nBecause I made it myself from scratch in less than 2 hours, so don't be so harsh!`,
          `E invece no!\n\nPerchè l'ho fatto io da zero in meno di 2 ore, quindi non essere così cattiva!`);

        await this.mostraPulsanteProsegui(this.datiConfig.isInglese ? "Continue" : "Continua");

        await this.mostraScrittaAnimata(this.testoAnimato,
          this.datiConfig.isInglese,
          `I guarantee I'll be able to surprise you, if you give me the chance!`,
          `Ti garantisco che riuscirò a stupirti, se me ne darai l'occasione!`);

        await this.mostraPulsanteProsegui(this.datiConfig.isInglese ? "Continue" : "Continua");
        break;
    }

    await this.mostraScrittaAnimata(this.testoAnimato,
      this.datiConfig.isInglese,
      "Well, I'm out of ideas and time, so I'll leave you my WhatsApp contact, and whenever you want we can keep chatting there! :)\n\nOr in person now, of course!",
      "Ora, dato che non so cos'altro dire e non ho più tempo, ti lascio il mio contatto WhatsApp, e quanto vorrai possiamo continuare a chiacchierare lì! :)\n\nOppure adesso di persona, ovviamente!");

    await this.mostraPulsanteWhatsapp(this.datiConfig.isInglese ? "[ Message me ;) ]" : "[ Scrivimi ;) ]");

    await this.mostraScrittaAnimata(this.testoAnimato, this.datiConfig.frase);
  }

  mostraScrittaAnimata(testoObj, isEnglish, testoCompleto, testoItaliano, highlightColor = null, highlightIndices = []) {

    return new Promise((resolve) => {
      // Reset del testo corrente
      testoObj.setText('');

      // Controllo di sicurezza se la stringa è vuota
      if (isEnglish ? !testoCompleto || testoCompleto.length === 0 : !testoItaliano || testoItaliano.length === 0) {
        resolve();
        return;
      }

      let indiceCarattere = 0;

      // Creiamo un timer loop di Phaser che si ripete per ogni carattere
      this.time.addEvent({
        delay: 2,
        callback: () => {
          // Aggiunge il carattere corrente al testo a schermo
          testoObj.text += isEnglish ? testoCompleto[indiceCarattere] : testoItaliano[indiceCarattere];
          indiceCarattere++;

          // Quando ha finito di scrivere tutto il testo, risolve la Promise
          if (indiceCarattere >= (isEnglish ? testoCompleto.length : testoItaliano.length)) {
            resolve();
          }
        },
        repeat: (isEnglish ? testoCompleto.length : testoItaliano.length) - 1
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

  mostraPulsanteWhatsapp(testo = 'Scrivimi ;)') {
    return new Promise((resolve) => {
      const numeroWa = "393936554477";

      // Testo precompilato opzionale da inviare (lascia stringa vuota "" se non vuoi testo)
      const messaggioPrecompilato = `Ciao! Sono ${this.datiConfig.personaggio}.`;

      // Calcoliamo il centro dello schermo per posizionare il pulsante
      const xCentro = this.sys.game.config.width / 2;
      const yPos = 550;

      // Testo dinamico in base alla lingua del QR
      const testoPulsante = testo;

      // 1. Creiamo l'oggetto di testo che fa da pulsante (Identico al tuo)
      const pulsante = this.add.text(xCentro, yPos, testoPulsante, {
        fontSize: '20px', // Leggermente più piccolo per far stare scritte lunghe in inglese su schermi stretti
        fill: '#25D366',  // Il classico verde di WhatsApp per distinguerlo!
        fontStyle: 'bold',
        fontFamily: 'Courier New',
        backgroundColor: '#000000',
        padding: { x: 15, y: 10 }
      });

      // Centriamo il perno per farlo essere perfettamente in mezzo
      pulsante.setOrigin(0.5);

      // 2. Rendiamo il pulsante cliccabile/tappabile sullo schermo dello smartphone
      pulsante.setInteractive({ useHandCursor: true });

      // Effetto visivo al passaggio
      pulsante.on('pointerover', () => pulsante.setAlpha(0.8));
      pulsante.on('pointerout', () => pulsante.setAlpha(1));

      // 3. L'evento di click/tap unico
      pulsante.once('pointerdown', () => {

        // Prepariamo l'URL con il testo codificato per i browser mobile
        const testoCodificato = encodeURIComponent(messaggioPrecompilato);
        let urlFinale = `https://wa.me/${numeroWa}`;

        if (messaggioPrecompilato) {
          urlFinale += `?text=${testoCodificato}`;
        }

        // Apre direttamente l'applicazione di WhatsApp o WhatsApp Web
        window.open(urlFinale, '_blank');
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
    if (this.datiConfig.frase === "-") {

      return;
    }

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