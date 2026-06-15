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
    this.datiConfig = ottieniDatiDaURL();
  }

  preload() {
    // Qui caricherai i tuoi asset (immagini, audio, ecc.)
    // Esempio: this.load.image('player', 'assets/player.png');
  }

  create() {
    // Mostriamo a schermo i dati recuperati dal QR

    // Titolo del personaggio
    this.add.text(40, 100, this.datiConfig.personaggio, {
      fontSize: '28px',
      fill: '#ffffff',
      fontFamily: 'Arial'
    });

    // La frase personalizzata
    const testoFrase = this.add.text(40, 180, this.datiConfig.frase, {
      fontSize: '18px',
      fill: '#aaaaaa',
      fontFamily: 'Arial',
      wordWrap: { width: 350 }
    });

    // Creiamo un quadrato colorato dinamicamente in base al colore passato nel QR
    const coloreHex = parseInt(this.datiConfig.colore.replace('#', '0x'));
    const rettangolo = this.add.rectangle(200, 400, 120, 120, coloreHex);

    // Giusto un pizzico di logica a 60fps: facciamo ruotare il quadrato
    this.quadratoCheGira = rettangolo;
  }

  update() {
    // Questo loop gira a 60 FPS stabili
    if (this.quadratoCheGira) {
      this.quadratoCheGira.rotation += 0.02;
    }
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