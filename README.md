# dsh-claim-discipline

A standing system-prompt section for **DeepSeek Harness (DSH)**: a *claim
discipline* checklist to run through **before stating a conclusion**.

It executes nothing. All it does is inject eight self-check rules (plus one
meta-case block) into the system prompt. The design target is **zero risk**: no dependencies, no
`peerDependencies`, no callbacks, no I/O, no timers, no state. Its worst case is
that it does not take effect - it has no ability to make the host fail.

Chinese documentation: [README.zh.md](README.zh.md).

## Where the rules come from

They are not invented. They are ordered by the frequency of failure observed in
a single real session, audited turn by turn (30 instances across 12 patterns):

| Failure pattern | Count |
| --- | --- |
| Unverified attribution stated as a conclusion | 9 |
| Untraceable numbers, or a wrong unit | 5 |
| "Verified" claimed for something else (incl. circular reasoning; self-report used as evidence) | 3 |
| Mis-labelled path / target | 3 |
| Conclusion bigger than the evidence (boundary lost while compressing) | 2 |
| Own output already contained the counter-example, and was not re-read | 2 |
| Completeness or guarantee overclaimed | 2 |
| Hypothesis raised, then silently dropped | 1 |

## The eight rules

> **The injected payload is Chinese on purpose.** It is a set of instructions for
> an agent that replies in Chinese, so it must match the language of the
> conversation. The gloss below is for readers of this repository. To ship an
> English payload, replace the `TEXT` array in `index.js`.

1. **Attribution needs evidence first.** Before writing "this means / the root cause is / X caused it / causality established", the preceding sentence must be a direct observation from the current turn. Otherwise downgrade it to "suspected, unverified". Values read at different moments must never be merged into one state.
2. **Numbers must be traceable on the spot.** Quote the raw value (e.g. `3887.4 MB`). An aggregate must be added up row by row from the same table, with the arithmetic shown. Never subtract across two different moments. MB to GB is always `/1024`.
3. **The conclusion must not be bigger than the evidence.** A conclusion sentence may not introduce a dimension the evidence does not contain ("all / every / only / any / none / overseas"). When such a word appears, count the rows before writing it.
4. **"Verified" requires naming the evidence.** You must be able to point at *which line of output* proves it; if you cannot, write "unverified". A self-report ("I only read, I did not write") is not evidence - label it as a self-report.
5. **No completion claim without verification.** Before saying "fixed / in effect", that verification must actually have been run in this turn, and its full output and exit code read.
6. **Close every hypothesis.** After writing "possibly ... let me check", a concluding sentence is mandatory - including "the hypothesis was falsified". A step you announced but did not do must be struck out explicitly, never dropped silently.
7. **Suspect the instrument before the environment.** When several targets fail together - including a control that should have succeeded - check the probe first. Every experiment carries one must-pass control and one must-fail control. Before reporting a path or a label, print the real value.
8. **A description is not behaviour.** Comments, log lines, READMEs, UI hints and a tool's own "go set it over there" text are only *someone wrote this* - never behaviour evidence. To claim a switch or a field is "in effect / pins the behaviour / changed what happens", first read the line of code that actually reads it (grep the field and classify every hit: schema / default / write-clamp / log gate / real branch), and show one observable output on each side of the change. If it only appears in prose, the only defensible conclusion is "it currently affects the wording, nothing else".

### Meta note: why rule 8 exists

On 2026-10-23 the same pattern fired twice in one evening. (a) A plugin log said *fill in "whose DMs to reply to" under Advanced*; I repeated it as fact - the frontend never contains that field (0 occurrences) and no such input exists. (b) A code comment described a priority order ("explicit UID -> ..."); I concluded that writing that field had pinned the behaviour, while the function returns `dmUid` first and never reads it - the only real effect was that one log line stopped repeating. In both cases the sole evidence was a line of prose, yet the conclusion claimed a runtime change. The fix is mechanical: demote the prose to a hint, read the branch that actually consumes the value, and take one observable reading on each side.

## Provenance / acknowledgements

The rule texts are original wording. The ideas were informed by:

- **verification-before-completion** - it defines claiming completion without
  verification as lying, and pairs that with a counter-argument table and a
  banned-words list. <https://github.com/jagreehal/jagreehal-claude-skills>
- **CoVe / Chain-of-Verification** (arXiv:2309.11495) - draft, generate
  verification questions, answer them in isolation, rewrite. This plugin takes
  only the static "force a self-check" half; it does not implement the
  multi-round loop (see below).
- **FActScore** (arXiv:2305.14251) - decompose a long answer into atomic facts
  and check each one, which is precisely the measurable form of "distortion
  while compressing into a conclusion".

## Why there is no mechanical second pass

A CoVe-style "run one more verification round" would need DSH's
`agent/turn-stopping` plus `agent.steer` to force another step *after* the reply
has already been produced. That would add **an executing callback** (DSH's
policy for an uncaught exception in a synchronous callback is to release the app
and exit non-zero) **and one extra model call per turn**. This plugin declines
both costs.

## Install (DSH)

    plugin_manager  action=install_bundle  target=<absolute path to this directory>

Once installed it is a single `insert` row with no `config`. To disable it:

    plugin_manager  action=set_bundle  target=@local/dsh-claim-discipline  enabled=false

## Self-check

    node verify.mjs

It asserts that exactly one effect and one section are registered, that the order
is finite, that all eight rules and the meta-case block are present, and that the payload contains no
`{{...}}` group (a section is variable-interpolated by default, so braces would
be substituted).

## License

MIT