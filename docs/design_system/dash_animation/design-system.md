# SIGNAL — Designsystem für Boids Survival Runner

Kanonische Werte: `tokens.css`. Dieses Dokument erklärt die Regeln, die aus den Werten ein
System machen. Markup-Vorlage des Menüs: `menu-markup.html`.

Bestand, auf dem aufgebaut wird: die Farben trugen im Spiel schon Bedeutung (Cyan = Spieler,
Rot = Schwarm, Grün = Leben, Slate = Welt). Das System macht diese Zuordnung zur Regel,
zieht die Neutralstufen auseinander und ersetzt Segoe UI durch ein Typo-Paar.

---

## 1) Farbsemantik — die zentrale Regel

Jede Farbe hat **genau eine** Bedeutung. Wer eine Farbe außerhalb ihrer Rolle benutzt,
nimmt ihr die Lesbarkeit im Spiel.

| Farbe                   | Rolle                  | Wo                                                                 |
| ----------------------- | ---------------------- | ------------------------------------------------------------------ |
| Cyan `#38BDF8`          | **Du und dein Können** | Spieler, Dash-Bar, Score, Primärbutton, Timer-Fortschritt          |
| Rot `#F03A5F`           | **Kostet dich etwas**  | Boids, Hindernis-_Kanten_, Boid-Zähler, Game-Over-Akzent           |
| Amber `#FBBF24`         | **Zustandswechsel**    | Unverwundbarkeit, ablaufendes Hindernis, Wellenwechsel, Diagnostik |
| Grün `#22C55E`          | **Leben**              | ausschließlich die Health-Segmente                                 |
| Slate `#94A3B8/#2A313F` | **Welt / inert**       | Grid, Hindernis-Körper, inaktive UI                                |

Zwei Ableitungen daraus:

- **Nie eine große Fläche rot füllen.** Rot ist im Spiel die Farbe von 90 bewegten
  Dreiecken; eine rote Hindernisfläche würde mit dem Schwarm um Aufmerksamkeit
  konkurrieren. Hindernisse tragen Rot nur an der Kante.
- **Amber ist immer temporär.** Etwas, das dauerhaft amber ist, hat die falsche Farbe.

---

## 2) Neutralstufen

```
#07080B  void       Letterbox, Bereiche außerhalb der Welt
#0B0D12  arena      Arena-Hintergrund (ersetzt #111318 — eine Stufe kühler und tiefer)
#12161E  surface    Panels, Karten, Menü-Flächen
#1A1F2A  raised     Keycaps, Segmented-Control-Zellen, Hover
#2A313F  body       Hindernis-Körper
```

Tiefe kommt aus **Flächenhelligkeit**, nicht aus Schatten. Kein `box-shadow` als
Tiefenmittel. `box-shadow`/`shadowBlur` ist ausschließlich **Glow**, und Glow ist
Bedeutung: Cyan-Glow = bereit/aktiv, Rot-Glow = Gefahr.

Text: `#F2F4F8` → `rgba(242,244,248,.56)` (sekundär) → `.38` (Label) → `.24` (deaktiviert).
Linien: `rgba(255,255,255,.08)` normal, `.16` betont. **Immer 1px, nie 2px** — die einzige
2px-Linie im System ist der Gefahrenakzent oben am Game-Over-Panel.

### Grid

Zwei Stufen statt einer: Feinraster alle 56px in `rgba(255,255,255,.05)`, dazu eine
Major-Linie alle **280px** (= 5 Zellen) in `rgba(255,255,255,.085)`. Das gibt der Arena
Maßstab und Ortsgefühl, ohne heller zu werden als heute — das aktuelle einstufige Grid mit
`.07` liegt genau dazwischen und liest sich flach. Zwei `stroke()`-Aufrufe statt einem.

---

## 3) Typografie

Zwei Familien, klar getrennte Aufgaben:

- **Space Grotesk** — Display und UI-Text. 700 für Titel und Buttons, 500/600 für Labels.
  `letter-spacing: -0.02em` ab 32px, `-0.035em` ab 80px.
- **JetBrains Mono** — **alle Zahlen**, Keycaps, HUD-Werte, Kicker, Hint-Texte.
  Immer `font-variant-numeric: tabular-nums`, sonst springt der Timer sekündlich.

