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

| Aspekt                | Festlegung                                                     |
| --------------------- | -------------------------------------------------------------- |
| Auslöser              | Leertaste (`event.code === 'Space'`)                           |
| Richtung              | die aktuell gehaltene Eingaberichtung (WASD / Pfeiltasten)     |
| Ohne Richtungseingabe | kein Dash, **Cooldown wird nicht verbraucht**                  |
| Wirkung               | Impuls auf `PLAYER_DASH_SPEED`, danach Abbau wie durch Reibung |
| Unverwundbarkeit      | keine — Ausweichen muss räumlich gelingen                      |
| Cooldown              | `PLAYER_DASH_COOLDOWN_MS`, gemessen auf der Simulationsuhr     |
| Anzeige               | Balken unten mittig, aufs Canvas gezeichnet                    |

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

Dash-Distanz aus den aktuellen Werten (1100 px/s, Abbau 1533 px/s², Basis 360 px/s):

```
Dauer der Rampe    = (1100 - 360) / 1533        ≈ 0,48 s
Überschussdistanz  = (1100 - 360)² / (2 · 1533) ≈ 179 px
Gesamtstrecke      ≈ (1100 + 360) / 2 · 0,48    ≈ 352 px
```

Die 179 px kommen zu den ~174 px hinzu, die der Spieler in derselben Zeit ohnehin
gelaufen wäre. Gut 350 px sind etwa elf Spielerdurchmesser (32 px) — genug, um aus
einer sich schließenden Front zu kommen, zu wenig, um quer über den Bildschirm zu
springen. Der Abbau stand ursprünglich auf 3000 px/s² (91 px Überschuss) und wurde
in zwei Schritten auf 1533 gesenkt; die Reichweite wird bewusst dort und nicht an
`PLAYER_DASH_SPEED` gestimmt, weil die Spitzengeschwindigkeit über das Tunneln durch
dünne Hindernisse entscheidet.

### Cooldown

```
isDashReady(t, tLastDash, cooldown)          = t - tLastDash >= cooldown
dashCooldownProgress(t, tLastDash, cooldown) = clamp((t - tLastDash) / cooldown, 0, 1)
```

`t` ist immer `gameData.simulationTimeMs`, **nie** Wall Time — ein Tab im
Hintergrund darf keinen Cooldown-Fortschritt verschenken.

### Edge Cases

| Fall                  | Verhalten                                                                                                                   |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Rundenstart           | `lastDashAtSimulationMs = -PLAYER_DASH_COOLDOWN_MS`, Dash ab Frame 1 verfügbar                                              |
| `beginRound()`        | Zeitstempel wird **mit** neu geseedet; `simulationTimeMs` springt dort auf 0 zurück                                         |
| Mehrschritt-Frame     | ein Tastendruck ergibt genau einen Dash (Latch, pro Schritt konsumiert)                                                     |
| Taste gehalten        | `event.repeat` wird verworfen — kein Dauer-Dash                                                                             |
| Dash in die Wand      | `clampToBounds` nullt die betroffene Achse **und** setzt die Obergrenze zurück, damit normale Bewegung den Boost nicht erbt |
| Fensterfokus verloren | `blur` löscht den Latch                                                                                                     |
| Leertaste im Menü     | Dash-Taste ist nur bei laufender Runde beansprucht (siehe unten)                                                            |

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

| Phase      | Was passiert                                                                                          |
| ---------- | ----------------------------------------------------------------------------------------------------- |
| `Charging` | Boid flockt normal weiter und pulsiert sichtbar                                                       |
| `Dashing`  | beim Eintritt wird die Geschwindigkeit **einmal** gesetzt: `direction * max_speed * speed_multiplier` |
| `Cooling`  | flockt normal, ist aber nicht wählbar                                                                 |
| `Idle`     | flockt normal und ist wieder wählbar                                                                  |

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

