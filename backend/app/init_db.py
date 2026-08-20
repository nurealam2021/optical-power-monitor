from pathlib import Path

from pydantic import IPvAnyAddress
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.inventory.models import RouterInventoryStatus
from app.inventory.schemas import RouterInventoryCreate
from app.inventory.service import (
    create_router_inventory,
    get_router_inventory_by_ip,
    update_router_inventory,
)
from app.routers.models import RouterVendor


IMPORT_FILE_PATH = Path("router_inventory_import.txt")
SKIPPED_FILE_PATH = Path("router_inventory_skipped.txt")


def detect_vendor(os_name: str, hardware: str, hostname: str) -> RouterVendor | None:
    text = f"{os_name} {hardware} {hostname}".lower()

    if "cisco" in text or "ios-xr" in text or "ios-xe" in text or "nx-os" in text:
        return RouterVendor.CISCO

    if "huawei" in text or "vrp" in text or "atn" in text:
        return RouterVendor.HUAWEI

    if "zte" in text or "zxr10" in text:
        return RouterVendor.ZTE

    return None


def clean_value(value: str) -> str | None:
    value = value.strip()

    if not value:
        return None

    return value


def parse_router_line(line: str) -> dict[str, str] | None:
    raw_line = line.rstrip("\n")
    line = raw_line.strip()

    if not line:
        return None

    if line.lower().startswith("device id"):
        return None

    parts = raw_line.split("\t")

    if len(parts) < 6:
        return None

    return {
        "device_id": parts[0].strip(),
        "hostname": parts[1].strip(),
        "ip_address": parts[2].strip(),
        "hardware": parts[3].strip(),
        "os_name": parts[4].strip(),
        "version": parts[5].strip(),
        "raw_line": raw_line,
    }


def write_skipped_header() -> None:
    SKIPPED_FILE_PATH.write_text(
        "Reason\tDevice ID\tHostname\tIP Address\tHardware\tOS\tVersion\n",
        encoding="utf-8",
    )


def append_skipped(reason: str, row: dict[str, str]) -> None:
    with SKIPPED_FILE_PATH.open("a", encoding="utf-8") as skipped_file:
        skipped_file.write(
            f"{reason}\t"
            f"{row.get('device_id', '')}\t"
            f"{row.get('hostname', '')}\t"
            f"{row.get('ip_address', '')}\t"
            f"{row.get('hardware', '')}\t"
            f"{row.get('os_name', '')}\t"
            f"{row.get('version', '')}\n"
        )


def import_inventory(db: Session) -> None:
    if not IMPORT_FILE_PATH.exists():
        print(f"Import file not found: {IMPORT_FILE_PATH}")
        print("Create this file inside backend folder and paste your router list there.")
        return

    write_skipped_header()

    imported_count = 0
    updated_count = 0
    skipped_count = 0
    total_rows = 0

    lines = IMPORT_FILE_PATH.read_text(encoding="utf-8").splitlines()

    for line_number, line in enumerate(lines, start=1):
        row = parse_router_line(line)

        if not row:
            continue

        total_rows += 1

        vendor = detect_vendor(
            os_name=row["os_name"],
            hardware=row["hardware"],
            hostname=row["hostname"],
        )

        if not vendor:
            skipped_count += 1
            append_skipped("Cannot detect vendor", row)
            print(
                f"Skipped line {line_number}: cannot detect vendor for "
                f"IP={row['ip_address']} Hostname={row['hostname']}"
            )
            continue

        try:
            management_ip = IPvAnyAddress(row["ip_address"])
        except ValueError:
            skipped_count += 1
            append_skipped("Invalid IP address", row)
            print(
                f"Skipped line {line_number}: invalid IP address "
                f"{row['ip_address']}"
            )
            continue

        existing_router = get_router_inventory_by_ip(
            db=db,
            management_ip=str(management_ip),
        )

        router_data = RouterInventoryCreate(
            device_id=clean_value(row["device_id"]),
            router_name=clean_value(row["hostname"]),
            management_ip=management_ip,
            vendor=vendor,
            model=clean_value(row["hardware"]),
            os_name=clean_value(row["os_name"]),
            version=clean_value(row["version"]),
            site_name=None,
            router_role=None,
            status=RouterInventoryStatus.ACTIVE,
        )

        if existing_router:
            update_router_inventory(
                db=db,
                router=existing_router,
                router_data=router_data,
            )
            updated_count += 1
            print(f"Updated: {management_ip} -> {vendor.value}")
        else:
            create_router_inventory(
                db=db,
                router_data=router_data,
            )
            imported_count += 1
            print(f"Imported: {management_ip} -> {vendor.value}")

    print("")
    print("Import completed.")
    print(f"Total parsed rows: {total_rows}")
    print(f"Imported: {imported_count}")
    print(f"Updated: {updated_count}")
    print(f"Skipped: {skipped_count}")
    print(f"Skipped report: {SKIPPED_FILE_PATH}")


def main() -> None:
    db = SessionLocal()

    try:
        import_inventory(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()