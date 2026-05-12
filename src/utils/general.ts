/**
 * Generic function to determine if given value does not equal null or undefined.
 *
 * @param {T | undefined | null} val - Value to check if defined
 * @return {val is T}
 */
export function isDefined<T>(val: T | undefined | null): val is T {
  return val !== undefined && val !== null;
}

/**
 * Function to determine if given input is a record
 * of string keys
 *
 * @param {unknown} item - Value to check
 * @return {item is Record<string, unknown>}
 */
export function isRecord(item: unknown): item is Record<string, unknown> {
  return isDefined(item) && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Given a variable that contains a singular T, an
 * array of  T or is undefined, output an array of T.
 *
 * @param {T[] | T | undefined} input - Unknown quantity of type T
 * @return {T[]} Array of T (empty if invalid inputs)
 */
export function normalizeToArray<T>(input: T[] | T | undefined): T[] {
  if (!isDefined(input)) {
    return [];
  }
  return (Array.isArray(input) ? input : [input]).filter((x) => isDefined(x));
}

/**
 * Generic function to convert a given object to JSON
 * while accounting for circular dependencies and
 * function object values.
 */
// biome-ignore lint/suspicious/noExplicitAny: legacy support
export function safeStringify(obj: any): string {
  const seen = new WeakSet();
  // biome-ignore lint/suspicious/noExplicitAny: legacy support
  const replacer = (_key: string, value: any) => {
    if (!(value !== null && typeof value === 'object')) {
      return value;
    }
    if (seen.has(value)) {
      return '[Circular]';
    }
    seen.add(value);
    // biome-ignore lint/suspicious/noExplicitAny: legacy support
    const newValue: any = Array.isArray(value) ? [] : {};
    for (const [key2, value2] of Object.entries(value)) {
      newValue[key2] = replacer(key2, value2);
    }
    seen.delete(value);
    return newValue;
  };
  return JSON.stringify(obj, replacer);
}
