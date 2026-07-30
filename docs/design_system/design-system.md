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
