function pad(value: number) {
  return String(value).padStart(2, "0");
}

function asDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new RangeError("Cannot format an invalid date.");
  return date;
}

export function formatDate(value: Date | string) {
  const date = asDate(value);
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${String(date.getFullYear()).padStart(4, "0")}`;
}

export function formatDateTime(value: Date | string) {
  const date = asDate(value);
  return `${formatDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
