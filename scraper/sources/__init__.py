"""Register van alle bronnen: bron-id -> scraperklasse."""
from __future__ import annotations

from .funda import Funda
from .kamernet import Kamernet
from .pararius import Huurwoningen, Pararius
from .woonmatch import Woonmatch
from .zig import ZigPortal

REGISTRY = {
    "svnk": ZigPortal,
    "woonmatch_wf": Woonmatch,
    "woonmatch_kopnh": Woonmatch,
    "funda": Funda,
    "pararius": Pararius,
    "huurwoningen": Huurwoningen,
    "kamernet": Kamernet,
}
