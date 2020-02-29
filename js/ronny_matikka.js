/* Web-projekti kevät 2019, OAMK

 SPACE MATH -matikkapeli

 Tekijä: Ronny Friman

 Projektiryhmä: 4F */

// extrapisteitä varten ajastin
var timerVal = setInterval(timer, 900); // 900ms
var time = 5; // asetetaan ajaksi 5

// aika vähenee 900ms välein
function timer() {
  if (time > 0) {
    time--;
  }
  else {
    time = 0;
  }
}

// funktio satunnaislukujen arvonnalle
function numgen(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

var cvs = document.getElementById("canvas"); // canvas -elementti, jolle piirretään
var sis = cvs.getContext("2d"); // sisältö, renderöinti canvakselle, 2D
window.onload = cvs.scrollIntoView(); // automaattinen kohdistaminen/scrollaaminen canvakseen

// kuvat
var bgstart = new Image();
var bg = new Image();
var ship = new Image();
var life = new Image();

// äänet
var oikeavastaus = new Audio('audio/oikein1.mp3');
var vaaravastaus = new Audio('audio/vaarin.mp3');
var gameover = new Audio('audio/gameover.mp3');
var positive = new Audio('audio/positive.mp3');

// kuvien lähteet
bgstart.src = "img/bgstart.png";
bg.src = "img/bg3.png";           // koko - leveys 750 x 700
ship.src = "img/ship1.png";       // koko - leveys 150 x 113
life.src = "img/life1.png";       // koko - leveys 50 x 50

var sX = 10; // s = ship, X = x-akseli, sX = aluksen x-koordinaatti (pikseli, lähtöarvo)
var sY = cvs.height - 113; // sY = aluksen y-koordinaatti (canvaksen korkeus miinus shipin korkeus = 0, lähtöarvo, ship.height ei jostain syystä toimi)
var n1Y = 70; // n1 = putoava numero 1, n1Y = numeron y-koordinaatti (lähtöarvo)
var n2Y = 70; // n2 = putoava numero 2, n2Y = numeron y-koordinaatti (lähtöarvo)
var tulosY = 70; // tulos, y-koordinaatti (lähtöarvo)
var nopeus = 1; // nopeus, joka lisätään jokaisella animoinnin kierroksella y-koordinaatteihin, saa aikaan numeroiden "putoamisen" - 1px / kierros
var fnum1 = numgen(0, 5); // kiinteä numero 1 (laskutehtävä)
var fnum2 = numgen(0, 5); // kiinteä numero 2 (laskutehtävä)
var num0MarginL = 60; // canvaksen ensimmäinen osa, vasen reuna
var num0MarginR = 173; // canvaksen ensimmäinen osa, oikea reuna
var num1MarginL = 323; // canvaksen toinen osa, vasen reuna
var num1MarginR = 421; // canvaksen toinen osa, oikea reuna
var tulosMarginL = 571; // canvaksen kolmas osa, vasen reuna
var tulosMarginR = 684; // canvaksen kolmas osa, oikea reuna
var offSetX = 50; // offset arvo x-akselilla, paljonko numero voi mennä ohi aluksesta, niin että se edelleen lasketaan pisteeksi, px
var offSetY = 10; // offset arvo y-akselilla, korkeus jossa numero otetaan kiinni (tarvitaan offset range, koska nopeuden muuttuessa jokaista pikseliä ei käydä läpi)

var dnumbers = [
  numgen(0, 5), // putoava numero 1
  numgen(0, 12), // putoava numero 2
  fnum1 + fnum2 // putoava tulos
];

var pisteet = 0; // seurataan pisteitä
var pisteetH = 25; // pisteiden sijainti (height, y-akseli)
var pisteetW = 623; // pisteiden sijainti (width, x-akseli) 
var extraPisteet = 0; // nopeudesta kertyvät extrapisteet
var rank; // taso, määritellään pisteiden mukaan

// tarkistetaan, että putoavat numerot ei ole yhtä kuin tulos (oikean vastauksen tarkistaminen vaikeutuu, mikäli samoja lukuja)
// vaihtoehtoinen (parempi) tapa olisi ollut lotto-tehtävässä käytetty taulukko ja sen indeksit
function checkDoubles() {
  for (var i = 0; i <= dnumbers.length; i++) { // käydään putoavat numerot läpi
    if (dnumbers[0] === dnumbers[2]) { // jos taulukon ensimmäinen luku on yhtäkuin viimeinen (tulos)
      dnumbers[0] = dnumbers[2] + numgen(1, 9); // ensimmäiseen lukuun lisätään arvottu luku väliltä 1-9 (päivitetty 6.5)
      continue;
    }
    else if (dnumbers[1] === dnumbers[2]) { // jos taulukon toinen luku on yhtäkuin tulos
      dnumbers[1] = dnumbers[2] + numgen(1, 9); // lukuun lisätään arvottu luku väliltä 1-9 (päivitetty 6.5)
      continue;
    }
    else {
      break;
    }
  }
}

// putoavien numeroiden x-koordinaatin arvonta
// canvas on jaettu kolmeen osaan niin, että numerot eivät voi mennä päällekkäin
// ja numeroiden väliin jää aina vähintään aluksen leveyden verran tilaa
var numPlaces = [
  numgen(num0MarginL, num0MarginR), // canvaksen ensimmäinen osa
  numgen(num1MarginL, num1MarginR), // canvaksen toinen osa
  numgen(tulosMarginL, tulosMarginR), // canvaksen kolmas osa
];

// Fisher-Yates shuffle algoritmi / https://bost.ocks.org/mike/shuffle/
// numPlaces koordinaattien sekoitus
// oikean vastauksen paikka arvotaan joka kierroksella (funtiota kutsuessa)
function shuffle() {
  for (var i = numPlaces.length - 1; i > 0; i--) { // läpikäynti
    var j = Math.floor(Math.random() * (i + 1)); // arvotaan luku indeksin mukaan
    var temporary = numPlaces[i]; // sijoitetaan tulostuspaikat algoritmiin
    numPlaces[i] = numPlaces[j];
    numPlaces[j] = temporary;
  }
}

// putoavien numeroiden nopeutus
// eventlistener kutsuu funktiota, mikäli näppäintä painetaan
document.addEventListener("keydown", speedUp);

function speedUp() {
  if (event.keyCode === 40) { // nuolinäppäin alas
    nopeus = 3; // nopeus vaihtuu yhestä pikselistä kolmeen pikseliin / kierros
  }
}

// sydämet taulukko
var lifes = [
  sis.drawImage(life, 0, 0),
  sis.drawImage(life, 0, 0),
  sis.drawImage(life, 0, 0)
];

// funktio sydämien piirtämiseen
function drawLifes() {
  for (var i = 0; i <= lifes.length - 1; i++) {
    sis.drawImage(life, 0 + i * 50, 0);
  }
}

// PIIRTÄMINEN
function draw() {
  checkDoubles(); // tarkistetaan, mikäli putoavien lukujen arvo on sama kuin oikea vastaus
  sis.drawImage(bg, 0, 0); // taustakuva
  // pisteet, kiinteä
  sis.shadowOffsetX = 5; // varjo, leveys
  sis.shadowOffsetY = 5; // varjo, korkeus
  sis.shadowBlur = 0; // varjon tyyli
  sis.shadowColor = "rgba(0, 0, 0, 0.3)"; // varjon väri, läpinäkyvyys 
  sis.font = "30px Arial"; // pisteiden fontti ja fonttikoko
  sis.fillStyle = "lime"; // pisteiden väri
  sis.fillText("Pisteet: " + pisteet, pisteetW, pisteetH); // pisteiden piirtäminen, teksti, pisteet, sijainti
  // ratkaistava matikkatehtävä, kiinteä
  sis.font = "120px Arial";
  sis.fillStyle = "#ffa31a";
  sis.fillText(fnum1 + " + " + fnum2, cvs.width / 2, cvs.height / 1.5); // kiinteiden numeroiden piirtäminen (laskutehtävä)
  sis.drawImage(ship, sX, sY); // aluksen piirtäminen
  drawLifes(); // kutsutaan funktiota, piirretään sydämet

  // putoavat numerot
  sis.textAlign = "center"; // teksin x-akselin "ankkuri", sijainti katsotaan x-akselilla tekstin keskikohdasta
  sis.font = "60px Arial";
  sis.fillStyle = "#00ff99";
  sis.fillText(dnumbers[0], numPlaces[0], n1Y); // piirretään 1. putoava numero, arvottu luku taulukosta, sijainti x-akselilla taulukosta, sijainti y-akselilla
  sis.fillText(dnumbers[1], numPlaces[1], n2Y); // piirretään 2. putoava numero, arvottu luku taulukosta, sijainti x-akselilla taulukosta, sijainti y-akselilla
  sis.fillText(dnumbers[2], numPlaces[2], tulosY); // piirretään 3. putoava numero (oikea vastaus), arvottu luku taulukosta, sijainti x-akselilla taulukosta, sijainti y-akselilla
  // putoavien lukujen y-koordinaattien muuttaminen, putoaminen
  n1Y += nopeus;
  n2Y += nopeus;
  tulosY += nopeus;

  // OIKEA VASTAUS
  // jos sX + ship.width / 2 (aluksen keskikohdan x-arvo) on tuloksen (numPlaces[2]) x-arvon välillä -50 ja +50
  // ja jos tuloksen y-arvo on aluksen puolivälin -10 ja +10 pikselin välillä
  // kun nopeus on 1, kaikki y-akselin pikselit käydään läpi, mutta kun nopeus kasvaa kolmeen pikseliin/kierros, kaikkia pikseleitä ei käydä läpi ja tarvitaan offset range 
  if ((sX + ship.width / 2) > numPlaces[2] - offSetX && (sX + ship.width / 2) < numPlaces[2] + offSetX &&
    sY > (tulosY - (Math.floor(ship.height / 2)) - offSetY) &&
    sY < (tulosY - (Math.floor(ship.height / 2)) + offSetY)) {
      oikeavastaus.play();

    nopeus = 1; // nopeus pysyy tai muuttuu takaisin yhteen pikseliin / kierros
    // extrapisteet lasketaan time * 1. Jos aikaa on jäljellä esim. 2, kun vastaus otetaan kiinni, pisteitä saa kaksi.
    // maksimi extrapisteet ovat 5 (putoamisen kestoa ei kellotettu)
    // ilman nopeuden muutosta extrapisteet ovat 0, mutta oikeasta vastauksesta saa yhden pisteen
    extraPisteet = time * 1;
    pisteet = pisteet + 1 + extraPisteet;

    // muuttujat takaisin lähtöarvoon
    tulosY = 70;
    n1Y = 70;
    n2Y = 70;
    checkRank(); // tarkistetaan taso pisteiden mukaan sekä vaikeutetaan peliä tasojen mukaan (päivitetty 6.5)
    time = 5; // resetoidaan aika

    // arvotaan uudet sijainnit
    numPlaces = [
      numgen(num0MarginL, num0MarginR), // canvaksen ensimmäinen osa
      numgen(num1MarginL, num1MarginR), // canvaksen toinen osa
      numgen(tulosMarginL, tulosMarginR), // canvaksen kolmas osa
    ];
    shuffle(); // sekoitetaan putoavien numeroiden sijainnit

    // VÄÄRÄ VASTAUS
    // jos sX + ship.width / 2 (aluksen keskikohdan x-arvo) on eri suuri kuin tuloksen x-arvo 
    // ja jos aluksen y-arvo on aluksen puolivälin -10 ja +10 pikselin välillä
  }
  else if ((((sX + ship.width / 2) !== numPlaces[2] && sY > (tulosY - ship.height) - offSetY) &&
      sY < (tulosY - ship.height) + offSetY)) {
    
    vaaravastaus.play();
    nopeus = 1;
    lifes.pop(); // lifes taulukosta poistetaan yksi sydän
    time = 5;
    numPlaces = [
      numgen(num0MarginL, num0MarginR), // canvaksen ensimmäinen osa
      numgen(num1MarginL, num1MarginR), // canvaksen toinen osa
      numgen(tulosMarginL, tulosMarginR), // canvaksen kolmas osa
    ];
    shuffle();

    // VÄÄRÄ VASTAUS, PELI OHI
    if (lifes.length === 0) { // jos sydämet -taulukko ei sisällä yhtään alkiota (elämiä)
      clearInterval(timerVal); // pysäytetään aika
      drawGameOver(); // piirretään "peli ohi" -näyttö
      return; // pysäytetään animaatio
    }
    
    // VÄÄRÄ VASTAUS, ELÄMIÄ JÄLJELLÄ
    else {
      nopeus = 1;
      tulosY = 70;
      n1Y = 70;
      n2Y = 70;
      checkRank();
      numPlaces = [
        numgen(num0MarginL, num0MarginR), // canvaksen ensimmäinen osa
        numgen(num1MarginL, num1MarginR), // canvaksen toinen osa
        numgen(tulosMarginL, tulosMarginR), // canvaksen kolmas osa
      ];
      shuffle();
    }
  }
  requestAnimationFrame(draw); // draw funktion animointi
}

draw(); // draw -funktion kutsuminen, saa aikaan loopin

// päivitetty 6.5
// aikaisemmin peli ei vaikeutunut millään tavalla. Nyt checkRank funktio vaikeuttaa ratkaistavia tehtäviä pisteiden mukaan.
// tämän myötä checkdoubles funktio ei toimi yhtä hyvin kuin aikaisemmin, koska arpoo "väärän" suuruisia lukuja, mikäli arvotaan tuplia
// tässä vaiheessa ei enää ole aikaa korjata funktiota, mutta säilytän siitä huolimatta vaikeutumisen.
function checkRank() {
  // TASO 1
  if (pisteet < 10) {
    dnumbers[0] = numgen(0, 5); // putoava numero 1
    dnumbers[1] = numgen(0, 12); // putoava numero 2
    fnum1 = numgen(0, 5); // kiinteä numero 1 (tehtävä)
    fnum2 = numgen(0, 5); // kiinteä numero 2 (tehtävä)
    dnumbers[2] = fnum1 + fnum2; // putoava tulos
    checkDoubles();
    rank = "Aloittelija, jotain meni pieleen😕"; // teksti, taso
  }
  
  // TASO 2
  else if (pisteet <= 20) {
    dnumbers[0] = numgen(5, 10); // putoava numero 1 - vaikeutetaan suuremmilla mahdollisilla luvuilla
    dnumbers[1] = numgen(5, 25); // putoava numero 2 - vaikeutetaan suuremmilla mahdollisilla luvuilla
    fnum1 = numgen(0, 10); // kiinteä numero 1 (tehtävä) - vaikeutetaan suuremmilla mahdollisilla luvuilla
    fnum2 = numgen(0, 10); // kiinteä numero 2 (tehtävä) - vaikeutetaan suuremmilla mahdollisilla luvuilla
    dnumbers[2] = fnum1 + fnum2; // putoava tulos
    checkDoubles();
    rank = "Matikkanoviisi, harjoittele vielä!🧐";
  }
  
  // TASO 3
  else if (pisteet <= 50) {
    dnumbers[0] = numgen(9, 15); // putoava numero 1 - vaikeutetaan suuremmilla mahdollisilla luvuilla
    dnumbers[1] = numgen(10, 25); // putoava numero 2 - vaikeutetaan suuremmilla mahdollisilla luvuilla
    fnum1 = numgen(7, 10); // kiinteä numero 1 (tehtävä) - vaikeutetaan jättämällä arvonnasta pienimpiä mahdollisia lukuja pois
    fnum2 = numgen(7, 10); // kiinteä numero 2 (tehtävä) - vaikeutetaan jättämällä arvonnasta pienimpiä mahdollisia lukuja pois
    dnumbers[2] = fnum1 + fnum2; // putoava tulos
    checkDoubles();
    rank = "Matikkaseppä, harjoittele vielä!🤯";
  }
  
  // TASO 4
  else if (pisteet <= 80) {
    dnumbers[0] = numgen(14, 55); // putoava numero 1 - vaikeutetaan suuremmilla luvuille
    dnumbers[1] = (dnumbers[2] - numgen(1, 9)); // putoava numero 2 - vaikeutetaan niin, että toisen putoavan väärän luvun arvo on varmuudella 1-9 sisällä oikeasta vastauksesta
    fnum1 = numgen(9, 25); // kiinteä numero 1 (tehtävä) - vaikeutetaan suuremmilla luvuilla sekä jättämällä arvonnasta pienimpiä mahdollisia lukuja pois
    fnum2 = numgen(9, 25); // kiinteä numero 2 (tehtävä) - vaikeutetaan suuremmilla luvuilla sekä jättämällä arvonnasta pienimpiä mahdollisia lukuja pois
    dnumbers[2] = fnum1 + fnum2; // putoava tulos
    checkDoubles();
    rank = "Matikkamestari, hienoa!👑"; // taso 4
  }
  
  // TASO 5
  else {
    // vaikeutetaan niin, että molempien väärien putoavien lukujen arvot ovat varmuudella 1-9 sisällä oikeasta vastauksesta
    // suuremmilla luvuilla
    // jättämällä 0-10 yhteenlaskutehtävät arvonnan ulkopuolelle
    dnumbers[0] = (dnumbers[2] + numgen(1, 9)); // putoava numero 1
    dnumbers[1] = (dnumbers[2] - numgen(1, 9)); // putoava numero 2
    fnum1 = numgen(11, 50); // kiinteä numero 1 (tehtävä)
    fnum2 = numgen(11, 50); // kiinteä numero 2 (tehtävä)
    dnumbers[2] = fnum1 + fnum2; // putoava tulos
    checkDoubles();
    rank = "Matikkanero, loistavaa!🤓"; // taso 5
  }
}

// PELI OHI, PIIRTÄMINEN
function drawGameOver() {
  checkRank(); // pisteiden tarkistaminen
  
  // gameover -ääni, mikäli pelaaja jää alle 10 pisteeseen, kun peli päättyy
  // kiedottu settimeouttiin, jottei sekoitu edelliseen "väärin" -ääneen
  if (pisteet < 10) {
    setTimeout(function() { 
    gameover.play();
    }, 1000);
  }
  
  // positiivinen ääni, mikäli pelaajalla on 10 tai enemmän pisteitä, kun peli päättyy
  if (pisteet >= 10) {
    setTimeout(function() { 
    positive.play();
    }, 1000);
  }
  
  sis.drawImage(bgstart, 0, 0); // tummempi taustakuva
  // teksti 1
  sis.fillStyle = "lime";
  sis.font = "60px Arial";
  sis.fillText("Game over", cvs.width / 2, cvs.height / 2); // canvaksen keskikohta
  // teksti 2, pisteet
  sis.fillStyle = "lime";
  sis.font = "30px Arial";
  sis.fillText("Pisteesi: " + pisteet, cvs.width / 2, cvs.height / 2 + 60);
  // teksti 3, taso
  sis.fillStyle = "lime";
  sis.font = "30px Arial";
  sis.fillText("Olet tasoltasi " + rank, cvs.width / 2, cvs.height / 2 + 90);
  // teksti 4
  sis.fillStyle = "lime";
  sis.font = "30px Arial";
  sis.fillText("Pelaa uudestaan päivittämällä sivu.",
    cvs.width / 2, cvs.height / 2 + 160);
}

// ALUKSEN LIIKUTTAMINEN
// event listener laukaistaan, mikäli näppäintä painetaan
document.addEventListener("keydown", moveShip);

function moveShip() {
  if (event.keyCode === 39) { // oikea nuolinäppäin
    sX = sX + 8; // alus liikkuu oikealle
  }

  if (sX === (cvs.width - ship.width)) {
    sX = sX - 8; // pysäytetään aluksen liikkuminen pelialueen oikeaan reunaan
  }

  if (event.keyCode === 37) { // vasen nuolinäppäin
    sX = sX - 8; // alus liikkuu vasemmalle
  }

  if (sX < 10) {
    sX = sX + 8; // pysäytetään aluksen liikkuminen pelialueen vasempaan reunaan
  }
}

// estetään sivun scrollaaminen ylös ja alaspäin nuolilla
// muussa tapauksessa sivu liikkuu alaspäin, kun putoavien numeroiden nopeuttaa lisätään
window.addEventListener("keydown", function(e) {
  if (e.keyCode === 38 || e.keyCode === 40) {
    e.preventDefault();
  }
}, false);


// ENNEN VAIKEUTTAMISTA
// dnumbers[0] = numgen(0, 10); // putoava numero 1
// dnumbers[1] = numgen(0, 20); // putoava numero 2
// fnum1 = numgen(0, 10); // kiinteä numero 1 (tehtävä)
// fnum2 = numgen(0, 10); // kiinteä numero 2 (tehtävä)
// dnumbers[2] = fnum1 + fnum2; // putoava tulos
