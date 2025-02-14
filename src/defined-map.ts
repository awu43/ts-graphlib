export class DefinedMap<K, V> extends Map<K, V> {
  /** Use this when you know for sure that the key exists in the Map
   * or assume that is exists and don't want optional chaining to silently
   * resolve a nonexistent key. */
  definedGet(key: K): V {
    return this.get(key) as V;
  }
}
