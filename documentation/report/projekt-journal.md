# Projekt-Journal

Erfassungsstelle für alles, was **später nicht mehr rekonstruierbar** ist. Kein
Kapitel des Berichts, sondern dessen Rohmaterial — speist vor allem
[Kapitel 10 Projektbericht](10-projektbericht.md).

**Pflicht pro Änderung** (`CLAUDE.md` → _Mandatory per-change steps_, Schritt 5):

- **immer** eine Zeile in _Aufwand_;
- **wenn zutreffend** ein Block in _Entscheidungen_ — jede nicht offensichtliche
  technische Entscheidung, inklusive verworfener Alternativen;
- **wenn zutreffend** ein Punkt in _Herausforderungen_ — alles, was mehr als ~30 min
  ungeplante Arbeit gekostet hat.

**Nie hier festhalten**, was ein Befehl regenerieren kann: LOC, Testzahlen,
Script-Listen, Abhängigkeitsversionen, Chronologie. Das steht in
[Kapitel 09](09-quellcode-uebersicht.md) bzw. lässt sich aus `git log` und
`CHANGELOG.md` ableiten.

Sprache: **Deutsch**, weil es direkt in den Bericht wandert. Code, README und
CHANGELOG bleiben englisch.

Jeder Entscheidungs-Block trägt einen `→ Kap. n`-Tag. Damit ist die Schreibphase ein
`grep`, kein erneutes Durchlesen.

---

## Aufwand

Eine Zeile pro **Arbeitssitzung**, nicht pro Task. Bis zur Abgabe sind ~20–25 Zeilen
zu erwarten. Maßnahmen-IDs (`S-01`…`S-07`, `T-01`…`T-07`, `D-01`) kommen aus
[docs/specs-overview.md](../../docs/specs-overview.md) und sind das gemeinsame
Vokabular von Planung, Journal und Kapitel 10.

Warum explizit und nicht aus `git log` rekonstruiert: die bisherigen 27 Commits
fallen auf vier Kalendertage, Commit-Zeitstempel komprimieren also Arbeitsschübe und
sagen nichts über Lese-, Denk- und Debugging-Zeit. Mit einem Agenten, der tippt, ist
die Zeit zwischen Commits ein aktiv irreführender Aufwandsindikator. Verworfene
Ansätze hinterlassen überhaupt keinen Commit — und das sind genau die Stunden, nach
denen der Kapazitätsplan fragt. `git log` dient als Gegenprobe, nicht als Quelle.

| Datum      |   h | Spec/Maßnahme | Was                                                                                                                                                                                                                                                                                                                                          |
| ---------- | --: | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-07-29 | 2,0 | D-01          | Anforderungskatalog und Musterdokumentation ausgewertet, Kapitelstruktur und begleitendes Doku-Ritual entworfen, Berichtsgerüst angelegt                                                                                                                                                                                                     |
| 2026-07-29 | 3,5 | T-01          | ESLint-Flat-Config mit JSDoc-Enforcement und Prettier eingerichtet, JSDoc in acht Dateien nachgerüstet (Schwerpunkt `playerController.js`, `engine-bridge.js`), Kap. 7.1/7.3/7.4/7.5 und 8.4 geschrieben                                                                                                                                     |
| 2026-07-29 | 1,5 | T-03          | Coverage für beide Sprachen eingerichtet (`@vitest/coverage-v8`, `cargo llvm-cov`), Ausgangsmessung genommen; T-07 als neue Maßnahme aufgenommen und Kapazitätsplan fortgeschrieben                                                                                                                                                          |
| 2026-07-29 | 3,0 | T-07          | Unit-Tests für `frameScheduler`, `gameState`, `controls` und `playerController` geschrieben; `engine/tests/wasm_tests.rs` vom Stub zum Buffer-Vertragstest ausgebaut                                                                                                                                                                         |
| 2026-07-29 | 4,0 | T-04          | Playwright gegen den Preview-Build eingerichtet, fünf Flows geschrieben, dabei den fehlenden Locale-Umzug gefunden und behoben; Kap. 8.1/8.2 ausgeschrieben, 7.1 und 9.2b nachgezogen                                                                                                                                                        |
| 2026-07-30 | 1,5 | D-01          | Musterdokumentation Seite für Seite als `documentation/muster-referenz.md` erfasst — Kapitelaufbau, Stilanalyse, Kapitel-Mapping Muster → Bericht, Arbeitsregeln; aus `CLAUDE.md` und Kap. 00 verlinkt                                                                                                                                       |
| 2026-07-30 | 1,0 | S-07          | Runden- und Leben-Buchführung aus `index.js` nach `round/roundData.js` ausgelagert, weil `index.js` an der 400-Zeilen-Grenze stand, und unter Vitest abgedeckt; jede Schadensquelle geht jetzt durch ein gemeinsames `registerHit`                                                                                                           |
| 2026-07-30 | 1,5 | S-07          | Temporäre Hindernisse als neuen Spec S-07 spezifiziert (`docs/spec-s07-hindernisse.md`) — Kapselgeometrie, Sackgassen-Invariante mit Beweisskizze, Dichte-Rampe, Engine/Frontend-Grenze; Schätzung und Gesamtbudget in `specs-overview.md` neu gerechnet                                                                                     |
| 2026-07-30 | 6,5 | S-07          | Temporäre Hindernisse umgesetzt: Kapselgeometrie und Streckenabstände, deterministischer Spawn mit Korridor-Invariante, Dichte-Rampe, Boid-Ausweichen, Spielerkollision samt neuer `tick`-Signatur und fünftem Buffer, Rendering mit Ein-/Ausblenden; Spec nach zwei Korrekturen an der Umsetzung nachgezogen                                |
| 2026-07-30 | 0,5 | S-05          | Dash-Reichweite um ~30 % erhöht (`PLAYER_DASH_SPEED_DECAY` 3000 → 2300), Rechenweg im JSDoc korrigiert und einen Test ergänzt, der die Distanz statt nur die Spitzengeschwindigkeit festnagelt                                                                                                                                               |
| 2026-07-30 | 1,5 | S-05          | Gruppendash umgesetzt: `select_dash_candidate` → `select_dash_group`, Gruppenbildung um einen Anführer über Tier und Abstand, Dash-Frequenz und Slot-Grenzen neu getunt, Spieler-Dash-Reichweite ein zweites Mal um 50 % erhöht; sieben neue Zusicherungen, Spec S-05a nachgezogen                                                           |
| 2026-07-30 | 1,5 | S-07          | Feststecken in Hindernissen behoben: blockierter Spieler wird jetzt mit Abstand vor die Oberfläche gesetzt statt darauf, Rückstoß über die Normalkomponente, rotes Aufleuchten des getroffenen Hindernisses als siebter Buffer-Wert; `wasm_tests.rs` wegen der 400-Zeilen-Grenze entlang des Hindernis-Vertrags geteilt                      |
| 2026-07-30 | 1,5 | S-03          | Designsystem-Handoff (`docs/design_system/`) gegen den Code gelesen und in sieben Schritte geplant, dabei fünf Stellen gefunden, an denen das Handoff auf den Bestand nicht passt; Tokens eingebaut und `main.css` literalfrei gemacht                                                                                                       |
| 2026-07-30 | 0,5 | S-03          | Typo-Paar eingebaut: variable Latin-Subsets von Space Grotesk und JetBrains Mono lokal unter `public/fonts/` samt Lizenzen, Canvas-Schriften für Dash-Label und Countdown mitgezogen                                                                                                                                                         |
| 2026-07-30 | 0,5 | S-03          | Arena auf die neue Palette gezogen: tieferer Hintergrund, zweistufiges Grid über eine gemeinsame `strokeLattice`-Hilfsfunktion, Farbliterale im Renderer benannt, Amber-Kollision der vierten Boid-Stufe aufgelöst                                                                                                                           |
| 2026-07-30 | 1,0 | S-07          | Hindernis-Optik „Hazard Tape" eingebaut (Schraffur, Kern, Gefahrenkante, Spawn-Ring, Amber beim Ablaufen, weiße Trefferkante) und die Node-Untestbarkeit des Handoff-Moduls behoben; Unit-Tests von 13 auf 17 Zusicherungen umgeschrieben, Pixel-Sonde des E2E-Tests auf die neue Körperfarbe gezogen und gegen den laufenden Build gemessen |
| 2026-07-30 | 1,0 | S-03          | HUD von vier gerahmten Panels auf Kicker+Wert umgebaut, Wellen-Schiene unter dem Timer aus dem vorhandenen Timerwert, Dash-Bar vom Canvas ins DOM verlegt; zwei E2E-Zusicherungen auf die getrennten Label-/Wert-Elemente gezogen, gesamte Playwright-Suite gegen den Preview-Build grün                                                     |
| 2026-07-30 | 2,5 | S-03          | Hauptmenü als „Command Deck" neu gebaut: `menu.js` als Orchestrator plus `menuDeck.js`, `menuPanels.js` und `menuNavigation.js`, Untermenüs statt `<details>`, Tastaturnavigation mit Pfeilen/Escape und Bewegungstasten nur noch während einer Runde; vier E2E-Tests umgeschrieben, drei neue für die Tastatur                              |
| 2026-07-30 | 1,5 | S-06          | Highscore-Persistenz als `round/roundRecords.js` mit hereingegebenem Storage und 15 Zusicherungen (defekte Einträge, verweigerter Zugriff), Personal-Best-Panel und Game-Over-Karte gebaut, hinter der Karte bleibt der eingefrorene letzte Frame stehen                                                                                     |
| 2026-07-30 | 0,5 | S-03          | Schwarm-Backdrop hinter dem Menü eingebaut (eigener Canvas, reine Präsentation) und den Renderer im Menüzustand vom Zeichnen aufs Leeren umgestellt, damit er durchscheint                                                                                                                                                                   |
| 2026-07-30 | 0,5 | S-02          | Balance-Werte nachgezogen: Startschwarm 36 → 12, Wellenzuwachs 12 → 6, Wahrnehmungsradius 85 → 70; dabei die Doppelführung von `INITIAL_BOID_COUNT` in `gameConfig.js` und die dritte Kopie im E2E-Test mitgeändert                                                                                                                          |

| 2026-07-30 | 2,5 | S-03 | Weltgröße von der Monitorauflösung entkoppelt: feste logische Welt 1920×1080, Contain-Fit im Renderer über das neue Modul `renderer/worldTransform.js` samt acht Unit-Tests, Arena-Zeichnung nach `renderer/arenaLayer.js` ausgelagert, sichtbare Weltkante, `resizeEngine` aus dem Frontend entfernt; neuer E2E-Flow `letterbox.spec.js` und Pixelsonde in `obstacles.spec.js` gegen den neuen Renderscale nachgemessen |

| 2026-07-30 | 2,0 | S-03 | Dash-Schweif „Ion Streak" aus dem Designsystem umgesetzt: `renderer/dashTrail.js` (Kennwerte und Verlaufsmathematik), `renderer/dashTrailHistory.js` (Ringpuffer-Historie), `renderer/trailLayer.js` (Zeichnen) und `renderer/trailSampling.js` (Abtasten pro Frame); Renderer-Farben nach `renderer/entityPalette.js` gezogen, `secondsSinceRender` im `FrameScheduler` als Wall-Time-Basis der Präsentation; 20 neue Unit-Zusicherungen, Sichtprüfung per Screenshot |

| 2026-08-01 | 1,0 | S-03 | Bildraten-Einstellung auf einen Ort reduziert (Panel-Stapel des Startbildschirms entfällt) und an den Monitor gebunden: neues Modul `loop/refreshRate.js` misst die Wiederholrate über den Median von zwölf `requestAnimationFrame`-Abständen und filtert die Optionsliste, die schnellste angebotene Rate ist vorausgewählt; Menü-Einstellungen wegen der 400-Zeilen-Grenze aus `index.js` nach `ui/menuSettings.js` gezogen; 23 neue Unit-Zusicherungen, drei E2E-Tests umgeschrieben, zwei neue |

| 2026-08-01 | 1,5 | S-02 | Schwarm zur dichten Wolke verdichtet, um die Simulation stärker zu belasten: Boid-Größe 15×11 → 11×8, `BOID_COLLISION_RADIUS` 10 → 6, neuer benannter Anteil `CLOSE_NEIGHBOUR_RADIUS_SHARE` 0,5 → 0,36 anstelle des Magic-Number-Faktors in `close_neighbour_radius()`, Kohäsion 0,18 → 0,24; Startschwarm 12 → 24 und Wellenzuwachs 6 → 12; Dash-Gruppe 4 → 6, gleichzeitige Dasher 8 → 12, `DASH_GROUP_RADIUS` 70 → 48; Treffer-Radius als eigenes `BOID_HIT_RADIUS` von `PLAYER_COLLISION_RADIUS` getrennt; dritte Kopie der Boid-Silhouette in `ui/menuBackdrop.js` durch Import aus `gameConfig.js` ersetzt; zwei neue Relaxations-Tests in `overlap.rs`, zwei Dash-Fixtures entschärft |

| 2026-08-01 | 1,0 | S-05b | Power-ups Aegis und Overdrive spezifiziert (`docs/spec-s05b-powerups.md`) und die Streichung in `specs-overview.md` §3.4 durch eine begründete Wiederaufnahme ersetzt; S-05 14 → 20 h, Gesamtbudget 157,5 → 165,5 h |

| 2026-08-01 | 4,5 | S-05b | Power-ups umgesetzt, rein im Frontend: `powerups/powerups.js` (Regeln, Simulationsuhr hereingereicht, Hindernis-Abstand über eine exportierte `distanceToSegment`) und `renderer/powerupLayer.js` (Hexagon-Marker, Aegis-Schale, Zeitbögen, Splitter); `registerHit` um einen optionalen Absorber erweitert, sodass der Trichter einer bleibt und die Reihenfolge Gnadenfrist → Schild → Schaden prüfbar wird; `setSpeedMultiplier` in `playerController.js` statt eines Faktors durch `controls`, weil die Obergrenze auch bei Wand- und Hindernistreffer neu gesetzt wird; Overdrive senkt die Schweif-Schwelle auf `OVERDRIVE_TRAIL_BASE_SHARE`; Buff-Zeilen ins DOM-HUD statt aufs Canvas, Einsammelring aus `launchRingRadius`/`launchRingAlpha` wiederverwendet; `index.js` und `playerController.test.js` liefen an die 400-Zeilen-Grenze und wurden geteilt — der Renderzustand liegt jetzt als `loop/renderState.js` und ist dadurch erstmals unter Vitest, statt nur im nicht ladbaren `index.js` zu stehen; 38 neue Unit-Zusicherungen und drei E2E-Tests |

| 2026-08-01 | 0,5 | S-04b | Pause spezifiziert (`docs/spec-s04b-pause.md`): vierter Freeze-Fall, Countdown-Restzeit, Tastenbesitz von Escape; in `specs-overview.md` S-04 10 → 13 h und Gesamtbudget 165,5 → 168,5 h, die Aufnahme in §3.4 als Fehlerbehebung statt als Feature begründet |

| 2026-08-01 | 3,0 | S-04b | Pause umgesetzt: vierter Zustand `PAUSED`, `input/pauseControl.js` (ein Fenster-Listener für beide Richtungen plus Auto-Pause bei `blur`), `ui/pauseCard.js` als Zwilling der Game-Over-Karte, `pauseCountdown`/`resumeCountdown` und `runSummary` in `roundData.js`; `index.js` lief erneut an die 400-Zeilen-Grenze und wurde vorab geteilt — der Simulationsschritt liegt jetzt als `loop/simulationStep.js`, die Kartenstile als `styles/cards.css` mit neutraler `card`-Basis statt `gameover-`-Klassen; Frametime-Graph pausiert seine Probennahme, `hud.hide()`/`frameTimeGraph.hide()` von `endRound` nach `showStartMenu` verlegt (Fehler, den erst der zweite Weg aus einer Runde sichtbar macht); 12 neue Unit-Zusicherungen, neun E2E-Tests |

| 2026-08-02 | 4,0 | S-02 | Absturz aus dem Playtest (`RuntimeError: index out of bounds` aus `tick()`) diagnostiziert und behoben: Art der Trap gemessen statt geraten (provozierter Rust-Panic meldet `unreachable`, Summe aller Stapelrahmen 1,5 kB), damit Bereichsfehler und Stapelüberlauf ausgeschlossen; Ursache ist ein zweiter nebenläufiger `initEngine`-Aufruf, der eine zweite WebAssembly-Instanz baut, weil der generierte Loader nur gegen ein abgeschlossenes Laden prüft; `engine-bridge.js` teilt jetzt das Lade-Promise, `startGame()` in `index.js` verweigert einen zweiten Start während des ersten; neuer E2E-Flow `engine-instance.spec.js` zählt die Instanziierungen in der Seite (zwei Tests, der erste fällt ohne die Behebung durch) |

| 2026-08-02 | 2,5 | T-08 | Messgrundlage für die GPU-Last gebaut, bevor irgendetwas optimiert wird: `backdrop-filter` aus `.frame-time-graph` entfernt (einziger GPU-Effekt während einer Runde, lag über der Fläche, die jedes Bild neu gezeichnet wird, und verfälschte damit die eigene Messgröße); dritte Textzeile im Overlay mit gezeichneten Bildern/Sekunde, Zeichenoperationen/Bild und Backing-Store-Pixeln, aus den neuen Modulen `renderer/drawCallCounter.js` (einmaliger Methoden-Ersatz am Kontext, kein Pfadaufbau gezählt), `ui/drawnFrameRate.js` (Sekundenfenster) und `formatLoadRow` in `ui/frameGraphScale.js`; Overlay-Verdrahtung wegen der 400-Zeilen-Grenze aus `index.js` nach `ui/frameGraphOverlay.js` gezogen (`index.js` 399 → 396, `frameTimeGraph.js` blieb bei 394 nur durch die Auslagerung der Textmontage); Messprotokoll und Werkzeugliste als Kap. 8.6, T-08 in `specs-overview.md` aufgenommen (Budget 168,5 → 177,5 h); 27 neue Unit-Tests, eine E2E-Zusicherung auf die Panelhöhe |

| 2026-08-02 | 3,5 | T-08 | Pixelpaket umgesetzt, nachdem die Hardware ausgemessen war (AMD Radeon 860M als integrierte GPU, Panel 2880×1800, Windows-Skalierung 200 % ⇒ `devicePixelRatio` 2, aktuell 60 Hz): Arena, beide Gitter und Weltkante werden in `renderer/arenaBackground.js` einmal je Resize in ein Offscreen-Canvas in Gerätepixeln gebacken und pro Bild als ein `drawImage` ausgegeben — aus drei Vollflächen-Durchgängen plus 66 Gitterstrichen wird ein Blit; die zusammengesetzte Transformation dafür als `worldTransformMatrix` aus `canvasRenderer._applyWorldTransform` nach `renderer/worldTransform.js` gezogen, weil sichtbares und gebackenes Canvas dieselbe Matrix tragen müssen; `{ alpha: false }` auf dem Spiel-Canvas, wofür der `clear()`-Vertrag durch `hide()`/`show()` ersetzt wurde (auf deckendem Canvas malt `clearRect` schwarz statt nichts, der Menü-Hintergrund wäre verschwunden); stehende Bilder werden nur noch einmal gezeichnet (`loop/staticFrameGate.js` mit Signatur statt Boolean, damit Pause → Game-Over von selbst neu zeichnet), `renderCurrentState` dafür nach `loop/stateRenderer.js` ausgelagert (`index.js` 396 → 365); `handleResize` invalidiert das Gate, sonst bliebe eine pausierte Runde nach einem Resize schwarz; 19 neue Unit-Tests, zwei E2E-Tests umgeschrieben, zwei neue (Canvas-Sichtbarkeit über den Rundenwechsel, Pixelsonde nach Resize in der Pause) |

| 2026-08-03 | 1,5 | S-07 | Hindernisse werden erst nach ihrer Spawn-Animation wirksam, weil ein direkt vor dem Spieler erscheinendes Hindernis bisher sofort ein Leben kosten konnte: neues `simulation/obstacle_arming.rs` (`begin_arming`, `is_armed`, `obstacle_render_phase`) nach dem Vorbild von `dash.rs` — der Zustand liegt als `arming_steps`/`remaining_arming_steps` am `Obstacle`, die Regeln daneben; `OBSTACLE_ARMING_STEPS` = 90 Schritte (1,5 s), abgefragt in `resolve_player_movement`, `push_boids_out_of_obstacles` und `avoid_obstacles`, bewusst **nicht** in der Platzierungsregel; der sechste Buffer-Wert ist von `life_fraction` auf ein vorzeichenbehaftetes `render_phase` umgestellt (negativ = erscheint, positiv = Restlebensdauer), damit die Einblendzeit der Engine gehoert und `OBSTACLE_FADE_SHARE` im Frontend nur noch das Ausblenden steuert; `obstacle_collision.rs` lief mit den neuen Tests auf 412 Zeilen und wurde entlang der im Kopfkommentar schon beschriebenen Naht geteilt (`obstacle_pushout.rs`); 13 neue Rust-Zusicherungen, zwei neue WASM-Vertragstests, Frontend-Fade-Tests auf die neue Signatur umgeschrieben |

| 2026-08-03 | 0,5 | S-03 | Dash-Cooldown zusätzlich unter dem Spieler angezeigt, weil der Blick auf die HUD-Bar am unteren Bildschirmrand im Gefecht ein Blick weg vom Schwarm ist: Lebensanzeige und neue Dash-Bar liegen jetzt gemeinsam als Stapel in `renderer/playerStatusBars.js` (`statusStackLayout` klemmt gegen die Weltkanten, ein Backdrop für beide Balken), `canvasRenderer.js` gab dafür `drawPlayerHealth` ab und fiel von 382 auf 339 Zeilen; `buildFrozenRenderState` trägt `dashCooldownProgress` jetzt mit, sonst verschwindet der Balken im eingefrorenen Bild unter einer stehenden Lebensanzeige; Farben aus `styles/hud.css` übernommen statt neu gewählt; 15 neue Unit-Zusicherungen auf Geometrie, Füllstand und Zeichenreihenfolge, Sichtprüfung über einen temporären Playwright-Screenshot in drei Cooldown-Zuständen |

| 2026-08-03 | 2,5 | S-04 | Wellen kündigen sich am Weltrand an, statt irgendwo in der Arena zu erscheinen: zwei neue Engine-Module — `simulation/wave_spawn_placement.rs` (Perimeter als **eine** Zahl im Uhrzeigersinn, `gate_perimeter_offset` schiebt ein Tor entlang der Kante, bis es `safe_spawn_distance` zum Spieler hält, `inward_velocity` mit alternierendem Seitenanteil) und `simulation/wave_spawn.rs` (`WaveSpawnQueue`, Warnfenster in Simulationsschritten, `wave_spawn_warning_progress`), nach demselben Schnitt wie `obstacle_spawn.rs`/`obstacle_field.rs`; `set_wave` **spawnt nicht mehr**, sondern kündigt an, `tick()` lässt die Boids nach `WAVE_SPAWN_WARNING_STEPS` = 120 Schritten (2 s) herein — `entity_count` hinkt der Wellennummer damit bewusst zwei Sekunden nach; siebter Buffer `spawn_markers` mit Stride 3 (`[x, y, warning_progress]`), ohne Vorzeichentrick, weil ein Eintrag nur existiert, solange er anhängig ist; `safe_spawn_distance` aus `wasm_bridge` in das Platzierungsmodul verschoben und die Tier-Verzweigung als `build_boid` zusammengeführt, damit die freie Platzierung der ersten Flock und die Tore nicht auseinanderlaufen; Frontend zeichnet den Platzhalter (`renderer/spawnMarkerLayer.js` plus importfreie Arithmetik in `spawnMarkerPulse.js`), Ring **schrumpft** hier statt zu wachsen wie beim Hindernis; 24 neue Rust-Zusicherungen, 11 neue WASM-Vertragstests in `wasm_wave_spawn_tests.rs`, 19 neue Frontend-Zusicherungen, Sichtprüfung über einen temporären Playwright-Screenshot bei 00:30 und 00:32 |

| 2026-08-03 | 1,5 | S-07 | Boids prallen an Hindernissen ab, statt beim Dash durch sie hindurchzufliegen: `resolve_player_movement` ist zu `resolve_movement_against_obstacles` (Rückgabe `MovementResolution`, Parameter `mover_radius`) verallgemeinert und `PLAYER_OBSTACLE_KNOCKBACK_DISTANCE` entsprechend zu `OBSTACLE_KNOCKBACK_DISTANCE` umbenannt, weil derselbe Streckentest jetzt Spieler **und** Boid bedient; neues `simulation/obstacle_bounce.rs` setzt ihn pro Boid an — Aufruf in `Flock::update` direkt nach `integrate` und **vor** `wrap_position`, sonst läuft die Prüfstrecke eines am Weltrand umgeschlagenen Boids quer durch die Arena; `bounced_velocity` nimmt den Anteil in die Oberfläche weg und gibt `BOID_OBSTACLE_BOUNCE` = 0,35 davon zurück, denselben Wert wie `PLAYER_OBSTACLE_BOUNCE` im Frontend; der Dash wird nicht abgebrochen, der Boid federt mit erhöhter Kappe zurück; `flock.rs` stand mit dem neuen Aufruf bei 427 Zeilen und ist durch das Verschieben seiner beiden Hindernis-Integrationstests (Weg um eine Stange nach `obstacle_bounce.rs`, Rettung aus einem neu erschienenen Hindernis nach `obstacle_pushout.rs`) auf 381 zurück; 10 neue Rust-Zusicherungen, davon eine über `Flock::update` gegen die Verdrahtung selbst |

| 2026-08-03 | 0,5 | S-06 | Power-up-Marker um die Hälfte vergrößert, weil ein Pickup, das man schwer trifft, ignoriert wird: `PICKUP_RADIUS` 18 → 27, `COLLECT_RADIUS` 26 → 39 (gleicher Faktor, damit das eingespielte Verhältnis der beiden bleibt), `MIN_OBSTACLE_CLEARANCE` 60 → 70, weil der Abstand Glyphe **plus** Spielerkörper außerhalb der Kapsel halten muss; zwei neue Zusicherungen auf genau diese beiden Verhältnisse — jeder andere Test in `powerups.test.js` liest seine Konstante selbst und würde ein Nachhinken des Aufsammelradius hinter der Optik nicht bemerken; Kap. 11 des Design-Systems auf die neuen Zahlen gezogen |
| 2026-08-04 | 2,0 | S-05 | Drittes Power-up **Mend** aus dem Design-Handoff umgesetzt (gibt ein Lebenssegment zurück): Wirkung ist `roundData.restoreLives` — Gegenstück zu `registerHit`, klemmt gegen `maxLives` an genau einer Stelle und vergibt bewusst **keine** Gnadenfrist, weil das Aegis' Aufgabe ist; `PowerupField.step` bekommt den Lebensstand hereingereicht und **liest** ihn nur, `KINDS` zyklt über drei Arten mit Übersprung bei voller Gesundheit (Zählstand wird erst nach erfolgreicher Platzierung fortgeschrieben, sonst schluckt eine zugestellte Arena ein Angebot); ein Marker, dessen Nutzen während seiner Liegezeit entfällt, wird über 300 ms **inert** statt zu verschwinden; Mend erzeugt keinen Buff, also keine HUD-Zeile und keinen Restzeitbogen, sondern nur den Moment (einmaliger Bogen **gegen** den Uhrzeigersinn, weiß aufblitzendes Segment); vier neue Module entlang bestehender Nähte, weil zwei Dateien am 400-Zeilen-Limit standen — `powerups/mend.js` (alles, was von Leben weiß), `powerups/markerClearance.js` (Spawn-Geometrie, `powerups.js` 356 → 331), `renderer/mendPulse.js` (importfreie Arithmetik) und `renderer/powerupMarkerLayer.js` (Boden gegen Spieler, `powerupLayer.js` 373 → 244); 44 neue Frontend-Zusicherungen (365 → 409), E2E-Suite unverändert 50 grün, Spec S-05b und Kap. 11 des Design-Systems fortgeschrieben |
| 2026-08-04 | 2,5 | S-05 | Drei Gameplay-Verbesserungen aus einer Spielsitzung des Betreuers: (1) Der gemeldete Fehler „Power-ups spawnen auf Hindernissen" existierte nicht — die Prüfung war korrekt, verdrahtet und getestet; die tatsächliche Ursache ist die Gegenrichtung (Hindernisse entstehen alle ~9 s und stehen 40 s, Marker liegen 12 s, also wächst regelmäßig eines über einen liegenden Marker), von der Spec ausdrücklich als akzeptierte Grenze geführt. Jetzt behandelt: `markerLifetime.js` prüft jeden Marker pro Schritt, ein verdeckter skaliert über `OBSTACLE_RETIRE_FADE_MS` = 350 ms weg — innerhalb der 1,5 s Anlaufzeit des Hindernisses, also bevor es fest ist — und ist ab dem Setzen von `retiringSinceMs` nicht mehr aufsammelbar; Rücknahmeschwelle ist `PICKUP_RADIUS` (27) gegen die Platzierungsschwelle 70, damit nicht jedes benachbarte Hindernis einsammelbare Marker löscht. (2) Ein Marker zeigt seine Restliegezeit jetzt an, über **dieselbe** Funktion, mit der ein Buff am Spieler abläuft: `drawTimeArc` samt Blinkgate aus `powerupLayer.js` in ein Blattmodul `renderer/timeArc.js` gezogen, weil zwei Aufrufer sonst einen Importzyklus über `powerupMarkerLayer.js` geschlossen hätten, und die Wanduhr des Blinkens von `performance.now()` auf einen Parameter umgestellt — dadurch ist das Motiv erstmals prüfbar, es war vorher auf keiner Teststufe abgedeckt. (3) Spielerhandling: neues `PLAYER_TURN_DECELERATION` = 3600 bremst in `_steer` den Geschwindigkeitsanteil, der nicht in die gehaltene Richtung zeigt; `PLAYER_ACCELERATION` 1200 → 2000, `PLAYER_DECELERATION` 1500 → 2600, `PLAYER_MAX_SPEED` und `PLAYER_DASH_SPEED` bewusst unverändert (Tunnel-Invariante, Overdrive-Faktor, Schweif-Schwelle hängen daran). Gemessen: 90°-Wende 1,63 s → 0,10 s, 180°-Wende 0,60 s → 0,28 s, Anfahren 0,30 → 0,18 s, Anhalten 0,25 → 0,15 s. `powerups.js` lief bei 416 Zeilen auf und wurde entlang der schon zweimal benutzten Naht geteilt (`markerLifetime.js`), `powerups.test.js` und `playerController.test.js` ebenso (`playerSteering.test.js`); Spec S-05b §2/§3/§5/§6/§7 und Kap. 11 des Design-Systems fortgeschrieben, inklusive der ausdrücklichen Rücknahme der akzeptierten Grenze |

