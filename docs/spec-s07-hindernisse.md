# S-07 — Temporäre Hindernisse

Blickwinkel: Weltgeometrie, Engine und Frontend

## 1) Zweck

**Fachlich:** Die Arena ist bisher ein leeres Rechteck. Ausweichen besteht damit nur
darin, sich vom Schwarm wegzubewegen — es gibt keine Deckung, keine Engstelle und keine
räumliche Fehlentscheidung, die den Spieler in eine schlechtere Position bringt.
Temporäre Hindernisse geben dem Ausweichen eine Topologie: sie erscheinen für ~30 s,
blockieren den Spieler, kosten ihn bei Kontakt ein Leben, und ihre Dichte steigt über die
Wellen. Der Schwarm zielt weiterhin auf den Spieler, umfliegt die Hindernisse aber.

**Technisch:** Die Hindernisse liegen vollständig in der Engine — Geometrie, Spawn,
Lebensdauer, Boid-Ausweichen und die Auflösung der Spielerbewegung. Das Frontend zeichnet
sie und zieht ein Leben ab. Damit bleibt die Projektinvariante „das Frontend enthält keine
Simulationsmathematik" erhalten, und Spieler- und Boid-Kollision rechnen zwangsläufig
gegen dieselbe Geometrie, statt sie über die Sprachgrenze hinweg zu duplizieren.

## 2) Geometrie: ein Hindernis ist eine Kapsel

