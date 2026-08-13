# 6 KI-driven Engineering & Prozess

`Seitenbudget: ~2 S. | Status: Entwurf | Quellen: CLAUDE.md, .github/copilot-instructions.md, .claude/settings.json, ai/*.json, scripts/docs-check.mjs, docs/spec-s05-dash.md, projekt-journal.md`

Dieses Projekt ist über weite Strecken mit KI-Assistenz entwickelt worden. Das folgende
Kapitel beschreibt nicht, _dass_ das geschehen ist, sondern **wie es geregelt wurde**: welche
Konfigurationsdateien die Assistenz binden, welche dieser Regeln die Struktur des Quellcodes
nachweislich geformt haben und welcher Arbeitsablauf pro Änderung eingehalten wird. Der
Prozess liegt dabei nicht als Beschreibung neben dem Projekt, sondern **als Datei darin** —
`CLAUDE.md` und `.github/copilot-instructions.md` sind maschinenlesbare Prozessdokumentation,
die zu Beginn jeder Sitzung in den Kontext des Assistenzsystems geladen wird.

## 6.1 Modulare Konfiguration

Die Konfiguration ist auf vier Dateien verteilt, die sich nach zwei Achsen trennen:
werkzeugübergreifend gegen werkzeugspezifisch, und committet gegen maschinenlokal.

| Datei                             | Gültigkeit                      | Inhalt                                                            |
| --------------------------------- | ------------------------------- | ----------------------------------------------------------------- |
| `.github/copilot-instructions.md` | werkzeugübergreifend, committet | Architekturprämissen, Coding Standards, verpflichtende Schritte   |
| `CLAUDE.md`                       | Claude Code, committet          | Befehle, Architektur-Walkthrough, aktuelle Projektphase           |
| `.claude/settings.json`           | Claude Code, committet          | geteilte Freigabeliste für Werkzeugaufrufe                        |
| `.claude/settings.local.json`     | Claude Code, gitignoriert       | maschinenlokale Ergänzungen, absolute Pfade dieser Arbeitsstation |

**Zwei Instruktionsdateien, ein Regelwerk.** `.github/copilot-instructions.md` entstand im
Mai 2026, bevor nennenswerter Code existierte, und hält die Regeln, die unabhängig vom
eingesetzten Werkzeug gelten: die Zweischichtigkeit aus Engine und Frontend, den
Schnittstellenvertrag, die Coding Standards je Sprache, die 400-Zeilen-Grenze, die
i18n-Pflicht sowie Commit-, Changelog- und Protokollierungsdisziplin. `CLAUDE.md` kam mit dem
Wechsel auf Claude Code hinzu und trägt ausschließlich das, was dort zusätzlich gebraucht
wird: die ausführbaren Befehle je Werkzeug (siehe 7.1 Scripts in package.json), einen
Walkthrough durch die Modulstruktur, der zu jedem Ordner den Grund seiner Existenz nennt, und
die jeweils aktuelle Projektphase.

Redundanz wird nicht durch Disziplin vermieden, sondern durch eine ausdrückliche Zuweisung:
Der Abschnitt _Project conventions_ in `CLAUDE.md` beginnt mit dem Satz, dass diese
Konventionen aus der Copilot-Datei stammen und für Claude Code gleichermaßen gelten. Damit
liegt jede Regel an genau einer Stelle, und die zweite Datei verweist darauf, statt sie zu
wiederholen. Der naheliegende Gegenentwurf — **eine** Instruktionsdatei für alles — scheitert
an den Werkzeugen selbst: GitHub Copilot liest `.github/copilot-instructions.md`, Claude Code
liest `CLAUDE.md`, und keines von beiden folgt einem Verweis auf das andere. Die Aufteilung
ist also keine Stilfrage, sondern die Bedingung dafür, dass beide Systeme dieselben Regeln
sehen.

**Freigabeliste statt Rückfrage.** `.claude/settings.json` listet Werkzeugaufrufe, die ohne
Einzelbestätigung ausgeführt werden dürfen, und ist committet, damit die Liste am Projekt
hängt und nicht an einer Arbeitsstation. `.claude/settings.local.json` ist in `.gitignore`
ausgenommen und trägt die nicht übertragbaren Ergänzungen — absolute Windows-Pfade,
Verzeichnisse temporärer Treiberskripte. Der Grund für die Trennung ist Portabilität, nicht
Vertraulichkeit: In der lokalen Datei steht nichts Geheimes, nur nichts Allgemeingültiges.

