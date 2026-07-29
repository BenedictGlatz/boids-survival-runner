# 3 Frontend: Struktur / Bausteine

`Seitenbudget: ~5 S. | Status: Gerüst | Quellen: CLAUDE.md §Architecture→Frontend, frontend/src/**, docs/spec-s05-dash.md §2 und §5`

**Achtung Reihenfolge:** Die Dateiliste in 3.1 erst **nach T-01/T-02** einfrieren.
JSDoc-Pflicht bläht Dateien auf und kann die 400-Zeilen-Regel in neue Splits kippen.

## 3.1 Wesentliche Komponenten

> TODO: Tabelle `Modul | Aufgabe | Schicht` aus CLAUDE.md §Architecture→Frontend.
> Gruppierung, die sich aus dem Verzeichnisbaum ergibt: Bootstrap (`index.js`),
> Bridge (`engine-bridge.js`), Loop (`loop/`), Input (`input/`), Player (`player/`),
> Renderer (`renderer/`), UI (`ui/`), Zustand (`gameState.js`), Konfiguration
> (`gameConfig.js`).
> Keine Zeilenzahlen hier — die stehen in Kap. 9.

## 3.2 Komponenten — Details & Interaktion

### 3.2.1 (UI-)Komponenten — Aufbau

> TODO: `ui/menu.js` + `ui/optionGroup.js` (Startmenü aus einem gemeinsamen
> Options-Gruppen-Modul), `ui/frameTimeGraph.js` (opt-in Overlay),
> `ui/i18n.js` + `frontend/public/locales/en.json`. Betonen: keine hartcodierten
> nutzersichtbaren Strings, alles über namespaced Keys.

### 3.2.2 Eine wesentliche Komponente: Darstellung des Aufbaus — Bausteinsicht

> TODO: **`input/inputManager.js` + `input/controls.js`.** Gewählt, weil hier eine
> nicht offensichtliche Entscheidung mit dokumentiertem Trade-off steckt: Die
> Dash-Taste ist flankengetriggert und gelatcht, und wird nur während einer laufenden
> Runde abgefangen — außerhalb muss die Leertaste weiterhin Menü-Buttons und das
> Entwickler-`<details>` bedienen (Barrierefreiheit). Quelle: CLAUDE.md
> §Architecture→Frontend und docs/spec-s05-dash.md §2 „Barrierefreiheit — die eine
> echte Regression".
>
> Mermaid `flowchart LR` mit Subgraphen einfügen: Keyboard-Events →
> `inputManager` (Tastenzustand, Latch, `setGameplayActive`) → `controls`
> (Kontrollobjekt pro Step) → `playerController`.

### 3.2.3 Komponenten-Interaktion

> TODO: Wer ruft wen. `index.js` verdrahtet alles; die Interaktion pro Frame steht
> als Sequenzdiagramm in Kap. 5 — hier nur darauf verweisen, nicht wiederholen.
> Erwähnen: `renderer/renderer.js` → `renderer/canvasRenderer.js` ist eine
> Indirektion, damit ein WebGL-Backend das Canvas-Backend ersetzen könnte, ohne
> Aufrufer anzufassen.

## 3.3 Modularisierung: Strukturierung der fachlichen Logik

> TODO: Zwei Regeln, die die Aufteilung erklären:
> (a) Das Frontend enthält **keine** Simulationsmathematik — die liegt vollständig in
> der Engine;
> (b) importfreie Arithmetik wird bewusst herausgelöst, damit sie unter Vitest im
> `node`-Environment testbar ist, ohne Browser und ohne gebautes WASM-Paket.
> Beispiele: `loop/frameScheduler.js`, `loop/frameMetrics.js`,
> `ui/frameGraphScale.js`, `player/dashCooldown.js`, `renderer/dashPulse.js`.
> Dazu die 400-Zeilen-Obergrenze als erzwingende Regel (CLAUDE.md §Hard rules).

## 3.4 State Management

> TODO: `gameState.js` als Zustandsmaschine `MENU` / `PLAYING` / `GAME_OVER`, die
> ausschließlich Übergänge kennt. Kein Framework, kein Store, kein Observable —
> begründen: eine einzige Canvas-Ansicht, ein Frame-Loop, der den Zustand pro Frame
> ohnehin liest.
> Wichtig und nicht offensichtlich: Score, In-Game-Timer und alle
> Fähigkeiten-Cooldowns leiten sich aus `simulationTimeMs` ab, nie aus der Wanduhr —
> und jeder daran gemessene Zeitstempel muss in `beginRound()` neu gesetzt werden,
> weil diese Uhr dort auf null zurückspringt (CLAUDE.md §Invariante 1).

## 3.5 Routing und Navigation

> TODO: **Hier steht die eine echte Absenz des Berichts.** Es gibt kein Routing:
> eine einzige HTML-Seite, ein Canvas, keine URL-Fläche, kein History-Handling.
> `gameState.js` übernimmt die Rolle, die in einer Mehrseiten-Anwendung ein Router
> hätte. Begründen über die Rahmenbedingung „installationsfrei und serverlos" —
> ein Deep-Link auf einen Spielzustand hätte keine Bedeutung. Kap. 4 verweist auf
> diesen Abschnitt zurück.

## 3.6 Persistenz

> TODO: **Erst nach Umsetzung des localStorage-Highscores schreiben** (offen in S-06).
> Danach: Was persistiert wird (Highscore, ggf. gewählte Settings), warum
> `localStorage` und nicht IndexedDB (ein Zahlenwert, synchroner Zugriff genügt,
> keine Migration nötig), und was bewusst **nicht** persistiert wird (Spielzustand
> einer laufenden Runde — eine Runde ist kurz, ein Wiederaufsetzen wäre
> spielmechanisch sinnlos).

## 3.7 Konfiguration

> TODO: `gameConfig.js` als einzige Stelle für Frontend-Konstanten; „keine
> Magic Numbers in Logik-Modulen" ist eine harte Regel. Die
> Entwickler-Einstellungen hinter `<details>` erwähnen (fixierbare Graph-Achse,
> Ziel-Framerate).
> **Nicht vergessen:** `INITIAL_BOID_COUNT` ist in `engine/src/constants.rs` und
> `frontend/src/gameConfig.js` doppelt geführt und muss synchron gehalten werden —
> eine bewusst in Kauf genommene Redundanz, die begründet gehört.

## 3.8 Implementierung der Fachlogik

> TODO: Was im Frontend überhaupt „Fachlogik" ist, wenn die Simulation in der Engine
> liegt: Spielerintegration (`player/playerController.js` — beschleunigen,
> verzögern, klemmen, Dash-Impuls, der die Geschwindigkeitsgrenze temporär anhebt),
> Wave-Fortschritt, Score, Cooldown-Arithmetik, Frame-Metriken.
> Die Fixed-Timestep-Konsequenzen aus CLAUDE.md hier ausführen: Der Spieler muss im
> selben Step wie der Schwarm integriert werden, Treffer müssen für **jeden** Step
> eines Mehrschritt-Frames konsumiert werden, und Simulationsschulden werden
> geklemmt und bei eingefrorener Welt verworfen.
