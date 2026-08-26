# S-01 — Boid-Schwarm-Simulation

Blickwinkel: Engine

## 1) Zweck

**Fachlich:** Der Gegner des Spiels ist kein einzelnes Wesen, sondern ein Schwarm. Er muss drei
Dinge gleichzeitig tun: als Wolke zusammenhalten, den Spieler verfolgen und sich dabei nicht
selbst überlagern. Aus diesen drei Ansprüchen entsteht das Verhalten, das das Spiel trägt — ein
Verband, der sich um Hindernisse teilt und wieder schließt, und dessen Druck sich über die
Wellen erhöht, ohne dass eine einzelne Einheit mehr könnte als ihre Nachbarn.

**Technisch:** Die vollständige Simulation liegt in der Engine. Sie kennt kein DOM, kein Canvas
und keine Browser-API, und sie kennt auch keine Zeit außer dem einen festen Schritt, den sie pro
`tick()` rechnet. Das ist die Voraussetzung dafür, dass dieselbe Runde auf jedem Rechner gleich
abläuft und dass die Hälfte des Projekts, in der die Logik steckt, ohne Browser testbar ist.

**Nicht Teil dieses Specs:** der Boid-Dash (S-05, [spec-s05-dash.md](spec-s05-dash.md)), die
Hindernisse und die fünfte Steering-Regel (S-07,
[spec-s07-hindernisse.md](spec-s07-hindernisse.md)) und die Spawn-Gates der Wellen (S-04). Alle
drei greifen in `Flock::update` ein und werden in §3 an der Stelle genannt, an der sie
eingreifen — beschrieben sind sie dort, wo sie hingehören.

## 2) Datenmodell: Tuning-Werte am Boid, nicht global

Ein `Boid` trägt Position, Geschwindigkeit, Beschleunigung, seine `BoidProperties` und seinen
`difficulty_tier`. Die Tuning-Werte liegen **im Boid**, nicht in einer globalen
Konfiguration:

| Wert                    | Bedeutung                                              | Default |
| ----------------------- | ------------------------------------------------------ | ------: |
| `max_speed`             | Höchstgeschwindigkeit in Welteinheiten **pro Schritt** |     3,7 |
| `max_acceleration`      | Obergrenze der Steuerkraft pro Schritt                 |    0,09 |
| `perception_radius`     | Radius, in dem Nachbarn wahrgenommen werden            |      70 |
| `separation_weight`     | Gewicht der Trennung                                   |     3,2 |
| `alignment_weight`      | Gewicht der Ausrichtung                                |    0,45 |
| `cohesion_weight`       | Gewicht des Zusammenhalts                              |    0,24 |
| `target_seek_weight`    | Gewicht der Verfolgung                                 |    0,22 |
| `obstacle_avoid_weight` | Gewicht des Ausweichens (S-07)                         |     1,6 |

Der Grund für diese Verortung ist eine Anforderung des Spiels: In einem Schwarm existieren
mehrere Varianten gleichzeitig. Ein Wert, der sich pro Boid unterscheiden **kann**, gehört
deshalb an den Boid, und `constants.rs` hält nur die _Vorgaben_, nicht die Invarianten. Ohne
diese Trennung müsste eine spätere Welle entweder alle Boids ändern oder ein zweites
Tuning-Objekt neben dem ersten führen.

Ein Wert liegt bewusst **nicht** dort: `BOID_COLLISION_RADIUS` (6) ist global, weil er eine
Eigenschaft der Darstellungsdichte ist und nicht der Variante. Dasselbe gilt für
`BOID_HIT_RADIUS` (10,5) — beides beschreibt, wie groß ein Boid _ist_, nicht wie er sich
verhält.

### Die Dichteschraube ist nicht das Gewicht

`CLOSE_NEIGHBOUR_RADIUS_SHARE = 0,36` ist der Anteil des Wahrnehmungsradius, ab dem ein Nachbar
als _nah_ gilt und die Trennung überhaupt einsetzt — beim Default also rund 25 Einheiten. Diese
Zahl entscheidet über die Dichte des Schwarms, und `separation_weight` tut es nicht:

