# S-02 — WASM-Bridge-API (Puffer-Vertrag JS ↔ Rust)

Blickwinkel: Sprachgrenze, Engine und Frontend

Der Vertrag ist über die Projektlaufzeit **dreimal gewachsen** — um die Hindernisse, die
Spawn-Marker und die Vorwarnlinien. Dass die drei Erweiterungen nicht auseinandergelaufen sind,
liegt an einer Konvention, die dieser Spec voraussetzt: Das Layout eines Puffers steht als
Doc-Kommentar an dem Getter, der ihn zurückgibt — also an der Stelle, an der es gelesen wird.

## 1) Zweck

**Fachlich:** Die Engine simuliert, das Frontend zeigt. Damit das zwei unabhängig testbare
Hälften bleiben und nicht ein verteiltes Ganzes, braucht die Naht zwischen ihnen eine schmale,
explizite Form. Alles, was das Frontend über einen Frame wissen muss, muss durch diese Naht
gehen — und nichts darüber hinaus.

**Technisch:** Rust und JavaScript haben getrennte Speicherbereiche. Ein Rust-`Boid` ist für
JavaScript nicht lesbar; er müsste in ein JS-Objekt übersetzt werden. Bei 156 Boids und 60
Schritten pro Sekunde wären das rund 9.400 Objektübersetzungen pro Sekunde, deren Kosten mit
der Boid-Zahl wachsen. Der Vertrag vermeidet das, indem über die Grenze ausschließlich **flache
Zahlenfelder** und Skalare gehen. Die Kosten fallen damit pro _Frame_ an und nicht pro
_Entität_.

## 2) Was über die Grenze geht — und was nicht

`wasm_bridge/` ist die **einzige** `#[wasm_bindgen]`-Fläche des Projekts. Auf der anderen Seite
ist `frontend/src/engine-bridge.js` das einzige Modul, das das WASM-Modul anfasst. Beides ist
eine harte Regel und keine Konvention: eine zweite Stelle auf einer der beiden Seiten wäre eine
zweite Wahrheit über das Layout.

| Erlaubt                        | Nicht erlaubt                    |
| ------------------------------ | -------------------------------- |
| `Float32Array`, `Uint32Array`  | Objekte oder Structs pro Entität |
| Skalare (`u32`, `f32`, `bool`) | Verschachtelte Records           |
| Ein Handle pro Frame           | Ein Handle pro Boid              |

`FrameResponse` ist der eine Grenzfall und die naheliegende Rückfrage: Das ist doch ein Objekt.
Es ist ein `#[wasm_bindgen]`-**Handle** — JavaScript hält einen Verweis auf die Rust-Struktur
und ruft Methoden darauf, konvertiert wird nichts. Die Regel bedeutet „kein Objekt pro Entität":
ein Handle pro Frame ist konstanter Aufwand, 156 Objekte pro Frame wären es nicht.

## 3) Die sieben Puffer

`wasm_bridge/frame_buffers.rs` packt alle sieben an einer Stelle und besitzt die drei
Stride-Konstanten. `mod.rs` daneben besitzt die Exportfläche und den Lebenszyklus der Engine.

### Vier indexsynchrone Puffer

Eine Liste pro Eigenschaft, nicht eine Liste pro Boid. Boid _i_ steht in jeder der vier an
derselben Indexposition, und ein gemeinsamer Zähler `entity_count` genügt:

| Puffer        | Typ            | Werte pro Boid | Inhalt                             |
| ------------- | -------------- | -------------: | ---------------------------------- |
| `positions`   | `Float32Array` |              2 | `x, y`                             |
| `velocities`  | `Float32Array` |              2 | `vx, vy` — für die Ausrichtung     |
| `tiers`       | `Uint32Array`  |              1 | Schwierigkeitsstufe, für die Farbe |
| `dash_phases` | `Float32Array` |              1 | Renderzustand des Dashs (§4)       |

`velocities` liegt an der Grenze, obwohl das Frontend keine Physik rechnet: Es braucht die
Flugrichtung, um den Pfeil zu drehen. Die Alternative — eine Winkelangabe — wäre ein zweiter
Wert, den die Engine erst berechnen müsste, und `atan2` gehört zur Darstellung.

### Drei Puffer mit eigener Zählung

Diese drei sind **nicht** indexsynchron, weil zwischen ihrer Anzahl und der Boid-Zahl kein
Zusammenhang besteht. Jeder trägt seinen eigenen Zähler und seine eigene Schrittweite:

| Puffer          | Stride | Inhalt pro Eintrag                                                |
| --------------- | -----: | ----------------------------------------------------------------- |
| `obstacles`     |      7 | `spine_start_x/y, spine_end_x/y, radius, render_phase, hit_flash` |
| `spawn_markers` |      3 | `x, y, warning_progress`                                          |
| `dash_aims`     |      5 | `start_x/y, end_x/y, charge_progress`                             |

Die Begründung steht am Getter von `dash_aims` und gilt für alle drei: Von bis zu 156 Boids
laden höchstens ein Dutzend gleichzeitig. Ein indexsynchroner Puffer hätte rund 140 leere
Plätze, die der Renderer überspringen müsste. Der Preis der kompakten Form ist, dass jeder
Eintrag seine Position selbst mitbringen muss — `dash_aims` wiederholt deshalb den
Ladefortschritt, den `dash_phases` schon trägt: der Index, der ihn gefunden hätte, ist genau
das, was ein Puffer mit eigener Zählung nicht hat.

### Skalare

`entity_count`, `hit_count`, `hit` (abgeleitet aus `hit_count > 0`), die drei Zähler der
kompakten Puffer, die aufgelöste Spielerposition `player_x`/`player_y`, `obstacle_hit` und die
Blockiernormale `block_normal_x`/`block_normal_y`.

`hit_count` ist eine Zahl und kein Flag, weil das Frontend die Treffer **jedes** Schritts eines
Bildes verarbeiten muss — bei mehreren Boids gleichzeitig trüge ein `bool` weniger Information
als die Situation hat. `hit` existiert daneben als Bequemlichkeit für den häufigen Fall.

`FrameResponse` wird mit einem Struct-Literal gebaut und nicht über einen positionsbehafteten
Konstruktor. Der Grund steht im Code: bei sechs Argumenten aus wenigen gleichen Typen — Puffer
oder Zähler — würde ein Aufrufer, der zwei vertauscht, weiterhin kompilieren. Jedes Feld an der
einen Stelle zu benennen, an der es gefüllt wird, macht diesen Fehler unmöglich.

## 4) Der Vorzeichen-Trick — und wo er absichtlich fehlt

`dash_phases` packt einen ganzen Renderzustand in eine Zahl:

```
 0,0        nichts zu zeichnen
(0, 1]      lädt auf, und wie weit
[-1, 0)     dasht, und wie viel davon noch übrig ist
```

Das Vorzeichen trägt den Zustand, der Betrag den Fortschritt. Ein zweiter Puffer für „welcher
Zustand" entfällt damit vollständig. Dieselbe Form benutzt `render_phase` eines Hindernisses:
negativ heißt „materialisiert noch und ist **nicht solide**", positiv heißt „solide, und so viel
Leben ist übrig". Exakt `0,0` tritt dort nie auf, weshalb das Vorzeichen immer aussagekräftig
ist.

Bei `spawn_markers` und `dash_aims` fehlt der Trick **absichtlich**, und das ist die eigentlich
interessante Hälfte der Regel: Ein Eintrag existiert dort nur, solange die Sache ansteht. Der
eigene Zähler sagt schon, wie viele es gibt, also ist jeder Wert im Puffer ein echter, und ein
„hier ist nichts" muss nicht ausdrückbar sein.

**Die Regel dahinter:** Zum Vorzeichen greift man nur, wenn eine Zahl einen Zustand _und_ ein
„nichts vorhanden" tragen muss. Wo ein Zähler das „nichts" bereits erledigt, wäre das
Vorzeichen eine zweite, überflüssige Kodierung.

## 5) Eigentum, Wiederverwendung und die Kopie

Die Engine hält ihre sieben Puffer über alle Frames und leert sie pro Frame mit `clear()`, was
die reservierte Kapazität behält. Nach den ersten Sekunden einer Runde steht jeder Puffer damit
auf seinem Höchststand und ein Frame kostet auf Rust-Seite **keine** neue Speicheranforderung.
Für die beiden Puffer, deren Länge stark schwankt, wird zusätzlich vorab reserviert; für
`dash_aims` bewusst nicht, weil ein Zählen der ladenden Boids ein zweiter Durchlauf über den
ganzen Schwarm wäre, für eine Allokation, die längst passiert ist.

Nach außen geht eine **Kopie**, kein Zeiger. Der Grund ist Sicherheit: Ein Zeiger in den
WASM-Speicher würde ungültig, sobald die Engine ihre Puffer im nächsten Frame neu füllt oder der
Speicher wächst; JavaScript läse dann alten oder fremden Speicher. Die Kopie kostet dafür einen
vollen Durchlauf über die Daten und ist die einzige Stelle im Entwurf, an der bewusst Aufwand
gegen Sicherheit getauscht wird.