| Ansatz                       | Problem                                                                                                                                                  |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Zusätzliche Kraft            | `clamp_force` begrenzt die Summe auf `max_acceleration` — der Impuls käme mit ~2 % seiner Stärke an                                                      |
| `max_speed` temporär erhöhen | **alle vier** Steering-Regeln skalieren ihren Wunschvektor mit `max_speed`; ein 3× Speed würde Separation, Alignment, Cohesion und Seek mitverdreifachen |
| `integrate` umgehen          | zweiter Bewegungspfad, der irgendwann das Wrapping vergisst                                                                                              |

Angenehmer Nebeneffekt: im ersten Schritt nach dem Dash liefert `step_speed_limit`
wieder `max_speed`, und `.limit()` schneidet die Restgeschwindigkeit in einem Schritt
weg. Kein Nachglühen, kein zusätzlicher Abklingcode.

### Auswahl — deterministisch, ohne Zufallsgenerator

`Flock` bekommt einen `step_counter`; er ist der komplette Seed.
`select_dash_group` gibt fast immer eine leere Liste zurück:

1. nur wenn `step_counter % DASH_SELECTION_INTERVAL_STEPS == 0`,
2. nur wenn `count_busy_dashers < allowed_concurrent_dashers(len)`,
3. dann bis zu 8 Kandidaten über dieselbe Integer-Hash-Arithmetik wie
   `find_spawn_position`: `seed = runde*37 + versuch*17`, `index = (seed*97 + 31) % len`,
4. Kandidat muss `can_dash`, `Idle` und in `[MINIMUM, MAXIMUM]`-Distanz sein.

Gewürfelt wird einmal pro 24 Schritte für den **ganzen** Schwarm, nicht pro Boid pro
Schritt — es gibt also nichts nachzuwürfeln. Wer den Slot bekommt, ist durch
`begin_dash_charge` sofort nicht mehr `Idle` und für den ganzen Zyklus (bei Tier 2:
44 + 20 + 240 = 304 Schritte ≈ 5 s) nicht wählbar.

### Gruppen — ein Stoß statt eines Einzelgängers

Der gewürfelte Boid ist nicht der Dasher, sondern der **Anführer** einer Gruppe.
`collect_group_around` läuft danach einmal in Indexreihenfolge über den Schwarm und
nimmt jeden Boid auf, der

- denselben `difficulty_tier` wie der Anführer hat,
- höchstens `DASH_GROUP_RADIUS` (48 px) von ihm entfernt ist und
- dieselbe Eignungsprüfung wie der Anführer besteht,

bis `MAX_DASH_GROUP_SIZE` (6) oder die Zahl der freien Slots erreicht ist. Findet sich
niemand, dashe der Anführer allein — der Einzeldash ist also der Randfall der Gruppe
und kein zweiter Codepfad.

Der Tier-Vergleich trägt zwei Lasten. Sichtbar: mehrere gleichfarbige Boids lesen sich
als ein abgestimmter Stoß, ein gemischtes Häufchen als Rauschen. Mechanisch: Boids eines
Tiers teilen ihre `charge_steps`, die Gruppe pulst also synchron und startet im
**selben** Simulationsschritt. Ein tierübergreifender Trupp würde gestaffelt losfliegen
und damit genau die Lesbarkeit verlieren, um die es geht.

`DASH_GROUP_RADIUS` liegt bewusst unter `DEFAULT_PERCEPTION_RADIUS` (70 px): eine Gruppe
ist ein Verband, der ohnehin schon zusammen fliegt, nicht ein über den Bildschirm
zusammengesuchtes Kommando. Bei der Packungsdichte des Schwarms enthalten diese 48 px
mehr Boids, als eine Gruppe fassen kann — der Radius begrenzt die Gruppe also praktisch
nie, `MAX_DASH_GROUP_SIZE` und die freien Slots tun es.

Die Slot-Grenze ist unverändert die Obergrenze — nicht die Gruppengröße. Bleiben nur
zwei Slots frei, dashen zwei Boids gemeinsam statt sechs.

Harte Obergrenze: `MAX_CONCURRENT_DASHING_BOIDS` (12) plus ein Slot je 40 Boids, also
12 im Startschwarm und 15 bei 156 Boids. Die 12 sind mit der Verdichtung vom
2026-08-01 aus 8 hervorgegangen, damit die Grenze zwei volle Gruppen trägt.