| 2026-08-04 | 1,0 | S-03 | HUD-Fortschrittsblock aus dem fortgeschriebenen Designsystem umgesetzt: die Wellennummer verlässt die rechte obere Ecke und steht mit Timer und dem neuen Wert `SPAWNING` als `.hud-group` oben Mitte, getrennt durch Haarlinien — die drei beantworten **eine** Frage („wie weit bin ich, was kommt jetzt") und brauchten dafür bisher zwei Blicke in gegenüberliegende Ecken; `SPAWNING` zeigt die Stufe 01–05 der gerade spawnenden Boid-Variante plus Boid-Silhouette, beides in der Farbe genau dieser Stufe aus `BOID_COLORS` — die Farbe ist die eigentliche Ankündigung, weil sie auf die Darts in der Arena zeigt, die Zahl nennt nur den Schritt und zeigt zugleich, wo die Rampe endet (ab Welle 5 steht sie auf 05, während die Wellennummer weiterläuft); Ableitung der Stufe als neues Frontend-Modul `round/waveTier.js` statt als achter Wert über die WASM-Grenze (siehe Entscheidung), `MAX_BOID_DIFFICULTY_TIER` damit als zweite bewusste Handkopie neben `INITIAL_BOID_COUNT` in `gameConfig.js`. Nebenbefund beim Umbau: `.hud-stat--boids` war ein toter Selektor — die Boid-Zahl stand seit dem HUD-Umbau vom 2026-07-30 in Weiß statt in Rot, weil das Element die Klasse nie trug; die Utility `.top-right` entfällt mit der Wellennummer, und mit ihr das Stapeln zweier Ecken im ≤640-px-Fenster. Acht neue Unit-Zusicherungen, zwei neue E2E-Zusicherungen (Stufe und ihre Farbe), Sichtprüfung per temporärem Playwright-Screenshot in Welle 1 und — mit verkürzter `WAVE_DURATION_SECONDS` und erhöhtem Lebensstand — in Welle 3 |
| 2026-08-04 | 2,0 | S-05 | Vorwarnlinie für den Boid-Dash: ab dem ersten Blinken zieht ein ladender Boid eine dünne rote gestrichelte Linie dorthin, wo sein Dash endet, die im Absprungschritt verschwindet — der Puls sagte bisher _dass_ und _wann_, aber nicht _wohin_, und ohne das Wohin ist die Vorwarnung eine Aufforderung zum Zucken statt zum Ausweichen. Geometrie kommt aus dem neuen `simulation/dash_aim.rs`, in das `launch_direction` und `dash_speed` aus `dash.rs` umgezogen sind: dieselbe Funktion schreibt den Absprung und misst die Linie, das Auseinanderlaufen ist damit strukturell verhindert statt kommentiert; `dash_distance` = `dash_speed × dash_steps`, weil jeder Dash-Schritt an der erhöhten Kappe läuft. Neuer Buffer `dash_aims` mit Stride 5 (`[start_x, start_y, end_x, end_y, charge_progress]`), eigene Anzahl statt Index-Gleichheit wie `spawn_markers` (höchstens ~15 von bis zu 156 Boids laden gleichzeitig), kein Vorzeichentrick, weil ein Eintrag nur während `Charging` existiert; `GameEngine` merkt sich dafür `last_player_position`, weil `snapshot()` keine Spielerposition bekommt und die eingefrorene Welt dieselben Linien zeigen muss wie der `tick` davor. `wasm_bridge/mod.rs` stand mit dem neuen Buffer bei 421 Zeilen und wurde entlang derselben Naht geteilt, an der schon `boid_factory.rs` abging: `frame_buffers.rs` nimmt die drei Strides und `build_frame_response` (302 Zeilen bleiben). Frontend: `dashAimAlpha` zu `dashPulseScale` und `dashGlowLevel` in `dashPulse.js` — drei Zahlen aus einer Phase — plus die Zeichenebene `renderer/dashAimLayer.js` nach dem Muster von `spawnMarkerLayer.js` (Alpha-Tabelle statt `rgba(...)` pro Bild, `setLineDash` **innerhalb** von `save`/`restore`, sonst strichelt jeder spätere Strich mit). Sieben neue Rust-Zusicherungen, sechs neue WASM-Vertragstests in `wasm_dash_aim_tests.rs`, 16 neue Frontend-Zusicherungen (465 gesamt), E2E unverändert 51 grün; Sichtprüfung per temporärem Playwright-Screenshot in Welle 3, mit `DASH_UNLOCK_DIFFICULTY_TIER = 1` und gekürzter Wellendauer |
| 2026-08-04 | 0,5 | S-05 | Spielerhandling nachgestimmt, weil die erste Fassung im Spieltest zu zackig lief — vor allem in Kurven: `PLAYER_TURN_DECELERATION` 3600 → 2200, `PLAYER_ACCELERATION` 2000 → 1600, `PLAYER_DECELERATION` 2600 → 2000, alle drei bewusst zwischen dem Stand vor dem Umbau und dem der ersten Fassung. Gemessen: 90°-Wende 0,10 → 0,17 s (vor dem Umbau 1,63 s), 180°-Wende 0,28 → 0,40 s (0,60 s), Anfahren 0,18 → 0,23 s (0,30 s), Anhalten 0,15 → 0,18 s (0,25 s). Kein Codepfad und kein Test geändert: alle Zusicherungen in `playerSteering.test.js` lesen ihre Konstanten aus `gameConfig.js` statt sie zu spiegeln, weshalb die Umstimmung eine Drei-Zeilen-Änderung ist — genau der Zweck dieser Testform. Die Umkehr-Zusicherung ist zugleich die **Untergrenze** der neuen Zahl: unterhalb von etwa `PLAYER_ACCELERATION` dauert das Wegbremsen der alten Richtung länger als das Durchbeschleunigen, die Querbremse verliert damit ihren Zweck; das steht jetzt als Kommentar an der Konstante, damit die nächste Nachstimmung die Grenze kennt |
| 2026-08-04 | 0,5 | S-05 | Aegis nachgestimmt, weil der Schild im Spieltest genau den Zug nicht bezahlte, für den er gedacht ist: er fraß einen Treffer und war weg, ein Dash in eine Formation setzt aber drei oder vier Boids innerhalb weniger Schritte auf den Spieler — der zweite kostete trotzdem ein Leben. Der Bruch öffnet jetzt ein Fenster von `AEGIS_ABSORB_INVULNERABILITY_MS` = 1000 ms, in dem `absorbHit` jeden Treffer kostenlos macht; getragen von `PowerupField._absorbInvulnerableUntilMs`, nicht von `roundData.lastHitAtSimulationMs` (siehe Entscheidung). Sichtbarkeit ohne neue Optik: `playerInvulnerable` im renderState wird aus zwei Quellen verodert, der amberfarbene Spieler ist das bestehende Wort für „unantastbar" und trägt die 650 ms nach dem 350-ms-Shatter. `powerups.test.js` lief bei 434 Zeilen auf und wurde entlang derselben Naht geteilt, an der schon `mend.test.js` abging — `powerupBuffs.test.js` nimmt die beiden Buffs am Spieler mit eigenem Treiber, `powerups.test.js` behält die Arena (278 Zeilen). Sechs neue Zusicherungen zum Fenster, eine in `renderState.test.js` für die Verodung, Frontend-Suite 470 grün; Spec S-05b §2/§4/§6/§7 fortgeschrieben, inklusive der ausdrücklichen Rücknahme der Festlegung vom 2026-08-01 |
| 2026-08-06 | 0,5 | S-05 | Spielerhandling auf den Stand vor beiden Fassungen zurückgebaut, auf ausdrücklichen Wunsch: `_steer` und `PLAYER_TURN_DECELERATION` entfallen ersatzlos, `PLAYER_ACCELERATION` 1600 → 1200, `PLAYER_DECELERATION` 2000 → 1500, das Halten einer Richtung addiert wieder nur. Gegenprobe mit demselben Messtreiber wie am 2026-08-04 und exakt auf die Ausgangswerte zurück (90° 1,633 s, 180° 0,600 s, Anfahren 0,300 s, Anhalten 0,250 s), also ein Rückbau und kein dritter Zustand. `playerSteering.test.js` bleibt bestehen und dreht die Richtung: statt der Querbremse hält es jetzt fest, dass eine Wende teuer ist (180° = doppeltes Anfahren, 90° länger als das, erster Wendeschritt nimmt < 5 % der Querkomponente) — vier Zusicherungen ausgetauscht, drei modellunabhängige behalten (radiale Kappe, Overdrive-Kappe über eine Wende, Diagonale ohne Mehrgeschwindigkeit); die Dash-Zusicherung kehrt sich mit um, weil der Überschuss ohne Querbremse nicht mehr weglenkbar ist. Der `[Unreleased]`-Eintrag im Changelog wurde gestrichen statt widerrufen, weil die Änderung nie in einem Release stand. Frontend 470 Unit-Tests und 51 E2E-Tests grün, ESLint ohne Befund |
| 2026-08-11 | 1,5 | S-01 | `engine/src/simulation/` von 22 flachen Dateien auf vier Einzeldateien plus vier Themenordner umgebaut (`steering/`, `dash/`, `obstacle/`, `wave/`), Namenspräfixe entfallen (`obstacle_bounce.rs` → `obstacle/bounce.rs`). Vier Commits, einer je Ordner, beginnend mit `wave/` als risikofreiem Probelauf — dieser Cluster hat null eingehende Kanten aus dem Rest der Simulation. Jeder Ordner bekommt ein Fassaden-`mod.rs` nach dem Muster, das `dash.rs` schon trug; dadurch blieben `boid.rs`, `overlap.rs` und die meisten `use`-Zeilen in `flock.rs` unverändert, und außerhalb von `simulation/` waren nur drei Dateien betroffen. Kein Dateiinhalt verändert: 206 Lib-Tests vor und nach jedem der vier Commits, `cargo clippy --all-targets -- -D warnings` und `cargo fmt --check` ohne Befund; die WASM-Grenze zusätzlich über `wasm-pack test` und die E2E-Suite gegen einen frisch gebauten Produktionsbuild geprüft, weil `cargo test` für `engine/tests/` grundsätzlich 0 meldet. Doku nachgezogen: der Engine-Abschnitt in `CLAUDE.md` (dabei den Altbestand korrigiert — `steering.rs`, alle neun Hindernis-Dateien und `math/segment.rs` fehlten dort seit ihrer Entstehung), die Diagramm-Tabelle in `00-index.md`, die Pfadnennungen in `04-systemnah-wasm-bausteine.md` und `spec-s05-dash.md`; historische Pfade in diesem Journal bleiben stehen, weil ein rückwirkend umgeschriebener Eintrag den Stand von damals falsch darstellen würde |
| 2026-08-11 | 1,5 | D-01 | `documentation/codebase-ueberblick.md` geschrieben — ein Einstiegstext, den es bisher nicht gab: `README.md` deckt nur das Setup ab, die Kapitel 03/04/05 sind Gerüste unter Seitenbudget, `docs/spec-*.md` sind Feature-Specs. Der Überblick führt in der Reihenfolge, in der das Programm arbeitet (Boot → ein Frame von A bis Z → Engine ordnerweise → Frontend paketweise → die tragenden Invarianten), plus eine Landkarte „ich will X ändern → diese Datei" und ein Abschnitt zu den Änderungen der letzten Wochen. Bewusst ohne Nummernpräfix, damit er nicht als Berichtskapitel gelesen wird, und ohne LOC-, Test- oder Coverage-Zahlen — die stehen laut Konvention 1 aus `00-index.md` ausschließlich in Kapitel 09, auf das der Text verweist. Zusätzlich als gehostete HTML-Seite mit gerenderten Mermaid-Diagrammen veröffentlicht |
| 2026-08-11 | 0,5 | T-01 | Alle 37 Frontend-Testdateien aus den Quellordnern in je ein `__tests__/` darin verschoben, auf Wunsch als Konvention für künftige Tests. Anlass war `src/loop/`: fünf Module, fünf Testdateien, eine Ordneransicht, in der die Hälfte der Einträge kein Programmcode ist — bei `renderer/` mit 15 Tests dasselbe Bild. Umgesetzt mit `git mv` (Umbenennungen bleiben in der Historie verfolgbar) und einer Ersetzung der relativen Importpfade um genau eine Ebene; kein Testinhalt geändert, 470 Zusicherungen vor und nach dem Umbau grün. Drei Konfigurationsstellen ziehen mit: `include` in `vitest.config.js` auf `src/**/__tests__/*.test.js` — die alte Angabe hätte weiter gegriffen, aber dann wäre eine lose abgelegte Datei still eingesammelt worden statt aufzufallen; in `eslint.config.js` beide Blöcke auf den Ordner statt auf `*.test.js`, damit eine gemeinsame Testhilfe ohne Endung `.test.js` dieselbe JSDoc-Ausnahme erbt wie die Specs unter `e2e/`. Playwright bleibt unberührt, die Disjunktheit der beiden Runner ist mit dem engeren Glob sogar strenger als vorher. Doku nachgezogen in `CLAUDE.md`, `README.md`, `.github/copilot-instructions.md`, Kap. 08 und den drei Handoff-Anleitungen unter `docs/design_system/`; der Zählbefehl in Kap. 09 brauchte keine Änderung, weil er ohnehin rekursiv sucht |
| 2026-08-11 | 1,0 | T-04 | Entwickleroption „Invulnerable Player" umgesetzt: Runden, in denen der Spieler keine Leben verliert, als Messinstrument für Langzeit-Frametimes — die interessanten Werte liegen jenseits von zehn Minuten Spielzeit, und dorthin kam man vorher nur durch Überleben. Die Fahne wird einmal beim Öffnen der Runde in `createRoundData` gelesen und in `registerHit` als erster von drei Ausstiegen geprüft; `lastHitAtSimulationMs` bleibt unberührt, damit die Optik der Runde unverändert bleibt. Abgedeckt auf drei Ebenen: vier Vitest-Zusicherungen in einer eigenen Datei `round/__tests__/invulnerableMode.test.js` (die bestehende Datei stand bei 399 Zeilen), zwei Playwright-Flows zum Schalter selbst und einer in `gameover.spec.js`, der 20 Sekunden Stillstand ohne Rundenende festnagelt — dieselbe Eingabe, die im Test darüber in unter fünf Sekunden drei Leben kostet. Der letzte Flow fand einen Altfehler: das Menü rendert aus einer Momentaufnahme der Einstellungen, zeigte also beim erneuten Betreten eines Untermenüs wieder den Ausgangswert; `Menu.showStart` bekommt die Optionen jetzt als Funktion und liest sie pro Render neu |
| 2026-08-13 | 1,0 | D-01 | Beginn der Schreibphase des Berichts: Kapitel 01 „Anforderungen und Ziele" von vier `TODO`-Blöcken auf Entwurfsstand ausgeschrieben (Themensteckbrief, Lösung mit den sieben Specs und drei bewussten Auslassungen, Projektrahmen, Fokus-Thema mit beiden tragenden Invarianten). Quellen waren `README.md`, `.github/copilot-instructions.md`, `docs/specs-overview.md` und der Code selbst; jede genannte Zahl gegen die Konstanten geprüft (drei Leben, 30 s Wellendauer, +12 Boids je Welle, fünf Varianten bis `MAX_BOID_DIFFICULTY_TIER`, Welt 1920 × 1080), jeder Querverweis gegen die Überschriften der Zielkapitel — zwei davon zeigten ins Leere („8.5 CI/CD" ist 8.3, 8.5 ist Lighthouse) und wurden korrigiert, was den Nutzen der Regel „Verweis mit Nummer **und** Titel" gleich am ersten Kapitel belegt. Der Ablauf für die restlichen Kapitel ist als eigener Abschnitt in `CLAUDE.md` festgehalten (Reihenfolge Muster- → Bedingungen-Referenz → Journal-`grep`, ein Kapitel je Commit, `CHANGELOG.md` bleibt unberührt, Statusspalte in `00-index.md` mitziehen) |
| 2026-08-13 | 1,0 | D-01 | Kapitel 02 „Technik Stack" von drei `TODO`-Blöcken auf Entwurfsstand ausgeschrieben: Rahmenbedingungen (Zielplattform, Sprachwahl mit drei strukturellen Gründen für Rust, Sprachgrenze, Node.js nur als Entwicklungswerkzeug), die drei tragenden Architektur-Entscheidungen mit Begründung, fünf ausdrückliche Negativaussagen (kein Backend/DB/API/Konto, kein UI-Framework, keine Spielbibliothek, kein `rand`, keine Laufzeit-Abhängigkeit) und der Canvas als Fünf-Zeilen-Übersicht mit Langfassung im Anhang. Alle Versionen aus `Cargo.toml`/`package.json` und den beiden eingecheckten Lockfiles gezogen, nicht aus dem Gedächtnis. Drei Befunde beim Schreiben: `wasm-pack` und die Rust-Toolchain sind **nirgends** im Repository festgelegt (keine `rust-toolchain.toml`), der Build hängt also am Entwicklungsrechner — als offener Punkt zu T-05 benannt statt übergangen; `frontend/vite.config.js` existiert nicht, war aber in `specs-overview.md` als Teil von T-06 geplant, teilt also dessen Status; und `js-sys` steht tatsächlich nur an einer Stelle (`wasm_bridge/response.rs`), was per `grep` geprüft und als Belegsatz für die schmale Schnittstelle verwendet wurde. Nebenbefund außerhalb des Kapitels: `00-index.md` und `11-anhang.md` verweisen beide auf `npm run docs:diagrams`, ein Skript, das in `frontend/package.json` nicht existiert (dort stehen nur `docs:ki-verzeichnis` und `docs:check`) — offen, betrifft den Word-Zusammenbau |
| 2026-08-13 | 2,0 | D-01 | Kapitel 03 „Frontend: Struktur / Bausteine" von acht `TODO`-Blöcken auf Entwurfsstand ausgeschrieben, mit allen zehn Punkten der Katalogfolie: Komponentenliste nach Paketen, UI-Aufbau (Canvas-gegen-DOM-Grenze nach Rasterkosten, Menüfamilie, `aria-pressed` statt `radiogroup`, i18n, sechs Stylesheets in tragender Reihenfolge), Bausteinsicht der Eingabekette als Mermaid-Diagramm samt der drei verworfenen Alternativen, Interaktion über `index.js`, Modularisierung (drei Regeln), State Management (drei Zustandsschichten plus die Zeitregel), Routing als begründete Absenz, Persistenz, Konfiguration und Fachlogik. Vor dem Schreiben acht Gerüst-Angaben gegen den Code geprüft und dabei vier als überholt gefunden: `gameState.js` hat **vier** Zustände (`PAUSED` kam am 2026-08-01 hinzu), der `localStorage`-Highscore ist längst umgesetzt, die Menü-Familie besteht aus fünf Modulen statt zwei, und die doppelt geführten Konstanten sind nicht eine, sondern fünf (`INITIAL_BOID_COUNT`, `MAX_BOID_DIFFICULTY_TIER`, drei Strides). Zwei Befunde außerhalb des Kapitels: In `CLAUDE.md` stand `loop/frameGraphScale.js`, das Modul liegt aber unter `ui/` — korrigiert, weil die Angabe zur Anleitung gehört; und der Doc-Kommentar an `PLAYER_DASH_SPEED_DECAY` nennt neben den beiden nachgerechneten Werten (179 px Überschuss, 0,48 s Rampe) noch „~79 px, die der Spieler ohnehin gelaufen wäre" — bei 360 px/s über 0,48 s sind das rund 174 px, die Zahl stammt offenbar aus einer früheren Abbau-Konstante. Der Kommentar ist **nicht** geändert (Quellcode, eigener Commit); das Kapitel druckt nur die beiden geprüften Werte |
| 2026-08-13 | 2,5 | D-01 | Kapitel 04 „Systemnah / WASM: Struktur / Bausteine" von acht `TODO`-Blöcken auf Entwurfsstand ausgeschrieben — das Fokus-Kapitel, mit allen zehn Punkten der Katalogfolie plus dem hier zusätzlich geforderten Punkt Konfiguration: Komponenten nach Verzeichnissen samt Fassadenregel, die fünf Steuerungsregeln und ihre Kopplung an `max_speed` mit den drei verworfenen Wegen zum Dash-Speed-Cap, Bausteinsicht des Dash-Clusters als Mermaid-Diagramm mit der Hash-Arithmetik als gesetzter Formel, die Schrittreihenfolge zweistufig (`tick()` und `Flock::update()`) mit dem Grund je Position, Modularisierung (vier Regeln, 400-Zeilen-Grenze als erzwingende), State Management (drei Schichten plus zwei bewusst fehlende Zustände), Dispatch statt Routing, Persistenz im linearen Speicher, Konfiguration und der Rechenkern mit zwei quantitativen Beispielen. Abweichung vom Gerüst und von der Katalogvorgabe: Das quantitative Beispiel ist die Reichweite des **Boid**-Dashes und nicht die 180-px-Herleitung des Spieler-Dashes — die liegt seit Kapitel 03 in 3.8 und wäre hier eine Wiederholung im falschen Kapitel. Vier Gerüst-Angaben waren überholt: es sind fünf Steuerungsregeln und nicht vier (`avoid_obstacles` fehlte), `Flock` besitzt **nicht** Weltgrenzen und Wellenzustand (die liegen in `GameEngine`, der Flock hält nur Boid-Vektor und `step_counter`), pro Selektionsrunde wird eine **Gruppe** von bis zu sechs Boids angeboten und nicht ein einzelner, und die Schrittreihenfolge enthält seit dem 2026-08-03 zusätzlich Hindernis-Abprall und Push-out. Drei Zahlen in `docs/spec-s05-dash.md` waren gegen den Code veraltet und sind dort mitkorrigiert worden, weil die Spec die benannte Quelle dieses Kapitels ist: die harte Gleichzeitigkeitsgrenze (8/11 → 12/15, `MAX_CONCURRENT_DASHING_BOIDS` stieg mit der Verdichtung von 8 auf 12), die Trefferschwelle (28 px → 21 px, seit der Trennung von `BOID_HIT_RADIUS`) und die Spieler-Dash-Rechnung in §2 (Abbau 3000 → 1533). Nebenbefund außerhalb des Kapitels: `CLAUDE.md` nannte `segments_cross`, die Funktion heißt `segments_intersect` — korrigiert. Neu im Anhang: die vollständige Dash-Tuning-Tabelle je Stufe, aus den Konstanten abgeleitet statt aus der Spec übernommen |
| 2026-08-13 | 1,5 | D-01 | Kapitel 05 „Frontend/Systemnah-Integration — WASM" von vier `TODO`-Blöcken auf Entwurfsstand ausgeschrieben, mit allen drei Punkten der Katalogfolie: fünf Bausteine der Naht (`wasm_bridge/mod.rs`, `response.rs`, `frame_buffers.rs`, `engine-bridge.js`, das generierte Glue-Paket), der Puffer-Vertrag mit dem Vorzeichentrick als tragendem Muster und den drei Stellen, an denen er bewusst **nicht** angewandt ist, zwei Mermaid-Diagramme (Bausteinsicht der Grenze und `sequenceDiagram` eines Bildes) und die Schnittstellenregeln in 5.3 — Namensübersetzung an einer Stelle, geteiltes Lade-Promise, die vier Verpflichtungen aus dem festen Zeitschritt, die Asymmetrie von `tick`, die Regel „Zustand geht über die Grenze, eine Rechnung auf einer bekannten Zahl nicht", die fünf Handkopien samt der dritten Kopie im Grenztest, die Build-Kopplung und die zwei Testbarkeitsfolgen. Drei Gerüst-Angaben waren überholt: der Vertrag hat **sieben** Puffer und nicht vier (das Gerüst und `CLAUDE.md` §Invariante 2 nennen die vier index-alignierten, die drei gezählten kamen mit S-07, S-04 und S-05 dazu), `wasm_bridge/` besteht aus vier Dateien und nicht aus zwei, und `boid_factory.rs` liegt zwar dort, überquert aber nichts. Jede Zahl gegen den Code geprüft (Strides 7/3/5, `MAX_SIMULATION_STEPS_PER_FRAME` = 5, 60 Schritte/s, fünf Handkopien) und jeder Querverweis gegen die Zielüberschriften; die Toolchain-Fundstelle liegt in 2.3 und nicht in 2.1, `MAX_BOID_DIFFICULTY_TIER` steht in `constants.rs` und nicht in `boid_factory.rs`. Neu im Anhang: die Tabelle „Die sieben Puffer eines Frames" samt der fünf Skalare, die nur ein `tick()` erzeugt; die geplante `dash_phases`-Wertetabelle entfällt dort, weil sie mit drei Zeilen in 5.2.1 selbst steht. Nebenbefund im Code, nicht geändert (eigener Commit): der Rückfall in `normalizeFrameResponse` liefert für einen `snapshot()` `null` statt der im Kommentar versprochenen versuchten Position — folgenlos, weil `snapshot()` mit `attemptedPosition = null` gerufen wird und kein Aufrufer `frame.playerPosition` eines Snapshots liest |
| 2026-08-13 | 1,0 | D-01 | Kapitel 06 „KI-driven Engineering & Prozess" von drei `TODO`-Blöcken auf Entwurfsstand ausgeschrieben, mit allen drei Punkten der Katalogfolie: modulare Konfiguration als Vier-Dateien-Tabelle entlang zweier Achsen (werkzeugübergreifend/werkzeugspezifisch, committet/maschinenlokal) samt dem Grund, warum eine einzelne Instruktionsdatei nicht geht — Copilot und Claude Code lesen je ihre eigene und folgen keinem Verweis; fünf strukturprägende Regeln mit je einem am Code belegten Effekt statt einer Regelliste; Prozess mit Spec-Beispiel, den fünf Pflichtschritten, dem Modell-Mix in drei Rollen und der Prompt-Log-Lücke. Zwei Gerüst-Angaben waren falsch und sind als Befund ins Kapitel gewandert statt übernommen zu werden: `.claude/settings.json` enthält **nicht** nur schreibgeschützte Befehle (auch `git stash`, `npm run format`, `sed -i` und Dutzende Einmalaufrufe längst gelöschter Messskripte) — die Liste wirkt als Reibungsabbau, nicht als Sicherheitsgrenze, und ihre Aufräumung ist als offener Posten in 10.1 benannt; und die in Kap. 12 behauptete Gleichsetzung von `topic` mit den Conventional-Commit-Scopes hält der Historie nicht stand (dort dominieren `frontend` und `engine`, das Protokoll führt die sechs feineren Kategorien), weshalb das Kapitel die Zuordnung Prompt → Commit über den Commit der Sessiondatei begründet und nicht über den Scope-Namen. Neue Aussage gegenüber dem Gerüst: der Umgang mit dem Designsystem-Handoff als eigener Abschnitt — vier belegte Abweichungen (fünf nicht passende Einbaustellen, geteilte Stylesheet-Datei, ersetzte Eigenuhr in `PowerupField`, HUD-Zeilen vom Canvas ins DOM) tragen die Kernaussage, dass KI-Ausgabe wie ein fremder Pull Request geprüft wird. Der Modell-Mix ist aus `ai/*.json` als Kreuztabelle Modell × `topic` ausgewertet und nur qualitativ beschrieben, weil die Zahlen laut Index-Konvention in Kap. 12 stehen; dort ist der generierte Teil allerdings veraltet (Stand 51 Prompts aus 9 Sitzungen, tatsächlich liegen 12 Sessiondateien vor) — `npm run docs:ki-verzeichnis` ist vor der Abgabe erneut zu laufen |
| 2026-08-13 | 1,5 | D-01 | Kapitel 07 „Tooling" und 08 „Qualität" von zusammen zehn `TODO`-Blöcken auf Entwurfsstand ausgeschrieben — damit sind beide Kapitel erstmals vollständig, obwohl vier ihrer Maßnahmen offen sind. Neu in Kap. 7: Package Management (zwei Paketmanager, `wasm-pack` als nicht versionierte Naht, die **gar nicht vorhandene** `dependencies`-Sektion des Frontends als Entscheidung mit ihrem Preis), Branch-Struktur, Dev Build (`--target web` gegen `--target bundler` begründet: Vite 5 versteht einen nackten `.wasm`-Import nicht von sich aus) und Production Build. Neu in Kap. 8: die Pipeline als Vier-Job-Entwurf mit Begründung der Reihenfolge, und Lighthouse als Vier-Kategorien-Tabelle statt als Verzicht in einem Satz. Fünf Angaben am Artefakt statt am Gedächtnis geprüft, drei davon mit Berichtsfolge: die gebaute `index.html` verweist **absolut** auf `/assets/…`, der Locale-Abruf dagegen relativ auf `./locales/` — die beiden Hälften derselben Seite verhalten sich unter einem Pages-Unterpfad also unterschiedlich, was den `base`-Fallstrick belegbar macht statt behauptet; das generierte Glue-Modul weicht bei falschem `.wasm`-MIME-Type auf `WebAssembly.instantiate` aus und schreibt eine **Warnung**, und `watchForBrowserProblems` sammelt nur `console.error` — die E2E-Suite bliebe bei dieser Fehlkonfiguration grün, was als Grenze notiert ist; `main` steht bei **einem** Commit gegen 102 auf `dev` und es existiert kein einziger Merge-Commit, der Branch trägt seine zugewiesene Rolle also derzeit nicht. Zwei Korrekturen an bestehendem Text: 8.6.1 verwies für den Frametime-Graphen auf „Kap. 8.1", beschrieben ist er in 3.2.1 — geändert; und die Kapitelvorrede von 8 nannte statische Analyse „für Stil und Typen", was ohne T-02 nicht stimmt. Eine geplante Aussage gestrichen statt geschönt: Der Entwurf zu 7.6 sollte einen konkreten Bridge-Signaturfehler als Beleg für den Nutzen von `checkJs` anführen; ein solcher Vorfall ist im Journal nicht dokumentiert und wurde durch das strukturelle Argument ersetzt (jeder Name ist an der `snake_case`→`camelCase`-Naht einmal je Seite handgeschrieben) |

## Entscheidungen

### 2026-08-13 — Die fehlenden Werkzeuge werden als begründete Negativbefunde ausgeschrieben, nicht nachgebaut

**Gewählt:** Kapitel 7 und 8 werden auf Entwurfsstand vollständig geschrieben, und die vier
Abschnitte, deren Maßnahme nicht gelandet ist, tragen die Absenz als eigene Aussage: 7.6
TypeScript (T-02), 7.10 Deployment (T-06), 8.3 CI/CD (T-05) und 8.5 Lighthouse (hängt an
T-06). Jeder nennt den Ist-Stand, die geplante Form, den Grund der Zurückstellung und den
Preis, den die Absenz bis dahin hat.