Alle Regeln werden summiert und das Ergebnis danach von `max_acceleration` gekappt. Auf kurzer
Distanz sättigt die Trennung diese Grenze bereits allein, weshalb ein niedrigeres Gewicht den
Ruheabstand zweier Boids kaum verschiebt — die Kraft wäre so oder so abgeschnitten worden. Was
den Abstand tatsächlich setzt, ist die Frage, _ab wo_ die Trennung wirkt. Das ist eine
Festlegung, die man ohne den Kappungsschritt im Kopf zwangsläufig falsch herum anfasst, und der
Grund, warum sie im Code an der Konstante steht und nicht am Gewicht.

Weil der Nahradius aus dem Wahrnehmungsradius abgeleitet ist (`close_neighbour_radius()`),
skaliert eine spätere Welle, die weiter sieht, ihren Abstand mit — die beiden laufen nicht
auseinander.

## 3) Ein Simulationsschritt, in fester Reihenfolge

`Flock::update()` ist der einzige Orchestrator der Simulation. Die Reihenfolge ist die
Spezifikation, weil fast jeder Schritt darin einen anderen voraussetzt:

| #   | Schritt                                                        | Warum an dieser Stelle                                                                                      |
| --- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 1   | `step_counter` erhöhen (`wrapping_add`)                        | Saat für jede deterministische Auswahl; `wrapping_add`, damit eine sehr lange Sitzung nicht überläuft       |
| 2   | Höchstens eine neue Dash-Gruppe anbieten (S-05)                | Vor jeder Bewegung, damit die gewählten Boids **in diesem** Schritt schon pulsieren                         |
| 3   | **Snapshot** des Boid-Vektors klonen                           | Damit jeder Boid gegen den Zustand des _vorherigen_ Schritts steuert                                        |
| 4   | Pro Boid: Dash-Zustand fortschreiben (S-05)                    | Entscheidet, ob dieser Boid normal schwärmt oder seine Linie fliegt                                         |
| 5   | Pro Boid: Steuerkraft bilden und auf `max_acceleration` kappen | Die Regeln kennen keine Obergrenze, `clamp_force` ist der eine Ort dafür                                    |
| 6   | Pro Boid: `integrate(boid, step_speed_limit(boid))`            | Geschwindigkeitsgrenze als **Parameter**, nicht aus dem Boid gelesen (§4)                                   |
| 7   | Pro Boid: an Hindernissen abprallen (S-07)                     | Die ganze Strecke wird geprüft, deshalb **vor** dem Wrap — sonst liefe die Prüfstrecke quer durch die Arena |
| 8   | Pro Boid: an den Weltkanten wrappen                            | Schließt den Torus                                                                                          |
| 9   | `resolve_boid_overlaps` über den ganzen Schwarm                | Positionskorrektur, die Geschwindigkeit unberührt lässt (§5)                                                |
| 10  | Boids aus Hindernissen herausschieben (S-07)                   | Nach der Relaxation, weil die selbst einen Boid in ein Hindernis schieben kann                              |
| 11  | Spielertreffer zählen                                          | Auf den endgültigen Positionen des Schritts, nicht auf Zwischenständen                                      |

**Der Snapshot ist der Kern des Ganzen.** Ohne ihn würde ein Boid mit Index 5 gegen die bereits
aktualisierten Nachbarn 0–4 und die noch alten 6–n steuern — das Verhalten wäre von der
Reihenfolge im Vektor abhängig und damit von einer Eigenschaft, die keine Bedeutung hat.
Der Preis ist ein `Vec<Boid>`-Klon pro Schritt. Das ist die einzige Allokation im heißen Pfad
der Simulation und wird bewusst bezahlt: die Alternative wäre eine zweite Kopie der
Steuerlogik, die aus einem Doppelpuffer liest.

## 4) Die Steuerregeln

Vier Regeln in `steering/rules.rs`, jede eine reine Funktion, jede **ungewichtet**:

