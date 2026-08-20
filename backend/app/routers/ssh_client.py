from netmiko import ConnectHandler

from app.config import settings
from app.routers.encryption import decrypt_password
from app.routers.models import RouterCredential, RouterVendor
from app.routers.paging import read_paged_output


def _get_netmiko_device_type(vendor: RouterVendor) -> str:
    if vendor == RouterVendor.HUAWEI:
        return "huawei"
    if vendor == RouterVendor.ZTE:
        return "zte_zxros"
    if vendor == RouterVendor.CISCO:
        return "cisco_xr"
    raise ValueError(f"Unsupported vendor: {vendor}")


def run_show_command(
    router_ip: str,
    vendor: RouterVendor,
    interface: str,
    command: str,
    credential: RouterCredential,
) -> str:
    device = {
        "device_type": _get_netmiko_device_type(vendor),
        "host": router_ip,
        "username": credential.username,
        "password": decrypt_password(credential.password_encrypted),
        "port": credential.ssh_port,
        "timeout": settings.ROUTER_SSH_TIMEOUT,
        "conn_timeout": settings.ROUTER_SSH_TIMEOUT,
        "auth_timeout": settings.ROUTER_SSH_TIMEOUT,
        "banner_timeout": settings.ROUTER_SSH_TIMEOUT,
        "fast_cli": False,
    }

    connection = ConnectHandler(**device)

    try:
        if vendor == RouterVendor.HUAWEI:
            # Some Huawei hardware/firmware generations don't reliably
            # respond to the automatic "screen-length 0 temporary"
            # paging-disable netmiko sends at connect time -- this
            # varies across a mixed fleet (older/different platforms
            # keep paging active regardless). Rather than assume
            # paging is off, actively detect and page through any
            # "---- More ----" prompt by sending a space, same as
            # pressing spacebar interactively. This works whether or
            # not the automatic disable succeeded.
            return read_paged_output(
                connection=connection,
                command=command,
                read_timeout=settings.ROUTER_SSH_TIMEOUT,
            )

        output = connection.send_command(
            command_string=command,
            read_timeout=settings.ROUTER_SSH_TIMEOUT,
            strip_prompt=False,
            strip_command=False,
        )
        return output
    finally:
        connection.disconnect()