**Verworfen:** (1) T-02, T-05 und T-06 vor dem Kapitel umsetzen, damit die Abschnitte
positiv geschrieben werden können; (2) die Abschnitte als `TODO` stehen lassen und die
Kapitel auf `Gerüst` belassen; (3) die Punkte weglassen, weil das Projekt sie nicht erfüllt.

**Warum:** Die dritte Option verstößt gegen die Regel aus `bedingungen-referenz.md` §3 —
Vollständigkeit ist ausdrückliches Bewertungskriterium, und das Muster hat mit genau dieser
Ehrlichkeit (kein Formatter, kein Production Build, kein TypeScript) eine sehr gute Note
erhalten. Die zweite verschiebt die Arbeit an den Termin, an dem sie nicht mehr geht. Die
erste ist die verlockende: ≈11 h für drei Maßnahmen, und alle vier Abschnitte würden zu
gewöhnlicher Prosa. Sie scheidet aus, weil die Schreibphase seit dem 13.08. läuft und der
Code-Freeze am 24.08. liegt — Kapitel 09, 10 und 11 sind noch offen, und ein Bericht mit
lückenhaften Kapiteln und eingerichteter Pipeline wäre schlechter bewertet als der
umgekehrte Fall. Der Notausgang war im Journal am 29.07. bereits vorgesehen und wird hier
gezogen: „ein Werkzeug streichen und die Absenz begründen — drei ehrliche Sätze kosten
10 min statt 4 h Setup plus einer Seite Prosa."

**Konsequenz:** Die vier Abschnitte sind länger als drei Sätze, weil eine begründete Absenz
ihre Wirkung mitbeschreiben muss, um nicht als Ausrede zu lesen — 8.3 benennt deshalb, dass
alle Prüfungen einzeln existieren und nur die erzwingende Instanz fehlt, und dass eine
Pipeline über die Wiederholung hinaus vor allem den leeren Build prüft, den es hier nie gab.
Bleiben Kapazität und Reihenfolge: Sollte T-05 oder T-06 vor dem Freeze doch landen, sind die
Abschnitte umzuschreiben und nicht zu ergänzen, und die Statuszeile beider Kapitel sagt das.
→ Kap. 7, 8, 10

### 2026-08-13 — Der Puffer-Vertrag wird als „sieben Puffer" beschrieben, nicht als „Vier-Puffer-Vertrag"

**Gewählt:** Kapitel 5.2.1 nennt sieben Puffer in zwei Gruppen — vier index-alignierte mit
einem gemeinsamen Zähler, drei mit je eigener Anzahl — und benennt das Wachstum von vier auf
sieben ausdrücklich als Kehrseite.