Ein **negativer Befund** gehört an dieser Stelle benannt: Die committete Liste ist nicht auf
schreibgeschützte Befehle beschränkt, wie es der Entwurf dieses Kapitels ursprünglich
vorsah. Sie ist über Monate gewachsen und enthält heute auch verändernde Aufrufe
(`git stash`, `npm run format`, In-Place-Ersetzungen mit `sed -i`) sowie zahlreiche
Einmalaufrufe temporärer Messskripte, die es längst nicht mehr gibt. Sie wirkt damit als
Reibungsabbau, nicht als Sicherheitsgrenze — die eigentliche Grenze ist die Versionsverwaltung,
die jede Änderung sichtbar und rücknehmbar macht. Eine aufgeräumte, nach Absicht sortierte
Liste wäre der bessere Zustand; sie steht als offener Posten in 10.1 Kapazitätsplan.

## 6.2 Komponenten & Struktur

Der überprüfbare Teil eines Regelwerks ist nicht sein Wortlaut, sondern die Struktur, die es
hinterlassen hat. Fünf Regeln haben den Quellcode dieses Projekts sichtbar geformt.

**Human readability is the top priority.** Die Regel ist in
`.github/copilot-instructions.md` ausdrücklich damit begründet, dass hier Studierende Rust und
WebAssembly lernen, und sie ist operationalisiert statt appelliert: keine Trait-Akrobatik,
keine makrolastigen Muster, `for`-Schleifen statt dichter Iterator-Ketten, ausgeschriebene
Bezeichner (`separation_force` statt `sep_f`), keine Mikrooptimierung ohne vorherige Messung.
Sie hat zweimal nachweisbar eine technisch bessere Lösung verdrängt. Beim Rückstoß des
Spielers von einem Hindernis wurde die analytisch exakte Bestimmung der ersten Kontaktstelle
(Strahl gegen Kapsel) verworfen, weil sie eine quadratische Gleichung samt Fallunterscheidung
für beide Endkappen bedeutet hätte — für einen um wenige Pixel genaueren Stopp-Punkt. Und bei
der Linter-Auswahl wurden die strengeren Sammel-Plugins `unicorn` und `sonarjs` abgelehnt,
weil sie auf idiomatisch-dichtes JavaScript optimieren und damit direkt gegen diese Regel
arbeiten würden (siehe 7.3 Linter). Beide Entscheidungen sind im Projekt-Journal mit ihren
Alternativen festgehalten.

**Keine Quelldatei über 400 Zeilen.** Diese Regel ist der stärkste Strukturgeber des
Projekts; ihre Wirkung ist in 3.3 Modularisierung: Strukturierung der fachlichen Logik und
4.3 Modularisierung: Strukturierung der fachlichen Logik im Einzelnen belegt. Bemerkenswert
für dieses Kapitel ist ein Fall, in dem sie über ihren Wortlaut hinaus angewandt wurde: Die
Stylesheet-Datei aus dem Designsystem-Handoff überschritt die Grenze um mehr als das Doppelte,
obwohl die Regel nur Rust, JavaScript und Tests nennt und CSS gar nicht erwähnt. Sie wurde
trotzdem in fünf Stylesheets nach Zuständigkeit geteilt, weil ihr Zweck — eine Datei, ein
Thema — für ein Stylesheet genauso gilt und eine Ausnahme genau dort, wo die Regel am
leichtesten einzuhalten ist, sie für alle anderen Dateien entwertet hätte.

**Keine Magic Numbers, keine hartcodierten nutzersichtbaren Strings.** Zahlen leben in
`engine/src/constants.rs` beziehungsweise `frontend/src/gameConfig.js`, Texte in
`frontend/public/locales/en.json` hinter `ui/i18n.js`. Der Nutzen ist nicht Ordnung, sondern
Auffindbarkeit der Stellschrauben: Der Anteil der Wahrnehmungsreichweite, ab dem Separation
greift, stand als nackte `0.5` in einer Methode und war als Regler damit unsichtbar; als
benannte Konstante `CLOSE_NEIGHBOUR_RADIUS_SHARE` war er der Griff, mit dem die Schwarmdichte
tatsächlich gestimmt wurde.

**Werte, die pro Boid abweichen können, gehören auf den Boid.** `constants.rs` hält
Standardwerte, keine Invarianten; was sich zwischen Boid-Varianten unterscheiden kann, steht
in `BoidProperties`. Diese eine Regel — im Mai 2026 formuliert, als alle Boids noch gleich
waren — ist der Grund, dass die Schwierigkeitsrampe später ohne Umbau der Simulation
eingezogen werden konnte (siehe 4.7 Konfiguration — Wesentliche Einstellungen).

**Doc-Kommentar für jeden `#[wasm_bindgen]`-Export.** Weil jeder Getter des `FrameResponse`
das Format des Puffers dokumentiert, den er zurückgibt, ist der Puffer-Vertrag an der
Sprachgrenze selbstbeschreibend statt in einer separaten Schnittstellenbeschreibung abgelegt
(siehe 5.2.1 Der Puffer-Vertrag). Das JavaScript-Gegenstück dieser Regel ist über ESLint
erzwungen und in 7.5 JSDoc — über ESLint enforced beschrieben.