| Regel         | Betrachtet                                 | Ergebnis                                   |
| ------------- | ------------------------------------------ | ------------------------------------------ |
| `separation`  | Nachbarn im Nahradius (0,36 · Wahrnehmung) | Von jedem weg, umso stärker je näher       |
| `alignment`   | Nachbarn im Wahrnehmungsradius             | Zur mittleren Geschwindigkeit der Nachbarn |
| `cohesion`    | Nachbarn im Wahrnehmungsradius             | Zum Massenschwerpunkt der Nachbarn         |
| `seek_target` | Die Spielerposition                        | Zum Spieler                                |

Drei der vier folgen demselben Muster: die gewünschte Richtung wird auf `max_speed` skaliert
und davon die aktuelle Geschwindigkeit abgezogen. Die Regel liefert also nicht „wohin", sondern
**„was fehlt"** — die Differenz zwischen gewollter und tatsächlicher Bewegung. Das ist die
klassische Reynolds-Formulierung, und sie ist der Grund, warum ein Boid einkurvt statt
abzuknicken.

`separation` weicht davon ab und arbeitet ohne `max_speed`: sie summiert Einheitsvektoren, die
je mit `closeness + close_neighbour_radius / dist` skaliert sind, und mittelt über die Zahl der
Nachbarn. Der zweite Term wächst unbeschränkt, wenn der Abstand gegen null geht — genau das
macht die Regel auf kurzer Distanz zur stärksten der vier.

### Eine Konsequenz, die man kennen muss

Weil `alignment`, `cohesion` und `seek_target` ihre Wunschgeschwindigkeit mit `max_speed`
skalieren, ändert diese Eigenschaft **zwei** Dinge gleichzeitig: die Höchstgeschwindigkeit
_und_ die Stärke der Steuerung. Ein Boid mit doppeltem `max_speed` steuert nicht nur schneller,
er steuert auch härter.

Das ist der Grund, warum der Dash aus S-05 **keine** erhöhte `max_speed` setzt, sondern eine
angehobene Geschwindigkeitsgrenze an `integrate` übergibt: sonst würde ein Dash die Steuerkräfte
mitskalieren und der Boid würde auf seiner Linie zusätzlich anders lenken. Die Signatur
`integrate(boid, speed_limit)` ist also keine Verallgemeinerung auf Vorrat, sondern die
Konsequenz aus dieser Kopplung.

### Wo die Prioritäten liegen

`steering/weights.rs` ist der einzige Ort, der die Gewichtung kennt. Die Regeln wissen nichts
über Priorität, und `flock.rs` weiß nichts darüber, welche Regeln existieren; diese Datei kennt
beides und ist deshalb von beiden getrennt. `flocking_steering` gewichtet und summiert alle
fünf Regeln, `dash_steering` lässt nur die Trennung übrig.

Die Datei hat bewusst **keine eigenen Tests**: jede Regel wird einzeln in `rules.rs` geprüft,
und was hier hinzukommt, ist eine Gewichtungspolitik, deren Wirkung nur im Verhalten sichtbar
ist — ein Boid, der um ein Hindernis kommt, ein Dasher, der aus dem Schwarm ausbricht. Das sind
die Integrationstests in `flock.rs`.

## 5) Überlappung und Weltrand

**`resolve_boid_overlaps`** ist eine rein positionsbasierte Korrektur, in
`BOID_OVERLAP_RELAXATION_STEPS = 4` paarweisen Durchgängen über den ganzen Schwarm. Sie hält
`2 · BOID_COLLISION_RADIUS = 12` Einheiten zwischen zwei Mittelpunkten — etwa die Länge, mit
der das Frontend einen Boid zeichnet. Zwei ruhende Nachbarn berühren sich also fast, und genau
das lässt den Schwarm als eine dichte Wolke lesen statt als Feld einzelner Pfeile.

Dass die Korrektur die Geschwindigkeit **nicht** anfasst, ist Absicht: sie ist eine Aussage über
Darstellung, nicht über Physik. Ein Stoß, der die Geschwindigkeit ändert, würde der Trennung
ihre Aufgabe wegnehmen und den Schwarm zappeln lassen.

