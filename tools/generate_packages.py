import os
from pathlib import Path
import shutil
import subprocess


THIS_DIR = Path(__file__).parent.resolve()
ROOT_DIR = THIS_DIR.parent
DIST_DIR = ROOT_DIR / "dist"
EXTENSION_DIR = ROOT_DIR / "extension"


def create_package(output_path: Path, source_dir: Path):
    shutil.make_archive(
        base_name=output_path.with_suffix(""),
        format="zip",
        root_dir=source_dir,
    )


def apply_git_patch(patch_path: Path):
    subprocess.run(["git", "apply", str(patch_path)], check=True)


def main():
    os.chdir(ROOT_DIR)
    shutil.rmtree(DIST_DIR, ignore_errors=True)
    DIST_DIR.mkdir()

    create_package(DIST_DIR / "firefox.zip", EXTENSION_DIR)
    apply_git_patch(ROOT_DIR / "patch" / "service_worker.diff")
    create_package(DIST_DIR / "chrome.zip", EXTENSION_DIR)


if __name__ == "__main__":
    main()
