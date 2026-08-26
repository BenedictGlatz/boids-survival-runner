# S-03 — Rendering & HUD

Blickwinkel: Frontend

Mit 11,5 h erfasstem Aufwand ist S-03 der drittteuerste fachliche Posten des Projekts, hinter
S-05 und S-07 — der Grund dafür steht in §11. Für die Ebenen des Renderers gilt dabei dieselbe
Konvention wie für die Puffer an der WASM-Grenze: Die Begründung einer Festlegung steht als
Kommentar im Kopf des Moduls, das sie umsetzt, und dieser Spec ordnet sie ein.

## 1) Zweck

**Fachlich:** Das Spiel muss in einem einzigen Blick lesbar sein. Der Spieler sieht bis zu 156
Boids, mehrere Hindernisse, Ladewarnungen, Spawn-Ankündigungen und den eigenen Zustand
gleichzeitig — und muss daraus in Bruchteilen einer Sekunde ableiten, wohin er ausweicht. Fast
jede Festlegung in diesem Spec ist eine Antwort auf diese Anforderung und nicht auf eine
technische.

**Technisch:** Das Frontend enthält **keine** Simulationsmathematik. Es bekommt flache
Zahlenfelder (S-02), zeichnet daraus ein Bild und zeigt Zahlen an. Wo Arithmetik unvermeidbar
ist, weil eine Zahl der Engine in drei Zeichenwerte übersetzt werden muss, liegt sie in einem
importfreien Modul mit eigenen Tests — nicht im Renderer.

## 2) Zwei Flächen: Canvas und DOM

Die Anzeige verteilt sich auf zwei Techniken, und die Aufteilungsregel ist knapp:

| Fläche     | Was dort liegt                                                                 | Warum                                            |
| ---------- | ------------------------------------------------------------------------------ | ------------------------------------------------ |
| **Canvas** | Arena, Hindernisse, Boids, Spieler, Schweife, Marker, Vorwarnlinien, Countdown | Bewegt sich pro Bild und lebt in Weltkoordinaten |
| **DOM**    | HUD-Werte, Dash-Balken mit Label, Buff-Zeilen, Menü, Karten                    | Textinhalt ändert sich selten oder nie           |

Das Kriterium ist nicht „Spiel gegen UI", sondern **wie oft sich der Inhalt ändert**. Ein
Beschriftungstext auf dem Canvas müsste sechzigmal pro Sekunde neu rasterisiert werden, obwohl
er sich nie ändert; im DOM rastert ihn der Browser einmal. Umgekehrt wären 156 bewegte Pfeile
als DOM-Elemente 156 Layout-Objekte pro Bild.

Ein Wert liegt bewusst auf **beiden** Flächen, und das ist keine versehentliche Dopplung: der
Dash-Cooldown. Im HUD am unteren Bildrand steht der beschriftete Balken — dort schaut man
zwischen zwei Kämpfen hin. Unter dem Spieler steht ein kleiner, unbeschrifteter Zwilling — dort
sind die Augen während eines Kampfes, und ihn zu lesen kostet keinen Blick weg vom Schwarm. Der
zweite trägt bewusst **keine** Information, die der erste nicht hat.

### Die Indirektion über `renderer.js`

`Renderer` delegiert an `CanvasRenderer`. Der Zweck ist ausschließlich, dass eine
WebGL-Implementierung den Platz einnehmen könnte, ohne einen Aufrufer zu ändern. Die Fläche
umfasst `drawFrame`, `hide`, `show`, `resetTrails`, `resize`, `readDrawCalls` und
`backingStorePixels` — die letzten zwei nur für das opt-in Performance-Overlay.

## 3) Die Welttransformation

Die Welt ist fest **1920 × 1080** logische Einheiten und folgt dem Fenster **nicht**. Das ist
eine Festlegung mit Folgen weit über die Darstellung hinaus: eine Fenstergrößenänderung erreicht
die Simulation nicht mehr, weshalb `GameEngine::resize()` heute keinen Aufrufer hat (S-02 §6).

`fitWorldToCanvas` bildet sie so ins Fenster ab, wie ein `contain`-Bild sich einpasst: Skalierung
mit dem **kleineren** der beiden Verhältnisse, dann zentriert, sodass der Rest zu zwei gleichen
Rändern wird (Letterboxing).