Die Distanzschranken heißen `..._SELECTION_DISTANCE` und nicht `..._LAUNCH_DISTANCE`,
weil der Boid während seiner ~44 Charge-Schritte weiter flockt und dabei bis zu gut
200 px näher kommt (44 Schritte à 4,6 px). Ein bei 340 px gewählter Boid springt typischerweise aus 170–300 px ab.

### Tuning und Schwierigkeitskurve

Der Dash ist ab `DASH_UNLOCK_DIFFICULTY_TIER = 2` freigeschaltet. Der Tier ist
`wave - 1`, also ab **Welle 3**. Die beiden ersten Wellen bleiben ein reiner Schwarm
zum Einlernen.

Die Sperre ist ein eigenes `can_dash: bool` und **nicht** `charge_steps == 0`: null
Charge-Schritte ist ein legitimer Tuning-Wert („Dash ohne Vorwarnung") und darf nicht
versehentlich Welle-1-Boids freischalten.

Werte für die beiden Endpunkte der Kurve:

|                 | Tier 2 (Welle 3)            | Tier 4 (Welle 5+)           |
| --------------- | --------------------------- | --------------------------- |
| Vorwarnung      | 44 Schritte (0,73 s)        | 34 Schritte (0,57 s)        |
| Dash-Dauer      | 20 Schritte (0,33 s)        | 22 Schritte (0,37 s)        |
| Geschwindigkeit | 4,6 × 3,0 = 13,8 px/Schritt | 5,5 × 3,4 = 18,7 px/Schritt |
| Reichweite      | ~276 px                     | ~411 px                     |
| Cooldown        | 240 Schritte (4 s)          | 180 Schritte (3 s)          |

Der Spieler bewegt sich mit 360 px/s = 6 px/Schritt, ein Dash also mit 2,3–3,1× der
Spielergeschwindigkeit. Ein stehender Spieler wird getroffen; ein bewegter braucht
gut 21 px Seitversatz (`BOID_HIT_RADIUS` = 10,5, verdoppelt — seit dem 2026-08-01 vom
Hindernis-Radius des Spielers getrennt) und hat 0,57–0,73 s Vorwarnung dafür. `MINIMUM_DASH_CHARGE_STEPS = 24` ist die Untergrenze,
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

| Wert         | Bedeutung                                       |
| ------------ | ----------------------------------------------- |
| `0.0`        | nichts zu zeichnen (`Idle` oder `Cooling`)      |
| `0 < v < 1`  | lädt auf; `v` ist der Fortschritt der Aufladung |
| `-1 ≤ v < 0` | dasht; `-v` ist der noch verbleibende Anteil    |

Die Zählerbereiche garantieren, dass keine der beiden Spannen `0.0` erreicht — das
Vorzeichen ist also eindeutig, und „idle" kann nicht mit „hat gerade angefangen zu
laden" verwechselt werden.

Ein `Uint32Array`-Zustand _plus_ `Float32Array`-Fortschritt wäre zwei zusätzliche
Buffer-Kopien pro Frame (3 → 5 statt 3 → 4) für Information, die in eine Zahl passt.
Sollte je ein weiterer Sichtzustand nötig werden („Dash abgebrochen"), ist das der
Moment für den getrennten Zustands-Buffer — nicht jetzt.

### Zweiter Buffer: die Vorwarnlinie

Für die Richtung reicht eine Zahl pro Boid **nicht**, und index-gleich muss sie auch nicht
sein: es laden höchstens ~15 von bis zu 156 Boids gleichzeitig auf. `dash_aims` ist deshalb
ein Buffer mit eigener Anzahl wie `obstacles` und `spawn_markers` —
`DASH_AIM_STRIDE = 5` Werte pro **ladendem** Boid:

| Index | Wert                                                                |
| ----- | ------------------------------------------------------------------- |
| 0, 1  | Startpunkt: die Position des Boids                                  |
| 2, 3  | Endpunkt: wohin der Dash führte, wenn er in diesem Schritt losginge |
| 4     | Ladefortschritt, also derselbe Wert wie in `dash_phases`            |

Ein Eintrag existiert nur während `Charging`. Damit ist der Vorzeichentrick hier so
überflüssig wie bei `spawn_markers`: die Anzahl sagt schon, wie viele Linien es gibt, und
jeder Wert im Buffer ist ein echter. Der Ladefortschritt steht trotz `dash_phases` ein
zweites Mal drin, weil genau der Index fehlt, mit dem man ihn dort fände.

Die Geometrie kommt aus `simulation/dash/aim.rs`, und das ist der Punkt der ganzen
Konstruktion: `launch_direction` und `dash_distance` liegen dort, `launch_dash` in `dash/state.rs`
benutzt dieselbe Funktion. Die Linie kann also keine Richtung versprechen, die der Absprung
nicht nimmt. Ein im Frontend nachgerechnetes `normalize(player − boid)` plus eine dort
gespiegelte Reichweitentabelle wären zwei Kopien von Simulationswissen, die beim nächsten
Tuning auseinanderlaufen.

`build_frame_response` braucht dafür die Spielerposition, `snapshot()` bekommt keine. Also
merkt sich `GameEngine` die des letzten `tick` (`last_player_position`). Das ist keine
Näherung: ein Snapshot zeichnet eine eingefrorene Welt (Countdown, Tod, Pause), in der sich
seither nichts bewegt hat.

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

### Die Linie: wohin

Der Puls sagt _dass_ und _wann_. Die dritte Frage — _wohin_ — kann er nicht beantworten, und
sie ist die, die über Ausweichen entscheidet. `renderer/dashAimLayer.js` zeichnet sie:
je ladendem Boid eine dünne rote gestrichelte Linie vom Boid zum Endpunkt aus dem Buffer,
`lineWidth` 1,5 Weltunits wie der Boid-Umriss, Strichmuster `[10, 8]`.

```
dashAimAlpha(p) = AIM_MINIMUM_ALPHA + (1 - AIM_MINIMUM_ALPHA) * p
```

Die Funktion liegt bei `dashPulseScale` und `dashGlowLevel` in `dashPulse.js` — dieselbe
Eingabe, dieselbe Aufgabe, importfreies Modul. Drei Zahlen aus einer Phase.

Vier Festlegungen und ihr Grund:

- **Volle Länge von Anfang an, steigende Deckkraft.** Die Länge ist die Information
  („so weit komme ich"), sie darf nicht animiert sein. Die Deckkraft steigt monoton statt
  mitzupulsieren: der Boid pulst schon, zwei Animationen nebeneinander sind ein Signal zu viel.
- **Untergrenze `0,25` statt Aufblenden aus Null.** Die Vorwarnung dauert 0,57–0,73 s; eine
  Linie, die aus dem Nichts hochfährt, wäre ein Drittel davon unsichtbar. Dasselbe Argument
  wie bei `SPAWN_MARKER_MINIMUM_INTENSITY`.
- **Haarlinie und gestrichelt.** Bei einem Gruppenstoß liegen bis zu sechs Linien
  gleichzeitig auf dem Spieler; sechs durchgezogene rote Striche lesen sich als Käfig statt
  als Warnung. Rot ist trotzdem richtig — es ist die Farbe des Schwarms und alles, was
  Leben kostet —, und die Hausregel verbietet große rote _Flächen_, nicht rote Striche.
- **Zeichenreihenfolge:** über den Dash-Schweifen, unter allem, was sich bewegt. Die Linie
  ist eine Aussage über den Boid an ihrem Anfang, also muss der Boid darauf liegen, und der
  Spieler, auf den sie zeigt, ebenfalls.

Die Linie **zielt mit**, statt beim Ladebeginn einzufrieren. Das ist die eigentliche
Entscheidung dieses Features und folgt aus §3: die Richtung entsteht erst im Absprungschritt.
Eine eingefrorene Richtung wäre ein Versprechen und ließe jeden bewegten Spieler jedem Dash
entkommen — bei 0,57–0,73 s Vorwarnung und 222–277 px Reichweite wäre der Boid-Dash damit
wirkungslos. Was die Linie stattdessen lesbar macht, ist die **Reichweite**: endet sie vor
dem Spieler, kommt dieser Boid von dort nicht an; läuft sie über ihn hinaus, kommt er an.

## 6) Testfälle

### Engine (`cargo test`)

`dash/properties.rs` — niedrige Tiers können nie dashen · Unlock-Tier kann dashen ·
höhere Tiers laden kürzer und dashen schneller, nie unter `MINIMUM_DASH_CHARGE_STEPS`.

`dash/state.rs` — `begin_dash_charge` wird für nicht-dash-fähige Boids ignoriert · ein
ladender Boid behält sein normales Speed-Limit · ein dashender bekommt ein erhöhtes ·
die Aufladung endet mit einem Absprung zum Spieler · die Richtung bleibt eingefroren,
wenn der Spieler wegläuft · ein Boid im Cooldown startet keinen zweiten Dash · der
Cooldown endet in `Idle` · `dash_render_phase` ist 0 außerhalb des Dashs, in (0,1)
beim Laden und dort monoton steigend, in [-1,0) beim Dashen.

`dash/aim.rs` — die Distanz ist `dash_speed × dash_steps` · der Endpunkt liegt genau diese
Distanz entfernt · die Richtung zeigt auf den Spieler · sie folgt ihm während des Aufladens ·
Fallback auf das Heading, wenn der Spieler auf dem Boid steht, und auf `(1,0)`, wenn auch das
fehlt · **die Linie lügt nicht**: das Ziel einen Schritt vor dem Absprung und die Richtung,
die `launch_dash` dann schreibt, stimmen bei stehendem Spieler überein.

`dash/selection.rs` — keine Auswahl zwischen Selektionsrunden · keine Auswahl wenn
kein Boid dashen darf · zu nahe und zu ferne Boids werden nicht gewählt · keine
Auswahl bei vollen Slots · ein Boid im Cooldown belegt keinen Slot · größere Schwärme
dürfen mehr Dasher · ein geeigneter Boid wird in einer Selektionsrunde gewählt ·
benachbarte Boids desselben Tiers werden als Gruppe gewählt · jeder Boid steht
höchstens einmal in der Gruppe · ein Boid ohne Nachbarn wird allein gewählt · nur der
Tier des Anführers tritt der Gruppe bei · die Gruppe bleibt unter der Zahl freier
Slots · ein nicht-`Idle`-Boid tritt keiner Gruppe bei.

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

### WASM-Grenze (`wasm-pack test`, `engine/tests/wasm_dash_aim_tests.rs`)

`cargo test` meldet für diese Datei **0 Tests** — sie läuft nur im Browser.

Bufferlänge ist `dash_aim_count × 5` · Welle 1 und 2 kündigen nichts an · **eine Linie
existiert genau so lange wie der Puls**: über 600 Ticks ist `dash_aim_count` immer gleich der
Zahl der Boids mit `dash_phases[i] > 0`, also eine pro Ladendem und keine für einen, der schon
dasht · jeder Startpunkt ist die Position eines Boids (der Stride-Fänger, weil dieser Buffer
keine Index-Gleichheit hat) · jeder Ladefortschritt liegt in (0,1) · jede Strecke ist länger
als ein Boid und kürzer als die Weltdiagonale, und alle Linien einer Welle sind gleich lang ·
ein `snapshot` liefert dieselben Linien wie der `tick` davor.

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
die hellsten Spitzen liegen nahe am Absprung, nicht am Anfang · `dashAimAlpha` ist 0 für einen
nicht ladenden Boid (auch für einen dashenden — die zweite Sperre neben dem leeren Buffer),
ist ab dem ersten Ladeschritt deutlich sichtbar, erreicht am Absprung 1, steigt monoton und
klemmt einen Fortschritt, den die Engine nicht schicken sollte.

`renderer/dashAimLayer.test.js` — nichts bei Anzahl 0 und bei fehlendem Buffer · jede Linie
wird von ihrem eigenen Start- zu ihrem eigenen Endpunkt gezeichnet (der Stride-Fänger) · ein
`stroke` pro ladendem Boid · `save`/`restore` als erster und letzter Aufruf, weil ein
entwichenes Strichmuster jeden späteren Strich strichelt · das Muster wird einmal pro Ebene
gesetzt, nicht pro Linie · später im Ladevorgang wird kräftiger gezeichnet als früh · zwei
Linien gleichen Fortschritts bekommen denselben String, was zeigt, dass die vorberechnete
Farbtabelle benutzt wird und nicht pro Frame ein `rgba(...)` entsteht.

### Manuell im Browser

- **Menü-Tastatur:** mit Tab auf „Start Game" und mit Leertaste aktivieren. Dasselbe
  für eine Option in „Developer Settings" und für die `<summary>` selbst.
- Spieler-Dash mit gehaltener Richtung; Balken leert und füllt sich über 1,4 s.
- Leertaste ohne Richtung verbraucht den Cooldown nicht; Nachdrücken im Cooldown tut nichts.
- Dash gegen die Wand stirbt dort, teleportiert nicht.
- Nach Game Over ist der Dash sofort wieder verfügbar, der Countdown öffnet ohne Nachhol-Schub.
- Ab Welle 3 zieht jeder ladende Boid eine dünne rote gestrichelte Linie auf den Spieler, die
  im Absprungmoment verschwindet und dem Ion-Streak Platz macht; ein Verband zeigt mehrere
  zusammenlaufende Linien. Bewegt man sich, dreht die Linie mit. Weil Welle 3 in einem echten
  Lauf selten erreicht wird, dafür `DASH_UNLOCK_DIFFICULTY_TIER = 1` setzen und
  `WAVE_DURATION_SECONDS` kürzen — **nicht** Tier 0: `build_boid` gibt Tier 0 die
  Default-Properties, deren `can_dash` fest `false` ist, der Unlock-Wert wird dort also gar
  nicht gelesen.
- Bis Welle 2 pulsiert nichts. Ab Welle 3 pulsieren einzelne Boids und kleine Verbände
  gleichfarbiger Boids zunehmend schneller und heller, stoßen geradlinig zu, lösen sich
  aus dem Schwarm, werden zurückgezogen. Ein Verband pulst und startet synchron.
  Nie mehr als ~8 gleichzeitig, nie mehr als 4 pro Stoß.
- Frametime-Graph in Welle 4–5: die Simulationskurve steigt durch die Dash-Auswahl nicht auffällig.

## 7) Aufwand

| Teil                                                 |  Aufwand |
| ---------------------------------------------------- | -------: |
| Boid-Dash Engine (Zustandsmaschine, Auswahl, Grenze) |      4 h |
| Spieler-Dash Frontend (Eingabe, Bewegung, Cooldown)  |    2,5 h |
| Darstellung (Puls, Cooldown-Balken)                  |      2 h |
| Tests (30 Rust, 21 JavaScript)                       |      2 h |
| Spec und Dokumentation                               |    1,5 h |
| Vorwarnlinie (Aim-Buffer, Layer, 16 Tests, Doku)     |      2 h |
| **Summe**                                            | **14 h** |

Die Vorwarnlinie ist **nachträglich** dazugekommen und war in der ersten Fassung dieser Spec
nicht vorgesehen: dort galt „für die Vorwarnung reicht eine Zahl pro Boid", was für _dass_ und
_wann_ stimmt und für _wohin_ nicht. Die 2 h liegen zu etwa gleichen Teilen im siebten Buffer
samt seinen Grenztests und in der Zeichenebene; ein Teil davon ging in die Aufteilung von
`wasm_bridge/mod.rs`, die der neue Buffer über die 400-Zeilen-Grenze geschoben hat.

Damit ist das ursprüngliche 14-h-Budget von S-05 genau ausgeschöpft. Offen in S-05 ist nur
noch Slow-Time, das laut §3.4 von `specs-overview.md` bewusst entfällt.
