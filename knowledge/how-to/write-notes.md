---
title: Write project notes
created: 2026-11-23
updated: 2026-11-23
tags: [workflow]
status: active
---
# Write project notes

**TL;DR:** File evidence with its topic, choose the matching template and register the note in the [knowledge index](../INDEX.md) or its topic overview.

## When to use

Use this guide when writing, moving or retiring notes. Run the checks below after changing knowledge files, shared entry instructions or the reviewer checklist.

## Steps

1. Start with the [knowledge index](../INDEX.md) and relevant topic overview. Search existing notes with `rg`. Favor recent evidence and report contradictions.
2. Use lowercase kebab-case filenames and the matching template. Prefix decision filenames with their date. Record conclusions, evidence and dates, with examples and limitations where relevant. Distinguish verified behavior from proposals. Date topic verification after checking the code or procedure.
3. Write relative Markdown links from the containing file. Use `[Write project notes](how-to/write-notes.md)` from the index and `[Write project notes](../../how-to/write-notes.md)` from a topic subfolder. Include `.md` and keep the existing link label and any heading fragment when migrating links. Repair incoming links when moving a note.
4. Register active notes alphabetically within their section in the index or the area's `_overview.md`. Use one bullet with a relative link, a summary and a **Read when** hint. Keep fixed bug reports reachable by search and remove their open index entries. Keep retired knowledge with `status: outdated` and a link to its replacement.
5. At finish, update the builder tool's calibration log as described in [Model calibration](../topics/model-calibration/_overview.md).

## Templates

- [Topic](../templates/topic.md) for an area's purpose, key files, connections and current state. Date the evidence in **Last verified**.
- [How-to](../templates/how-to.md) for a repeatable procedure. Give exact commands when applicable and mark untested procedures `TODO: unverified`.
- [Reference](../templates/reference.md) for a contract, its evidence and limits.
- [Decision](../templates/decision.md) for a choice between alternatives.
- [Bug report](../templates/bug.md) for an open issue in `bugs/`. Include evidence and steps to reproduce. After a fix, record the regression test, set `status: fixed`, move the note to `bugs/fixed/`, repair incoming links and remove the open index entry.
- [Feature](../templates/feature.md) for delivered behavior. Record the request, decisions, behavior, exclusions, implementation and verification.

File transferable surprises in [Gotchas](../gotchas.md).

## Decision records

Put `title`, `date`, `status` and `tags` in YAML frontmatter. Use `proposed` for an open choice and `accepted` once adopted. Use **Context**, **Decision**, **Alternatives** and **Consequences** in that order. Preserve the reasoning and substantive extra sections when formatting an older record. Mark gaps in the evidence explicitly.

When a later decision changes an earlier one, write a successor and keep the earlier reasoning intact. Set the earlier record's `status: replaced` or `status: replaced in part` and add `replaced_by` with the successor path relative to the earlier note, including `.md`. Add `replaced_part` only for a partial replacement and describe what changed. Link the successor from the earlier index entry, describe the scope of a partial replacement and mark fully replaced entries **Read when: history only.**

## Check it worked

Run from the worktree root with Bash and Python 3.9 or later. This checks active Markdown links and heading fragments, index coverage and order, the six templates, shared instructions and decision metadata. Inspect the diff against the previous revision to confirm that link labels, destinations, literals and decision reasoning survived the edit.

```bash
python3 - <<'CHECK'
from collections import Counter
from datetime import date
from pathlib import Path
import re
from urllib.parse import unquote, urlsplit

repo = Path.cwd()
vault = repo / 'knowledge'
index = vault / 'INDEX.md'
templates = {'topic.md', 'how-to.md', 'reference.md', 'decision.md', 'bug.md', 'feature.md'}
sections = ('Context', 'Decision', 'Alternatives', 'Consequences')
shared_sections = ('What this is', 'Commands', 'Hard rules', 'Knowledge base')
link = re.compile(r'\[([^\]\n]+)\]\(\s*(<[^>\n]+>|[^\s)]*)'
                  r'(?:\s+["\'][^\n]*?["\'])?\s*\)')
errors = []
entries = {}


def prose(text):
    fence = ''
    for number, line in enumerate(text.splitlines(), 1):
        marker = re.match(r'^ {0,3}(`{3,}|~{3,})(.*)$', line)
        if fence:
            if marker and marker[1].startswith(fence) and not marker[2].strip():
                fence = ''
        elif marker:
            fence = marker[1]
        else:
            yield number, line


def heading_anchors(path):
    counts = Counter()
    for _, line in prose(path.read_text()):
        if match := re.match(r'^ {0,3}#{1,6}\s+(.+?)\s*#*$', line):
            title = link.sub(r'\1', match[1])
            slug = re.sub(r'[^\w -]', '', title.lower()).replace(' ', '-')
            yield f'{slug}-{counts[slug]}' if counts[slug] else slug
            counts[slug] += 1


def archived(path):
    parts = path.relative_to(vault).parts
    return parts[:1] == ('archive',) or parts[:2] == ('bugs', 'fixed')