Warum nicht pro Achse skalieren und das Fenster exakt füllen: Die Hindernisse sind Kapseln, also
aus Kreisen gebaut. Bei getrennten Achsenskalierungen würde jeder Kreis zur Ellipse, und ein
Kollisionsradius, der auf einer Achse anders aussieht als auf der anderen, ist eine Lüge über
die Geometrie, gegen die gespielt wird.

Zwei Details, die im Modul eigene Kommentare haben:

- **`MINIMUM_CANVAS_EXTENT = 1`.** Ein Fenster mitten im Minimieren und ein wiederhergestellter
  Chromium-Tab melden Größe 0. Ohne diese Untergrenze käme die Skalierung als `0` heraus und
  jede Koordinate fiele auf einen Punkt zusammen — oder sie würde, sobald etwas durch die
  Skalierung teilt (was die Weltkanten-Haarlinie tut), zu `Infinity` und vergiftete die ganze
  Canvas-Transformation.
- **Es gibt keine Umkehrfunktion** (Bildschirmpunkt zurück auf Weltpunkt). Das Spiel wird auf der
  Tastatur gespielt, nichts darin liest eine Zeigerposition, und ein untesteter unbenutzter
  Export ist schlechter als der fehlende.

`worldTransformMatrix` setzt die beiden Abbildungen — Welt → CSS-Pixel und CSS → Gerätepixel — zu
der einen Matrix zusammen, die `setTransform` nimmt. Dass die Offsets ebenfalls mit dem
Pixelverhältnis multipliziert werden müssen, ist der Teil, den man leicht falsch macht, und der
Grund, warum das eine getestete Funktion ist und nicht sechs zweimal ausgeschriebene Argumente.
**Zweimal**, weil zwei Flächen dieselbe Transformation tragen: das sichtbare Canvas und das
Offscreen-Canvas des gebackenen Hintergrunds (§6). Wichen die beiden um einen Rundungsschritt
voneinander ab, läge der Hintergrund einen Bruchteil eines Pixels neben allem, was live darüber
gezeichnet wird.

## 4) Die Zeichenreihenfolge ist die Aussage

`drawFrame` zeichnet in dieser Reihenfolge, und jede Position begründet sich aus dem, was das
Element _ist_:

| #   | Ebene                       | Begründung der Position                                                               |
| --- | --------------------------- | ------------------------------------------------------------------------------------- |
| 1   | Arena-Hintergrund           | Deckt jeden Pixel und **ist damit auch die Löschung** (§6)                            |
| 2   | Hindernisse                 | Unter allem Bewegten, damit sie als Terrain lesen und nicht als Vordergrund           |
| 3   | Power-up-Marker             | Liegen am Boden: über den Hindernissen, unter allem Bewegten                          |
| 4   | Spawn-Marker                | Ebenfalls am Boden — dort steht noch nichts, also darf er über nichts liegen          |
| 5   | Dash-Schweife               | Bewegung, nicht Terrain — aber Abgas ihrer Besitzer, also unter diesen                |
| 6   | Vorwarnlinien               | Aussage über einen Boid, also unter dem Boid und unter dem Spieler, auf den sie zeigt |
| 7   | Boids                       |                                                                                       |
| 8   | Spieler                     |                                                                                       |
| 9   | Buff-Hüllen und Zeitbögen   | Liegen auf dem Spieler, also nach ihm                                                 |
| 10  | Status-Balken (Leben, Dash) | Die Leben sind das eine, was nie übermalt werden darf — also zuletzt                  |
| 11  | Countdown                   | Über allem, mit Verdunkelung über die Ränder hinweg                                   |

Zwei Ebenen brauchen **Screen Space** statt Weltkoordinaten, weil sie den Bereich _außerhalb_ der
Welt abdecken müssen: der Hintergrund samt Letterbox-Rändern und die Countdown-Verdunkelung. Das
erledigt ein `_inScreenSpace`-Helfer, der die Transformation kurz zurücksetzt.

