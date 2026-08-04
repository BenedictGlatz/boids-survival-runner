# S-05b — Power-ups (Aegis, Overdrive und Mend)

Blickwinkel: Gameplay-Fähigkeit, Frontend

Teil-Spec zu **S-05 Steuerung & Power-Ups**. Beschreibt die Spielerfähigkeiten neben dem
Dash aus [S-05a](spec-s05-dash.md): **Aegis**, ein Schild, der am ersten Treffer bricht und
danach eine Sekunde lang unverwundbar macht, **Overdrive**, eine zeitweise erhöhte
Höchstgeschwindigkeit, und **Mend**, das ein Lebenssegment zurückgibt. Alle drei werden als
Marker in der Arena aufgesammelt.

Der tragende Unterschied läuft nicht zwischen den drei Wirkungen, sondern zwischen zwei
Arten von Power-up: Aegis und Overdrive sind **Zustände**, die laufen; Mend ist ein
**Ereignis**, das eintritt. Daran hängen Anzeige, Zustandshaltung und Testbarkeit
gleichermaßen, und die Regel für ein viertes Power-up steht in §8.

Gestaltungsvorgabe ist `docs/design_system/design-system.md` §11; die dort
vorgeschlagenen Zahlen sind hier als Festlegung übernommen.
`AEGIS_ABSORB_INVULNERABILITY_MS` ist die eine Zahl, die dort nicht vorkommt — sie stammt
aus einem Spieltest und ist in §4 begründet.

## 1) Zweck

**Fachlich:** Der Dash ist eine Fähigkeit, die immer da ist und nur auf ihren Cooldown
wartet. Er beantwortet die Frage „wie komme ich hier raus", aber er gibt der Arena
selbst keinen Inhalt: außer dem Schwarm und den Hindernissen aus S-07 gibt es nichts,
worauf sich hinzulaufen lohnt. Die beiden Power-ups sind dieser Inhalt. Sie legen einen
zweiten, freiwilligen Druck über den Fluchtdruck — der kürzeste Weg vom Schwarm weg und
der Weg zum Marker sind selten derselbe.

Die Wirkungen sind bewusst gegensätzlich: Aegis erlaubt, einen Fehler zu machen,
Overdrive erlaubt, keinen zu machen. Ein Schild belohnt Hineingehen, mehr Tempo belohnt
Herauskommen. Mend liegt quer zu beiden — es belohnt nicht, es korrigiert: es ist das
einzige Power-up, das etwas bereits Verlorenes zurückholt, und damit das einzige, dessen
Wert davon abhängt, wie die Runde bisher gelaufen ist. Genau daraus folgen seine
Sonderregeln in §3, denn ein Fund, den man nicht brauchen kann, ist kein Fund.

**Technisch:**

- Alles lebt **vollständig im Frontend**. Die Engine kennt vom Spieler nur eine
  Position pro `tick()`; Integration, Unverwundbarkeit, Lebensabzug und -gutschrift liegen
  in `player/playerController.js` und `round/roundData.js`. Die WASM-Signatur ändert sich
  nicht, es kommt kein Puffer über die Grenze dazu.
- Die Regeln liegen in `powerups/powerups.js` und sind frei von Canvas und DOM, also
  unter Vitest prüfbar — dieselbe Trennung wie `player/dashCooldown.js` gegen
  `renderer/dashPulse.js`. Drei Nachbarmodule tragen je einen abgeschlossenen Teil:
  `powerups/markerClearance.js` die Hindernisgeometrie, `powerups/markerLifetime.js` die
  Liegezeit eines Markers samt seinen beiden Animationen und seiner Rücknahme, und
  `powerups/mend.js` alles, was Mend über Leben weiß.
- **`PowerupField` schreibt nie einen Lebenszähler**, es liest ihn. Die Gutschrift
  passiert in `roundData.restoreLives`, dem Gegenstück zu `registerHit` und wie dieses der
  einzige Trichter seiner Richtung.
- Alle Zeitmessung läuft auf `gameData.simulationTimeMs`, hereingereicht als Parameter.
  Das Modul führt **keine eigene Uhr**.

## 2) Zustandsmodell

Sieben Dinge existieren nebeneinander und werden getrennt gehalten:

