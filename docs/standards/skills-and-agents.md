<!-- Synced from Jondi-Studio/ci standards/topics/skills-and-agents.md. Don't edit here; change it there. -->

# Skills and agents

- **One route:** shared skills and agents come only from the `jondis-skills` plugin, from the
  `Jondi-Studio/jondis-skills` marketplace. Each repo enables it in `.claude/settings.json`; machines
  install it with `node bootstrap.mjs`.
- **Cloud sessions don't load it.** Claude Code on the web does not install plugins a repo declares,
  so plugin skills are local-only. That is why these standards are synced into each repo as files
  instead of shipped in the plugin. A skill a cloud session must have goes in the repo's
  `.claude/skills/`, or is enabled on claude.ai.
- **Never copy** a shared skill into a repo, and never edit the plugin cache. Change it in
  `jondis-skills`, bump `version` in `.claude-plugin/plugin.json`, open a PR.
- **Repo-local skills** (`.claude/skills/`) are only for skills that call that repo's own commands
  (maths `verify-packet`, Priorities `review-issue-reports`).
- **Per-repo agent docs:** `AGENTS.md` holds the repo's own truth (layout, commands, gate, its
  exceptions) and is tool-neutral. `CLAUDE.md` is `@AGENTS.md` plus `@docs/standards/core.md` and
  anything Claude-only. Neither restates a standard: the standards live in `docs/standards/`,
  synced from `Jondi-Studio/ci`.

## Planning flow

Matt Pocock's flow, vendored in the plugin: `/grill-with-docs`, `/to-spec`, `/to-tickets`, then
`/implement` per ticket or `/implement-spec` for a whole spec, using `/tdd` and `/code-review`.
Large unclear efforts start at `/wayfinder`; incoming issues go through `/triage`. Each repo runs
`/setup-matt-pocock-skills` once. `/handoff` writes to `.scratch/handoffs/`.

maths alone keeps its older coordinator/worker workflow, versioned in its own `.claude/`.

## Models

- Subagents default to **Sonnet** (`claude-sonnet-5-5`); the plugin's `implementer` agent is pinned
  to it. Planning may run on a stronger model.
- Use Opus for a subagent only when Jondi asks. Use Fable only when he names it for that subagent,
  then go back to the default.
- Reuse before respawning: send a follow-up to an agent that already holds the context rather than
  starting a new one, unless its history is mostly spent tool output.

## Keeping context lean

Every auto-invocable skill's description sits in every session. A new skill is
`disable-model-invocation: true` unless Claude needs to find it unprompted.
