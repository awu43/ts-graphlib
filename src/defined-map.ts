export default class DefinedMap<K, V> extends Map<K, V> {
  // Use this when you're sure the key exists
  definedGet(key: K): V {
    return this.get(key) as V;
  }
}
