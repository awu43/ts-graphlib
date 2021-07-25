// eslint-disable-next-line import/prefer-default-export
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
