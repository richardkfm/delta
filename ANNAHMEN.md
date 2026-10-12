# Annahmen & Entscheidungen

delta ist ein **Schätzmodell zur Veranschaulichung, keine Prognose**. Alle Zahlen
sind gerundete Schätzwerte. Diese Datei dokumentiert, welche Lücken in der
Aufgabenstellung wie gefüllt wurden. Die Zahlenwerte selbst stehen kommentiert in
`src/config/countries.ts` (Länderkennzahlen) und `src/config/assumptions.ts`
(Modellannahmen) und werden in der App im Footer vollständig aufgelistet.

## Modell

### Regler und Kennzahlen
- Jeder Regler interpoliert linear zwischen dem deutschen Wert (0 %) und dem
  Benchmark-Wert (100 %).
- **ÖPNV-Takt & Netzdichte** steuert drei Kennzahlen gemeinsam: Ø Takt (angezeigt),
  ÖPNV-Trassen-km je 100.000 Einw. (für Investitionen) und die
  Tür-zu-Tür-Geschwindigkeit des ÖPNV (für den Mobilitätsradius).
- **Radinfrastruktur** steuert Radanteil (angezeigt), Radweg-km je 1.000 Einw.
  (Investitionen) und Rad-Tür-zu-Tür-Geschwindigkeit (Radius).
- Angezeigter Wert beim Autoanteil: Anteil der Wege mit dem Auto (Fahrer + Mitfahrer),
  DE ca. 57 %, NL ca. 47 %.
- Ø Takt DE 20 Min. / NL 10 Min. ist ein grober Schätzwert (Stadt dichter, Land
  deutlich seltener).

### Effekte werden über „Verbesserungen“ berechnet
Damit neue Benchmark-Länder ohne Codeänderung funktionieren, rechnet das Modell
nicht mit Reglerstellungen, sondern mit der Verbesserung gegenüber Deutschland:
relative Taktverkürzung, Pünktlichkeitsgewinn, Zuwachs des Radanteils, relativer
Rückgang des Autoanteils. Ist ein Benchmark-Land in einer Kennzahl **schlechter**
als Deutschland, setzt das Modell **keine Verschlechterung** an (Verbesserung = 0).
Die angezeigte Kennzahl am Regler zeigt trotzdem den echten interpolierten Wert.

### Zeit
- Pendelzeit skaliert linear mit dem Arbeitsweg: 60 Min./Tag bei 17 km einfach.
- ÖPNV-Effekt: Pendelzeit sinkt um 0,36 × relative Taktverkürzung. Bei NL (Takt
  halbiert) sind das −18 % (Mitte der vorgegebenen −15 bis −20 %). Der Effekt gilt
  für alle Pendelnden als Mittel aus Umstieg auf den ÖPNV und weniger Stau.
- Pufferzeit: heute 10 Min./Tag, proportional zur Unpünktlichkeit (1 − p). Volle
  Pufferzeit ab dem Ø-Arbeitsweg, bei kürzeren Wegen anteilig, ohne Arbeitsweg 0.
- Alltagswege: 300 Min./Woche, Radeffekt 0,75 × Zuwachs Radanteil (NL: −12 %).
- 5 Arbeitstage pro Woche, 46 Arbeitswochen pro Jahr.
- Wohnlagefaktoren: Land profitiert stärker vom Takt (× 1,3) und weniger vom Rad
  (× 0,6), Großstadt umgekehrt (Takt × 0,9, Rad × 1,2).
- Der Regler Autoabhängigkeit wirkt nicht auf die Zeit, nur auf Geld, Staat und CO₂.

### Geld
- Formel: Wahrscheinlichkeit Autoverzicht × (Auto-Vollkosten − Ticket) × 12.
  Das Ticket wird nur fällig, wenn das Auto tatsächlich abgeschafft wird. So ergibt
  „alle Regler auf 0“ genau 0 €.
- Die Hauptzahl ist ein **Erwartungswert**. Darunter stehen die Wahrscheinlichkeit
  und die Ersparnis „wenn es klappt“ (5.880 €/Jahr).
- Wahrscheinlichkeit = gewichteter Index (Takt 35 %, Pünktlichkeit 15 %, Rad 25 %,
  Autoanteil 25 %), je Dimension normiert auf ungefähr den Abstand DE → NL, mal
  Obergrenze nach Wohnlage (Großstadt 70 %, Kleinstadt 45 %, Land 25 %).
- 2+ Autos: Es geht um den Zweitwagen. Wahrscheinlichkeit × 1,4, gedeckelt bei 95 %.
- 0 Autos: Kein Autoeffekt. Ersparnis = weniger Taxi/Carsharing/Mietwagen (heute
  600 €/Jahr, bis −50 %) plus Zeitgewinn × konservativer Zeitwert 8 €/Std. Der
  Zeitwert wird nur hier angesetzt, weil die Aufgabe das für Haushalte ohne Auto
  vorsieht. Bei Autohaushalten bleibt die Geldzahl reiner Cash-Effekt.