**Verworfen:** die Formulierung aus `CLAUDE.md` §Invariante 2 und aus dem Kapitelgerüst
übernehmen („`FrameResponse` liefert vier flache Puffer"), die drei gezählten Puffer als
Nachtrag behandeln und den Anhangseintrag weiter „Vier-Puffer-Vertrag" nennen.

**Warum:** Die Vier-Puffer-Formulierung stammt aus S-02 und war bis S-07 richtig. Sie ist
heute nicht nur unvollständig, sondern verdeckt genau die Aussage, die das Kapitel zu machen
hat: Nicht die **Zahl** der Puffer ist die Zusicherung, sondern ihre **Form** — flache,
typisierte Arrays und Skalare, kein Objekt und keine Per-Entity-Struktur über der Grenze. Die
Form ist über drei Erweiterungen unverändert geblieben, die Zahl nicht. Ein Bericht, der die
alte Zahl druckt, während `response.rs` sieben Getter trägt, wäre außerdem an der einen
Stelle falsifizierbar, an der der Prüfer nachsieht.

**Konsequenz:** Die vollständige Aufstellung liegt als Tabelle in 11.1, weil sie mit sieben
Zeilen über der Auslagerungsschwelle liegt; im Fließtext bleibt die dreizeilige
`dash_phases`-Wertetabelle, weil sie das Muster zeigt und nicht den Bestand. Der
Gerüst-Hinweis in 11.3 ist mitgezogen. `CLAUDE.md` behält seine Formulierung vorerst — sie
steht dort im Abschnitt über die Invariante und nennt die drei gezählten Puffer im Absatz
darauf; eine Korrektur dort gehört in einen Commit am Regelwerk, nicht in einen am Bericht.

→ Kap. 5, 11

### 2026-08-13 — Die Allokationen pro Frame werden benannt, nicht ihre Abwesenheit behauptet

**Gewählt:** Abschnitt 4.6 Persistenz schreibt aus, was pro Frame tatsächlich alloziert
wird — der Snapshot-Klon des Boid-Vektors, sieben `Vec`-Klone beim Bau des `FrameResponse`
und die Kopie in die typisierten Arrays — und formuliert den Gewinn der
wiederverwendeten Puffer genau: Sie sparen das **Wachsen**, nicht das Kopieren.

**Verworfen:** (1) die Formulierung aus dem Kapitelgerüst und aus `CLAUDE.md` übernehmen,
„pro Frame wird nichts neu serialisiert oder alloziert"; (2) den Punkt weglassen und nur
die Pufferwiederverwendung beschreiben; (3) die kopierfreie Variante vor dem Schreiben des
Kapitels noch umsetzen, damit die stärkere Aussage stimmt.

**Warum:** (1) ist nachprüfbar falsch — `build_frame_response` endet auf sieben
`.clone()`, und der Snapshot ist eine ganze Vektorkopie. Eine Behauptung, die ein Prüfer
mit einem `grep` widerlegt, kostet mehr als der Sachverhalt, den sie schönt. (2) hätte
denselben Eindruck erzeugt, ohne die Aussage angreifbar zu machen, und wäre damit die
unehrlichere der beiden Varianten. (3) ist der Umbau, der die tragende Invariante des
Puffer-Vertrags gegen eine Lebenszeit-Zusage über den WASM-Speicher tauscht — für eine
Kopie, die nach der Messung aus 8.6 nicht der Engpass ist; drei Wochen vor der Abgabe ist
das die falsche Reihenfolge.

**Konsequenz:** Die Engine hat damit im Bericht einen offenen Posten mehr, und er ist in
10.1 Kapazitätsplan als solcher geführt statt als Versäumnis sichtbar zu werden. Die
Formulierung in `CLAUDE.md` bleibt vorerst stehen — sie ist eine Arbeitsanweisung („Hot-Path
minimiert Allokationen"), keine Messaussage, und das Kapitel zitiert sie nicht.
→ Kap. 4, 10

### 2026-08-13 — Die Eingabekette als Bausteinsicht, nicht der Renderer

**Gewählt:** Kapitel 3.2.2 zeigt `input/inputManager.js` + `input/controls.js` als die eine
ausführlich dargestellte Komponente — mit Mermaid-Diagramm, dem Latch, dem Tor
`_gameplayActive` und der Tabelle der drei verworfenen Alternativen.

**Verworfen:** (1) `renderer/canvasRenderer.js` mit seinen Zeichenebenen, das größte Paket des
Frontends; (2) `ui/menu.js` mit seinen vier Zulieferern, die meisten Dateien pro Zuständigkeit.

**Warum:** Beide Alternativen sind **größer**, aber keine trägt eine Entscheidung, die man
falsch treffen kann. Der Renderer ist eine Ebene je Motiv — die Aufteilung ist einleuchtend und
damit als Bausteinsicht langweilig; sein interessanter Teil ist Zeichenkostenoptimierung und
gehört nach 8.6. Die Eingabekette dagegen hat drei nachweisbar falsche Nachbarlösungen
(Listener-Reihenfolge als Architektur, nur Pfeiltasten freigeben, `keyup` an den Zustand
binden), von denen die dritte ein echter Fehler wäre, und ihr Zielkonflikt ist Barrierefreiheit
gegen Spielsteuerung — also genau die Art Abwägung, die eine Bausteinsicht sichtbar machen soll.
Dass dasselbe Thema in `optionGroup.js` als ARIA-Entscheidung ein zweites Mal auftaucht, macht
es zum Motiv des Kapitels statt zu einer Einzelheit.

**Konsequenz:** Der Renderer bleibt im Kapitel eine Aufzählung mit einem Satz zur Fassade. Das
ist vertretbar, weil das Frontend seine Tiefe damit an der Stelle bekommt, an der die
Katalogfolie „**eine** wesentliche Komponente" verlangt, und nicht an der mit den meisten
Zeilen. Die drei Reihenfolge-Fallen in `loop/simulationStep.js` sind aus demselben Grund in 3.8
gelandet: als Beleg, nicht als vierte Bausteinsicht.
→ Kap. 3

### 2026-08-13 — Versionen zweispaltig in den Anhang, Kapitel 2 bleibt versionsfrei

**Gewählt:** Kapitel 2.3 zeigt eine Fünf-Zeilen-Übersicht nach Schichten **ohne
Versionsangaben**; die Langfassung im Anhang trägt zwei getrennte Spalten — _Deklariert_
(der Bereich aus `Cargo.toml` / `package.json`) und _Aufgelöst_ (die gebaute Fassung aus
`Cargo.lock` / `package-lock.json`).

**Verworfen:** (1) den vollständigen Canvas samt Versionen in das Kapitel selbst nehmen,
wie es der Anforderungskatalog wörtlich nahelegt; (2) nur eine Versionsspalte führen, und
zwar die aufgelöste, weil sie die tatsächlich gebaute ist.

**Warum:** (1) sprengt bei über 20 Positionen das Seitenbudget von zwei Seiten, und die
Musterdokumentation macht es selbst umgekehrt — ihr Tech Canvas ist Tabelle 10 im Anhang,
das Kapitel bleibt bei einer Seite. (2) verschweigt die eigentliche Aussage: Deklariert ist
ein Bereich, nicht eine Version, und der Unterschied zwischen `^9.9.0` und dem gebauten
9.39.5 ist genau der Grund, warum die Lockfiles eingecheckt sind. Zwei Spalten zeigen
Absicht und Ist getrennt; eine Spalte müsste sich für eines von beiden entscheiden und
würde die Frage der Reproduzierbarkeit gar nicht stellen.

**Konsequenz:** Die aufgelösten Versionen sind ein Messwert wie jeder andere und veralten
entsprechend. Die Tabelle sagt darum ausdrücklich, dass sie beim Word-Zusammenbau erneut
aus den Lockfiles erzeugt und nicht aus sich selbst fortgeschrieben wird — dieselbe Regel,
unter der Kapitel 09 seine Zahlen führt. Sichtbar wird dadurch außerdem, was **nicht**
verwaltet ist: Rust-Toolchain und `wasm-pack` stehen in der Spalte _Aufgelöst_ als „lokales
CLI" und sind damit als Reproduzierbarkeitslücke im Canvas selbst zu sehen, nicht nur im
Fließtext.
→ Kap. 2, 11

### 2026-08-13 — Fokus-Thema mit seinem eigenen Zielkonflikt darstellen

**Gewählt:** Kapitel 1.4 nennt neben dem Leistungsziel des Fokus-Themas ausdrücklich das
gleichrangige Lesbarkeitsziel und benennt den Konflikt zwischen beiden, inklusive der
Entscheidung zu Gunsten der Lesbarkeit und der daraus folgenden Verzichte (`unsafe`,
manuelles SIMD, räumlicher Index statt quadratischer Nachbarschaftssuche). Die drei
gestrichenen Erweiterungen stehen mit **je eigener** Begründung schon in 1.2 statt erst im
Projektbericht.

**Verworfen:** (1) das Fokus-Thema als reines Performance-Argument schreiben und die
Lesbarkeitsvorgabe nur in Kapitel 4 als Codestil erwähnen; (2) alle Auslassungen sammeln
und ausschließlich in 10.1 als Kapazitätsfolge abhandeln.

**Warum:** (1) wäre angreifbar, weil die naive quadratische Suche im Code steht und ein
Prüfer sie findet — als unerklärter Widerspruch zum behaupteten Leistungsfokus liest sie
sich wie ein Versäumnis, als offengelegte Abwägung wie eine Entscheidung. (2) hätte drei
verschiedene Sachverhalte unter eine Ursache gezwungen: Slow-Time fällt aus einem
inhaltlichen Grund (es müsste die tragende Invariante aufweichen), der WebGL-Renderer aus
Kapazitätsgründen, der Server-Highscore wegen der Rahmenbedingung „serverlos" — er wäre
auch mit unbegrenzter Zeit nicht gebaut worden.

**Konsequenz:** Der Anforderungsteil trägt die Abgrenzung selbst, und Kapitel 10 muss nur
noch den einen Posten erklären, der wirklich an der Kapazität hängt. Der Zielkonflikt aus
1.4 ist zugleich der Anschluss für 8.6, wo die Regel „Optimierung nur gegen eine Messung"
belegt wird.
→ Kap. 1, 10

### 2026-08-11 — Unverwundbarkeit gehört der Runde, nicht den Einstellungen

**Gewählt:** Die Entwickleroption wird beim Öffnen der Runde **einmal** gelesen und als
Fahne `invulnerable` Teil von `roundData`; geprüft wird sie an genau einer Stelle, als
erster von drei Ausstiegen in `registerHit`.

**Verworfen:** (1) `registerHit` fragt pro Schritt die `MenuSettings`; (2) die Trefferzahlen
werden im Simulationsschritt gar nicht erst ausgelesen, wenn der Modus läuft; (3) der Modus
setzt `lastHitAtSimulationMs` dauerhaft in die Zukunft und nutzt damit die vorhandene
Gnadenfrist.

**Warum:** (1) hätte eine zweite Quelle der Wahrheit in den heißen Pfad gelegt, und ein
mitten in der Runde umgelegter Schalter ändert die Regeln eines laufenden Laufs — eine
Messung, deren Bedingungen sich währenddessen verschieben, ist keine. (2) färbt mehr als
gedacht: Treffer sind auch Eingabe für die Power-up-Absorption und für das rote Aufleuchten,
der Modus soll aber außer dem Lebensverlust nichts verändern. (3) hätte den Spieler die
ganze Runde über im Bernstein der Unverwundbarkeit blinken lassen, weil `renderState.js`
genau diesen Zeitstempel als Optik liest — die Messung wäre sichtbar geworden und hätte
zusätzlich Zeichenarbeit erzeugt, also genau das verfälscht, was sie messen soll.

**Konsequenz:** Der Modus ist eine Zeile im Runden-Zustand und eine Bedingung in der einen
Schadensfunktion, durch die jede Schadensquelle läuft — Hindernisse blocken und stoßen
weiter zurück, Aegis wird nicht verbraucht, Mend spawnt weiter und lehnt am vollen
Lebensstand ab. Eine unverlierbare Runde endet nur über die Pausenkarte, und die schreibt
bewusst keinen Rekord, also kann sie nicht in „Personal Best" landen. Testbar wurde das
Ganze nur durch den vorhandenen Todesfall-Flow: Stillstand kostet dort in unter fünf
Sekunden drei Leben, und eine Zusicherung darüber, dass etwas **nicht** passiert, ist nur
neben dem Beweis etwas wert, dass es sonst passieren würde.
→ Kap. 3, 8

### 2026-08-11 — Das Menü liest seine Optionen pro Render, statt sie einmal zu bekommen

**Gewählt:** `Menu.showStart` nimmt die Optionen als Funktion (`() => settings.toMenuOptions()`)
und ruft sie in `_render` auf.

**Verworfen:** (1) der Bestand, ein einmal übergebenes Objekt; (2) das Menü schreibt die
gewählten Werte zusätzlich in seine eigene Kopie zurück; (3) `MenuSettings` liefert Objekte
mit Gettern, die live auf die Felder zeigen.

**Warum:** Der Bestand war fehlerhaft, und zwar nicht erst durch die neue Option: jedes
Untermenü wird bei jedem Render aus dem Objekt neu gebaut, das Objekt hielt aber den Stand
vom Öffnen des Decks. 30 fps wählen, zurück und wieder hinein — die Gruppe zeigte wieder
die schnellste Stufe als gewählt, während der Loop längst mit 30 zeichnete. (2) hielte
denselben Wert an zwei Stellen und verlagert die Frage nur; (3) funktioniert, versteckt aber
Zustandsfluss hinter Getter-Syntax, was in einem Projekt für Rust- und JS-Einsteiger teurer
ist als ein sichtbarer Funktionsaufruf.

**Konsequenz:** Ein Fehler, den die drei bestehenden Optionen von Anfang an unauffällig
trugen, weil er nur die Anzeige betraf. Bei der Unverwundbarkeit wäre er die teurere Sorte gewesen — „Off" im Menü
bei einer Runde, die nicht verloren werden kann. Gefunden hat ihn der E2E-Test, der genau
diesen Weg geht (wählen, verlassen, wieder betreten), und er gilt jetzt für alle vier
Gruppen.
→ Kap. 3, 8

### 2026-08-11 — Testdateien in `__tests__/` statt neben dem Modul

**Gewählt:** Ein Ordner `__tests__/` in dem Ordner, dessen Module er prüft —
`src/loop/__tests__/frameScheduler.test.js` neben `src/loop/frameScheduler.js`.

**Verworfen:** (1) der bisherige Zustand, Test direkt neben dem Modul, als Spiegel der
Rust-Konvention `#[cfg(test)]`; (2) ein schlichter Ordnername `tests/`; (3) ein gespiegelter
Baum `frontend/tests/loop/…` außerhalb von `src/`.

**Warum:** Die Rust-Analogie trägt weniger weit, als sie aussieht: ein `#[cfg(test)]`-Modul
ist ein Block **in** der Datei und kostet die Verzeichnisansicht nichts, während jede
`*.test.js` dort ein eigener Eintrag ist — in `renderer/` standen 15 Tests neben 20 Modulen,
in `loop/` fünf neben fünf. Ein gespiegelter Baum außerhalb von `src/` löst das, kostet aber
die Nähe: der Test wäre nicht mehr im Blickfeld, wenn man das Modul öffnet, und jeder Import
liefe über mehrere Ebenen. `__tests__/` ist die Konvention, die Vitest und Jest ohnehin
kennen, was den Namen für Außenstehende erklärt, ohne ihn zu dokumentieren; `tests/` wäre
lesbarer, kollidiert aber optisch mit `engine/tests/`, das etwas anderes bezeichnet (die
WASM-Grenztests, die nur unter `wasm-pack` laufen).

**Konsequenz:** Jeder Test importiert sein Modul eine Ebene höher (`../frameScheduler.js`),
die 400-Zeilen-Grenze gilt unverändert, und die Regel ist nur solange verlässlich, wie
`include` sie erzwingt — deshalb der engere Glob statt des weiterhin funktionierenden
`src/**/*.test.js`. Eine versehentlich lose abgelegte Datei fällt jetzt dadurch auf, dass
ihre Zusicherungen in der Gesamtzahl fehlen.
→ Kap. 7, 8

### 2026-08-11 — `simulation/` bekommt Themenordner mit Fassaden-`mod.rs`

**Gewählt:** Die 22 flachen Dateien in `engine/src/simulation/` werden zu vier Einzeldateien
(`boid.rs`, `physics.rs`, `overlap.rs`, `flock.rs`) und vier Ordnern (`steering/`, `dash/`,
`obstacle/`, `wave/`). Jeder Ordner hat ein `mod.rs`, das seine Untermodule deklariert **und**
genau die Namen re-exportiert, die von außerhalb des Ordners benutzt werden. Die
Namenspräfixe entfallen dabei: `obstacle_bounce.rs` wird `obstacle/bounce.rs`.

**Verworfen:** (a) alles flach lassen und nur `mod.rs` kommentieren; (b) einen fünften Ordner
`core/` für `boid.rs`, `physics.rs`, `overlap.rs`; (c) Ordner ohne Fassade, jeder Aufrufer
schreibt den vollen Pfad `obstacle::shape::Obstacle`; (d) den Wellen-Ordner `spawn/` nennen,
wie zunächst vorgesehen.

**Warum:** (a) Die Cluster existieren bereits — neun Dateien beginnen mit `obstacle_`, vier mit
`dash`, drei gehören zur Welle —, sie stehen nur im Dateinamen statt im Dateisystem, und ein
Kommentar in `mod.rs` verhindert nicht, dass die nächste Datei wieder flach danebengelegt wird.
(b) `boid.rs` wird von zehn Modulen benutzt und `flock.rs` ruft in jeden Ordner hinein; beide
tiefer zu legen macht den Pfad länger, ohne etwas zu trennen — der Kern ist genau das, was
keinem System gehört. (c) ist der eigentliche Grund, dass der Umbau klein blieb: mit Fassade
lösen sich `use super::obstacle::Obstacle`, `use super::dash::is_dashing` und
`use super::steering::{...}` unverändert auf, weshalb `boid.rs`, `overlap.rs` und weite Teile
von `flock.rs` gar nicht angefasst werden mussten. Das Muster ist außerdem nicht neu: `dash.rs`
trug seit seiner Entstehung ein `pub use super::dash_properties::{...}` mit derselben
Begründung im Kommentar — die Ordner verallgemeinern es nur. (d) hätte `spawn::queue` neben
`obstacle::spawn` gestellt, also zwei verschiedene „Spawns" nebeneinander; `wave` ist zudem das
Wort, das die Domäne ohnehin führt (`set_wave`, `WAVE_SPAWN_WARNING_STEPS`).

**Konsequenz:** Eine Regel für `use`-Zeilen, an der der Umbau hängt: innerhalb eines Ordners
`use super::geschwister`, über eine Ordnergrenze hinweg immer der absolute Pfad
`use crate::simulation::…`; `super::super` steht nirgends. Innerhalb eines `#[cfg(test)]`-Moduls
zeigt `super` auf die **Datei**, nicht auf den Ordner — die Testmodule benutzen deshalb
durchgängig den absoluten Pfad, was sie ohnehin schon taten. In die Fassade kommt nur, was
produktiv über die Ordnergrenze geht: `dash_distance` und `begin_arming` sind bewusst draußen
geblieben, weil ihre einzigen ordnerfremden Aufrufer Tests sind und ein Re-Export, den niemand
liest, eine Zusage ist, die niemand prüft — `cargo clippy -- -D warnings` meldet beides
zuverlässig. Außerhalb von `simulation/` waren genau drei Dateien betroffen
(`wasm_bridge/mod.rs`, `boid_factory.rs`, `frame_buffers.rs`); die vier Testdateien unter
`engine/tests/` kennen nur `GameEngine` und blieben unberührt, ebenso das gesamte Frontend —
die WASM-Schnittstelle ändert sich nicht um ein Byte. Kein Dateiinhalt wurde verändert,
gekürzt oder gesplittet; die Lib-Testzahl war vor und nach jedem der vier Commits identisch,
was die eigentliche Zusicherung dieses Umbaus ist. Offen und bewusst nicht mitgemacht: die
Sichtbarkeiten sind weiterhin durchgängig `pub`, obwohl vieles nur ordnerintern gebraucht wird.
→ Kap. 4

### 2026-08-04 — Aegis kauft ein Fenster, nicht einen Treffer

**Gewählt:** Ein absorbierter Treffer bricht den Schild **und** startet
`AEGIS_ABSORB_INVULNERABILITY_MS` = 1000 ms, in denen `absorbHit` jeden weiteren Treffer
kostenlos macht. Der Zeitstempel liegt in `PowerupField`, nicht in `roundData`.

**Verworfen:** (a) die Festlegung vom 2026-08-01 beibehalten — genau ein Treffer, danach
ungeschützt; (b) das Fenster über `roundData.lastHitAtSimulationMs` fahren, also den Schild
doch als vorgezogene Gnadenfrist implementieren, wie das Designsystem es ursprünglich
vorschlug; (c) `HIT_COOLDOWN_MS` = 900 ms wiederverwenden statt einer eigenen Zahl.

**Warum:** (a) ist die Rücknahme, um die es hier geht. Die alte Begründung — ein Schild endet
mit dem Treffer, den er frisst — gilt weiter und ist unangetastet; falsch war der Schluss,
dass damit auch der **Schutz** endet. Bei ~150 Boids in der späten Runde ist „ein Treffer"
keine Einheit, in der das Spiel Schaden austeilt: eine Passage durch eine Formation setzt
mehrere Treffer innerhalb weniger Schritte, also war der Unterschied zwischen „Schild dabei"
und „Schild nicht dabei" für genau diesen Zug null — und Hineingehen ist die Fähigkeit, die
Aegis laut Spec §1 belohnen soll. (b) hätte den Trichter verletzt: `lastHitAtSimulationMs`
gehört dem verlorenen Leben, ein absorbierter Treffer hat keines gekostet, und ein Power-up,
das in die Rundendaten schreibt, wäre das erste. (c) hätte die Fähigkeit an eine Konstante
gehängt, die einem anderen Zweck dient — eine Nachstimmung der Gnadenfrist hätte Aegis
stillschweigend mitverändert.

**Konsequenz:** Der Schild hält jetzt zwei Zeitstempel statt einem, und das Fenster ist die
einzige Nachwirkung im Feature, die Spielwirkung hat — Shatter, Mend-Bogen und Inertheit sind
reine Darstellung. Sichtbar wird es ohne neue Optik: `playerInvulnerable` im renderState wird
aus der Gnadenfrist **und** dem Fenster verodert, weil der amberfarbene Spieler das bestehende
Wort des Spiels für „unantastbar" ist. Ein während des Fensters aufgesammelter Schild bleibt
voll geladen, aus demselben Grund, aus dem er die Gnadenfrist übersteht.

→ Kap. 4, 8

### 2026-08-04 — Die Vorwarnlinie kommt aus der Engine, nicht aus dem Renderer

Die Linie braucht zwei Angaben: eine Richtung (auf den Spieler) und eine Länge (`dash_speed ×
dash_steps`). Beide sind im Frontend grundsätzlich beschaffbar — die Spielerposition liegt dort,
und die Reichweite ist eine Rechnung aus zwei Tuning-Werten. Drei Wege dahin:

- **Gewählt:** ein Buffer `dash_aims` aus der Engine, gefüllt aus `dash_aim_end`, also aus
  **derselben** Funktion, mit der `launch_dash` die Absprungrichtung schreibt.
- **Verworfen:** `normalize(player − boid)` im Renderer, mit den Reichweiten je Stufe als Tabelle
  in `gameConfig.js`. Kostet keinen Buffer und keine Grenzüberschreitung, spiegelt aber zwei
  Regeln, deren Original in der Engine steht.
- **Verworfen:** ein einmaliger `#[wasm_bindgen]`-Getter `dash_range_for_tier`, beim Start
  ausgelesen und im Frontend zwischengespeichert, Richtung weiter im Renderer. Beseitigt die
  Tabellenkopie, nicht die Richtungskopie.

Der Grund ist der Zweck der Linie: sie ist ein **Versprechen über künftiges Verhalten der
Simulation**, und ihr ganzer Wert liegt darin, dass sie stimmt. Eine gespiegelte Aimregel stimmt
genau so lange, bis jemand die Aimregel ändert — und die naheliegendste künftige Änderung ist
gerade dort, nämlich Vorhalten auf die Spielerbewegung. Danach zeigte die Linie weiter dorthin, wo
der Dash früher hinging, und wäre schlimmer als keine Linie: der Spieler weicht in den Treffer aus.
Ein Test kann das nicht auffangen, weil beide Seiten dann in sich schlüssig sind.

Das ist ausdrücklich die Gegenrichtung zur Entscheidung über die Spawn-Stufe weiter unten, und die
Unterscheidung ist tragfähig: die Stufe ist eine reine Funktion der Wellennummer, die das Frontend
selbst führt. Die Aimlinie ist eine Funktion von **Simulationszustand** — Boidposition,
Spielerposition nach der Hindernisauflösung, Dash-Tuning je Boid. Was Zustand ist, geht über die
Grenze; was eine Rechnung auf einer Zahl ist, die der Empfänger schon hat, nicht.

Der Preis ist ein weiterer Buffer und eine dritte Stride-Handkopie. Beides ist bewusst klein gehalten:
eigene Anzahl statt 156 überwiegend leerer Einträge, und die Stride wird von den Grenztests
festgenagelt, was der Sinn der Kopie ist.

→ Kap. 5

### 2026-08-04 — Die Linie zielt mit, statt beim Ladebeginn einzufrieren

Die Engine wählt die Dash-Richtung erst im Absprungschritt (`launch_dash`); während der Aufladung
existiert keine Richtung, die man zeichnen könnte. Zwei Wege dahin:

- **Gewählt:** die Linie zeigt in jedem Bild, wohin der Dash _jetzt_ ginge. Sie dreht also mit,
  solange geladen wird, und die Engine bleibt unangetastet.
- **Verworfen:** die Richtung schon in `begin_dash_charge` festlegen und auf dem Boid einfrieren.
  Die Linie wäre damit ein Versprechen — sichtbar attraktiver, weil sie ruhig steht.

Die verworfene Variante ist keine Darstellungsfrage, sondern eine Balanceänderung, und zwar eine
harte: bei 0,57–0,73 s Vorwarnung, 222–277 px Reichweite und einer Spielergeschwindigkeit von
6 px/Schritt (also ~250 px in der Vorwarnzeit) entkäme jeder bewegte Spieler jedem Dash, indem er
einfach weiterläuft. Der Boid-Dash ist aber genau das Gegenteil eines ausweichbaren Rituals: er
soll einen **stehenden** Spieler treffen und einen bewegten ~30 px Seitversatz kosten (§3).

Was die mitziehende Linie lesbar macht, ist deshalb nicht die Fluchtrichtung, sondern die
**Reichweite**: endet die Linie vor dem Spieler, kommt dieser Boid von dort nicht an; läuft sie
über ihn hinaus, kommt er an. Das ist die Information, die vorher fehlte — und sie bleibt wahr,
während sie mitdreht.

Nebenwirkung, bewusst in Kauf genommen: bei einem Sechser-Verband laufen sechs Linien auf dem
Spieler zusammen. Deshalb Haarlinie und Strichmuster statt durchgezogener Striche — sechs volle
rote Linien lesen sich als Käfig statt als Warnung.

→ Kap. 3, 5

### 2026-08-04 — Die Spawn-Stufe wird im Frontend abgeleitet, nicht über die Grenze getragen

Der neue HUD-Wert braucht die Antwort auf `difficulty_tier_for_wave(wave)` — eine Subtraktion und
eine Klemmung, die in `wasm_bridge/boid_factory.rs` steht. Drei Wege dahin:

- **Gewählt:** `round/waveTier.js` leitet die Stufe im Frontend aus der Wellennummer ab, die das
  Frontend ohnehin selbst führt (`round/roundData.js` zählt sie, `simulationStep.js` kündigt sie an).
  Die Engine wird nicht gefragt, weil sie nichts weiß, was hier fehlt.
- **Verworfen:** ein achter Wert in `FrameResponse`. Der Buffer-Vertrag soll minimal bleiben, und
  dieser Wert wäre der erste, der pro Bild eine Zahl transportiert, die der Empfänger schon hat.
- **Verworfen:** ein zusätzlicher `#[wasm_bindgen]`-Getter außerhalb der Bildantwort. Billiger als ein
  Buffer, aber dieselbe Sache: eine Grenzüberschreitung für eine Rechnung ohne Zustand.

Der Preis ist die Doppelführung von `MAX_BOID_DIFFICULTY_TIER` (4) in `gameConfig.js` — die zweite
Handkopie im Projekt nach `INITIAL_BOID_COUNT`, mit demselben Kommentar an beiden Stellen. Sie ist
billiger als ihre Alternative, weil sie an einer Stelle festgenagelt ist, die auffällt, wenn sie
falsch wird: `waveTier.test.js` prüft `BOID_COLORS.length === MAX_BOID_DIFFICULTY_TIER + 1`. Damit
schlägt ein Auseinanderlaufen von Rampe und Palette als Test fehl und nicht als
`undefined`-Farbe im HUD — was der eigentliche Grund für den Test ist, denn genau diese Klemmung
erlaubt dem HUD den Palettenzugriff ohne zweite Bereichsprüfung.

Verallgemeinerbar, und die Gegenrichtung zur Entscheidung vom 2026-08-03 (`build_boid` als
gemeinsame Quelle für erste Flock und Tore): Über die Sprachgrenze gehört, was **Zustand** ist —
Positionen, Geschwindigkeiten, Dash-Phasen. Eine reine Funktion einer Zahl, die beide Seiten
kennen, gehört auf die Seite, die sie braucht. Die Grenze wird durch das eng gehalten, was **nicht**
darüber geht.

→ Kap. 4, 5

### 2026-08-04 — Der Restzeit-Bogen wird eine Funktion mit drei Aufrufern

Der Marker-Ring sollte „genauso aussehen" wie der Bogen am Spieler. Drei Wege dahin:

- **Gewählt:** `drawTimeArc` in ein eigenes Blattmodul `renderer/timeArc.js`, aufgerufen von
  `powerupLayer.js` (Spieler) und `powerupMarkerLayer.js` (Boden).
- **Verworfen:** den Bogen in `powerupLayer.js` lassen und von `powerupMarkerLayer.js` importieren.
  `powerupLayer.js` bezieht Hexagon, Farben und Strichbreite bereits von dort — das wäre ein
  Importzyklus. ESLint hätte ihn nicht gemeldet (kein `import`-Plugin konfiguriert), er wäre also
  nur unlesbar gewesen, nicht auffällig.
- **Verworfen:** eine zweite Zeichenfunktion am Marker mit denselben Zahlen. Das ist der Fall, der
  in sechs Monaten auseinanderläuft, und die Vorgabe war ausdrücklich „genauso".

Der Preis der gewählten Variante ist **eine** doppelte Zahl: `TIME_ARC_WIDTH` = 2 steht neben
`STROKE_WIDTH` = 2, weil das Modul sonst wieder in `powerupMarkerLayer.js` hineingreifen müsste und
der Zyklus zurückkäme. Beide Stellen tragen den Kommentar dazu.

Die Nebenwirkung ist der eigentliche Gewinn: der Bogen las seine Wanduhr intern aus
`performance.now()`. Das ist eine versteckte globale Eingabe und der Grund, warum er auf **keiner**
Teststufe abgedeckt war — weder als Unit-Test (nicht ansteuerbar) noch als E2E-Test (Playwright
zählt keine Canvas-Pixel, siehe Kap. 8.2). Als Parameter hereingegeben sind `timeArcSweep` und
`timeArcAlpha` gewöhnliche Funktionen, und das Blinken ist mit sieben Zusicherungen belegt.

Verallgemeinerbar: Wenn zwei Stellen „gleich aussehen sollen", ist die Zusicherung eine gemeinsame
Funktion und nicht eine gemeinsame Konstante. Konstanten halten Zahlen zusammen, Funktionen halten
auch die Reihenfolge und die Verzweigungen zusammen — und der Startwinkel, die Laufrichtung und die
Blinkschwelle sind hier zusammen mehr als ihre Zahlen.

→ Kap. 4, 8

### 2026-08-04 — Zwei Schwellen für eine Geometrie: Hysterese am Markerspawn

Ein Marker wird mit `MIN_OBSTACLE_CLEARANCE` = 70 px platziert. Für die Rücknahme eines verdeckten
Markers wäre dieselbe Schwelle naheliegend gewesen — dieselbe Funktion, dieselbe Zahl.

**Gewählt:** `isTooCloseToAnObstacle` bekommt einen optionalen Abstandsparameter; die Rücknahme
fragt mit `PICKUP_RADIUS` = 27, also erst, wenn die Kapsel die gezeichnete Glyphe erreicht.

**Verworfen: beide Richtungen mit 70 px.** Dann löscht jedes Hindernis, das irgendwo im
Platzierungsradius entsteht, einen Marker, der bequem erreichbar ist und keinerlei Problem
darstellt. Da 70 px die Zahl ist, die einen Marker _komfortabel_ erreichbar hält, hätte die
Behandlung mehr Marker gekostet als der Fehler — mit demselben Ergebnis für den Spieler
(„der Marker war plötzlich weg"), nur häufiger.

**Verworfen: eine zweite Funktion.** Die Geometrie ist identisch, nur die Schwelle unterscheidet
sich. Zwei Funktionen mit derselben Rechnung wären die Duplikation, die als erstes auseinanderläuft.

Der Punkt ist, dass die beiden Zahlen **verschiedene Fragen** beantworten: 70 px ist „ist das ein
guter Platz", 27 px ist „ist dieser Platz jetzt unhaltbar". Das ist keine Ungenauigkeit, sondern
Hysterese — leicht liegen zu lassen, schwer wegzuwerfen — und ein Kommentar an der Funktion sagt
das, damit die Lücke nicht später als Inkonsistenz „aufgeräumt" wird.

Zweite Festlegung im selben Zug: Die Rücknahme kürzt `expiresAtMs` **nicht**. Sonst spränge der
neue Restzeitring in einem Bild von seinem Stand auf fast null — ein Countdown, der springt, ist
keiner. Das Gehen trägt allein die Skalierung, der Ring bleibt bei der Wahrheit über die
Lebensdauer. Zwei Zustände, zwei Träger, statt einer Zahl mit zwei Bedeutungen.

→ Kap. 4, 8

### 2026-08-04 — Gegenlenken statt höherer Beschleunigung

Gemeldet war „sehr viel Momentum, bremst langsam, Probleme mit schnellen Richtungswechseln". Die
naheliegende Antwort — `PLAYER_ACCELERATION` und `PLAYER_DECELERATION` anheben — wurde verworfen,
weil sie den dritten Teil der Meldung nicht trifft.

Der Grund liegt im Modell, nicht in den Zahlen: gebremst wurde **nur, wenn keine Taste gedrückt
war**. Solange eine Richtung gehalten wurde, wirkte gegen die vorhandene Geschwindigkeit
ausschließlich die Beschleunigung in die neue Richtung. Für eine 180°-Wende heißt das
`2 · v_max / a` = 0,6 s. Für eine 90°-Wende heißt es **gar nichts**: die querlaufende Komponente
wurde von keiner Kraft angefasst, sie verschwand nur, weil die radiale Kappe die Gesamtsumme
begrenzt und dabei umverteilt. Gemessen 1,63 s, bis sie auf 1 % abgebaut war — das ist das
Rutschgefühl, und keine Erhöhung von `a` hätte es beseitigt, weil Beschleunigung nur addieren kann.

**Gewählt:** `_steer` zerlegt die Geschwindigkeit in den Anteil in Blickrichtung und den Rest
(`along = v · d`, `lateral = v - d·along`; `d` ist normiert, deshalb ist die Projektion exakt) und
bremst den Rest mit einer eigenen, höheren Rate `PLAYER_TURN_DECELERATION` = 3600. Auf der
`along`-Achse wird **entweder** gebremst **oder** beschleunigt, nie beides — „erst aufhören, in die
falsche Richtung zu fahren" ist eine Regel, die in einen Satz passt.

Gemessen danach: 90° 0,10 s, 180° 0,28 s. Die beiden Konstanten wurden zusätzlich angehoben
(1200 → 2000, 1500 → 2600), aber sie sind das Beiwerk.

`PLAYER_MAX_SPEED` (360) und `PLAYER_DASH_SPEED` (1100) blieben **unangetastet**, und das war die
zweite Entscheidung: an ihnen hängen die Tunnel-Invariante gegen `MINIMUM_OBSTACLE_RADIUS` (ein
Dash legt pro Schritt ~18 px zurück), `OVERDRIVE_FACTOR` und das in `trailSampling.test.js`
eingebackene Verhältnis der Schweif-Schwelle. Nichts ist schneller geworden, es ist nur leichter zu
richten — was die Meldung auch verlangte.

Bewusst behaltene Nebenwirkung: Der Querbremse fällt auch der Dash-Überschuss zum Opfer, ein Dash
ist damit lenkbar bzw. abbrechbar. Geradeaus gehalten ändert sich nichts, weshalb der
Reichweitentest unverändert grün blieb.

Die Lehre betrifft die Diagnose: Zwei der drei Symptome („viel Momentum", „bremst langsam") zeigen
auf Konstanten, das dritte („Richtungswechsel") auf das Modell. Wer nur die ersten beiden hört,
dreht an Zahlen und liefert eine Verbesserung, die das eigentliche Ärgernis unberührt lässt.

**Nachtrag vom selben Tag, nach dem Spieltest:** Die Rate war zu hoch gewählt. 3600 räumt eine
querlaufende Höchstgeschwindigkeit in 0,1 s ab, also in sechs Simulationsschritten und drei
gezeichneten Bildern — eine Kurve kostete damit nichts mehr, und der Charakter hatte kein Gewicht
mehr, gegen das man lenkt. Zurückgedreht auf `PLAYER_TURN_DECELERATION` = 2200 (90° in 0,17 s),
`PLAYER_ACCELERATION` = 1600 und `PLAYER_DECELERATION` = 2000; alle drei liegen jetzt bewusst
zwischen dem Zustand vor dem Umbau und der ersten Fassung.

Das bestätigt die Entscheidung eher, als es sie zurücknimmt: Beide Fassungen unterscheiden sich nur
in drei Zahlen, weil die Trägheit einer Kurve seit dem Umbau **eine eigene Konstante** ist. Im alten
Modell wäre dieselbe Nachstimmung nicht möglich gewesen — dort war das Kurvenverhalten eine
Nebenwirkung der radialen Kappe und ließ sich überhaupt nicht einstellen, in keine Richtung. Eine
Größe, die man zu hoch wählen kann, ist eine, die man überhaupt wählen kann. Was fehlte, war der
Spieltest zwischen Umsetzung und Commit: Die Zahl wurde aus den Zeiten hergeleitet, die sie
erzeugt, und 0,1 s liest sich in einer Rechnung schneller als es sich anfühlt.

**Zweiter Nachtrag, 2026-08-06 — die Entscheidung wird zurückgenommen.** Auf ausdrücklichen Wunsch
ist der Stand vor beiden Fassungen wiederhergestellt: `_steer` und `PLAYER_TURN_DECELERATION`
entfallen ersatzlos, `PLAYER_ACCELERATION` steht wieder auf 1200 und `PLAYER_DECELERATION` auf 1500.
Gemessen mit demselben Treiber wie am 2026-08-04, und exakt auf die Ausgangswerte zurück: 90°-Wende
1,633 s, 180°-Wende 0,600 s, Anfahren 0,300 s, Anhalten 0,250 s. Das ist die Gegenprobe, dass der
Rückbau vollständig ist und nicht ein dritter Zustand.

Damit ist auch die Diagnose von oben nicht falsch, sondern nur nicht mehr maßgeblich: Der Befund,
dass eine 90°-Wende im alten Modell von **keiner** Kraft bearbeitet wird, gilt unverändert; was sich
geändert hat, ist die Bewertung — dieses Rutschen ist erwünscht und nicht der Mangel, als der es
gemeldet wurde. Das ist eine Geschmacksfrage, und eine Geschmacksfrage entscheidet die
Projektleitung, nicht die Messung. Die Messung liefert nur, was sie kostet.

Was bleibt, ist der Preis der Rücknahme, und er ist bewusst in Kauf genommen: Ohne eigene Konstante
ist das Kurvenverhalten wieder eine **Nebenwirkung** der radialen Kappe und damit überhaupt nicht
mehr einstellbar — genau der Punkt, den der erste Nachtrag als eigentlichen Gewinn des Umbaus
festgehalten hat. Eine erneute Nachstimmung wäre kein Ändern von drei Zahlen mehr, sondern das
Wiedereinführen des Modells. `playerSteering.test.js` bleibt deshalb bestehen und wechselt die
Richtung: Die Zusicherungen halten jetzt fest, dass eine Wende teuer ist (180° dauert das Doppelte
des Anfahrens, 90° noch länger, und der erste Schritt einer Wende nimmt weniger als 5 % der
Querkomponente), damit dieses Gewicht bei der nächsten Änderung eine bewusste Entscheidung ist und
kein Versehen.

→ Kap. 4, 10

### 2026-08-04 — Mend ist ein Ereignis, kein dritter Buff

**Gewählt:** Aegis und Overdrive sind Zustände und bekommen deshalb je einen Restzeitbogen
am Spieler und eine HUD-Zeile. Mend bekommt **beides nicht**: es wirkt im Moment der
Aufnahme und ist danach vorbei. Sein Zustand besteht aus einem Zeitstempel für die
Darstellung; in `_buffs` landet es nie. Die Rückmeldung ist entsprechend ausschließlich
der Moment — Einsammelring, ein weiß aufblitzendes Lebenssegment und ein grüner Bogen, der
**einmal gegen** den Uhrzeigersinn läuft, während jeder Restzeitbogen im Spiel sich im
Uhrzeigersinn leert.

**Verworfen:**

| Alternative                                                   | Grund der Ablehnung                                                                                                                                                                                                                               |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Eine dritte HUD-Zeile analog zu den beiden anderen            | Sie hätte keinen Füllstand, den sie anzeigen könnte. Eine Zeile, die nach 450 ms wieder verschwindet, ist eine Animation im HUD und nicht eine Anzeige — und das Ergebnis steht bereits im Lebensbalken, den es seit S-03 gibt.                   |
| Mend als kurzen Buff mit Dauer modellieren, um es einzureihen | Das hätte die Datenstruktur vereinheitlicht und die Aussage verfälscht: ein Buff, dessen Ablauf nichts beendet, lädt jeden späteren Leser dazu ein, ihm doch eine Wirkung über die Zeit zu geben. Die Uneinheitlichkeit ist hier die Information. |
| Ein Herz oder Kreuz als Glyph                                 | Ein zweites Symbol für etwas, für das das Spiel schon eines hat. Der Glyph ist deshalb der Lebensbalken selbst: drei Balken, der oberste nur angedeutet — die Lücke ist das Icon.                                                                 |
| Grün als neue Power-up-Farbe einführen                        | Grün ist laut §1 des Design-Systems bereits die Farbe des Lebens. Mend erweitert die Rolle nicht, es benutzt sie; damit kommt das dritte Power-up ohne eine vierte Farbe aus.                                                                     |
| Mend zusätzlich mit Unverwundbarkeit ausstatten               | Überlappt mit Aegis. Zwei Power-ups mit derselben Wirkung sind eines zu viel, und das Heilmittel würde das Schild zum schlechteren Fund machen.                                                                                                   |
| Volle Heilung statt eines Segments                            | Macht die Runde bis dahin bedeutungslos. Ein Segment ist eine Verlängerung, keine Rücksetzung — bei drei Startleben trotzdem ein Drittel der Gesamtressource.                                                                                     |

**Warum:** Die Unterscheidung Zustand/Ereignis ist die verallgemeinerbare Hälfte dieser
Umsetzung und steht als Regel in der Spec: **Zustand → Bogen + HUD-Zeile, Ereignis → nur
der Moment, nichts dazwischen.** Wer ein viertes Power-up entwirft, entscheidet zuerst
diese Frage und nicht die nach dem Symbol. Die Laufrichtung des Bogens trägt dabei die
eigentliche Aussage: die Umkehrung gegen alle anderen Bögen sagt „etwas wurde
hinzugefügt" statt „etwas läuft ab". Wer die beiden verwechselt, hat die Laufrichtung
verloren und nicht die Farbe — die Diagnose beginnt also dort.

**Konsequenz:** `PowerupField` schreibt keinen Lebenszähler, es liest ihn; die Gutschrift
liegt in `roundData.restoreLives` und damit im selben Modul wie der Abzug. Weil Mend
Leben kennen muss und sonst nichts im Power-up-Thema es kennt, liegt genau diese
Abhängigkeit gesammelt in `powerups/mend.js` — ein Grund, der in einem Satz steht, kann
auch in einer Datei stehen. Die Heilung wird im Simulationsschritt **vor** der
Trefferauswertung verrechnet, damit Heilung und Treffer im selben Schritt sich in der
Reihenfolge ihres Eintretens verrechnen und nicht gegenseitig verschlucken. Weil beide
betroffenen Zeichendateien am 400-Zeilen-Limit standen, wurde die Zeichenseite entlang der
Naht geteilt, die §11 des Design-Systems ohnehin zieht: `powerupMarkerLayer.js` für was am
Boden liegt, `powerupLayer.js` für was auf dem Spieler reitet.
→ Kap. 5, 7

### 2026-08-04 — Ein unbrauchbarer Mend-Marker wird grau, statt zu verschwinden

**Gewählt:** Bei voller Gesundheit **spawnt** Mend nicht — die Reihenfolge überspringt es.
Wird die Gesundheit voll, **während** ein Marker schon liegt, bleibt er liegen und wird über
`INERT_FADE_MS` = 300 ms inert: Kontur und Glyph driften nach Slate, Glow und Rotation gehen
aus, der Hub bleibt. Aufsammeln ist dann nicht möglich, man läuft hindurch; sinkt die
Gesundheit, kommt er auf demselben Weg zurück. Der Fortschritt dieser Blende läuft pro
Simulationsschritt, nicht pro Bild.

**Verworfen:**

| Alternative                                                | Grund der Ablehnung                                                                                                                                                                                                          |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Den Marker bei voller Gesundheit entfernen                 | Er verschwindet dann vor den Augen des Spielers, und zwar genau in dem Moment, in dem dieser etwas Gutes getan hat. Das wirkt gestohlen; ein Marker, der grau wird, erklärt sich selbst und bleibt als Wegmarke erhalten.    |
| Ihn unverändert liegen lassen und nur nicht aufsammeln     | Ein Marker, der voll leuchtet und rotiert, verspricht etwas. Ihn wortlos nicht einzusammeln liest sich als Fehler des Spiels, nicht als Regel.                                                                               |
| Ihn trotzdem einsammelbar machen und die Wirkung verpuffen | Ein verbrauchter Fund ohne Wirkung ist die schlechteste der drei Varianten: er kostet den Weg dorthin und gibt nichts, und der Spieler erfährt den Grund nie.                                                                |
| Hart umschalten statt über 300 ms zu blenden               | Ein Marker, der zwischen zwei Bildern die Farbe wechselt, wird als **anderer** Marker gelesen und nicht als derselbe, der leise wird. Drei Zehntelsekunden sind lang genug für die Bewegung und kurz genug für eine Antwort. |
| Mend am Ende der Spawn-Reihenfolge einsortieren            | Dann kann es zweimal hintereinander an der Reihe sein, sobald der Zyklus umläuft. Zwei Treffer in Folge kosten damit nichts mehr, und ein Survival-Runner, in dem Treffer nichts kosten, hat sein Thema verloren.            |

**Warum:** Ein Heil-Power-up ist das erste im Spiel, dessen Wert vom Spielstand abhängt —
es ist damit auch das erste, das ein _toter Fund_ sein kann. Die drei Regeln greifen an drei
verschiedenen Zeitpunkten: die Spawn-Regel, bevor es entsteht, die Inertheit, während es
liegt, und die Aufsammelregel im Moment des Kontakts. Alle drei prüfen dieselbe Bedingung
(`canMend()`), was der Grund ist, dass sie nicht auseinanderlaufen können.

**Konsequenz:** Die Blende ist Darstellung, ihr Fortschritt hängt aber an der
Simulationsuhr — sonst driftet ein grau werdender Marker mit der Bildrate, und ein
144-Hz-Spieler sieht eine andere Übergangszeit als ein 60-Hz-Spieler. Damit gilt die
Entscheidung vom 30.07. („Präsentationsanimationen laufen auf Wall Time") hier bewusst
nicht: Rotation und Hub des Markers laufen weiter auf Wall Time, die Blende nicht, weil ihr
Auslöser ein Spielereignis ist und keine Uhr. Die Farbmischung selbst ist auf Sechstel
gerastert und gecacht, weil ein inerter Marker in jedem Bild neu gezeichnet wird und eine
Farbzeichenkette pro Bild genau das ist, was dieser Renderer vermeidet.
→ Kap. 5, 7

### 2026-08-03 — Ein Kollisionstest für eine Wand, statt einer je Bewegtem

**Gewählt:** Der bestehende Streckentest des Spielers wird verallgemeinert
(`resolve_movement_against_obstacles`, Parameter `mover_radius`) und von den Boids
mitbenutzt. Das Abprallen selbst — Position übernehmen, Geschwindigkeit spiegeln — liegt als
`obstacle_bounce.rs` daneben, weil der Spieler diesen Teil im Frontend erledigt
(`playerController.applyObstacleBlock`) und ein Boid ihn in der Engine braucht.

**Verworfen — Hindernisvermeidung auch für den dashenden Boid einschalten.** Die einfachste
Antwort wäre, `dash_steering` um `avoid_obstacles` zu erweitern. Sie nimmt dem Dash aber
genau die Eigenschaft, die ihn lesbar macht: Die Linie steht beim Start fest, und das
Aufladepulsen ist die Warnung, wohin sie zeigt. Ein Dash, der unterwegs abbiegt, ist nicht
mehr ausweichbar, sondern verfolgend. Zusätzlich ist die Vermeidungskraft eine
Beschleunigung gegen `max_acceleration` (0,09) und damit viel zu schwach, um eine
Dash-Geschwindigkeit von zehn Einheiten pro Schritt noch abzulenken — sie hätte das
Durchfliegen gar nicht verhindert.

**Verworfen — `push_boids_out_of_obstacles` einfach auch auf dashende Boids anwenden.** Der
Ausnahmefall dort ist nur eine Zeile, und die Versuchung ist entsprechend groß. Es ist aber
ein **Punkttest**: Er sieht, wo der Boid am Ende des Schritts steht. Ein Dash legt pro
Schritt mehr Weg zurück als eine Stange dick ist, landet also auf der anderen Seite im
Freien — dort findet der Punkttest nichts zu korrigieren. Genau diese Lücke war der Fehler.

**Verworfen — den Streckentest für Boids nachbauen statt ihn zu teilen.** Hätte
`obstacle_collision.rs` unberührt gelassen und die Umbenennung erspart. Der Preis wäre eine
zweite Fassung derselben Geometrie samt Standoff-Rechnung: zwei Kollisionstests für **eine**
Wand, die auseinanderlaufen, sobald einer von beiden angefasst wird.

**Warum:** Ein Hindernis ist ein Gegenstand mit einem Verhalten, nicht zwei Regelwerke je
nachdem, wer anstößt. Der Test kannte vom Spieler ohnehin nur Position und Radius — die
Verallgemeinerung war eine Umbenennung, kein neuer Code.

**Folge:** Der Dash wird beim Treffer nicht abgebrochen. Der Boid behält seine erhöhte
Geschwindigkeitskappe für die restlichen Dash-Schritte und federt sichtbar zurück; das liest
sich als abgewehrter Angriff, während ein Abbruch wie ein Aussetzer der Engine wirkte.
Außerdem ist Deckung in der Arena jetzt Deckung gegen den ganzen Schwarm, was die
Hindernisse taktisch aufwertet, ohne dass an ihrer Dichte gedreht wurde. → Kap. 5

### 2026-08-03 — Die Welle wird angekündigt, statt nur weiter weg zu spawnen

**Gewählt:** Jede Welle ab der zweiten betritt die Welt durch drei Tore auf dem
Weltrand, und jedes Tor wird 120 Simulationsschritte (2 s) vorher gezeichnet, bevor
irgendetwas darin existiert. `set_wave` kündigt nur an; die Boids kommen aus einer
Warteschlange, die `tick()` abarbeitet.

**Verworfen — die Sperrscheibe um den Spieler vergrößern.** Die naheliegende Antwort auf
„ein Boid ist vor mir erschienen" ist ein größerer `safe_spawn_distance`. Sie hilft
nicht, und zwar aus einem Grund, der sich nicht durch einen größeren Wert beheben lässt:
Der Abstand wird **im Moment des Spawns** gemessen, der Spieler bewegt sich aber weiter.
Wer mit Dash auf die Stelle zufliegt, ist eine halbe Sekunde später dort — bei jedem
Radius. Zusätzlich ist die Scheibe in einer 1920×1080-Arena schon bei 340 px ein
erheblicher Teil der Fläche; groß genug, um das Problem wirklich zu lösen, wäre sie
größer als die Arena.

**Verworfen — nur eine Warnzeit, Platzierung wie bisher.** Ein Marker mitten in der
Arena beantwortet „wo" erst, wenn man ihn gefunden hat. Bei bis zu neunzig bewegten
Boids ist das genau die Suche, die die Warnzeit auffressen würde. Auf dem Rand liegt der
Marker dagegen dort, wo die Aufmerksamkeit ohnehin peripher ist, und die Richtung ist
ohne Suchen ablesbar.

**Verworfen — ein Marker pro Tor statt pro Boid.** Wäre weniger Zeichenarbeit, sagt aber
nur „hier ungefähr". Die Boids eines Tores stehen ~28 px auseinander, der Glow reicht
34 px — die Marker überlappen von sich aus zu einem Bogen, und der helle Punkt in jedem
markiert weiterhin die exakte Position. Das Tor braucht damit auf keiner Seite der
Grenze ein eigenes Konzept.

**Warum:** Die beiden Fragen „wo" und „wann" werden von derselben Mechanik beantwortet,
und beide brauchen, dass die Position **vor** dem Spawn festgelegt wird. Genau daran
scheitern die Alternativen: Solange die Position erst beim Erscheinen entsteht, kann man
sie nicht vorher zeigen.

**Folge:** `entity_count` hinkt der Wellennummer zwei Sekunden nach — die HUD-Zahl zeigt
während der Warnung die alte Anzahl. Das ist keine Ungenauigkeit, sondern die Wahrheit
darüber, wie viele Boids in der Arena sind, und der Vertrag von `spawn_markers` sagt es
ausdrücklich. Zweite Folge: Das Warnfenster zählt in Simulationsschritten, nicht in
Wandzeit, und erbt damit alle vier Freeze-Fälle gratis — eine pausierte Runde hält ihre
Ankündigung, statt die Welle im Hintergrund hereinzulassen. Dritte Folge: `resize()`
verschiebt anhängige Marker **nicht**; sie liegen für höchstens zwei Sekunden am alten
Rand, und die Boids werden beim ersten Schritt vom Welt-Wrap hereingeholt. Das Spiel ruft
`resize()` nicht auf, und ein Umplatzieren wäre Code für einen Fall, den es nicht gibt.

→ Kap. 4, 5

### 2026-08-03 — Der Dash-Cooldown steht zweimal im Bild, das Label nur einmal

**Gewählt:** Die HUD-Bar am unteren Bildschirmrand bleibt unverändert; unter dem Spieler
kommt ein zweiter, kleinerer Balken ohne Label hinzu. Beide lesen denselben
`dashCooldownProgress` aus demselben `renderState`, tragen dieselben zwei Cyantöne aus
`styles/hud.css` und können deshalb nicht auseinanderlaufen. Der neue Balken liegt zusammen
mit der Lebensanzeige in einem eigenen Modul `renderer/playerStatusBars.js`.

**Verworfen:**

| Alternative                                             | Grund der Ablehnung                                                                                                                                                                                                               |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Die HUD-Bar durch die Anzeige am Spieler ersetzen       | Das Label „Dash / bereit" ginge verloren, und mit ihm die Stelle, an der die Fähigkeit überhaupt erklärt wird. Am Spieler ist kein Platz für Text, und Text dort wäre genau die Neurasterung pro Frame, die S-03 abgeschafft hat. |
| Den Balken im DOM über dem Spieler positionieren        | Er klebt am Spieler, nicht am Bildschirmrand — im DOM wäre das eine `style.transform`-Zuweisung pro Frame plus die Umrechnung der Weltkoordinate. Dieselbe Begründung, aus der die Lebensanzeige im Canvas geblieben ist.         |
| Nur einen Ring/Bogen um den Spieler statt eines Balkens | Die Zeitbögen der Power-ups sind schon Ringe um den Spieler (Aegis innen, Overdrive außen). Ein dritter Ring wäre bei laufendem Buff nicht mehr zuzuordnen; ein Balken unter der Lebensanzeige ist die freie Form.                |
| Den Balken nur zeigen, wenn der Cooldown läuft          | Dann sagt seine Abwesenheit „bereit" — eine Information, die man erst nach mehreren Runden liest. Sichtbar und voll ist unmittelbar verständlich, und ein 4 px hoher Balken kostet nichts an Übersicht.                           |

**Warum:** Die Entscheidung vom 30.07. („Die Dash-Bar wandert vom Canvas ins DOM") wird
damit nicht zurückgenommen, sondern präzisiert: Ins DOM gehörte das **Label**, weil ein
String pro Bild neu gerastert wurde. Der Balken selbst ist ein `fillRect` und war nie das
Problem. Die zwei Anzeigen bedienen zwei verschiedene Blicke — die HUD-Bar den zwischen den
Wellen, die am Spieler den während eines Angriffs. Redundanz ist hier gewollt, weil sie eine
Kopfdrehung ersetzt; gefährlich wäre nur eine zweite **Datenquelle**, und die gibt es nicht.

**Konsequenz:** `canvasRenderer.js` gibt die Lebensanzeige mit ab und fällt von 382 auf 339
Zeilen; die Geometrie ist damit erstmals unter Vitest prüfbar, statt im nicht ladbaren
Renderer zu stehen. `buildFrozenRenderState` muss `dashCooldownProgress` mittragen — ohne das
verschwindet der Balken hinter der Pause- und der Game-Over-Karte, während die Lebensanzeige
darüber stehen bleibt. Der Wert kann dort nicht driften, weil er von der Simulationsuhr kommt,
die im eingefrorenen Bild ebenfalls steht.
→ Kap. 5, 7

### 2026-08-03 — Die Vorwarnzeit eines Hindernisses gehört der Engine, nicht dem Renderer

**Gewählt:** Ein neues Hindernis betritt die Welt in einem Zustand „erscheint" und ist erst
nach `OBSTACLE_ARMING_STEPS` fest. Diese Spanne liegt als Zustand am `Obstacle` und wird über
das Vorzeichen des sechsten Buffer-Werts nach außen gegeben: negativ heißt „wird gerade
eingeblendet und ist noch nicht fest", positiv ist die Restlebensdauer. Das Frontend blendet
genau über diesen Bereich ein.

**Verworfen:** die Einblendzeit weiter im Frontend zu rechnen (`OBSTACLE_FADE_SHARE` als
Anteil der Lebensdauer) und in der Engine eine zweite, unabhängige Konstante für die
Vorwarnzeit einzuführen. Ebenfalls verworfen: ein achter Buffer-Wert für den Zustand.

**Warum:** Zwei Konstanten für dieselbe Zeitspanne sind genau der Fehler, den diese Änderung
behebt, nur eine Ebene höher. Weichen sie voneinander ab, wird ein Hindernis fest, bevor es
fest aussieht — die Animation wäre wieder Dekoration statt Zusicherung. Umgekehrt wäre eine
Engine-Konstante ohne Wirkung auf die Darstellung ebenso wertlos. Das Vorzeichen genügt als
Träger, weil `dash_phases` dasselbe seit S-05 vormacht und der Wert exakt `0` nie auftritt:
ein erscheinendes Hindernis hat mindestens einen Arming-Schritt übrig, ein stehendes
mindestens einen Lebensschritt. Damit bleibt es bei sieben Werten pro Hindernis, ohne
einen weiteren Wert über die Grenze zu schicken.

**Konsequenz:** Die Abfrage sitzt an den drei Stellen, an denen ein Hindernis _wirkt_ —
Spielerkollision, Boid-Ausweichen, Herausschieben eines Boids — und bewusst **nicht** in der
Platzierungsregel: Ein erscheinendes Hindernis belegt seinen Platz weiterhin, sonst könnte
während der Animation ein zweites darauf gesetzt werden und die Korridor-Invariante fällt.
Der Preis ist ein Fenster von 1,5 s, in dem ein sichtbares Hindernis durchflogen werden kann.
Das ist die gewollte Seite des Tauschs, solange das Fenster klein gegen die Lebensdauer von
40 s bleibt; ein längeres wäre eine Abkürzung statt einer Warnung.
→ Kap. 4, 5

### 2026-08-02 — Die Simulationsrate wird nicht an die Bildwiederholrate gekoppelt

**Gewählt:** Der feste Zeitschritt von 60 Schritten/s bleibt unangetastet. Gegen zu viel
Zeichenarbeit hilft der Deckel auf der Renderseite, nicht mehr Simulation.

**Verworfen:** die Simulation auf die Bildwiederholrate mitziehen, damit Bilder oberhalb
von 60 fps neue Information tragen.

**Warum:** Der Vorschlag löst das Problem in die falsche Richtung — ein Schritt ist O(n²)
über den Schwarm, 120 Schritte/s verdoppeln also die CPU-Last, während die GPU weiter 120
Bilder zeichnet. Dazu kommt, dass in der Engine jede Dauer in **Schritten** zählt und nicht
in Millisekunden: Dash-Phasen, Wellenfortschritt und vor allem `dash_selection.rs`, das per
Integer-Hash aus `Flock::step_counter` ableitet, wer als Nächstes losstürmt. Es gibt bewusst
kein `rand`. Eine an den Monitor gekoppelte Schrittzahl macht dieselbe Runde auf zwei
Rechnern unterschiedlich und zwingt dazu, jede schrittbasierte Konstante samt Tests
umzurechnen — der feste Zeitschritt ist eine der beiden tragenden Invarianten des Projekts.

**Konsequenz:** Der Gedanke dahinter bleibt richtig und wird umgekehrt genutzt: Ändert sich
die Welt nur 60-mal pro Sekunde, ist jedes weitere Bild dasselbe Bild noch einmal. Die
Konsequenz daraus ist ein Deckel beim Zeichnen, kein Anheben der Simulation.
→ Kap. 4, 5

### 2026-08-02 — Der Arena-Hintergrund wird gebacken, nicht in einen zweiten Canvas gelegt

**Gewählt:** ein Offscreen-Canvas in Gerätepixelgröße, das bei jedem Resize neu bemalt und
pro Bild mit einem `drawImage` in Screen-Space auf das Spiel-Canvas geblittet wird.

**Verworfen:** ein zweites `<canvas>`-Element hinter dem Spiel-Canvas, das den Hintergrund
statisch hält und nie neu gezeichnet wird. Das klingt billiger, ist es aber nicht: Es
verbietet `{ alpha: false }` auf dem Spiel-Canvas — das müsste durchsichtig bleiben, damit
der Hintergrund durchscheint — und tauscht damit einen günstigen Blit innerhalb eines
Canvas gegen eine Vollbild-Mischung im **Compositor** pro Bild.

**Warum:** Das Ergebnis muss pixelgleich sein, und das ist es nur, weil beide Flächen
dieselbe zusammengesetzte Transformation tragen und das Bild anschließend bei
Identitätstransformation auf `0, 0` geblittet wird — nirgends wird resampelt. Genau deshalb
liegt die Matrix jetzt als geteilte, getestete Funktion in `worldTransform.js` statt zweimal
ausgeschrieben: Wichen die beiden um einen Rundungsschritt voneinander ab, säße der gebackene
Hintergrund einen Bruchteil eines Pixels neben allem, was live darüber gezeichnet wird.

**Konsequenz:** Der Blit ist deckend und überdeckt die ganze Fläche, ist also zugleich der
Wisch — das vorherige `clearRect` entfällt ersatzlos, denn Pixel zu löschen, die unmittelbar
danach überschrieben werden, ist ein zweiter Vollflächen-Durchgang ohne Wirkung. Zur
Absicherung dient die vorhandene Pixelsonde in `letterbox.spec.js`: Sie liest echte
Canvas-Pixel und würde einen falsch platzierten Hintergrund sofort melden.
→ Kap. 3, 8

### 2026-08-02 — Vor der GPU-Optimierung wird eine Messgrundlage gebaut, nicht optimiert

**Gewählt:** T-08 wird in zwei Stufen geschnitten. Stufe 0 ändert an der Zeichnung nichts
und liefert nur Messbarkeit: `backdrop-filter` aus dem Frametime-Overlay entfernt, eine
dritte Textzeile mit gezeichneten Bildern pro Sekunde, Zeichenoperationen pro Bild und
Backing-Store-Pixeln, dazu ein schriftliches Messprotokoll in Kap. 8.6. Stufe 1 wird erst
nach den Zahlen priorisiert.

**Verworfen:** direkt die naheliegenden Hebel umsetzen — Obergrenze für
`devicePixelRatio`, statischer Hintergrund als Cache, kein Neuzeichnen stehender Bilder.
Alle drei sind vermutlich richtig, und genau das ist das Problem: „vermutlich" ist die
Aussage, die der Bericht in Kap. 8 nicht tragen kann. Ebenfalls verworfen: ein
WebGL-Backend. Die `Renderer`-Fassade ist dafür gebaut und lädt dazu ein, aber der Aufwand
sprengt die Restkapazität bis zum Code-Freeze, und die Ursache liegt nicht in Canvas2D als
Technik, sondern in der Menge geschriebener Pixel.

**Warum:** Das Projekt konnte über Laufzeitkosten bis hierher keine prüfbare Aussage
machen. Der Frametime-Graph misst Skriptzeit; ein `fill()` kehrt sofort zurück, die
Rasterisierung wird danach und außerhalb des Hauptthreads bezahlt. Der Graph kann also 2 ms
anzeigen, während die GPU ausgelastet ist. Dazu kam ein Befund über das Werkzeug selbst:
`.frame-time-graph` trug einen `backdrop-filter` und lag über der einzigen Fläche, die in
jedem Bild neu gezeichnet wird — das Diagnosewerkzeug war der einzige GPU-Effekt, der
während einer Runde lief, und veränderte damit genau die Größe, die es berichten soll.

**Konsequenz:** Drei neue, unter Vitest prüfbare Module statt Instrumentierung quer durch
die Zeichenschichten: `renderer/drawCallCounter.js` ersetzt die zeichnenden Methoden des
Kontexts einmalig durch weiterleitende Zähler, `ui/drawnFrameRate.js` zählt Bilder über ein
Sekundenfenster, `formatLoadRow` in `ui/frameGraphScale.js` setzt die Zeile zusammen. Die
Zeile sagt ausdrücklich nicht, sie messe GPU-Zeit; die kommt aus dem Profiler des Browsers.
Pfadaufbau wird bewusst nicht mitgezählt, sonst sähe ein gebündelter Pfad genauso teuer aus
wie ein ungebündelter.
→ Kap. 8

### 2026-08-02 — Der Modul-Ladevorgang wird als Promise geteilt, nicht als Flag geprüft

**Gewählt:** `engine-bridge.js` hält das **Promise** des Ladens (`modulePromise`) und gibt
es an jeden weiteren Aufruf zurück. Zusätzlich verweigert `startGame()` in `index.js` einen
zweiten Start, solange der erste noch läuft.

**Verworfen:** nur ein Boolean `isLoading` in `initEngine`. Es beschreibt denselben Zustand,
aber der zweite Aufrufer hat dann nichts, worauf er warten könnte — er müsste pollen oder
sofort zurückkehren und damit eine Runde ohne Engine öffnen. Ebenfalls verworfen: die Karte
vor dem `await` ausblenden. Das verhindert den Doppelklick, lässt die Ursache aber
bestehen — jeder künftige Aufrufer von `initEngine` fiele erneut hinein.

**Warum:** Ein Flag ist erst gesetzt, wenn das Laden **fertig** ist; genau das ist auch die
einzige Absicherung im generierten `wasm-bindgen`-Loader (`if (wasm !== undefined) return`).
Zwei Aufrufe, die beide starten, während noch geladen wird, finden beide nichts vor und
instanziieren beide — das Promise ist die einzige Form, die den _laufenden_ Vorgang
darstellt. Die Sperre in `index.js` steht daneben und nicht dafür: sie schützt nicht nur die
Engine, sondern auch Rundenzustand, Zustandsübergang und Tastenbesitz vor der doppelten
Ausführung.

**Konsequenz:** Eine WebAssembly-Instanz pro Sitzung, unabhängig davon, wie oft und wie
schnell gestartet wird. Zwei E2E-Tests halten das fest, indem sie
`WebAssembly.instantiate`/`instantiateStreaming` in der Seite zählen — die Zusicherung ist
„genau eine Instanziierung", nicht „keine Fehlermeldung", weil der Schaden erst Minuten
später und an anderer Stelle sichtbar wird.
→ Kap. 4, 8

### 2026-08-01 — Ein Listener besitzt beide Richtungen von Escape

**Gewählt:** `input/pauseControl.js` hört einmal auf Fensterebene, liest den Spielzustand
und schaltet um. `Menu._goBack()` bleibt unverändert und ist auf der Pausenkarte ein No-op.

**Verworfen:** Escape zum Pausieren in einem neuen Listener, Escape zum Fortsetzen über den
bestehenden Handler in `ui/menuNavigation.js` — der Entwurf, der auf dem Papier keine neue
Zuständigkeit einführt und die Zusage „Esc geht zurück" aus der Menüfußzeile wiederverwendet.

**Warum:** Er funktioniert in keiner der beiden Bindungsreihenfolgen. Beide Listener hängen
an `window` und bekommen dasselbe Event; `menuNavigation` prüft dabei, ob das Overlay
sichtbar ist — und genau das verändert der jeweils andere Handler **synchron innerhalb
derselben Auslieferung**. Pause zuerst gebunden: Escape pausiert, macht das Overlay sichtbar,
und der Menü-Handler geht auf der Karte, die eben aufging, sofort „zurück". Menü zuerst
gebunden: Escape setzt fort, versteckt das Overlay, stellt `PLAYING` her — und der
Pause-Listener sieht im selben Event `PLAYING` und pausiert erneut. Beides wirkt wie eine
tote Taste, und beides ist kein Fehler in einer Zeile, sondern im Zuschnitt.

**Konsequenz:** Der Zustands-Guard ist die einzige Autorität; `pauseControl` prüft die
Sichtbarkeit des Overlays bewusst nicht, weil das eine zweite Stelle wäre, an der dieselbe
Frage anders beantwortet werden kann. Dafür braucht die Taste einen `event.repeat`-Guard,
den der Menü-Handler nicht braucht: „zurück" ist idempotent, ein Umschalten nicht.
Zusätzlich verworfen wurde die Unterbringung in `InputManager` — dessen Vertrag lautet,
außerhalb einer Runde keine Taste zu besitzen, während die Pause in beide Richtungen gehört
werden muss; ein Latch dort würde von `setGameplayActive(false)`, also vom Pausieren selbst,
gelöscht.

→ Kap. 4, 5

### 2026-08-01 — Die Countdown-Restzeit liegt in den Rundendaten

**Gewählt:** `pauseCountdown` legt `countdownRemainingMs` ab, `resumeCountdown` befristet
`countdownEndsAt` neu. Beide sind No-ops auf einer aktiven Runde, der Guard liegt in den
Funktionen.

**Verworfen:** (a) Pausieren während des Countdowns verbieten; (b) den Countdown auf die
Simulationsuhr umstellen; (c) einen `pausedAt`-Zeitstempel in `index.js` halten und dort
die Differenz rechnen.

**Warum:** `countdownEndsAt` ist der einzige Wandzeit-Wert, den eine Runde noch trägt, und
damit der einzige, den eine Pause ungültig machen kann — pausiert bei „3" und zehn Sekunden
später fortgesetzt, ist die Frist verstrichen und die Runde startet ohne Countdown. (a) sieht
risikofrei aus, macht aber eine dokumentierte Taste drei Sekunden lang wirkungslos, und ein
Test müsste die Abwesenheit von Verhalten belegen. (b) wäre der architektonisch bessere
Endzustand und würde die Pause an dieser Stelle kostenlos machen, verlangt aber, dass der
Countdown-Zweig anstehende Zeit als Schritte **verbraucht** statt sie zu verwerfen — ein
Umbau genau des Pfads, auf dem der Catch-up-Burst-Kommentar sitzt, mitten in einem
Pausenmenü. (c) hätte die Rundenarithmetik in die Datei zurückgeholt, die für dieses Feature
gerade verkleinert werden musste.

**Konsequenz:** Der Countdown-Glyph verschwindet hinter der Karte, weil der eingefrorene
Renderzustand kein `countdownSeconds` führt. Das ist die richtige Anzeige und steht als
Kommentar dort, damit es niemand „reparieren" will: ein tickender Countdown hinter einer
Pausenkarte wäre eine Lüge. (b) bleibt als Option notiert, falls der Countdown aus anderem
Grund noch einmal angefasst wird.

→ Kap. 4, 5

### 2026-08-01 — Eine abgebrochene Runde wird nicht gespeichert

**Gewählt:** Der Weg von der Pausenkarte ins Hauptmenü schreibt nichts in die Rekorde.
`PAUSED → MENU` ist damit der einzige Weg aus einer Runde ohne Schreibzugriff.

**Verworfen:** Beim Verlassen `recordRound` aufrufen wie am Rundenende, damit „jede
gespielte Runde zählt".

**Warum:** `recordRound` beschreibt sich selbst als „records a **finished** round", und
„Last Run" im Command Deck meint die letzte gespielte Runde. Aufgeben kann nie mehr Punkte
bringen als Weiterspielen; ein gespeicherter Abbruch könnte „Last Run" also nur mit einer
Zahl überschreiben, von der der Spieler bewusst weggegangen ist — das ist strikt schlechtere
Information als der Bestand davor. Der Einwand „wer mitten im Rekord aufgibt, verliert ihn"
ist die richtige Folge des Aufgebens und kein Fehler.

**Konsequenz:** Abgefedert wird das nicht durch Speichern, sondern durch Anzeigen: Die Karte
trägt Score und Statzeile, damit die Entscheidung informiert getroffen wird. Die Karte zeigt
deshalb auch **keinen** Bestwert — die Pause fasst `roundRecords` in keiner Richtung an.

→ Kap. 5, 8

### 2026-08-01 — Power-ups vollständig ohne Engine-Anteil

**Gewählt:** Marker, Aufnahme, Buff-Laufzeit und Wirkung liegen komplett im Frontend.
Die WASM-Signatur bleibt unverändert, es kommt kein sechster Puffer über die Grenze.

**Verworfen:** (a) Marker als Weltobjekte in die Engine legen, analog zu den Hindernissen
aus S-07; (b) nur die Kollision Spieler↔Marker in die Engine geben, weil dort schon
`aabb_overlap` und die Kapsel-Auflösung liegen.

**Warum:** (a) Hindernisse gehören in die Engine, weil die Boids ihnen ausweichen — sie
sind Teil der Simulation. Einen Marker sieht kein Boid an; er ist nur für den Spieler da,
und der wird ohnehin im Frontend integriert. (b) hätte einen Puffer und eine
`tick`-Signaturänderung gekostet, um einen Abstandsvergleich zu verlagern, den das
Frontend in derselben Zeile schon selbst rechnet.

**Konsequenz:** Der Hindernis-Abstand beim Spawn muss das Frontend aus `frame.obstacles`
lesen und die Punkt-Segment-Geometrie selbst können. Das ist die einzige Stelle, an der
sich die Engine-Geometrie ein zweites Mal im Frontend zeigt — bewusst über eine
exportierte, einzeln getestete `distanceToSegment` statt inline im Spawnversuch.

→ Kap. 4, 5

### 2026-08-01 — Aegis neben der Gnadenfrist, nicht als ihre Verlängerung

**Gewählt:** Der Schild ist ein eigener Zustand mit eigener Laufzeit. `registerHit` bekommt
einen optionalen Absorber-Callback und fragt ihn erst, nachdem die Gnadenfrist verneint hat.
Ein absorbierter Treffer setzt `lastHitAtSimulationMs` **nicht**.

**Verworfen:** (a) Aegis als vorgezogene Unverwundbarkeit implementieren, also einfach
`lastHitAtSimulationMs` in die Zukunft schieben — so schlägt es das Designsystem vor;
(b) den Absorber in `index.js` vor `registerHit` prüfen, statt ihn hineinzureichen.

**Warum:** (a) hätte zwei Verhaltensunterschiede eingeebnet, die das Feature ausmachen:
Ein Schild endet mit dem Treffer, den er frisst, eine Gnadenfrist läuft nach dem Treffer
weiter; und nach einem absorbierten Treffer soll der nächste sofort wieder kosten, nach
einer Gnadenfrist gerade nicht. (b) hätte die Reihenfolge Gnadenfrist → Schild → Schaden
in `index.js` verdoppelt, wo sie nicht unter Vitest steht — `index.js` importiert den
Renderer und das DOM. Als Parameter von `registerHit` bleibt der Schadenstrichter genau
eine Funktion und die Reihenfolge ist mit vier Zusicherungen festgenagelt.

**Konsequenz:** Der Schild kann nicht mehr auf einem Treffer verschwendet werden, der
während der Gnadenfrist ohnehin nichts gekostet hätte. `roundData.js` weiß dafür, dass
Schaden abgefangen werden kann — aber nicht, wovon.

**Teilweise zurückgenommen am 2026-08-04** („Aegis kauft ein Fenster, nicht einen Treffer"):
Der Satz „nach einem absorbierten Treffer soll der nächste sofort wieder kosten" hat den
Spieltest nicht überlebt. Der getrennte Zustand und die Reihenfolge im Trichter bleiben
unverändert — zurückgenommen ist allein die Dauer des Schutzes, und sie liegt weiterhin im
Power-up und nicht in den Rundendaten.

→ Kap. 4, 8

### 2026-08-01 — Die Simulationsuhr wird hereingereicht, nicht nachgebaut

**Gewählt:** `PowerupField.step/absorbHit/snapshot/grant` nehmen `simulationTimeMs` als
Parameter. Das Modul führt keine eigene Uhr.

**Verworfen:** Den `_elapsedMs`-Akkumulator des Handoffs behalten, der pro Schritt
`stepSeconds * 1000` addiert.

**Warum:** Beide Uhren wären dieselbe Uhr, bloß zweimal geführt — synchron nur so lange,
wie `reset()` und `beginRound()` beieinander bleiben. Genau diese Kopplung ist die, die
beim Dash-Cooldown schon einmal Ärger gemacht hat, weshalb `dashCooldown.js` seine Zeit
ebenfalls als Parameter bekommt und `roundData.js` sie bindet.

**Konsequenz:** Das Handoff-Modul und seine Testsuite mussten umgeschrieben werden; die
Tests treiben die Uhr jetzt über einen kleinen `Driver`, der macht, was `index.js` macht.
Dafür ist `reset()` an `beginRound()` gebunden — dokumentiert und durch den Test
„startet das Spawn-Intervall neu" abgesichert.

→ Kap. 4, 8

### 2026-08-01 — Buff-Anzeige im DOM statt auf dem Canvas

**Gewählt:** Die beiden Restzeit-Balken sind DOM-Elemente in `ui/hud.js`, eingehängt in
dieselbe Flex-Spalte wie die Dash-Bar. `drawHudBuff` aus dem Handoff entfällt.

**Verworfen:** Die Handoff-Variante, die die Zeilen in Screen-Space aufs Canvas zeichnet.

**Warum:** Die Dash-Bar ist am 2026-07-30 aus genau diesem Grund vom Canvas ins DOM
gewandert: Ihre Beschriftung ändert sich nie und wurde trotzdem in jedem Frame neu
gerastert. Für die Buff-Zeilen gilt dasselbe, und zwei HUD-Elemente derselben Art an zwei
verschiedenen Orten wären die schlechtere Antwort. Die Warnung vor dem Ablauf bleibt
davon unberührt — sie ist der 4-Hz-Bogen am Spieler, dort wo in Welle 5 tatsächlich
hingesehen wird.

**Konsequenz:** Zwei neue Locale-Schlüssel (`hud.aegis`, `hud.overdrive`) und ein CSS-Hex
über `clip-path` statt eines gezeichneten. Die E2E-Suite kann die Zeilen dadurch
überhaupt erst prüfen — auf dem Canvas wären sie unsichtbar für Playwright gewesen.

→ Kap. 6, 8

### 2026-08-01 — Marker bleiben zufällig platziert, und der E2E-Test bezahlt dafür

**Gewählt:** Die Spawn-Position kommt weiterhin aus `Math.random`, hereingegeben im
Konstruktor. Der Playwright-Test prüft deshalb nur die Verdrahtung: dass die HUD-Zeilen
existieren, verborgen bleiben, bis ein Buff läuft, und ein Neustart nichts stehen lässt —
plus eine Runde über zwei Spawn-Intervalle ohne Konsolenfehler.

**Verworfen:** Die Position wie `find_spawn_position` in der Engine aus einem
Integer-Hash des Schrittzählers ableiten. Dann wäre der ganze Ablauf reproduzierbar und
ein E2E-Test könnte zu einem bekannten Punkt laufen und einsammeln.

**Warum:** Die Determinismus-Regel des Projekts gilt der **Engine** — sie ist das
Fokus-Thema, und ihre Reproduzierbarkeit ist eine Aussage über die Simulation. Ein
Marker ist keine Simulation. Vier Runden mit identischer Marker-Abfolge wären zudem
spielerisch schlechter als vier verschiedene, und der Gewinn wäre ein einzelner
E2E-Test — die Regeln selbst stehen über die injizierte RNG bereits vollständig unter
Unit-Test (98 % Statements in `powerups.js`).

**Konsequenz:** Eine Lücke, die benannt gehört: Es gibt keinen automatisierten Test, der
das Einsammeln im echten Browser durchläuft. Die Prüfliste aus dem Handoff bleibt für
diesen Teil eine manuelle. Sie steht als vierte dokumentierte E2E-Grenze in Kap. 8.2
neben Chromium-only, Single-Worker und keinem Pixelvergleich.

→ Kap. 8

### 2026-08-01 — Dichte über den Nachbarschaftsradius, nicht über das Separationsgewicht

**Gewählt:** Der Schwarm wird über zwei Radien verdichtet — den harten Mindestabstand
`BOID_COLLISION_RADIUS` (10 → 6, also 12 statt 20 Einheiten zwischen zwei Mittelpunkten)
und den Anteil der Wahrnehmungsreichweite, ab dem Separation überhaupt greift. Letzterer
war eine nackte `0.5` in `Boid::close_neighbour_radius()` und ist jetzt die benannte
Konstante `CLOSE_NEIGHBOUR_RADIUS_SHARE` mit 0,36. Die Gewichte bleiben bis auf eine
leichte Anhebung der Kohäsion unangetastet.

**Verworfen:** (a) `DEFAULT_SEPARATION_WEIGHT` (3,2) senken, der naheliegende Griff;
(b) `DEFAULT_PERCEPTION_RADIUS` senken; (c) den Faktor als Literal stehen lassen und nur
seinen Wert ändern.

**Warum:** (a) wirkt kaum. `flocking_steering` summiert alle vier Regeln und `clamp_force`
begrenzt das Ergebnis anschließend auf `max_acceleration` (0,09). Auf kurzer Distanz
sättigt Separation diese Grenze allein — die Kraft wäre so oder so abgeschnitten, das
Gewicht verschiebt dann nur noch, _welche_ Regel bei mittlerer Distanz dominiert, nicht den
Ruheabstand. Der Radius entscheidet dagegen, ab wann Separation überhaupt einsetzt, und
genau das ist der Ruheabstand. (b) hätte gleichzeitig Alignment, Kohäsion und die
Hindernis-Vorausschau verkürzt, die alle die volle Wahrnehmungsreichweite benutzen — ein
Regler für vier Verhalten. (c) verstößt gegen die Magic-Number-Regel und hätte die
Stellschraube weiter unauffindbar gehalten; der Anteil bleibt bewusst relativ zur
Wahrnehmung, damit spätere Wellen mit größerem Radius auch entsprechend mehr Abstand
halten.

**Konsequenz:** Die gezeichnete Boid-Länge (11) liegt jetzt knapp unter dem
Mindestabstand (12), zwei ruhende Nachbarn berühren sich also fast — das ist die dichte
Wolke. Weil der Mindestabstand nicht mehr zum Treffer-Radius passte, ist der Boid-Treffer
als `BOID_HIT_RADIUS` (10,5 → 21 Einheiten Mittenabstand) von `PLAYER_COLLISION_RADIUS`
getrennt; jener bleibt bei 14, weil die Compile-Time-Zusicherung zur Sackgassenfreiheit
jedes Hindernis um genau diesen Wert aufbläst. Eine Zahl konnte nicht mit dem Boid
schrumpfen, ohne die Korridor-Garantie mitzulockern.

Wichtig für Kapitel 10, weil es die Motivation der Änderung relativiert: **Dichte allein
macht die Simulation nicht teurer.** Die Paarzahl ist O(n²) in der Boid-Anzahl und von der
Packung unabhängig. Dichte erhöht nur die Arbeit _innerhalb_ der Schleifen — mehr Nachbarn
innerhalb der Wahrnehmung, vor allem aber deutlich mehr echte Überlappungen, die die vier
Relaxations-Pässe auflösen müssen. Der eigentliche Lasthebel ist die Schwarmgröße
(Startschwarm 12 → 24, Zuwachs 6 → 12; Welle 5 also 72 statt 36 Boids). Beides gehört
zusammen: ohne die Verdichtung wäre der größere Schwarm nur unübersichtlich.
→ Kap. 4, 8, 10

### 2026-08-01 — Die Bildwiederholrate wird gemessen, nicht angenommen

**Gewählt:** Beim Start beobachtet `loop/refreshRate.js` zwölf aufeinanderfolgende
`requestAnimationFrame`-Aufrufe und nimmt den **Median** ihrer Abstände als Bildwiederholrate.
Die feste Liste `[30, 60, 120]` wird daran gefiltert, mit 5 % Toleranz; vorausgewählt ist die
schnellste übrig gebliebene Option.

**Verworfen:** (a) die gemessene Rate selbst als Option anbieten, ein 144-Hz-Monitor bekäme
also einen Eintrag „144 (Max)"; (b) gar nicht messen und stattdessen weiter im Hinweistext
darauf verweisen, dass der Monitor die Obergrenze setzt; (c) den Mittelwert statt des Medians.

**Warum:** Eine Browser-API für die Wiederholrate gibt es nicht — `requestAnimationFrame` wird
aber vom Bildschirm getaktet, der Abstand zwischen zwei Aufrufen _ist_ die Periode. Der Median
ist nötig, weil während des Starts regelmäßig ein einzelner langer Frame dazwischenliegt; ein
Ausreißer von 250 ms zieht den Mittelwert über zwölf 60-Hz-Abstände auf rund 46 Hz und würde
60 fps vom eigenen 60-Hz-Monitor werfen. Gegen (a) spricht, dass die Optionsliste damit
maschinenabhängig wird — jeder Test müsste sich auf die Hardware des Prüfrechners einlassen —
und der Gewinn null ist: Da der Renderer bei ≥ 120 gar nicht mehr drosselt, zeichnet „120 (Max)"
auf einem 144-Hz-Schirm ohnehin 144 Bilder. (b) war der bisherige Zustand und stellt dem
Spieler eine Wahl, die die Hardware nicht einlöst.

**Konsequenz:** Der `FrameScheduler` bleibt unverändert. Das ist kein Versehen, sondern folgt
aus der Filterung: Ist das Ziel nie höher als die Wiederholrate, liegt das Renderfenster
`1000 / Ziel − 2 ms` immer unter dem tatsächlichen Frameabstand (14,67 ms gegen 16,67 ms bei
60 Hz; 6,33 ms gegen 8,33 ms bei 120 Hz), die oberste Option zeichnet also jeden Frame — mit
und ohne Drosselung dasselbe Ergebnis. Zwei Fälle sind bewusst abgefangen: Ein im Hintergrund
gestarteter Tab drosselt `requestAnimationFrame` auf etwa 1 Hz, das wäre als 1-Hz-Monitor
gelesen worden; und ein Bildschirm langsamer als jede Option behält die langsamste, damit die
Gruppe nie leer ist. Scheitert die Messung, stehen wieder alle drei Optionen zur Wahl — die
Drosselung durch den Bildschirm bleibt ja bestehen.
→ Kap. 5, 8

### 2026-08-01 — Die Menü-Einstellungen bekommen ein eigenes Modul

**Gewählt:** Die drei Einstellwerte und die Fabrik, die das Objekt für `Menu.showStart` baut,
liegen als Klasse `MenuSettings` in `ui/menuSettings.js`. `index.js` hält nur noch eine Instanz
davon und liest im Loop über Getter.

**Verworfen:** die zusätzliche Bootstrap-Logik in `index.js` belassen und dort weitere Zeilen
anhängen.

**Warum:** Erzwungen durch die 400-Zeilen-Grenze — `index.js` stand bei 398 Zeilen, die Messung
und ihre Auswertung hätten sie gerissen. Der Schnitt ist aber nicht nur Platzgewinn: Die einzige
Logik unter den Einstellungen, nämlich welche Bildraten der Monitor übrig lässt und welche davon
vorausgewählt ist, war in `index.js` unter Vitest gar nicht erreichbar, weil das Modul die
WASM-Bridge und den Canvas mitzieht. Als eigenes Modul ist sie importfrei bis auf `gameConfig.js`
und `refreshRate.js` und damit direkt prüfbar.

**Konsequenz:** `index.js` fällt von 398 auf 324 Zeilen und handelt wieder von der Schleife
statt von Menüwerten. Die Einstellungen sind weiterhin nicht persistent; sie überleben eine
Runde, aber kein Neuladen der Seite. Das bleibt so, bis Persistenz gefordert ist —
`round/roundRecords.js` zeigt, wie sie dann aussähe.
→ Kap. 5, 8

### 2026-07-30 — Der Schweif liest den Dash aus der Geschwindigkeit statt aus einem Zustand

**Gewählt:** Die Stärke des Schweifs ist eine Funktion der aktuellen Geschwindigkeit
(Spieler) beziehungsweise der vorhandenen `dash_phases[i]` (Boids). Es gibt keinen
Schweif-Zeitgeber, kein Feld „ich dashe" und keinen sechsten Buffer über die
WASM-Grenze.

**Verworfen:** (a) eine eigene Restlaufzeit im Frontend, die beim Dash gesetzt und
heruntergezählt wird; (b) ein zusätzliches Flag-Array aus der Engine, das je Boid „dasht"
meldet.

**Warum:** Beide Alternativen führen eine zweite Wahrheit über denselben Vorgang ein, die
mit der ersten auseinanderlaufen kann. Ein Zeitgeber im Frontend müsste jeden Weg kennen,
auf dem ein Dash vorzeitig endet — Weltkante und Hindernis setzen die Geschwindigkeitsgrenze
zurück, ohne dass ein Zeitgeber davon erfährt; der Schweif würde ins Leere weiterlaufen. Die
Geschwindigkeit selbst weiß es immer, weil sie der Dash _ist_. Für die Boids trägt
`dash_phases` die Information bereits und ist mit dem Vorzeichen genau so verpackt, dass die
Dash-Phase vom Aufladen unterscheidbar ist; ein Flag-Array wäre eine vierte Kopie derselben
Aussage.

**Konsequenz:** Der Schweif endet immer dort, wo der Dash tatsächlich endet, auch bei
Wandtreffer und Hinderniskollision. Der Preis ist ein schwacher Schweif schon bei normalem
Lauftempo: Die Stärkerampe beginnt bewusst bei 60 % der Höchstgeschwindigkeit, damit ein
auslaufender Dash ausblendet statt an einer harten Schwelle abzureißen — bei Höchstgeschwindigkeit
sind das rund 20 % Stärke, also ein Fünftel der Breite und der Deckkraft. Das ist als
Bewegungsspur lesbar, aber es ist eine Nebenwirkung und keine Absicht, und ein Test nagelt
die Obergrenze fest.
→ Kap. 5, 8

### 2026-07-30 — Historie und Verlaufsmathematik des Schweifs liegen in getrennten Dateien

**Gewählt:** `dashTrail.js` hält die Kennwerte und die reinen Funktionen (Stärke, Breite,
Deckkraft, Absprungring), `dashTrailHistory.js` die Klasse `DashTrails` mit den Ringpuffern
und dem Modul-Singleton. Die Abhängigkeit läuft in genau eine Richtung: die Historie liest
die Kennwerte, nie umgekehrt.

**Verworfen:** eine Datei wie im Handoff, mit einem Re-Export als Fassade
(`export { DashTrails } from './dashTrailHistory.js'`), damit Aufrufer weiter einen Import
haben.

**Warum:** Die Handoff-Datei kam auf 406 Zeilen und lag damit über der 400-Zeilen-Grenze.
Die Fassaden-Variante war der erste Versuch und ist falsch: Sie schließt einen Importzyklus,
und ES-Module werten den Zyklus in der Tiefe zuerst aus — `new DashTrails()` würde beim
Laden auf `MAX_TRAILS` zugreifen, während dieses `const` noch in seiner temporalen Todeszone
liegt, und der erste Frame stürbe mit einem `ReferenceError`. Die Zyklusfreiheit ist hier
also keine Stilfrage, sondern die Bedingung dafür, dass ein Singleton auf Modulebene
überhaupt gebaut werden darf.

**Konsequenz:** Aufrufer importieren aus zwei Dateien. Die Testsuite ist entsprechend
zweigeteilt (`dashTrail.test.js`, `dashTrailHistory.test.js`), was der Konvention
„Test neben dem Modul" ohnehin entspricht.
→ Kap. 5, 8

### 2026-07-30 — Präsentationsanimationen laufen auf Wall Time, nicht auf der Simulationsuhr

**Gewählt:** Der `FrameScheduler` bekommt `secondsSinceRender(timestamp)`; der Loop gibt
diesen Wert als `renderState.deltaSeconds` weiter, und der Absprungring des Schweifs altert
damit.

**Verworfen:** den Ring über `simulationTimeMs` altern zu lassen, wie es Score, Timer und
jede Fähigkeit im Spiel tun.

**Warum:** Die Simulationsuhr ist die richtige Basis für alles, was Spielzustand ist — nur
so bleibt ein Lauf bei 30 und bei 120 fps derselbe Lauf. Der Absprungring ist aber kein
Spielzustand, sondern Bild: Er wird nur in gezeichneten Frames überhaupt fortgeschrieben.
Auf der Simulationsuhr wäre er an die Zahl der gezeichneten Frames gekoppelt und liefe bei
30 fps halb so schnell ab wie bei 60.

**Konsequenz:** Zwei Zeitbasen im `renderState`, klar getrennt: Alles, was der Spieler als
Zustand liest, kommt aus `gameData`; alles, was nur aussieht, aus `deltaSeconds`. Das
Fehlen von `deltaSeconds` ist zugleich das Signal „dieses Bild steht" — während Countdown
und nach dem Tod wird deshalb nicht abgetastet, sodass die Karte den eingefrorenen Frame
samt seiner Schweife behält.
→ Kap. 5, 8

### 2026-07-30 — Die Spielwelt hat eine feste Größe, das Fenster skaliert sie nur

**Gewählt:** Die Welt ist konstant `WORLD_WIDTH × WORLD_HEIGHT` = 1920 × 1080 Welteinheiten
(`gameConfig.js`). Der Renderer passt sie verzerrungsfrei ins Fenster ein — `scale`
= min(Fensterbreite/1920, Fensterhöhe/1080), zentriert, überschüssiger Platz wird Rand
(_contain fit_). Die Arithmetik dafür sitzt in `renderer/worldTransform.js`, importfrei und
damit unter Vitest prüfbar, genau wie `dashPulse.js` und `ui/frameGraphScale.js`. Angewandt
wird sie als **eine** `setTransform`: Welt → CSS-Pixel und CSS- → Gerätepixel sind beide
affin, ihre Komposition ist `setTransform(dpr·scale, 0, 0, dpr·scale, dpr·offsetX,
dpr·offsetY)`. `handleResize()` berührt nur noch Renderer und Frametime-Graph; ein
Fensterresize ist rein optisch.

**Verworfen:**

| Alternative                                                       | Grund der Ablehnung                                                                                                                                                                                                                                                                                          |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Welt = Fenster (Status quo)                                       | Der Monitor entscheidet über die Spielfläche. Ein 4K-Bildschirm sah mehr als die vierfache Welt eines Laptops, bekam über die kürzere Weltkante eine andere `safe_spawn_distance` und bei fixer Hindernisanzahl eine andere Dichte. Kein Balancewert bedeutet zweimal dasselbe, kein Score ist vergleichbar. |
| Welt = Fenster, dafür alle Simulationskonstanten mitskalieren     | Jede Länge in `constants.rs` und `gameConfig.js` müsste einen Skalenfaktor tragen, inklusive der Per-Boid-Werte in `BoidProperties`. Widerspricht „`constants.rs` hält Defaults" und macht Tuning unmöglich, weil kein Wert mehr für sich lesbar ist.                                                        |
| Cover-Fit: Welt füllt das Fenster, der Überstand wird beschnitten | Die Welt ist ein Torus, alles betritt die Arena **über eine Kante**. Ein beschnittener Rand verdeckt genau das Band, aus dem die nächste Bedrohung kommt — kein Optikkompromiss, sondern unfair.                                                                                                             |
| Mindest-Renderscale bzw. Clipping bei kleinen Fenstern            | Dieselbe Begründung wie Cover-Fit in kleinerer Verkleidung. Eine vollständig sichtbare kleine Welt ist einer normal großen, abgeschnittenen vorzuziehen.                                                                                                                                                     |
| Kamera, die dem Spieler folgt (Welt größer als das Fenster)       | Der größte Umbau: verlangt Sichtbarkeitslogik und eine Minimap, damit niemand von etwas getroffen wird, das er nie sehen konnte. Nicht im Budget von S-03 und ohne Not.                                                                                                                                      |
| Skalierung in jede Zeichenhilfe hineinrechnen                     | Jede Koordinate und jede `lineWidth` müsste multipliziert werden — fehleranfällig an dutzenden Stellen, und es bricht die `lineWidth`-Zusicherungen in `obstacleLayer.test.js`, die in Welteinheiten prüfen. Ein Kontext-Transform erledigt es an einer Stelle und lässt die Zeichenmodule unverändert.      |
| Das Canvas-Element verkleinern statt darin zu letterboxen         | Das Element ist die Bezugsfläche für HUD und CSS-Overlays (`position: fixed; inset: 0`). Ein geschrumpftes Canvas hätte Overlay-Positionierung, `main.css` und die E2E-Zusicherung „Canvas füllt das Fenster" gleichzeitig angefasst.                                                                        |
| `WORLD_WIDTH`/`WORLD_HEIGHT` zusätzlich in `constants.rs`         | Eine zweite Handsynchronisationspflicht wie bei `INITIAL_BOID_COUNT`, ohne Gewinn: die Engine bekommt die Weltgröße über `GameEngine::new()` übergeben, und die Rust-Tests benutzen ohnehin eigene Größen (1000×800, 1600×900).                                                                              |
| `GameEngine::resize()` als toten Code entfernen                   | Die Weltgrenzen gehören der Engine, nicht dem Browser. Die Methode trägt die einzige Zusicherung, dass eine schrumpfende Welt den Spieler nicht einsperrt (`obstacle_field.rs`, `wasm_tests.rs`). Stattdessen ist ihr Doc-Kommentar erweitert, damit sie nicht bei der nächsten Aufräumrunde fällt.          |
| Transparente Ränder statt in `--void` gemalter                    | `body` trägt `var(--arena)` — dieselbe Farbe wie der Arenaboden. Ein transparenter Rand wäre optisch nicht vom Spielfeld zu unterscheiden und die Weltkante bliebe genauso unsichtbar wie vorher.                                                                                                            |
| Grid auf 60/300 umstellen, damit es 1920 × 1080 exakt teilt       | Rein kosmetisch, verändert aber die etablierte Arena-Optik. Die angeschnittene letzte Reihe deckt die Weltkantenlinie ab.                                                                                                                                                                                    |

**Konsequenz:** Der Ablehnungsgrund vom 2026-07-29 für einen variablen Playwright-Viewport
(„die Weltgröße ist `window.innerWidth/Height`") gilt nicht mehr. Die 1280 × 720 bleiben
trotzdem fest, nur aus einem anderen Grund: der Viewport setzt jetzt den Renderscale
(0,667), und `obstacles.spec.js` zählt gezeichnete Pixel. Deren Schwelle ist deshalb von 400
auf 250 gesenkt — gemessen wurden am Preview-Build 628 Pixel in der Runde und 0 im Menü,
vorher lagen dort rund 1400. `letterbox.spec.js` überschreibt den Viewport bewusst auf
1400 × 720, weil bei exakt 16:9 keine Ränder existieren und ein Letterbox-Test dort nichts
zusichern würde. Die Balance ist in diesem Schritt **nicht** angefasst: der Sinn der festen
Welt ist, dass Werte endlich eindeutig sind, also gehört die erste Messung dahinter und
nicht hinein. `ui/menuBackdrop.js` bleibt absichtlich fenstergroß — es ist Dekoration ohne
Welt, und Void-Balken hinter dem Command Deck wären eine Regression, keine Kantenmarkierung.

→ Kap. 3, 4, 8

### 2026-07-30 — Der Menü-Schwarm ist eine Attrappe auf eigenem Canvas

**Gewählt:** `ui/menuBackdrop.js` zeichnet 72 Boids, die mit Sinus-Winkelrauschen driften
und an den Kanten wrappen — keine Steering-Regeln, keine Kollision, keine Engine. Es ist
Dekoration und behauptet nichts anderes. Der eigene Canvas liegt unter dem Overlay und
hinter `#game-canvas`; damit das durchscheint, zeichnet der Renderer im Menü nicht mehr
`emptyFrame`, sondern **leert** nur (`renderer.clear()`).

**Verworfen:**

| Alternative                                           | Grund der Ablehnung                                                                                                                                                                                                                                 |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Die echte Engine im Menü ohne Spieler laufen lassen   | Sähe besser aus und kostet: WASM müsste vor dem ersten Menübild geladen sein, die Wellenlogik liefe ohne Spieler weiter, und ein Menü, das man offen liegen lässt, würde Wellen hochzählen. Für einen Hintergrund ist das der falsche Preis.        |
| Boids-Regeln im Frontend nachbauen                    | Direkter Bruch der Projektinvariante „das Frontend enthält keine Simulationsmathematik". Driften ist keine Simulation, Separation/Alignment/Cohesion wären eine — und dann gäbe es zwei Schwarmimplementierungen, von denen eine nie getestet wird. |
| Auf `#game-canvas` mitzeichnen                        | Der Canvas gehört dem Renderer. Ein geteilter Canvas müsste beim Rundenstart aufgeräumt werden, und die Zuständigkeit „wer hat dieses Pixel gemalt" wäre nicht mehr beantwortbar.                                                                   |
| `#game-canvas` im Menü per `display: none` ausblenden | Kürzer als ein `clear()`, aber `boot.spec.js` prüft (zu Recht), dass der Canvas nach dem Start sichtbar ist. Ein leerer sichtbarer Canvas ist ohnehin die ehrlichere Beschreibung des Zustands: Er ist da, er hat nur nichts zu zeigen.             |

**Konsequenz:** `emptyFrame` in `index.js` ist damit überflüssig geworden und entfernt —
den einzigen Grund für seine Existenz (ein Frame, das nichts enthält, damit der Renderer
im Menü etwas zu zeichnen hat) gibt es nicht mehr. Der Backdrop nutzt denselben
Integer-Hash wie der Rest des Projekts, damit auch hier keine `rand`-Abhängigkeit
hereinkommt und der Hintergrund bei gleicher Fenstergröße gleich aussieht.

→ Kap. 5, 7

### 2026-07-30 — Der Speicherzugriff wird hereingegeben, nicht importiert

**Gewählt:** `round/roundRecords.js` nimmt den Storage als Parameter
(`readRecords(storage = localStorage)`), statt selbst auf `localStorage` zuzugreifen. Damit
ist das Modul unter Vitest im `node`-Environment prüfbar — ein Map-gestütztes Objekt genügt
als Attrappe — und `roundData.js` bleibt weiter browserfrei, wie es die Trennung von
Rundenlogik und Umgebung vorsieht. Jeder Zugriff ist zusätzlich in `try`/`catch` gefasst:
Ein Profil im privaten Modus kann ein `localStorage` haben, das beim Schreiben wirft, und
eine von Hand editierte Zahl darf nicht als `NaN` im Menü landen. Ein Fehler heißt „kein
Rekord" und sonst nichts.

**Verworfen:**

| Alternative                                          | Grund der Ablehnung                                                                                                                                                                                                                 |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Direkt `localStorage` importieren und in E2E prüfen  | Die interessante Hälfte dieses Moduls ist nicht der Normalfall, sondern der defekte Eintrag und der verweigerte Zugriff. Beides in Playwright zu erzeugen kostet mehr Aufwand als das ganze Modul und läuft zwei Minuten langsamer. |
| Die Rekorde in `roundData.js` mitführen              | `roundData` ist reine Rundenarithmetik und hat keinen Bezug zu einer Sitzung darüber hinaus. Ein Storage-Zugriff darin hätte die Testbarkeit des gesamten Moduls an eine Browser-API gehängt.                                       |
| Ungültige Werte tolerieren und beim Rendern abfangen | Dann müsste jede Anzeigestelle prüfen. Die Grenzkontrolle sitzt an der Systemgrenze: Was `readRecords` verlässt, ist entweder ein vollständiger Lauf oder `null`.                                                                   |

**Konsequenz:** `recordRound` gibt die Rekorde nach dem Schreiben zurück, damit die
Game-Over-Karte den Rekord **inklusive** der gerade beendeten Runde zeigt — ein Lauf, der
den Rekord gerade gesetzt hat, muss ihn sehen. Der Datensatz trägt vier Werte statt drei:
Die Statzeile zeigt neben Welle und Zeit auch die Schwarmgröße, und die aus dem Nichts
gezeigte Null wäre eine erfundene Zahl gewesen.

→ Kap. 5, 8

### 2026-07-30 — Hinter der Game-Over-Karte steht der eingefrorene letzte Frame

**Gewählt:** Im Zustand `GAME_OVER` zeichnet der Renderer weiter `gameData.currentFrame`,
und die Karte legt ihren eigenen Scrim (`rgba(11,13,18,.82)`) darüber. Sichtbar bleibt genau
die Situation, in der man gestorben ist. Das Designsystem beschreibt an dieser Stelle einen
weiterlaufenden Schwarm; er läuft aber nicht weiter — die Simulation hält beim Tod an, und
das Bild sagt das lieber, als eine Bewegung zu behaupten, die es nicht gibt.

**Verworfen:**

| Alternative                                         | Grund der Ablehnung                                                                                                                                                                                    |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Den Menü-Backdrop auch über Game Over laufen lassen | Bewegung hinter der Karte, aber es wäre ein anderer, gefälschter Schwarm als der, der einen gerade getötet hat. Eine Animation, die etwas Falsches behauptet, ist schlechter als ein wahres Stillbild. |
| Wie bisher `emptyFrame` zeichnen                    | Der billigste Weg und der ausdruckloseste: Der Grund der Niederlage verschwindet in dem Moment, in dem man ihn ansehen möchte.                                                                         |
| Die Simulation im Hintergrund weiterlaufen lassen   | Sie würde ohne Spieler weiterrechnen, Wellen hochzählen und Hindernisse verwalten, während niemand spielt. Rechenzeit und Zustandsänderungen für eine Hintergrunddekoration.                           |

**Konsequenz:** `showStartMenu` schaltet den Zustand ausdrücklich auf `MENU` zurück. Ohne
das blieb er nach „Main Menu" auf `GAME_OVER` stehen, und der eingefrorene Frame stand auch
hinter dem Startmenü — genau der Fehler, der beim ersten Durchspielen sichtbar wurde.

→ Kap. 5, 7

### 2026-07-30 — Eine Optionsgruppe existiert immer nur an einer Stelle

**Gewählt:** Das Command Deck hat eine Ansicht pro Menüpunkt, und jede Ansicht rendert das
gesamte Overlay neu. Ein Untermenü holt seine Optionsgruppe in die linke Spalte und
**nimmt sie dabei aus dem rechten Panel-Stack heraus** (`_renderAside` zeigt, was die linke
Spalte nicht zeigt). Damit steht jede Gruppen-`id` zu jedem Zeitpunkt genau einmal im
Dokument — `bindOptionGroup` findet seine Gruppe über `getElementById`, und zwei Kopien
hätten eine davon stumm gelassen. Eine E2E-Zusicherung nagelt das fest.

**Verworfen:**

| Alternative                                                        | Grund der Ablehnung                                                                                                                                                                                                 |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gruppe doppelt rendern und `bindOptionGroup` auf Klassen umstellen | Zwei sichtbare Kopien derselben Einstellung müssten synchron gehalten werden, inklusive `aria-pressed`. Der Zustand liegt in `index.js`, nicht im DOM — zwei Ansichten desselben Zustands wären zwei Fehlerquellen. |
| Ansichten vorrendern und per CSS ein-/ausblenden                   | Alle `id`s existierten gleichzeitig, und versteckte Bedienelemente bleiben ohne `inert` per Tab erreichbar. Das Neurendern kostet nichts: es passiert bei einem Tastendruck, nicht pro Frame.                       |
| Untermenüs als Modal über dem Deck                                 | Ein zweiter Screen-Typ mit eigener Fokusfalle, für dieselbe Information. Das Deck hat freie Fläche links, sobald der Titel weicht.                                                                                  |

**Konsequenz:** Nach jedem Rendern werden Zeilen und Gruppen neu gebunden; `_bindGroup`
prüft deshalb, ob die Gruppe in dieser Ansicht überhaupt existiert. Die Tastaturnavigation
hängt dagegen **am Fenster** und nicht am Overlay: Beim Ansichtswechsel verschwindet das
fokussierte Element, der Fokus fällt für einen Moment auf `<body>`, und ein Listener am
Overlay hätte danach kein Escape mehr gesehen. Genau dieser Fehler trat beim ersten
Durchlauf auf. Sichtbarkeit ist die Bedingung, unter der der Listener zugreift.

→ Kap. 5, 7

### 2026-07-30 — Bewegungstasten gehören nur einer laufenden Runde

**Gewählt:** `InputManager` schluckt WASD und die Pfeiltasten nur noch bei
`_gameplayActive`. Vorher tat er es unbedingt und auf Fensterebene — deshalb stand in
`optionGroup.js` der Kommentar, dass eine `radiogroup` im Menü kaputt wäre. Die Menüliste
verspricht im Footer „↑↓ navigate"; das Versprechen ist nur haltbar, wenn die Tasten dort
nicht abgefangen werden. `setGameplayActive(false)` leert zusätzlich die gedrückten Tasten.

**Verworfen:**

| Alternative                                          | Grund der Ablehnung                                                                                                                                                                                        |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Menü-Navigation vor dem InputManager registrieren    | Reihenfolge von Listenern als Architektur: Beide würden dieselbe Taste sehen, und wer zuerst registriert wurde, entscheidet. Beim nächsten Umbau der Bootstrap-Reihenfolge wäre es stillschweigend kaputt. |
| Nur die Pfeiltasten freigeben, WASD weiter schlucken | WASD im Menü zu schlucken hat keinen Nutzen, den die Freigabe nicht auch hätte, und die Asymmetrie müsste man erklären. Der Spielzustand ist die richtige Grenze, nicht die Tastenmenge.                   |
| `keyup` ebenfalls an die Runde binden                | Genau der Bug, der dabei entsteht: Eine beim Rundenende gehaltene Taste würde nie freigegeben und in der nächsten Runde als gedrückt gelten. `keyup` räumt deshalb immer auf.                              |

**Konsequenz:** Der `blur`-Pfad und `setGameplayActive(false)` machen jetzt dasselbe, und
das ist beabsichtigt: beides sind Momente, in denen niemand mehr steuert.

→ Kap. 5, 7

### 2026-07-30 — Die Dash-Bar wandert vom Canvas ins DOM

**Gewählt:** `drawDashCooldown` verlässt `canvasRenderer.js`; die Bar ist jetzt ein
`div.dash-bar` mit Füllung und Textzeile im HUD. Der Grund ist die Textzeile: Sie stand pro
gezeichnetem Frame neu im Canvas, also bis zu 120-mal pro Sekunde für einen String, der sich
zweimal pro Runde ändert. Im DOM rastert der Browser sie einmal und schreibt danach nur noch
`style.width` der Füllung. Der Zustand „bereit" trägt zusätzlich den Cyan-Glow — im Canvas
wäre das ein `shadowBlur` auf demselben heißen Pfad, im DOM ist es eine Klasse.

**Verworfen:**

| Alternative                                          | Grund der Ablehnung                                                                                                                                                                                                           |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Im Canvas lassen, nur die Farben tauschen            | Billigster Diff, behält aber die Neurasterung des Labels pro Frame und den Glow auf dem heißen Pfad. Das Designsystem nennt das DOM ausdrücklich als die vorzuziehende Variante, und der Grund ist messbar, nicht ästhetisch. |
| Nur das Label ins DOM, die Bar im Canvas             | Zwei Medien für ein Element, dessen Farbe und Text denselben Zustand ausdrücken. Sie würden bei einer Änderung auseinanderlaufen.                                                                                             |
| Den Dash-Zustand direkt aus `roundData` im HUD lesen | Das HUD hätte damit eine zweite Datenquelle neben dem Frame. `renderState` wird jetzt einmal pro Frame gebaut und an Renderer **und** HUD gegeben, damit beide innerhalb eines Frames dasselbe sagen.                         |

**Konsequenz:** `renderCurrentState` baut `renderState` einmal statt zweimal — die
Verzweigung „Runde läuft / Countdown" liegt jetzt in einem Ausdruck, und `hud.update`
bekommt denselben Wert wie `renderer.drawFrame`. Die Lebensanzeige bleibt im Canvas: Sie
klebt am Spieler, nicht am Bildschirmrand, und müsste im DOM pro Frame positioniert werden.

→ Kap. 5, 7

### 2026-07-30 — Die Schraffur fällt unter Node auf die Körperfarbe zurück

**Gewählt:** `hatch(ctx)` prüft `typeof document === 'undefined'` und ob der Kontext
`createPattern` überhaupt anbietet; fehlt eines von beidem, liefert die Funktion die
einfarbige Körperfarbe zurück. Das Handoff-Modul selbst hätte die Unit-Suite zerlegt: Sie
läuft im `node`-Environment und gibt einen aufzeichnenden Stub statt eines echten Kontexts
herein, es gibt dort also weder ein `document` für das Muster-Tile noch ein
`createPattern`. Der Rückfall macht die eine nicht prüfbare Eigenschaft (das Muster)
unsichtbar und lässt alles Prüfbare (Geometrie, Phasenfarben, Deckkraft) messbar.

**Verworfen:**

| Alternative                                     | Grund der Ablehnung                                                                                                                                                                                             |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vitest für diese Datei auf `jsdom` umstellen    | Ein Environment-Wechsel für eine Datei, und `jsdom` implementiert `canvas` ohnehin nicht ohne die native `canvas`-Abhängigkeit — es wäre eine neue Build-Abhängigkeit für ein Muster, das man nur ansehen kann. |
| `createPattern` im Stub nachbauen               | Der Stub müsste ein Objekt liefern, über das keine Zusicherung möglich ist. Der Test würde die Existenz einer Attrappe prüfen, nicht das Verhalten des Moduls.                                                  |
| Den Schraffur-Stroke in ein eigenes Modul lösen | Trennt zwei Striche derselben Kapsel auf zwei Dateien, obwohl sie dieselbe Geometrie und dieselbe Deckkraft teilen. Die Grenze läge dann an der Testbarkeit statt an der Zuständigkeit.                         |

**Konsequenz:** Der Stub zeichnet jetzt zusätzlich `globalAlpha` mit auf, weil die Deckkraft
des Körpers seit dem Muster nicht mehr im Farbstring steckt — ein Muster trägt keine
Deckkraft, also übernimmt `globalAlpha` das Ein- und Ausblenden für genau diesen Stroke.
Eine neue Zusicherung hält fest, dass er danach wieder auf 1 steht: Boids und Spieler
werden direkt nach dieser Schicht gezeichnet und wären sonst mitgedimmt. Die Pixel-Sonde
des E2E-Tests prüft weiter, ob überhaupt eine große Slate-Fläche existiert; ihre Zielfarbe
ist auf `#2A313F` gezogen und am laufenden Build gemessen (rund 1950 Pixel gegen eine
Schwelle von 400), damit die Schwelle nicht stillschweigend gerissen wird.

→ Kap. 5, 8

### 2026-07-30 — Die Schriften liegen im Repository, nicht auf einem Font-CDN

**Gewählt:** Space Grotesk und JetBrains Mono liegen als variable Latin-Subsets in
`frontend/public/fonts/` (zusammen 54 kB), eingebunden über zwei `@font-face`-Regeln am Kopf
von `tokens.css`. Ein variables File pro Familie deckt die Gewichte 400 bis 700 ab, es
braucht also keine sieben Einzeldateien. Die Lizenztexte (SIL OFL 1.1) liegen daneben.

**Verworfen:**

| Alternative                                        | Grund der Ablehnung                                                                                                                                                                                                                                                                                           |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<link>` auf `fonts.googleapis.com` (Handoff-Weg)  | Widerspricht der Anforderung „installationslos und serverlos": ohne Netz fällt die gesamte Typografie auf eine System-Serifenlose zurück, und das Menü ist das Erste, was gezeichnet wird. Zusätzlich hätte der Boot-E2E-Test, der fehlgeschlagene Requests sammelt, offline rot geleuchtet.                  |
| Alle sieben statischen Gewichte einzeln ausliefern | Sieben Requests und ~150 kB für dasselbe Ergebnis. Die variablen Dateien liefern jeden Wert zwischen 400 und 700, und das System nutzt genau vier davon.                                                                                                                                                      |
| Zusätzlich das Latin-Ext-Subset mitnehmen          | Die Oberfläche ist einsprachig englisch; kein Zeichen daraus kommt vor. Die im UI verwendeten Pfeile `↑↓` liegen im Latin-Subset, `→` und `←` in keinem der Google-Subsets — sie kommen deshalb aus der System-Schrift, was bei einem einzelnen Glyph als Marker nicht auffällt und keine Datei rechtfertigt. |

**Konsequenz:** Die Font-URLs sind wurzelabsolut (`/fonts/...`), weil so eine Datei unter
`public/` adressiert wird. Wird das Spiel je unter einem Unterpfad ausgeliefert (T-06,
GitHub Pages), müssen genau diese zwei URLs den Base-Präfix bekommen — Vite schreibt
absolute URLs innerhalb von CSS nicht um. Der Kommentar an der Regel sagt das.

→ Kap. 5, 7

### 2026-07-30 — Die Handoff-CSS wird in fünf Stylesheets nach Zuständigkeit geteilt

**Gewählt:** Die 793 Zeilen der `tokens.css` aus dem Designsystem-Handoff wandern nicht als
eine Datei ins Projekt, sondern als `tokens.css` (nur die Variablen), `components.css`
(wiederverwendbare Bausteine), `menu.css`, `hud.css` und das bestehende `main.css`
(Reset, Vollbildschichten, Positionsklassen). Die Reihenfolge im `<head>` ist tragend:
`tokens` zuerst, weil alles andere seine Variablen liest, `main` zuletzt, damit die
Positionsklassen über jeder Komponentenregel liegen. Die 400-Zeilen-Regel aus `CLAUDE.md`
nennt Rust, JS und Tests ausdrücklich, nicht CSS — sie wird hier trotzdem angewandt, weil
ihr Zweck (eine Datei, ein Thema) für ein Stylesheet genauso gilt.

**Verworfen:**

| Alternative                                | Grund der Ablehnung                                                                                                                                                                                                                                              |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Die Handoff-Datei unverändert übernehmen   | Sie behauptet in ihrem eigenen README, alle Dateien blieben unter 400 Zeilen, und ist mit 793 die längste Quelldatei des Projekts geworden. Eine Ausnahme genau dort, wo die Regel am leichtesten einzuhalten ist, hätte sie für alle anderen Dateien entwertet. |
| Alles in `main.css` einarbeiten            | Dann wäre der Bestand nicht mehr vom Neuen zu unterscheiden. Der Zwischenzustand ist explizit gewollt: Die alten `.menu-panel`-Regeln stehen bis zum Menü-Umbau weiter in `main.css`, sichtbar als Übergangsblock, und verschwinden in einem einzigen Commit.    |
| Ein `@import` in `main.css` statt `<link>` | Ein `@import` blockiert das Rendering, bis die importierte Datei geladen ist, und serialisiert damit fünf Requests, die der Browser über `<link>` parallel holt. Aus demselben Grund liegen später auch die `@font-face`-Regeln als Datei, nicht als Import.     |

**Konsequenz:** Wer eine Farbe ändert, ändert sie in `tokens.css` und nirgends sonst; ein
Literal in einer der anderen vier Dateien ist ab jetzt ein Fehler, den man beim Lesen sieht.
Zwei Werte bleiben bewusst doppelt: `--grid-line` und `--grid-line-major` stehen zusätzlich in
`canvasRenderer.js`, weil ein Canvas keine Custom Property lesen kann. Beide Stellen tragen
einen Kommentar, der auf die andere zeigt — dasselbe Muster wie bei `INITIAL_BOID_COUNT`.

→ Kap. 5, 7

### 2026-07-30 — Der Spieler wird vor die Oberfläche gesetzt, nicht auf sie

**Gewählt:** Ein blockierter Spieler landet `PLAYER_OBSTACLE_KNOCKBACK_DISTANCE` (8 px)
**außerhalb** der um seinen Radius aufgeblasenen Kapsel, und zwar auf der Seite, von der er
kam. Der Abstand ist damit kein Kosmetikwert, sondern die Invariante des Fixes: Solange der
Spieler nach einer Kollision echten Abstand hat, kann der Test des nächsten Schritts eine
Bewegung vom Hindernis weg nicht mehr als Berührung lesen. Derselbe Schub liefert
gleichzeitig den vom Gameplay gewünschten Rückstoß, das Frontend dreht dazu nur noch die
Normalkomponente der Geschwindigkeit zu 35 % um.

**Verworfen:**

| Alternative                                                                | Grund der Ablehnung                                                                                                                                                                                                                                                            |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Epsilon im Kollisionstest (`swept_distance >= radius + player_radius - ε`) | Behandelt das Symptom an der falschen Stelle: Der Test würde toleranter, der Spieler stünde weiter exakt auf der Oberfläche, und die richtige Größe von ε hinge von der Schrittweite ab. Ein sichtbarer Abstand ist prüfbar, eine Toleranz im Vergleich ist nur unauffälliger. |
| Erste Kontaktstelle entlang der Bewegung analytisch bestimmen (Ray/Kapsel) | Die exakte Lösung, und für dieses Spiel die falsche: quadratische Gleichung plus Fallunterscheidung für die beiden Endkappen, in einem Projekt, dessen erste Regel Lesbarkeit für Rust-Anfänger ist. Der Gewinn wäre ein um wenige Pixel genauerer Stopp-Punkt.                |
| Kollision nur über den Endpunkt prüfen, dafür ohne Sonderfall              | Genau der Punkttest, gegen den der Streckentest existiert: Ein Dash überspringt inzwischen deutlich mehr als die dünnsten Hindernisse breit sind und wäre wieder durchgetunnelt.                                                                                               |

**Konsequenz:** Die Fallunterscheidung „endete innen / hat durchtunnelt" in
`resolve_player_movement` entfällt — beide Fälle werden gleich behandelt, weil die Seite der
_Herkunft_ die Richtung bestimmt und nicht die Lage des Endpunkts. Die Funktion ist damit
kürzer als vor dem Fix. Der Wert muss deutlich unter `MINIMUM_CORRIDOR_WIDTH` (80 px)
bleiben, sonst könnte der Schub aus einem Hindernis in das nächste führen; bei 8 px gegen 80
ist der Abstand zu dieser Grenze so groß, dass er keine eigene Zusicherung braucht.

→ Kap. 4, 5

### 2026-07-30 — Das rote Aufleuchten reist als Zahl im Hindernis-Buffer

**Gewählt:** `Obstacle` bekommt ein `hit_flash_steps`, das bei einem Treffer auf
`OBSTACLE_HIT_FLASH_STEPS` gesetzt und im normalen Altern mit heruntergezählt wird; der
Buffer wächst von sechs auf sieben Werte je Hindernis. `resolve_player_movement` bleibt
lesend und meldet nur den **Index** des getroffenen Hindernisses zurück, markiert wird im
`wasm_bridge`.

**Verworfen:**

| Alternative                                                      | Grund der Ablehnung                                                                                                                                                                                                          |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Flash-Zustand im Frontend halten (Trefferzeit + Position merken) | Das Frontend müsste Hindernisse über Frames hinweg identifizieren, obwohl der Buffer keine IDs trägt und die Reihenfolge sich beim Ablaufen verschiebt. Es wäre eine Zuordnung, die die Engine ohne Zusatzaufwand schon hat. |
| Eigener Buffer nur für den Flash                                 | Ein sechster Buffer für eine Zahl je Hindernis, gegen die Regel „Schnittstelle minimal halten". `life_fraction` und `dash_phases` zeigen das Muster: ein Renderzustand, eine Zahl, im vorhandenen Buffer.                    |
| `&mut [Obstacle]` an die Kollisionsauflösung übergeben           | Die Funktion ist ein Geometrietest und ihre Tests leben davon, dass sie nichts verändert. Ein `Option<usize>` im Rückgabewert kostet nichts und lässt das Markieren dort, wo die Feldverwaltung sowieso liegt.               |

**Konsequenz:** Die Markierung muss **vor** `ObstacleField::update` passieren, weil dort
abgelaufene Hindernisse aus dem `Vec` entfernt werden und der Index danach auf ein anderes
Hindernis zeigen würde. Ein wiederholter Treffer setzt den Zähler neu, damit ein am
Hindernis lehnender Spieler ein durchgehendes Leuchten sieht statt eines Flackerns.

→ Kap. 4, 5

### 2026-07-30 — Der Gruppendash entsteht aus einem Anführer, nicht aus einer eigenen Verbandslogik

**Gewählt:** Die Auswahl würfelt weiter genau **einen** Boid über die bestehende
Integer-Hash-Arithmetik. Dieser Boid ist der Anführer; ein zweiter, rein deterministischer
Durchlauf sammelt danach seine Nachbarn desselben Tiers innerhalb von
`DASH_GROUP_RADIUS` auf, bis `MAX_DASH_GROUP_SIZE` oder die freien Slots erschöpft sind.
Der Einzeldash ist damit der Randfall der Gruppe — die leere Nachbarschaft — und kein
zweiter Codepfad.

**Verworfen:**

| Alternative                                                        | Grund der Ablehnung                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Clusteranalyse über den ganzen Schwarm, dann bestes Cluster wählen | O(n²) mit deutlich größerer Konstante pro Selektionsrunde, und die Determinismus-Zusicherung müsste für einen ganzen Algorithmus statt für eine Schleife gelten. Der Gewinn wäre eine Gruppenqualität, die der Spieler bei vier Boids nicht unterscheiden kann. |
| Gruppen-Zustand auf dem Boid (`dash_group_id`)                     | Ein vierter Dash-Zustand neben `dash_state`, `dash_state_steps_remaining` und den Properties, den niemand liest: nach `begin_dash_charge` verhält sich jedes Gruppenmitglied wieder für sich. Zustand, der nichts entscheidet, kann nur inkonsistent werden.    |
| Mehrere unabhängige Würfe pro Selektionsrunde statt einer Gruppe   | Ergibt gleichzeitige, aber räumlich verstreute Dashes — mehr Druck ohne den lesbaren Stoß, um den es geht. Es wäre nur die Frequenzerhöhung unter anderem Namen.                                                                                                |

**Konsequenz:** `select_dash_group` gibt einen `Vec<usize>` zurück statt eines
`Option<usize>`. Auf Schritten ohne Selektionsrunde ist das ein `Vec::new()`, das nicht
allokiert; allokiert wird höchstens alle 24 Schritte. Der Tier-Vergleich ist dabei nicht
nur Optik: Boids eines Tiers teilen ihre `charge_steps`, die Gruppe pulst also synchron
und startet im selben Simulationsschritt — mit gemischten Tiers wäre der „Stoß" ein
Nachtröpfeln. Zweite Konsequenz: Die Slot-Grenze musste von 3 auf 8 steigen, sonst hätte
eine einzige Gruppe jeden weiteren Dash für fünf Sekunden blockiert; die Frequenzerhöhung
(40 → 24 Schritte) fällt damit in dieselbe Entscheidung, weil beide Zahlen nur zusammen
ein sinnvolles Bild ergeben.

→ Kap. 4, 5

### 2026-07-30 — Ein Hindernis ist eine Kapsel, kein Aufzählungstyp mit zwei Formen

**Gewählt:** `Obstacle { spine_start, spine_end, radius }` — eine Mittellinie, überstrichen
von einem Kreis. Ein kreisförmiges Hindernis ist die entartete Kapsel, deren Mittellinie
die Länge null hat. Beide geforderten Formen entstehen damit beim Spawn, nicht im
Typsystem.

**Verworfen:**

| Alternative                               | Grund der Ablehnung                                                                                                                                                                                                         |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enum ObstacleKind { Circle, Segment }`   | Zwei Distanzfunktionen, zwei Kollisionstests und zwei Zeichenpfade, die auseinanderlaufen können. Genau die Sorte Duplikat, bei der ein Fehler nur in einer der beiden Formen auftritt und deshalb lange unentdeckt bleibt. |
| Nur Kreise, Striche als Kette von Kreisen | Vielfache Kollisionsprüfungen pro Strich, und die Overlap-Regel zwischen Hindernissen wäre nicht mehr formulierbar, weil ein „Hindernis" dann kein einzelnes Objekt mehr ist.                                               |

**Konsequenz:** `closest_point_on_segment` liefert für eine Nulllängen-Strecke ihren
Startpunkt, womit der Kreisfall ohne Verzweigung aus derselben Formel fällt. Im Frontend
zeichnet ein runder Linienabschluss auf einer Nulllängen-Linie exakt einen Kreis, also
kommt der Renderbuffer ohne Formkennzeichen aus und das Frontend ohne Fallunterscheidung.
Preis: Ein einzelner Punkt auf der Mittellinie hat keine definierte Normale und braucht
eine Ersatzrichtung — dieselbe Krücke, die die Overlap-Relaxation schon benutzt.

→ Kap. 4, 5

### 2026-07-30 — Sackgassenfreiheit konstruktiv erzwingen statt zur Laufzeit prüfen

**Gewählt:** Ein Spawn-Kandidat wird nur angenommen, wenn er zu jedem bestehenden
Hindernis, zu jeder der vier Weltkanten und zum Spieler mindestens
`MINIMUM_CORRIDOR_WIDTH` Oberflächenabstand hält. Aufgeblasen um den Spielerradius ist
damit jedes Hindernis eine konvexe Insel echt im Inneren der Arena, die keine andere und
keine Wand berührt — und um eine solche Insel kann man immer herumlaufen. Ein Einschluss
bräuchte zwei sich berührende Hindernisse oder eines an einer Wand; beides ist
ausgeschlossen. Die Ungleichung, auf der das ruht, wird zur Übersetzungszeit geprüft
(`const _: () = assert!(...)`), nicht in einem Test.

**Verworfen:**

| Alternative                                        | Grund der Ablehnung                                                                                                                                                                                                                        |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Erreichbarkeitssuche (Flood Fill) nach jedem Spawn | Kosten pro Spawn im Gitterraster der ganzen Arena, und die Aussage wäre nur so gut wie die Gitterauflösung. Vor allem aber wäre sie nicht mehr _beweisbar_, sondern nur noch gemessen — für einen Bericht die deutlich schwächere Aussage. |
| Hindernisse nur an festen Rasterplätzen zulassen   | Löst das Problem, nimmt aber die freie Platzierung und damit den Reiz. Außerdem verschiebt es die Invariante in eine Tabelle, in der man sie nicht mehr nachlesen kann.                                                                    |
| Den Spieler bei Einschluss einfach durchlassen     | Behebt das Symptom, hebelt aber die Kollision auf und ist im Bericht nicht als Eigenschaft formulierbar.                                                                                                                                   |

**Konsequenz:** Die Dichte ist ein **Ziel**, die Invariante ist **hart**. Findet der
Spawn in seinen Versuchen keinen zulässigen Platz, erscheint in dieser Runde kein
Hindernis — bei kleinen Fenstern und hoher Welle begrenzt daher die Fläche die Zahl
gleichzeitig sichtbarer Hindernisse, nicht die Rampe. Der zugehörige Test prüft deshalb
nicht die exakte Sollzahl, sondern dass die Welt sich merklich füllt; die Sollzahl zu
verlangen hieße zu behaupten, der Platz gehe nie aus. Ein verkleinertes Fenster löscht
jedes Hindernis, das die Regel gegen die neuen Grenzen bricht.

→ Kap. 4

### 2026-07-30 — Hindernisse leben in der Engine, nicht im Frontend

**Gewählt:** `GameEngine` besitzt Geometrie, Spawn, Lebensdauer, Boid-Ausweichen und die
Auflösung der Spielerbewegung. Das Frontend zeichnet und zieht ein Leben ab. `tick`
bekommt dafür die vorige **und** die versuchte Spielerposition und liefert die korrigierte
Position, ein Trefferflag und die Oberflächennormale zurück; ein fünfter, flacher Buffer
transportiert die Hindernisse zum Zeichnen.

**Verworfen:** Die Hindernisse im Frontend zu halten und ihre Geometrie pro Tick in die
Engine zu schicken, damit die Boids ausweichen können. Das hätte dieselbe Geometrie auf
beiden Seiten der Sprachgrenze gebraucht — und damit zwei Kollisionstests, die sich
unterscheiden können, obwohl Spieler und Boids gegen dasselbe Hindernis prüfen müssen.
Zudem verbietet die Projektinvariante Simulationsmathematik im Frontend.

**Konsequenz:** Der Buffer-Vertrag wächst zum ersten Mal seit seiner Einführung, und
`tick` ist nicht mehr symmetrisch — der Aufrufer muss die zurückgegebene Position
benutzen statt der, die er angefragt hat. Weil die Bewegung als **Strecke** und nicht als
Endpunkt geprüft wird, kann auch ein Dash nicht mehr zwischen zwei Schritten durch ein
dünnes Hindernis tunneln. Im Frontend bleibt nur das Abziehen einer Vektorkomponente
(`applyObstacleBlock`), was das Abgleiten erzeugt.

→ Kap. 4, 5

### 2026-07-30 — Eigene Dichte-Stufe für Hindernisse bis 8 statt der Boid-Stufe bis 4

**Gewählt:** `MAX_OBSTACLE_DENSITY_TIER = 8`, unabhängig von
`MAX_BOID_DIFFICULTY_TIER = 4`. Das Ausweichgewicht der Boids bleibt dagegen über alle
Stufen konstant.

**Verworfen:** Die bestehende Boid-Stufe mitzubenutzen. Sie ist ab Welle 5 am Anschlag,
die Anforderung an die Hindernisse lautet aber „über das Spiel hinweg steigend" — die
Dichte hätte also nach knapp zweieinhalb Minuten aufgehört zu wachsen. Ebenfalls
verworfen: das Ausweichgewicht mit der Stufe zu erhöhen. Ausweichen ist Kompetenz, nicht
Schwierigkeit; ein späterer Boid, der schlechter ausweicht, sieht kaputt aus und nicht
schwerer. Die Schwierigkeit steckt in der Dichte.

**Konsequenz:** Zwei Rampen mit unterschiedlicher Länge im selben Projekt, was ohne
Begründung wie ein Versehen aussieht — daher dieser Block und der Kommentar an der
Konstante.

→ Kap. 4

### 2026-07-30 — Dash-Reichweite über den Abbau, nicht über die Antrittsgeschwindigkeit

**Gewählt:** Die geforderten +30 % Reichweite kommen aus `PLAYER_DASH_SPEED_DECAY`
(3000 → 2300); `PLAYER_DASH_SPEED` bleibt bei 1100. Die Überschussdistanz ist die Fläche
unter der abfallenden Rampe über der normalen Höchstgeschwindigkeit, also
`(1100 − 360)² / (2 · decay)` — ein um den Faktor 1,3 kleinerer Abbau ergibt exakt eine um
1,3 größere Distanz, bei unveränderter Spitzengeschwindigkeit und einer Rampe von 0,25 s auf
0,32 s.

**Verworfen:**

| Alternative                            | Grund der Ablehnung                                                                                                                                                                                                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `PLAYER_DASH_SPEED` auf ≈ 1205 erhöhen | Die Distanz wächst nur mit dem Quadrat der Rampe, der Antritt also mit √1,3. Das erhöht die Spitzengeschwindigkeit und damit die Strecke, die der Spieler pro Simulationsschritt zurücklegt — und genau die entscheidet später, ob er durch ein dünnes Hindernis tunneln kann. |
| Beide Konstanten anteilig verschieben  | Zwei gleichzeitig geänderte Werte für eine Anforderung; die Wirkung wäre nicht mehr einer Ursache zuzuordnen und die Rechnung im JSDoc nicht mehr nachvollziehbar.                                                                                                             |

**Konsequenz:** Der Dash fühlt sich im Moment des Antritts identisch an und trägt trotzdem
gut drei Gitterzellen statt knapp zweieinhalb. Der Test in `playerController.test.js` nagelt
jetzt zusätzlich die _Distanz_ fest, nicht nur die Geschwindigkeit im Startschritt — er
rechnet die Rampenfläche aus den Konstanten nach und klammert sie, weil die
Schrittintegration die kontinuierliche Fläche systematisch um wenige Prozent unterschreitet.

→ Kap. 3, 4

### 2026-07-30 — Musterdokumentation als Markdown-Referenz statt als PDF-Quelle

**Gewählt:** Der Inhalt der Musterdokumentation liegt aufbereitet in
`documentation/muster-referenz.md` — Kapitelaufbau mit Detailtiefe, eine Stilanalyse
(Sprachebene, Fettdruck-/Kursiv-Konvention, Argumentationsmuster), das Kapitel-Mapping
Muster → eigener Bericht und elf Arbeitsregeln fürs Schreiben. `CLAUDE.md` und
[00-index.md](00-index.md) verweisen darauf; das PDF bleibt als Original daneben liegen.

**Verworfen:**

| Alternative                                     | Grund der Ablehnung                                                                                                                                                                                                       |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Das PDF pro Sitzung neu auslesen                | Der Textlayer ist unvollständig; Tabellen, Formeln und das KI-Verzeichnis kamen nur teilweise durch. Die Auswertung wäre bei jeder Sitzung anders ausgefallen — genau die Instabilität, die ein Vorbild nicht haben darf. |
| Nur eine Stil-Checkliste ohne Inhaltstranskript | Ohne den konkreten Aufbau je Kapitel fehlt der Maßstab für die Detailtiefe. Dass Kap. 3 zehn Seiten hat und Kap. 2 eine einzige, ist die eigentliche Information.                                                         |
| Die Regeln direkt in `CLAUDE.md` schreiben      | `CLAUDE.md` steuert die Entwicklung und wird in jeder Sitzung geladen. Eine mehrseitige Stilanalyse gehört dorthin, wo der Bericht entsteht; in `CLAUDE.md` steht nur der Verweis.                                        |

**Konsequenz:** Der Bericht hat ab jetzt einen prüfbaren Maßstab statt einer
Erinnerung. Zwei Punkte aus der Analyse wirken unmittelbar auf die Kapitelplanung: Das
Muster lagert fast die Hälfte seines Umfangs (15 von 38 Inhaltsseiten) in den Anhang
aus — das Seitenbudget in Kap. 00 ist damit weniger eng als angenommen, sofern Tabellen
und Listings konsequent nach [11-anhang.md](11-anhang.md) wandern. Und das Muster
benennt seine Schwächen offen (fehlender Formatter, kein Production Build, 12,67 %
Gesamt-Coverage) und ordnet sie ein, statt sie zu verschweigen; das ist bei sehr guter
Bewertung erkennbar kein Versehen und rechtfertigt die hier ohnehin nötige Erklärung
der Coverage-Zahlen.

→ Kap. 8, 9, 10, 11

### 2026-07-29 — Dokumentation begleitend statt nachgelagert

**Gewählt:** Pro Änderung werden _Fakten_ in dieses Journal gesichert; die
Struktur-Kapitel (01–06) werden in wenigen zusammenhängenden Sitzungen geschrieben.
Nur Kapitel 07, 08 und 12 wachsen wirklich pro Commit.

**Verworfen:**

| Alternative                                     | Grund der Ablehnung                                                                                                                                                                                       |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alle Kapitel pro Commit fortschreiben           | Die Struktur-Kapitel beschreiben Aufbau. Bei laufendem Code-Churn — JSDoc-Pflicht und die 400-Zeilen-Regel erzwingen Datei-Splits — würde derselbe Absatz mehrfach neu geschrieben.                       |
| Dokumentation komplett am Ende                  | Genau der Fehler, den die Musterdokumentation in ihren _Lessons Learned_ selbst benennt. Verworfene Alternativen und Ist-Aufwände sind nach Wochen nicht mehr rekonstruierbar.                            |
| Fakten in die jeweiligen Kapiteldateien streuen | Eine Tatsache speist oft 2–3 Kapitel; die Ablage in genau einem Kapitel verliert sie für die anderen. Außerdem erzwingt das Schreiben deutscher Prosa mitten in der Implementierung einen Kontextwechsel. |

**Konsequenz:** Ein einziges Append-Ziel ohne Entscheidungsaufwand. Ein normaler
Commit kostet eine Tabellenzeile (~15 s), nur interessante Commits kosten einen
Absatz. Bekanntes Risiko: das Journal kann zur reinen Halde werden — dagegen der
`→ Kap. n`-Tag und `npm run docs:check`.

→ Kap. 6, 10

### 2026-07-29 — Tooling-Lücke nachziehen statt begründen

**Gewählt:** ESLint, Prettier, JSDoc-Enforcement, TypeScript-Prüfung über `checkJs`,
Coverage, E2E, CI/CD und GitHub-Pages-Deployment werden nachgezogen (T-01…T-06,
≈24 h) und dabei dokumentiert.

**Verworfen:** Den Ist-Zustand nur beschreiben. Der Anforderungskatalog verlangt
diese Werkzeuge namentlich in den Kapiteln _Tooling_ und _Qualität_, und „Linter &
Formatter aktiv und grün, hohe Testabdeckung" ist zusätzlich ein eigenes
Bewertungskriterium im Deliverable _Working Code_. Die Lücke kostet also zweifach.

**Konsequenz:** Gesamtbudget steigt auf ≈131 h und liegt über der verfügbaren
Kapazität. Gegenfinanzierung: Schild und Slow-Time aus S-05 entfallen bewusst.
Notausgang, falls die Kapazität dennoch nicht reicht: ein Werkzeug streichen und die
Absenz begründen — drei ehrliche Sätze kosten 10 min statt 4 h Setup plus einer Seite
Prosa.

→ Kap. 7, 8, 10

### 2026-07-29 — JSDoc-Pflicht über esquery-Kontexte statt `publicOnly`

**Gewählt:** `jsdoc/require-jsdoc` und alle Inhaltsregeln (`require-param`,
`require-param-type`, `require-returns` …) teilen **eine** Liste von
esquery-Selektoren (`JSDOC_REQUIRED_CONTEXTS` in `frontend/eslint.config.js`):
exportierte Funktionen und Klassen sowie öffentliche Methoden exportierter Klassen.
Ausgenommen bleiben einfache exportierte Konstanten, Unterstrich-Präfixe und
`*.test.js`.

**Verworfen:**

| Alternative                                                                 | Grund der Ablehnung                                                                                                                                                                                                                                                |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `publicOnly: true`                                                          | Unterscheidet nur exportiert/nicht exportiert und kennt die `_methode`-Konvention des Projekts nicht. Hätte `_startDash`, `_drawCurves` usw. wie öffentliche API behandelt und damit genau die Grenze verwischt, die der Unterstrich zieht.                        |
| Nur die Vorhandensein-Regel einschränken, Inhaltsregeln auf Standard lassen | Die Inhaltsregeln greifen dann auf _jede_ Funktion zu, die zufällig schon einen einzeiligen Prosa-Kommentar trägt — auch private und modulprivate. `--fix` schrieb dort leere `@param`-Zeilen hinein (siehe Herausforderungen).                                    |
| Legacy `.eslintrc` statt Flat Config                                        | Bei ESLint 9 nur noch über eine Kompatibilitätsschicht. Für eine neu angelegte Konfiguration gibt es keinen Grund, diese Schicht einzuziehen; `"type": "module"` ist ohnehin gesetzt.                                                                              |
| Strengere Sammel-Plugins (`unicorn`, `sonarjs`)                             | Optimieren auf idiomatisch-dichtes JavaScript und arbeiten damit direkt gegen die oberste Projektregel („`for`-Schleifen statt Iterator-Ketten", „ausgeschriebene Namen"). Ein Linter, der die Lesbarkeitsentscheidung anmeckert, wird abgeschaltet statt befolgt. |

**Konsequenz:** Die Regel prüft genau die Schnittstellen und lässt die
_Warum_-Kommentare im Blockinneren unangetastet — die bleiben eine menschliche
Urteilsfrage. Endstand fehler- **und** warnungsfrei, was `lint` erst als
CI-Gate (T-05) brauchbar macht. Nebennutzen: Weil `require-param-type` mit
aktiviert ist, liefern dieselben Blöcke später die Typinformation für `checkJs`
(T-02).

→ Kap. 7, 8

### 2026-07-29 — Prettier-Konfiguration an der Repository-Wurzel

**Gewählt:** `.prettierrc.json` und `.prettierignore` liegen im Wurzelverzeichnis,
die devDependency in `frontend/package.json`. `proseWrap: preserve`.

**Verworfen:**

| Alternative                                                                                           | Grund der Ablehnung                                                                                                                                                                                                                                                           |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Konfiguration in `frontend/`                                                                          | Prettiers Zuständigkeit ist das ganze Repository — die Berichtskapitel, `README.md` und `CHANGELOG.md` liegen außerhalb von `frontend/`. Prettier löst die Konfiguration von der zu formatierenden Datei nach oben auf, eine Wurzeldatei deckt beide Seiten ohne Duplikat ab. |
| Eigenes `package.json` an der Wurzel                                                                  | Zweites Lockfile und zweiter `npm install` nur für eine devDependency — teurer als die kleine Asymmetrie zwischen Konfigurationsort und Abhängigkeitsort.                                                                                                                     |
| `proseWrap` auf Standard (`preserve` ist nicht Prettiers Default für alle Fälle) lassen bzw. `always` | Würde die deutsche Prosa in `documentation/report/**` bei jedem Lauf auf `printWidth` neu umbrechen. Ein geänderter Halbsatz hätte dann Diffs über zwanzig Zeilen.                                                                                                            |
| Markdown ganz aus Prettiers Zuständigkeit nehmen                                                      | Kap. 7.4 fordert Formatierung für JS/JSON/Markdown; mit `proseWrap: preserve` ist die Prosa geschützt, und die Normalisierung von Tabellen bleibt ein einmaliger Aufwand.                                                                                                     |

**Konsequenz:** Ein Formatierungslauf deckt Code und Dokumentation ab. Preis: Die
Scripts brauchen `--ignore-path ../.prettierignore`, weil Prettier die Ignore-Datei
relativ zum Arbeitsverzeichnis sucht, nicht relativ zum Zielpfad. Die einmalige
Normalisierung des Bestands (Tabellen-Pipes, `*kursiv*` → `_kursiv_`) liegt in einem
eigenen `style:`-Commit, damit der Tooling-Commit lesbar bleibt.

→ Kap. 7

### 2026-07-29 — Diagramme als Mermaid inline

**Gewählt:** Mermaid-Blöcke inline in den Kapiteldateien, gerendert per
`@mermaid-js/mermaid-cli` nach `rendered/*.svg`.

**Verworfen:**

| Alternative  | Grund der Ablehnung                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------ |
| PlantUML     | Bessere arc42-Ausgabe, braucht aber Java oder einen Server — zu schwer für vier Diagramme.       |
| draw.io      | Nicht diffbar, nicht versionierbar, und widerspricht dem Ziel, ohne Zeichenwerkzeug auszukommen. |
| ASCII-Kästen | Kostenlos und diffbar, liest sich in einem bewerteten Bericht aber amateurhaft.                  |

**Konsequenz:** Diagramme sind diffbar und überleben inkrementelle Änderungen (ein
neues Modul = eine neue Zeile). Bekannte Einschränkung: Mermaid lässt sich nicht
direkt in Word einfügen, der Render-Schritt ist zwingend, und `mmdc` zieht
Puppeteer/Chromium (~150 MB). Fallback bei Proxy-Problemen: mermaid.live → SVG
exportieren → in Word einfügen, bei vier Diagrammen akzeptabel.

→ Kap. 4, 7

### 2026-07-29 — Coverage getrennt je Sprache, ohne Schwellwert-Gate

**Gewählt:** Zwei Messungen, zwei Zahlen, nebeneinander berichtet:
`@vitest/coverage-v8` für das Frontend, `cargo llvm-cov --lib` für die Engine.
`all: true`, damit ungetestete Module mitzählen. Kein `exclude` für `index.js` und
`ui/frameTimeGraph.js`, die beiden Dateien, die die Zahl am stärksten drücken.
Zunächst keine `thresholds`.

**Verworfen:**

| Alternative                                    | Grund der Ablehnung                                                                                                                                                                                          |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Nur Frontend-Coverage (die ursprünglichen 2 h) | Die Engine ist das gewählte Fokus-Thema und enthält den Großteil der Logik. Eine Coverage-Aussage, die ausgerechnet diese Hälfte nicht misst, ist die schwächere Aussage — 1,5 h Mehraufwand dagegen billig. |
| Eine gemeinsame Gesamtzahl                     | Sie würde die beiden Hälften verrechnen und damit genau die Information zerstören, die interessant ist: Welche Sprachseite ist getestet und welche nicht.                                                    |
| DOM-Module per `exclude` ausblenden            | Hebt die Zahl, ohne einen Test zu schreiben. Genau die Politur, gegen die die Musterdokumentation mit ihrer begründet niedrigen Zahl argumentiert.                                                           |
| Schwellwerte sofort setzen                     | Eine Untergrenze über dem Ist-Stand macht jeden CI-Lauf (T-05) rot, ohne etwas Neues zu sagen. Sinnvoll erst nach T-07, dann auf dem erreichten Niveau minus Reserve.                                        |

**Konsequenz:** Die Ausgangsmessung ist unangenehm und genau deshalb brauchbar —
Frontend 10,4 % Statements, Engine 86,7 % Lines. Vor allem lokalisiert sie die Lücke
präzise an der Sprachgrenze: Die reine Simulation liegt bei 96–100 %,
`wasm_bridge/mod.rs` bei 47 % und `wasm_bridge/response.rs` bei **0 %**. Das ist kein
Zufall, sondern strukturell: Die Getter in `response.rs` liefern
`js_sys::Float32Array`/`Uint32Array` und brauchen eine JS-Laufzeit, sind per
`cargo test` also prinzipiell unerreichbar. Damit hat die Messung die Begründung für
T-07b gleich mitgeliefert, statt sie behaupten zu müssen.

→ Kap. 8, 9

### 2026-07-29 — `wasm_tests.rs` füllen statt die Absenz begründen

**Gewählt:** Der seit dem 25.05. leere Stub wird mit 14 `#[wasm_bindgen_test]`-Fällen
gefüllt, die den Vier-Buffer-Vertrag aus S-02 prüfen: Index-Ausrichtung aller vier
Buffer, `snapshot` bewegt die Welt nicht, `set_wave` ist idempotent, neue Boids halten
den Sicherheitsabstand, `resize` holt jeden Boid in die neuen Grenzen zurück, und der
Vorzeichen-Vertrag der Dash-Phase.

**Verworfen:** Die von `08-qualitaet.md` ausdrücklich angebotene zweite Variante, die
Absenz zu begründen. Sie wäre vertretbar gewesen, aber das Argument dagegen ist
stärker als das dafür: Der Buffer-Vertrag ist die zweite tragende Invariante des
Projekts und liegt im gewählten Fokus-Thema. Vor allem ist er die einzige Stelle, die
`cargo test` **prinzipiell** nicht erreichen kann — die Getter liefern
`js_sys::Float32Array` und brauchen eine JS-Laufzeit. Eine begründete Absenz hätte
also genau dort keine Prüfung gelassen, wo es keine Alternative zu dieser Testart gibt.

**Konsequenz — und der eigentliche Fund:** Auf dem Host-Target expandiert
`#[wasm_bindgen_test]` zu nichts. `cargo test` meldet für die Datei **0 Tests** und
bleibt grün. Genau deshalb ist der leere Stub zwei Monate lang niemandem aufgefallen:
Es gab kein Signal, das hätte fehlschlagen können. Zweite Folge derselben
Target-Trennung: `cargo llvm-cov` instrumentiert das Host-Target, die 14 neuen Tests
heben die Rust-Coverage also **nicht** — `wasm_bridge/response.rs` steht weiter bei
0 %, obwohl es jetzt vollständig geprüft ist. Beide Zahlen sind richtig und
widersprechen sich nur scheinbar; Kap. 8.1 muss das ausschreiben, sonst liest es sich
wie ein Fehler im Bericht.

→ Kap. 8, 9

### 2026-07-29 — E2E gegen den Produktionsbuild statt gegen den Dev-Server

**Gewählt:** Playwright startet `npm run build && vite preview` selbst und testet
gegen das ausgelieferte Artefakt. Fester Viewport 1280×720, ein Worker, nur Chromium.

**Verworfen:**

| Alternative               | Grund der Ablehnung                                                                                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gegen `vite dev` testen   | Schneller und ohne Vorarbeit, prüft aber nie den Build. Der Dev-Server liefert das ganze Projektverzeichnis aus und verdeckt damit jede vergessene Kopie — genau der Fehler, der dabei gefunden wurde.  |
| Mehrere Browser           | Die Engine ist WASM hinter einem Canvas; ein zweiter Browser prüft überwiegend dessen eigene WASM- und Canvas-Implementierung, nicht diesen Code. Doppelte Laufzeit für sehr wenig zusätzliche Aussage. |
| Parallele Worker          | Mehrere Instanzen rechnen gleichzeitig eine O(n²)-Schleife mit 60 Schritten/s und nehmen sich die CPU weg. Zeitbezogene Zusicherungen würden aus fremden Gründen fehlschlagen.                          |
| Pixelvergleich des Canvas | Der Schwarm bewegt sich in jedem Frame: Eine Ungleichheits-Zusicherung ist immer erfüllt, ein Golden Image immer instabil. Die Zeichen-Arithmetik ist stattdessen als Unit-Test isoliert.               |
| Variabler Viewport        | Die Weltgröße ist `window.innerWidth/Height`. Ein wechselnder Viewport verändert Spawn-Abstände und damit die Simulation — Reproduzierbarkeit wäre verloren.                                            |

**Konsequenz:** Ein E2E-Lauf kostet einen vollen WASM- und Vite-Build, das
`webServer`-Timeout liegt entsprechend bei fünf Minuten. Dafür prüft die Stufe das,
was unter _Working Code_ bewertet wird. Was E2E hier als Einziges prüfen kann, ist das
Eigentum an der Tastatur (Leertaste in der Runde beim Dash, außerhalb beim Menü) —
alles Übrige an der Eingabe ist Arithmetik und liegt in Unit-Tests. Der Determinismus
der Engine zahlt sich hier nochmals aus: „stehenbleiben bis der Schwarm drei Leben
genommen hat" ist ein reproduzierbarer Testfall, kein meistens funktionierender.

→ Kap. 8, 10

### 2026-07-29 — Stabile HUD-IDs statt Positionsselektoren

**Gewählt:** Die vier HUD-Panels bekommen IDs, die benennen _was_ sie zeigen
(`hud-timer`, `hud-score` …), neben den Klassen, die sagen _wo_ sie sitzen.

**Verworfen:** Im Test auf `.hud-panel.bottom-left` selektieren. Das hätte ohne
Quelländerung funktioniert, aber die Tests an das Layout gekoppelt: Ein Umsortieren
der Panels — eine rein visuelle Änderung — hätte die Testsuite gebrochen und den
Eindruck erzeugt, die Funktion sei kaputt.

**Konsequenz:** Eine Zeile Produktionscode für die Testbarkeit. Vertretbar, weil eine
ID am Anzeigeelement auch ohne Tests keine Fremdkörper ist. Die Grenze, die dabei
bewusst nicht überschritten wurde: Kein Test-Hook, der internen Spielzustand nach
`window` exportiert. Damit wäre die Prüfung der Spielerposition leicht geworden — um
den Preis von Produktionscode, der nur für Tests existiert.

→ Kap. 3, 8

## Herausforderungen & Lessons Learned

- **2026-08-04 — Eine Freischaltkonstante herunterzudrehen schaltet nichts frei.** Für die
  Sichtprüfung der Vorwarnlinie brauchte es dashende Boids in Welle 1, also
  `DASH_UNLOCK_DIFFICULTY_TIER = 0` und ein neuer Build. Im Browser passierte nichts: kein Puls,
  keine Linie, `dash_aim_count` durchgehend 0. Rund 30 min gingen in die falsche Richtung, weil
  das Symptom wie ein Renderfehler aussah — der Buffer war ja neu. Die Messung, die es umgedreht
  hat, war eine Sonde auf `dash_phases` im laufenden Bild: dort stand ebenfalls überall 0, damit
  lag es nicht am Zeichnen, und die eigenen Grenztests aus derselben Quelle sprachen im Browser
  ohnehin an. Die Ursache steht in `boid_factory.rs`: `build_boid` gibt Stufe 0 den
  Standardkonstruktor, und `DashProperties::default()` hat `can_dash: false` **fest** verdrahtet
  — dokumentiert und richtig so, weil null Ladeschritte ein legitimer Tuning-Wert bleiben soll
  und nicht versehentlich zum Ausschalter werden darf. Der Unlock-Wert wird auf diesem Pfad also
  gar nicht gelesen. Mit `= 1` und Welle 2 war die Prüfung sofort da.
  Zwei Lehren. Erstens: **Eine Konstante zu verbiegen prüft nur, was sie liest** — bei einem
  Schnellpfad, der die Regel überspringt, verbiegt man ins Leere, und das sieht genauso aus wie
  ein defektes Feature. Zweitens: Bei „neues Feature zeigt nichts" ist die erste Messung nicht
  das neue Feature, sondern der Wert, von dem es abhängt; hätte die Sonde auf `dash_phases` am
  Anfang gestanden, wären es fünf Minuten gewesen. Der Weg dorthin ist in §6 der Dash-Spec
  vermerkt, damit die nächste Sichtprüfung nicht wieder bei Stufe 0 anfängt.
  → Kap. 8

- **2026-08-04 — Der gemeldete Fehler existierte nicht, der Fehler dahinter schon.** Aus
  einer Spielsitzung kam „Power-ups dürfen nicht auf Hindernissen spawnen". Die Prüfung
  dagegen war vorhanden, korrekt und getestet: `markerClearance.js` rechnet den
  Punkt-Kapsel-Abstand richtig, `_trySpawn` ruft sie mit dem echten Hindernispuffer auf, drei
  Zusicherungen deckten sie ab. Die Versuchung war entsprechend groß, „ist schon
  implementiert" zu antworten — und das wäre falsch gewesen, denn das Symptom war echt: Der
  Spieler **sah** Marker in Hindernissen liegen. Gefunden wurde die Ursache erst über die
  Kadenz der Gegenseite: Hindernisse entstehen alle ~9 s (`DEFAULT_OBSTACLE_SPAWN_INTERVAL_STEPS`
  = 540, mit der Wellendichte sinkend) und stehen 40 s, ein Marker liegt 12 s — also wächst
  regelmäßig ein Hindernis über einen Marker, der längst lag. Kein Fehler in der Prüfung,
  sondern eine Prüfung, die nur einmal stattfand, wo sich beide Seiten bewegen.

  Rund 40 min, praktisch vollständig Diagnose; die Behebung selbst ist eine Schleife über zwei
  Marker.

  Zwei Lehren, und die zweite ist die unbequeme. Erstens: Eine Fehlermeldung nennt ein Symptom
  und **behauptet dabei eine Ursache**; hier war die behauptete Ursache widerlegbar und das
  Symptom trotzdem richtig. Wer die Behauptung prüft und dann aufhört, schließt einen echten
  Fehler als „kein Fehler". Zweitens: Der Fall stand als akzeptierte Grenze in der eigenen Spec
  (S-05b §6) — er war also **bekannt**, mit Begründung, und trotzdem hat ihn niemand mit dem
  Bericht aus dem Spiel zusammengebracht, bis die Zahlen nebeneinander lagen. Eine dokumentierte
  Grenze liest sich im Nachhinein wie eine Entscheidung und im Betrieb wie ein Fehler; dass sie
  aufgeschrieben war, hat die Diagnose nicht verkürzt, sondern eher verdeckt.

  Nachtrag zur Begründung von damals: ihr erster Halbsatz war ein Kostenargument (jeder Marker
  gegen jedes Hindernis in jedem Schritt) und trägt nicht — das sind 1440 Abstandsrechnungen pro
  Sekunde in einer Simulation, die 90 Boids paarweise rechnet. Der zweite Halbsatz („ein Marker,
  der verschwindet, während man auf ihn zuläuft") war richtig, betraf aber nur ein Verschwinden;
  ein Wegskalieren über 350 ms war zum Zeitpunkt der Entscheidung noch nicht möglich. Die
  Entscheidung wurde nicht umgestoßen, ihre Voraussetzung ist entfallen — und das ist der
  Unterschied, den eine Spec-Änderung benennen muss, damit sie nicht als Meinungswechsel gelesen
  wird.
  → Kap. 4, 8, 10

- **2026-08-04 — Zwei von drei Symptomen zeigten auf Konstanten, das dritte auf das Modell.**
  Zur Steuerung kamen drei Beobachtungen: viel Momentum, bremst langsam, Probleme bei schnellen
  Richtungswechseln. Die ersten beiden lassen sich mit zwei Zahlen erledigen. Der dritte nicht,
  und das war erst nach einer Messung sichtbar: Bei einer 90°-Wende wurde die querlaufende
  Geschwindigkeitskomponente von **keiner Kraft** angefasst — gebremst wurde ausschließlich,
  wenn gar keine Taste gedrückt war. Sie verschwand nur, weil die radiale Kappe die Gesamtsumme
  begrenzt und dabei umverteilt: gemessene 1,63 s, bis sie auf 1 % abgebaut war, gegen 0,6 s für
  eine volle Umkehr. Die auffälligere Zahl gehörte also zum unauffälligeren Symptom.

  Die Lehre ist eine über die Reihenfolge: Erst messen, was das Modell tut, dann entscheiden, ob
  Konstanten die Antwort sind. Wären nur die Konstanten angehoben worden, wäre die Übergabe
  fachlich vertretbar gewesen („beschleunigt und bremst messbar schneller") und hätte das
  eigentliche Ärgernis unberührt gelassen — die Art Verbesserung, die in einer zweiten
  Spielsitzung als „ist immer noch so" zurückkommt. Beschleunigung kann nur addieren; wer ein
  Wegkommen von etwas will, braucht ein Bremsen dafür.
  → Kap. 4, 10

- **2026-08-03 — Der erste Test gegen das Durchtunneln war selbst durchlässig.** Die
  Zusicherung durch `Flock::update` behauptete zunächst nur, der Boid liege nach jedem
  Schritt nicht **innerhalb** der Stange. Sie besteht auch ohne jede Kollisionsprüfung: Ein
  Boid, der die Stange in einem Schritt überspringt, liegt danach außerhalb — auf der
  falschen Seite. Aufgefallen ist das erst durch eine bewusste Mutation des Aufrufs (statt
  `previous_position` die schon integrierte Position übergeben, was die Prüfstrecke auf
  Länge Null bringt): Der Test blieb grün. Erst die Zusicherung auf die **Seite** —
  `position.x < 500` — fällt bei beiden Mutationen durch. Die zweite Fassung war dann
  ihrerseits zu streng und schlug zu, weil der zurückgeprallte Boid nach dreizehn weiteren
  Schritten die linke Weltkante erreicht und völlig zurecht rechts wieder auftaucht — vom
  Überspringen nicht zu unterscheiden. Lehre: Eine Invariante gegen Tunneln muss die
  Überquerung selbst prüfen, nicht ihre Folge, und der Weltumschlag ist in jeder Zusicherung
  über eine Position ein eigener Fall. Rund 30 min, komplett in den Test geflossen.

- **2026-08-02 — Die Fehlermeldung zeigte auf `tick()`, die Ursache lag im Startknopf.**
  Ein Playtest endete mitten in der Runde mit `RuntimeError: index out of bounds`, im Stack
  ausschließlich der heiße Pfad: `loop` → `advanceSimulation` → `runSimulationStep` →
  `tick`. Die naheliegende Lesart — ein Indexfehler in der Engine — ist falsch, und das ließ
  sich messen statt vermuten: Ein absichtlich provozierter Rust-Panic aus demselben Build
  meldet sich als `RuntimeError: unreachable`, nicht als `index out of bounds`. Damit war es
  kein Bereichsfehler in sicherem Rust, sondern ein echter Speicherzugriff außerhalb der
  linearen Speichers. Der zweite übliche Verdächtige, ein Stapelüberlauf, fiel ebenfalls
  aus: Die Summe **aller** Stapelrahmen des Moduls beträgt 1,5 kB gegen 1 MiB Stapel.
  Übrig blieb ein Zeiger, der auf keine gültige Struktur mehr zeigt. Rund 4 h, davon etwa
  dreieinhalb auf die Diagnose: ~2 Mio. simulierte Schritte über vier parallele Browserläufe
  mit dem echten `runSimulationStep` reproduzierten nichts, weil die Ursache gar nicht in der
  Simulation liegt. Sichtbar wurde sie erst, als ein Testaufbau versehentlich zwei
  Modulinstanzen erzeugte: `initEngine` zweimal nebenläufig aufgerufen ergibt **zwei**
  WebAssembly-Instanzen, weil der generierte Loader nur gegen ein _abgeschlossenes_ Laden
  prüft. Danach mischen sich beide Halden — Adressen der einen Instanz werden mit der
  anderen benutzt, und die `FinalizationRegistry` der verworfenen Instanz gibt diese Adressen
  in der überlebenden frei. Der Absturz kommt deshalb verzögert und an beliebiger Stelle.
  Erreichbar ist das im Spiel über den Startknopf: `startGame()` wartet auf das Modul, und
  bis dahin liegt die Karte mit fokussiertem Knopf noch auf dem Bild — eine gehaltene
  Leertaste genügt.
  Zwei Lehren. Erstens: **Der Stack einer Speicherverletzung zeigt den Ort des Schadens, nicht
  den der Ursache.** Solange nicht geklärt ist, welche Art Trap überhaupt vorliegt, ist jede
  Codelesung im Stack-Pfad verlorene Zeit; die drei Messungen (Panic-Signatur,
  Stapelrahmen, Zeigergültigkeit) haben den Suchraum in Minuten mehr eingegrenzt als Stunden
  Lesen. Zweitens: **Jedes `await` in einem Bedienpfad ist ein Zeitfenster für eine zweite
  Betätigung**, und ein `if (!x)`-Wächter vor einem `await` prüft den Zustand _vorher_, nicht
  den laufenden Vorgang. Das ist dieselbe Lücke wie beim Steckenbleiben im Hindernis, nur
  zwischen zwei Nutzeraktionen statt zwischen zwei Simulationsschritten.
  → Kap. 4, 8, 10

- **2026-08-01 — Ein eingefrorenes Bild und eine gerade gestartete Runde sehen im HUD
  identisch aus.** Zwei der neun Pause-E2E-Tests fielen durch, und der Screenshot zeigte
  eine stehende Welt: Timer `00:00`, Score 0, kein Countdown-Glyph, keine Karte. Das ist
  genau die Signatur, die entstünde, wenn `menu.showPause` wirft, nachdem der Zustand schon
  auf `PAUSED` steht — Welt angehalten, Overlay nie sichtbar geworden. Rund 40 min gingen in
  diese Hypothese, inklusive eines Wegwerf-Specs mit `pageerror`-Mitschnitt, das dann sauber
  durchlief und die Karte korrekt aufbaute. Die Ursache lag nicht im Code, sondern in der
  Zusicherung: `startRound()` aus `e2e/support/game.js` wartet `COUNTDOWN_MS + 500`, kehrt
  also mit etwa einer halben gespielten Sekunde zurück, und der Score ist
  `Math.floor(timerSeconds)` — er **ist** dort legitim 0. Genau deshalb wartet der
  bestehende Test in `round.spec.js` vor seinem Vergleich zusätzlich 2,5 s. Der
  Countdown-Glyph fehlte aus dem zweiten harmlosen Grund: `countdownSecondsLeft` liefert im
  Moment des Rundenstarts exakt 0, und der Renderer zeichnet bei 0 nichts.
  Die Lehre ist doppelt. Erstens: Ein Wert, der aus einer Abrundung entsteht, taugt nur als
  Beweis für „die Uhr läuft", wenn vorher genug Zeit vergangen ist, dass die Abrundung ihn
  freigibt — sonst prüft der Test die Wartezeit und nicht das Verhalten. Zweitens: Der
  Screenshot war das schnellere Werkzeug als jede Hypothese, und er wäre es 40 min früher
  auch gewesen. Die Tests wurden daraufhin nicht nur „entschärft", sondern schärfer: Der
  Countdown-Test wartet nach dem Fortsetzen bewusst 1,5 s und fordert, dass der Score
  **immer noch** 0 ist, weil rund 2 s Countdown geschuldet waren — eine verschluckte Restzeit
  fällt damit auf, während ein reines „irgendwann läuft es wieder" sie durchgelassen hätte.
  → Kap. 8

- **2026-08-01 — Die Überlappungsauflösung garantiert weniger, als ihr Name verspricht.**
  Beim Verdichten des Schwarms sollte ein Test nachweisen, dass
  `BOID_OVERLAP_RELAXATION_STEPS` (4) für den kleineren Kollisionsradius noch reicht — die
  eine Eigenschaft, auf der die dichte Wolke ruht und für die es bisher keinen Test gab.
  Der Test fiel durch, und zwar zu Recht: Ein gemessener Stapel aus sechs Boids kommt nach
  einem Frame nur auf 5,6 der geforderten 12 Einheiten. Der Grund ist strukturell und nicht
  eine zu kleine Zahl von Pässen — jeder Pass löst nur die Überlappung, die ein Paar
  _gerade jetzt_ hat, und schiebt dabei einen Boid in den nächsten. Die Folge ist eine
  asymptotische Annäherung über Frames (Paar: 1 Frame; sechs Boids: ~11,99 nach 30 Frames;
  24 Boids: 9,6 nach 30, 11,995 nach 120) und in einfacher Genauigkeit **nie** ein exaktes
  Erreichen des Mindestabstands. Ein `>= minimum` hätte also einen Test ergeben, der
  niemals bestehen kann.
  Rund 25 min, überwiegend Messen statt Debuggen — der Code war die ganze Zeit korrekt.
  Die Lehre betrifft die **Formulierung** der Zusicherung, nicht den Code: Der bestehende
  Test in `flock.rs` prüft ein einzelnes Paar und war deshalb grün, während für einen Haufen
  gar keine Aussage existierte. Die zwei neuen Tests trennen das jetzt sauber — ein Paar ist
  nach einem Frame exakt gelöst, ein Stapel innerhalb einer halben Sekunde bis auf 0,1 %.
  Die schwächere der beiden ist die ehrlichere, und sie fängt genau den Regress ab, der
  wirklich weh täte: einen Schwarm, der sich zu einem dauerhaften Knoten verklumpt.
  → Kap. 4, 8, 10

- **2026-07-29 — Das eigene Prompt-Logging war lückenhaft.** Für den 29.07. war
  _ein_ Prompt geloggt, obwohl der Tag drei Commits inklusive einer 365-zeiligen
  Spezifikation hervorbrachte; insgesamt 22 Prompts auf 27 Commits. Die Ursache ist
  strukturell: `CHANGELOG.md` verlangt einen Append an _eine_ Datei zur Commit-Zeit
  und wurde durchgehend gepflegt, das Prompt-Log verlangt einen Append _vor_ der
  Antwort und schlief ein. Konsequenz für das Journal-Ritual: an die funktionierende
  Gewohnheit andocken (Commit-Zeit, eine Datei, ein Append) und mit
  `npm run docs:check` beratend — nicht blockierend — prüfen. Blockierende Git-Hooks
  werden um 2 Uhr nachts mit `--no-verify` umgangen. Rückwirkend werden **keine**
  Prompts erfunden; die Lücke wird in Kapitel 12 offengelegt.
  → Kap. 6, 10, 12

- **2026-07-29 — `eslint --fix` verschlechterte die Kommentare, bevor es sie
  verbesserte.** Die Nachrüstung war mit ~1,5–2 h geplant und lag bei ~2,5 h. Ursache
  war nicht der Umfang, sondern eine falsche Regel-Reichweite: Nur
  `jsdoc/require-jsdoc` war auf die exportierte API eingeschränkt, die Inhaltsregeln
  des `flat/recommended`-Sets liefen auf Standard. Die prüfen aber **jede** Funktion,
  die schon irgendeinen JSDoc-Block trägt — und im Projekt tragen auch private
  Helfer einzeilige `/** … */`-Prosa-Kommentare. `--fix` hängte dort leere
  `@param color`-/`@param amount`-Zeilen an, also genau die inhaltsleere
  Tag-Wiederholung, die die Kommentar-Konvention verbietet. Rund 90 solcher
  Warnungen und ein Dutzend bereits geschriebene Zeilen mussten zurückgenommen
  werden. Lehre, die über diesen Fall hinausgeht: Bei `eslint-plugin-jsdoc` ist die
  Reichweite **pro Regel** einzustellen, nicht einmal fürs Plugin — die
  gemeinsame Kontext-Liste ist deshalb keine Eleganz, sondern die Korrektur eines
  echten Fehlers. Zweite Lehre: `--fix` auf einer frisch eingeführten Regel erst auf
  wenigen Dateien gegenprüfen, bevor man es über die Codebasis laufen lässt.
  → Kap. 7, 8, 10

- **2026-07-29 — Der Production-Build lieferte seit Monaten keine Übersetzungen
  aus.** Beim Vorbereiten der E2E-Tests fiel auf, dass `frontend/dist/` kein
  `locales/`-Verzeichnis enthält. `ui/i18n.js` holt `./locales/en.json` per `fetch`
  zur Laufzeit, die Datei taucht damit nie im Modulgraph auf — und Vite kopiert nur,
  was es entweder importiert sieht oder unter `public/` findet. Im gebauten Spiel
  schlug der `fetch` also fehl, `t()` fiel auf seinen Fallback zurück und **jedes**
  Label stand als Rohschlüssel auf dem Bildschirm (`menu.play` statt „Play"). Der
  Dev-Server lieferte die Datei dagegen aus, weil er das ganze Projektverzeichnis
  bedient — deshalb war der Fehler in monatelanger Entwicklung nie sichtbar. Behebung:
  `frontend/locales/` → `frontend/public/locales/`, zehn Minuten.
  Der eigentliche Punkt ist nicht der Fehler, sondern **wer ihn findet**: 51
  Rust-Tests und 92 Frontend-Tests konnten ihn strukturell nicht finden, weil keiner
  von ihnen ein Build-Artefakt anfasst. Die Entscheidung, E2E gegen `vite preview`
  statt gegen den Dev-Server laufen zu lassen, hat sich damit bezahlt, bevor der erste
  E2E-Test geschrieben war. Das ist zugleich das beste Argument für die Existenz der
  E2E-Stufe im Bericht — belegt statt behauptet.
  → Kap. 5, 8, 10

- **2026-07-30 — 129 grüne Rust-Tests, und im Spiel war kein einziges Hindernis zu
  sehen.** Nach der Umsetzung von S-07 war alles grün: Geometrie, Ablauf,
  Korridor-Invariante, Buffer-Vertrag im Browser. Ein Blick auf das laufende Spiel
  zeigte eine leere Arena. Zwei unabhängige Ursachen, beide vom gleichen Typ — eine
  Zusicherung, die nur eine **Obergrenze** prüfte.
  Erstens die Streuung des Spawns: Der Seed wurde nach dem Muster der Dash-Auswahl
  gebildet, `(seed * 53 + 47) % 1000`. Bei kleinen Multiplikatoren bleibt das Produkt
  für die ersten Seeds unter dem Modulus, der Rest ist dann das Produkt selbst — alle
  frühen Spawn-Runden landeten am oberen Rand der Welt und wurden ausnahmslos wegen zu
  geringen Randabstands abgelehnt. Die Dash-Auswahl verträgt das, weil sie einen
  Boid-Index modulo Flockgröße zieht und dort auch eine schlechte Streuung immer
  _irgendeinen_ gültigen Boid trifft; die Hindernis-Platzierung hat eine
  Ablehnungsbedingung und fällt damit auf die Nase. Zweitens die
  Spieler-Abstandsregel: Sie war von der Boid-Regel übernommen und verlangte
  `safe_spawn_distance` (~340 px) — in einem 1600×900-Fenster eine Sperrscheibe von fast
  Arenabreite. Für ein Objekt, das sich nie bewegt, ist ein Korridor die richtige
  Größe; die Boid-Distanz existiert, weil ein Boid sofort zu jagen beginnt.
  Rund 70 min, davon der größte Teil auf die Diagnose.
  Die eigentliche Lehre betrifft nicht die Streuung, sondern die **Form der
  Zusicherung**: `field.len() <= allowed` war erfüllt, `keine zwei Hindernisse zu nah`
  war erfüllt, `keines am Rand` war erfüllt — eine leere Welt erfüllt jede
  Obergrenze und jede Ausschlussregel, die man formulieren kann. Was fehlte, war die
  Untergrenze: _füllt sich die Welt überhaupt_. Seitdem stehen neben jeder
  Obergrenzen-Zusicherung dieses Features auch eine Untergrenze und eine Streuungsprüfung
  (linke/rechte, obere/untere Hälfte). Zweite Lehre, unbequemer: Gefunden hat den Fehler
  keine der drei Teststufen, sondern ein Blick auf einen Screenshot. Bei einem sichtbaren
  Feature bleibt das ein Arbeitsschritt und keine Bequemlichkeit.
  → Kap. 4, 8, 10

- **2026-07-30 — Der Bug saß nicht in der Geometrie, sondern in einem Abstand von exakt
  null.** Im Spiel blieb der Spieler in Hindernissen hängen, am zuverlässigsten mit einem
  Dash hinein, aber auch beim längeren Hineinsteuern. Die Vermutung lag zuerst bei der
  Kapselgeometrie oder beim Streckenabstand — beides war korrekt und ist einzeln
  abgedeckt. Die Ursache war der Rückgabewert: `resolve_player_movement` setzte den
  blockierten Spieler auf `contact.surface_point`, also auf einen Punkt mit Abstand **genau
  null** zur aufgeblasenen Oberfläche. Im nächsten Schritt beginnt die geprüfte Strecke
  damit auf der Oberfläche, ihr Minimalabstand liegt bei `radius + player_radius` — und
  nach f32-Rundung eben auch knapp darunter. Der Schritt galt also wieder als Kollision,
  **auch wenn er vom Hindernis weg führte**, und der Zweig für „hat durchtunnelt" zog den
  Spieler auf die Oberfläche zurück. Position und Geschwindigkeit widersprachen sich
  daraufhin jeden Schritt: Die Geschwindigkeit zeigte nach außen, die Korrektur überschrieb
  die Position. Der Dash traf das am härtesten, weil er tief im Hindernis endet und dort
  garantiert korrigiert wird.
  Rund 45 min, davon der größte Teil auf die Diagnose; die Behebung sind zwei Zeilen plus
  eine entfallende Fallunterscheidung.
  Die Lehre betrifft die **Art** der Zusicherungen, nicht ihre Zahl: Jeder Test zu diesem
  Code prüfte einen **einzelnen** Aufruf — richtige Position, richtige Normale, kein
  Durchtunneln. Ein Zustand, aus dem man nicht mehr herauskommt, ist aber nur über **zwei
  aufeinanderfolgende** Aufrufe sichtbar. Die neuen Zusicherungen sind deshalb bewusst so
  gebaut: einmal blockieren und im Folgeschritt wegfahren, und 200 Schritte gegen ein
  Hindernis mit der Zusicherung, dass jeder einzelne davon außerhalb endet. Das ist
  dieselbe Lücke wie beim leeren Hindernisfeld, nur in der Zeit statt im Raum — dort fehlte
  die Untergrenze, hier die Folgebewegung.
  → Kap. 4, 8, 10
