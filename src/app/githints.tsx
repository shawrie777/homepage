"use client"

import { useState } from "react";
import styles from "./githints.module.css";

type Hint = {
    command: string,
    description: string,
    result: string,
};

const hints : Hint[] = [
    {
        command: "git status --short",
        description: "Shows a compact summary of changed files. The first column shows staged changes; the second shows unstaged changes. ?? marks untracked files.",
        result: ` M src/app/page.tsx
?? src/app/githints.tsx`,
    },
    {
        command: "git add -p",
        description: "Choose which hunks to stage: y = stage, n = skip, s = split, e = edit, q = quit. For a new file, run git add -N -- path/to/file first so patch mode can see it.",
        result: `-const limit = 10;
+const limit = 20;
Stage this hunk [y,n,q,a,d,s,e,?]?`,
    },
    {
        command: "git diff --shortstat",
        description: "Totals for unstaged changes. Add --staged for staged changes, or HEAD for all tracked changes since the last commit. Untracked files are excluded.",
        result: "3 files changed, 12 insertions(+), 4 deletions(-)",
    },
    {
        command: "git diff --staged",
        description: "Review the changes prepared for the next commit. --cached means the same thing. Without either flag, git diff shows unstaged changes.",
        result: `@@ -1 +1 @@
-const limit = 10;
+const limit = 20;`,
    },
    {
        command: "git diff --color-moved=dimmed-zebra",
        description: "Uses alternating colours for moved blocks and dims their interiors. The sample is a plain-text excerpt; the distinction is visible in terminal colours.",
        result: `-const total = prices.reduce(sum, 0);
...
+const total = prices.reduce(sum, 0);`,
    },
    {
        command: "git diff --color-moved --color-moved-ws=allow-indentation-change",
        description: "Recognises moved blocks with a uniform indentation change. This affects move detection, not which changes appear. Moved code is coloured in the terminal.",
        result: `-const total = prices.reduce(sum, 0);
...
+    const total = prices.reduce(sum, 0);`,
    },
    {
        command: "git diff -w",
        description: "Ignores whitespace differences within lines. -b only ignores changes in whitespace amount; --ignore-space-at-eol only ignores trailing whitespace differences.",
        result: `-const limit = 10;
+const limit = 20;`,
    },
    {
        command: "git diff --ignore-blank-lines",
        description: "Suppresses hunks consisting entirely of blank-line changes. Combine with -w to also ignore whitespace differences within lines.",
        result: "(No output when only blank lines changed.)",
    },
    {
        command: "git diff --word-diff",
        description: "Shows removed and added words inline instead of whole changed lines. Use --word-diff=color for colour-only highlighting.",
        result: "const limit = [-10;-]{+20;+}",
    },
    {
        command: "git diff --check",
        description: "Reports whitespace errors and newly introduced conflict markers. Add --staged to check staged changes. No output means no issues found.",
        result: "src/app/page.tsx:12: trailing whitespace.\n+const limit = 20; ",
    },
    {
        command: 'git log --oneline -S "searchText"',
        description: "Finds commits that change the occurrence count of this exact string. -G searches added/removed lines using a regex instead. Add -p to see patches.",
        result: `a1b2c3d Remove searchText fallback
e4f5a6b Add searchText filtering`,
    },
    {
        command: "git log --oneline --follow -- src/app/page.tsx",
        description: "Follows one file's history across renames. Add -p for patches. The -- separates options from the file path.",
        result: `b2c3d4e Rename home.tsx to page.tsx
f5a6b7c Add homepage`,
    },
];

export function GitHints(){
    const [open, setOpen] = useState(false);
    const [tooltip, setTooltip] = useState<{x: number, y: number, content: string} | null>(null);

    const openTooltip = (hint: Hint, target: HTMLElement) => {
        const rect = target.getBoundingClientRect();
        setTooltip(hint.description
            ? {x: rect.right + 8, y: rect.top, content: hint.description}
            : null);
    };

    return <div className={styles.outer} style={{transform: open ? undefined : "translateX(-100%)"}}>
        <button type="button" className={styles.tab} onClick={()=>setOpen(o => !o)}>
            Git
        </button>
        <h1>Git</h1>
        <div className={styles.inner}>
            <section className={styles.list}>
                {hints.map((h,i) => {
                    return <div key={i}
                        onMouseEnter={e => openTooltip(h, e.currentTarget)}
                        onMouseLeave={() => setTooltip(null)}
                        onClick={() => navigator.clipboard.writeText(h.command)}
                    >
                        <h2>{h.command}</h2>
                        <p>{h.result}</p>
                    </div>
                })}
            </section>
        </div>
        {tooltip && <div
            className={styles.tooltip}
            style={{left: tooltip.x, top: tooltip.y}}
        >
            {tooltip.content}
        </div>}
    </div>
}
