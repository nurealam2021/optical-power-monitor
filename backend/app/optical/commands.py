from app.routers.models import RouterVendor


def normalize_huawei_interface(interface: str) -> str:
    clean_interface = interface.strip()

    # Huawei short GE format:
    # User input: GE0/2/9
    # Command use: GigabitEthernet 0/2/9
    if clean_interface.lower().startswith("ge") and not clean_interface.lower().startswith(
        "gigabitethernet"
    ):
        return "GigabitEthernet " + clean_interface[2:]

    # Huawei no-space full format:
    # User input: GigabitEthernet0/2/9
    # Command use: GigabitEthernet 0/2/9
    if clean_interface.lower().startswith("gigabitethernet"):
        rest = clean_interface[len("GigabitEthernet"):].strip()

        if rest:
            return f"GigabitEthernet {rest}"

    return clean_interface


def normalize_cisco_interface(interface: str) -> str:
    clean_interface = interface.strip()

    # Cisco IOS-XR often uses TenGigE instead of short Te.
    # User input: Te0/0/0/6
    # Command use: TenGigE0/0/0/6
    if clean_interface.lower().startswith("te") and not clean_interface.lower().startswith(
        ("tengige", "tengigabitethernet")
    ):
        return "TenGigE" + clean_interface[2:]

    return clean_interface


def normalize_zte_interface(interface: str) -> str:
    clean_interface = interface.strip()

    # ZTE examples:
    # xgei-1/1/0/12
    # gei-1/1/0/12
    #
    # Keep user input as-is because your real ZTE command works with dash format.
    return clean_interface


def get_optical_command(
    vendor: RouterVendor,
    interface: str,
) -> str:
    clean_interface = interface.strip()

    if vendor == RouterVendor.HUAWEI:
        huawei_interface = normalize_huawei_interface(clean_interface)
        return f"display interface {huawei_interface}"

    if vendor == RouterVendor.ZTE:
        zte_interface = normalize_zte_interface(clean_interface)
        return f"show opticalinfo {zte_interface}"

    if vendor == RouterVendor.CISCO:
        cisco_interface = normalize_cisco_interface(clean_interface)
        return f"show controllers {cisco_interface} phy"

    raise ValueError(f"Unsupported vendor: {vendor}")