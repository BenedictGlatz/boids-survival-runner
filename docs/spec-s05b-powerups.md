# S-05b — Power-ups (Aegis und Overdrive)

Blickwinkel: Gameplay-Fähigkeit, Frontend

Teil-Spec zu **S-05 Steuerung & Power-Ups**. Beschreibt die zweite und dritte
Spielerfähigkeit neben dem Dash aus [S-05a](spec-s05-dash.md): **Aegis**, ein Schild,
der genau einen Treffer frisst, und **Overdrive**, eine zeitweise erhöhte
Höchstgeschwindigkeit. Beide werden als Marker in der Arena aufgesammelt.

Gestaltungsvorgabe ist `docs/design_system/design-system.md` §11; die dort
vorgeschlagenen Zahlen sind hier als Festlegung übernommen.

## 1) Zweck

**Fachlich:** Der Dash ist eine Fähigkeit, die immer da ist und nur auf ihren Cooldown
wartet. Er beantwortet die Frage „wie komme ich hier raus", aber er gibt der Arena
selbst keinen Inhalt: außer dem Schwarm und den Hindernissen aus S-07 gibt es nichts,
worauf sich hinzulaufen lohnt. Die beiden Power-ups sind dieser Inhalt. Sie legen einen
zweiten, freiwilligen Druck über den Fluchtdruck — der kürzeste Weg vom Schwarm weg und
der Weg zum Marker sind selten derselbe.

Die beiden Wirkungen sind bewusst gegensätzlich: Aegis erlaubt, einen Fehler zu machen,
Overdrive erlaubt, keinen zu machen. Ein Schild belohnt Hineingehen, mehr Tempo belohnt
Herauskommen.

**Technisch:**

- Beides lebt **vollständig im Frontend**. Die Engine kennt vom Spieler nur eine
  Position pro `tick()`; Integration, Unverwundbarkeit und Lebensabzug liegen bereits in
  `player/playerController.js` und `round/roundData.js`. Die WASM-Signatur ändert sich
  nicht, es kommt kein Puffer über die Grenze dazu.
- Die Regeln liegen in `powerups/powerups.js` und sind frei von Canvas und DOM, also
  unter Vitest prüfbar — dieselbe Trennung wie `player/dashCooldown.js` gegen
  `renderer/dashPulse.js`.
- Alle Zeitmessung läuft auf `gameData.simulationTimeMs`, hereingereicht als Parameter.
  Das Modul führt **keine eigene Uhr**.

## 2) Zustandsmodell

Drei Dinge existieren nebeneinander und werden getrennt gehalten:

| Zustand     | Lebensdauer                                               | Träger                          |
| ----------- | --------------------------------------------------------- | ------------------------------- |
| **Marker**  | `MARKER_LIFETIME_MS` ab Spawn                             | `_markers[]`, Position und Art  |
| **Buff**    | `AEGIS_DURATION_MS` / `OVERDRIVE_DURATION_MS` ab Aufnahme | `_buffs`, Art → `endsAtMs`      |
| **Shatter** | `SHATTER_MS` ab absorbiertem Treffer                      | `_shatterAtMs`, nur Darstellung |

Ein Marker wird beim Einsammeln in einen Buff überführt; beide sind nie derselbe
Datensatz. Der Shatter ist reine Nachwirkung und hat keine Spielwirkung.

### Festgelegte Werte

