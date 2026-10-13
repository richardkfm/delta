/**
 * Quellenverzeichnis. Werte in `countries.ts` und `assumptions.ts` verweisen in
 * ihren Kommentaren mit [Quelle: <id>] auf diese Einträge. Der Footer der App
 * listet alle Quellen verlinkt auf. Stand der Recherche: Oktober 2026.
 */
export interface Source {
  /** Kurz-ID für Verweise aus der Config, z. B. "mid2017". */
  id: string
  /** Titel der Veröffentlichung oder Seite. */
  title: string
  /** Herausgeber. */
  publisher: string
  /** Bezugsjahr der Daten bzw. Erscheinungsjahr. */
  year: string
  url: string
  /** Wofür die Quelle im Modell verwendet wird. */
  usedFor: string
}

export const SOURCES: Source[] = [
  // ---------- Mobilität Deutschland ----------
  {
    id: 'mid2023-zusammenfassung',
    title: 'Mobilität in Deutschland – MiD 2023, Studienzusammenfassung',
    publisher: 'BMV / infas, DLR, IVT',
    year: '2023',
    url: 'https://www.mobilitaet-in-deutschland.de/pdf/MiD2023_Studienzusammenfassung.pdf',
    usedFor: 'Auto- und Radanteil an allen Wegen (DE)',
  },
  {
    id: 'mid2023-ergebnisbericht',
    title: 'Mobilität in Deutschland – MiD 2023, Ergebnisbericht',
    publisher: 'BMV / infas, DLR, IVT',
    year: '2023',
    url: 'https://www.mobilitaet-in-deutschland.de/pdf/MiD2023_Ergebnisbericht.pdf',
    usedFor: 'Tür-zu-Tür-Tempo Bus/Tram, Zeit für Alltagswege (DE)',
  },
  {
    id: 'mid2023-hessen',
    title: 'Mobilität in Deutschland 2023 – Regionalbericht Hessen',
    publisher: 'infas / Hessisches Wirtschaftsministerium',
    year: '2023',
    url: 'https://wirtschaft.hessen.de/sites/wirtschaft.hessen.de/files/2026-07/infas_regionalbericht_hessen_mid2023.pdf',
    usedFor: 'Tür-zu-Tür-Tempo Rad (Näherung für DE)',
  },
  {
    id: 'destatis-pendler-2024',
    title: '65 % der Arbeitnehmerinnen und Arbeitnehmer fahren mit dem Auto zur Arbeit',
    publisher: 'Statistisches Bundesamt',
    year: '2024',
    url: 'https://www.destatis.de/DE/Presse/Pressemitteilungen/2025/05/PD25_N027_13.html',
    usedFor: 'Länge des Arbeitswegs (Ø aus Entfernungsklassen abgeleitet)',
  },
  {
    id: 'destatis-pendelzeit-2024',
    title: 'Zeitaufwand für den Weg zur Arbeit',
    publisher: 'Statistisches Bundesamt',
    year: '2024',
    url: 'https://www.destatis.de/DE/Themen/Arbeit/Arbeitsmarkt/Qualitaet-Arbeit/Dimension-3/zeitaufwand-weg-arbeit.html',
    usedFor: 'Dauer des Arbeitswegs (Ø aus Zeitklassen abgeleitet)',
  },
  {
    id: 'destatis-bev-2025',
    title: 'Bevölkerung Deutschlands sinkt im Jahr 2025 um 0,1 %',
    publisher: 'Statistisches Bundesamt',
    year: '2025',
    url: 'https://www.destatis.de/DE/Presse/Pressemitteilungen/2026/06/PD26_203_124.html',
    usedFor: 'Einwohnerzahl Deutschland',
  },
  {
    id: 'kba-fahrleistung-2023',
    title: 'Entwicklung der Fahrleistungen nach Fahrzeugarten',
    publisher: 'Kraftfahrt-Bundesamt',
    year: '2023',
    url: 'https://www.kba.de/DE/Presse/Pressemitteilungen/Allgemein/2024/pm21_2024_Entw_Fahrleistung.html',
    usedFor: 'Pkw-Kilometer pro Person',
  },
  // ---------- Mobilität Niederlande ----------
  {
    id: 'cbs-odin-persoon',
    title: 'Mobiliteit; per persoon, persoonskenmerken, vervoerwijzen en regio’s (ODiN, Tabelle 84709NED)',
    publisher: 'CBS',
    year: '2023',
    url: 'https://opendata.cbs.nl/ODataApi/odata/84709NED/TypedDataSet',
    usedFor: 'Auto- und Radanteil an allen Wegen (NL)',
  },
  {
    id: 'cbs-odin-verplaatsing',
    title: 'Mobiliteit; per verplaatsing, vervoerwijzen, motieven, regio’s (ODiN, Tabelle 84711NED)',
    publisher: 'CBS',
    year: '2023',
    url: 'https://opendata.cbs.nl/ODataApi/odata/84711NED/TypedDataSet',
    usedFor: 'Tür-zu-Tür-Tempo Bus/Tram/Metro und Rad (NL)',
  },
  {
    id: 'cbs-bevolking',
    title: 'Bevolkingsontwikkeling; maand en jaar (Tabelle 83474NED)',
    publisher: 'CBS',
    year: '2025',
    url: 'https://opendata.cbs.nl/ODataApi/odata/83474NED/TypedDataSet',
    usedFor: 'Einwohnerzahl Niederlande',
  },
  // ---------- Bahn ----------
  {
    id: 'db-2025',
    title: 'Deutsche Bahn: Schritt nach vorn bei Umsatz und operativem Ergebnis',
    publisher: 'Deutsche Bahn AG',
    year: '2025',
    url: 'https://www.deutschebahn.com/de/presse/pressestart_zentrales_uebersicht/Deutsche-Bahn-Schritt-nach-vorn-bei-Umsatz-und-operativem-Ergebnis-13777970',
    usedFor: 'Pünktlichkeit DB-Fernverkehr',
  },
  {
    id: 'bundestag-19-9205',
    title: 'Antwort der Bundesregierung, Drucksache 19/9205',
    publisher: 'Deutscher Bundestag',
    year: '2019',
    url: 'https://dserver.bundestag.de/btd/19/092/1909205.pdf',
    usedFor: 'Definition der DB-Pünktlichkeit (< 6 Min.)',
  },
  {
    id: 'ns-2025',
    title: 'NS Jaarverantwoording 2025, HRN-concessie 2025–2033',
    publisher: 'NS / Tweede Kamer',
    year: '2025',
    url: 'https://zoek.officielebekendmakingen.nl/blg-1249855.pdf',
    usedFor: 'Pünktlichkeit NS-Hauptnetz',
  },
  {
    id: 'brh-generalsanierung',
    title: 'Generalsanierung von Schienen-Hochleistungskorridoren (Beratungsbericht)',
    publisher: 'Bundesrechnungshof',
    year: '2025',
    url: 'https://www.bundesrechnungshof.de/fileadmin/import/___Alte_Struktur/Downloads/DE/Berichte/2025/riedbahn-volltext-riedbahn-volltext.pdf',
    usedFor: 'Sanierungskosten Schiene pro km, Umfang der Korridore',
  },
  // ---------- ÖPNV ----------
  {
    id: 'agora-oev-atlas-2026',
    title: 'ÖV-Atlas zeigt große Unterschiede beim Bus- und Bahnangebot',
    publisher: 'Agora Verkehrswende',
    year: '2026',
    url: 'https://www.agora-verkehrswende.de/aktuelles/oev-atlas-zeigt-grosse-unterschiede-beim-bus-und-bahnangebot',
    usedFor: 'Einordnung der ÖPNV-Anbindung in DE (Takt bleibt Annahme)',
  },
  {
    id: 'agora-oev-atlas-2023',
    title: 'ÖV-Atlas 2023',
    publisher: 'Agora Verkehrswende',
    year: '2023',
    url: 'https://www.agora-verkehrswende.de/veroeffentlichungen/oev-atlas-2023',
    usedFor: 'Einordnung des Takts in NL (Takt bleibt Annahme)',
  },
  {
    id: 'vdv-statistik-2023',
    title: 'VDV-Statistik 2023',
    publisher: 'Verband Deutscher Verkehrsunternehmen',
    year: '2023',
    url: 'https://www.vdv.de/vdv-statistik-2023.pdfx',
    usedFor: 'Streckenlänge Straßen-/Stadtbahn (DE)',
  },
  {
    id: 'wikipedia-tram',
    title: 'List of tram and light rail transit systems',
    publisher: 'Wikipedia',
    year: '2026',
    url: 'https://en.wikipedia.org/wiki/List_of_tram_and_light_rail_transit_systems',
    usedFor: 'Streckenlänge Tram (NL, Hilfsquelle)',
  },
  {
    id: 'oepnv-db-kosten',
    title: 'Kosten pro Kilometer',
    publisher: 'ÖPNV-DB (Wissensportal, nach BMDV-Studie 2021)',
    year: '2020',
    url: 'https://www.oepnv-db.de/wissen/wirtschaftlichkeit/2235683_kosten-pro-kilometer',
    usedFor: 'Baukosten Straßenbahn pro km',
  },
  {
    id: 'vdv-deutschlandangebot',
    title: 'VDV-Leistungskostengutachten „Das Deutschlandangebot“ (Langfassung)',
    publisher: 'VDV / Ramboll, PwC, Intraplan',
    year: '2024',
    url: 'https://assets.static-bahn.de/dam/jcr:b3274c11-609c-4424-b411-a06ca76bbc7c/langfassung-vdv-leistungskostengutachten-das-deutschlandangebot.pdf',
    usedFor: 'ÖPNV-Betriebskosten und Kostendeckungsgrad',
  },
  {
    id: 'correctiv-dticket',
    title: 'Faktencheck: Preis des Deutschlandtickets 2026',
    publisher: 'CORRECTIV',
    year: '2026',
    url: 'https://correctiv.org/faktencheck/aus-der-community/2026/01/15/deutschlandticket-tiktok-video-erfindet-drastischen-preisanstieg-fuer-2026/',
    usedFor: 'Ticketpreis (63 €/Monat)',
  },
  // ---------- Rad ----------
  {
    id: 'fietsberaad-2012',
    title: 'Bijna 35.000 km fietspad in Nederland',
    publisher: 'Fietsberaad (nach Fietsersbond)',
    year: '2012',
    url: 'https://www.fietsberaad.nl/Kennisbank/Bijna-35-000-km-fietspad-in-Nederland',
    usedFor: 'Radweglänge NL',
  },
  {
    id: 'bundestag-21-2158',
    title: 'Antwort der Bundesregierung, Drucksache 21/2158 (Radverkehrsinfrastruktur)',
    publisher: 'Deutscher Bundestag',
    year: '2025',
    url: 'https://dserver.bundestag.de/btd/21/021/2102158.pdf',
    usedFor: 'Radwege an Bundesstraßen (keine bundesweite Gesamtlänge)',
  },
  {
    id: 'hessen-radweg-kosten',
    title: 'Fragen und Antworten rund ums Radfahren und den Radwegebau in Hessen',
    publisher: 'Hessisches Verkehrsministerium',
    year: '2021',
    url: 'https://wirtschaft.hessen.de/sites/wirtschaft.hessen.de/files/2021-07/210629_faq_radwege_2_1.pdf',
    usedFor: 'Baukosten Radweg pro km',
  },
  // ---------- Kosten Auto ----------
  {
    id: 'adac-autokosten',
    title: 'Kilometerkosten berechnen (nach ADAC-Autokostenübersicht 2026)',
    publisher: 'deutschland-rechnet.de',
    year: '2026',
    url: 'https://deutschland-rechnet.de/auto/km-kostenrechner/',
    usedFor: 'Auto-Vollkosten (Einordnung)',
  },
  {
    id: 'adac-kompaktklasse',
    title: 'Die günstigsten Autos der unteren Mittelklasse',
    publisher: 'ADAC',
    year: '2025',
    url: 'https://www.adac.de/rund-ums-fahrzeug/auto-kaufen-verkaufen/autokosten/guenstigste-autos-untere-mittelklasse/',
    usedFor: 'Methodik der Auto-Vollkosten',
  },
  // ---------- Folgekosten ----------
  {
    id: 'infras-2019',
    title: 'Externe Kosten des Verkehrs in Deutschland',
    publisher: 'INFRAS für Allianz pro Schiene',
    year: '2017',
    url: 'https://www.allianz-pro-schiene.de/wp-content/uploads/2019/08/190826-infras-studie-externe-kosten-verkehr.pdf',
    usedFor: 'Folgekosten des Pkw-Verkehrs (Unfälle, Luft, Lärm, Klima, Natur, Vorkette)',
  },
  {
    id: 'bast-unfallkosten',
    title: 'Volkswirtschaftliche Kosten von Straßenverkehrsunfällen in Deutschland',
    publisher: 'Bundesanstalt für Straßenwesen',
    year: '2024',
    url: 'https://www.bast.de/DE/Publikationen/Statistik/Unfaelle/volkswirtschaftliche_kosten.pdf?__blob=publicationFile&v=2',
    usedFor: 'Vergleichswert Unfallkosten',
  },
  {
    id: 'boettger-2021',
    title: 'Abschätzung der Kosten der Verkehrsträger im Vergleich',
    publisher: 'HTW Berlin (Prof. Böttger) für Netzwerk Europäischer Eisenbahnen',
    year: '2020',
    url: 'https://die-gueterbahnen.com/assets/files/news/2021/studie-abschaetzung-der-kosten-der-verkehrstraeger-im-vergleich.pdf',
    usedFor: 'Ausgaben für Erhaltung und Betrieb der Straßen',
  },
  {
    id: 'wegekosten-2021',
    title: 'Wegekostengutachten Bundesfernstraßen 2023–2027 (Endbericht)',
    publisher: 'Alfen Consult / AVISO für das BMDV',
    year: '2021',
    url: 'https://www.bmv.de/SharedDocs/DE/Anlage/StV/wegekostengutachten-2018-2022-endbericht.pdf?__blob=publicationFile',
    usedFor: 'Anteil der Pkw an den Straßenkosten',
  },
  {
    id: 'uba-emissionen-2024',
    title: 'Vergleich der durchschnittlichen Emissionen einzelner Verkehrsmittel im Personenverkehr 2024',
    publisher: 'Umweltbundesamt (TREMOD)',
    year: '2024',
    url: 'https://www.umweltbundesamt.de/system/files/medien/366/bilder/dateien/vtv_2024_pv_tab_pdf.pdf',
    usedFor: 'CO₂e je km für Pkw und ÖPNV, Pkw-Besetzung',
  },
]

/** Liefert eine Quelle zur ID (oder undefined). */
export function getSource(id: string): Source | undefined {
  return SOURCES.find((s) => s.id === id)
}