| Zustand           | Lebensdauer                                               | Träger                                     |
| ----------------- | --------------------------------------------------------- | ------------------------------------------ |
| **Marker**        | bis `expiresAtMs`, gesetzt auf `MARKER_LIFETIME_MS`       | `_markers[]`, Position und Art             |
| **Rücknahme**     | `OBSTACLE_RETIRE_FADE_MS` ab Verdeckung                   | `marker.retiringSinceMs`, nur Darstellung  |
| **Buff**          | `AEGIS_DURATION_MS` / `OVERDRIVE_DURATION_MS` ab Aufnahme | `_buffs`, Art → `endsAtMs`                 |
| **Shatter**       | `SHATTER_MS` ab absorbiertem Treffer                      | `_shatterAtMs`, nur Darstellung            |
| **Aegis-Fenster** | `AEGIS_ABSORB_INVULNERABILITY_MS` ab dem Bruch            | `_absorbInvulnerableUntilMs`, Spielwirkung |
| **Mend-Bogen**    | `MEND_ARC_SECONDS` ab Aufnahme                            | `MendState._grantedAtMs`, nur Darstellung  |
| **Inertheit**     | dauerhaft, folgt dem Lebensstand                          | `MendState._inertAmount`, nur Darstellung  |

Ein Marker wird beim Einsammeln in einen Buff überführt; beide sind nie derselbe
Datensatz. Aegis und Overdrive sind die einzigen beiden, die in `_buffs` landen — **Mend
erzeugt keinen Buff**, weil es keinen Zustand hat, der laufen könnte. Shatter, Mend-Bogen
und Inertheit sind reine Nachwirkung bzw. Darstellung und haben keine Spielwirkung. Das
Aegis-Fenster ist die eine Nachwirkung, die eine hat: es steht neben dem Shatter, dauert
länger als er und ist der Grund, warum die beiden getrennte Zeitstempel sind.

Mends Zustand ist damit vollständig: ein Zeitstempel für den Bogen und eine Zahl für die
Marker-Farbe. Beide liegen in `powerups/mend.js` — weil die Lebensabhängigkeit der einzige
Grund ist, warum das Power-up-Thema überhaupt von Leben weiß, und ein Grund, der in einem
Satz steht, auch in einer Datei stehen kann.

### Festgelegte Werte

| Konstante                         | Wert      | Warum                                                                            |
| --------------------------------- | --------- | -------------------------------------------------------------------------------- |
| `AEGIS_DURATION_MS`               | 6500 ms   | lang genug, eine Formation zu überstehen, kurz genug, ihn ausgeben zu müssen     |
| `AEGIS_ABSORB_INVULNERABILITY_MS` | 1000 ms   | Unverwundbarkeit ab dem Treffer, der den Schild bricht; siehe §4                 |
| `OVERDRIVE_DURATION_MS`           | 6000 ms   | etwa eine Arenaquerung bei erhöhtem Tempo                                        |
| `OVERDRIVE_FACTOR`                | 1,6       | spürbar; siehe §4                                                                |
| `SPAWN_INTERVAL_MS`               | 9000 ms   | seltener als eine Welle (15 s), häufiger als ein Leben verloren geht             |
| `MARKER_LIFETIME_MS`              | 12 000 ms | ein Marker, der ewig liegt, ist keine Entscheidung mehr                          |
| `OBSTACLE_RETIRE_FADE_MS`         | 350 ms    | Rücknahme eines verdeckten Markers; siehe §3                                     |
| `MAX_MARKERS`                     | 2         | mehr macht die Arena zur Sammelaufgabe                                           |
| `MIN_SPAWN_DISTANCE`              | 220 px    | Abstand zum Spieler und zwischen Markern                                         |
| `MIN_OBSTACLE_CLEARANCE`          | 70 px     | Markerradius 27 + Spielerradius 16 + Reserve                                     |
| `COLLECT_RADIUS`                  | 39 px     | größer als die Zeichnung (27 px); siehe §3                                       |
| `SHATTER_MS`                      | 350 ms    | Dauer der Splitteranimation                                                      |
| `MEND_SEGMENTS`                   | 1         | voll heilen macht die vorherige Runde bedeutungslos; siehe §4                    |
| `INERT_FADE_MS`                   | 300 ms    | Übergang eines Mend-Markers nach Slate und zurück                                |
| `MEND_ARC_SECONDS`                | 0,45 s    | lang genug, um im Blickfeld zu landen, kurz genug, um kein Restzeitbogen zu sein |

Die Werte liegen im Modul, nicht in `gameConfig.js` — wie schon die Schweif-Konstanten
in `renderer/dashTrail.js`. `gameConfig.js` trägt, was über Modulgrenzen hinweg gilt;
die Abstimmung dieser Zahlen aufeinander gilt nur innerhalb des Power-up-Themas. Die eine
Ausnahme ist `MEND_ARC_SECONDS`: es steht in `renderer/mendPulse.js`, weil es eine
Zeichendauer ist, und wird von der Regelseite von dort **gelesen** statt ein zweites Mal
hingeschrieben — dasselbe Verfahren, mit dem der Einsammelring seine Dauer aus
`LAUNCH_RING_SECONDS` bezieht.

## 3) Spawn und Aufnahme