Kicker-Muster (das wiederkehrende Struktur-Element): Mono, 9–11px, `letter-spacing`
0.2–0.3em, `text-transform: uppercase`, Farbe `rgba(242,244,248,.38–.44)`. Jede Gruppe im
Menü und jeder HUD-Wert bekommt einen.

Skala: 82 / 46 / 34 / 30 / 26 / 22 / 17 / 15 / 13 / 11 / 10 / 9 px.

Canvas-Fonts entsprechend: Dash-Label `600 11px 'JetBrains Mono', monospace`, Countdown
`700 96px 'Space Grotesk', sans-serif` (von 72px hoch — der Countdown ist der einzige
Moment, in dem die Arena leer ist, er darf groß sein).

---

## 4) Form

- `border-radius: 2px` für Panels und Buttons. Das System ist kantig, nicht weich —
  8px-Radien lassen ein Arcade-UI weich und generisch aussehen.
- `border-radius: 999px` nur für Pills und die Dash-Bar.
- **Corner-Cut** als Markenmotiv, ausschließlich auf der Primäraktion:
  `clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)`
- Trennung zwischen Zellen: `gap: 1px` auf einem Container mit
  `background: rgba(255,255,255,.07)` statt Borders pro Zelle. Ergibt echte Hairlines ohne
  doppelte Kanten.

## 5) Motion

```
--ease: cubic-bezier(.2, .8, .2, 1)
--dur-fast: 120ms   Hover, Fokus
--dur-base: 180ms   Selektion, Panel-Öffnen
--dur-slow: 320ms   Screen-Wechsel
```

Menü-Einblendung: Titel und Panels gestaffelt mit 40ms Versatz, 12px von unten,
`--dur-slow`. Keine Skalierungs- oder Bounce-Animation.

Der Cyan-Punkt im Menü-Header pulst 2.4s `ease-in-out infinite` zwischen Opacity 1 und
0.45 — das einzige Dauer-Loop-Element im UI. Es signalisiert „Simulation läuft".
Unter `prefers-reduced-motion: reduce` entfällt es (in `tokens.css` schon abgedeckt).

---

## 6) Hauptmenü — „Command Deck"

Asymmetrisches 3-Zeilen-Grid über die Vollfläche: Header-Hairline / Inhalt / Footer-Hairline,
Padding 44px 48px. Inhalt zweispaltig, `1fr 400px`. Markup: `menu-markup.html`.

- **Header**: Statuspunkt + `SWARM SIMULATION / RUST · WASM` links, `BUILD x.y.z` rechts.
- **Links**: Titel dreizeilig 82px, `line-height: .92`, mit „RUNNER" in Cyan. Eine Zeile
  Pitch in Mono. Darunter die **Menüliste**.
- **Menüliste**: jede Zeile = Mono-Index (`01`…) + Label + Trailing-Marker (`→`, Keycap,
  Badge). Die erste Zeile (`01 PLAY`) ist eine Cyan-Fläche mit Corner-Cut, alle weiteren
  sind nur durch eine untere Hairline getrennt. **Genau das ist der Grund für dieses
  Layout**: ein neuer Menüpunkt (Audio, Graphics, Credits …) ist eine weitere Zeile, kein
  Redesign. Reihenfolge heute: `01 PLAY` / `02 GAME SETTINGS` / `03 CONTROLS` /
  `04 DEVELOPER` (letzteres mit Amber-Badge `DIAG`).
- **Rechts**: Panel-Stack — `PERSONAL BEST` (große Cyan-Zahl + 3-Spalten-Statzeile +
  `LAST RUN`), `TARGET FPS` (Segmented Control, unverändert aus `optionGroup.js`),
  `CONTROLS` (Keycaps). Flächen `rgba(18,22,30,.82)` + `backdrop-filter: blur(8px)`, damit
  der Schwarm dahinter durchscheint.
- **Footer**: `↑↓ NAVIGATE · SPACE SELECT · ESC BACK` links, `60 SIM STEPS / S` rechts.

### Untermenüs

