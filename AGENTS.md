# Agent Operating Rules & Context Guardrails

## 1. Context Boundaries & Lazy Spec Loading
- **No Eager Spec Reads:** Do NOT read the entire TDS/architecture file. When mapping dependencies, query specific sections using targeted offsets or section headers.
- **AST & Symbol Navigation First:** Prefer language server symbols, definitions, or targeted search tools over file dumping. Never read a file greater than 100 lines in full; fetch only the relevant line range.
- **Never Inspect Excluded Paths:** Strict zero-read policy on `node_modules/`, `dist/`, `build/`, `.git/`, `.cache/`, logs, and binary asset folders.

## 2. Command Execution & Output Hygiene
- **Silent & Filtered Execution:** Never run raw commands that dump unbounded terminal stdout. Pipe outputs through filters:
  - Windows PowerShell: Append `| Select-Object -First 25` or `Select-String -Pattern "error|failed"`
  - Unix/Bash: Append `| head -n 30` or `grep -E "error|fail" -B 2 -A 5`
- **Strict Turn Cap (Max 2):** Run a maximum of 2 targeted shell commands per interaction loop. If unverified after 2 commands, STOP immediately and ask for user clarification.
- **No Broad Test/Build Runs:** Never run complete test suites (`npm test`, `cargo test`, `pytest`). Target single-test execution only (e.g., `vitest run <test_file> -t "<test_name>"`).
- **Silent Flags:** Always use `--silent`, `-q`, or non-interactive flags (`--no-pager`, `-y`).

## 3. Edit & Diff Protocol
- **Targeted Line Replacement:** Always apply surgical patches (line ranges / regex replacements) using native editor edit tools rather than rewriting or re-emitting full files.
- **Response Format:**
  - Skip polite chatter, intros, and apologies.
  - State the technical premise in 1 sentence.
  - Apply the diff.
  - List verification command (if applicable) in 1 line.

## 4. Compaction & Token Defense
- If a terminal output exceeds 50 lines, stop further command chaining, summarize the failure trace, and await input instead of retrying automatically.