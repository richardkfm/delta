# Annahmen & Entscheidungen

delta ist ein **Schätzmodell zur Veranschaulichung, keine Prognose**. Diese Datei
dokumentiert, welche Werte belegt sind, welche Modellannahmen sind und wie Lücken
gefüllt wurden.

- Die Zahlenwerte stehen kommentiert in `src/config/countries.ts`
  (Länderkennzahlen) und `src/config/assumptions.ts` (Modellannahmen).
- Belegte Werte verweisen mit `[Quelle: <id>]` auf `src/config/sources.ts`, nicht
  belegte Werte sind mit `[Annahme]` markiert.
- Die App listet alle Werte im Footer mit Fußnoten und der verlinkten
  Quellenliste auf.
- Ein Test (`src/config/sources.test.ts`) stellt sicher, dass jeder Verweis auf
  eine existierende Quelle zeigt und jede Quelle verwendet wird.

Stand der Recherche: Oktober 2026.

## Belegte Kennzahlen

| Kennzahl | Deutschland | Niederlande | Quelle |
| --- | --- | --- | --- |
| Autoanteil an allen Wegen (Fahrer + Mitfahrer) | 53 % | 44,7 % | MiD 2023; CBS ODiN 2023 |
| Radanteil an allen Wegen | 11 % | 26,8 % | MiD 2023; CBS ODiN 2023 |
| Bahn-Pünktlichkeit | 60,1 % (DB-Fernverkehr 2025, Züge < 6 Min.) | 90,7 % (NS-Hauptnetz 2025, Reisende < 5 Min.) | DB; NS Jaarverantwoording 2025 |
| Tür-zu-Tür-Tempo Bus/Tram | 15,9 km/h | 18,9 km/h | MiD 2023 Tab. 24; CBS 84711NED |
| Tür-zu-Tür-Tempo Rad | ca. 10 km/h (Hessen als Näherung) | 11,1 km/h | MiD 2023 Hessen; CBS 84711NED |
| Straßen-/Stadtbahn je 100.000 Einw. | 4,0 km | 1,7 km | VDV-Statistik 2023; Wikipedia (Hilfsquelle) |
| Radwege je 1.000 Einw. | **0,9 km (Annahme)** | 1,9 km | Fietsberaad 2012; DE: keine bundesweite Zahl |

Hinweise zur Vergleichbarkeit:
- Die Erhebungen MiD (alle Altersgruppen) und ODiN (ab 6 Jahren) sind nur grob
  vergleichbar.
- Die Pünktlichkeit ist unterschiedlich definiert. NS nutzt seit 2025 offiziell
  eine 3-Minuten-Schwelle (85,5 %). Wir verwenden den 5-Minuten-Wert, weil er der
  DB-Schwelle am nächsten kommt.
- Für Deutschland ist nur die Länge der Radwege an Bundesstraßen belegt
  (16.398 km, ca. 0,2 km je 1.000 Einw.).

## Nicht belegbar – bewusst als Annahme beibehalten

- **ÖPNV-Takt** (DE alle 20 Min., NL alle 10 Min.): Für DE und NL gibt es keine
  vergleichbare Kennzahl. Agora Verkehrswende sieht die Niederlande außerhalb der
  Randstad eher *nicht* dichter getaktet als Deutschland.
  - Auf Wunsch bleibt der Takt trotzdem die Kennzahl des ÖPNV-Reglers, ist in
    der App aber als Annahme gekennzeichnet.
  - Der Regler wirkt über die Taktverkürzung auf die Pendelzeit (−18 % bei NL).
- **Pufferzeit** 10 Min./Tag beim heutigen DE-Niveau: Das ist eine
  Projektvorgabe, eine Studie dazu wurde nicht gefunden.
- **Alle Wirkungsstärken**: Elastizitäten, Wohnlagefaktoren, Gewichte und
  Obergrenzen der Wahrscheinlichkeit für Autoverzicht.