Die Sekundärpunkte ersetzen die **linke Spalte** und lassen Header, Footer und Backdrop
stehen: Titel schrumpft auf eine Mono-Breadcrumb (`← GAME SETTINGS`), die Optionsgruppen
rutschen von rechts nach links in die freie Fläche. Kein neuer Screen-Typ, kein Modal.

### Tastatur

`↑↓` bewegt den Fokus durch die Menüliste, `SPACE`/`ENTER` aktiviert, `ESC` geht zurück.
`InputManager` ruft auf Fensterebene `preventDefault()` für die Pfeiltasten auf — die
Menü-Navigation muss also **vor** ihm greifen oder der InputManager pausiert, solange das
Overlay offen ist. Zweiteres ist sauberer: das Menü ist kein Spielzustand.
Fokus ist immer sichtbar: `box-shadow: 0 0 0 2px var(--arena), 0 0 0 4px var(--player)`.

### Schwarm-Backdrop (`menuBackdrop.js`)

Derselbe Zeichencode wie im Spiel, aber ohne Simulation: 72 Boids driften mit
Sinus-Winkelrauschen und wrappen an den Kanten, plus zwei Hindernisse und das Grid. Darüber
ein Radial-Gradient-Overlay, das die Textseite auf ~93 % Deckung abdunkelt und zum Rand hin
auf ~50 % öffnet:

```css
background: radial-gradient(
  120% 90% at 22% 45%,
  rgba(11, 13, 18, 0.93) 0%,
  rgba(11, 13, 18, 0.82) 42%,
  rgba(11, 13, 18, 0.5) 100%
);
```

Reine Präsentation, fasst die Engine nicht an. Läuft nur, solange das Menü offen ist.

### Controls-Legende

Keycap: 30px hoch, `#1A1F2A`, `1px rgba(255,255,255,.14)`, untere Kante auf `.06` gesetzt
(ergibt eine minimale Tastenkappen-Plastik), Radius 3px, Mono 11px/700. `SPACE` ist breiter
und cyan umrandet, weil es die Fähigkeit ist, nicht die Bewegung.

---

## 7) HUD

Die vier gerahmten Panels verschwinden. Ein HUD-Wert ist **Kicker + große Mono-Zahl**, ohne
Fläche und ohne Rahmen; Lesbarkeit kommt aus `text-shadow: 0 2px 12px rgba(0,0,0,.9)`.
Damit gibt das HUD vier Rechtecke Arena zurück. Die `id`s bleiben (`hud-timer`, `hud-wave`,
`hud-score`, `hud-boids`), die e2e-Tests also auch.

| Position     | Inhalt                                                                 |
| ------------ | ---------------------------------------------------------------------- |
| oben Mitte   | `TIME` + `00:30` (34px) + 2px-Fortschrittsschiene der Welle, cyan      |
| oben rechts  | `WAVE` + `02` (26px), rechtsbündig                                     |
| unten links  | `SCORE` + Wert (30px) in **Cyan** — es ist dein Ergebnis               |
| unten rechts | `BOIDS` + Wert (26px) in **Rot** — es ist die Bedrohung                |
| unten Mitte  | Dash-Bar: 200×4px Pill; voll + Cyan-Glow + `DASH READY`, sonst gedimmt |

Die Wellen-Schiene ist `timerSeconds / WAVE_DURATION_SECONDS` — der Wert liegt in `hud.js`
bereits vor, es braucht keine neue Datenquelle.

Die Dash-Bar wechselt ihr Label mit dem Zustand und trägt Glow nur im Ready-Zustand — der
Glow ist die Information, nicht Dekoration. Sie kann im Canvas bleiben (dann Farben aus §1)
oder ins DOM wandern (`.dash-bar` in `tokens.css`); DOM ist vorzuziehen, weil die
Textzeile dann nicht pro Frame neu gerastert wird.

**Neue Locale-Keys** in `frontend/public/locales/en.json`:

```
hud.dashReady        "Dash Ready"
menu.gameSettings    "Game Settings"
menu.controls        "Controls"
menu.personalBest    "Personal Best"
menu.lastRun         "Last Run"
menu.move            "Move"
menu.pitch           "A swarm hunts you. The arena fills in. Survive the wave."
menu.navHint         "↑↓ Navigate · Space Select · Esc Back"
```

`hud.dash` bleibt, verliert aber das `— Space` (die Keycap trägt das jetzt).

