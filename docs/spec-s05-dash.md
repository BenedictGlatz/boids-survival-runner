# S-05a — Dash (Spieler und Boids)

Blickwinkel: Gameplay-Fähigkeit, Engine und Frontend

Teil-Spec zu **S-05 Steuerung & Power-Ups**. Beschreibt die erste real umgesetzte
Fähigkeit: einen Dash für den Spieler und einen Dash für die Boids.

## 1) Zweck

**Fachlich:** Der Spieler konnte bisher nur beschleunigen und bremsen — gegen einen
Schwarm, der sich schließt, gibt es keine Antwort außer früh genug wegzulaufen. Der
Dash ist diese Antwort: ein kurzer, aktiv ausgelöster Sprung mit Cooldown.

Umgekehrt verhielt sich der Schwarm über alle Wellen gleich und wuchs nur. Der
Boid-Dash bricht das auf: ab Welle 3 stößt gelegentlich ein einzelner Boid gezielt
zu, löst sich dabei sichtbar aus dem Schwarm und wird danach von der Cohesion
zurückgezogen. Der Schwarm wirkt dadurch nicht mehr wie eine einzige Masse.

**Technisch:**

- **Spieler-Dash** lebt vollständig im Frontend. Die Engine erfährt nur die
  Spielerposition pro `tick()` — die WASM-Signatur ändert sich nicht.
- **Boid-Dash** lebt vollständig in der Engine. Die Engine besitzt jede Bewegung;
  ein rein kosmetischer Frontend-Dash wäre keine Simulation.
- Für die Vorwarnung reicht **eine Zahl pro Boid** über die Grenze.

## 2) Spieler-Dash

### Verhalten

| Aspekt | Festlegung |
|---|---|
| Auslöser | Leertaste (`event.code === 'Space'`) |
| Richtung | die aktuell gehaltene Eingaberichtung (WASD / Pfeiltasten) |
| Ohne Richtungseingabe | kein Dash, **Cooldown wird nicht verbraucht** |
| Wirkung | Impuls auf `PLAYER_DASH_SPEED`, danach Abbau wie durch Reibung |
| Unverwundbarkeit | keine — Ausweichen muss räumlich gelingen |
| Cooldown | `PLAYER_DASH_COOLDOWN_MS`, gemessen auf der Simulationsuhr |
| Anzeige | Balken unten mittig, aufs Canvas gezeichnet |

### Mathematik

Der Dash setzt die Geschwindigkeit direkt und hebt gleichzeitig die Obergrenze:

```
velocity  := direction * PLAYER_DASH_SPEED
speedLimit := PLAYER_DASH_SPEED
```

Danach fällt die Obergrenze pro Schritt zurück:

```
speedLimit := max(PLAYER_MAX_SPEED, speedLimit - PLAYER_DASH_SPEED_DECAY * dt)
velocity   := limit(velocity, speedLimit)
```

Die angehobene Obergrenze ist **technisch notwendig**, nicht kosmetisch:
`limitVelocity` schneidet jede Geschwindigkeit oberhalb von `PLAYER_MAX_SPEED` in
jedem Schritt weg, ein reiner Impuls wäre im selben Schritt wieder verschwunden.
Dass sie langsam zurückfällt statt hart abzureißen, ist genau das, was den Dash wie
einen von Reibung abgebauten Stoß aussehen lässt.

Dash-Distanz aus den Vorgabewerten (1100 px/s, Abbau 3000 px/s², Basis 360 px/s):

```
Dauer des Überschusses = (1100 - 360) / 3000 ≈ 0,247 s
mittlere Geschwindigkeit ≈ (1100 + 360) / 2 = 730 px/s
Distanz ≈ 730 * 0,247 ≈ 180 px
```

180 px sind gut sechs Spielerradien (16 px) — genug, um aus einer sich schließenden
Front zu kommen, zu wenig, um quer über den Bildschirm zu springen.

### Cooldown

```
isDashReady(t, tLastDash, cooldown)          = t - tLastDash >= cooldown
dashCooldownProgress(t, tLastDash, cooldown) = clamp((t - tLastDash) / cooldown, 0, 1)
```

`t` ist immer `gameData.simulationTimeMs`, **nie** Wall Time — ein Tab im
Hintergrund darf keinen Cooldown-Fortschritt verschenken.

### Edge Cases

