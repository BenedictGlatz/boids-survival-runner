# 5 Frontend/Systemnah-Integration — WASM

`Seitenbudget: ~2 S. | Status: Gerüst | Quellen: CLAUDE.md §Invariante 2, engine/src/wasm_bridge/**, frontend/src/engine-bridge.js, docs/spec-s05-dash.md §4`

## 5.1 Wesentliche Komponenten

> TODO: Nur vier Bausteine, und das ist die Aussage:
> `wasm_bridge/mod.rs` (`GameEngine` — einzige `#[wasm_bindgen]`-Fläche) ·
> `wasm_bridge/response.rs` (`FrameResponse`) ·
> `frontend/src/engine-bridge.js` (die einzige Stelle im Frontend, die das
> WASM-Modul anfasst) · das von `wasm-pack` erzeugte Glue-Modul unter
> `frontend/src/wasm/engine/` (gitignoriert, Build-Artefakt).

## 5.2 Komponenten — Details & Interaktion

### 5.2.1 Der Puffer-Vertrag

> TODO: `FrameResponse` liefert **vier** flache, index-alignierte Puffer:
> `Float32Array` Positionen, `Float32Array` Geschwindigkeiten, `Float32Array`
> Dash-Phasen, `Uint32Array` Schwierigkeits-Tiers. Keine Objekte, keine
> Per-Entity-Structs über die Grenze — flach, cache-freundlich, stark typisiert.
>
> Das Sign-Packing als Musterlösung ausführen: `dash_phases` kodiert einen
> Render-Zustand in **einer** Zahl — `0` heißt „nichts zu zeichnen", ein positiver
> Wert ist Aufladefortschritt, ein negativer die Dash-Restdauer. Das Vorzeichen
> trägt den Zustand, ein zweiter Puffer entfällt. Wertetabelle aus
> docs/spec-s05-dash.md §4 übernehmen, inklusive der dort **verworfenen**
> Zwei-Puffer-Alternative.

### 5.2.2 Bausteinsicht und Frame-Ablauf

> TODO: Zwei Mermaid-Diagramme.
>
> (a) `flowchart LR`: `GameEngine` (Flock, Weltgrenzen, Wave-Zustand,
> wiederverwendbare Puffer) → `FrameResponse` (4 Puffer) → `engine-bridge.js`
> (snake_case → camelCase) → Frame-Objekt → Renderer.
>
> (b) `sequenceDiagram` **eines Frames** — trägt die Fixed-Timestep-Invariante besser
> als eine Seite Prosa: `requestAnimationFrame` → `frameScheduler` bestimmt die
> Schrittzahl → **N ×** (`controls` lesen → Spieler integrieren → `tick()` →
> Treffer konsumieren) → **1 ×** rendern.
> Die Asymmetrie ist der Punkt: Simulation läuft konstant mit 60 Steps/s
> (`SIMULATION_STEP_MS`), gedrosselt wird **nur das Rendering** auf die gewählte
> Ziel-Framerate.

## 5.3 Integration / Schnittstellen

> TODO: Die Grenze als Entwurfsregel, nicht als Implementierungsdetail:
> - **Namensübersetzung an genau einer Stelle.** `engine-bridge.js` wandelt die
>   `snake_case`-Getter aus Rust in ein `camelCase`-Frame-Objekt, damit
>   Engine-Namenskonventionen nicht weiter ins Frontend durchschlagen.
> - **`GameEngine::tick()` rückt genau einen Schritt vor** und skaliert *nicht* mit
>   der Delta-Zeit. Die daraus folgenden Verpflichtungen für den Aufrufer aus
>   CLAUDE.md §Invariante 1 hier auflisten — sie sind der eigentliche Vertrag:
>   Spieler im selben Step integrieren, Treffer für *jeden* Step konsumieren,
>   Einmal-Eingaben latchen und *einmal* konsumieren (eine „Taste gedrückt"-Prüfung
>   pro Step macht aus einem Tastendruck bis zu fünf Dashes), Simulationsschulden
>   klemmen und bei eingefrorener Welt verwerfen.
> - **Build-Kopplung:** `npm run build:wasm` ist der maßgebliche Engine-Build und
>   emittiert `--target web` nach `frontend/src/wasm/engine/`. Die
>   `--target bundler`-Variante aus der README ist veraltet; nach `engine/pkg/`
>   wird nicht gebaut. Details in Kap. 7.
> - Testbarkeitsfolge: Module, die `engine-bridge.js` importieren, laufen nicht unter
>   Vitest im `node`-Environment (siehe Kap. 8).
