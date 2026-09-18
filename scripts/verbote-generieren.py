#!/usr/bin/env python3
"""
Erzeugt lib/agents/verbote.generated.ts aus der Verbotsliste.

Die Verbotsliste (lib/agents/material/forbidden-words.md) ist ein lebendiges
Dokument, das das Team pflegt. Eine zweite, handgepflegte Kopie im Linter
liefe nach dem dritten Eintrag auseinander — dann prueft der Linter etwas
anderes, als die Lehre sagt. Also wird sie erzeugt.

Aufruf:  python3 scripts/verbote-generieren.py

Nicht uebernommen werden Abschnitt J (Satzzeichen), K (ausdruecklich erlaubt)
sowie L und M (strukturelle Verbote) — dafuer gibt es eigene Regeln in lint.ts.
"""
import re, sys, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC  = os.path.join(ROOT, 'lib/agents/material/forbidden-words.md')
DST  = os.path.join(ROOT, 'lib/agents/verbote.generated.ts')

LABEL = {
    'A': 'ausdrücklich verboten', 'B': 'AI-Schwurbel (DE)', 'C': 'AI-Schwurbel (EN)',
    'D': 'LinkedIn-Hallmark', 'E': 'Cold-Mail-Klischee', 'F': 'Übergriffigkeit',
    'G': 'Virtue-Signalling', 'H': 'Besserwissertum', 'I': 'Verschleierungs-Verb',
}
NEHMEN = list(LABEL)

# Woerter, die nur in einer bestimmten Lesart verboten sind. Die Quelle sagt das
# jeweils dazu ("bildlos", "ausser Klima-Kontext", "als Phrase"). Ein harter
# Treffer darauf wuerde jeden zweiten korrekten Satz anmeckern, also melden wir
# sie als Warnung und ueberlassen das Urteil dem Menschen.
# Begriffe, fuer die lint.ts eine eigene, genauere Regel hat. Sie stehen hier
# nicht noch einmal, sonst meldet der Linter denselben Satz zweimal.
EIGENE_REGEL = {'aber', 'leute'}

KONTEXT = {
    'trägt', 'tragen', 'tragend', 'dna', 'value', 'performance', 'nachhaltig',
    'skalieren', 'optimieren', 'effizient', 'fahren', 'gefühlt', 'wahrscheinlich',
    'relativ', 'gut', 'klar', 'gerade',
}

def main():
    src = open(SRC, encoding='utf-8').read()
    parts = re.split(r'^## ([A-M])\. (.+)$', src, flags=re.M)
    sec = {parts[i]: parts[i + 2] for i in range(1, len(parts), 3)}

    erlaubt = {m.group(1).strip().lower() for m in re.finditer(r'`([^`]+)`', sec.get('K', ''))}

    clean, seen = [], set()
    for k in NEHMEN:
        # In den Tabellen steht das Verbot in der ersten Spalte und die
        # Begruendung in der zweiten — und die Begruendung nennt haeufig den
        # ERSATZ in Backticks ("Ersatz: Satzpause, `und`"). Wer die Zeile im
        # Ganzen liest, verbietet am Ende das Gegenmittel.
        roh = []
        for zeile in sec.get(k, '').split('\n'):
            if zeile.lstrip().startswith('|'):
                spalten = [c for c in zeile.split('|') if c.strip()]
                roh.append(spalten[0] if spalten else '')
            else:
                roh.append(zeile)
        for m in re.finditer(r'`([^`]+)`', '\n'.join(roh)):
            t = re.sub(r'\s*\((?:.|\n)*?\)\s*$', '', m.group(1).strip(' ·')).strip().rstrip('…').strip()
            if not t or '[' in t or '{' in t:
                continue
            for v in re.split(r'\s+/\s+', t):
                v = v.strip().rstrip('…').strip()
                low = v.lower()
                if len(v) < 3 or low in erlaubt or low in seen or low in EIGENE_REGEL:
                    continue
                seen.add(low)
                clean.append((k, v, low in KONTEXT))

    lines = [
        '/* ─────────────────────────────────────────────────────────────────────────────',
        ' * ERZEUGT — nicht von Hand aendern.',
        ' *',
        ' * Quelle:  lib/agents/material/forbidden-words.md, Abschnitte A bis I',
        ' * Erzeugt: python3 scripts/verbote-generieren.py',
        ' *',
        ' * Abschnitt J (Satzzeichen), K (ausdruecklich erlaubt), L und M (strukturelle',
        ' * Verbote) stehen nicht hier — dafuer gibt es eigene Regeln in lint.ts.',
        ' *',
        ' * `kontext: true` heisst: Die Quelle verbietet das Wort nur in einer Lesart',
        ' * ("bildlos", "ausser Klima-Kontext", "als Phrase"). Solche Treffer sind',
        ' * Warnungen, keine Fehler — das Urteil bleibt beim Menschen.',
        ' * ──────────────────────────────────────────────────────────────────────────── */',
        '',
        'export interface VerbotenerBegriff { wort: string; gruppe: string; kontext?: boolean }',
        '',
        'export const VERBOTENE_BEGRIFFE: VerbotenerBegriff[] = [',
    ]
    for k, v, ctx in clean:
        esc = v.replace('\\', '\\\\').replace("'", "\\'")
        lines.append(f"  {{ wort: '{esc}', gruppe: '{LABEL[k]}'{', kontext: true' if ctx else ''} }},")
    lines += [']', '']

    open(DST, 'w', encoding='utf-8').write('\n'.join(lines))
    harte = sum(1 for _, _, c in clean if not c)
    print(f'{len(clean)} Begriffe ({harte} hart, {len(clean)-harte} kontextabhaengig) -> {DST}')

if __name__ == '__main__':
    sys.exit(main())
