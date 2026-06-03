#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import tempfile
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Callable


REPO_ROOT = Path(__file__).resolve().parents[2]
README_PATH = REPO_ROOT / "README.md"
DOCKER_IMAGE = os.environ.get("SPECMATIC_LINTER_IMAGE", "specmatic/enterprise")
CENTRAL_CONFIG_REPO_URL = "https://github.com/specmatic/central-linter-config.git"


@dataclass(frozen=True)
class Expectation:
    errors: int | None = None
    warnings: int | None = None
    ignored: int | None = None
    maturity: str | None = None

    def as_terminaloutput(self) -> str:
        if self.maturity is not None and self.errors is None:
            return '\n'.join(
                [
                    '"maturity": {',
                    f'  "level": "{self.maturity}"',
                    "}",
                ]
            )

        assert self.errors is not None
        assert self.warnings is not None
        assert self.ignored is not None
        return '\n'.join(
            [
                '"totals": {',
                f'  "errors": {self.errors},',
                f'  "warnings": {self.warnings},',
                f'  "ignored": {self.ignored}',
                "}",
            ]
        )


@dataclass(frozen=True)
class Scenario:
    name: str
    command_factory: Callable[[Path], list[str]]
    expectation: Expectation
    prepare: Callable[[Path, Path], Path] | None = None


def run(command: list[str], cwd: Path) -> str:
    print(f"\n==> {cwd}")
    print("$ " + " ".join(command))
    completed = subprocess.run(
        command,
        cwd=cwd,
        text=True,
        capture_output=True,
        env=current_env(),
    )
    if completed.stdout:
        print(completed.stdout)
    if completed.stderr:
        print(completed.stderr)
    if completed.returncode not in (0, 1):
        raise RuntimeError(f"Command failed with exit code {completed.returncode}")
    return completed.stdout


def current_env() -> dict[str, str]:
    env = os.environ.copy()
    return env


def docker_command(mount_dir: Path, *args: str) -> list[str]:
    command = ["docker", "run", "--rm"]
    token = os.environ.get("CENTRAL_CONFIG_REPO_TOKEN")
    if token:
        command.extend(["-e", "CENTRAL_CONFIG_REPO_TOKEN"])
    command.extend(["-v", f"{mount_dir}:/usr/src/app", DOCKER_IMAGE])
    command.extend(args)
    return command


def extract_json_output(stdout: str) -> dict:
    match = re.search(r"(\{.*\})\s*$", stdout, re.DOTALL)
    if not match:
        raise AssertionError("Could not find JSON payload in command output")
    return json.loads(match.group(1))


def assert_expectation(payload: dict, expected: Expectation) -> None:
    totals = payload.get("totals", {})
    maturity = payload.get("maturity", {})
    if expected.errors is not None and totals.get("errors") != expected.errors:
        raise AssertionError(f"Expected errors={expected.errors}, got {totals.get('errors')}")
    if expected.warnings is not None and totals.get("warnings") != expected.warnings:
        raise AssertionError(f"Expected warnings={expected.warnings}, got {totals.get('warnings')}")
    if expected.ignored is not None and totals.get("ignored") != expected.ignored:
        raise AssertionError(f"Expected ignored={expected.ignored}, got {totals.get('ignored')}")
    if expected.maturity is not None and maturity.get("level") != expected.maturity:
        raise AssertionError(
            f"Expected maturity={expected.maturity}, got {maturity.get('level')}"
        )


def copy_demo(src_name: str, temp_root: Path) -> Path:
    src = REPO_ROOT / "demo" / src_name
    dest = temp_root / f"{src_name}-{uuid.uuid4().hex}"
    shutil.copytree(src, dest)
    return dest


def prepare_rules_intro_step_2(repo_root: Path, temp_root: Path) -> Path:
    demo_dir = copy_demo("rules-intro", temp_root)
    config = demo_dir / "specmatic-linter.yaml"
    text = config.read_text()
    text = text.replace("# include:", "include:")
    text = text.replace("#   - rule/no-error-param", "  - rule/no-error-param")
    text = text.replace(
        "#   - rule/parameter-description-required",
        "  - rule/parameter-description-required",
    )
    text = text.replace("#   - rule/force-oidc-auth", "  - rule/force-oidc-auth")
    config.write_text(text)
    return demo_dir