---

## 8) Hindernisse — „Hazard Tape"

Gezeichnet wird dieselbe Kapsel wie bisher — ein `round`-capped Stroke mit
`lineWidth = radius * 2`, Kreis = Spine der Länge 0 — also **ein** Renderpfad und
unverändertes Buffer-Layout. Neu ist nur die Stroke-Folge, drei statt zwei:

1. **Körper**: Schraffur-Pattern (10×10-Tile, `#2A313F` mit zwei diagonalen Strichen in
   `rgba(240,58,95,.30)`, 3.5px breit). Einmal gebaut und gecacht — ein `createPattern` pro
   Frame wäre eine Allokation auf dem heißen Pfad.
2. **Kern** (nur bei `radius > 8`): `rgba(14,17,24,·)`, `lineWidth = radius*2 - 7`. Dunkelt
   die Mitte ab, sodass die Schraffur als Rand-Band wirkt und die Boids darüber lesbar
   bleiben. Bei dünnen Balken entfällt er von selbst.
3. **Kante**: 1.5px `rgba(240,90,110,·)`.

Warum diese und nicht ein hellerer Rand: die Schraffur ist das einzige Signal, das ohne
Farbe funktioniert und das Hindernis eindeutig von „Loch im Boden" unterscheidet. Sie
bleibt dunkel genug, dass der Schwarm die visuelle Priorität behält.

Die Alpha-Tabellen des Originals bleiben unverändert gültig und sind im neuen Modul
übernommen: Opacity ändert sich pro Frame, also darf pro Frame kein `rgba(...)` gebaut
werden.

### Lebenszyklus (nutzt `life_fraction`, kein neuer Buffer)

`life_fraction` ist die Restlebensdauer in (0, 1] — nahe 1 heißt gerade erschienen, nahe 0
heißt läuft ab. Beide Fenster sind genau `OBSTACLE_FADE_SHARE` (6 %), die Phasenerkennung
braucht also keinen weiteren Wert.

- **fade-in**: Opacity-Rampe wie heute, **plus** ein sich nach außen dehnender Halo-Ring
  (ein Stroke der Breite `(radius + 6 + grow·34) * 2` bei ~9 % Opacity — dieselbe
  Kapsel-Geometrie, nur dicker). Das Hindernis „landet" statt einzublenden.
- **live**: Kantenfarbe rot.
- **fade-out**: Kante wechselt auf **Amber**. Amber = Zustandswechsel, konsistent mit der
  Unverwundbarkeits-Farbe — der Spieler lernt die Bedeutung an einer Stelle und kann sie
  überall anwenden.

### Treffer-Flash

Bleibt wie gebaut (dieselben Strokes in Rot über die Normalfarbe, `hit_flash` als Stärke),
**aber** die Kante wird **weiß** statt rot: die Normalkante ist hier schon rot, ein roter
Flash wäre dort unsichtbar.

---

## 9) Game Over

Karte statt Vollbild-Overlay: 424px breit, `rgba(18,22,30,.9)` + Blur, Rahmen
`rgba(240,58,95,.28)`, oben eine 2px rote Kante über die volle Breite — das einzige 2px im
System, und es markiert genau die eine Niederlage.

Inhalt von oben: Kicker `SWARM WINS` → `GAME OVER` (46px) → `FINAL SCORE` als 62px-Mono mit
`BEST ####` daneben → Statzeile (Wave / Time / Boids) → `RESTART` (Cyan, Corner-Cut, Keycap
`SPACE`) → `MAIN MENU` (Ghost-Button).

Dahinter läuft der Schwarm weiter, mit `rgba(11,13,18,.82)` abgedunkelt: die Simulation hat
nicht angehalten, du bist nur raus.

Highscore und letzte Runde kommen aus `localStorage` (`bsr.best.score`, `bsr.best.wave`,
`bsr.best.timeSeconds`, `bsr.last.*`) — geschrieben beim Rundenende in der Runden-Buchführung,
gelesen von Menü und Game-Over-Karte. Kein Backend, keine Engine-Berührung.

---

## 10) Dash-Schweif — „Ion Streak"

