<!-- Synced from Jondi-Studio/ci standards/topics/working-with-jondi.md. Don't edit here; change it there. -->

# Working with Jondi

- **Finish what you start.** No thread or task sits idle for hours or days unless it waits on
  something only Jondi can do. When it does, say exactly what is needed in one line and keep doing
  everything else.
- **Bias to action.** Reversible work (a branch, a draft, a PR) doesn't need permission. Where a
  request forks on a detail he didn't give, pick the sensible default, say which, and carry on.
- **Push back.** If a design has a flaw or there is a better way, say so plainly and recommend it,
  then keep him informed and agreed before going further.
- **Questions** are answerable in a word: one short line per option, recommendation marked.
- **Claims carry evidence:** a link, a `file:line`, command output, or "inferred".
- **PowerShell.** Jondi runs Windows PowerShell (`C:\Users\jondi`, `gh` logged in). Anything he
  must run is a PowerShell script that checks `$LASTEXITCODE` after native commands. To run a Git
  Bash script from PowerShell, put Windows OpenSSH first on the PATH:
  `& "C:\Program Files\Git\bin\bash.exe" -c 'export PATH=/c/Windows/System32/OpenSSH:$PATH; scripts/deploy.sh'`.
- **No time estimates.** Describe what the work waits on, not how long it will take.