Zwei Sonderfälle:

- **Zwei Boids auf exakt derselben Position** haben keine Richtung, in die man sie trennen
  könnte. `fallback_overlap_direction` leitet eine aus der Summe der beiden Indizes ab (vier
  Himmelsrichtungen im Wechsel). Deterministisch, weil die Alternative Zufall wäre.
- **Ein dashender Boid gibt nicht nach.** Trifft ein Dasher auf einen normalen Boid, weicht der
  andere um den ganzen Betrag aus, statt dass beide sich halbieren. Ohne diese Ausnahme würde ein
  Dasher auf fast jedem Schritt seitlich angestoßen, während er den Schwarm durchquert, und seine
  Ladung sähe aus, als wäre sie im Verkehr steckengeblieben. Zwei Dasher teilen die Korrektur wie
  jedes andere Paar.

**`wrap_position`** benutzt `rem_euclid` und nicht ein einfaches Addieren oder Abziehen der
Weltbreite. Das ist keine Stilfrage: ein Dash-Schritt oder ein Stapel von Overlap-Korrekturen
kann einen Boid weiter verschieben als eine ganze Weltbreite, und eine einzelne Addition würde
ihn dann außerhalb der Welt liegen lassen. Eine Welt der Größe 0 wird unverändert
zurückgegeben, statt durch null zu teilen.

## 6) Treffererkennung

`count_player_hits` zählt jeden Boid, dessen Abstand zum Spieler unter `2 · BOID_HIT_RADIUS`
= 21 Einheiten liegt — der gezeichnete Spielerradius von 16 plus die halbe Länge eines Boids.
Gezählt wird, nicht abgebrochen: das Frontend muss die Treffer **jedes** Schritts eines Bildes
verarbeiten, und ein `bool` würde bei mehreren Boids gleichzeitig dieselbe Information tragen
wie bei einem.

`BOID_HIT_RADIUS` ist bewusst von `PLAYER_COLLISION_RADIUS` (14) getrennt. Letzterer ist der
Radius für den Hindernis-Sweep und wird von der Korridor-Zusicherung aus S-07 festgehalten; eine
gemeinsame Zahl könnte nicht mit dem Boid schrumpfen, ohne die Sackgassen-Garantie zu lockern.

**Ein Befund, den dieser Spec nicht glättet:** Die Funktion heißt `aabb_overlap` und ist keine.
Sie vergleicht `distance_to(b) < radius * 2` und ist damit ein Kreistest, kein Test auf
achsenparallele Boxen. Das Verhalten ist das gewollte — ein kreisförmiges Trefferfeld ist für
runde Entitäten die richtige Wahl —, aber der Name sagt etwas anderes als der Rumpf. Er stammt
aus einer früheren Fassung und ist bis heute nicht nachgezogen worden.

## 7) Determinismus ohne Zufallsquelle

Die Engine hat **keine** `rand`-Abhängigkeit, und eine hinzuzufügen würde die
Reproduzierbarkeit brechen. Alles, was wie Zufall aussehen soll, ist aus `Flock::step_counter`
oder aus Indizes abgeleitet:

- die Dash-Auswahl (S-05) über ein Integer-Hash-Verfahren auf dem Schrittzähler,
- die Trennrichtung zweier deckungsgleicher Boids über die Summe ihrer Indizes,
- die Startpositionen des ersten Schwarms über `index`, Wellennummer und Versuchszähler,
- die Startrichtungen über den goldenen Winkel (`2,3999631`), der aufeinanderfolgende Indizes
  maximal weit auseinanderlegt, ohne eine Tabelle zu brauchen.

Der Nutzen ist nicht Eleganz, sondern Testbarkeit: eine Zusicherung wie „dieselbe Spawn-Runde
erzeugt immer dasselbe Hindernis" ist überhaupt nur formulierbar, weil es keine verborgene
Zufallsquelle gibt.