Der Dash ist die einzige Bewegung im Spiel, die schneller als normal ist — er bekommt
deshalb das einzige Bewegungs-Vokabular: ein Band hinter dem Objekt. Gleiches Motiv für
Spieler und Boid, unterschieden nur durch Farbe und Größe. Kein zweiter Effekt, keine
Extra-Farbe.

### Aufbau

Drei Teile, in dieser Zeichenreihenfolge, alle **hinter** Boids und Spieler und **vor**
den Hindernissen:

1. **Band.** Geschlossenes Polygon entlang der letzten 22 Positionen. Breit am Objekt
   (Halbbreite = Objektradius: 15 px Spieler, 8 px Boid), zur Spitze auslaufend
   (`halbbreite = basis * alter^0.8 * stärke`), Deckkraft `0.5 * alter * stärke`.
   Farbe = Besitzer: Spieler `#38BDF8`, Boid seine Tier-Farbe.
2. **Kern.** Dasselbe Band nochmal, in Weiß, ein Drittel so breit und mit deutlich
   steilerem Abfall (`alter^2.2`) — bleibt dadurch ein kurzer heller Streifen direkt
   hinter dem Objekt. **Kein** Stroke: eine gestrichene Linie behält ihre Breite bis zum
   Ende und liest sich als Speer, nicht als Schweif.
3. **Absprung-Ring.** Ein Kreis in der Besitzerfarbe am Startpunkt, 0,3 s lang, von 10 px
   auf 90 px, Deckkraft linear von 0,7 auf 0. Er markiert den Moment des Impulses — das
   ist die Information, die dem Spieler bei einem Boid-Stoß fehlt: _von wo_ kam er.

### Wann ein Schweif existiert

Nur oberhalb der Normalgeschwindigkeit:

```
stärke_spieler = clamp((v - v_max * 0.6) / (v_dash - v_max), 0, 1)
stärke_boid    = min(1, 0.35 + |dash_phase|)      nur bei dash_phase < 0
```

Damit endet der Schweif von allein, wenn der Impuls abgebaut ist — **kein Trail-Timer**,
der mit der Dash-Dauer synchron gehalten werden müsste. Beim Boid zählt `dash_phase` den
Dash herunter, der Schweif ist also am Absprung am stärksten und dünnt zum Ende aus: er
zeigt, woher der Stoß kam, nicht wo er ausläuft.

Der Aufladepuls bleibt unverändert (`dashPulse.js`). Der Schweif setzt erst am Absprung
ein — Vorwarnung und Ausführung bleiben zwei getrennte Signale.

### Keine Engine-Änderung

`dash_phases[i] < 0` ist bereits das Signal „dasht gerade"; der Spieler-Schweif ist reine
Präsentation aus Position und Geschwindigkeit, die das Frontend ohnehin hält.
`playerController.js` und die WASM-Grenze bleiben unangetastet.

### Hot Path

- Historie als **ein** `Float32Array`-Ringpuffer für 12 Trails × 22 Samples × 5 Werte,
  beim Modulladen allokiert. Pro Frame nur Schreiben an den Kopfindex — kein `push`, kein
  `shift`, kein Objekt pro Sample.
- 12 Slots = Spieler + die harte Obergrenze der Engine von 11 gleichzeitigen Dashern
  (`spec-s05-dash.md` §3). Findet ein Dash keinen Slot, wird er ohne Schweif gezeichnet.
- Deckkraft über `globalAlpha`, Farben sind feste Strings — dieselbe Regel wie bei der
  Glow-Tabelle in `canvasRenderer.js`.
- **Sprung > 200 px** zwischen zwei Samples setzt den Puffer des Slots zurück. Das fängt
  beides: Wrapping am Weltrand und Index-Neuvergabe bei Wellenstart. Ohne die Prüfung zieht
  ein Schweif quer über die Arena. 200 px liegt weit über dem größten ehrlichen Schritt
  (18,7 px pro Simulationsschritt, bis zu 5 Schritte pro Frame).
- Ein Trail, der in einem Frame nicht beschrieben wurde, verliert sein **ältestes** Sample:
  das Ende wird eingezogen statt in einem Frame zu verschwinden.
- `dashTrails.reset()` gehört in `beginRound()`, neben das Neuseeden des Dash-Cooldowns —
  dort werden die Boid-Indizes neu vergeben.