def prepare_rules_intro_step_3(repo_root: Path, temp_root: Path) -> Path:
    demo_dir = prepare_rules_intro_step_2(repo_root, temp_root)
    config = demo_dir / "specmatic-linter.yaml"
    text = config.read_text()
    text = text.replace(
        "#   - corp-standards/pagination-range",
        "  - corp-standards/pagination-range",
    )
    text = text.replace(
        "#   - corp-standards/operation-id-naming",
        "  - corp-standards/operation-id-naming",
    )
    config.write_text(text)
    return demo_dir


def prepare_maturity_step_2(repo_root: Path, temp_root: Path) -> Path:
    demo_dir = copy_demo("maturity", temp_root)
    config = demo_dir / "specmatic-linter.yaml"
    config.write_text(config.read_text().replace("maturity: bronze", "maturity: silver", 1))
    return demo_dir


def prepare_maturity_step_3(repo_root: Path, temp_root: Path) -> Path:
    demo_dir = prepare_maturity_step_2(repo_root, temp_root)
    config = demo_dir / "specmatic-linter.yaml"
    text = config.read_text()
    text = text.replace(
        "operation-summary:\n          severity: error\n          maturity: silver",
        "operation-summary:\n          severity: warn\n          maturity: silver",
        1,
    )
    config.write_text(text)
    return demo_dir


def prepare_rule_types_step_2(repo_root: Path, temp_root: Path) -> Path:
    demo_dir = copy_demo("rule-types", temp_root)
    config = demo_dir / "specmatic-linter.yaml"
    text = config.read_text()
    text = text.replace("types:\n      - schema\n      - parameters", "types:\n      - examples", 1)
    config.write_text(text)
    return demo_dir


def prepare_rule_types_step_3(repo_root: Path, temp_root: Path) -> Path:
    demo_dir = prepare_rule_types_step_2(repo_root, temp_root)
    config = demo_dir / "specmatic-linter.yaml"
    text = config.read_text()
    text = text.replace("\n    types:\n      - examples", "", 1)
    config.write_text(text)
    return demo_dir


def command_rules_intro(mount_dir: Path) -> list[str]:
    return docker_command(mount_dir, "lint", "openapi.yaml", "--config", "specmatic-linter.yaml")


def command_maturity(mount_dir: Path) -> list[str]:
    return docker_command(mount_dir, "lint", "openapi.yaml", "--config", "specmatic-linter.yaml")


def command_rule_types(mount_dir: Path) -> list[str]:
    return docker_command(mount_dir, "lint", "openapi.yaml", "--config", "specmatic-linter.yaml")


def command_profile(profile: str) -> Callable[[Path], list[str]]:
    def build(mount_dir: Path) -> list[str]:
        return docker_command(
            mount_dir,
            "lint",
            "openapi.yaml",
            "--config",
            "specmatic-linter.yaml",
            "--profile",
            profile,
        )

    return build


def command_central(profile: str) -> Callable[[Path], list[str]]:
    def build(mount_dir: Path) -> list[str]:
        return docker_command(
            mount_dir,
            "lint",
            "openapi.yaml",
            "--config-repo-url",
            CENTRAL_CONFIG_REPO_URL,
            "--config",
            "configs/specmatic-linter.yaml",
            "--profile",
            profile,
        )

    return build


