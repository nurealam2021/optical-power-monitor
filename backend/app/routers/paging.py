import re
import time


# Matches Huawei's "---- More ----" style pagination prompt regardless
# of exact dash count/spacing/case. Deliberately requires dashes on
# both sides so we don't false-positive on the word "more" appearing
# inside a real interface description.
_MORE_PROMPT_PATTERN = re.compile(r"-+\s*more\s*-+", re.IGNORECASE)


def read_paged_output(
    connection,
    command: str,
    read_timeout: float,
    poll_interval: float = 0.5,
    idle_polls_before_done: int = 3,
) -> str:
    """
    Runs `command` on a Huawei device and manually pages through any
    "---- More ----" prompts by sending a space character, regardless
    of whether the device's automatic paging-disable succeeded.

    Some Huawei platforms/firmware versions don't respond to the
    standard "screen-length 0 temporary" the same way (varies by
    hardware generation), so relying on that alone silently truncates
    output on some routers in a mixed fleet. This is a more resilient
    fallback: it detects the actual pagination prompt in the live
    output stream and clears it by sending a space, same as pressing
    the spacebar in an interactive terminal.

    `connection` only needs write_channel(str) / read_channel() ->
    str / normalize_cmd(str) -> str, matching netmiko's
    BaseConnection interface -- kept duck-typed so this can be unit
    tested with a fake connection object.
    """

    connection.write_channel(connection.normalize_cmd(command))

    full_output = ""
    deadline = time.time() + read_timeout
    idle_polls = 0

    while time.time() < deadline:
        time.sleep(poll_interval)
        chunk = connection.read_channel()

        if not chunk:
            idle_polls += 1

            # No new data for a few polls straight, and we're not
            # sitting on a "More" prompt -- assume the command has
            # finished and the real device prompt is showing.
            if idle_polls >= idle_polls_before_done:
                break

            continue

        idle_polls = 0
        full_output += chunk

        match = _MORE_PROMPT_PATTERN.search(chunk)

        if match:
            # Strip just the prompt text itself out of the
            # accumulated output so it doesn't get parsed later as a
            # bogus interface row, then request the next page.
            prompt_start = len(full_output) - len(chunk) + match.start()
            full_output = full_output[:prompt_start]

            connection.write_channel(" ")
            continue

    return full_output