### Spawn-Regel

Alle `SPAWN_INTERVAL_MS` wird **ein** Versuch unternommen. Die Art zyklt
deterministisch (`aegis`, `mend`, `overdrive`, `aegis`, …) statt gewürfelt zu werden: zwei
Schilde hintereinander sind für einen Spieler bei voller Gesundheit ein Nichtgewinn, und
Zufall, der Nichtgewinne erzeugt, ist kein interessanter Zufall.

Mend steht in der Reihenfolge **zwischen** den anderen beiden, kann also nie zweimal
hintereinander an der Reihe sein. Sonst kosten zwei Treffer in Folge nichts mehr, und ein
Survival-Runner, in dem Treffer nichts kosten, hat sein Thema verloren.

Bei voller Gesundheit wird Mend **übersprungen**, nicht totgeboren:

```
angebot := KINDS[nextKind mod 3]
wenn angebot = 'mend' und nicht canMend():   überspringen := 1
art := KINDS[(nextKind + überspringen) mod 3]
```

`nextKind` wird erst **nach** einer erfolgreichen Platzierung um `1 + überspringen`
weitergezählt. Ein Versuch, der keinen Platz findet, verbraucht die Reihenfolge also
nicht — sonst könnte eine gerade zugestellte Arena ein Angebot still schlucken.

Die Position wird per Rückweisungsstichprobe gesucht, bis zu zwölf Versuche:

```
x := worldWidth  * (0,1 + random() * 0,8)
y := worldHeight * (0,1 + random() * 0,8)

verwerfen, wenn  dist(x, y, player)            <  MIN_SPAWN_DISTANCE
verwerfen, wenn  dist(x, y, anderer Marker)    <  MIN_SPAWN_DISTANCE
verwerfen, wenn  distToCapsule(x, y, obstacle) <  MIN_OBSTACLE_CLEARANCE   für ein Hindernis
```

Schlagen alle zwölf Versuche fehl, entsteht in diesem Intervall kein Marker; der
nächste Versuch folgt regulär `SPAWN_INTERVAL_MS` später. Das ist bewusst kein
Fehlerfall — eine Arena, die gerade voll ist, soll nicht zusätzlich Marker bekommen.

Die inneren 80 % der Welt sind das Spawn-Gebiet, damit kein Marker so dicht an der
Weltkante liegt, dass er nur durch Andrücken erreichbar ist.

### Hindernis-Abstand

Ein Hindernis ist eine Kapsel: ein Strichsegment mit Radius, gelesen aus dem
`OBSTACLE_STRIDE`-Puffer (`startX, startY, endX, endY, radius, …`). Der Abstand eines
Punktes zur Kapsel ist der Abstand zum Segment minus dessen Radius:

```
distToCapsule(p, o) = distToSegment(p, o.start, o.end) - o.radius
```

`distToSegment` ist die übliche Projektion auf das Segment mit Klemmung des Parameters
auf [0, 1]; ein Segment der Länge null (ein Kreis-Hindernis) fällt dabei auf den
Punktabstand zurück und braucht keine Fallunterscheidung.

Ohne diese Prüfung kann ein Marker in einer Hazard-Kapsel landen. Der Spieler wird von
Hindernissen weggeschoben und verliert dabei ein Leben — der Marker wäre also nicht nur
unerreichbar, sondern eine Falle.

### Rücknahme eines verdeckten Markers

Die Spawn-Prüfung deckt nur die eine Richtung ab. Hindernisse entstehen aber **während** ein
Marker liegt — etwa im selben Rhythmus, in dem Marker entstehen, und jedes steht danach 40 s —
also wächst regelmäßig eines über einen Marker, der schon lag. Deshalb wird jeder Marker pro
Simulationsschritt gegen die Hindernisse geprüft:

```
verdeckt, wenn  distToCapsule(marker, obstacle) < PICKUP_RADIUS   für ein Hindernis
```

Ein verdeckter Marker bekommt `retiringSinceMs` **einmalig** gesetzt und skaliert über
`OBSTACLE_RETIRE_FADE_MS` weg — die Umkehrung des Einblendens. Einmalig, weil ein Hindernis unter
ihm ablaufen kann: ein Marker, der wiederkäme, nachdem er angefangen hat zu gehen, flackert, statt
eines von beidem zu sein. Aufsammeln ist ab dem Setzen nicht mehr möglich.

Zwei Festlegungen tragen das:

- **Die Schwelle ist enger als beim Platzieren** — `PICKUP_RADIUS` (27) statt
  `MIN_OBSTACLE_CLEARANCE` (70). Beides fragt `isTooCloseToAnObstacle` mit unterschiedlichem
  Abstand, und die Hysterese ist die eigentliche Aussage: leicht liegen zu lassen, schwer
  wegzuwerfen. Bei 70 px würde jedes Hindernis, das irgendwo in der Umgebung entsteht, einen
  bequem erreichbaren Marker löschen — die Behandlung würde mehr Marker kosten als der Fehler.
