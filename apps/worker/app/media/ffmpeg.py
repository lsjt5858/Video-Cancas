from pathlib import Path


def build_preview_mp4(input_files: list[Path], output_file: Path) -> Path:
    """Placeholder for the FFmpeg export pipeline."""
    if not input_files:
        raise ValueError("input_files cannot be empty")

    return output_file