**Zwei Präzisierungen, die eine Pauschalaussage nicht überlebt:**

- Es sind **zwei** Kopien pro Puffer und Frame, nicht eine: `build_frame_response` klont den
  Engine-Puffer in die `FrameResponse` (`Vec<f32>`), und der Getter wandelt ihn danach über
  `Float32Array::from` in ein JS-Array. „Ein Frame kostet keine Allokation" gilt für die Puffer
  der Engine, nicht für die Antwort.
- Die Getter sind **Methoden, keine Felder**. Jeder Aufruf kopiert erneut. Deshalb ruft
  `engine-bridge.js` jeden genau einmal auf und legt das Ergebnis in ein Objekt; zweimal
  `frame.positions()` wären zwei Kopien.

Der Satz „Speichersicherheit ohne Garbage Collection" gilt für die Rust-Seite: dort gibt es
keinen Aufräumer, der zur Laufzeit unvorhersehbar dazwischenpausiert, was bei fester Schrittrate
der eigentliche Gewinn ist. Die JavaScript-Seite hat eine Garbage Collection, und die Kopie
erzeugt pro Frame typisierte Arrays, die sie aufräumen muss. Die belastbare Fassung lautet
deshalb: _die Simulation läuft ohne GC und ohne Allokation pro Frame, der einzige GC-Druck
entsteht durch die Kopie an der Grenze._

## 6) Die Aufruffläche

| Aufruf                                                          | Wirkung                                                                          |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `new GameEngine(width, height, boid_count, player_x, player_y)` | Welt und erster Schwarm; `boid_count == 0` fällt auf `INITIAL_BOID_COUNT` zurück |
| `tick(previous_x, previous_y, attempted_x, attempted_y)`        | Genau **ein** fester Schritt, liefert `FrameResponse`                            |
| `snapshot()`                                                    | Derselbe Frame, ohne die Simulation zu bewegen                                   |
| `set_wave(wave, player_x, player_y)`                            | Kündigt eine Welle an; fügt der Welt **nichts** hinzu                            |
| `resize(width, height)`                                         | Neue Weltgrenzen, verwirft Hindernisse, die die Invariante brechen               |

Vier Eigenschaften dieser Fläche sind Festlegungen und nicht Zufall:

**`tick` nimmt zwei Positionen.** Die Engine besitzt die Hindernisse und löst die
Spielerbewegung gegen sie auf. Mit nur der Zielposition könnte sie nicht unterscheiden, ob der
Spieler in ein Hindernis hineingelaufen ist oder schon darin stand, und ein Punkttest würde
einen Dash durch eine dünne Stange hindurchtunneln lassen. Die Antwort enthält die
**korrigierte** Position, der Aufrufer muss also `frame.playerPosition` benutzen und nicht, was
er gefragt hat.

**`snapshot` bekommt keine Spielerposition.** Es berichtet eine absichtlich eingefrorene Welt
(Countdown, Tod, Pause), also ist die letzte gespeicherte Position keine Näherung — es hat sich
seither nichts bewegt. Die Engine hält sie in `last_player_position`, wo auch die Vorwarnlinien
sie herholen.

**`set_wave` fügt nichts hinzu.** Die Boids stehen `WAVE_SPAWN_WARNING_STEPS` (120 Schritte,
2 s) in einer Warteschlange und betreten die Welt erst, wenn `tick()` sie abgearbeitet hat.
`entity_count` **hinkt** der Wellennummer deshalb um das Warnfenster nach, und das ist die
Wahrheit über die Zahl der Boids in der Arena, kein Fehler. Ein Aufrufer, der sie präsent haben
will, muss weiterticken.

**`resize` hat heute keinen Aufrufer** und bleibt trotzdem. Die Weltgrenzen gehören der Engine
und nicht dem Browser; das Frontend hat eine feste logische Weltgröße und passt sie ins Fenster
ein, sodass ein Fensterresize die Simulation nicht mehr berührt. Die Zusicherung, dass eine
verkleinerte Welt den Spieler nicht einsperren kann, wird ausschließlich hier geprüft — der
Doc-Kommentar sagt ausdrücklich, dass die Methode nicht als toter Code entfernt werden darf.

## 7) Namen und die Umsetzung auf JS-Seite

