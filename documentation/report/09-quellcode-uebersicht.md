# 9 Quellcode-Übersicht

`Seitenbudget: ~1 S. | Status: Gerüst | Quellen: die Befehle unten`

**Dies ist die einzige Stelle im Bericht, an der Zahlen stehen.** LOC, Dateizahlen,
Testzahlen, Coverage-Prozente und Commit-Zahlen gehören ausschließlich hierher; alle
anderen Kapitel verweisen zurück. Sonst tauchen dieselben Zahlen in Kap. 3, 4 und 8
auf und laufen bis zur Abgabe auseinander.

**Zahlen erst nach dem Code-Freeze (24.08.2026) einsetzen** — und zwingend _nach_
T-01/T-02, weil die JSDoc-Pflicht die Zeilenzahlen erhöht und die 400-Zeilen-Regel
neue Datei-Splits auslösen kann.

## 9.1 Methodik der Masszahlen

Die Zahlen werden nicht geschätzt, sondern erhoben. Die Befehle sind Teil der
Antwort — sie machen die Angaben reproduzierbar und prüfbar.

```bash
# Engine: Dateien und Zeilen
find engine/src -name '*.rs' | wc -l
find engine/src -name '*.rs' -exec wc -l {} + | sort -n

# Engine: Testfunktionen
grep -rc '#\[test\]' engine/src --include='*.rs' | awk -F: '{s+=$2} END {print s}'

# Frontend: handgeschriebene Dateien und Zeilen (Build-Artefakte ausgenommen)
find frontend/src -name '*.js' -not -path '*/wasm/*' | wc -l
find frontend/src -name '*.js' -not -path '*/wasm/*' -exec wc -l {} + | sort -n

# Frontend: Testfälle
grep -rhoE '\b(it|test)\(' frontend/src --include='*.test.js' | wc -l

# Weitere Assets
wc -l frontend/styles/main.css frontend/index.html frontend/public/locales/en.json

# Repository-Historie
git log --oneline | wc -l
git log --format='%s' | grep -oE '^[a-z]+' | sort | uniq -c | sort -rn
```

> TODO: Nach dem Freeze einmal ausführen und die Ausgaben hier einsetzen. Nicht
> vergessen: `frontend/src/wasm/engine/` ist ein gitignoriertes Build-Artefakt und
> zählt **nicht** als Quellcode — das ist explizit zu erwähnen, weil es sonst wie
> eine Auslassung wirkt.

## 9.2 Größe und Verteilung

> TODO: Tabelle `Schicht | Dateien | Zeilen | Anteil (%)`, getrennt nach Engine
> (`engine/src`), Frontend (`frontend/src`) und Tests. Danach ein bis zwei Sätze
> **Interpretation**, nicht nur Zahlen — z. B. wie sich das Verhältnis von
> Simulationscode zu Darstellungscode zur Zweischichtigkeit aus Kap. 2 verhält, und
> welcher Anteil auf Tests fällt.

## 9.3 Weitere Masszahlen

> TODO:
>
> - Anzahl Commits und ihre Verteilung nach Conventional-Commit-Typ (Befehl oben) —
>   belegt die Commit-Disziplin aus Kap. 6 mit Daten.
> - Sprachen: eine Locale (`en`), Verweis auf die i18n-Regel.
> - Größe des ausgelieferten Bundles inkl. `.wasm` nach `npm run build` — für eine
>   Anwendung mit Fokus „Systemnah/WASM" eine relevante Zahl.
> - Anzahl `#[wasm_bindgen]`-Exports = Breite der Sprachgrenze. Passt zur Aussage aus
>   Kap. 5, die Grenze sei absichtlich schmal, und belegt sie.
