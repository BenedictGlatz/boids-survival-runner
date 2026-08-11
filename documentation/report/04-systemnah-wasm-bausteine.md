# 4 Systemnah / WASM: Struktur / Bausteine

`Seitenbudget: ~5 S. | Status: Gerüst | Quellen: CLAUDE.md §Architecture→Engine, docs/spec-s05-dash.md (vollständig), engine/src/**`

**Dieses Kapitel trägt das Fokus-Thema und wird zuerst geschrieben.** Es ist das
größte Kapitel und hat die beste Materiallage — `docs/spec-s05-dash.md` liefert
365 Zeilen berichtsreifes Deutsch inklusive quantitativer Herleitungen und
verworfener Alternativen.

## 4.1 Wesentliche Komponenten

> TODO: Tabelle `Modul | Aufgabe` aus CLAUDE.md §Architecture→Engine.
> Der Kern als Einzeldateien: `math/vector.rs` · `math/segment.rs` ·
> `simulation/boid.rs` · `simulation/physics.rs` · `simulation/overlap.rs` ·
> `simulation/flock.rs`. Die vier Systeme als Ordner mit Fassaden-`mod.rs`:
> `simulation/steering/` · `simulation/dash/` · `simulation/obstacle/` ·
> `simulation/wave/`. Dazu `constants.rs` und `wasm_bridge/`.
> Kernaussage vorweg: Die Engine besitzt die **gesamte** Simulation und kennt weder
> DOM noch Canvas noch Browser-APIs.

## 4.2 Komponenten — Details & Interaktion

> TODO: Die vier Steuerungsregeln als reine Funktionen (`separation`, `alignment`,
> `cohesion`, `seek_target`) — jede nimmt `&Boid` plus Nachbar-Slice und gibt eine
> ungewichtete Kraft zurück.
> Die nicht offensichtliche Kopplung ausführen: Alle vier skalieren ihre
> Wunschgeschwindigkeit mit `properties.max_speed`. Ein Erhöhen dieser Eigenschaft
> verändert also **auch die Steuerungsstärke**, nicht nur die Höchstgeschwindigkeit —
> deshalb übergibt `integrate(boid, speed_limit)` die Grenze als Parameter, statt sie
> vom Boid zu lesen. Genau das erlaubt einem dashenden Boid, seine normale
> `max_speed` für einige Steps zu überschreiten, ohne dass seine Steuerung
> umskaliert wird. Quelle: CLAUDE.md §Architecture→Engine, docs/spec-s05-dash.md §3.

### 4.2.1 Eine wesentliche Komponente: Darstellung des Aufbaus — Bausteinsicht

> TODO: **Der Dash-Cluster** — `dash/state.rs` + `dash/properties.rs` +
> `dash/selection.rs` + der Integrationspunkt in `Flock::update()`.
>
> Mermaid `flowchart LR` mit Subgraphen: `Flock::update()` → `dash_selection`
> (Kandidatenwahl) → `dash` (Zustandsmaschine) → `dash_properties` (Tuning je Tier)
> → `dash_render_phase` (die eine Zahl, aus der das Frontend zeichnet).
>
> Inhaltlich abzudecken:
>
> - Die Zustandsmaschine `Idle → Charging → Dashing → Cooling`; Dauern zählen in
>   **Simulationsschritten**, nie in Millisekunden.
> - Der Determinismus-Kern: `dash/selection.rs` leitet die Auswahl deterministisch
>   aus `Flock::step_counter` ab, mit demselben Integer-Hash-Trick wie
>   `find_spawn_position`. Es gibt **keine** `rand`-Abhängigkeit in der Engine, und
>   eine hinzuzufügen würde die Reproduzierbarkeit brechen. Das ist die stärkste
>   Aussage des Kapitels — mit der verworfenen Alternative aus
>   docs/spec-s05-dash.md §3 belegen.
> - Der Tier-Ramp: Tuning-Werte, die pro Boid abweichen können, gehören auf den Boid
>   bzw. in `BoidProperties`, nie in eine neue globale Konstante.

### 4.2.2 Komponenten-Interaktion

