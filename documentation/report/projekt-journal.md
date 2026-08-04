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

## Entscheidungen

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
