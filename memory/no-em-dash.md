---
name: no-em-dash
description: User forbids the em dash character in all writing; use other punctuation instead
metadata:
  type: feedback
---

Never use the em dash (the long dash, U+2014) anywhere: code, copy, comments, docs, commit messages, or these memory files. The user asked to strip it from the whole repo (2026-05-22). Do not even print the glyph; refer to it by name or codepoint.

Replace it with whatever reads most coherently for the context:
- prose / clause break -> a period followed by a capital, or a comma / colon where that flows better
- label or title separator -> the middle dot " · " the design already uses
- empty-value table placeholder -> a plain hyphen "-"

**Why:** the user dislikes the em dash (a common AI-writing tell) and wants cleaner, intentional punctuation.
**How to apply:** when writing or editing any text for this user, reach for `.`, `,`, `:`, `·`, or `-` instead. Never emit the em dash glyph. Related: [[dev-database-endpoint]].
