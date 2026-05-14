# Snapshot Import Function

This folder is reserved for the manual JSON snapshot import edge function.

Initial foundation behavior:
- Parse uploaded JSON payload.
- Validate required root structure against Agent 1 JSON contract.
- Persist import failures to `snapshot_import_errors`.
- Insert run/candidate/source/supplier/match records without auto-merging candidates.
