import re


INTERFACE_PATTERN = re.compile(r"^[A-Za-z0-9_./:\-\s]+$")


def is_valid_interface_name(interface: str) -> bool:
    if not interface:
        return False

    if len(interface) > 100:
        return False

    return bool(INTERFACE_PATTERN.match(interface))