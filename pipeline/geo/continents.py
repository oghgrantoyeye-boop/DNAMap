"""Coarse continent for an AADR record, used only for the coverage summary.

AADR's `Political Entity` is a present-day country (or territory). We map it to a
continent for one purpose: telling readers how unevenly the world is sampled.
Russia is split at 60°E (roughly the Urals); Turkey, Cyprus and the Caucasus
count as Asia; Greenland as the Americas; Pacific islands as Oceania. These are
conventions for a summary table, not claims about the past.
"""

from __future__ import annotations

CONTINENTS = ["Africa", "Americas", "Asia", "Europe", "Oceania"]

_BY_COUNTRY: dict[str, list[str]] = {
    "Africa": ["Algeria", "Botswana", "Cameroon", "Canary Islands", "Democratic Republic of the Congo", "Egypt", "Ethiopia",
               "Kenya", "Malawi", "Morocco", "South Africa", "Sudan", "Tanzania", "Tunisia", "Uganda", "Zambia"],
    "Americas": ["Argentina", "Bahamas", "Belize", "Bolivia", "Brazil", "Canada", "Chile", "Colombia", "Cuba", "Curacao",
                 "Dominican Republic", "Greenland", "Guadeloupe", "Haiti", "Mexico", "Panama", "Paraguay", "Peru", "Puerto Rico",
                 "Saint Lucia", "Uruguay", "USA", "Venezuela"],
    "Asia": ["Afghanistan", "Armenia", "Azerbaijan", "Bahrain", "Cambodia", "China", "Cyprus", "Georgia", "India", "Indonesia",
             "Iran", "Iraq", "Israel", "Japan", "Jordan", "Kazakhstan", "Kyrgyzstan", "Laos", "Lebanon", "Malaysia", "Mongolia",
             "Nepal", "Pakistan", "Philippines", "Republic of Korea", "Syria", "Taiwan", "Tajikistan", "Thailand", "Turkey",
             "Turkmenistan", "Uzbekistan", "Vietnam", "Yemen"],
    "Oceania": ["Australia", "Federated States of Micronesia", "Guam", "Palau", "Papua New Guinea", "Solomon Islands", "Tonga",
                "Vanuatu"],
    "Europe": ["Albania", "Austria", "Belgium", "Bosnia-Herzegovina", "Bulgaria", "Channel Islands", "Crimea", "Croatia", "Czechia",
               "Denmark", "Estonia", "Faroe Islands", "Finland", "France", "Germany", "Gibraltar", "Greece", "Hungary", "Iceland",
               "Ireland", "Italy", "Latvia", "Lithuania", "Luxembourg", "Malta", "Moldova", "Montenegro", "Netherlands",
               "North Macedonia", "Norway", "Poland", "Portugal", "Romania", "Serbia", "Slovakia", "Slovenia", "Spain", "Sweden",
               "Switzerland", "Ukraine", "United Kingdom"],
}
_LOOKUP = {c: k for k, cs in _BY_COUNTRY.items() for c in cs}


def continent(political_entity: str | None, lon: float | None) -> str | None:
    """Continent for a record, or None if the entity is not in the table (the caller reports it)."""
    if political_entity == "Russia":
        return "Europe" if lon is not None and lon < 60 else "Asia"
    return _LOOKUP.get(political_entity or "")