`engine-bridge.js` wandelt die `snake_case`-Getter der Engine in ein `camelCase`-Frame-Objekt
(`entity_count` → `entityCount`, `dash_phases` → `dashPhases`). Das ist der Zweck des Moduls
neben dem Laden: Rust-Namenskonventionen sollen nicht weiter ins Frontend durchschlagen als
diese eine Datei.

`normalizeFrameResponse` hat einen Sonderfall, der eine Notiz verdient: Bei einem `snapshot()`
wird keine versuchte Position übergeben, und `playerPosition` kommt dann als `null` heraus. Der
Kommentar dort liest sich, als fiele der Wert auf die versuchte Position zurück — das tut er
formal auch, sie ist eben `null`. Gelesen wird das Feld nur an einer Stelle
(`simulationStep.js`, und dort nur bei `frame.obstacleHit`), die ausschließlich auf dem
`tick`-Pfad läuft. Heute also harmlos; ein künftiger Aufrufer, der `frame.playerPosition` aus
einem Snapshot liest, greift auf `null`.

### Ein Fehler, der die Form des Moduls bestimmt hat

Das Modul hält den Ladevorgang als **Promise**, nicht das geladene Modul und kein Flag. Der
Grund ist ein echter Absturz: Ein Flag wird erst gesetzt, wenn das Laden _fertig_ ist. Zwei
Aufrufe, die starten, während der erste noch lädt, finden es also beide ungesetzt und laden
beide — und die von `wasm-bindgen` erzeugte Init-Funktion schützt nur gegen ein _fertiges_
Laden. Der zweite Aufruf instanziiert damit ein zweites WebAssembly-Modul mit eigenem Speicher.
Ab da werden die beiden vermischt: Zeiger der einen Instanz werden mit der anderen benutzt, und
die Finalisierer der verworfenen Instanz geben deren Adressen im überlebenden Heap frei. Sichtbar
wird die Korruption Minuten später als nackter `RuntimeError` aus `tick()`. Ein gemeinsam
erwartetes Promise gibt jedem Aufrufer dieselbe einzige Instanz.

## 8) Duplizierte Konstanten und wo sie geprüft werden

Drei Werte stehen absichtlich mehrfach im Repository:

| Wert                      | Orte                                                                         |
| ------------------------- | ---------------------------------------------------------------------------- |
| `OBSTACLE_STRIDE` (7)     | `frame_buffers.rs`, `gameConfig.js`, `engine/tests/wasm_obstacle_tests.rs`   |
| `SPAWN_MARKER_STRIDE` (3) | `frame_buffers.rs`, `gameConfig.js`, `engine/tests/wasm_wave_spawn_tests.rs` |
| `DASH_AIM_STRIDE` (5)     | `frame_buffers.rs`, `gameConfig.js`, `engine/tests/wasm_dash_aim_tests.rs`   |
| `INITIAL_BOID_COUNT` (24) | `engine/src/constants.rs`, `frontend/src/gameConfig.js`                      |

Die Dopplung zwischen Engine und Frontend ist unvermeidbar — ein `const` überquert die
Sprachgrenze nicht — und wird von den Grenztests abgesichert, die genau darauf zusichern, dass
`count * stride == buffer.length`.

Die **dritte** Kopie in den Tests ist der eigentliche Trick und im Testcode auch so kommentiert:
Ein Test, der die echte Konstante importiert, würde einer Änderung an ihr stillschweigend
folgen und damit aufhören, den Vertrag zu prüfen. Eine literale 7 im Test bricht, wenn jemand
den Stride ändert, ohne das Frontend nachzuziehen — was der Zweck ist.

## 9) Testfälle

### WASM-Grenze (`wasm-pack test --headless --firefox`)

Vier Dateien unter `engine/tests/`:

| Datei                      | Gegenstand                                                      |
| -------------------------- | --------------------------------------------------------------- |
| `wasm_tests.rs`            | Der Vier-Puffer-Vertrag, Treffer, Wellen, `resize`, Dash-Phasen |
| `wasm_obstacle_tests.rs`   | Hindernis-Puffer und Spielerkollision                           |
| `wasm_wave_spawn_tests.rs` | Spawn-Marker und das Warnfenster                                |
| `wasm_dash_aim_tests.rs`   | Vorwarnlinien                                                   |

Was sie zusichern:

- Jeder Puffer ist genau `count * stride` Werte lang — für alle sieben.
- Die vier Boid-Puffer sind index-synchron, sowohl nach `snapshot()` als auch nach `tick()` und
  auch nachdem eine spätere Welle Boids hinzugefügt hat.
