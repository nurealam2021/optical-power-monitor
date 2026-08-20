import re

from app.routers.models import RouterVendor


POWER_VALUE_PATTERN = r"(-?\d+(?:\.\d+)?)\s*(?:dBm|dbm|DBM)"


def _clean_power_value(value: str | None) -> str | None:
    if not value:
        return None

    value = value.strip()

    if value.lower().endswith("dbm"):
        return value

    return f"{value} dBm"


def _find_dbm_inside_parentheses(line: str) -> str | None:
    """
    Example Cisco IOS-XR live optical line:
    Tx Power: 0.66370 mW (-1.78028 dBm)
    Rx Power: 0.43710 mW (-3.59419 dBm)
    """
    match = re.search(r"\((-?\d+(?:\.\d+)?)\s*(?:dBm|dbm|DBM)\)", line)

    if match:
        return _clean_power_value(match.group(1))

    return None


def _find_exact_line_value(
    output: str,
    line_prefixes: list[str],
) -> str | None:
    for line in output.splitlines():
        clean_line = line.strip()
        clean_line_lower = clean_line.lower()

        for prefix in line_prefixes:
            if clean_line_lower.startswith(prefix.lower()):
                parenthesized_value = _find_dbm_inside_parentheses(clean_line)

                if parenthesized_value:
                    return parenthesized_value

                match = re.search(POWER_VALUE_PATTERN, clean_line)

                if match:
                    return _clean_power_value(match.group(1))

    return None


def _find_value_after_keywords(
    output: str,
    keywords: list[str],
) -> str | None:
    lines = output.splitlines()

    for line in lines:
        line_lower = line.lower()

        if all(keyword.lower() in line_lower for keyword in keywords):
            match = re.search(POWER_VALUE_PATTERN, line)

            if match:
                return _clean_power_value(match.group(1))

    return None


def parse_huawei_optical_power(output: str) -> tuple[str | None, str | None]:
    rx_power = (
        _find_exact_line_value(output, ["rx power", "rxpower"])
        or _find_value_after_keywords(output, ["rx", "power"])
        or _find_value_after_keywords(output, ["receive", "power"])
    )

    tx_power = (
        _find_exact_line_value(output, ["tx power", "txpower"])
        or _find_value_after_keywords(output, ["tx", "power"])
        or _find_value_after_keywords(output, ["transmit", "power"])
    )

    return rx_power, tx_power


def parse_zte_optical_power(output: str) -> tuple[str | None, str | None]:
    """
    ZTE command:
    show opticalinfo xgei-1/1/0/12

    Real ZTE output:
    Measured RX Input  Power: -2.8 dBm
    Measured TX Output Power: -3.3 dBm
    """
    rx_power = (
        _find_exact_line_value(
            output,
            [
                "measured rx input  power:",
                "measured rx input power:",
                "rx input power:",
                "rx power:",
            ],
        )
        or _find_value_after_keywords(output, ["measured", "rx", "input", "power"])
        or _find_value_after_keywords(output, ["rx", "input", "power"])
        or _find_value_after_keywords(output, ["rx", "power"])
        or _find_value_after_keywords(output, ["receive", "power"])
        or _find_value_after_keywords(output, ["input", "power"])
    )

    tx_power = (
        _find_exact_line_value(
            output,
            [
                "measured tx output power:",
                "tx output power:",
                "tx power:",
            ],
        )
        or _find_value_after_keywords(output, ["measured", "tx", "output", "power"])
        or _find_value_after_keywords(output, ["tx", "output", "power"])
        or _find_value_after_keywords(output, ["tx", "power"])
        or _find_value_after_keywords(output, ["transmit", "power"])
        or _find_value_after_keywords(output, ["output", "power"])
    )

    return rx_power, tx_power


def parse_cisco_optical_power(output: str) -> tuple[str | None, str | None]:
    """
    Cisco IOS-XR command:
    show controllers TenGigE0/0/0/6 phy

    Correct live optical lines:
    Tx Power: 0.66370 mW (-1.78028 dBm)
    Rx Power: 0.43710 mW (-3.59419 dBm)

    Important:
    Do NOT read threshold lines:
    Transmit Power:
    Receive Power:
    """
    rx_power = _find_exact_line_value(
        output,
        [
            "rx power:",
            "rxpower:",
        ],
    )

    tx_power = _find_exact_line_value(
        output,
        [
            "tx power:",
            "txpower:",
        ],
    )

    if rx_power or tx_power:
        return rx_power, tx_power

    rx_power = (
        _find_value_after_keywords(output, ["receive", "power"])
        or _find_value_after_keywords(output, ["rx", "power"])
    )

    tx_power = (
        _find_value_after_keywords(output, ["transmit", "power"])
        or _find_value_after_keywords(output, ["tx", "power"])
    )

    return rx_power, tx_power


def parse_optical_power(
    vendor: RouterVendor,
    output: str,
) -> tuple[str | None, str | None]:
    if vendor == RouterVendor.HUAWEI:
        return parse_huawei_optical_power(output)

    if vendor == RouterVendor.ZTE:
        return parse_zte_optical_power(output)

    if vendor == RouterVendor.CISCO:
        return parse_cisco_optical_power(output)

    return None, None