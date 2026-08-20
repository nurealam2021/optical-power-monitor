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


SKIPPED_FILE_PATH = Path("router_inventory_skipped.txt")


def clean_value(value: str) -> str | None:
    value = value.strip()

    if not value:
        return None

    return value


def parse_skipped_line(line: str) -> dict[str, str] | None:
    line = line.rstrip("\n")

    if not line.strip():
        return None

    if line.lower().startswith("reason"):
        return None

    parts = line.split("\t")

    if len(parts) < 7:
        return None

    return {
        "reason": parts[0].strip(),
        "device_id": parts[1].strip(),
        "hostname": parts[2].strip(),
        "ip_address": parts[3].strip(),
        "hardware": parts[4].strip(),
        "os_name": parts[5].strip(),
        "version": parts[6].strip(),
    }


def import_skipped_as_zte(db: Session) -> None:
    if not SKIPPED_FILE_PATH.exists():
        print(f"Skipped file not found: {SKIPPED_FILE_PATH}")
        print("Run python -m app.import_router_inventory first to create it.")
        return

    imported_count = 0
    updated_count = 0
    skipped_count = 0
    total_rows = 0

    lines = SKIPPED_FILE_PATH.read_text(encoding="utf-8").splitlines()

    for line_number, line in enumerate(lines, start=1):
        row = parse_skipped_line(line)

        if not row:
            continue

        total_rows += 1

        try:
            management_ip = IPvAnyAddress(row["ip_address"])
        except ValueError:
            skipped_count += 1
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
            vendor=RouterVendor.ZTE,
            model=clean_value(row["hardware"]) or "ZTE",
            os_name="ZTE",
            version=clean_value(row["version"]) or "Unknown",
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
            print(f"Updated as ZTE: {management_ip}")
        else:
            create_router_inventory(
                db=db,
                router_data=router_data,
            )
            imported_count += 1
            print(f"Imported as ZTE: {management_ip}")

    print("")
    print("ZTE skipped import completed.")
    print(f"Total parsed rows: {total_rows}")
    print(f"Imported: {imported_count}")
    print(f"Updated: {updated_count}")
    print(f"Skipped: {skipped_count}")


def main() -> None:
    db = SessionLocal()

    try:
        import_skipped_as_zte(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()