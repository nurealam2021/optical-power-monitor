from app.routers.models import RouterVendor


def build_capacity_command(vendor: RouterVendor) -> str:
    """
    Returns the vendor-specific CLI command that lists every interface
    on the router along with its admin/oper status and description in
    a single table. The "description" style command is used (rather
    than "brief") because it gives us the Description column in the
    same output, which is what we use to infer whether a port is
    actually in service.

    NOTE: Exact command syntax can vary by platform/firmware version.
    These are the most common forms per vendor family. If parsing
    comes back empty for a given router, check the raw_output stored
    in the capacity check log and adjust the command/parser here.
    """

    if vendor == RouterVendor.HUAWEI:
        # VRP platform.
        # Columns: Interface | PHY | Protocol | Description
        return "display interface description"

    if vendor == RouterVendor.ZTE:
        # ZXROS platform (Cisco-like CLI heritage on most ZTE routers).
        # Columns: Interface | Status | Protocol | Description
        return "show interface description"

    if vendor == RouterVendor.CISCO:
        # IOS-XR platform.
        # Columns: Interface | Status | Protocol | Description
        return "show interfaces description"

    raise ValueError(f"Unsupported vendor for capacity check: {vendor}")
