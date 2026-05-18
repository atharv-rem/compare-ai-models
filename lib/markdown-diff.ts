export type BlockType =
  | "heading"
  | "paragraph"
  | "list"
  | "code"
  | "table"
  | "inlineCode";

export type MarkdownBlock = {
  type: BlockType;
  content: string;
  level?: number;
};

export type DiffPart = {
  value: string[];
  added?: boolean;
  removed?: boolean;
};

export type BlockDiff = {
  leftBlock?: MarkdownBlock;
  rightBlock?: MarkdownBlock;
  parts: DiffPart[];
};

export type DisplayPart = {
  value: string[];
  kind: "unchanged" | "added" | "removed";
  replaced?: boolean;
  groupId?: string;
};

type PairedPart =
  | { type: "unchanged"; part: DiffPart }
  | { type: "added"; part: DiffPart }
  | { type: "removed"; part: DiffPart }
  | { type: "replace"; removed: DiffPart; added: DiffPart };

function pairReplacements(parts: DiffPart[]): PairedPart[] {
  const paired: PairedPart[] = [];
  
  for (let i = 0; i < parts.length; i++) {
    const current = parts[i];
    
    if (!current.added && !current.removed) {
      paired.push({ type: "unchanged", part: current });
      continue;
    }

    if (current.removed && i + 1 < parts.length && parts[i + 1].added) {
      paired.push({ type: "replace", removed: current, added: parts[i + 1] });
      i++;
      continue;
    }

    paired.push(
      current.removed
        ? { type: "removed", part: current }
        : { type: "added", part: current }
    );
  }

  return paired;
}

export function toDisplayParts(
  parts: DiffPart[],
  side: "left" | "right"
): DisplayPart[] {
  const grouped = pairReplacements(parts);
  const display: DisplayPart[] = [];
  let replacementIndex = 0;

  for (const item of grouped) {
    if (item.type === "unchanged") {
      display.push({
        value: item.part.value,
        kind: "unchanged",
      });
      continue;
    }

    if (item.type === "removed") {
      if (side === "left") {
        display.push({
          value: item.part.value,
          kind: "removed",
        });
      }
      continue;
    }

    if (item.type === "added") {
      if (side === "right") {
        display.push({
          value: item.part.value,
          kind: "added",
        });
      }
      continue;
    }

    if (item.type === "replace") {
      const groupId = `replace-${replacementIndex++}`;

      if (side === "left") {
        display.push({
          value: item.removed.value,
          kind: "removed",
          replaced: true,
          groupId,
        });
      } else {
        display.push({
          value: item.added.value,
          kind: "added",
          replaced: true,
          groupId,
        });
      }
    }
  }

  return mergeDisplayParts(display);
}

type Chunk = {
  left: string[];
  right: string[];
};

export function normalizeMarkdown(input: string): string {
  return input
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/__(.*?)__/g, "**$1**")
    .trim();
}

export function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
  const lines = normalizeMarkdown(markdown).split("\n");
  const blocks: MarkdownBlock[] = [];

  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    if (/^#{1,6}\s+/.test(line)) {
      const match = line.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        blocks.push({
          type: "heading",
          level: match[1].length,
          content: match[2].trim(),
        });
      }
      i++;
      continue;
    }

    if (/^```/.test(line)) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      blocks.push({
        type: "code",
        content: codeLines.join("\n"),
      });
      continue;
    }

    if (/^\|.*\|$/.test(line)) {
      const tableLines: string[] = [line];
      i++;
      while (i < lines.length && /^\|.*\|$/.test(lines[i])) {
        tableLines.push(lines[i]);
        i++;
      }
      blocks.push({
        type: "table",
        content: tableLines.join("\n"),
      });
      continue;
    }

    if (/^(\s*[-*+]|\s*\d+\.)\s+/.test(line)) {
      const listLines: string[] = [line];
      i++;
      while (i < lines.length && /^(\s*[-*+]|\s*\d+\.)\s+/.test(lines[i])) {
        listLines.push(lines[i]);
        i++;
      }
      blocks.push({
        type: "list",
        content: listLines.join("\n"),
      });
      continue;
    }

    const paragraphLines: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^#{1,6}\s+/.test(lines[i]) &&
      !/^```/.test(lines[i]) &&
      !/^\|.*\|$/.test(lines[i]) &&
      !/^(\s*[-*+]|\s*\d+\.)\s+/.test(lines[i])
    ) {
      paragraphLines.push(lines[i]);
      i++;
    }

    blocks.push({
      type: "paragraph",
      content: paragraphLines.join(" "),
    });
  }

  return blocks;
}