| Fall | Verhalten |
|---|---|
| Rundenstart | `lastDashAtSimulationMs = -PLAYER_DASH_COOLDOWN_MS`, Dash ab Frame 1 verfügbar |
| `beginRound()` | Zeitstempel wird **mit** neu geseedet; `simulationTimeMs` springt dort auf 0 zurück |
| Mehrschritt-Frame | ein Tastendruck ergibt genau einen Dash (Latch, pro Schritt konsumiert) |
| Taste gehalten | `event.repeat` wird verworfen — kein Dauer-Dash |
| Dash in die Wand | `clampToBounds` nullt die betroffene Achse **und** setzt die Obergrenze zurück, damit normale Bewegung den Boost nicht erbt |
| Fensterfokus verloren | `blur` löscht den Latch |
| Leertaste im Menü | Dash-Taste ist nur bei laufender Runde beansprucht (siehe unten) |

### Barrierefreiheit — die eine echte Regression

Menü-Optionen sind einfache `<button>`, das Developer-Panel ein `<details>`. Beide
werden mit Enter **oder Leertaste** bedient — ausdrücklich so gebaut, weil der
`InputManager` diese Tasten bisher nicht abfing. Ein bedingungsloses
`preventDefault()` auf `Space` würde Start-Button, Restart-Button, jede
`.menu-option` und die `<summary>` für Tastaturnutzer unbrauchbar machen.

Deshalb: `InputManager.setGameplayActive(true)` in `startGame()`, `(false)` in
`endRound()`. Außerhalb einer Runde gehört die Leertaste dem Menü.

## 3) Boid-Dash

### Zustandsmaschine

Vier Zustände, immer in dieser Reihenfolge:

```
Idle ──(ausgewählt)──> Charging ──> Dashing ──> Cooling ──> Idle
```