Die Schweif-Abtastung läuft **vor** dem Zeichnen der Schweife, damit ein Band und sein Besitzer
nie ein Bild auseinanderliegen. Sie läuft außerdem nur für ein lebendes Bild, das die Schleife
durch die Anwesenheit von `deltaSeconds` markiert: Während des Countdowns und nach einem Tod
bewegt sich nichts, und ein stehendes Bild abzutasten würde die Bänder einziehen, die zum Bild
gehören, statt es eingefroren zu lassen.

## 5) Zwei Uhren, und was an welcher hängt

Das ist die Festlegung, die man beim Zeichnen am leichtesten falsch macht:

| Uhr                           | Was daran hängt                                                           |
| ----------------------------- | ------------------------------------------------------------------------- |
| **Simulationsuhr** (Schritte) | Score, Timer, Wellen, Dash-Cooldown, Buff-Restzeiten, Treffer-Gnadenfrist |
| **Wanduhr** (Millisekunden)   | Drehung und Wippen der Marker, Startring des Dash-Schweifs, Countdown     |

Die Regel: **Alles, was das Spiel entscheidet, zählt in Schritten. Alles, was nur aussieht,
läuft auf der Wanduhr.**

Der Grund ist die Drosselung des Zeichnens. Eine Deko-Animation, die Simulationsschritte zählt,
liefe bei 30 fps genauso schnell wie bei 120 — sie soll aber immer gleich flüssig aussehen.
Umgekehrt würde ein Score auf Wanduhrzeit einem Spieler mit schwachem Rechner Punkte schenken
oder wegnehmen, je nachdem, wie das Frontend gerade taktet.

`buildRenderState` (in `loop/renderState.js`) baut das eine Objekt, das Renderer und HUD lesen.
Bemerkenswert daran ist, was im eingefrorenen Zweig **fehlt**: `deltaSeconds`, `playerSpeed` und
die Geschwindigkeit sind dort einfach nicht vorhanden, und ihre Abwesenheit ist das Signal, an
dem der Renderer erkennt, dass er ein stehendes Bild nicht in den Schweif abtasten darf. Das
Objekt entscheidet nichts; Renderer und HUD bekommen Daten und fragen nichts zurück, was sie
frei von jedem Bezug auf die Simulationsseite hält.

## 6) Kosten: was gebacken wird und was pro Bild entsteht

Drei Festlegungen, die den Renderer billiger machen, ohne das Bild zu ändern:

**Der Arena-Hintergrund wird gebacken.** Void außerhalb der Welt, Arenafläche, zwei Gitter und
die Weltkante sind konstant, solange das Fenster seine Größe hält — wurden aber pro Bild neu
gezeichnet: zwei Vollflächenfüllungen und 66 gestrichelte Gittersegmente, auf einer integrierten
GPU der größte Einzelposten eines Bildes. Gebacken in ein Offscreen-Canvas in Geräteauflösung
wird daraus **ein** `drawImage`. Das Ergebnis ist pixelidentisch und nicht nur ähnlich, weil das
Backen dieselbe zusammengesetzte Transformation bei derselben Gerätegröße benutzt und danach mit
Identitätstransformation auf `0, 0` geblittet wird — es findet nirgends ein Resampling statt.

Gebacken wird in `resize`, dem einzigen Moment, in dem sich eine Eingabe ändern kann. Und zwar
bedingungslos, ohne die Argumente zu vergleichen: ein Resize ist selten, und ein Cache, der
selbst über seine Aktualität entscheidet, ist ein Fehler, der auf die eine Eingabe wartet, die
jemand beim Vergleich vergisst. Fehlt `document` (Vitest) oder verweigert der Browser das zweite
Canvas, fällt das Modul auf den direkten Pfad zurück — ein Renderer, der wirft, ist schlechter
als einer, der langsam zeichnet.

**Das Canvas ist opak** (`{ alpha: false }`). Der Hintergrund deckt jeden Pixel, es gibt also
nichts, was Transparenz zeigen könnte, und das zu erklären erspart dem Compositor eine
Vollbild-Überblendung des Canvas gegen die Seite pro Bild. Die Eigenschaft wird nur beim
**ersten** `getContext` einer Element-Instanz beachtet, weshalb sie im Konstruktor steht.

