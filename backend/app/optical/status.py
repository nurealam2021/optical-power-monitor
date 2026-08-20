def _power_to_float(power_value: str | None) -> float | None:
    if not power_value:
        return None

    cleaned_value = (
        power_value
        .lower()
        .replace("dbm", "")
        .strip()
    )

    try:
        return float(cleaned_value)
    except ValueError:
        return None


def get_optical_status(rx_power: str | None) -> str:
    rx_value = _power_to_float(rx_power)

    if rx_value is None:
        return "unknown"

    if rx_value >= -15:
        return "normal"

    if rx_value >= -20:
        return "warning"

    return "critical"