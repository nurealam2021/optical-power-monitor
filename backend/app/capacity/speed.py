import re


_SPEED_GBPS: dict[str, float] = {
    "100G": 100.0,
    "40G": 40.0,
    "25G": 25.0,
    "10G": 10.0,
    "1G": 1.0,
    "100M": 0.1,
    "Unknown": 0.0,
}


def speed_to_gbps(speed: str) -> float:
    """
    Converts a speed label (as returned by infer_port_speed) into a
    numeric Gbps value, so port speeds can be summed into total/used/
    free bandwidth capacity. Unknown speeds contribute 0 -- they are
    excluded from bandwidth totals but still counted as ports.
    """

    return _SPEED_GBPS.get(speed, 0.0)


# Huawei prints the negotiated/assigned speed directly in the interface
# name when it's known, e.g. "GE0/2/0(10G)" or "GE0/2/14(100M)". This is
# the single most reliable signal when present -- check it before
# falling back to guessing from the interface type prefix.
_EXPLICIT_SPEED_PATTERN = re.compile(r"\((\d+)\s*(g|m)\)", re.IGNORECASE)


# Ordered longest/most-specific match first, so "100GE" is checked
# before "GE", "TenGigE" before "GigE", etc.
_SPEED_PATTERNS: list[tuple[str, str]] = [
    (r"(hundredgig|100ge|100g|hgig)", "100G"),
    (r"(fortygig|40ge|40g|fgig)", "40G"),
    (r"(twentyfivegig|25ge|25g)", "25G"),
    (r"(tengig|10ge|10g|xge|xgig)", "10G"),
    (r"(gigabiteth|^ge|[^0-9]ge[^a-z]|1ge|1000m)", "1G"),
    (r"(fastEth|fe\d|100m)", "100M"),
]


def infer_port_speed(interface_name: str) -> str:
    """
    Infers a port's speed category (100G / 40G / 25G / 10G / 1G / 100M)
    from its interface name.

    First checks for an explicit vendor-printed suffix like "(10G)" or
    "(100M)" (Huawei does this). If not present, falls back to standard
    vendor naming conventions:

    Cisco:  TenGigE, HundredGigE, FortyGigE, GigabitEthernet
    Huawei: 10GE, 100GE, 40GE, GE (GigabitEthernet)
    ZTE:    similar to above, occasionally lowercase (gei_, xgei_, etc.)

    Returns "Unknown" if no pattern matches, rather than guessing.
    """

    explicit_match = _EXPLICIT_SPEED_PATTERN.search(interface_name)

    if explicit_match:
        value = explicit_match.group(1)
        unit = explicit_match.group(2).upper()
        return f"{value}{unit}"

    # Huawei's bare "GE<digits>" short-form (e.g. "GE0/2/12") does NOT
    # reliably mean 1G -- on many platforms the same "GE" prefix is
    # used for 10G-capable slots too, disambiguated only by the
    # "(10G)"/"(100M)" suffix above when the port has negotiated a
    # speed. Without that suffix, guessing 1G is more often wrong than
    # right, so report Unknown instead of guessing.
    if re.match(r"^ge\d", interface_name, re.IGNORECASE):
        return "Unknown"

    name = interface_name.lower()

    for pattern, speed in _SPEED_PATTERNS:
        if re.search(pattern, name):
            return speed

    return "Unknown"