Daraus folgt, dass es **kein `clearRect`** gibt: Der Hintergrund ist die Löschung. Pixel zu
löschen, die unmittelbar danach überschrieben werden, wäre ein zweiter voller Durchgang über das
Canvas ohne sichtbare Wirkung. Aus demselben Grund verbirgt `hide()` das Canvas-Element, statt es
leerzuwischen — auf einem opaken Canvas malt `clearRect` Schwarz statt Nichts, und der
Menühintergrund dahinter wäre verschwunden.

**Boid-Farben sind vorberechnet.** Ein Boid wird während einer Ladephase heller. Die Farbe pro
Boid und Bild zu mischen würde auf jedem einen neuen String bauen, was die Projektregeln im
heißen Pfad ausschließen. Stattdessen ist der Verlauf auf `GLOW_STEPS = 6` Stufen quantisiert
und die komplette Tabelle liegt vor dem ersten Bild im Speicher; `glowColorForBoid` greift nur
noch zu.

Gemessen wird über zwei Werte, die absichtlich getrennt sind: `readDrawCalls` zählt
Zeichenoperationen — ein Näherungswert für Zeichenkosten, **nie** für GPU-Zeit, und er sagt
nichts darüber, wie viel Fläche eine Operation bedeckt hat. `backingStorePixels` liefert die
Gerätepixel des Backing Stores, denn es ist `devicePixelRatio` im Quadrat, das ein bescheidenes
Fenster teuer macht; CSS-Pixel zu berichten würde genau das verbergen.

## 7) Farben tragen Bedeutung, nicht Geschmack

Die Palette ist ein Rollensystem, und das ist der Grund, warum eine Farbe nicht einfach getauscht
werden kann:

| Farbe                | Rolle                         |
| -------------------- | ----------------------------- |
| Cyan `#38bdf8`       | Der Spieler                   |
| Grün `#22c55e`       | Leben — und nur Leben         |
| Amber `#fbbf24`      | „Das ist vorübergehend"       |
| Rot-Familie (5 Töne) | Die fünf Schwierigkeitsstufen |

`BOID_COLORS` hat fünf Töne für fünf Stufen, die bei Pfeilgröße in einer Menge von neunzig
bewegten Objekten unterscheidbar bleiben müssen — sie können deshalb nicht alle in der
Rot-Familie liegen. Die vierte Stufe war einmal Amber und ist nach Fuchsia gewandert, weil Amber
inzwischen für sich „vorübergehend" bedeutet (Unverwundbarkeit, ablaufendes Hindernis) und ein
dauerhaft amberner Boid damit das Falsche sagen würde. Heller zu gehen war ebenfalls keine
Option: die Dash-Warnung rampt einen Boid bereits Richtung Weiß.

Im HUD ist diese Palette die eigentliche Ankündigung: Die Zeile „Spawning" zeigt die Stufe der
aktuellen Welle **in der Farbe dieser Variante**, plus eine Pfeilsilhouette in derselben Form,
die das Canvas zeichnet. Die Zahl sagt, dass die Eskalation gestiegen ist, die Farbe sagt,
welchen der Pfeile draußen sie produziert hat — der Wert braucht damit keine Legende.

Die Silhouette ist eine `clip-path`-Form und kein Schriftzeichen, aus demselben Grund wie das
Power-up-Sechseck: keine Schrift beteiligt, also kann sie nicht am Laden scheitern.

## 8) HUD-Inhalte

| Element     | Wert                                                              |
| ----------- | ----------------------------------------------------------------- |
| Wave        | Wellennummer, zweistellig                                         |
| Time        | Rundenzeit als `MM:SS`, darunter die Wellen-Fortschrittsschiene   |
| Spawning    | Stufe der aktuellen Welle, in Variantenfarbe, mit Pfeilsilhouette |
| Score       | Ganze Sekunden der Rundenzeit                                     |
| Boids       | `entityCount` des letzten Frames                                  |
| Dash-Balken | Cooldown, mit Label `hud.dash` bzw. `hud.dashReady`               |
| Buff-Zeilen | Aegis und Overdrive, nur während sie laufen                       |

Zweistellige Zahlen (`padTwo`) sind kein Detail: eine Zahl, die von 9 auf 10 springt, würde sonst
ihre eigene Breite ändern und die Nachbarwerte verschieben.