- **Der Restzeitring wird nicht gekürzt.** Er zeigt weiter die ehrliche Lebensdauer; das Gehen
  trägt allein die Skalierung. Würde stattdessen `expiresAtMs` vorgezogen, spränge der Ring in
  einem Bild von seinem Stand auf fast null — und ein Countdown, der springt, ist keiner mehr.

`OBSTACLE_RETIRE_FADE_MS` (350 ms) liegt bewusst innerhalb von `OBSTACLE_ARMING_STEPS` (90
Schritte, 1,5 s), der Zeit, die ein neues Hindernis nur gezeichnet und noch nicht fest ist. Der
Marker ist also weg, **bevor** das Hindernis, das ihn geholt hat, jemanden ein Leben kosten kann.

### Aufnahme

```
aufnehmen, wenn  dist(player, marker) <= COLLECT_RADIUS
                 und nicht (art = 'mend' und nicht canMend())
```

`COLLECT_RADIUS` (39 px) ist größer als der gezeichnete Marker (27 px). Ein Spieler, der
im Dash vorbeistreift, legt in einem Simulationsschritt 1100 / 60 ≈ 18 px zurück — eine
Trefferfläche in Größe der Zeichnung ließe ein Streifen wie einen gestohlenen Treffer
wirken.

Pro Schritt wird höchstens **ein** Marker aufgenommen. Bei zwei überlappenden Markern
gewinnt der ältere; der zweite liegt einen Schritt später immer noch da.

### Der inerte Mend-Marker

Die zweite Bedingung deckt den Fall ab, den die Spawn-Regel nicht erwischt: Die Gesundheit
wird voll, **während** ein Mend-Marker schon liegt. Er verschwindet dann **nicht**, sondern
wird über `INERT_FADE_MS` inert — Kontur und Glyphe driften nach Slate `#94A3B8`, Glow und
Rotation gehen aus, der Hub bleibt. Aufsammeln ist nicht möglich, man läuft hindurch;
sinkt die Gesundheit wieder, kommt er auf demselben Weg zurück.

Begründung, und sie ist eine Abwägung zwischen zwei Enttäuschungen: Ein Marker, der vor
den Augen des Spielers verschwindet, wirkt gestohlen — zumal er in dem Moment
verschwinden würde, in dem der Spieler etwas Gutes getan hat. Einer, der grau wird,
erklärt sich selbst und bleibt als Wegmarke erhalten. Der Übergang läuft über eine
Zehntelsekunde mehr als drei Bilder, weil ein Marker, der zwischen zwei Bildern umschaltet,
wie ein **anderer** Marker gelesen wird und nicht wie derselbe, der leise wird.

`_inertAmount` wird pro **Simulationsschritt** um `SIMULATION_STEP_MS / INERT_FADE_MS`
bewegt, nicht pro Bild. Die Farbe eines Markers ist Darstellung, ihr Fortschritt aber
gehört an die einzige Uhr des Spiels — sonst driftet er mit der Bildrate.

## 4) Wirkung

### Aegis

Aegis bricht am ersten Treffer — unabhängig davon, was sein Zeitbogen noch anzeigte.
Dauer und Ladung sind derselbe Zustand: ein Schild, der absorbiert, ist vorbei. Was er
hinterlässt, ist ein **Fenster** von `AEGIS_ABSORB_INVULNERABILITY_MS` ab genau diesem
Treffer, in dem jeder weitere Treffer ebenfalls kostenlos ist.

Der Schild wird nur befragt, wenn der Treffer tatsächlich zählen würde:

```
if isPlayerInvulnerable(roundData):  return          # Gnadenfrist, kostet ohnehin nichts
if powerups.absorbHit(t):            return          # Schild bricht, oder sein Fenster läuft
registerHit(roundData)
```

Die Reihenfolge ist die Aussage. Ein Schild, der während der 900-ms-Gnadenfrist nach
einem Treffer verbraucht würde, wäre auf Schaden verschwendet, den es gar nicht gab.

Das Fenster ist eine **Korrektur einer früheren Festlegung**, nicht eine zusätzliche
Wirkung. Ursprünglich fraß Aegis genau einen Treffer und war danach weg; damit war er für
den einen Zug unbrauchbar, für den er gedacht ist. Ein Dash durch eine Formation setzt drei
oder vier Boids innerhalb weniger Schritte auf den Spieler — der erste hat den Schild
gefressen, der zweite kostete trotzdem ein Leben, und der Unterschied zwischen „Schild
aufgesammelt" und „Schild nicht aufgesammelt" war für diesen Zug null. Eine Ladung kauft
deshalb eine Passage, nicht ihren ersten Boid.