Ein Hindernis ist eine **Kapsel** — zwei Endpunkte einer Mittellinie („Spine") plus ein
Radius. Ein kreisförmiges Hindernis ist die entartete Kapsel mit `spine_start ==
spine_end`, ein strichförmiges hat eine Spine echter Länge.

Es gibt bewusst **kein** `enum ObstacleKind { Circle, Segment }`:

- Ein Geometriepfad. `closest_point_on_segment` liefert für eine Strecke der Länge 0 ihren
  Startpunkt, die Kreis-Distanz fällt also ohne Verzweigung aus derselben Formel. Es gibt
  keinen zweiten Kollisionstest, der mit dem ersten auseinanderlaufen könnte.
- Ein Renderpfad. Canvas zeichnet mit `lineCap = 'round'` und `lineWidth = radius * 2`
  eine Nulllängen-Linie als Kreis. Das Frontend braucht keine Formunterscheidung.
- Ein flaches Buffer-Layout mit festem Stride statt eines getaggten Records, dessen Felder
  je nach Typ etwas anderes bedeuten.

Die beiden geforderten Formen entstehen also beim **Spawn**, nicht im Typsystem.

Benötigte Grundoperationen (`engine/src/math/segment.rs`):

| Funktion                                    | Zweck                                                          |
| ------------------------------------------- | -------------------------------------------------------------- |
| `closest_point_on_segment(point, a, b)`     | Basis für jeden Abstand zu einer Kapsel                        |
| `distance_from_point_to_segment(point,a,b)` | Boid- und Punktabfragen                                        |
| `segments_intersect(a0, a1, b0, b1)`        | Vorzeichentest über das 2D-Kreuzprodukt                        |
| `distance_between_segments(a0, a1, b0, b1)` | Abstand zweier Hindernisse **und** der Sweep-Test des Spielers |

`Vec2` bekommt dafür `cross` und `perp`; `dot` existiert bereits und wird hier erstmals
benutzt.

## 3) Die Sackgassen-Invariante

Die harte Anforderung lautet: der Spieler darf sich nie in eine Sackgasse manövrieren
können. Statt zur Laufzeit eine Erreichbarkeitssuche zu fahren, wird die Eigenschaft beim
Spawn **konstruktiv** erzwungen. Ein Kandidat wird nur angenommen, wenn alle vier
Bedingungen gelten:

1. Oberflächenabstand zu jedem bestehenden Hindernis ≥ `MINIMUM_CORRIDOR_WIDTH`.
2. Abstand zu jeder der vier Weltkanten ≥ `MINIMUM_CORRIDOR_WIDTH`.
3. Oberflächenabstand zum Spieler (um dessen Kollisionsradius aufgeblasen) ≥
   `MINIMUM_CORRIDOR_WIDTH`.
4. Der Radius ist so groß, dass die um den Spielerradius aufgeblasene Kapsel breiter ist
   als die weiteste Strecke, die der Spieler in einem Simulationsschritt zurücklegt
   (Dash: 1100 px/s ÷ 60 ≈ 18,3 px).

**Warum daraus Zusammenhang folgt.** Man blase jedes Hindernis um den Spielerradius auf —
das ist der Bereich, den der Spielermittelpunkt nicht betreten kann. Jede aufgeblasene
Kapsel ist konvex. Weil `MINIMUM_CORRIDOR_WIDTH > 2 · PLAYER_COLLISION_RADIUS` gilt,
berührt keine aufgeblasene Kapsel eine andere und keine berührt eine Weltkante: jedes
Hindernis ist eine isolierte konvexe Insel echt im Inneren der Arena. Der Freiraum ist das
Rechteck minus endlich vieler paarweise disjunkter konvexer Inseln, von denen keine den
Rand berührt — und der bleibt zusammenhängend, weil jede einzelne Insel umlaufbar ist,
ohne auf eine andere oder auf eine Wand zu stoßen. Ein Einschluss bräuchte mindestens zwei
sich berührende Hindernisse oder ein Hindernis an einer Wand; beides schließt die
Annahmeregel aus. Zusätzlich ist jeder Korridor breiter als der Spielerdurchmesser, er
passt also auch physisch hindurch.

`MINIMUM_CORRIDOR_WIDTH = 96` ist rund das Dreifache des Spielerdurchmessers und liest
sich damit als Gasse, nicht als Schlitz.

Der Preis dieser Konstruktion ist, dass die Dichte ein **Ziel** und die Invariante **hart**
ist: findet der Spawn nach seinen Versuchen keinen zulässigen Platz, erscheint in dieser
Runde kein Hindernis. In einer kleinen Welt und bei hoher Welle ist die Zahl gleichzeitig
sichtbarer Hindernisse daher faktisch durch die Fläche begrenzt, nicht durch die Rampe. Für
das Spiel selbst ist das inzwischen theoretisch — die Welt ist fest 1920×1080 groß —, für
die Engine bleibt es die Eigenschaft, die bei jeder übergebenen Weltgröße gilt.

Bedingung 3 verlangt bewusst nur einen Korridor und **nicht** die viel größere
`safe_spawn_distance`, die den Boid-Spawn vom Spieler weghält. Ein Boid wird weit
entfernt eingesetzt, weil es sofort zu jagen beginnt; ein Hindernis bewegt sich nie und
schuldet dem Spieler daher nur Platz zum Ausweichen. Mit der Boid-Distanz entstünde um
den Spieler eine Sperrscheibe von fast Arenabreite — nahezu jeder Kandidat würde
abgelehnt und die Welt bliebe leer. Das war in der Umsetzung auch genau der Fall,
bevor die Bedingung auf den Korridor umgestellt wurde.

**Sonderfälle:**

- _Der Spieler steht auf dem Wunschplatz_ → Bedingung 3 lehnt ab.
- _`resize()` verkleinert die Welt_ → jedes Hindernis, das die Invariante gegen die neuen
  Grenzen nicht mehr erfüllt, wird entfernt; die Garantie gilt dafür ohne Ausnahme. Im Spiel
  ist dieser Fall inzwischen nicht mehr erreichbar: die Welt hat eine feste logische Größe,
  die der Renderer ins Fenster einpasst, sodass ein Fensterresize die Simulation nicht mehr
  berührt. `GameEngine::resize()` bleibt als Engine-API bestehen und trägt die Zusicherung
  weiter, weil die Weltgrenzen der Engine gehören und nicht dem Browser.

## 4) Spawn, Lebensdauer und Dichte-Rampe

Kein `rand`. Der Spawn benutzt dasselbe Integer-Hash-Verfahren wie die Dash-Auswahl:
`step_counter / spawn_interval_steps` ist die Spawn-Runde, und aus ihr plus einem
Versuchszähler wird über feste Multiplikatoren ein Seed gebildet, aus dem Form, Ort,
Ausrichtung und Größe abgeleitet werden — jede über einen eigenen Multiplikator, damit sie
nicht miteinander korrelieren. Dieselbe Runde erzeugt damit immer dasselbe Hindernis, was
die Reproduzierbarkeit der Simulation erhält.

Die Multiplikatoren sind dabei **große** Primzahlen, nicht die kleinen, mit denen die
Dash-Auswahl auskommt, und das ist keine Kosmetik: bleibt das Produkt für die ersten
Seeds unter dem Modulus, ist der Rest das Produkt selbst — die frühen Spawn-Runden
landen alle in derselben Ecke der Welt und werden ausnahmslos wegen zu geringen
Randabstands abgelehnt. Ein Multiplikator weit über dem Modulus lässt den Rest schon bei
Seed 1 mehrfach überlaufen und verteilt die Kandidaten damit über die ganze Fläche.

Da der Schrittzähler beim Rundenstart bei null steht und null ein Vielfaches jedes
Intervalls ist, fällt die erste Spawn-Runde direkt auf den ersten Simulationsschritt: die
Welt ist nie leer, wenn der Countdown endet.

Alle Dauern zählen in **Simulationsschritten**, nie in Millisekunden. Bei 60 Schritten pro
Sekunde sind die geforderten 30 s Lebensdauer genau 1800 Schritte.

Die Rampe liegt in `obstacle_density.rs`, baugleich zu `dash_properties.rs`:

| Welle | Spawn-Intervall     | gleichzeitig sichtbar |
| ----- | ------------------- | --------------------- |
| 1     | 540 Schritte (~9 s) | 2                     |
| 5     | 360 Schritte (~6 s) | 6                     |
| 9+    | 180 Schritte (~3 s) | 8                     |

Die Stufe läuft bis `MAX_OBSTACLE_DENSITY_TIER = 8` und damit **doppelt so weit** wie die
Boid-Stufe (`MAX_BOID_DIFFICULTY_TIER = 4`). Das ist bewusst: die Boids sind ab Welle 5 am
Anschlag, die Anforderung an die Hindernisse lautet aber „über das Spiel hinweg steigend".
Ab Welle 9 wächst nur noch die Boid-Zahl weiter.

## 5) Boids weichen aus

Eine fünfte Steering-Regel `avoid_obstacles`, im Stil der bestehenden vier: unskaliert
berechnet, in `Flock::update` mit `boid.properties.obstacle_avoid_weight` gewichtet. Das
Gewicht liegt pro Boid, nicht global, weil Tuning-Werte, die sich pro Boid unterscheiden
könnten, laut Projektregel an den Boid gehören — **ohne** Tier-Rampe, denn Ausweichen ist
Kompetenz, nicht Schwierigkeit; die Schwierigkeit steckt in der Dichte.

Der Punkt, an dem eine naive Umsetzung scheitert: eine reine „weg von der Oberfläche"-Kraft
bremst einen frontal anfliegenden Boid vor dem Hindernis ab und lässt ihn dort zappeln,
statt ihn vorbeizuziehen — genau das Hängenbleiben, das die Anforderung ausschließt. Die
Kraft addiert daher einen **Tangentialanteil**: die zur Flugrichtung passende der beiden
Tangenten, sodass der Boid um das Hindernis herumkurvt. Die Stärke wächst mit der Nähe zur
Oberfläche.

Steering allein reicht nicht, wenn ein Hindernis auf einem Boid erscheint. Nach der
Overlap-Relaxation — die einen Boid ihrerseits in ein Hindernis hineinschieben könnte,
deshalb danach — wird jeder Boid im Inneren eines Hindernisses auf den nächstgelegenen
Oberflächenpunkt gesetzt. Dashende Boids sind davon ausgenommen, genauso wie sie in der
Overlap-Relaxation unbeweglich sind.

**Ein dashender Boid ignoriert Hindernisse.** Der Dash bleibt eine gerade Linie mit
Separation als einziger Kraft. Hängenbleiben ist dabei ausgeschlossen, weil ein Dash
zeitlich begrenzt ist, und die Vorwarnung im Frontend behält ihren Wert nur, solange das
Ziel der Linie vorhersagbar bleibt.

**Bewusste Vereinfachung:** Boids wrappen an den Weltkanten, Hindernisse nicht, und die
Abstandsrechnung kennt die Naht nicht. Ein Boid am linken Rand sieht ein Hindernis am
rechten Rand also nicht. Da Hindernisse `MINIMUM_CORRIDOR_WIDTH` von jeder Kante entfernt
bleiben und die Vorausschau begrenzt ist, betrifft das nur weit entfernte Hindernisse.

## 6) Grenze zwischen Engine und Frontend

Bisher übergibt das Frontend pro Tick nur die Spielerposition **nach** seiner Integration.
Für das Abgleiten braucht die Engine beide Positionen, weil sie sonst nicht unterscheiden
kann, ob der Spieler in ein Hindernis hineingelaufen ist oder schon darin stand:

```
tick(previous_x, previous_y, attempted_x, attempted_y) -> FrameResponse
```

Die Bewegung wird als **Strecke** gegen die Kapsel geprüft, nicht als Punkt. Das ist
gleichzeitig der Schutz gegen Durchtunneln bei Dash-Geschwindigkeit, den ein reiner
Punkttest je nach Hindernisdicke verpassen könnte. Bei Kontakt setzt die Engine den Spieler
um `OBSTACLE_KNOCKBACK_DISTANCE` **außerhalb** der aufgeblasenen Oberfläche ab, und
zwar auf der Seite, von der er kam, und meldet die Oberflächennormale zurück.

Dieselbe Prüfung gilt seit `obstacle_bounce.rs` auch für **Boids**: `resolve_movement_against_obstacles`
nimmt Position und Radius des Bewegten und kennt keinen Spieler, deshalb ist es genau eine
Kollisionsprüfung für eine Wand statt zwei, die auseinanderlaufen können.

Beide Hälften davon sind Bedingung dafür, dass man nicht feststecken kann — die erste
Fassung setzte den Spieler exakt _auf_ die Oberfläche und ließ genau das zu:

- **Auf der Seite, von der er kam**, weil das Ende der Bewegung kein Maßstab ist. Ein Dash
  endet tief im Hindernis oder ganz dahinter; ein Ausschieben entlang der nächstgelegenen
  Normale setzte den Spieler dann auf der falschen Seite ab.
- **Außerhalb statt genau auf der Oberfläche**, weil ein Spieler auf der Oberfläche genau
  den Abstand hat, den der nächste Test wieder als Berührung liest — auch bei einer
  Bewegung, die vom Hindernis weg führt, denn die geprüfte Strecke beginnt weiterhin auf
  der Oberfläche. Die Korrektur zog ihn dann in jedem Schritt zurück.

`FrameResponse` wächst um die korrigierte Spielerposition, ein `obstacle_hit`-Flag, die
Blockier-Normale und einen fünften Buffer für die Hindernisse:

```
[spine_start_x, spine_start_y, spine_end_x, spine_end_y, radius, life_fraction, hit_flash] · n
```

`life_fraction` (Restlebensdauer in `(0, 1]`) trägt denselben Gedanken wie `dash_phases`:
eine Zahl enthält den vollständigen Renderzustand, sodass das Frontend ein neues Hindernis
einblenden und ein ablaufendes ausblenden kann, ohne einen zweiten Buffer. `hit_flash`
(`[0, 1]`) ist dasselbe für das rote Aufleuchten nach einem Treffer: `0` heißt nichts zu
zeichnen, sonst zählt der Wert über `OBSTACLE_HIT_FLASH_STEPS` Schritte herunter.

Das Frontend dreht die Normalkomponente seiner Geschwindigkeit zu einem Bruchteil um
(`PLAYER_OBSTACLE_BOUNCE`) und behält die tangentiale — daraus entstehen der Rückstoß und
das Abgleiten — und beendet den Dash, genau wie es an der Weltkante schon geschieht. Der Lebensabzug benutzt denselben Unverwundbarkeits-Gate wie ein
Boid-Treffer. Ohne ihn verlöre ein Spieler, der sich an ein Hindernis lehnt, drei Leben in
drei Schritten, also in 50 ms.

## 7) Testfälle

### Engine (`cargo test`)

- Der nächste Punkt auf einer Strecke liegt zwischen den Endpunkten und wird darüber hinaus
  geklemmt; eine Strecke der Länge 0 liefert ihren Startpunkt (der Kreis-Fall).
- Sich schneidende Strecken haben Abstand 0; parallele behalten ihren Abstand.
- Ein Punkt im Inneren einer Kapsel meldet einen negativen Oberflächenabstand; die Normale
  zeigt von der Spine weg.
- Ein Hindernis läuft nach genau seiner Lebensdauer ab.
- Spätere Wellen spawnen häufiger und erlauben mehr gleichzeitig; beide Werte laufen in
  ihre Grenzen und nicht darüber hinaus.
- **Die Kernsicherung:** über viele Wellen gespawnte Hindernisse haben paarweise einen
  Freiraum ≥ `MINIMUM_CORRIDOR_WIDTH` und halten diesen Abstand zu jeder Weltkante.
- Ein Kandidat auf der Spielerposition wird abgelehnt; findet keiner Platz, erscheint keines
  statt eines, das die Korridorregel bricht.
- Dieselbe Spawn-Runde erzeugt immer dasselbe Hindernis.
- Eine Bewegung in ein Hindernis endet auf dessen Oberfläche; eine streifende Bewegung
  behält ihre Tangentialrichtung; eine Bewegung von Dash-Länge kann nicht durchtunneln.
- Ein Boid im Inneren wird herausgeschoben, ein dashender nicht.
- Eine verkleinerte Welt verliert die Hindernisse, die die Invariante brechen.
- Die Ausweichkraft ist null ohne Hindernis in Reichweite, zeigt von der Oberfläche weg und
  hat bei frontalem Anflug einen Tangentialanteil.
- Integrationstest im `Flock`: Boids steuern an einem Hindernis vorbei, nicht hindurch.

### WASM-Grenze (`wasm-pack test`)

- Der Hindernis-Buffer ist `obstacle_count * 6` Werte lang.
- Ohne Kontakt entspricht die zurückgegebene Spielerposition exakt der übergebenen und
  `obstacle_hit` ist `false`.

### Frontend (`npm test`)

- Die Ein-/Ausblend-Arithmetik der Hindernisse (reines Modul, wie `dashPulse.js`).
- `applyObstacleBlock`: Normalkomponente entfernt, Tangentialkomponente erhalten, Dash
  beendet.
- Die aus `index.js` ausgelagerte Runden- und Leben-Buchführung.

### Manuell im Browser

- Hindernisse erscheinen, blenden ein, verschwinden nach 30 s, und es sind nie mehr als das
  Wellenmaximum gleichzeitig sichtbar.
- Gegen Kreis und Strich fliegen: der Spieler gleitet entlang und verliert ein Leben; ein
  Anlehnen über Sekunden kostet nicht mehr als ein Leben pro Unverwundbarkeitsfenster.
- Mit Dash in ein Hindernis: kein Durchtunneln, der Dash endet dort.
- Der Schwarm kurvt durch ein Hindernisfeld, ohne dass ein Boid klebt oder feststeckt.
- Ab Welle 6 merklich mehr und häufiger Hindernisse.
- Welt stark verkleinern (nur über `GameEngine::resize()` erreichbar, nicht mehr über das
  Fenster): keine Hindernisse außerhalb der Welt, keine an einer Kante.

## 8) Aufwand

| Teil                                                      |  Aufwand |
| --------------------------------------------------------- | -------: |
| Kapsel- und Streckengeometrie inkl. Tests                 |      3 h |
| Spawn, Lebensdauer, Dichte-Rampe, Sackgassen-Invariante   |      4 h |
| Boid-Ausweichen (Regel, Tangentialanteil, Herausschieben) |      3 h |
| Spielerkollision und Erweiterung des Buffer-Vertrags      |      3 h |
| Rendering inkl. Ein-/Ausblenden                           |      2 h |
| Vorbereitende Refactorings (`index.js`, `FrameResponse`)  |      1 h |
| **Summe**                                                 | **16 h** |

S-07 ist ein **neuer** Spec und war in der ursprünglichen Aufstellung nicht enthalten. Er
ist keine Erweiterung von S-01, weil er die Weltgeometrie einführt statt das Schwarmmodell
zu verfeinern, und keine von S-05, weil er keine Spielerfähigkeit ist. Die Konsequenz für
das Gesamtbudget ist in [specs-overview.md](specs-overview.md) §3.4 festgehalten.