## 8) Varianten: die Schwierigkeitsrampe

Die Rampe liegt in `wasm_bridge/boid_factory.rs` und **nicht** unter `simulation/`. Das ist eine
bewusste Grenze: eine Schwierigkeitskurve ist eine Design-Entscheidung, keine Simulationsregel.
`BoidProperties` ist das, was die Simulation versteht, und nichts darin weiß, dass es Wellen
gibt.

Der Tier ist `min(wave - 1, MAX_BOID_DIFFICULTY_TIER)`, also 0 in Welle 1 und ab Welle 5 am
Anschlag bei 4. Pro Stufe:

| Eigenschaft             | Zuwachs pro Stufe | bei Tier 4 |
| ----------------------- | ----------------- | ---------- |
| `max_speed`             | + 0,45            | 5,5        |
| `max_acceleration`      | + 0,02            | 0,17       |
| `perception_radius`     | + 8               | 102        |
| `separation_weight`     | + 0,2             | 4,0        |
| `target_seek_weight`    | + 0,045           | 0,40       |
| `alignment_weight`      | —                 | 0,45       |
| `cohesion_weight`       | —                 | 0,24       |
| `obstacle_avoid_weight` | —                 | 1,6        |

Die drei unveränderten Werte sind die Aussage der Tabelle. Ausrichtung und Zusammenhalt bleiben
flach, weil eine spätere Welle nicht _anders_ schwärmen soll, sondern schneller und aufmerksamer
— eine Variante mit mehr Zusammenhalt wäre ein anderer Gegner, keine schwerere Version
desselben. Das Ausweichgewicht bleibt flach, weil Ausweichen Kompetenz ist und nicht
Schwierigkeit; ein späterer Boid, der schlechter darin wäre, sähe kaputt aus statt schwerer. Die
Schwierigkeitsrampe der Hindernisse steckt in ihrer Dichte (S-07).

Die Deckelung bei Tier 4 hat zwei Gründe: ohne sie würden Boids in einem langen Lauf unbegrenzt
schneller, und `entityPalette.js` hat jenseits der letzten Stufe keine Farbe, in der es sie
zeichnen könnte. Ab Welle 5 wächst nur noch die **Zahl** der Boids — `INITIAL_BOID_COUNT = 24`
plus `WAVE_BOID_INCREMENT = 12` pro Welle, also 156 in Welle 12.

`build_boid` ist die einzige Stelle, an der aus einem Tier ein Boid wird, und wird vom ersten
Schwarm wie von den Spawn-Gates benutzt. Ein zweiter Zweig für dasselbe wäre genau die Art
Drift, die ein Gate einen Boid der fünften Welle mit den Eigenschaften der ersten spawnen
lässt; ein Test hält die beiden Pfade darauf fest.

`INITIAL_BOID_COUNT` ist in `engine/src/constants.rs` und `frontend/src/gameConfig.js`
**doppelt** vorhanden und muss von Hand synchron gehalten werden. Der Wert wird über den
Konstruktor übergeben, das Frontend braucht ihn aber schon vorher, um die HUD-Anzeige während
des Countdowns zu füllen.

## 9) Komplexität und ihre Grenze

Der Schritt ist **O(n²)** in der Zahl der Boids, und zwar zweifach: jeder Boid prüft im Steering
jeden anderen des Snapshots, und die Overlap-Relaxation läuft viermal über alle Paare. Es gibt
kein Raumgitter und keinen Quadtree.

Das ist eine bewusste Entscheidung gegen eine Optimierung, und die Begründung liegt in den
Projektregeln: Lesbarkeit vor Effizienz, und keine Optimierung ohne Messung. Bei 156 Boids in
Welle 12 sind das rund 24.000 Abstandsprüfungen im Steering plus rund 48.000 in der Relaxation
pro Schritt, was innerhalb des Budgets von 16,7 ms pro Schritt bleibt. Der Punkt, an dem ein
Gitter sich lohnt, liegt jenseits der Boid-Zahlen, die dieses Spiel erreicht — und ein Gitter
über einen Torus mit wrappenden Nachbarschaften wäre der aufwendigste Teil der Engine.