**Positionierung als Aussage:** Wave, Time und Spawning beantworten eine Frage — wie weit bin
ich, und was kommt jetzt — und stehen deshalb zusammen oben in der Mitte statt über zwei
Bildschirmecken verteilt. Die Ecken bleiben für Score und Boid-Zahl frei. Die
Wellen-Fortschrittsschiene liegt unter dem Timer, weil sie dieselbe Uhr messt; sie füllt sich
einmal pro Welle, nicht einmal pro Runde.

Ein Wert hat keine Fläche und keinen Rahmen — Lesbarkeit kommt aus einem Textschatten, was vier
Rechtecke Arena an das Spiel zurückgibt.

Die **ids** benennen, was ein Wert zeigt, die Klassen benennen, wo er sitzt (`hud-wave` gegen
`.hud-stat--wave.bottom-left`). Die End-to-End-Tests lesen die ids, sodass das Verschieben eines
Werts auf dem Bildschirm sie nicht bricht.

Die Leben liegen **nicht** im HUD, sondern als Segmente unter dem Spieler auf dem Canvas, in
Weltkoordinaten. Sie kleben damit am Spieler statt am Bildschirm, behalten bei jeder Fenstergröße
seine Größe und brauchen keine Umkehrtransformation; ihre Begrenzung erfolgt gegen die
Weltkanten, aus demselben Grund.

## 9) Keine harten Zeichenketten

Jeder benutzersichtbare Text geht über `ui/i18n.js` mit namensräumigen Schlüsseln
(`hud.score`, `menu.start`). `t()` gibt bei fehlender Übersetzung den **Schlüssel** zurück, was
eine Lücke sichtbar macht statt sie durch einen leeren String zu verbergen.

Die Locale-Datei liegt in `frontend/public/locales/en.json` und **muss** dort liegen: `i18n.js`
holt sie zur Laufzeit per `fetch`, importiert sie also nicht. Dateien, die Vite nie im
Modulgraphen sieht, werden nur ausgeliefert, wenn sie unter `public/` stehen. Anderswo lässt der
Produktionsbuild sie stillschweigend weg, und jedes Label bleibt als roher Schlüssel stehen —
genau das ist passiert, und genau deshalb läuft die Playwright-Suite gegen den
**Produktionsbuild** und nicht gegen den Dev-Server, der das ganze Projektverzeichnis ausliefert
und den Fehler damit verbirgt.

Die erwarteten Zeichenketten liest die E2E-Suite ihrerseits aus `en.json`, statt sie in einen
Spec zu schreiben. Das hält die Regel intakt und lässt einen fehlenden Schlüssel scheitern.

## 10) Testfälle

### Frontend-Unit (`npm test`, Vitest im `node`-Environment)

Vitest erreicht kein DOM und kein Canvas. Testbar ist deshalb nur importfreie Logik — und das
ist der Grund, warum jede nichttriviale Zeichenarithmetik in einem eigenen Modul liegt statt im
Renderer:

| Modul                 | Was geprüft wird                                                      |
| --------------------- | --------------------------------------------------------------------- |
| `worldTransform.js`   | Contain-Fit, Zentrierung, Nullgrößen-Fenster, zusammengesetzte Matrix |
| `dashPulse.js`        | Eine Engine-Phase → Größe, Helligkeit, Linien-Deckkraft               |
| `spawnMarkerPulse.js` | Der schrumpfende Ring der Ankündigung                                 |
| `obstacleFade.js`     | Ein- und Ausblenden über die vorzeichenbehaftete Phase                |
| `dashAimLayer.js`     | Dekodierung des `dash_aims`-Puffers gegen den Stride                  |
| `spawnMarkerLayer.js` | Dekodierung des `spawn_markers`-Puffers                               |
| `obstacleLayer.js`    | Dekodierung des `obstacles`-Puffers                                   |
| `playerStatusBars.js` | Position des Balkenstapels, Begrenzung an den Weltkanten              |
| `timeArc.js`          | Restlaufzeit als Bogen                                                |
| `mendPulse.js`        | Der weiße Blitz beim Zurückgeben eines Lebens                         |
| `dashTrailHistory.js` | Ringpuffer, Sprungerkennung, Zurücksetzen                             |
| `trailSampling.js`    | Welche Boids in welchem Bild abgetastet werden                        |
| `arenaBackground.js`  | Bake-Fallback ohne `document`, Nullgrößen-Canvas                      |
| `drawCallCounter.js`  | Zählen und Zurücksetzen, verzögertes Anhängen                         |
| `renderState.js`      | Was im eingefrorenen Zweig fehlt (§5)                                 |

