# SIGNAL — Handoff für Claude Code

Designsystem für **Boids Survival Runner**. Ausgewählte Kombination: Hauptmenü
**„Command Deck"** + Hindernis-Optik **„Hazard Tape"**. Verworfene Varianten sind aus
diesem Paket entfernt — was hier liegt, ist die eine zu bauende Richtung.

## Dateien

| Datei              | Zweck                                                                                         |
| ------------------ | --------------------------------------------------------------------------------------------- |
| `design-system.md` | Die Regeln: Farbsemantik, Typo, Form, Motion, HUD- und Hindernis-Spezifikation. Zuerst lesen. |
| `tokens.css`       | Kanonische Werte als Custom Properties + fertige Komponentenklassen. Nach `styles/` kopieren. |
| `menu-markup.html` | Referenz-Markup des Hauptmenüs. **Kein** einzubindendes File — die Vorlage für `menu.js`.     |
| `obstacleLayer.js` | Drop-in-Ersatz für `frontend/src/renderer/obstacleLayer.js`.                                  |
| `menuBackdrop.js`  | Neues Modul `frontend/src/ui/menuBackdrop.js`: Boid-Schwarm hinter dem Menü.                  |

## Einbauen

```
cp handoff/tokens.css              frontend/styles/tokens.css
cp handoff/obstacleLayer.js        frontend/src/renderer/obstacleLayer.js
cp handoff/menuBackdrop.js         frontend/src/ui/menuBackdrop.js
```

`frontend/index.html`, vor `main.css` (die Fonts liegen bewusst als `<link>` im Dokument,
nicht als `@import` in der CSS — ein `@import` blockiert das Rendering der ganzen Datei):

```html
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
  rel="stylesheet"
/>
<link rel="stylesheet" href="./styles/tokens.css" />
<link rel="stylesheet" href="./styles/main.css" />
```

## Reihenfolge

1. **Tokens.** `tokens.css` einbinden, in `main.css` die Literale gegen die Variablen
   tauschen. Reines Suchen und Ersetzen, kein Layout betroffen.
2. **Fonts.** `body { font-family: var(--font-display) }` und die Canvas-Fonts in
   `canvasRenderer.js` (`DASH_BAR_LABEL_FONT`, Countdown) umstellen.
3. **Arena-Farben.** `BACKGROUND_COLOR` `#111318` → `#0B0D12`, `GRID_COLOR`
   `rgba(255,255,255,.07)` → `rgba(255,255,255,.05)`, plus die Major-Grid-Linie alle 280px
   (§Grid in `design-system.md`).
4. **Hindernisse.** `obstacleLayer.js` ersetzen. `drawObstacles` bekommt einen dritten,
   optionalen Parameter (Zeit in Sekunden) — der Aufruf in `canvasRenderer.js` funktioniert
   ohne Änderung weiter.
5. **HUD.** `hud.js` von Panel-Divs auf Kicker+Wert umbauen. Kleinster Schritt mit der
   größten sichtbaren Wirkung; die `id`s (`hud-timer`, `hud-wave`, …) bleiben erhalten,
   damit die e2e-Tests weiterlaufen.
6. **Menü.** `menu.js` nach `menu-markup.html` umbauen. `optionGroup.js` bleibt
   unverändert nutzbar — es ändert sich nur dessen CSS (`.segmented`).
7. **Backdrop.** `menuBackdrop.js` beim Menü-Öffnen starten, beim Rundenstart stoppen.

## Projektregeln, die das Handoff einhält

- Alle sichtbaren Strings bleiben in `frontend/public/locales/en.json`; das Markup zeigt sie
  als Platzhalter. Neue Keys sind in `design-system.md` §7 aufgelistet.
- Keine Simulationsmathematik im Frontend. `menuBackdrop.js` ist reine Präsentation und
  fasst die Engine nicht an; die Hindernis-Phasen kommen aus dem vorhandenen
  `life_fraction`, ohne neuen Buffer und ohne Engine-Änderung.
- Alle Dateien bleiben unter 400 Zeilen.
- Keine neue Runtime-Abhängigkeit. Die Fonts sind der einzige externe Fetch; sollen sie
  lokal liegen, gehören die `.woff2` nach `frontend/public/fonts/` und die `@font-face`-Regeln
  an den Kopf von `tokens.css`.