- **Auto-Vollkosten 550 €/Monat**: liegen bewusst unter den ADAC-Werten für
  Neuwagen der Kompaktklasse (ca. 640–675 €/Monat). Der Bestand ist älter und
  fährt weniger (Ø 12.300 km/Jahr).

## Modell

### Regler und Effekte
- Jeder Regler interpoliert linear zwischen dem deutschen Wert (0 %) und dem
  Benchmark-Wert (100 %).
- Die Effekte werden über die **Verbesserung gegenüber Deutschland** berechnet:
  - relative Taktverkürzung,
  - Pünktlichkeitsgewinn,
  - Zuwachs des Radanteils,
  - relativer Rückgang des Autoanteils.
- Ist ein Benchmark-Land in einer Kennzahl schlechter als Deutschland, rechnet
  das Modell dort keine Verschlechterung, sondern keinen Effekt.
- Beispiel: NL hat weniger Straßenbahn pro Kopf als DE. Daher entsteht hier
  kein Investitionsbedarf.

### Zeit
- Arbeitsweg: 52 Min./Tag bei 17 km einfach, aus den Destatis-Klassen 2024
  abgeleitet. Die Pendelzeit skaliert linear mit der Distanz.
- Pendeln: Pendelzeit × 0,36 × relative Taktverkürzung, also −18 % bei NL.
- Pufferzeit: proportional zur Unpünktlichkeit (1 − p). Bei kurzen Wegen wird
  sie anteilig angesetzt, ohne Arbeitsweg gar nicht.
- Alltagswege: 345 Min./Woche für Einkauf, Erledigungen und Freizeit, aus MiD
  2023 Tab. 11 abgeleitet. Radeffekt = 0,75 × Zuwachs Radanteil, also −12 % bei NL.
- Ergebnis bei vollem NL-Niveau und 17 km: Großstadt 2,2 Std., Kleinstadt
  2,1 Std., Land 2,0 Std. pro Woche.
- Der Plausibilitätstest prüft den angezeigten, auf eine Nachkommastelle
  gerundeten Wert. Auf dem Land liegt der exakte Wert bei 1,998 Std.

### Geld
- Formel: Wahrscheinlichkeit Autoverzicht × (550 € − 63 €) × 12, also
  5.844 €/Jahr, wenn das Auto abgeschafft wird.
- Die Hauptzahl ist ein Erwartungswert, bei vollem NL-Niveau in der Großstadt
  4.088 €/Jahr.
- Die Wahrscheinlichkeit ist ein gewichteter Index der vier Verbesserungen,
  jeweils normiert auf den Abstand DE → NL. Darauf wirkt eine Obergrenze nach
  Wohnlage: Großstadt 70 %, Kleinstadt 45 %, Land 25 %.
- Bei 2+ Autos geht es um den Zweitwagen: Wahrscheinlichkeit × 1,4, höchstens 95 %.
- Haushalte ohne Auto: Ersparnis aus weniger Taxi, Carsharing und Co. (600 €/Jahr,
  bis −50 %) plus Zeitgewinn × 8 €/Std.

### Mobilitätsradius
- Radius = belegtes Tür-zu-Tür-Tempo × 30 Min., getrennt für ÖPNV und Rad. Das
  schnellere Verkehrsmittel zählt.
- Wohnlagefaktoren (Annahme): ÖPNV Kleinstadt × 0,8 und Land × 0,6, Rad
  Großstadt × 0,95.

### Staat
- **Radwege:** Lücke je 1.000 Einw. × 83,5 Mio. × 0,5 Mio. €/km.
  - Das ist der Orientierungswert für Radwege außerorts.
  - Innerorts oder als Radschnellweg kostet ein km 1–2 Mio. €. Der Wert ist
    also eher konservativ.
- **Straßenbahn:** 12,5 Mio. €/km. Mit NL als Benchmark entsteht keine Lücke.
- **Schiene:** Pünktlichkeitsgewinn in Prozentpunkten × 130 km × 15 Mio. €/km.
  - Anker: 4.000 km Hochleistungskorridore für den Abstand DE → NL (30,6 Pp.).
  - Kosten: Die Riedbahn kostete ca. 21 Mio. €/km, die ursprüngliche
    DB-Schätzung lag bei ca. 6,8 Mio. €/km.
  - Die Verknüpfung von km und Pünktlichkeit ist eine Annahme.
