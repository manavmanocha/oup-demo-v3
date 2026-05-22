---
description: "Audit a target file for security vulnerabilities and risky patterns"
name: "Security Audit File Check"
argument-hint: "Path to file (for example: src/app/components/Library.tsx)"
agent: "agent"
---

Review the target file for:

1. Security vulnerabilities and risky patterns

Use this workflow:

1. Open the target file path provided in the prompt argument.
2. If no path is provided, ask for one and stop.
3. Identify security concerns such as:
   - Hardcoded secrets or credentials
   - Unsafe input handling or injection risk
   - Insecure auth/session handling
   - Sensitive data exposure in logs/errors
   - Weak validation, sanitization, or authorization checks
4. Provide concrete, minimal fixes.

Output format:

## Findings

List only real issues. Order by severity.

For each finding include:
- Severity: Critical | High | Medium | Low
- Location: file path + line
- Issue: what is wrong
- Risk: why this matters
- Fix: precise code-level recommendation

## Suggested Patch

Provide a small patch-style snippet for the highest-impact issues.

## Residual Risk

If no issues are found, say "No confirmed findings" and list any review limits (for example, "single-file review", "no runtime validation").

Constraints:
- Do not invent vulnerabilities.
- Prefer actionable fixes over broad refactors.
- Keep the report concise and developer-focused.
