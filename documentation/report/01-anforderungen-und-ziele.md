# 1 Anforderungen und Ziele

`Seitenbudget: ~2 S. | Status: Gerüst | Quellen: .github/copilot-instructions.md §Project Overview, docs/specs-overview.md §1–2, README.md`

## 1.1 Themensteckbrief: Nutzer, Prozess, Pain und Kontext

> TODO: aus README.md und copilot-instructions.md §Project Overview komponieren.
> Zu klären und zu benennen: Zielgruppe (Casual-Browser-Spieler, keine Installation,
> kein Account), Kernprozess (Runde starten → ausweichen → Wave übersteht →
> Highscore), der adressierte „Pain" (Schwarmsimulationen sind entweder Demos ohne
> Spielziel oder Spiele ohne echte Schwarmlogik), Nutzungskontext (kurze Sessions im
> Browser, Tastatursteuerung).

## 1.2 Die Lösung

> TODO: aus docs/specs-overview.md §2 (Feature-Liste S-01…S-06) komponieren.
> MVP-Kernfunktionen auflisten; danach die bewusst gestrichenen Erweiterungen
> (Schild, Slow-Time) mit Verweis auf Kap. 10 nennen.

## 1.3 Details zum Softwareprojekt

> TODO: Vorgehensmodell benennen — spec-driven, siehe CLAUDE.md §Workflow und
> docs/spec-s05-dash.md als ausgeführtes Beispiel. Solo-Projekt. Branch-Modell
> main/dev (siehe Kap. 7). Rahmenbedingung „installationsfrei und serverlos" aus
> copilot-instructions.md.

## 1.4 Entwicklungsfokus

> TODO: Fokus-Thema **Systemnah / WASM** begründen. Material: CLAUDE.md
> §„The two load-bearing invariants" (Fixed Timestep, flache Buffer über die
> Sprachgrenze), copilot-instructions.md §Performance Requirements (60 FPS,
> hunderte bis tausende Entitäten). Abgrenzung: die Engine kennt weder DOM noch
> Canvas, das Frontend enthält keine Simulationsmathematik.
