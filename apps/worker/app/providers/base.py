from abc import ABC, abstractmethod
from typing import Any


class ProviderResult(dict):
    """Dictionary-compatible provider result placeholder."""


class BaseProvider(ABC):
    @abstractmethod
    def run(self, payload: dict[str, Any]) -> ProviderResult:
        raise NotImplementedError