Die Beobachtung, die diese fünf Punkte verbindet: **Durchgesetzt hat sich, was geprüft wird.**
Die 400-Zeilen-Regel, die JSDoc-Pflicht und die Formatierung haben je ein Werkzeug hinter sich
(`npm run docs:check`, ESLint, Prettier, `cargo clippy`) und wurden ausnahmslos eingehalten.
Die Lesbarkeitsregel und die Kommentarkonvention sind menschliche Urteilsfragen geblieben und
haben deshalb in 8.4 Kommentare — Visuelle Strukturierung des Quellcodes einen eigenen
Abschnitt. Die eine Regel ohne jede Prüfung war die Prompt-Protokollierung — und genau sie ist
ausgefallen (siehe 6.3).

## 6.3 Entwicklungsprozess & Workflow

**Spec-driven.** Das erwartete mathematische Verhalten und die Randfälle werden vor der
Implementierung festgelegt. `docs/spec-s05-dash.md` ist das ausgeführte Beispiel: Zweck
fachlich und technisch, eine Verhaltenstabelle je Aspekt, die gesetzten Formeln samt der
Rechnung, die die Dash-Reichweite in Spielerdurchmessern ausdrückt, die Zustandsmaschine des
Boid-Dashes, die Edge Cases als eigener Abschnitt — und eine Enumeration der Testfälle,
getrennt nach den drei Testläufern, die sie ausführen. Der Nutzen liegt weniger in der
Planung als in der Prüfbarkeit: Eine Spezifikation, die ihre Randfälle benennt, erzeugt als
Prompt nicht nur Code, sondern die zugehörigen Tests. Die Spec endet mit einer
Aufwandstabelle Soll gegen Ist und benennt dort auch ihren eigenen Fehler — die Vorwarnlinie
des Boid-Dashes war nicht vorgesehen, weil die erste Fassung annahm, für die Vorwarnung
genüge „eine Zahl pro Boid". Das stimmt für _dass_ und _wann_ und nicht für _wohin_.

**Verpflichtende Schritte pro Änderung.** `CLAUDE.md` schreibt fünf Schritte fest:
Protokollierung des Prompts unter `ai/`, Eintrag in `CHANGELOG.md` für nutzersichtbare
Änderungen, ein atomarer Commit nach Conventional Commits, eine Abwägung, ob die Änderung
Tests verlangt, und eine Zeile im Projekt-Journal. Die Kopplung der ersten drei ist
beabsichtigt: Weil die Sessiondatei gemeinsam mit der Änderung committet wird, ist die
Zuordnung von Prompt zu Commit über die Historie der Datei nachvollziehbar und die Spalte
_Verwendung_ des KI-Verzeichnisses damit teilweise überprüfbar (siehe 12 KI-Verzeichnis,
Abschnitt _Erfassungsrichtlinie_). Nicht aufgegangen ist der Teil dieser Idee, der die
`topic`-Werte des Protokolls mit den Commit-Scopes gleichsetzen wollte: Die Historie zeigt
überwiegend die groben Scopes `frontend` und `engine`, während das Protokoll die sechs
feineren Kategorien des KI-Verzeichnisses führt. Die Zuordnung läuft deshalb über den Commit
der Sessiondatei, nicht über den Namen des Scopes.

**Modell-Mix.** Der Einsatz verlief in drei Rollen, die sich klar trennen lassen; die Zahlen
je System stehen in 12 KI-Verzeichnis und werden hier nicht wiederholt.

- **Konfiguration und Planung** (Mai 2026): GPT-5.4 und eine kleinere Variante desselben
  Modells für das Aufsetzen und Fortschreiben der Instruktionsdatei, Claude Sonnet 4.6 für
  den Entwurf der Ordnerstruktur. Charakteristisch ist die Verwendung: Diese Prompts sind im
  Verzeichnis überwiegend als _Übernommen_ klassifiziert, weil ihr Ergebnis eine Textdatei
  war und keine Implementierung.
- **Implementierung** (ab Ende Juli 2026): GitHub Copilot in der Entwicklungsumgebung für die
  erste Fassung von Frontend und Engine, danach durchgehend Claude Code mit Opus 5. Die
  Variante mit erweitertem Kontextfenster wurde für Änderungen eingesetzt, die beide Sprachen
  gleichzeitig betreffen; kurze Informationsfragen liefen bewusst auf dem kleineren
  Sonnet-Modell.
- **Entwurf der Optik**: Das Designsystem entstand in einer getrennten Sitzung eines auf
  Gestaltung ausgerichteten Assistenten und liegt als Handoff-Paket unter
  `docs/design_system/` — Regelwerk, Tokens und einbaufertige Module samt
  Integrationsanleitung.