SCENARIOS = [
    Scenario(
        "rules-intro step 1",
        command_rules_intro,
        Expectation(errors=7, warnings=22, ignored=0),
        prepare=lambda repo_root, temp_root: repo_root / "demo" / "rules-intro",
    ),
    Scenario(
        "rules-intro step 2",
        command_rules_intro,
        Expectation(errors=10, warnings=22, ignored=0),
        prepare=prepare_rules_intro_step_2,
    ),
    Scenario(
        "rules-intro step 3",
        command_rules_intro,
        Expectation(errors=11, warnings=23, ignored=0),
        prepare=prepare_rules_intro_step_3,
    ),
    Scenario(
        "maturity step 1",
        command_maturity,
        Expectation(maturity="baseline"),
        prepare=lambda repo_root, temp_root: repo_root / "demo" / "maturity",
    ),
    Scenario(
        "maturity step 2",
        command_maturity,
        Expectation(maturity="bronze"),
        prepare=prepare_maturity_step_2,
    ),
    Scenario(
        "maturity step 3",
        command_maturity,
        Expectation(maturity="silver"),
        prepare=prepare_maturity_step_3,
    ),
    Scenario(
        "rule-types step 1",
        command_rule_types,
        Expectation(errors=5, warnings=1, ignored=0),
        prepare=lambda repo_root, temp_root: repo_root / "demo" / "rule-types",
    ),
    Scenario(
        "rule-types step 2",
        command_rule_types,
        Expectation(errors=1, warnings=2, ignored=0),
        prepare=prepare_rule_types_step_2,
    ),
    Scenario(
        "rule-types step 3",
        command_rule_types,
        Expectation(errors=9, warnings=12, ignored=0),
        prepare=prepare_rule_types_step_3,
    ),
    Scenario(
        "profiles internal",
        command_profile("internal"),
        Expectation(errors=2, warnings=7, ignored=2),
        prepare=lambda repo_root, temp_root: repo_root / "demo" / "profiles",
    ),
    Scenario(
        "profiles public-api",
        command_profile("public-api"),
        Expectation(errors=6, warnings=6, ignored=0),
        prepare=lambda repo_root, temp_root: repo_root / "demo" / "profiles",
    ),
    Scenario(
        "profiles payment-api",
        command_profile("payment-api"),
        Expectation(errors=7, warnings=5, ignored=0),
        prepare=lambda repo_root, temp_root: repo_root / "demo" / "profiles",
    ),
    Scenario(
        "central-config internal-api",
        command_central("internal-api"),
        Expectation(errors=6, warnings=7, ignored=2),
        prepare=lambda repo_root, temp_root: repo_root / "demo" / "central-config-repo",
    ),
    Scenario(
        "central-config public-api",
        command_central("public-api"),
        Expectation(errors=7, warnings=10, ignored=0),
        prepare=lambda repo_root, temp_root: repo_root / "demo" / "central-config-repo",
    ),
    Scenario(
        "central-config payment-api",
        command_central("payment-api"),
        Expectation(errors=9, warnings=9, ignored=0),
        prepare=lambda repo_root, temp_root: repo_root / "demo" / "central-config-repo",
    ),
]


def verify_readme_blocks() -> None:
    blocks = re.findall(r"```terminaloutput\n(.*?)```", README_PATH.read_text(), re.DOTALL)
    expected_blocks = [scenario.expectation.as_terminaloutput() for scenario in SCENARIOS]
    if len(blocks) != len(expected_blocks):
        raise AssertionError(
            f"README terminaloutput block count mismatch: expected {len(expected_blocks)}, got {len(blocks)}"
        )

    normalized_actual = [block.strip() for block in blocks]
    normalized_expected = [block.strip() for block in expected_blocks]
    for index, (actual, expected) in enumerate(zip(normalized_actual, normalized_expected), start=1):
        if actual != expected:
            raise AssertionError(
                f"README terminaloutput block {index} mismatch.\nExpected:\n{expected}\n\nActual:\n{actual}"
            )


def main() -> None:
    verify_readme_blocks()

    with tempfile.TemporaryDirectory(prefix="specmatic-lab-") as temp_dir_str:
        temp_root = Path(temp_dir_str)
        for scenario in SCENARIOS:
            mount_dir = scenario.prepare(REPO_ROOT, temp_root) if scenario.prepare else REPO_ROOT
            output = run(scenario.command_factory(mount_dir), REPO_ROOT)
            payload = extract_json_output(output)
            assert_expectation(payload, scenario.expectation)
            print(f"PASS: {scenario.name}")

    print("\nAll README lab scenarios passed.")


if __name__ == "__main__":
    main()
