from dataclasses import dataclass


@dataclass
class ParsedPort:
    interface_name: str
    status_raw: str
    is_up: bool
    description: str


# Interface name prefixes that are logical/virtual constructs, not
# physical ports. These ride on top of real physical interfaces (a LAG
# bundle is made of physical members; a sub-interface shares its
# parent's physical port), so counting them as separate "ports" would
# double-count and skew free/used/total numbers.
_LOGICAL_PREFIXES = (
    "eth-trunk",
    "port-channel",
    "smartgroup",
    "bridge-group",
    "loopback",
    "loop",
    "null",
    "nve",
    "vlanif",
    "tunnel",
)


def is_physical_interface(interface_name: str) -> bool:
    """
    Returns False for logical/virtual interfaces that shouldn't be
    counted as physical port capacity:
      - Sub-interfaces (anything with a "." in the name, e.g.
        "Eth-Trunk60.291" or "GE0/2/0.101") -- these share their
        parent's physical port.
      - LAG/aggregate bundles (Eth-Trunk, Port-channel, SmartGroup)
        -- these are made of physical member ports, listed elsewhere.
      - Loopback, NULL, VLAN interfaces, tunnels -- not physical ports
        at all.
    """

    name = interface_name.lower()

    if "." in name:
        return False

    for prefix in _LOGICAL_PREFIXES:
        if name.startswith(prefix):
            return False

    return True


def _looks_like_header_or_separator(token: str) -> bool:
    lowered = token.lower()

    if lowered in ("interface", "port"):
        return True

    # Separator lines like "----------" or "=========="
    if set(token) <= {"-", "=", "_"}:
        return True

    # Huawei's "display interface description" prints a legend before
    # the real table, e.g. "PHY:", "*down:", "(l):", "(s):", "Error:".
    # Every legend/error line's first token ends with a colon -- no
    # real interface name ends with ':'.
    if token.endswith(":"):
        return True

    # CLI prompt echo, e.g. "<hostname>display interface description".
    # Netmiko sometimes leaves the echoed command/prompt in the buffer
    # if the device's banner wasn't fully drained beforehand.
    if token.startswith("<"):
        return True

    return False


def _parse_description_table(raw_output: str) -> list[ParsedPort]:
    """
    Shared parser for all three vendors' "interface description" style
    output. The three platforms produce a very similar table shape:

        Interface        Status/PHY   Protocol   Description
        <name>            up/down      up/down    <free text, optional>

    This is intentionally tolerant of column-width differences between
    platforms/firmware versions. It does NOT try to validate the header
    row -- it just skips any line whose first token isn't a plausible
    interface name (headers, separators, vendor legends, CLI prompt
    echoes).

    NOTE: If a specific vendor's real output doesn't match this shape,
    override with a vendor-specific parser and register it below.
    """

    ports: list[ParsedPort] = []

    for raw_line in raw_output.splitlines():
        line = raw_line.rstrip()

        if not line.strip():
            continue

        tokens = line.split()

        if not tokens:
            continue

        interface_name = tokens[0]

        if _looks_like_header_or_separator(interface_name):
            continue

        # Need at least an interface name + one status token to be useful.
        if len(tokens) < 2:
            continue

        status_raw = tokens[1]
        status_lower = status_raw.lower().lstrip("*")

        is_up = "up" in status_lower and "down" not in status_lower

        # Column 3 (if present) is usually the Protocol state (up/down).
        # Anything after that is the free-text description. If column 3
        # isn't itself an up/down token, treat it as the start of the
        # description instead (some platforms omit the Protocol column).
        description = ""

        if len(tokens) >= 4:
            description = " ".join(tokens[3:]).strip()
        elif len(tokens) == 3 and tokens[2].lower() not in ("up", "down"):
            description = tokens[2]

        ports.append(
            ParsedPort(
                interface_name=interface_name,
                status_raw=status_raw,
                is_up=is_up,
                description=description,
            )
        )

    return ports


def parse_huawei_capacity(raw_output: str) -> list[ParsedPort]:
    return _parse_description_table(raw_output)


def parse_zte_capacity(raw_output: str) -> list[ParsedPort]:
    return _parse_description_table(raw_output)


def parse_cisco_capacity(raw_output: str) -> list[ParsedPort]:
    return _parse_description_table(raw_output)