Getragen wird das Fenster von `PowerupField` (`_absorbInvulnerableUntilMs`) und nicht von
`roundData`: `lastHitAtSimulationMs` gehört dem verlorenen Leben, und ein absorbierter
Treffer hat keines gekostet. Die Fähigkeit hält damit ihren eigenen Zustand, und der
Lebensabzug bleibt vollständig bei `registerHit` — dem einzigen Trichter, durch den jeder
Schaden geht.

Sichtbar wird das Fenster über `playerInvulnerable` im renderState, das aus **zwei** Quellen
verodert wird: der Gnadenfrist nach einem Treffer und dem Fenster eines gebrochenen Schilds.
Der amberfarbene Spieler ist das bestehende Wort des Spiels für „unantastbar" — Aegis ist
derselbe Zustand, nur früher gekauft, und braucht dafür keine zweite Optik. Der Shatter
(350 ms) bleibt das Ereignis „der Schild ist weg"; die restlichen 650 ms trägt die Farbe.

### Overdrive

Overdrive ist ein Faktor auf `PLAYER_MAX_SPEED`:

```
maxSpeed := PLAYER_MAX_SPEED * OVERDRIVE_FACTOR = 360 * 1,6 = 576 px/s
```

**Kein Faktor auf `PLAYER_DASH_SPEED`.** 1100 px/s ist bereits der schnellste Zustand
im Spiel und damit die Obergrenze, gegen die die Hindernis-Auflösung ausgelegt ist; ihn
zusätzlich zu skalieren würde durch dünne Hindernisse tunneln. 576 < 1100, Overdrive
schafft also keinen neuen Fall, den die Kollisionsauflösung noch nicht kennt.

Der Faktor wirkt auf **alle** Stellen, an denen `playerController` seine Obergrenze
setzt — auch auf die Rückstellung nach Wand- und Hinderniskontakt. Sonst würde ein
Wandkontakt den Buff faktisch beenden, ohne dass die Anzeige das sagt.

Overdrive hat **keinen eigenen visuellen Effekt** auf dem Spieler. Stattdessen sinkt die
Schwelle des Ion-Streak-Schweifs auf `PLAYER_MAX_SPEED * 0,55`, sodass der Schweif bei
normaler Bewegung durchgehend läuft statt nur im Dash. Das ist der Grund, warum die
Fähigkeit ohne ein zweites Symbol auskommt: die Geschwindigkeit zeigt sich selbst.

### Mend

Mend ist die kleinste Wirkung der drei und die einzige, die kein Zustand ist:

```
lives := min(maxLives, lives + MEND_SEGMENTS)
```

Drei Festlegungen, jede gegen eine naheliegende Alternative:

- **Ein Segment, nicht alle.** Voll heilen macht die Runde bis dahin bedeutungslos; ein
  Segment ist eine Verlängerung, keine Rücksetzung. Bei drei Startleben ist es zugleich
  ein Drittel der Gesamtressource und damit alles andere als wenig.
- **Keine Unverwundbarkeit dazu.** Das ist Aegis' Aufgabe. Zwei Power-ups mit
  überlappender Wirkung sind eines zu viel, und ein Heilmittel, das zusätzlich schützt,
  macht das Schild zum schlechteren Fund.
- **Kein eigener Trichter für die Gutschrift.** `roundData.restoreLives(roundData, n)`
  klemmt gegen `maxLives` an genau einer Stelle, so wie `registerHit` die Gegenrichtung an
  genau einer Stelle abzieht. Die Gutschrift passiert im Simulationsschritt **vor** der
  Trefferauswertung: Heilung und Treffer im selben Schritt sollen sich in der Reihenfolge
  ihres Eintretens verrechnen, nicht gegenseitig verschlucken.

Weil Mend nichts hält, gibt es auch nichts zu beenden — es hat keinen Ablauf, keinen
Restzeitbogen und keine HUD-Zeile (§5).

## 5) Anzeige

| Element              | Ort                                            | Quelle                           |
| -------------------- | ---------------------------------------------- | -------------------------------- |
| Marker (Hexagon)     | Weltraum, über Hindernissen, unter dem Schweif | `renderer/powerupMarkerLayer.js` |
| Marker-Restzeitring  | Weltraum, r = 34 um die Markerposition         | dito, über `renderer/timeArc.js` |
| Einsammelring        | Weltraum, an der Markerposition                | dito                             |
| Aegis-Schale + Bogen | Weltraum, über dem Spieler, r = 30 / 36        | `renderer/powerupLayer.js`       |
| Overdrive-Bogen      | Weltraum, über dem Spieler, r = 42             | dito                             |
| Shatter              | Weltraum, über dem Spieler                     | dito                             |
| Mend-Bogen           | Weltraum, über dem Spieler, r = 34, einmalig   | dito                             |
| Segment-Blitz        | Weltraum, im Lebensbalken unter dem Spieler    | `renderer/playerStatusBars.js`   |
| Restzeitbalken       | DOM-HUD, über der Dash-Bar                     | `ui/hud.js`                      |

