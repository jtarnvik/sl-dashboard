# /jco — Build, verify, and commit (frontend + backend)

Run quality checks on both the frontend and backend, then commit tracked changes in each
repo that has something to commit.

## Step 1 — Locate both repos

- **Frontend root (`FE_ROOT`):** The directory containing `package.json`. Walk up from the
  current working directory until found.
- **Backend root (`BE_ROOT`):** `<FE_ROOT>/../publicbackend` — verified by the presence of
  `pom.xml` there.

If either root cannot be confirmed, stop and tell the user.

## Step 2 — Build both

Run both builds. If either fails, stop immediately, report what failed, and do not touch git
in either repo.

- Frontend: `npm run build` from `FE_ROOT`
- Backend: `mvn verify` from `BE_ROOT`

## Step 3 — Commit the frontend (if it has changes)

**3a. Stage tracked changes**
`git add -u` from `FE_ROOT`. Never `git add -A` — untracked files must be staged explicitly
by the user.

**3b. Check for staged changes**
`git status` — if the staging area is empty, skip to Step 4 with a note that the frontend
has nothing to commit.

**3c. Draft a commit message**
Inspect `git diff --staged` and `git log --oneline -5`. Draft a concise message (1–2 sentences)
on the *why*, not the *what*. Append the Co-Authored-By trailer:

```
Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

**3d. Show and confirm**
Display the file list (`git status --short`) and the proposed message. Ask the user to confirm.
Revise if requested. Do not commit until explicitly approved.

**3e. Commit**

```bash
git commit -m "$(cat <<'EOF'
<message here>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

## Step 4 — Commit the backend (if it has changes)

Repeat steps 3a–3e for `BE_ROOT`. Each repo gets its own separate confirmation and commit.

## Step 5 — Final status

Run `git status` in both repos and report both results so the user can see everything landed
cleanly.
