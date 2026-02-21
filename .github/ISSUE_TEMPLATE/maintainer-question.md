name: Maintainer question - Python/CI/export preferences
about: Ask maintainers for Python version, CI preferences, and where to persist exports

---

**Context**
We added a minimal CI and `requirements.txt` as a starting point. Before finalizing, we need guidance on the following:

- Preferred Python version (e.g., 3.10+)
- CI preferences (GitHub Actions only, matrix builds, additional checks like linting/tests)
- Where to persist generated WAVs and reports in production: S3, shared drive, or repo-based?

**Suggested options**
- Python: 3.10 (recommended) or 3.11
- CI: Keep minimal smoke test (install deps + `python -c "import app"`) and add lint/test steps later
- Exports: Prefer S3 for production; repo `exports/` for local/dev only

**Please reply with your preferences or edit this Issue to add more constraints.**