Auf dem Boid liegen dafür genau zwei `Copy`-Felder: `dash_state` und
`dash_state_steps_remaining`. Jeder Nicht-Idle-Zustand ist nur ein Countdown, ein
Zähler genügt also für alle drei. Drei getrennte Zähler wären eine Invariante zum
Selberhalten („genau eine Phase ist aktiv") — mit Zustand plus Restzähler ist sie
gar nicht verletzbar.

`Boid` ist `Copy` und wird pro Schritt komplett geklont; neuer Zustand muss deshalb
`Copy` bleiben. Alle Dauern zählen in **Simulationsschritten**, nicht in
Millisekunden — die Engine kennt keine Delta-Zeit.

| Phase | Was passiert |
|---|---|
| `Charging` | Boid flockt normal weiter und pulsiert sichtbar |
| `Dashing` | beim Eintritt wird die Geschwindigkeit **einmal** gesetzt: `direction * max_speed * speed_multiplier` |
| `Cooling` | flockt normal, ist aber nicht wählbar |
| `Idle` | flockt normal und ist wieder wählbar |

### Steering im Dash

Cohesion, Alignment und Target-Seek sind aus. **Nur Separation bleibt.**

Das ist der Punkt, an dem sich „Richtung eingefroren" und „Separation bleibt aktiv"
versöhnen: die Geschwindigkeit wird nur beim Absprung geschrieben und danach nicht
mehr überschrieben. Separation ist auf `max_acceleration` (0,09–0,17) gegen eine
Dash-Geschwindigkeit von ~14–19 px/Schritt begrenzt, lenkt also um etwa 0,5° pro
Schritt ab. Über einen ganzen Dash ergibt das höchstens einen sanften Bogen um ein
Hindernis — die Bahn bleibt gerade genug, um ausweichbar zu sein, und Separation
wird nicht zur Attrappe. Würde die Geschwindigkeit jeden Schritt neu gesetzt, wäre
Separation im Dash rechnerisch wirkungslos.

Nach dem Dash zieht die Cohesion den Boid zurück in den Schwarm. Genau das ist der
gewünschte Effekt.

### Warum der Speed-Cap ein Parameter ist

`integrate` bekommt die Obergrenze übergeben, statt `properties.max_speed` zu lesen.
Die drei Alternativen und warum sie ausfallen:

| Ansatz | Problem |
|---|---|
| Zusätzliche Kraft | `clamp_force` begrenzt die Summe auf `max_acceleration` — der Impuls käme mit ~2 % seiner Stärke an |
| `max_speed` temporär erhöhen | **alle vier** Steering-Regeln skalieren ihren Wunschvektor mit `max_speed`; ein 3× Speed würde Separation, Alignment, Cohesion und Seek mitverdreifachen |
| `integrate` umgehen | zweiter Bewegungspfad, der irgendwann das Wrapping vergisst |

Angenehmer Nebeneffekt: im ersten Schritt nach dem Dash liefert `step_speed_limit`
wieder `max_speed`, und `.limit()` schneidet die Restgeschwindigkeit in einem Schritt
weg. Kein Nachglühen, kein zusätzlicher Abklingcode.

### Auswahl — deterministisch, ohne Zufallsgenerator

`Flock` bekommt einen `step_counter`; er ist der komplette Seed.
`select_dash_candidate` gibt fast immer `None` zurück:

1. nur wenn `step_counter % DASH_SELECTION_INTERVAL_STEPS == 0`,
2. nur wenn `count_busy_dashers < allowed_concurrent_dashers(len)`,
3. dann bis zu 8 Kandidaten über dieselbe Integer-Hash-Arithmetik wie
   `find_spawn_position`: `seed = runde*37 + versuch*17`, `index = (seed*97 + 31) % len`,
4. Kandidat muss `can_dash`, `Idle` und in `[MINIMUM, MAXIMUM]`-Distanz sein.

Gewürfelt wird einmal pro 40 Schritte für den **ganzen** Schwarm, nicht pro Boid pro
Schritt — es gibt also nichts nachzuwürfeln. Wer den Slot bekommt, ist durch
`begin_dash_charge` sofort nicht mehr `Idle` und für den ganzen Zyklus (bei Tier 2:
44 + 20 + 240 = 304 Schritte ≈ 5 s) nicht wählbar.

Erwartete Gleichzeitigkeit ≈ 1,6; harte Obergrenze 3 (36 Boids) bis 5 (156 Boids).

Die Distanzschranken heißen `..._SELECTION_DISTANCE` und nicht `..._LAUNCH_DISTANCE`,
weil der Boid während seiner ~44 Charge-Schritte weiter flockt und dabei bis zu ~170
px näher kommt. Ein bei 340 px gewählter Boid springt typischerweise aus 170–300 px ab.

### Tuning und Schwierigkeitskurve

Der Dash ist ab `DASH_UNLOCK_DIFFICULTY_TIER = 2` freigeschaltet. Der Tier ist
`wave - 1`, also ab **Welle 3**. Die beiden ersten Wellen bleiben ein reiner Schwarm
zum Einlernen.

Die Sperre ist ein eigenes `can_dash: bool` und **nicht** `charge_steps == 0`: null
Charge-Schritte ist ein legitimer Tuning-Wert („Dash ohne Vorwarnung") und darf nicht
versehentlich Welle-1-Boids freischalten.

Werte für die beiden Endpunkte der Kurve:

| | Tier 2 (Welle 3) | Tier 4 (Welle 5+) |
|---|---|---|
| Vorwarnung | 44 Schritte (0,73 s) | 34 Schritte (0,57 s) |
| Dash-Dauer | 20 Schritte (0,33 s) | 22 Schritte (0,37 s) |
| Geschwindigkeit | 4,6 × 3,0 = 13,8 px/Schritt | 5,5 × 3,4 = 18,7 px/Schritt |
| Reichweite | ~276 px | ~411 px |
| Cooldown | 240 Schritte (4 s) | 180 Schritte (3 s) |

Der Spieler bewegt sich mit 360 px/s = 6 px/Schritt, ein Dash also mit 2,3–3,1× der
Spielergeschwindigkeit. Ein stehender Spieler wird getroffen; ein bewegter braucht
~30 px Seitversatz (Spielerradius 16 + Boidradius 10 ⇒ 28 px Trefferschwelle) und hat
0,57–0,73 s Vorwarnung dafür. `MINIMUM_DASH_CHARGE_STEPS = 24` ist die Untergrenze,
damit der Puls immer lesbar bleibt.

### Overlap-Relaxation

Ein Dasher legt bis zu 18,7 px pro Schritt zurück, bei `minimum_distance = 20` px.
Er gerät also fast jeden Schritt in eine neue Überlappung, und die symmetrische
Halbe/Halbe-Korrektur würde ihn 10 px pro Paar pro Durchlauf (4 Durchläufe) von
seiner Linie schieben — der Dash bliebe sichtbar im Stau stecken.

Deshalb: **der Dasher ist innerhalb der Relaxation unverschiebbar**, der
nicht-dashende Partner nimmt die ganze Korrektur. Zwei Dasher teilen wie jedes andere
Paar. Dasher ganz aus dem Pass auszunehmen wäre falsch — dann lägen sie sichtbar
übereinander, genau was der Pass verhindert. Der Nebeneffekt ist erwünscht: der
Schwarm teilt sich sichtbar, wenn der Dasher durchpflügt.

### Wrapping

`wrap_position` wickelte bisher nur einmal pro Achse. Bei 18,7 px maximaler
Verschiebung bricht das erst bei einer Welt unter 19 px, der Dash führt also **keinen**
neuen Fehler ein. Die Invariante hing damit aber nur noch an einem Zahlenzufall, und
irgendwann erhöht jemand `DEFAULT_DASH_SPEED_MULTIPLIER`. Deshalb wurde auf die
robuste `rem_euclid`-Form umgestellt, die in `wasm_bridge::wrap_coordinate` schon
existierte.

### Bekannter Nebeneffekt

`alignment` mittelt Nachbar-Geschwindigkeiten **vor** dem Normalisieren. Ein 3×
schnellerer Dasher dominiert damit den Alignment-Mittelwert jedes Boids in seiner
Nähe und zieht die lokale Schwarmrichtung kurz mit. Das bleibt so — es liest sich als
Reaktion des Schwarms auf den Angriff. Die minimale Gegenmaßnahme wäre ein Guard in
`alignment`, der dashende Nachbarn überspringt.

## 4) Grenze zwischen Engine und Frontend

Ein neuer flacher `Float32Array` `dash_phases`, eine Zahl pro Boid,
index-gleich mit `positions` / `velocities` / `tiers`. Das Vorzeichen trägt den
Zustand:

| Wert | Bedeutung |
|---|---|
| `0.0` | nichts zu zeichnen (`Idle` oder `Cooling`) |
| `0 < v < 1` | lädt auf; `v` ist der Fortschritt der Aufladung |
| `-1 ≤ v < 0` | dasht; `-v` ist der noch verbleibende Anteil |

Die Zählerbereiche garantieren, dass keine der beiden Spannen `0.0` erreicht — das
Vorzeichen ist also eindeutig, und „idle" kann nicht mit „hat gerade angefangen zu
laden" verwechselt werden.

Ein `Uint32Array`-Zustand *plus* `Float32Array`-Fortschritt wäre zwei zusätzliche
Buffer-Kopien pro Frame (3 → 5 statt 3 → 4) für Information, die in eine Zahl passt.
Sollte je ein weiterer Sichtzustand nötig werden („Dash abgebrochen"), ist das der
Moment für den getrennten Zustands-Buffer — nicht jetzt.

## 5) Vorwarnung im Frontend

Der Puls braucht **keine Uhr**: die Phase aus der Engine treibt ihn allein, damit
bleibt er im Takt der Simulation.

```
pulseWave(p)      = 0.5 - 0.5 * cos(PULSE_CYCLES * 2π * p²)
dashPulseScale(p) = 1 + MAX_PULSE_GROWTH * p * pulseWave(p)
dashGlowLevel(p)  = p * pulseWave(p)
```

Das **quadrierte** `p` im Argument des Kosinus ist der Trick: früh in der Aufladung
wächst das Argument langsam, kurz vor dem Absprung schnell — die Pulsfrequenz steigt
also von allein. Der Faktor `p` davor lässt zusätzlich Amplitude und Helligkeit mit
dem Fortschritt wachsen. Für negative Phasen (im Dash) sind beide Funktionen
konstant: leicht vergrößert und voll hell, ohne Pulsation.

Damit pro Frame **keine** Farbstrings gebaut werden (Allokationsverbot im Hot Path),
liegt beim Modulladen eine Tabelle bereit: pro Tier `GLOW_STEPS` vorberechnete Stufen
zwischen Basisfarbe und Weiß. `dashGlowLevel` wird auf einen Index quantisiert.

Bekannt und akzeptiert: Boids wickeln am Weltrand ohne Renderer-Clipping, ein Puls am
Rand springt also mit — das gilt heute schon für die Pfeilform.

## 6) Testfälle

### Engine (`cargo test`)

`dash_properties.rs` — niedrige Tiers können nie dashen · Unlock-Tier kann dashen ·
höhere Tiers laden kürzer und dashen schneller, nie unter `MINIMUM_DASH_CHARGE_STEPS`.

`dash.rs` — `begin_dash_charge` wird für nicht-dash-fähige Boids ignoriert · ein
ladender Boid behält sein normales Speed-Limit · ein dashender bekommt ein erhöhtes ·
die Aufladung endet mit einem Absprung zum Spieler · die Richtung bleibt eingefroren,
wenn der Spieler wegläuft · ein Boid im Cooldown startet keinen zweiten Dash · der
Cooldown endet in `Idle` · `dash_render_phase` ist 0 außerhalb des Dashs, in (0,1)
beim Laden und dort monoton steigend, in [-1,0) beim Dashen.

`dash_selection.rs` — keine Auswahl zwischen Selektionsrunden · keine Auswahl wenn
kein Boid dashen darf · zu nahe und zu ferne Boids werden nicht gewählt · keine
Auswahl bei vollen Slots · ein Boid im Cooldown belegt keinen Slot · größere Schwärme
dürfen mehr Dasher · ein geeigneter Boid wird in einer Selektionsrunde gewählt.

`overlap.rs` — Wrapping hält auch bei einem Sprung über mehr als eine Weltbreite ·
eine Welt der Größe 0 wird nicht angetastet · die Fallback-Richtung ist immer ein
Einheitsvektor.

`flock.rs` — ein dashender Boid ignoriert Cohesion und Alignment · ein Dash-Schritt
landet innerhalb der Welt · die Relaxation schiebt einen Dasher nicht von seiner Linie ·
der Schwarm hat über 1200 Schritte nie mehr Dasher als erlaubt · irgendein Boid dasht
tatsächlich (Schutz davor, dass das Feature stumm nie feuert).

`physics.rs` — `integrate` clamped auf das übergebene Limit · und lässt ein erhöhtes
Limit durch.

`wasm_bridge/mod.rs` — Boids aus Welle 1 und 2 können nicht dashen, ab Welle 3 schon.
Das ist der Test, der die Design-Entscheidung an die Wellennummer nagelt.

### Frontend (`npm test`)

Nur importfreie Logik ist unter Vitest (Node) abdeckbar; Simulationsmathematik wird
bewusst **nicht** in JavaScript gespiegelt.

`player/dashCooldown.test.js` — sofort verfügbar bei negativem Seed · blockiert
unmittelbar nach einem Dash · blockiert noch eine Millisekunde vor Ablauf · gibt genau
an der Grenze frei · Fortschritt leer im Dash-Schritt, halb bei halber Zeit, monoton
steigend, nie über 1, nie negativ · Cooldown 0 ergibt einen vollen Balken statt einer
Division durch Null.

`renderer/dashPulse.test.js` — Phase 0 ergibt Normalgröße und keinen Glow · der Boid
wird beim Laden nie kleiner als normal und nie unlesbar groß · ein dashender Boid ist
größer als ein ruhender · der Glow bleibt im 0..1-Bereich, mit dem die Farbtabelle
indexiert wird · ein dashender Boid ist durchgehend voll hell · **die Pulsfrequenz
steigt** (mehr Nulldurchgänge in der zweiten Hälfte der Aufladung als in der ersten) ·
die hellsten Spitzen liegen nahe am Absprung, nicht am Anfang.

### Manuell im Browser

- **Menü-Tastatur:** mit Tab auf „Start Game" und mit Leertaste aktivieren. Dasselbe
  für eine Option in „Developer Settings" und für die `<summary>` selbst.
- Spieler-Dash mit gehaltener Richtung; Balken leert und füllt sich über 1,4 s.
- Leertaste ohne Richtung verbraucht den Cooldown nicht; Nachdrücken im Cooldown tut nichts.
- Dash gegen die Wand stirbt dort, teleportiert nicht.
- Nach Game Over ist der Dash sofort wieder verfügbar, der Countdown öffnet ohne Nachhol-Schub.
- Bis Welle 2 pulsiert nichts. Ab Welle 3 pulsieren einzelne Boids zunehmend schneller
  und heller, stoßen geradlinig zu, lösen sich aus dem Schwarm, werden zurückgezogen.
  Nie mehr als ~3 gleichzeitig.
- Frametime-Graph in Welle 4–5: die Simulationskurve steigt durch die Dash-Auswahl nicht auffällig.

## 7) Aufwand

| Teil | Aufwand |
|---|--------:|
| Boid-Dash Engine (Zustandsmaschine, Auswahl, Grenze) | 4 h |
| Spieler-Dash Frontend (Eingabe, Bewegung, Cooldown) | 2,5 h |
| Darstellung (Puls, Cooldown-Balken) | 2 h |
| Tests (30 Rust, 21 JavaScript) | 2 h |
| Spec und Dokumentation | 1,5 h |
| **Summe** | **12 h** |

Bleibt im 14-h-Budget von S-05. Offen in S-05 sind damit noch Schild und Slow-Time.
