import React from "react";

const LETTERS = "A-Za-zΑ-Ωα-ωΆΈΉΊΌΎΏάέήίόύώϊϋΐΰΪΫ";
const NAME = `[${LETTERS}][${LETTERS}.\\-']*(?:\\s+[${LETTERS}][${LETTERS}.\\-']*){0,4}`;
const SIDE_META = `(\\s*(?:\\[[^\\]]+\\]|\\([^\\)]+\\)))?`;
const RED_STYLE = { color: "hsl(var(--competition-red))", fontWeight: 700 } as const;
const BLUE_STYLE = { color: "hsl(var(--competition-blue))", fontWeight: 700 } as const;

export function renderCompetitionMessage(text: string): React.ReactNode {
  const clean = (text ?? "").replace(/\*\*/g, "");
  const lines = clean.split("\n");

  return lines.map((line, li) => {
    const segments: { start: number; end: number; node: React.ReactNode }[] = [];
    let key = 0;
    let match: RegExpExecArray | null;

    const pushSeg = (start: number, end: number, node: React.ReactNode) => {
      const overlap = segments.some((segment) => !(end <= segment.start || start >= segment.end));
      if (!overlap) segments.push({ start, end, node });
    };

    const emojiRegex = new RegExp(`(🔴|🔵)\\s*(${NAME})${SIDE_META}`, "gu");
    while ((match = emojiRegex.exec(line)) !== null) {
      const toneStyle = match[1] === "🔴" ? RED_STYLE : BLUE_STYLE;
      pushSeg(
        match.index,
        match.index + match[0].length,
        <React.Fragment key={`em-${li}-${key++}`}>
          {match[1]}{" "}
          <span style={toneStyle}>{match[2]}</span>
          {match[3] || ""}
        </React.Fragment>
      );
    }

    // Note: athlete names are colored ONLY when their corner emoji (🔴/🔵)
    // explicitly appears in front of them — i.e. live match contexts.
    // We intentionally do NOT colorize "Name vs Name" or "Red:/Blue:" labels
    // anywhere else, so subscription/user lists stay neutral.

    const urlRegex = /(https?:\/\/[^\s<>"'`]+[^\s<>"'`.,;:!?)\]])/g;
    while ((match = urlRegex.exec(line)) !== null) {
      const href = match[1];
      pushSeg(
        match.index,
        match.index + match[0].length,
        <a
          key={`url-${li}-${key++}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-primary break-all"
        >
          {href}
        </a>
      );
    }

    segments.sort((a, b) => a.start - b.start);
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    for (const segment of segments) {
      if (segment.start > lastIndex) parts.push(line.slice(lastIndex, segment.start));
      parts.push(segment.node);
      lastIndex = segment.end;
    }

    if (lastIndex < line.length) parts.push(line.slice(lastIndex));

    return (
      <React.Fragment key={`line-${li}`}>
        {parts.length ? parts : line}
        {li < lines.length - 1 && "\n"}
      </React.Fragment>
    );
  });
}