- Jeder Wert, den der Renderer als Phase interpretiert, liegt im erwarteten Bereich —
  `dash_phases` in `[-1, 1]`, `render_phase` eines Hindernisses ohne die exakte 0,
  `warning_progress` in `[0, 1)`.
- Ein Boid-Count von 0 fällt auf den Default zurück; eine Welt der Größe 0 liefert weiterhin
  einen benutzbaren Frame.
- `snapshot()` bewegt nichts.
- `set_wave` fügt Marker hinzu, aber keine Boids; die Welle trifft nach genau ihrem Warnfenster
  ein; eine bereits angekündigte Welle wird ignoriert.
- `hit` und `hit_count` widersprechen sich nicht.
- Ohne Kontakt entspricht die zurückgegebene Spielerposition exakt der übergebenen und
  `obstacle_hit` ist `false`.
- Eine Vorwarnlinie existiert genau so lange wie der Puls, startet am Boid und ist so lang, wie
  der Dash trägt.

### Zwei Eigenschaften dieser Suite, die man falsch lesen kann

**`cargo test` meldet für `engine/tests/` null Tests.** `#[wasm_bindgen_test]` expandiert für
das Host-Target zu nichts, die Dateien kompilieren also und enthalten anschließend keinen Test.
Ein grünes `cargo test` sagt damit **überhaupt nichts** über die WASM-Grenze aus — und genau so
ist `wasm_tests.rs` zwei Monate lang als leerer Rumpf liegengeblieben, ohne dass irgendein
Signal darauf hinwies. Geprüft wird die Grenze ausschließlich von `wasm-pack test`.

**`cargo llvm-cov` instrumentiert das Host-Target.** Diese Tests heben die Rust-Coverage deshalb
nicht: `wasm_bridge/response.rs` weist 0 % aus, während jeder Puffer, den es zurückgibt, von den
Browser-Tests abgedeckt ist. Die Zahl untertreibt dort, und jede Berichterstattung darüber muss
das sagen, statt beide Fakten unkommentiert nebeneinander zu stellen.

### Frontend (`npm test`)

Zu `engine-bridge.js` gibt es **keine** Vitest-Tests, und das ist strukturell und nicht
versäumt: Vitest läuft im `node`-Environment, das Modul importiert das gebaute WASM-Paket, ein
Test darüber liefe also nicht. Abgedeckt ist es über die Playwright-Suite
(`e2e/engine-instance.spec.js` prüft insbesondere, dass genau eine Engine-Instanz entsteht — der
Fehler aus §7).

## 10) Abgrenzung

- **Kein Callback aus der Engine heraus.** Die Engine ruft nie ins Frontend zurück; sie
  antwortet nur. Ein Callback über die Grenze wäre ein zweiter Kontrollfluss neben dem
  Zeitschritt, und der Zeitschritt ist die tragende Invariante.
- **Kein `console.log` und kein Panic-Hook auf dem heißen Pfad.** Ausgabe aus WASM heraus
  kostet einen Grenzübertritt pro Aufruf.
- **Keine Delta-Zeit über die Grenze.** `tick()` rechnet einen festen Schritt und skaliert
  nicht mit vergangener Zeit; ein Zeitparameter wäre die Einladung, genau das zu tun.
- **Keine Serialisierung, kein JSON, kein `serde` an der Grenze.** Alles, was hier
  überquert wird, hat ein festes Layout und eine feste Länge; ein Format, das sich selbst
  beschreibt, würde beides pro Frame neu mitteilen.

## 11) Aufwand

Geschätzt waren **1,5 h**, erfasst sind **5,0 h** über drei Journalzeilen — der größte
relative Fehlschuss der ursprünglichen Schätzung. Zwei Gründe, beide belegbar:

1. **Der Vertrag ist dreimal gewachsen.** Geschätzt wurde er für vier Puffer. Hinzugekommen sind
   `obstacles` (S-07), `spawn_markers` (S-04) und `dash_aims` (S-05) — jeweils mit eigener
   Zählung, eigenem Stride, eigener Dopplung in `gameConfig.js` und eigenen Grenztests.
2. **Die Doppel-Instanziierung** aus §7 hat als sporadischer `RuntimeError` minutenlang nach dem
   Start zugeschlagen und war entsprechend teuer zu finden.

Die Zahlen stammen aus der Plan-/Ist-Tabelle des abgegebenen Berichts (Anhang, Stand Commit
`dc7f344`). Der Ordner `documentation/` ist mit Commit `0161867` aus dem Arbeitsbaum entfernt
worden und nur über die Historie erreichbar.
