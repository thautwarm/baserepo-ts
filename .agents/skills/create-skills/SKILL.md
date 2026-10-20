---
name: create-skills
description: Create or revise repository skills with portable instructions and focused supporting resources. Use when a workflow should become reusable agent guidance.
---

# Create skills

Create skills that are harness agnostic: the same instructions must work in Codex,
OpenCode, and other agents that read `SKILL.md`.

## Format and portability

- Store each skill in `.agents/skills/<name>/SKILL.md`. Use a lowercase, hyphenated name matching its directory.
- Use YAML frontmatter with `name` and `description`, followed by Markdown instructions. No provider-specific metadata is required.
- Describe actions in natural language or ordinary CLI commands. State required tools and working directories; resolve bundled resources relative to the skill directory.
- Do not require harness tool APIs, special invocation syntax, user-specific absolute paths, or another harness's configuration.
- When a requested capability needs a harness-specific feature, isolate it in an optional adapter and keep the core workflow usable independently. State the adapter's requirement and when to use it.

## Create or update

1. Identify the requests the skill handles, the expected result, and the non-obvious decisions it should improve. Use the user's examples and inspect relevant project files or tool documentation.
2. For an existing skill, read its instructions and relevant supporting resources before editing. Preserve useful constraints and the user's intended scope.
3. Write a short `description` explaining the capability and when to select it. Include a boundary only when it prevents likely misrouting.
4. Write the core workflow with concrete actions, inputs, outputs, and necessary constraints. Separate required invariants from optional approaches; do not mandate ceremony that the task does not need.
5. Add supporting resources only when they have a concrete use, then validate the result below.

For example, prefer a specific trigger:

```yaml
description: Integrate workspace generation and validation with NoMake. Use when adding projects or targets, changing build helpers, or fixing cache invalidation.
```

## Keep the entry point small

- Include guidance that changes decisions. Remove generic advice, repeated project rules, historical fixes, and examples that add no new information.
- Keep each section at one abstraction level. Show the workflow first; link lower-level details where they become relevant.
- Put substantial conditional guidance in `references/`; say when to read each reference. Do not require loading all references in advance.
- Use `scripts/` for repeated or fragile mechanics and `assets/` for files copied into outputs. Do not create empty directories or extra README, changelog, or metadata files by default.
- Keep each fact in one place. A self-contained skill needs only `SKILL.md`.

## Validate

- Check frontmatter, matching directory/name, resource links, and unfinished placeholders.
- Walk through a realistic request: can another agent identify the inputs, choose the relevant steps, and produce the expected result without unstated context?
- Check a nearby unrelated request against the description to catch overly broad triggers.
- Verify commands and changed helpers on representative inputs. Check observable outputs rather than matching instruction wording.
- Confirm that core instructions still work without harness-specific APIs or configuration. Report any actual dependency instead of claiming universal compatibility.
- Report the skill path, material changes, and validation performed. Improve it from observed usage rather than accumulating speculative rules.
