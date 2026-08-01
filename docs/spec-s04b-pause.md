# S-04b — Pause (Escape und Fokusverlust)

Blickwinkel: Spiel-Loop, Frontend

Teil-Spec zu **S-04 Spiel-Loop & Wave-Progression**. Beschreibt das Anhalten einer
laufenden Runde: den vierten Freeze-Fall des festen Zeitschritts, die Pausenkarte im
Stil der Game-Over-Karte aus S-03 und den Besitz der Escape-Taste.

## 1) Zweck

**Fachlich:** Eine Runde endet bisher nur auf eine Weise — mit dem dritten Treffer. Wer
zwischendurch weg muss, verliert den Run. Das ist für ein Spiel ohne Speicherpunkte die
härtere von zwei möglichen Antworten, und es ist keine, die etwas über den Schwarm
aussagt.

Der zweite, weniger sichtbare Grund ist ein Fehler im heutigen Verhalten. Wer aus einer
laufenden Runde heraus das Fenster wechselt, hält `requestAnimationFrame` an, aber nicht
die Uhr: Beim Zurückkommen sieht `beginFrame` die gesamte Abwesenheit als
Simulationsschuld, klemmt sie auf `MAX_SIMULATION_STEPS_PER_FRAME` (5) und lässt die Welt
in einem Bild um bis zu ~83 ms springen. Der Schwarm sucht den Spieler, also springt er
dabei auf ihn zu. Eine automatische Pause bei Fokusverlust schließt genau diese Lücke —
das Feature behebt einen Fehler und fügt nicht nur Bequemlichkeit hinzu.

**Technisch:**

- Die Pause ist ein **vierter Spielzustand**, kein Flag. `gameState.js` besitzt bereits
  die Zustände, und `renderCurrentState` verzweigt ohnehin über sie; ein zusätzliches
  `isPaused` neben `STATE` wären zwei Wahrheiten über dasselbe.
- **Kein Engine-Anteil.** Angehalten wird, indem `tick()` nicht mehr aufgerufen wird. Die
  Engine kennt keine Zeit außer dem einen Schritt, den sie pro Aufruf rechnet, und weiß
  deshalb nicht, dass sie pausiert wurde. Das ist der Vorteil des festen Zeitschritts,
  nicht eine Lücke in ihm.
- Die Simulationsuhr `simulationTimeMs` steht damit von selbst. Alles, was an ihr hängt
  — Score, Timer, Wellen, Dash-Cooldown, Buff-Restzeiten — pausiert ohne eine einzige
  Zeile dafür.

## 2) Zustandsmodell

`PAUSED` ist der einzige Zustand, aus dem die Welt nach `PLAYING` zurückkehrt. Erreichbar
ist er ausschließlich aus `PLAYING`, verlassbar in drei Richtungen:

| Übergang           | Auslöser                    | Was passiert                                |
| ------------------ | --------------------------- | ------------------------------------------- |
| `PLAYING → PAUSED` | Escape, Fensterfokusverlust | Welt steht, Karte erscheint                 |
| `PAUSED → PLAYING` | Escape, Resume, Leertaste   | Zeitschuld verworfen, Countdown fortgesetzt |
| `PAUSED → PLAYING` | Restart                     | neue Runde, alte Rundendaten verworfen      |
| `PAUSED → MENU`    | Main Menu                   | Runde verworfen, **nichts gespeichert**     |

`GameState.transition()` prüft nichts, das ist bewusst so und bleibt so. Die zwei Guards
liegen bei den Aufrufern: `pauseGame()` läuft nur aus `PLAYING`, `resumeGame()` nur aus
`PAUSED`. Das ist nicht Kosmetik — `startGame()` ist `async` und `await initEngine(...)`
liegt **vor** dem Zustandswechsel, ein Restart von der Pausenkarte lässt also ein Fenster
offen, in dem ein weiteres Escape das gerade entstehende `gameData` unter der laufenden
Initialisierung verändern würde.

### Festgelegte Werte

