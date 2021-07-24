export function has(obj: Record<string, unknown>, key: string): boolean {
  try {
    // eslint-disable-next-line no-prototype-builtins
    return obj.hasOwnProperty(key);
  } catch (error) {
    if (error instanceof TypeError) {
      // obj is null or undefined
      return false;
    } else {
      throw error;
    }
  }
}

export function isEmpty(obj: unknown): boolean {
  if (Array.isArray(obj)) {
    return !obj.length;
  } else if (obj instanceof Map || obj instanceof Set) {
    return !obj.size;
  } else if (typeof obj === "object") {
    return !Object.keys(obj as Record<string, unknown>).length;
  } else {
    throw new Error("Attempted isEmpty() on non-container object");
  }
}

export function union<T = unknown>(...arrays: (T[] | unknown)[]): T[] {
  const values = new Set();
  const newArray = [];
  for (const arr of arrays.filter(a => Array.isArray(a))) {
    for (const e of arr as T[]) {
      if (!values.has(e)) {
        newArray.push(e);
        values.add(e);
      }
    }
  }
  return newArray;
}
