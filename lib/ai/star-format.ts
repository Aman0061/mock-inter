export type StarBulletOutput = {
  text: string;
  metric: string;
};

const METRIC_REGEX =
  /\b\d+(?:[.,]\d+)?\s?(?:%|пп|x|раз(?:а)?|k|K|m|M|млн|тыс|чел(?:овек)?|дн(?:ей|я)|недел(?:и|ь)?|месяц(?:а|ев)?|час(?:а|ов)?|₽|\$|сом(?:ов)?)\b/i;

const ACTION_MARKERS = [
  "запуст",
  "внедр",
  "оптимиз",
  "разработ",
  "сформир",
  "постро",
  "лид",
  "управлял",
  "провел",
  "улучш",
  "автоматиз",
  "спроект",
  "реализ",
  "launch",
  "build",
  "implement",
  "designed",
];

const RESULT_MARKERS = [
  "увелич",
  "рост",
  "сниз",
  "сократ",
  "повыс",
  "конверс",
  "retention",
  "выруч",
  "эконом",
  "time-to-market",
  "nps",
  "gmv",
  "churn",
  "mau",
  "dau",
];

function cleanClause(value: string): string {
  return value
    .replace(/^[\s•\-–—\d.)]+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[;,.]+$/g, "");
}

function splitIntoClauses(text: string): string[] {
  return text
    .split(/\n|[.;](?=\s|$)/g)
    .map(cleanClause)
    .filter(Boolean);
}

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function hasMarker(text: string, markers: string[]): boolean {
  const lower = text.toLowerCase();
  return markers.some((marker) => lower.includes(marker));
}

export function extractMetricFromText(text: string): string {
  const match = text.match(METRIC_REGEX);
  return match?.[0] ?? "";
}

export function formatStarBullet(rawInput: string): StarBulletOutput {
  const normalized = cleanClause(rawInput);
  if (!normalized) {
    return { text: "", metric: "" };
  }

  if (
    /S\/?T:/i.test(normalized) &&
    /\bA:/i.test(normalized) &&
    /\bR:/i.test(normalized)
  ) {
    return { text: normalized, metric: extractMetricFromText(normalized) };
  }

  const clauses = splitIntoClauses(normalized);
  const fallbackClause = clauses[0] ?? normalized;

  const action =
    clauses.find((clause) => hasMarker(clause, ACTION_MARKERS)) ??
    fallbackClause;

  const result =
    clauses.find(
      (clause) =>
        clause !== action &&
        (hasMarker(clause, RESULT_MARKERS) || Boolean(extractMetricFromText(clause)))
    ) ?? "";

  const situationTask =
    clauses.find((clause) => clause !== action && clause !== result) ??
    "Работал над ключевой продуктовой задачей";

  const metric = extractMetricFromText(result || action);
  const resolvedResult = result
    ? `R: ${capitalize(result)}.`
    : metric
      ? `R: Получен измеримый эффект (${metric}).`
      : "";

  return {
    text: `S/T: ${capitalize(situationTask)}. A: ${capitalize(action)}.${
      resolvedResult ? ` ${resolvedResult}` : ""
    }`,
    metric,
  };
}