| Konstante                | Wert      | Warum                                                                        |
| ------------------------ | --------- | ---------------------------------------------------------------------------- |
| `AEGIS_DURATION_MS`      | 6500 ms   | lang genug, eine Formation zu überstehen, kurz genug, ihn ausgeben zu müssen |
| `OVERDRIVE_DURATION_MS`  | 6000 ms   | etwa eine Arenaquerung bei erhöhtem Tempo                                    |
| `OVERDRIVE_FACTOR`       | 1,6       | spürbar; siehe §4                                                            |
| `SPAWN_INTERVAL_MS`      | 9000 ms   | seltener als eine Welle (15 s), häufiger als ein Leben verloren geht         |
| `MARKER_LIFETIME_MS`     | 12 000 ms | ein Marker, der ewig liegt, ist keine Entscheidung mehr                      |
| `MAX_MARKERS`            | 2         | mehr macht die Arena zur Sammelaufgabe                                       |
| `MIN_SPAWN_DISTANCE`     | 220 px    | Abstand zum Spieler und zwischen Markern                                     |
| `MIN_OBSTACLE_CLEARANCE` | 60 px     | Markerradius 18 + Spielerradius 16 + Reserve                                 |
| `COLLECT_RADIUS`         | 26 px     | größer als die Zeichnung; siehe §3                                           |
| `SHATTER_MS`             | 350 ms    | Dauer der Splitteranimation                                                  |

Die Werte liegen im Modul, nicht in `gameConfig.js` — wie schon die Schweif-Konstanten
in `renderer/dashTrail.js`. `gameConfig.js` trägt, was über Modulgrenzen hinweg gilt;
die Abstimmung dieser neun Zahlen aufeinander gilt nur innerhalb des Power-up-Themas.

## 3) Spawn und Aufnahme

### Spawn-Regel

Alle `SPAWN_INTERVAL_MS` wird **ein** Versuch unternommen. Die Art wechselt sich
deterministisch ab (`aegis`, `overdrive`, `aegis`, …) statt gewürfelt zu werden: zwei
Schilde hintereinander sind für einen Spieler bei voller Gesundheit ein Nichtgewinn, und
Zufall, der Nichtgewinne erzeugt, ist kein interessanter Zufall.

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

### Aufnahme

```
aufnehmen, wenn  dist(player, marker) <= COLLECT_RADIUS
```

`COLLECT_RADIUS` (26 px) ist größer als der gezeichnete Marker (18 px). Ein Spieler, der
im Dash vorbeistreift, legt in einem Simulationsschritt 1100 / 60 ≈ 18 px zurück — eine
Trefferfläche in Größe der Zeichnung ließe ein Streifen wie einen gestohlenen Treffer
wirken.

Pro Schritt wird höchstens **ein** Marker aufgenommen. Bei zwei überlappenden Markern
gewinnt der ältere; der zweite liegt einen Schritt später immer noch da.

## 4) Wirkung

### Aegis

Aegis frisst genau einen Treffer und ist damit verbraucht — unabhängig davon, was sein
Zeitbogen noch anzeigte. Dauer und Ladung sind derselbe Zustand: ein Schild, der
absorbiert, ist vorbei.

Der Schild wird nur befragt, wenn der Treffer tatsächlich zählen würde:

```
if isPlayerInvulnerable(roundData):  return          # Gnadenfrist, kostet ohnehin nichts
if powerups.absorbHit(t):            return          # Schild frisst ihn und ist weg
registerHit(roundData)
```

Die Reihenfolge ist die Aussage. Ein Schild, der während der 900-ms-Gnadenfrist nach
einem Treffer verbraucht würde, wäre auf Schaden verschwendet, den es gar nicht gab.

Aegis ist ausdrücklich **kein** zweiter Unverwundbarkeitszeitraum: ein absorbierter
Treffer setzt `lastHitAtSimulationMs` nicht, also kostet der nächste Treffer sofort
wieder ein Leben. Wer den Schild verbraucht hat, steht danach ungeschützt im Schwarm.
Der Lebensabzug bleibt vollständig bei `registerHit` — dem einzigen Trichter, durch den
jeder Schaden geht.

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

## 5) Anzeige

