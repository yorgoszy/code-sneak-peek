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

    const labelRegex = new RegExp(
      `(Κόκκιν\\w*[^:\\n]{0,25}?:|Red[^:\\n]{0,25}?:|Μπλε[^:\\n]{0,25}?:|Blue[^:\\n]{0,25}?:)\\s*(${NAME})${SIDE_META}`,
      "giu"
    );
    while ((match = labelRegex.exec(line)) !== null) {
      const toneStyle = /κόκκιν|red/i.test(match[1]) ? RED_STYLE : BLUE_STYLE;
      pushSeg(
        match.index,
        match.index + match[0].length,
        <React.Fragment key={`lbl-${li}-${key++}`}>
          {match[1]}{" "}
          <span style={toneStyle}>{match[2]}</span>
          {match[3] || ""}
        </React.Fragment>
      );
    }

    const vsRegex = new RegExp(
      `(${NAME})${SIDE_META}\\s*(vs\\.?|VS|κατά|—|–|\\||-)\\s*(🔵|🔴)?\\s*(${NAME})${SIDE_META}`,
      "gu"
    );
    while ((match = vsRegex.exec(line)) !== null) {
      if (!match[1] || !match[4]) continue;
      pushSeg(
        match.index,
        match.index + match[0].length,
        <React.Fragment key={`vs-${li}-${key++}`}>
          <span style={RED_STYLE}>{match[1].trim()}</span>
          {" "}{match[2] || ""}{" "}
          {match[3] ? `${match[3]} ` : ""}
          <span style={BLUE_STYLE}>{match[4].trim()}</span>
          {match[5] || ""}
        </React.Fragment>
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