> TODO: Die Schrittreihenfolge in `Flock::update()` — sie _ist_ die Interaktion:
> höchstens einen neuen Dash anbieten → Boid-Vektor in einen **Snapshot** klonen,
> damit jeder Boid gegen den Zustand des _vorherigen_ Steps steuert → Dash-Zustände
> fortschreiben → gewichtete Regeln anwenden (ein dashender Boid erhält **nur**
> Separation; Kohäsion, Alignment und Seeking sind aus — genau das lässt ihn aus dem
> Schwarm ausbrechen) → integrieren → an den Weltgrenzen wrappen → Overlaps
> relaxieren → Spielertreffer zählen. O(n²) in der Boid-Zahl.
> Erwähnen: Ein dashender Boid ist innerhalb der Relaxation unbeweglich, damit er
> seine Linie hält; `wrap_position` nutzt `rem_euclid`, sodass eine Verschiebung
> größer als die Welt keinen Boid aus der Welt entkommen lässt. Welt und Bildschirm sind
> dabei nicht dasselbe: die Welt hat eine feste logische Größe, die das Frontend ins
> Fenster einpasst.

## 4.3 Modularisierung: Strukturierung der fachlichen Logik

> TODO: Die Aufteilungsregeln: reine Funktionen für die Schwarmregeln; Mathematik
> (`math/`) getrennt von Simulation (`simulation/`) getrennt von der Bindungsschicht
> (`wasm_bridge/`); `constants.rs` hält **Standardwerte, keine Invarianten**, weil
> mehrere Boid-Varianten in einem Schwarm koexistieren.
> Die 400-Zeilen-Obergrenze als erzwingende Regel — sichtbar daran, dass der Dash in
> drei Module zerfällt statt in eines.

## 4.4 State Management

> TODO: `Flock` besitzt den Zustand: Boid-Vektor, `step_counter`, Wave-Zustand,
> Weltgrenzen. `GameEngine` besitzt den `Flock` plus wiederverwendbare
> Ausgabepuffer.
> Der Snapshot-Mechanismus gehört hierher, weil er eine Zustandsentscheidung ist:
> ohne ihn würden Boids gegen teilweise aktualisierte Nachbarn steuern, und das
> Ergebnis hinge von der Iterationsreihenfolge ab.

## 4.5 Routing

> TODO: „Routing" heißt hier **Dispatch**, nicht URL-Navigation. Drei Ebenen:
> (a) `#[wasm_bindgen]` als einzige Eintrittsfläche in das Modul — jeder Export
> braucht einen Doc-Kommentar;
> (b) die feste Schrittreihenfolge in `Flock::update()` (siehe 4.2.2);
> (c) die Dash-Zustandsmaschine als Verzweigung pro Boid und Step.
> Ein Satz Querverweis auf Kap. 3.5, wo begründet wird, dass die Anwendung insgesamt
> kein Routing im Web-Sinn hat.

## 4.6 Persistenz

> TODO: „Persistenz" heißt hier **Fortbestehen im linearen WASM-Speicher über Ticks
> hinweg** — ein für das Fokus-Thema genuin interessanter Abschnitt:
>
> - Der `Flock` und die Ausgabepuffer leben über Tick-Grenzen; pro Frame wird
>   **nichts** neu serialisiert oder alloziert. Hot-Path-Code minimiert Allokationen
>   je Frame (copilot-instructions.md).
> - `step_counter` ist die persistierte Uhr, aus der `dash/selection.rs` seinen
>   Determinismus zieht. Derselbe Startzustand plus dieselbe Eingabefolge ergibt
>   denselben Ablauf — reproduzierbar ohne Zufallsquelle.
> - Abgrenzung: Es gibt keine Persistenz über den Seitenneuladen hinaus; die liegt im
>   Frontend (Kap. 3.6).

## 4.7 Konfiguration — Wesentliche Einstellungen

> TODO: `constants.rs` als Standardwerte, `BoidProperties` als der Ort für alles,
> was pro Boid abweichen darf. `properties_for_difficulty_tier` und
> `create_boid_for_wave` leiten die Varianten pro Wave ab.
> `find_spawn_position` hält neue Boids auf sicherem Abstand zum Spieler.
> Auf die Doppelführung von `INITIAL_BOID_COUNT` hinweisen (Gegenstück in Kap. 3.7).

## 4.8 Implementierung der Fachlogik

> TODO: Der eigentliche Rechenkern, in der Reihenfolge, in der er ausgeführt wird —
> aber ohne 4.2.2 zu wiederholen. Schwerpunkt hier auf der Mathematik:
> `Vec2`-Operationen (`add`, `sub`, `scale`, `limit`, `normalize`), `clamp_force`,
> `aabb_overlap`, `resolve_boid_overlaps`, `wrap_position`.
> Ein quantitatives Beispiel voll ausführen — die 180-px-Dash-Distanz-Herleitung aus
> docs/spec-s05-dash.md §2 ist dafür fertig vorhanden und zeigt, dass Verhalten
> vorab spezifiziert und nicht ertunt wurde.
> Testabdeckung nur als Verweis auf Kap. 8 und 9, keine Zahlen hier.