- **ÖPNV-Betrieb:** 39 Mrd. € Aufwand × relativer Tempogewinn (19 %) × 67 %
  nicht durch Fahrgeld gedeckt, also ca. 4,9 Mrd. €/Jahr.
  - Annahme: Das Angebot wächst so stark wie das Tempo.
  - Das VDV-„Deutschlandangebot“ (+90 % Angebot, +31 Mrd. €/Jahr) wurde bewusst
    nicht voll angesetzt, weil es weit über NL-Niveau hinausgeht.
- **Nutzen:** externe Kosten des Pkw-Verkehrs nach INFRAS (2017) ×
  relativer Rückgang der Autofahrten (15,7 % bei NL). Entschieden wurde, die
  Kosten komplett anzusetzen:

  | Posten | Mrd. €/Jahr | Anteil variabel |
  | --- | --- | --- |
  | Unfälle | 48,8 | 100 % |
  | Gesundheit (Luft, Lärm) | 9,1 | 100 % |
  | Klima | 16,6 | 100 % |
  | Natur & Landschaft | 8,9 | 100 % |
  | Energie & Fahrzeugherstellung | 20,5 | 100 % |
  | Straßenerhalt (Böttger 2021) | 19,1 | 40 % |

  - Das sind gesellschaftliche Kosten, nicht nur Ausgaben im Staatshaushalt.
  - Bewegungsmangel ist nicht enthalten, dafür wurde keine belastbare Quelle
    gefunden.
  - Zum Vergleich BASt 2024: 40,2 Mrd. € volkswirtschaftliche Kosten aller
    Straßenverkehrsunfälle, mit anderer Bewertung.
- **Zeitverlauf:** 10 Jahre Bauzeit. Nutzen und Betriebs-Mehrkosten wachsen
  linear mit. Betrachtet werden 30 Jahre ohne Diskontierung.
- **Ergebnis bei vollem NL-Niveau:**
  - ca. 101 Mrd. € Investition, davon 42 Mrd. Radwege und 60 Mrd. Schiene,
  - plus 4,9 Mrd. €/Jahr für den Betrieb,
  - ca. 17,5 Mrd. €/Jahr vermiedene Folgekosten,
  - Break-even im Jahr 13.

### CO₂
- Vermiedene Pkw-km = 7.100 km pro Person und Jahr × relativer Rückgang der
  Autofahrten (KBA 2023).
- Ein Pkw-km verursacht 230 g CO₂e inkl. Vorkette (UBA: 164 g je
  Personen-km × 1,4 Personen).
- 60 % der vermiedenen Personen-km wandern in den ÖPNV (Annahme). Dort fallen
  ca. 58 g je Personen-km an (UBA, eigene Gewichtung von Bus, Tram und
  Regionalbahn).

## UI
- Startzustand ohne URL-Parameter: alle Regler auf 100 % (volles NL-Niveau),
  Großstadt, 17 km, 1 Auto.
- URL-Parameter: `b`, `oepnv`, `bahn`, `rad`, `auto` (0–100), `lage`, `km`,
  `autos`. Ungültige Werte fallen auf den Standard zurück.
- Auf dem Handy hält eine Leiste am unteren Rand die Hauptzahlen sichtbar.
- Das Diagramm wird nachgeladen. Die Animation respektiert „Bewegung reduzieren“.
- Der Ländername im Fließtext kommt aus dem Config-Feld `inName`.

## Erweiterbarkeit
- Ein neues Benchmark-Land wird nur in `BENCHMARKS` in
  `src/config/countries.ts` ergänzt.
- Getestet mit einem Dummy-Land: Dropdown, Regler, URL, Footer-Tabelle und alle
  Berechnungen funktionierten ohne Codeänderung. Danach wurde es entfernt.
- Ein Inline-Dummy-Land bleibt als Regressionstest in `src/model/index.test.ts`.
