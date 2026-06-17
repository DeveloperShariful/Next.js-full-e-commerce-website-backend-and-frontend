---
name: feedback-no-delete-files
description: User handles file deletion themselves — never run delete/rm commands on files
metadata:
  type: feedback
---

Never delete files using shell/bash commands. The user always handles file deletion themselves.

**Why:** User explicitly said "delete ami korbo tumi sudhu update koro" — they want full control over which files are removed.

**How to apply:** When merging/replacing files, just update the target file. Do NOT run `rm`, `del`, or any deletion command on old files. Mention which old files are now unused so the user can delete them manually.
