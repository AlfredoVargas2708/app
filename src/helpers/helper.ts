export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: readonly K[],
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) result[key] = obj[key];
  }
  return result;
}

export const normalizeSet = (value: string) => {
  return value.includes("-1") ? value : `${value}-1`;
};

export const undoNormalizeSet = (value: string) => {
  return value.replace("-1", "");
};
