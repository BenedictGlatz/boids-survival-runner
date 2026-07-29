# 11 Anhang

`Seitenbudget: — | Status: Gerüst (akkretiv) | Quellen: die jeweiligen Kapitel`

Der Anhang ist die **Auffangstelle für Gekürztes**. Was beim Einhalten des
Seitenbudgets aus einem Kapitel fällt, wandert hierher statt gelöscht zu werden — der
Katalog verlangt ausdrücklich „Wesentliche Arbeitsergebnisse im Anhang".

Nummerierung und Beschriftung entstehen erst beim Word-Zusammenbau
(`Tabelle 1: …`, `Abbildung 1: …`, `Quellcode-Ausschnitt 1: …`) und werden im
Fließtext referenziert.

## 11.1 Tabellen

> TODO: Sammelstelle. Vorgesehen:
>
> - Verzeichnisstruktur und Schichtenzuordnung (Engine / Frontend / Bridge)
> - Tech Stack Canvas (Langfassung, falls Kap. 2 gekürzt werden muss)
> - Modulübersicht Engine mit Aufgabe je Datei
> - Modulübersicht Frontend mit Aufgabe je Datei
> - Dash-Tuning je Schwierigkeits-Tier (aus docs/spec-s05-dash.md §3)
> - Wertetabelle der `dash_phases`-Kodierung (aus docs/spec-s05-dash.md §4)
> - Testübersicht je Verzeichnis
> - Coverage je Modul, getrennt nach Sprache (Zahlen aus Kap. 9.2b) — sortiert nach
>   Wert, damit die zweigipfelige Verteilung aus Kap. 8.1 sichtbar wird
> - E2E-Flow-Tabelle in Langfassung, falls Kap. 8.2 gekürzt werden muss
> - Vollständige npm-Script-Tabelle, falls Kap. 7.1 gekürzt werden muss

## 11.2 Abbildungen

> TODO: Die gerenderten SVGs aus `rendered/`. Vorgesehen:
>
> - Bausteinsicht Dash-Cluster (Kap. 4.2.1)
> - Bausteinsicht WASM-Grenze (Kap. 5.2.2 a)
> - Sequenzdiagramm eines Frames (Kap. 5.2.2 b)
> - Bausteinsicht Input-Kette (Kap. 3.2.2)
> - Optional: Dash-Zustandsmaschine als eigenes Diagramm, falls sie in 4.2.1 zu
>   dicht wird
>
> Erzeugen mit `npm run docs:diagrams`. **Als SVG in Word einfügen, nicht als PNG.**
>
> Dazu zwei Screenshots der erzeugten Test-Reports, weil der Katalog für Coverage und
> E2E je „report erzeugen" verlangt und die HTML-Ausgaben selbst gitignoriert sind:
> `frontend/coverage/index.html` (`npm run test:coverage`) und
> `frontend/playwright-report/` (`npm run test:e2e:report`).

## 11.3 Quellcode-Ausschnitte

> TODO: Kurze, aussagekräftige Ausschnitte — je 10–25 Zeilen, keine ganzen Dateien.
> Jeder Ausschnitt braucht eine Beschriftung und wird im Fließtext referenziert.
> Kandidaten, nach Aussagekraft geordnet:
>
> 1. `dash_selection.rs` — die deterministische Auswahl per Integer-Hash über
>    `step_counter`; der stärkste Beleg für das Fokus-Thema.
> 2. `wasm_bridge/response.rs` — der Vier-Puffer-Vertrag.
> 3. `Flock::update()` — Snapshot-Klon und Schrittreihenfolge.
> 4. `dash_render_phase` — das Sign-Packing in einer Funktion.
> 5. `loop/frameScheduler.js` — die Fixed-Timestep-Arithmetik mit Schuldenklemmung.
> 6. `input/inputManager.js` — der flankengetriggerte Latch.
> 7. `engine-bridge.js` — die snake_case→camelCase-Übersetzung.