export function tokenize(text: string): string[] {
  const tokens = text.match(
    /`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|\w+(?:'\w+)?|[^\s\w]/g
  );
  return tokens ?? [];
}

function frequencyMap(tokens: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const token of tokens) {
    map.set(token, (map.get(token) ?? 0) + 1);
  }
  return map;
}

function isGoodAnchor(token: string): boolean {
  if (!token.trim()) return false;
  if (token.length < 3) return false;
  if (/^[\W_]+$/.test(token)) return false;
  if (/^\d+$/.test(token)) return false;
  return true;
}

function findNextIndex(tokens: string[], target: string, start: number): number {
  for (let i = start; i < tokens.length; i++) {
    if (tokens[i] === target) return i;
  }
  return -1;
}

export function histogramChunk(left: string[], right: string[]): Chunk[] {
  const leftFreq = frequencyMap(left);
  const rightFreq = frequencyMap(right);

  const anchors: string[] = [];
  const seen = new Set<string>();

  for (const token of left) {
    if (seen.has(token)) continue;
    seen.add(token);

    const lf = leftFreq.get(token) ?? 0;
    const rf = rightFreq.get(token) ?? 0;

    if (isGoodAnchor(token) && lf === 1 && rf === 1) {
      anchors.push(token);
    }
  }

  if (anchors.length === 0) {
    return [{ left, right }];
  }

  const chunks: Chunk[] = [];
  let leftStart = 0;
  let rightStart = 0;
  let lastLeft = 0;
  let lastRight = 0;

  for (const anchor of anchors) {
    const leftIndex = findNextIndex(left, anchor, lastLeft);
    const rightIndex = findNextIndex(right, anchor, lastRight);

    if (leftIndex === -1 || rightIndex === -1) continue;

    const beforeLeft = left.slice(leftStart, leftIndex);
    const beforeRight = right.slice(rightStart, rightIndex);

    if (beforeLeft.length || beforeRight.length) {
      chunks.push({
        left: beforeLeft,
        right: beforeRight,
      });
    }

    chunks.push({
      left: [anchor],
      right: [anchor],
    });

    leftStart = leftIndex + 1;
    rightStart = rightIndex + 1;
    lastLeft = leftStart;
    lastRight = rightStart;
  }

  const tailLeft = left.slice(leftStart);
  const tailRight = right.slice(rightStart);

  if (tailLeft.length || tailRight.length) {
    chunks.push({
      left: tailLeft,
      right: tailRight,
    });
  }

  return chunks;
}

export function myersDiff(a: string[], b: string[]): DiffPart[] {
  const n = a.length;
  const m = b.length;
  const max = n + m;
  const offset = max;
  const trace: number[][] = [];
  const v = new Array(2 * max + 1).fill(0);

  for (let d = 0; d <= max; d++) {
    trace.push(v.slice());

    for (let k = -d; k <= d; k += 2) {
      const index = offset + k;

      let x: number;
      if (k === -d || (k !== d && v[index - 1] < v[index + 1])) {
        x = v[index + 1];
      } else {
        x = v[index - 1] + 1;
      }

      let y = x - k;

      while (x < n && y < m && a[x] === b[y]) {
        x++;
        y++;
      }

      v[index] = x;

      if (x >= n && y >= m) {
        return backtrack(a, b, trace, d, offset);
      }
    }
  }

  return [];
}

function backtrack(
  a: string[],
  b: string[],
  trace: number[][],
  d: number,
  offset: number
): DiffPart[] {
  const parts: DiffPart[] = [];
  let x = a.length;
  let y = b.length;

  for (let depth = d; depth > 0; depth--) {
    const v = trace[depth];
    const k = x - y;

    let prevK: number;
    if (k === -depth || (k !== depth && v[offset + k - 1] < v[offset + k + 1])) {
      prevK = k + 1;
    } else {
      prevK = k - 1;
    }

    const prevX = v[offset + prevK];
    const prevY = prevX - prevK;

    while (x > prevX && y > prevY) {
      parts.push({ value: [a[x - 1]] });
      x--;
      y--;
    }

    if (depth > 0) {
      if (x === prevX) {
        parts.push({ value: [b[y - 1]], added: true });
        y--;
      } else {
        parts.push({ value: [a[x - 1]], removed: true });
        x--;
      }
    }
  }

  while (x > 0 && y > 0) {
    if (a[x - 1] === b[y - 1]) {
      parts.push({ value: [a[x - 1]] });
      x--;
      y--;
    } else {
      break;
    }
  }

  while (x > 0) {
    parts.push({ value: [a[x - 1]], removed: true });
    x--;
  }

  while (y > 0) {
    parts.push({ value: [b[y - 1]], added: true });
    y--;
  }

  parts.reverse();
  return mergeAdjacent(parts);
}

function mergeAdjacent(parts: DiffPart[]): DiffPart[] {
  const merged: DiffPart[] = [];

  for (const part of parts) {
    const prev = merged[merged.length - 1];

    if (
      prev &&
      prev.added === part.added &&
      prev.removed === part.removed
    ) {
      prev.value.push(...part.value);
    } else {
      merged.push({
        value: [...part.value],
        added: part.added,
        removed: part.removed,
      });
    }
  }

  return merged;
}

function mergeDisplayParts(parts: DisplayPart[]): DisplayPart[] {
  const merged: DisplayPart[] = [];

  for (const part of parts) {
    const prev = merged[merged.length - 1];

    if (
      prev &&
      prev.kind === part.kind &&
      prev.replaced === part.replaced &&
      prev.groupId === part.groupId
    ) {
      prev.value.push(...part.value);
    } else {
      merged.push({
        value: [...part.value],
        kind: part.kind,
        replaced: part.replaced,
        groupId: part.groupId,
      });
    }
  }

  return merged;
}

export function diffTokens(left: string[], right: string[]): DiffPart[] {
  const chunks = histogramChunk(left, right);
  const allParts: DiffPart[] = [];

  for (const chunk of chunks) {
    const parts = myersDiff(chunk.left, chunk.right);
    allParts.push(...parts);
  }

  return mergeAdjacent(allParts);
}

export function diffMarkdown(leftMarkdown: string, rightMarkdown: string): BlockDiff[] {
  const leftBlocks = parseMarkdownBlocks(leftMarkdown);
  const rightBlocks = parseMarkdownBlocks(rightMarkdown);

  const maxBlocks = Math.max(leftBlocks.length, rightBlocks.length);
  const result: BlockDiff[] = [];

  for (let i = 0; i < maxBlocks; i++) {
    const leftBlock = leftBlocks[i];
    const rightBlock = rightBlocks[i];

    if (!leftBlock && rightBlock) {
      result.push({
        rightBlock,
        parts: [{ value: tokenize(rightBlock.content), added: true }],
      });
      continue;
    }

    if (leftBlock && !rightBlock) {
      result.push({
        leftBlock,
        parts: [{ value: tokenize(leftBlock.content), removed: true }],
      });
      continue;
    }

    if (!leftBlock || !rightBlock) continue;

    if (leftBlock.type !== rightBlock.type) {
      result.push({
        leftBlock,
        rightBlock,
        parts: diffTokens(tokenize(leftBlock.content), tokenize(rightBlock.content)),
      });
      continue;
    }

    result.push({
      leftBlock,
      rightBlock,
      parts: diffTokens(tokenize(leftBlock.content), tokenize(rightBlock.content)),
    });
  }

  return result;
}