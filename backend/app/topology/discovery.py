import re
from dataclasses import dataclass


@dataclass
class DiscoveredNeighbor:
    local_interface: str
    remote_interface: str | None
    remote_name: str | None
    remote_management_ip: str | None
    remote_vendor: str | None


_INTERFACE_KEYS = (
    "local intf",
    "local interface",
    "local port",
    "local port id",
    "local portid",
)

_REMOTE_INTERFACE_KEYS = (
    "port id",
    "remote port",
    "remote interface",
    "remote port id",
)

_NAME_KEYS = (
    "system name",
    "neighbor device",
    "device id",
    "system-name",
)

_IP_KEYS = (
    "management address",
    "management ip",
    "management address(es)",
    "ip address",
)

_VENDOR_KEYS = (
    "system description",
    "platform",
    "system capabilities",
)


def _value(line: str) -> str | None:
    if ":" not in line:
        return None
    value = line.split(":", 1)[1].strip()
    return value or None


def _find_key(block: str, keys: tuple[str, ...]) -> str | None:
    for line in block.splitlines():
        stripped = line.strip()
        lower = stripped.lower()
        for key in keys:
            if lower.startswith(key):
                value = _value(stripped)
                if value:
                    return value
    return None


def _extract_ip(value: str | None) -> str | None:
    if not value:
        return None

    match = re.search(
        r"(?<!\d)(?:10|172\.(?:1[6-9]|2\d|3[0-1])|192\.168|169\.254)\."
        r"(?:\d{1,3}\.){1}\d{1,3}(?!\d)",
        value,
    )
    if match:
        return match.group(0)

    match = re.search(
        r"(?<![\da-fA-F:])"
        r"(?:[0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}"
        r"(?![\da-fA-F:])",
        value,
    )
    return match.group(0) if match else None


def _normalize_vendor(value: str | None) -> str | None:
    if not value:
        return None

    text = value.lower()

    if "huawei" in text or "vrp" in text:
        return "huawei"
    if "cisco" in text or "ios" in text or "xr" in text:
        return "cisco"
    if "zte" in text or "zxr10" in text:
        return "zte"

    return None


def _parse_detail_blocks(output: str) -> list[DiscoveredNeighbor]:
    neighbors: list[DiscoveredNeighbor] = []

    for block in re.split(r"\n\s*\n", output):
        local_interface = _find_key(block, _INTERFACE_KEYS)
        remote_interface = _find_key(block, _REMOTE_INTERFACE_KEYS)
        remote_name = _find_key(block, _NAME_KEYS)
        management = _find_key(block, _IP_KEYS)
        description = _find_key(block, _VENDOR_KEYS)

        remote_management_ip = _extract_ip(management)

        if local_interface and (remote_name or remote_management_ip or remote_interface):
            neighbors.append(
                DiscoveredNeighbor(
                    local_interface=local_interface,
                    remote_interface=remote_interface,
                    remote_name=remote_name,
                    remote_management_ip=remote_management_ip,
                    remote_vendor=_normalize_vendor(description),
                )
            )

    return neighbors


def _parse_brief_lines(output: str) -> list[DiscoveredNeighbor]:
    neighbors: list[DiscoveredNeighbor] = []

    for raw_line in output.splitlines():
        line = raw_line.strip()

        if not line or line.startswith(("-", "=")):
            continue

        if any(
            marker in line.lower()
            for marker in (
                "local intf",
                "local interface",
                "device id",
                "neighbor",
                "capability",
                "hold-time",
                "chassis id",
            )
        ):
            continue

        parts = re.split(r"\s{2,}|\t+", line)

        if len(parts) < 3:
            continue

        # Most vendor brief tables put the local interface and remote
        # port near the right side. Keep this conservative: a false
        # link is worse than an omitted link.
        interface_candidates = [
            part.strip()
            for part in parts
            if re.search(
                r"(?:Eth|Ethernet|GE|10GE|25GE|40GE|100GE|Gigabit|TenGig|"
                r"Gi|Te|Hu|Fo|BE|Bundle|Port-Channel|Po\d|xe-)",
                part,
                re.IGNORECASE,
            )
        ]

        if len(interface_candidates) < 1:
            continue

        local_interface = interface_candidates[0]
        remote_interface = (
            interface_candidates[-1]
            if len(interface_candidates) > 1
            else None
        )

        remote_name = parts[0].strip() if parts else None

        if remote_name and remote_name.lower() in {
            "none",
            "unknown",
            "n/a",
            "down",
        }:
            remote_name = None

        neighbors.append(
            DiscoveredNeighbor(
                local_interface=local_interface,
                remote_interface=remote_interface,
                remote_name=remote_name,
                remote_management_ip=_extract_ip(line),
                remote_vendor=_normalize_vendor(line),
            )
        )

    return neighbors


def parse_lldp_neighbors(output: str) -> list[DiscoveredNeighbor]:
    """Parse common Huawei/Cisco/ZTE LLDP detail/brief output.

    Vendor CLI output is intentionally parsed defensively because mixed
    network fleets frequently differ by software release.
    """
    detail = _parse_detail_blocks(output)

    if detail:
        return detail

    return _parse_brief_lines(output)


def lldp_commands(vendor: str) -> list[str]:
    vendor = vendor.lower()

    if vendor == "huawei":
        return [
            "display lldp neighbor verbose",
            "display lldp neighbor brief",
        ]

    if vendor == "cisco":
        return [
            "show lldp neighbors detail",
            "show lldp neighbors",
        ]

    if vendor == "zte":
        return [
            "show lldp neighbors detail",
            "show lldp neighbors",
            "show lldp neighbor",
        ]

    return [
        "show lldp neighbors detail",
        "show lldp neighbors",
    ]