- Nicht modelliert: Spritersparnis durch weniger Fahrten bei behaltenem Auto.

### Mobilitätsradius
- Radius = Tür-zu-Tür-Geschwindigkeit × 30 Min., für ÖPNV und Rad getrennt. Gezeigt
  wird jeweils das schnellere Verkehrsmittel.
- Wohnlage-Faktoren auf die Geschwindigkeit: ÖPNV Kleinstadt × 0,8, Land × 0,6
  (Zu-/Abgang, Wartezeit). Rad Großstadt × 0,95 (Ampeln).

### Staat
- Investition = Ausbaubedarf × Kosten pro km:
  - Radwege: Lücke km/1.000 Einw. × 84 Mio. Einw. × 0,5 Mio. €/km.
  - ÖPNV-Trasse: Lücke km/100.000 Einw. × Einw. × 7,5 Mio. €/km (Mitte Straßenbahn 5–10 Mio.).
  - Schiene: Pünktlichkeitsgewinn in Prozentpunkten × 320 km × 8 Mio. €/km.
    Bahn-Pünktlichkeit hat keine sinnvolle Pro-Kopf-Netzlücke (DE hat sogar mehr
    Schienennetz je km² als NL), daher diese Hilfsannahme.
  - Autoabhängigkeit: keine Infrastrukturkosten (steht für Ordnungspolitik wie
    Parkraum und Pricing).
- **Zusätzlich** zu den Vorgaben: laufende Mehrkosten für den dichteren Takt
  (14 Mrd. € Betriebskosten × (Takt-Verhältnis − 1) × 25 % netto). Ohne diese
  Kosten wäre das Bild zu rosig.
- Nutzen = Folgekosten des Autoverkehrs × relativer Rückgang der Autofahrten:
  Straßenerhalt 20 Mrd. €/Jahr (nur 40 % variabel, Lkw dominieren den Verschleiß),
  Unfälle 30 Mrd. €/Jahr, Gesundheit (Lärm, Luft, Bewegungsmangel) 40 Mrd. €/Jahr.
- Zeitverlauf: 10 Jahre Bauzeit mit gleichmäßig verteilten Investitionen. Nutzen
  und Betriebs-Mehrkosten wachsen in der Bauzeit linear mit. Betrachtung über 30
  Jahre ohne Diskontierung.
- Ergebnis bei vollem NL-Niveau: ca. 149 Mrd. € Investition, 13,7 Mrd. €/Jahr
  Nutzen, Break-even im Jahr 20.
- Bekannte Vereinfachung: Investitionen folgen den Infrastruktur-Kennzahlen, die
  Wirkung folgt den Nutzungs-Kennzahlen. Ein Land mit mehr Radwegen, aber
  geringerem Radanteil würde Kosten ohne Radnutzen erzeugen. Für NL tritt das
  nicht auf.

### CO₂
- Vermiedene Auto-km = 7.000 Pkw-km pro Person und Jahr × relativer Rückgang der
  Autofahrten.
- Netto 150 g/km Auto minus 60 % Verlagerung × 40 g/km ÖPNV. Ø pro Person.

## UI
- Startzustand ohne URL-Parameter: alle Regler auf 100 % (volles NL-Niveau),
  Großstadt, 17 km, 1 Auto. Damit sieht man beim ersten Besuch sofort die
  Kernaussage.
- URL-Parameter: `b`, `oepnv`, `bahn`, `rad`, `auto` (0–100), `lage`, `km`, `autos`.
  Ungültige Werte fallen auf den Standard zurück, Zahlen werden begrenzt
  (Arbeitsweg 0–100 km).
- Auf dem Handy hält eine Leiste am unteren Rand die beiden Hauptzahlen sichtbar,
  während man die Regler bewegt.
- Das Diagramm (Recharts) wird nachgeladen, damit die Seite schnell startet.
- Animation der Hauptzahlen respektiert „Bewegung reduzieren“.
- Der Ländername im Fließtext kommt aus dem Config-Feld `inName`
  (z. B. „in den Niederlanden“), wegen der deutschen Grammatik.

## Erweiterbarkeit
Ein neues Benchmark-Land wird nur in `BENCHMARKS` in `src/config/countries.ts`
ergänzt. Geprüft mit einem Dummy-Land, das in manchen Kennzahlen besser als NL und
in anderen schlechter als DE war: Das Dropdown, die Regler-Kennzahlen, der
URL-Parameter, die Footer-Tabelle und alle Berechnungen funktionierten ohne
Codeänderung, und alle Tests blieben grün. Das Dummy-Land wurde danach entfernt.
Ein Dummy-Land als Inline-Objekt bleibt in `src/model/index.test.ts` als
Regressionstest.
