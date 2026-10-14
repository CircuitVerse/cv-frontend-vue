# Contributing to cv-frontend-vue

We're thrilled that you're interested in contributing! This guide will help you get started.

If you are new to CircuitVerse overall, also read the [main contributing guide](https://github.com/CircuitVerse/CircuitVerse/blob/master/CONTRIBUTING.md) for community norms. This file covers what is specific to this repository.

## Code of Conduct

We expect all contributors to abide by our [Code of Conduct](https://github.com/CircuitVerse/CircuitVerse/blob/master/code-of-conduct.md). Assume good intentions, be respectful, and if you experience violations, report them via [Slack](https://circuitverse.org/slack).

## Before You Start

1. Review our [Product Statement](https://github.com/CircuitVerse/CircuitVerse/wiki/Product-Statement) — we focus on circuit simulation, community interaction, and educational tools. We prioritize maintainability, efficient development, and UX over UI complexity.
2. Check existing issues to avoid duplicates (see [open issues](https://github.com/CircuitVerse/cv-frontend-vue/issues)).
3. Join [Slack](https://circuitverse.org/slack) or [Discussions](https://github.com/CircuitVerse/CircuitVerse/discussions) for questions.

### Versions: v0 and v1

This repository hosts two simulator versions:

- **v0** (`v0/`, served from `src/`): stable production version.
- **v1** (`v1/`): experimental version where new features land and the JavaScript-to-TypeScript migration happens.

New simulator work follows this rule: **v0 accepts bug fixes only — all new
features go to v1 alone.** If a bug affects both versions, fix it in both;
otherwise target **v1**.

### ⚠️ Windows users (important)

This project relies on **symlinks** for version management. Before cloning:

1. Enable **Developer Mode** (Windows Settings → Developer settings).
2. Configure Git: `git config --global core.symlinks true`

Then re-clone so symlinks are created correctly.

## Setup and Workflow

```bash
# Fork on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/cv-frontend-vue.git
cd cv-frontend-vue

# Add upstream
git remote add upstream https://github.com/CircuitVerse/cv-frontend-vue.git

# Install dependencies (Node 22)
npm ci

# Start the dev server (v0 by default; set VITE_SIM_VERSION=v1 for v1)
npm run dev

# Keep your fork updated
git fetch upstream
git checkout main
git pull upstream main

# Create a feature branch (format: feature-name#issue-number)
git checkout -b forgot-password#44

# After changes, push to your fork
git push origin forgot-password#44
```

## Understanding Labels

**Status:**

- `pending triage` — new issue not yet verified. **Don't work on these until the label is removed**
- `good first issue` — great for newcomers
- `help wanted` — contributor needs assistance

**Type:**

- `🌟 feature` — new features/enhancements
- `🐞 bug` — errors in existing code
- `JS to TS migration` — JavaScript-to-TypeScript conversion work (mostly in `v1/`)
- `documentation` — docs improvements

## How to Claim Issues

1. Find an issue **without** the `pending triage` label
2. Check that no one else has claimed it
3. Leave a comment: "I'd like to work on this"
4. Start working immediately — no need to wait for assignment
5. Comment if you can no longer work on it

## Creating an Issue

1. Search for duplicates first
2. Use the appropriate template (Bug Report, Feature Request)
3. Write a clear, descriptive title
4. Provide detailed information (steps to reproduce, screenshots, use cases)
5. For features, explain alignment with our Product Statement

Your issue will get the `pending triage` label. Once maintainers verify and remove it, contributors can claim the issue.

> [!NOTE]
> If the issue is about minor spelling mistakes, you may create a pull request directly — do not create a separate issue for that.

## Quality Gates (run before pushing)

```bash
npm run test:v1          # simulator tests for v1 (use test:src for v0)
npm run lint:v1          # oxlint for v1, warnings fail the build
npx vue-tsc --noEmit -p tsconfig.v1.json   # typecheck for v1, must be clean
npm run format:check     # oxfmt formatting check (fix with npm run format)
```

Continuous Integration runs the same checks (`lint:ci`, `lint:v1:ci`, `fmt:check`, `test:src:ci`, `test:v1:ci`), so a green local run means a green PR.

## TypeScript Migration Guidelines (v1)

A large part of `v1/src/simulator` is still JavaScript. When picking up a `JS to TS migration` issue:

- Work **only in the `v1/` folder**.
- Rename `.js` → `.ts`, then run `vue-tsc --noEmit -p tsconfig.v1.json` and fix all resulting errors.
- No implicit `any` — add real types for parameters, returns, and class members.
- If `any`/`unknown` truly cannot be removed, leave a one-line comment above it explaining why.
- Avoid `as unknown as`; it defeats the purpose of TypeScript.
- Don't include file extensions in imports (`./node`, not `./node.ts`).
- Ensure files importing the converted module still typecheck, and behaviour is unchanged (`npm run test:v1`).

## AI Assistance Policy

You may use AI assistance under these conditions:

- Read and understand every line of code before submitting it.
- Verify the change by running it in the development environment.
- Attach before-and-after screenshots for any visual change.
- Write issue and pull request titles and descriptions yourself, following the
  issue/pull request templates — do not paste AI-generated content into them.
- Fill out the AI-assistance section of the pull request template honestly.

AI-generated contributions will not be counted toward Google Summer of Code (GSoC).

## Commit Convention

Commits follow [Conventional Commits](https://www.conventionalcommits.org/) (enforced by commitlint):

```bash
# Format: <type>: <description> (#issue-number)
git commit -m "feat: add password reset (#44)"
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Use present tense, imperative mood, keep the first line under 72 characters.

## Pull Request Guidelines

### Checklist

- ✅ All tests pass (`test:v1` / `test:src`)
- ✅ Lint, typecheck, and format checks pass
- ✅ Commits follow the convention above
- ✅ PR addresses a single concern
- ✅ PR template filled out completely, including the AI-assistance section
- ✅ Screenshots for UI changes

### Creating a PR

1. Click "Compare & pull request" on GitHub
2. Reference the issue: `Fixes #44` or `Closes #44`
3. Fill out the PR template completely
4. Request review from maintainers

### Best Practices

- Keep PRs small and focused
- Use Draft PRs for work in progress
- Don't resolve reviewer comments unless asked
- Re-request review after making changes
- Be patient — reviews typically take 3–7 days

## Merge Conflicts

```bash
git checkout main && git pull upstream main
git checkout your-feature-branch
git merge main
# Resolve conflicts, then:
git add . && git commit -m "resolve merge conflicts"
git push origin your-feature-branch
```

## Getting Help

- Comment on the issue/PR with `@username`
- Ask in [Slack](https://circuitverse.org/slack)
- Post in [Discussions](https://github.com/CircuitVerse/CircuitVerse/discussions)
- Add the `help wanted` label

## Community

Join our discussions and connect with contributors:

- **GitHub Discussions** — questions and general discussions
- **Slack** — real-time community chat
- **Issues/PRs** — technical discussions

### Support Us

Become a [financial contributor](https://opencollective.com/CircuitVerse/contribute) to help sustain our community.

<a href="https://opencollective.com/CircuitVerse"><img src="https://opencollective.com/CircuitVerse/individuals.svg?width=890" alt="Contributors"></a>

## Quick Tips

- Always work on feature branches, never on main
- Keep your fork's main synced with upstream
- Write descriptive commit messages
- Test thoroughly before submitting
- Be respectful and patient
- Ask questions when unsure

## The Bottom Line

We are all humans working together to improve this community. Always be kind and appreciate the need for tradeoffs. ❤️

Thank you for contributing to CircuitVerse!
