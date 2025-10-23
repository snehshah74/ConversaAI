#!/usr/bin/env python3
"""
Test runner script for the Voice AI Platform backend.

Usage:
    python run_tests.py [options]

Examples:
    python run_tests.py                    # Run all tests
    python run_tests.py --unit             # Run only unit tests
    python run_tests.py --integration      # Run only integration tests
    python run_tests.py --coverage         # Run with coverage report
    python run_tests.py --verbose          # Verbose output
"""

import sys
import subprocess
import argparse
from pathlib import Path


def run_command(cmd: list, description: str) -> bool:
    """Run a command and return success status."""
    print(f"\n{'='*60}")
    print(f"Running: {description}")
    print(f"Command: {' '.join(cmd)}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run(cmd, check=True, capture_output=False)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed with exit code {e.returncode}")
        return False
    except FileNotFoundError:
        print(f"❌ Command not found: {cmd[0]}")
        return False


def install_test_dependencies():
    """Install test dependencies."""
    dependencies = [
        "pytest",
        "pytest-asyncio",
        "httpx",
        "pytest-cov",
        "pytest-xdist"
    ]
    
    print("Installing test dependencies...")
    for dep in dependencies:
        cmd = [sys.executable, "-m", "pip", "install", dep]
        if not run_command(cmd, f"Installing {dep}"):
            return False
    return True


def run_tests(args):
    """Run tests based on arguments."""
    # Base pytest command
    cmd = [sys.executable, "-m", "pytest"]
    
    # Add test path
    cmd.append("tests/")
    
    # Add markers
    if args.unit:
        cmd.extend(["-m", "unit"])
    elif args.integration:
        cmd.extend(["-m", "integration"])
    
    # Add coverage if requested
    if args.coverage:
        cmd.extend([
            "--cov=.",
            "--cov-report=html",
            "--cov-report=term-missing",
            "--cov-fail-under=80"
        ])
    
    # Add verbosity
    if args.verbose:
        cmd.append("-v")
    else:
        cmd.append("-q")
    
    # Add additional pytest options
    if args.pytest_args:
        cmd.extend(args.pytest_args)
    
    # Run tests
    success = run_command(cmd, "Running tests")
    
    if args.coverage and success:
        print("\n📊 Coverage report generated in htmlcov/index.html")
    
    return success


def lint_code():
    """Run code linting."""
    lint_commands = [
        ([sys.executable, "-m", "flake8", "."], "Code linting with flake8"),
        ([sys.executable, "-m", "black", "--check", "."], "Code formatting check with black"),
        ([sys.executable, "-m", "isort", "--check-only", "."], "Import sorting check with isort"),
    ]
    
    success = True
    for cmd, description in lint_commands:
        if not run_command(cmd, description):
            success = False
    
    return success


def type_check():
    """Run type checking."""
    cmd = [sys.executable, "-m", "mypy", "."]
    return run_command(cmd, "Type checking with mypy")


def main():
    """Main function."""
    parser = argparse.ArgumentParser(description="Run Voice AI Platform tests")
    
    # Test type options
    parser.add_argument("--unit", action="store_true", help="Run only unit tests")
    parser.add_argument("--integration", action="store_true", help="Run only integration tests")
    
    # Output options
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    parser.add_argument("--coverage", "-c", action="store_true", help="Generate coverage report")
    
    # Additional options
    parser.add_argument("--lint", action="store_true", help="Run code linting")
    parser.add_argument("--type-check", action="store_true", help="Run type checking")
    parser.add_argument("--install-deps", action="store_true", help="Install test dependencies")
    parser.add_argument("--all", action="store_true", help="Run all checks (tests, linting, type checking)")
    
    # Pass through pytest arguments
    parser.add_argument("pytest_args", nargs="*", help="Additional arguments to pass to pytest")
    
    args = parser.parse_args()
    
    # Change to backend directory
    backend_dir = Path(__file__).parent
    import os
    os.chdir(backend_dir)
    
    success = True
    
    # Install dependencies if requested
    if args.install_deps:
        if not install_test_dependencies():
            success = False
    
    # Run linting if requested
    if args.lint or args.all:
        if not lint_code():
            success = False
    
    # Run type checking if requested
    if args.type_check or args.all:
        if not type_check():
            success = False
    
    # Run tests (unless only linting/type checking was requested)
    if not (args.lint or args.type_check) or args.all:
        if not run_tests(args):
            success = False
    
    # Final result
    print(f"\n{'='*60}")
    if success:
        print("🎉 All checks passed!")
        sys.exit(0)
    else:
        print("💥 Some checks failed!")
        sys.exit(1)


if __name__ == "__main__":
    main()




