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

Run from the worktree root with Bash and Python 3.9 or later. This checks active Markdown links and heading fragments, index coverage and display-label ordering, and the exact spelling of `knowledge/INDEX.md`. It also checks that each of the six templates has one primary entry under Templates and validates the shared instructions and decision metadata. Inspect the diff against the previous revision to confirm that link labels, destinations, literals and decision reasoning survived the edit.

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
stale_paths = ('knowledge/index.md', 'templates/bug-report.md')
inline_code = re.compile(r'(?<!`)(`+)(?!`)(.*?)(?<!`)\1(?!`)')
link_destination = re.compile(r'\(\s*(<[^>\n]+>|[^\s)]*)'
                              r'(?:\s+["\'][^\n]*?["\'])?\s*\)')
link = re.compile(r'\[([^\]\n]+)\]' + link_destination.pattern)
label_token = re.compile(r'\\[\\\[\]]|[\[\]]')
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


def mask_code(line):
    # Keep the original offsets so link labels and targets can be read from the source.
    return inline_code.sub(lambda span: '\0' * len(span[0]), line)


def code_text(span):
    text = span[2]
    if text.startswith(' ') and text.endswith(' ') and text.strip(' '):
        return text[1:-1]
    return text


def code_without_links(span):
    text = code_text(span)
    visible = mask_code(text)
    openings = []
    examples = []
    end = 0
    for token in label_token.finditer(visible):
        if token.start() < end:
            continue
        if token[0] == '[':
            openings.append((token.start(), len(examples)))
        elif token[0] == ']' and openings:
            start, first_inner = openings.pop()
            if destination := link_destination.match(visible, token.end()):
                end = destination.end()
                # The outer example already covers any examples inside its label.
                del examples[first_inner:]
                examples.append((start, end))

    remaining = []
    cursor = 0
    for start, end in examples:
        remaining.append(text[cursor:start])
        cursor = end
    remaining.append(text[cursor:])
    return ' '.join(remaining)


def atx_heading(line):
    if match := re.match(r'^ {0,3}(#{1,6})([ \t].*)?$', line):
        opening, body = match.groups()
        title = re.sub(r'[ \t]+#+[ \t]*$', '', body or '').strip(' \t')
        return len(opening), title
    return None


def heading_anchors(path):
    counts = Counter()
    for _, line in prose(path.read_text()):
        if (heading := atx_heading(line)) and heading[1]:
            title = heading[1]
            for item in reversed(list(link.finditer(mask_code(title)))):
                start, end = item.span(1)
                title = title[:item.start()] + title[start:end] + title[item.end():]
            title = inline_code.sub(code_text, title)
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
template_paths = {template_dir / name for name in templates}
template_entries = Counter()
actual = {path.relative_to(template_dir).as_posix() for path in template_dir.rglob('*.md')}
if actual != templates:
    errors.append(f'Template inventory differs: {sorted(actual ^ templates)}')
index_names = {path.name for path in vault.iterdir() if path.name.casefold() == index.name.casefold()}
if index_names != {index.name} or not index.is_file():
    errors.append('Expected knowledge/INDEX.md with exact capitalization')

notes = set(vault.rglob('*.md'))
sources = notes | set(repo.glob('*.md')) | set((repo / '.agents' / 'agents').glob('*.md'))
for source in sorted(sources):
    if source.is_relative_to(vault / 'archive'):
        continue
    in_templates = False
    last_label = ''
    for number, line in prose(source.read_text()):
        where = f'{source.relative_to(repo)}:{number}'
        if (heading := atx_heading(line)) and heading[0] <= 2:
            in_templates = heading == (2, 'Templates')
            last_label = ''
        visible = mask_code(line)
        if re.search(r'\[\[(?!/r(?:oll)?\s)[^\[\]]+\]\]', visible):
            errors.append(f'{where}: use a relative Markdown link')
        code = (code_without_links(span) for span in inline_code.finditer(line))
        if (any(path in visible for path in stale_paths)
                or any(path in text for text in code for path in stale_paths)):
            errors.append(f'{where}: stale knowledge path')
        for match in link.finditer(visible):
            start, end = match.span(2)
            raw = line[start:end]
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
                start, end = match.span(1)
                label = inline_code.sub(code_text, line[start:end]).casefold()
                if label < last_label:
                    errors.append(f'{where}: index entries must be alphabetical within their section')
                last_label = label
                if source == index and target in template_paths:
                    if in_templates:
                        template_entries[target.name] += 1
                    else:
                        errors.append(f'{where}: template entry {target.name} must be under Templates')
                if target in notes and archived(target):
                    errors.append(f'{where}: move archived notes and fixed bugs out of the active index')
                if target in notes and not target.is_relative_to(template_dir):
                    if 'Read when:' not in line or target in entries:
                        errors.append(f'{where}: expected one index entry with a reading hint')
                    entries[target] = line

for name in sorted(templates):
    if template_entries[name] != 1:
        errors.append(f'knowledge/INDEX.md: expected one primary entry for templates/{name} '
                      f'under Templates, found {template_entries[name]}')

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
