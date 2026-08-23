const TIMESTAMP_RE = /^(\d{1,3}):(\d{2})(?::(\d{2}))?(?:\.(\d+))?\s+(.+)$/;

function timestampToMs(match) {
  let hours;
  let minutes;
  let seconds;

  if (match[3] !== undefined) {
    hours = Number(match[1]);
    minutes = Number(match[2]);
    seconds = Number(match[3]);
  } else {
    hours = 0;
    minutes = Number(match[1]);
    seconds = Number(match[2]);
  }

  const fraction = match[4] !== undefined ? Number(`0.${match[4]}`) : 0;
  return Math.round(((hours * 60 + minutes) * 60 + seconds + fraction) * 1000);
}

export function parseTranscript(fileText, durationMs = Infinity) {
  const segments = [];

  for (const line of fileText.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    const match = trimmed.match(TIMESTAMP_RE);
    if (!match) {
      continue;
    }

    segments.push({
      text: match[5].trim(),
      offsetMs: timestampToMs(match),
      endMs: 0,
    });
  }

  segments.sort((a, b) => a.offsetMs - b.offsetMs);

  for (let i = 0; i < segments.length; i++) {
    segments[i].endMs = i < segments.length - 1 ? segments[i + 1].offsetMs : durationMs;
  }

  return segments;
}