Die Aufteilung der Zeichenseite auf zwei Dateien liegt auf derselben Naht wie §11 des
Design-Systems: was am Boden liegt gegen was auf dem Spieler reitet. `powerupLayer.js`
importiert Farben, Strichbreite und `hexPath` aus `powerupMarkerLayer.js`, weil die Schale
am Spieler buchstäblich das Hexagon des Markers ist — und das ist die ganze Erklärung, die
der Effekt bekommt.

Die importfreie Arithmetik beider Mend-Elemente steht in `renderer/mendPulse.js`, damit sie
unter Vitest prüfbar ist — dieselbe Aufteilung wie `dashPulse.js` und
`spawnMarkerPulse.js`.

Die Restzeitbalken liegen im DOM und nicht auf dem Canvas, aus demselben Grund, aus dem
die Dash-Bar dorthin gewandert ist: ihre Beschriftung ändert sich nie und muss nicht in
jedem Frame neu gerastert werden.

Die einzige Warnung vor dem Ablauf ist der Zeitbogen, der unter 17 % Restzeit mit 4 Hz
blinkt. Kein Ton, kein Text in der Arena. Der Bogen läuft auf Wall Time, nicht auf der
Simulationsuhr — er ist Darstellung, und 4 Hz sollen 4 Hz bleiben, unabhängig davon, wie
lang der Buff noch dauert.

### Ein Motiv, eine Funktion

Das Restzeit-Motiv liegt in `renderer/timeArc.js` und wird an **drei** Stellen aufgerufen: die
beiden Buffs am Spieler und der Marker am Boden. Ein eigenes Blattmodul, weil `powerupLayer.js`
das Hexagon-Vokabular aus `powerupMarkerLayer.js` bezieht — würde der Bogen in einer der beiden
Dateien liegen und die andere ihn brauchen, entstünde ein Importzyklus.

Der Punkt ist nicht die Vermeidung des Zyklus, sondern die Zusicherung: dass der Ring am Marker
„genauso aussieht" wie der Bogen am Spieler, ist keine Ähnlichkeit, die von Hand gehalten werden
muss, sondern **eine Funktion mit zwei Aufrufern**. Strichbreite, Startpunkt zwölf Uhr,
Laufrichtung und Blinkfrequenz können damit nicht auseinanderlaufen.

Die Wanduhr für das Blinken wird hereingegeben statt intern aus `performance.now()` gelesen. Das
ist der Grund, warum `timeArcSweep` und `timeArcAlpha` unter Vitest prüfbar sind — vorher war der
gesamte Bogen auf keiner Teststufe abgedeckt, weil eine versteckte globale Eingabe nicht prüfbar
ist. Dieselbe Aufteilung wie `dashPulse.js` gegen `renderer/dashTrail.js`.

Der Marker-Ring sitzt bewusst **innerhalb** von `COLLECT_RADIUS` (34 gegen 39): ein Ring, der den
Aufsammelradius zeichnete, würde eine Trefferfläche versprechen. `powerupMarkerLayer.js` kennt
`COLLECT_RADIUS` weiterhin nicht.

### Mends Moment

Mend bekommt **keine HUD-Zeile und keinen Restzeitbogen**: es ist ein Ereignis und hat
nichts, was man anzeigen könnte, sobald es vorbei ist. Das Ergebnis steht im Lebensbalken,
und den gibt es schon. Statt einer Anzeige besteht Mends Rückmeldung aus drei Dingen im
Moment der Aufnahme:

1. der grüne Einsammelring an der Markerposition, wie bei den anderen beiden,
2. das gewonnene Segment im Lebensbalken, das weiß aufblitzt und sich über
   `MEND_ARC_SECONDS` in sein Grün setzt — weiß über das Grün gelegt, nicht anstelle davon,
   damit das Abklingen ein Verblassen ist und kein Farbwechsel,
3. ein grüner Bogen (r = 34) am Spieler, der **einmal gegen** den Uhrzeigersinn läuft.

Punkt 3 ist der eigentliche Träger der Aussage. Jeder Restzeitbogen im Spiel **leert** sich
im Uhrzeigersinn; dieser **füllt** sich gegen ihn. Die Umkehrung ist die Botschaft: etwas
wurde hinzugefügt, nicht etwas läuft ab. Wer die beiden verwechselt, hat die Laufrichtung
verloren, nicht die Farbe — die Diagnose beginnt also dort und nicht am Grün.