def check_decision(path):
    text = path.read_text()
    header = re.match(r'\A---\n(.*?)\n---\n', text, re.S)
    if not header:
        errors.append(f'{path}: missing decision frontmatter')
        return
    pairs = re.findall(r'^(\w+):[ \t]*(.*)$', header[1], re.M)
    fields = {key: value.strip().strip('"\'') for key, value in pairs}
    counts = Counter(key for key, _ in pairs)
    for key in ('title', 'date', 'status', 'tags'):
        if counts[key] != 1 or not fields.get(key):
            errors.append(f'{path}: expected one nonempty {key} field')
    try:
        if date.fromisoformat(fields.get('date', '')).isoformat() != path.name[:10]:
            raise ValueError
    except ValueError:
        errors.append(f'{path}: date must match the YYYY-MM-DD filename prefix')
    body = [line for _, line in prose(text[header.end():])]
    headings = tuple(line[3:] for line in body if line.startswith('## ') and line[3:] in sections)
    if headings != sections:
        errors.append(f'{path}: expected Context, Decision, Alternatives and Consequences in order')
    if any(re.match(r'^(?:\*\*)?(?:Date|Status):', line, re.I) for line in body):
        errors.append(f'{path}: put date and status in frontmatter')
    status = fields.get('status')
    if status not in ('proposed', 'accepted', 'replaced', 'replaced in part'):
        errors.append(f'{path}: invalid decision status')
    if status in ('replaced', 'replaced in part'):
        successor = fields.get('replaced_by', '')
        target = (path.parent / successor).resolve()
        if (counts['replaced_by'] != 1 or Path(successor).is_absolute()
                or target == path or target.suffix != '.md' or not target.is_file()
                or not target.is_relative_to(vault / 'decisions')):
            errors.append(f'{path}: expected a relative replaced_by path to another decision')
        else:
            entry = entries.get(path, '')
            relative = target.relative_to(vault).as_posix()
            if f'({status} by [' not in entry or f']({relative})' not in entry:
                errors.append(f'{path}: index entry must identify the replacement and its status')
            if status == 'replaced' and 'Read when: history only.' not in entry:
                errors.append(f'{path}: index entry must mark a full replacement as history')
    elif counts['replaced_by']:
        errors.append(f'{path}: replaced_by requires a replacement status')
    if status == 'replaced in part':
        if counts['replaced_part'] != 1 or not fields.get('replaced_part'):
            errors.append(f'{path}: expected one nonempty replaced_part field')
    elif counts['replaced_part']:
        errors.append(f'{path}: replaced_part requires partial replacement')


agents, gemini = (path.read_text() for path in (repo / 'AGENTS.md', repo / 'GEMINI.md'))
for section in shared_sections:
    pattern = rf'^## {section}\n.*?(?=^## |\Z)'
    left = re.search(pattern, agents, re.M | re.S)
    right = re.search(pattern, gemini, re.M | re.S)
    if not left or not right or left[0] != right[0]:
        errors.append(f'AGENTS.md and GEMINI.md differ in {section}')

template_dir = vault / 'templates'
actual = {path.relative_to(template_dir).as_posix() for path in template_dir.rglob('*.md')}
if actual != templates:
    errors.append(f'Template inventory differs: {sorted(actual ^ templates)}')
if not index.is_file() or (vault / 'index.md').exists():
    errors.append('Expected knowledge/INDEX.md with exact capitalization')

notes = set(vault.rglob('*.md'))
sources = notes | set(repo.glob('*.md')) | set((repo / '.agents' / 'agents').glob('*.md'))
for source in sorted(sources):
    if source.is_relative_to(vault / 'archive'):
        continue
    last_label = ''
    for number, line in prose(source.read_text()):
        where = f'{source.relative_to(repo)}:{number}'
        if line.startswith('## '):
            last_label = ''
        visible = re.sub(r'(?<!`)(`+)(?!`).*?(?<!`)\1(?!`)', '', line)
        if re.search(r'\[\[(?!/r(?:oll)?\s)[^\[\]]+\]\]', visible):
            errors.append(f'{where}: use a relative Markdown link')
        if 'knowledge/index.md' in line or 'templates/bug-report.md' in line:
            errors.append(f'{where}: stale knowledge path')
        for match in link.finditer(visible):
            label, raw = match.groups()
            parts = urlsplit(raw.strip('<>'))
            if parts.scheme or parts.netloc:
                continue
            path = unquote(parts.path)
            target = (source.parent / path).resolve() if path else source
            if Path(path).is_absolute() or not target.exists():
                errors.append(f'{where}: missing or nonrelative link target {raw!r}')
                continue
            if parts.fragment and target.suffix == '.md':
                if unquote(parts.fragment) not in set(heading_anchors(target)):
                    errors.append(f'{where}: missing heading for {raw!r}')
            in_overview = (source.name == '_overview.md' and source.is_relative_to(vault / 'topics')
                           and target.parent == source.parent and target != source)
            if match.start() == 2 and visible.startswith('- ') and (source == index or in_overview):
                if label.casefold() < last_label:
                    errors.append(f'{where}: index entries must be alphabetical within their section')
                last_label = label.casefold()
                if target in notes and archived(target):
                    errors.append(f'{where}: move archived notes and fixed bugs out of the active index')
                if target in notes and not target.is_relative_to(template_dir):
                    if 'Read when:' not in line or target in entries:
                        errors.append(f'{where}: expected one index entry with a reading hint')
                    entries[target] = line

for note in sorted(notes - {index}):
    if not archived(note) and not note.is_relative_to(template_dir) and note not in entries:
        errors.append(f'Missing index entry: {note.relative_to(repo)}')
    if note.parent == vault / 'decisions':
        check_decision(note)

if errors:
    raise SystemExit('\n'.join(errors))
print(f'Knowledge checks passed: {len(entries)} indexed notes, {len(actual)} templates, '
      f'{sum(note.parent == vault / "decisions" for note in notes)} decisions.')
CHECK
```