Nicht unter Vitest testbar und daher auch nicht getestet: `canvasRenderer.js` selbst,
`frameTimeGraph.js`, `hud.js`, `menu.js` und alles Übrige mit DOM-Zugriff. Das ist der Grund,
warum die Frontend-Coverage-Zahl niedrig ist, und sie ist mit `all: true` konfiguriert, damit
untestete Module gegen den Prozentwert zählen statt unsichtbar zu sein. Die niedrige Zahl ist
also die ehrliche Aussage, dass diese Suite die DOM-Hälfte nicht erreicht — abgedeckt wird sie
von Playwright.

### End-to-End (`npm run test:e2e`, Playwright gegen den Produktionsbuild)

Relevant für S-03: `boot.spec.js` (Modul lädt, Menü erscheint, Labels sind übersetzt),
`round.spec.js` (HUD-Werte laufen), `gameover.spec.js` (Karte mit Statzeile),
`letterbox.spec.js` (die Welt bleibt bei jeder Fenstergröße unverzerrt zentriert),
`settings.spec.js` (Zielbildrate und Overlay).

### Drei bewusste Grenzen

Sie stehen so auch im Qualitätskapitel des Berichts:

1. **Nur Chromium.** Die Grenze ist Zeit, nicht Prinzip.
2. **Ein Worker.** Eine zweite Schwarmsimulation auf derselben CPU macht Zeitaussagen aus
   Gründen wackelig, die nichts mit dem Prüfgegenstand zu tun haben.
3. **Kein Pixelvergleich des Canvas.** Der Schwarm bewegt sich in jedem Bild: eine
   Ungleichheitsprüfung würde immer bestehen, ein Golden Image würde immer brechen. Die
   Zeichenarithmetik wird stattdessen im Unit-Test geprüft — und genau das ist der Grund, warum
   `dashPulse.js` und `frameGraphScale.js` überhaupt eigene Module sind.

Was damit unabgedeckt bleibt, ist die Frage, ob das Bild _gut aussieht_. Dieser Teil ist
manuelle Sichtprüfung und wird nicht als automatisiert behauptet.

## 11) Aufwand

Geschätzt waren **3,0 h**, erfasst sind **11,5 h** über elf Journalzeilen — der größte absolute
Fehlschuss der ursprünglichen Schätzung im fachlichen Block. Der Grund ist benennbar und liegt
nicht in der Schätzmethode: Zum Schätzzeitpunkt lag **kein Design-Handoff vor**. Geschätzt wurde
„Canvas zeichnet Boids, HUD zeigt vier Zahlen". Eingearbeitet wurde anschließend ein
Design-System (`docs/design_system/`) mit Farbrollen, Typografie, Karten- und Overlay-Stilen
sowie zwei Integrationsdokumenten für Dash-Schweif und Power-ups.

Dazu kommen die Posten, die keine Gestaltung sind, aber im Rendering anfielen: das Letterboxing
samt Welttransformation, als die Welt auf eine feste Größe umgestellt wurde; das Backen des
Hintergrunds und die Umstellung auf ein opakes Canvas (§6, gehört fachlich zu T-08); und die
Aufteilung von `canvasRenderer.js`, das an der 400-Zeilen-Grenze stand und deshalb in ein Dutzend
Ebenenmodule zerlegt wurde — was zugleich die Voraussetzung dafür war, dass die Zeichenarithmetik
überhaupt unter Vitest prüfbar ist (§10).

Die Zahlen stammen aus der Plan-/Ist-Tabelle des abgegebenen Berichts (Anhang, Stand Commit
`dc7f344`). Der Ordner `documentation/` ist mit Commit `0161867` aus dem Arbeitsbaum entfernt
worden und nur über die Historie erreichbar.