| Festlegung       | Wert                   | Warum                                                                        |
| ---------------- | ---------------------- | ---------------------------------------------------------------------------- |
| Taste            | `Escape`               | die Fußzeile des Menüs verspricht sie bereits als „zurück"                   |
| Zweiter Auslöser | `window`-`blur`        | dieselbe Wahl, die `InputManager` für das Vergessen gehaltener Tasten trifft |
| Scrim-Deckkraft  | 0,62 (Game Over: 0,82) | eine Pause, die weniger abdunkelt als eine Niederlage, sagt „gehalten"       |
| Akzentfarbe      | `--warning` (#fbbf24)  | `--danger` ist im Design-System für genau eine Niederlage reserviert         |
| Kantenstärke     | 1 px (Game Over: 2 px) | die 2px-Kante ist laut Design-System das einzige 2px im System               |

## 3) Der vierte Freeze-Fall

`FrameScheduler.discardPendingTime()` kennt drei Fälle, in denen die Welt absichtlich
steht: Countdown, Rundenstart, Tod. Die Pause ist der vierte, und sie ist der einzige,
der beliebig lange dauern kann.

Während der Pause läuft `advanceSimulation` nicht, also läuft `beginFrame` nicht, also
bleibt `_previousTimestamp` auf dem letzten spielenden Bild stehen. Ohne Reset kommt die
gesamte Pausendauer im ersten fortgesetzten Bild als geklemmter Catch-up-Burst an —
derselbe Effekt, den die Pause bei Fokusverlust gerade beheben soll. Deshalb:

```
resumeGame():   ...  scheduler.discardPendingTime()
```

Drei Dinge brauchen dagegen **kein** Reseeding, und das ist jeweils der Grund:

| Wert                         | Warum unberührt                                                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `simulationTimeMs`           | wird nur von `advanceClock` bewegt, das pro Schritt läuft — es gibt keine Schritte                                        |
| `_lastRenderedAt`            | `shouldRenderNow`/`markRendered` liegen außerhalb des `PLAYING`-Gates, die Schleife zeichnet das eingefrorene Bild weiter |
| Alles auf der Simulationsuhr | Treffer-Gnadenfrist, Dash-Cooldown, Buff-Restzeiten messen gegen eine Uhr, die steht                                      |

Dass `_lastRenderedAt` weiterläuft, ist nicht Zufall, sondern trägt: `renderDeltaSeconds`
speist den Startring des Ion-Streak-Schweifs, und ein Delta in Höhe der Pausendauer wäre
dort ein Sprung.

Ein Restart von der Pausenkarte braucht keinen eigenen Verwurf: Das erste Bild der neuen
Runde hat `roundActive === false` und läuft damit in den Countdown-Zweig, der ohnehin
verwirft.

## 4) Countdown-Restzeit

`countdownEndsAt` ist der **einzige** Wandzeit-Wert in `round/roundData.js` — alles andere
im Modul hängt an der Simulationsuhr. Er ist damit auch der einzige, den eine Pause
invalidieren kann. Pausiert man bei „3" und setzt zehn Sekunden später fort, ist die
Frist längst verstrichen und die Runde startet ohne Countdown.

Gelöst wird das mit der Restzeit **in** den Rundendaten, nicht mit einem Zeitstempel im
Aufrufer:

```
pauseCountdown(roundData, t):    countdownRemainingMs := max(0, countdownEndsAt - t)
resumeCountdown(roundData, t):   countdownEndsAt      := t + countdownRemainingMs
```

Beide sind No-ops auf einer aktiven Runde. Der Guard liegt in den Funktionen, damit der
Aufrufer keinen Zweig braucht und eine Pause in der 40. Sekunde einen längst
abgelaufenen Countdown nicht zurückdrehen kann. Die Klemmung auf 0 fällt dabei gratis ab.

**Verworfen:** (a) Pausieren während des Countdowns verbieten. Es sieht risikofrei aus,
macht aber eine dokumentierte Taste drei Sekunden lang wirkungslos, und ein Test müsste
die Abwesenheit von Verhalten belegen — die schwächste Form von Zusicherung.
(b) Den Countdown auf die Simulationsuhr umstellen. Architektonisch der bessere
Endzustand: er würde die letzte Wandzeit-Abhängigkeit des Moduls beseitigen und die Pause
kostenlos machen. Er verlangt aber, dass der Countdown-Zweig anstehende Zeit als
Countdown-Schritte **verbraucht** statt sie zu verwerfen — also einen Umbau genau des
Pfads, der den tragenden Catch-up-Kommentar trägt, mitten in einem „Pausenmenü
hinzufügen".

## 5) Auslöser und Tastenbesitz

Escape ist bereits vergeben: `ui/menuNavigation.js` hört auf Fensterebene und verlässt ein
Untermenü, solange das Overlay sichtbar ist. Der naheliegende Entwurf — Escape zum
Pausieren in einem neuen Listener, Escape zum Fortsetzen über den bestehenden — ist
kaputt, und zwar unabhängig von der Bindungsreihenfolge:

- Der Pause-Listener zuerst: Escape pausiert, setzt das Overlay auf sichtbar, und der
  Menü-Listener sieht **im selben Event** ein sichtbares Overlay und geht zurück. Karte
  öffnet und schließt sich in einem Tastendruck.
- Der Menü-Listener zuerst: Escape setzt fort, versteckt das Overlay und stellt `PLAYING`
  her, und der Pause-Listener sieht im selben Event `PLAYING` und pausiert erneut.

Beides wirkt wie eine tote Taste. Die Ursache ist, dass der Sichtbarkeitstest des
Menü-Listeners **synchron** von dem anderen Handler verändert wird.

**Festlegung:** Ein einziger Listener (`input/pauseControl.js`) besitzt beide Richtungen
und liest dazu den Spielzustand. `Menu._goBack()` bleibt unverändert — beim Rundenstart
ist die Menüansicht immer die Wurzel, `_goBack()` ist während der Pause also ein No-op.
Damit ist das Verhalten reihenfolgeunabhängig.

Zwei Folgeregeln:

- `event.repeat` muss geprüft werden. Der Menü-Listener kommt ohne Guard aus, weil
  „zurück" idempotent ist; ein Toggle ist es nicht, und gehaltenes Escape würde mit
  OS-Repeat-Rate pausieren und fortsetzen. Vorbild ist der Dash, der denselben Guard aus
  demselben Grund hat.
- Der Listener liegt **nicht** in `InputManager`. Dessen Vertrag lautet „außerhalb einer
  Runde gehört uns keine Taste", die Pause muss aber in beide Richtungen gehört werden —
  auch während `_gameplayActive === false`. Ein Pause-Latch würde zudem von
  `setGameplayActive(false)`, also vom Pausieren selbst, gelöscht.

Fokusverlust pausiert, Fokusrückkehr setzt **nicht** fort. Wer zurückkommt, soll den
Schwarm sehen, bevor er sich wieder bewegt.

## 6) Anzeige

Die Karte trägt Kicker, Titel, den aktuellen Score, die Statzeile aus S-03
(`renderRunStats`: Wave / Time / Boids) und drei Aktionen — Resume (Primärfläche mit
Keycap `Space`), Restart, Main Menu. Kein „Best"-Wert: die Pause fasst die Rekorde in
keiner Richtung an.

Dass die Zahlen auf der Karte stehen und nicht nur im HUD, ist keine Doppelung: Das
Overlay liegt im DOM hinter HUD und Frametime-Graph, sein Scrim deckt beide, und bei 62 %
Deckkraft ist „abgedunkelt" nahe an „unlesbar". Wer entscheidet, ob er einen Run
aufgibt, muss sehen, was er aufgibt.

HUD und Frametime-Graph bleiben eingeschaltet — die Runde ist eingefroren, nicht beendet.
Der Frametime-Graph nimmt während der Pause allerdings **keine** Proben: sein Ringpuffer
umfasst 120 Bilder, also bei 60 fps zwei Sekunden, und eine längere Pause würde ihn
vollständig mit den Kosten für das Zeichnen eines Standbilds überschreiben — inklusive
der Maxima, die der Graph eigentlich berichten soll. Genau das ist der Fall, in dem ein
Entwickler pausiert, _um_ den Graphen zu lesen.

Der Countdown-Glyph verschwindet hinter der Karte, weil der eingefrorene Renderzustand
kein `countdownSeconds` führt. Das ist gewollt: Ein _tickender_ Countdown hinter einer
Pausenkarte wäre eine Lüge, und ein stehender wäre Rauschen unter einer Karte, die ihren
eigenen Titel mitbringt.

## 7) Edge Cases

| Fall                                        | Verhalten                                                                              |
| ------------------------------------------- | -------------------------------------------------------------------------------------- |
| Pause während des Countdowns                | Restzeit wird gespeichert und beim Fortsetzen neu befristet (§4)                       |
| Pause länger als der ganze Countdown        | Rest ist auf 0 geklemmt, Runde startet direkt nach dem Fortsetzen                      |
| Escape gehalten                             | `event.repeat` verworfen, ein Tastendruck ist ein Umschalten                           |
| Escape im Menü oder auf der Game-Over-Karte | ignoriert, der Zustand ist weder `PLAYING` noch `PAUSED`                               |
| Fokusverlust während der Pause              | ignoriert, derselbe Guard                                                              |
| Fokusverlust im Menü                        | ignoriert, es gibt keine Runde                                                         |
| Bewegungstaste über die Pause gehalten      | wird gelöscht und erst durch die nächste Auto-Repeat-Wiederholung neu registriert (§8) |
| Leertaste auf der Pausenkarte               | betätigt den fokussierten Resume-Button; kein Dash, weil `_gameplayActive` false ist   |
| Tab im Hintergrund **während** der Pause    | ungefährlich: keine Schuld entsteht, das erste zurückkehrende Bild zeichnet nur        |
| Main Menu aus der Pause                     | schreibt nichts in die Rekorde (§8)                                                    |
| Restart aus der Pause                       | frische Rundendaten, also auch frische Countdown-Restzeit                              |

## 8) Abgrenzung

- **Ein abgebrochener Run wird nicht gespeichert.** `recordRound` dokumentiert sich selbst
  als „records a **finished** round", und „Last Run" auf dem Command Deck meint die letzte
  gespielte Runde. Aufgeben kann nie mehr Punkte bringen als Weiterspielen, ein
  gespeicherter Abbruch könnte „Last Run" also nur mit einer Zahl überschreiben, von der
  der Spieler bewusst weggegangen ist. Der Einwand „wer mitten im Rekord aufgibt, verliert
  ihn" ist die richtige Folge des Aufgebens, kein Fehler; abgefedert wird er dadurch, dass
  die Karte den Score zeigt, statt ihn zu speichern. `PAUSED → MENU` ist damit der einzige
  Weg aus einer Runde, der nichts schreibt.
- **Keine Einstellungen auf der Karte.** Die Karte spiegelt die Game-Over-Karte und bleibt
  eine Karte, kein zweites Command Deck. Zielbildrate und Frametime-Graph gehören ins
  Hauptmenü, wo sie schon liegen; sie mitten in einer Runde umschaltbar zu machen, würde
  den Frametime-Graph über eine Runde hinweg zwei verschiedene Dinge messen lassen.
- **Kein Fortsetzen bei Fokusrückkehr**, siehe §5.
- **Gehaltene Bewegungstasten überleben die Pause nicht** vollständig. `setGameplayActive(false)`
  löscht die gedrückten Tasten, damit keine über den Zustandswechsel hinweg als gehalten
  gilt; eine tatsächlich noch gedrückte Taste registriert sich beim nächsten
  Auto-Repeat-Ereignis von selbst wieder, also nach ~1–3 Bildern Stillstand. Dieselbe
  Situation besteht heute nach einem Restart. Playwright kann diesen Fall nicht prüfen,
  weil `keyboard.down` kein Auto-Repeat schickt — die Grenze steht in
  `documentation/report/08-qualitaet.md` §8.2.
