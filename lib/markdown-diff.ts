export type DiffToken = {
  key: string;
  text: string;
  leading: string;
};

export type DiffPart = {
  kind: "unchanged" | "added" | "removed";
  left: DiffToken[];
  right: DiffToken[];
};

export type DisplayPart = {
  tokens: DiffToken[];
  kind: "unchanged" | "added" | "removed";
  replaced?: boolean;
  groupId?: string;
  otherTokens?: DiffToken[];
};

type PairedDisplayPart =
  | { type: "unchanged"; part: DiffPart }
  | { type: "added"; part: DiffPart }
  | { type: "removed"; part: DiffPart }
  | { type: "replace"; part: DiffPart; next: DiffPart };

export function normalizeMarkdown(input: string): string {
  return input
    .replace(/\r\n/g, "\n")
    .replace(/\u00A0/g, " ")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 0)
    .join("\n")
    .trim();
}

function normalizeTokenText(text: string): string {
  return text.trim().toLowerCase();
}

export function tokenize(content: string): DiffToken[] {
  const tokens: DiffToken[] = [];
  const source = content.replace(/\r\n/g, "\n");
  let i = 0;

  while (i < source.length) {
    let leading = "";
    while (i < source.length && /\s/.test(source[i])) {
      leading += source[i];
      i++;
    }

    if (i >= source.length) break;

    let text = source[i];

    if (source[i] === "`") {
      let j = i + 1;
      while (j < source.length && source[j] !== "`") {
        j++;
      }
      text = source.slice(i, Math.min(j + 1, source.length));
      i = Math.min(j + 1, source.length);
    } else if (/[A-Za-z0-9]/.test(source[i])) {
      let j = i + 1;
      while (j < source.length && /[A-Za-z0-9'_-]/.test(source[j])) {
        j++;
      }
      text = source.slice(i, j);
      i = j;
    } else {
      i++;
    }

    tokens.push({
      text,
      leading,
      key: normalizeTokenText(text) || text,
    });
  }

  return tokens;
}

export function myersDiff(leftTokens: DiffToken[], rightTokens: DiffToken[]): DiffPart[] {
  const a = leftTokens.map((token) => token.key);
  const b = rightTokens.map((token) => token.key);
  const n = a.length;
  const m = b.length;
  const max = n + m;
  const offset = max;
  const trace: number[][] = [];
  const v = new Array<number>(2 * max + 1).fill(0);

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
        return backtrackDiff(leftTokens, rightTokens, trace, d, offset);
      }
    }
  }

  return [];
}

function backtrackDiff(
  leftTokens: DiffToken[],
  rightTokens: DiffToken[],
  trace: number[][],
  depth: number,
  offset: number
): DiffPart[] {
  const parts: DiffPart[] = [];
  let x = leftTokens.length;
  let y = rightTokens.length;

  for (let d = depth; d > 0; d--) {
    const v = trace[d];
    const k = x - y;

    let prevK: number;
    if (k === -d || (k !== d && v[offset + k - 1] < v[offset + k + 1])) {
      prevK = k + 1;
    } else {
      prevK = k - 1;
    }

    const prevX = v[offset + prevK];
    const prevY = prevX - prevK;

    while (x > prevX && y > prevY) {
      parts.push({
        kind: "unchanged",
        left: [leftTokens[x - 1]],
        right: [rightTokens[y - 1]],
      });
      x--;
      y--;
    }

    if (x === prevX) {
      parts.push({
        kind: "added",
        left: [],
        right: [rightTokens[y - 1]],
      });
      y--;
    } else {
      parts.push({
        kind: "removed",
        left: [leftTokens[x - 1]],
        right: [],
      });
      x--;
    }
  }

  while (x > 0 && y > 0) {
    if (leftTokens[x - 1].key !== rightTokens[y - 1].key) {
      break;
    }

    parts.push({
      kind: "unchanged",
      left: [leftTokens[x - 1]],
      right: [rightTokens[y - 1]],
    });
    x--;
    y--;
  }

  while (x > 0) {
    parts.push({
      kind: "removed",
      left: [leftTokens[x - 1]],
      right: [],
    });
    x--;
  }

  while (y > 0) {
    parts.push({
      kind: "added",
      left: [],
      right: [rightTokens[y - 1]],
    });
    y--;
  }

  parts.reverse();
  return mergeDiffParts(parts);
}

function mergeDiffParts(parts: DiffPart[]): DiffPart[] {
  const merged: DiffPart[] = [];

  for (const part of parts) {
    const previous = merged[merged.length - 1];

    if (previous && previous.kind === part.kind) {
      previous.left.push(...part.left);
      previous.right.push(...part.right);
    } else {
      merged.push({
        kind: part.kind,
        left: [...part.left],
        right: [...part.right],
      });
    }
  }

  return merged;
}

function pairReplacements(parts: DiffPart[]): PairedDisplayPart[] {
  const paired: PairedDisplayPart[] = [];

  for (let i = 0; i < parts.length; i++) {
    const current = parts[i];
    const next = parts[i + 1];

    if (
      current.kind === "removed" &&
      next?.kind === "added" &&
      current.left.length > 0 &&
      next.right.length > 0
    ) {
      paired.push({
        type: "replace",
        part: current,
        next,
      });
      i++;
      continue;
    }

    if (current.kind === "unchanged") {
      paired.push({ type: "unchanged", part: current });
    } else if (current.kind === "removed") {
      paired.push({ type: "removed", part: current });
    } else {
      paired.push({ type: "added", part: current });
    }
  }

  return paired;
}

function mergeDisplayParts(parts: DisplayPart[]): DisplayPart[] {
  const merged: DisplayPart[] = [];

  for (const part of parts) {
    const previous = merged[merged.length - 1];

    if (
      previous &&
      previous.kind === part.kind &&
      previous.replaced === part.replaced &&
      previous.groupId === part.groupId &&
      previous.otherTokens === part.otherTokens
    ) {
      previous.tokens.push(...part.tokens);
    } else {
      merged.push({
        tokens: [...part.tokens],
        kind: part.kind,
        replaced: part.replaced,
        groupId: part.groupId,
        otherTokens: part.otherTokens ? [...part.otherTokens] : undefined,
      });
    }
  }

  return merged;
}

export function toDisplayParts(parts: DiffPart[], side: "left" | "right"): DisplayPart[] {
  const grouped = pairReplacements(parts);
  const display: DisplayPart[] = [];
  let replacementIndex = 0;

  for (const item of grouped) {
    if (item.type === "unchanged") {
      display.push({
        tokens: side === "left" ? item.part.left : item.part.right,
        kind: "unchanged",
      });
      continue;
    }

    if (item.type === "removed") {
      if (side === "left") {
        display.push({
          tokens: item.part.left,
          kind: "removed",
        });
      }
      continue;
    }

    if (item.type === "added") {
      if (side === "right") {
        display.push({
          tokens: item.part.right,
          kind: "added",
        });
      }
      continue;
    }

    const groupId = `replace-${replacementIndex++}`;

    if (side === "left") {
      display.push({
        tokens: item.part.left,
        kind: "removed",
        replaced: true,
        groupId,
        otherTokens: item.next.right,
      });
    } else {
      display.push({
        tokens: item.next.right,
        kind: "added",
        replaced: true,
        groupId,
        otherTokens: item.part.left,
      });
    }
  }

  return mergeDisplayParts(display);
}

export function diffText(leftText: string, rightText: string): DiffPart[] {
  const leftTokens = tokenize(normalizeMarkdown(leftText));
  const rightTokens = tokenize(normalizeMarkdown(rightText));
  return myersDiff(leftTokens, rightTokens);
}