Der Bogen ist am Anfang am hellsten (`mendArcAlpha` fällt quadratisch), weil er gesehen
werden muss, **während** er wächst; ein Bogen, der erst am Ende auffällt, zeigt nur noch
sein Verschwinden.

## 6) Edge Cases

| Fall                                           | Verhalten                                                                                             |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Beide Buffs gleichzeitig                       | unabhängig; zwei Bögen (36 px amber, 42 px cyan), zwei HUD-Zeilen                                     |
| Denselben Buff erneut aufnehmen                | Dauer startet neu auf voll, **kein** Stapeln                                                          |
| Treffer während der Gnadenfrist mit Aegis      | Schild bleibt erhalten, es gab keinen Schaden zu fressen                                              |
| Zweiter Treffer direkt nach einer Absorption   | kostenlos, solange das Fenster läuft; danach kostet er sofort wieder ein Leben                        |
| Aegis aufgesammelt, während das Fenster läuft  | bleibt unangetastet — es gab keinen Schaden zu fressen, genau wie in der Gnadenfrist                  |
| Rundenneustart                                 | `reset()` in `beginRound()` — dort springt `simulationTimeMs` auf 0, jeder Zeitstempel muss mit       |
| Countdown vor dem Rundenstart                  | die Welt steht, `step()` läuft nicht, es wird nichts gezeichnet                                       |
| Mehrschritt-Frame                              | `step()` läuft pro Simulationsschritt, nicht pro Bild — bei 144 Hz wird gleich gesammelt wie bei 60   |
| Spieler wurde vom Hindernis weggeschoben       | `step()` läuft **nach** der Korrektur; nie aus einer Position aufgesammelt, die es nicht gab          |
| Arena voll, kein Platz für einen Marker        | dieses Intervall entfällt still, nächster Versuch regulär                                             |
| Mend bei voller Gesundheit                     | **spawnt nicht**; die Reihenfolge überspringt es und rückt entsprechend weiter                        |
| Gesundheit wird voll, Marker liegt schon       | Marker wird über 300 ms inert, sammelt nicht ein, verschwindet aber nicht; sinkt sie, kommt er zurück |
| Zwei Treffer hintereinander                    | das nächste Angebot ist **nicht** wieder Mend — Mend steht zwischen den anderen beiden                |
| Mend bei bereits voller Gesundheit aufnehmen   | kann nicht eintreten (Spawn- und Aufsammelregel); `restoreLives` klemmt zusätzlich                    |
| Heilung und Treffer im selben Schritt          | Gutschrift zuerst, Abzug danach — in der Reihenfolge des Eintretens, nicht gegeneinander              |
| Hindernis entsteht **über** einem Marker       | Marker skaliert über 350 ms weg, ab sofort nicht mehr aufsammelbar (siehe unten)                      |
| Hindernis läuft unter einem gehenden Marker ab | Marker kommt **nicht** zurück; `retiringSinceMs` wird nur einmal gesetzt                              |

Der letzte Fall war bis 2026-08-04 **bewusst nicht behandelt**, mit dieser Begründung: ihn zu
beheben hieße, in jedem Schritt jeden Marker gegen jedes Hindernis zu prüfen statt nur einmal beim
Spawn, und die Folge wäre ein Marker, der verschwindet, während der Spieler auf ihn zuläuft — die
schlechtere von zwei Enttäuschungen.

Der erste Halbsatz war ein Kostenargument und trägt nicht: zwei Marker gegen höchstens zwölf
Hindernisse sind 1440 Abstandsrechnungen pro Sekunde, in einer Simulation, die 90 Boids paarweise
gegeneinander rechnet. Der zweite Halbsatz war richtig — für einen Marker, der **verschwindet**.
Für einen, der über 350 ms weggeht, gilt er nicht, und diese Möglichkeit gab es zum Zeitpunkt der
Entscheidung nicht: sie ist erst mit dem Restzeitring und seiner Skalierung entstanden. Die
Entscheidung ist damit nicht umgestoßen, ihre Voraussetzung ist entfallen.

Was bleibt, ist der Grund, aus dem die Spawn-Prüfung in §3 überhaupt existiert: ein Marker in
einer Hazard-Kapsel ist keine Enttäuschung, sondern eine **Falle**. Eine Regel, die für das
Platzieren gilt, aber nicht für das Liegenbleiben, ist eine halbe Regel.

## 7) Testbarkeit