**Ein Handoff ist ein Vorschlag, kein Merge.** Aus dem Umgang mit diesem Paket stammt die
wichtigste Prozessaussage dieses Kapitels. Keines seiner Module ist unverändert übernommen
worden. Das Durchlesen gegen den Bestand fand fünf Stellen, an denen die Anleitung nicht auf
den vorhandenen Code passte; die Stylesheet-Datei wurde geteilt (6.2); das mitgelieferte
Power-up-Modul führte eine eigene Uhr, die durch die hereingereichte Simulationszeit ersetzt
wurde, weil zwei Uhren nur so lange synchron laufen, wie zwei Rücksetzpunkte beieinander
bleiben; die vorgeschlagenen HUD-Zeilen auf dem Canvas wurden ins DOM verlegt, weil eine
Beschriftung, die sich nie ändert, nicht in jedem Frame neu gerastert werden muss. KI-Ausgabe
wird in diesem Projekt also mit derselben Prüfpflicht behandelt wie ein fremder Pull Request —
die Begründungen dieser vier Abweichungen stehen als Entscheidungsblöcke im Projekt-Journal
und damit im Bericht, nicht nur im Diff.

**Begleitende Dokumentation.** Dass der Bericht neben der Entwicklung entsteht und nicht
danach, ist eine bewusste Prozessentscheidung mit dokumentierten Alternativen: Alle Kapitel
pro Commit fortzuschreiben scheitert am Code-Churn, den die 400-Zeilen-Regel selbst erzeugt —
derselbe Strukturabsatz wäre mehrfach neu zu schreiben. Die Fakten in die jeweiligen
Kapiteldateien zu streuen scheitert daran, dass eine Tatsache meist zwei bis drei Kapitel
speist. Gewählt wurde deshalb **ein** Anhängeziel: Fakten pro Änderung ins Journal, jeweils
mit einem `→ Kap. n`-Tag versehen, und die Struktur-Kapitel in wenigen zusammenhängenden
Sitzungen. Ein gewöhnlicher Commit kostet damit eine Tabellenzeile, nur ein interessanter
kostet einen Absatz. Das bekannte Risiko — das Journal wird zur Halde — wird durch den
Kapitel-Tag und die beratende Prüfung abgefangen. Die verworfene dritte Alternative — die
Dokumentation vollständig ans Projektende zu legen — hätte genau das gekostet, was den Bericht
trägt: Verworfene Alternativen und tatsächliche Aufwände sind nach Wochen nicht mehr
rekonstruierbar (siehe 10.3 Lessons Learned).

**Ehrlich benannt: die Protokollierung war lückenhaft.** Für den 29.07.2026 war ein einziger
Prompt erfasst, obwohl an diesem Tag drei Commits einschließlich einer umfangreichen
Spezifikation entstanden; das Missverhältnis von protokollierten Prompts zu Commits ist in 12
KI-Verzeichnis, Abschnitt _Bekannte Lücken_, offengelegt. Die Ursache ist strukturell und
nicht disziplinarisch: `CHANGELOG.md` verlangt einen Anhang an _eine_ Datei zur _Commit-Zeit_
und wurde durchgehend gepflegt — das Prompt-Log verlangte einen Anhang _vor der Antwort_, lag
damit außerhalb dieses Takts und schlief ein. Die Konsequenz war kein strengeres Regelwerk,
sondern ein Werkzeug: `scripts/docs-check.mjs` prüft für den aktuellen Arbeitsstand, ob die
Sessiondatei des Tages existiert und vollständig klassifiziert ist, ob das Journal eine Zeile
für heute hat, ob bei geänderten Quelldateien der Changelog angefasst wurde und ob eine Datei
über die 400-Zeilen-Grenze gelaufen ist. Es ist **beratend und nicht blockierend** — der
Exit-Code ist immer 0, und es ist bewusst kein Git-Hook, weil ein blockierender Hook unter
Zeitdruck mit `--no-verify` umgangen wird, eine sichtbare Warnung dagegen nicht. Fehlende
Prompts wurden nicht rückwirkend rekonstruiert.

Die verallgemeinerbare Beobachtung daraus ist zugleich das Fazit dieses Kapitels: Ein Ritual
in einem KI-gestützten Arbeitsablauf hält nicht deshalb, weil es aufgeschrieben ist, sondern
wenn es **zur Commit-Zeit an genau einer Datei** stattfindet und eine Maschine seine
Vollständigkeit sichtbar macht. Regeln, die diese beiden Bedingungen erfüllen, sind in diesem
Projekt ausnahmslos eingehalten worden; die eine, die sie nicht erfüllte, ist ausgefallen.
