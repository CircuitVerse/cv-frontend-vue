# Issue & PR Label Guide (cv-frontend-vue)

This document defines the labeling system used for issues and pull requests in the **cv-frontend-vue** repository.  
The goal is to ensure consistent triaging, improve issue clarity, and make it easier for contributors and maintainers to collaborate effectively.

Labels are applied after verifying reproducibility, checking for duplicates, and ensuring each issue addresses a single concern. Issues covering multiple concerns may be split for clarity.

---

## Status / Flow Labels

These labels represent the **current lifecycle state** of an issue.

| Label | Description |
|------|------------|
| `Pending` | Issue has been reported and is awaiting initial triage. |
| `In progress` | Work on the issue has started. |
| `Blocked` | Progress is blocked due to a dependency or external factor. |
| `Duplicate` | The issue has already been reported and is tracked elsewhere. |
| `Stale` | No activity for an extended period; may be closed if no updates occur. |

---

## Type Labels

These labels describe **the nature of the issue**.

| Label | Description |
|------|------------|
| `Bug` | Something is broken or not functioning as intended. |
| `Feature` | Request for new functionality or capability. |
| `Enhancement` | Improvement to an existing feature or behavior. |
| `Documentation` | Issues related to documentation, guides, or comments. |
| `UI/UX` | User interface or user experience related issues. |
| `Security` | Issues that may impact application or user security. |
| `Breaking change` | Changes that may break existing functionality or backward compatibility. |

---

## Platform / Area Labels

These labels indicate **where the issue applies**.

| Label | Description |
|------|------------|
| `Tauri` | Issues related to the Tauri-based application layer. |
| `Desktop` | Desktop-specific functionality or behavior. |

---

## Operating System Labels

Used when an issue is **OS-specific**.

| Label | Description |
|------|------------|
| `Windows` | Issue specific to Windows environments. |
| `Linux` | Issue specific to Linux environments. |
| `macOS` | Issue specific to macOS environments. |

---

## Contributor-Friendly Labels

These labels help contributors discover suitable issues.

| Label | Description |
|------|------------|
| `good first issue` | Suitable for first-time contributors. |
| `Needs help` | Maintainers welcome contributions on this issue. |

---

## Time-Based Labels

These labels indicate **estimated effort or scope**.

| Label | Description |
|------|------------|
| `Small` | Minor change, quick fix, or low-risk update. |
| `Medium` | Requires moderate changes or understanding of the codebase. |
| `Large` | Significant refactor, complex logic, or multi-file changes. |

---

## Pull Request Labels

### PR Status

| Label | Description |
|------|------------|
| `Review-ready` | Pull request is ready for review. |
| `Approved` | Pull request has been reviewed and approved. |

### PR Priority

| Label | Description |
|------|------------|
| `P0` | Critical fix; requires immediate attention. |
| `P1` | High priority but not blocking. |
| `P2` | Normal priority. |