| Element              | Ort                                            | Quelle                     |
| -------------------- | ---------------------------------------------- | -------------------------- |
| Marker (Hexagon)     | Weltraum, über Hindernissen, unter dem Schweif | `renderer/powerupLayer.js` |
| Einsammelring        | Weltraum, an der Markerposition                | dito                       |
| Aegis-Schale + Bogen | Weltraum, über dem Spieler, r = 30 / 36        | dito                       |
| Overdrive-Bogen      | Weltraum, über dem Spieler, r = 42             | dito                       |
| Shatter              | Weltraum, über dem Spieler                     | dito                       |
| Restzeitbalken       | DOM-HUD, über der Dash-Bar                     | `ui/hud.js`                |

Die Restzeitbalken liegen im DOM und nicht auf dem Canvas, aus demselben Grund, aus dem
die Dash-Bar dorthin gewandert ist: ihre Beschriftung ändert sich nie und muss nicht in
jedem Frame neu gerastert werden.

Die einzige Warnung vor dem Ablauf ist der Zeitbogen, der unter 17 % Restzeit mit 4 Hz
blinkt. Kein Ton, kein Text in der Arena. Der Bogen läuft auf Wall Time, nicht auf der
Simulationsuhr — er ist Darstellung, und 4 Hz sollen 4 Hz bleiben, unabhängig davon, wie
lang der Buff noch dauert.

## 6) Edge Cases

| Fall                                         | Verhalten                                                                                           |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Beide Buffs gleichzeitig                     | unabhängig; zwei Bögen (36 px amber, 42 px cyan), zwei HUD-Zeilen                                   |
| Denselben Buff erneut aufnehmen              | Dauer startet neu auf voll, **kein** Stapeln                                                        |
| Treffer während der Gnadenfrist mit Aegis    | Schild bleibt erhalten, es gab keinen Schaden zu fressen                                            |
| Zweiter Treffer direkt nach einer Absorption | kostet ein Leben; eine Absorption startet keine Gnadenfrist                                         |
| Rundenneustart                               | `reset()` in `beginRound()` — dort springt `simulationTimeMs` auf 0, jeder Zeitstempel muss mit     |
| Countdown vor dem Rundenstart                | die Welt steht, `step()` läuft nicht, es wird nichts gezeichnet                                     |
| Mehrschritt-Frame                            | `step()` läuft pro Simulationsschritt, nicht pro Bild — bei 144 Hz wird gleich gesammelt wie bei 60 |
| Spieler wurde vom Hindernis weggeschoben     | `step()` läuft **nach** der Korrektur; nie aus einer Position aufgesammelt, die es nicht gab        |
| Arena voll, kein Platz für einen Marker      | dieses Intervall entfällt still, nächster Versuch regulär                                           |
| Hindernis entsteht **über** einem Marker     | akzeptierte Grenze: der Marker bleibt für den Rest seiner 12 s unerreichbar (siehe unten)           |

Der letzte Fall wird bewusst nicht behandelt. Ihn zu beheben hieße, in jedem Schritt
jeden Marker gegen jedes Hindernis zu prüfen statt nur einmal beim Spawn, und die Folge
wäre ein Marker, der verschwindet, während der Spieler auf ihn zuläuft — das ist die
schlechtere von zwei Enttäuschungen.

## 7) Testbarkeit

`PowerupField` bekommt seinen Zufallsgenerator im Konstruktor (`random = Math.random`),
sodass die Vitest-Suite Marker exakt platzieren kann. Damit sind Spawn-Intervall,
Abstandsregeln, Aufnahme, Ablauf, Absorption und Rundenreset vollständig unter Unit-Test.

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
- **Kein dritter Buff.** §11 des Design-Systems legt das Hexagon als vierte und letzte
  Form fest; ein weiteres Power-up wäre ein weiteres Hexagon mit anderem Symbol, nie
  eine neue Form.
- **Slow-Time entfällt weiterhin.** Es wäre das einzige der drei ursprünglich
  angedachten Power-ups, das den festen Zeitschritt anfassen müsste — und der ist eine
  der beiden tragenden Invarianten des Projekts.