**Was bei Überlast passiert, ist an anderer Stelle festgelegt:** Der feste Zeitschritt wird
nicht langsamer, sondern das Frontend verwirft Zeitschuld jenseits von
`MAX_SIMULATION_STEPS_PER_FRAME`, und die Welt läuft in Zeitlupe weiter (S-04). Die Simulation
selbst kennt diesen Fall nicht.

## 10) Testfälle

### Engine (`cargo test`)

**Vektor- und Kraftmathematik**

- `Vec2`-Grundoperationen, insbesondere `limit` und `normalize` auf dem Nullvektor.
- `integrate` kappt auf die übergebene Grenze, nicht auf `max_speed`, und nullt die
  Beschleunigung.
- `integrate` lässt eine erhöhte Grenze zu — der Fall, den der Dash braucht.
- `clamp_force` kappt auf `max_acceleration` des jeweiligen Boids.

**Regeln einzeln**

- Trennung benutzt den Nahradius des _fragenden_ Boids, nicht einen globalen.
- Trennung wirkt nicht auf einen Nachbarn jenseits des Nahradius und nicht auf sich selbst
  (Abstand 0 wird ausgeschlossen).
- Ausrichtung und Zusammenhalt liefern den Nullvektor ohne Nachbarn in Reichweite.
- Verfolgung zeigt zum Ziel.

**Überlappung und Rand**

- `wrap_position` verkraftet einen Sprung von mehr als einer Weltbreite.
- `wrap_position` lässt eine Welt der Größe 0 unverändert.
- Zwei deckungsgleiche Boids werden getrennt, und zwar reproduzierbar.
- Die Relaxation hält `2 · BOID_COLLISION_RADIUS` ein.

**Integration im `Flock`**

- Ein Boid am Rand wrappt auf die exakt erwartete Position.
- Ein Boid mit ausschließlich aktiver Verfolgung bewegt sich zum Spieler.
- Zwei gestapelte Boids werden auseinandergeschoben.
- Ein Treffer wird gemeldet, wenn ein Boid den Spieler erreicht.
- Ein dashender Boid wird von der Relaxation **nicht** von seiner Linie geschoben, der andere
  weicht ganz.

**Varianten**

- Eine spätere Welle ist schneller, beschleunigt härter und trägt den höheren Tier.
- Die Rampe hört bei ihrer Decke auf zu steigen.
- Freier Spawn und Gate stimmen darin überein, was ein Tier bedeutet.

### Nicht abgedeckt, und warum

- **`steering/weights.rs`** hat keine eigenen Tests (§4).
- **Die O(n²)-Kosten** werden von keinem Test überwacht. Eine Laufzeitzusicherung im
  Unit-Test wäre auf CI-Hardware unzuverlässig; gemessen wird stattdessen im Browser über den
  Frametime-Graphen (T-08).
- **Der Schwarm als Ganzes** — dass er als Wolke _aussieht_ — ist nicht automatisiert prüfbar.
  Er bewegt sich in jedem Bild, ein Golden Image würde immer brechen und eine
  Ungleichheitsprüfung immer bestehen. Dieser Teil bleibt manuelle Sichtprüfung, und die Grenze
  ist dieselbe, die auch für die Playwright-Suite gilt.

## 11) Aufwand

Geschätzt waren **4,5 h**, die Journalzeilen weisen **1,5 h** aus. Die Differenz ist kein
Effizienzgewinn: Der Schwarmkern entstand überwiegend in der Prototyp-Phase vor dem 29.07.2026
und damit vor der ersten Journalzeile, weshalb der größte Teil des Aufwands nirgends erfasst
ist. Die Zahlen stammen aus der Plan-/Ist-Tabelle des abgegebenen Berichts (Anhang, Stand
Commit `dc7f344`); der Ordner `documentation/` ist mit Commit `0161867` aus dem Arbeitsbaum
entfernt worden, die Tabelle ist also nur über die Historie erreichbar.