`PowerupField` bekommt seinen Zufallsgenerator im Konstruktor (`random = Math.random`),
sodass die Vitest-Suite Marker exakt platzieren kann. Damit sind Spawn-Intervall,
Abstandsregeln, Aufnahme, Ablauf, Absorption und Rundenreset vollständig unter Unit-Test.

Die beiden Buffs am Spieler liegen dabei in `powerups/powerupBuffs.test.js`, das mit einem
eigenen Treiber auf dasselbe Feld schaut wie `powerups.test.js` — abgespalten, als die
400-Zeilen-Grenze erreicht war, entlang derselben Naht wie `mend.test.js`. Geprüft sind dort
der Ablauf beider Buffs, der Restzeitbogen und die vier Aussagen über das Aegis-Fenster:
dass der Bruch es öffnet, dass es Treffer darin kostenlos macht, dass es endet, und dass
ein währenddessen aufgesammelter Schild unangetastet bleibt. Dass es als
`playerInvulnerable` beim Renderer ankommt, ohne dass ein Leben verloren ging, steht in
`loop/renderState.test.js` — das ist die Naht, an der die beiden Quellen desselben Zustands
verodert werden, und die einzige Stelle, an der ein Vergessen davon sichtbar wäre.

Mend ist über drei Ebenen geprüft, und die Aufteilung folgt den Modulgrenzen:

| Modul                             | Was dort geprüft wird                                                                           |
| --------------------------------- | ----------------------------------------------------------------------------------------------- |
| `powerups/mend.test.js`           | `canMend`, der Verlauf der Inertheit über die Zeit, das Melden des Bogens                       |
| `powerups/markerLifetime.test.js` | Ein- und Ausblenden, Restzeit, Rücknahme — arithmetisch **und** durch ein echtes Feld getrieben |
| `renderer/timeArc.test.js`        | Sweep und Blinken des Restzeit-Motivs, das vorher ungeprüft war                                 |
| `powerups/powerups.test.js`       | Spawn-Reihenfolge mit Überspringen, inerter Marker nicht aufsammelbar, kein Buff                |
| `renderer/mendPulse.test.js`      | Bogen-Deckkraft und -Sweep, Segment-Blitz, Blende nach Slate                                    |
| `round/roundData.test.js`         | `restoreLives`: Klemmung, keine Gnadenfrist, ein Segment statt aller                            |

Der Lebenszähler liegt in den Tests beim Treiber und nicht im Feld — genauso wie im Spiel
bei `roundData`. Dass `PowerupField` ihn nur liest, ist damit nicht nur behauptet, sondern
die Voraussetzung dafür, dass diese Tests überhaupt so geschrieben werden können.

Was die E2E-Ebene **nicht** prüfen kann: den Weg zu einem Marker. Die Position ist zur
Laufzeit zufällig, und ein Playwright-Spec, der zu einer zufälligen Stelle läuft, wäre
zeitabhängig und damit flaky. Der E2E-Test deckt deshalb nur die Verdrahtung ab — dass
die HUD-Zeilen existieren, bei Rundenstart unsichtbar sind und nach einem Neustart
unsichtbar bleiben. Diese Grenze steht in `documentation/report/08-qualitaet.md` §8.2
neben den drei bereits dokumentierten.

## 8) Abgrenzung

- **Kein Engine-Anteil.** Anders als beim Boid-Dash aus S-05a gibt es hier nichts zu
  simulieren: Marker bewegen sich nicht, und die Wirkung trifft ausschließlich den
  Spieler, der ohnehin im Frontend integriert wird.
- **Keine neue Form und keine neue Farbe.** §11 des Design-Systems legt das Hexagon als
  vierte und letzte Form fest, und Mend bestätigt die Regel, statt sie zu brechen: ein
  drittes Hexagon mit anderem Glyph. Auch die Farbe ist keine neue — Grün ist laut §1 die
  Farbe des Lebens, und Mend gibt Leben zurück. Der Glyph ist entsprechend der Lebensbalken
  selbst (drei Balken, der oberste nur angedeutet, die Lücke ist das Icon); ein Herz oder
  Kreuz wäre ein zweites Symbol für etwas, für das das Spiel schon eines hat.
- **Regel für ein viertes Power-up: Zustand → Bogen + HUD-Zeile. Ereignis → nur der
  Moment.** Nichts dazwischen. Aegis und Overdrive laufen, brauchen also eine Restanzeige;
  Mend tritt ein und hat nichts, was danach noch anzuzeigen wäre. Wer ein viertes Power-up
  entwirft, entscheidet zuerst diese Frage und nicht die nach dem Symbol.
- **Slow-Time entfällt weiterhin.** Es wäre das einzige der drei ursprünglich
  angedachten Power-ups, das den festen Zeitschritt anfassen müsste — und der ist eine
  der beiden tragenden Invarianten des Projekts.
