import { DefinedMap } from "../defined-map";

interface QueueKey<QK = unknown> {
  key: QK;
  priority: number;
}

/**
 * A min-priority queue data structure. This algorithm is derived from Cormen,
 * et al., "Introduction to Algorithms". The basic idea of a min-priority
 * queue is that you can efficiently (in O(1) time) get the smallest key in
 * the queue. Adding and removing elements takes O(log n) time. A key can
 * have its priority decreased in O(log n) time.
 */
export class PriorityQueue<K = unknown> {
  private _queue: QueueKey<K>[] = [];
  private _keyIndices = new DefinedMap<K, number>();

  /**
   * Returns the number of elements in the queue. Takes `O(1)` time.
   */
  size(): number {
    return this._queue.length;
  }

  /**
   * Returns the keys that are in the queue. Takes `O(n)` time.
   */
  keys(): K[] {
    return this._queue.map(x => x.key);
  }

  /**
   * Returns `true` if **key** is in the queue and `false` if not.
   */
  has(key: K): boolean {
    return this._keyIndices.has(key);
  }

  /**
   * Returns the priority for **key**. If **key** is not present in the queue
   * then this function returns `undefined`. Takes `O(1)` time.
   *
   * @param {Object} key
   */
  priority(key: K): number | undefined {
    const index = this._keyIndices.get(key);
    if (index !== undefined) {
      return this._queue[index].priority;
    }
  }

  /**
   * Returns the key for the minimum element in this queue. If the queue is
   * empty this function throws an Error. Takes `O(1)` time.
   */
  min(): K {
    if (!this.size()) {
      throw new Error("Queue underflow");
    }
    return this._queue[0].key;
  }

  /**
   * Inserts a new key into the priority queue. If the key already exists in
   * the queue this function returns `false`; otherwise it will return `true`.
   * Takes `O(n)` time.
   *
   * @param {Object} key the key to add
   * @param {Number} priority the initial priority for the key
   */
  add(key: K, priority: number): boolean {
    if (!this._keyIndices.has(key)) {
      const index = this._queue.length;
      this._keyIndices.set(key, index);
      this._queue.push({ key, priority });
      this._decrease(index);
      return true;
    }
    return false;
  }

  /**
   * Removes and returns the smallest key in the queue. Takes `O(log n)` time.
   */
  removeMin(): K {
    this._swap(0, this._queue.length - 1);
    const min = this._queue.pop() as QueueKey<K>;
    this._keyIndices.delete(min.key);
    this._heapify(0);
    return min.key;
  }

  /**
   * Decreases the priority for **key** to **priority**. If the new priority is
   * greater than the previous priority, this function will throw an Error.
   *
   * @param {Object} key the key for which to raise priority
   * @param {Number} priority the new priority for the key
   */
  decrease(key: K, priority: number): void {
    const index = this._keyIndices.definedGet(key);
    if (priority > this._queue[index].priority) {
      throw new Error(
        `New priority is greater than current priority. QueueKey: ${key} Old: ${this._queue[index].priority} New: ${priority}`
      );
    }
    this._queue[index].priority = priority;
    this._decrease(index);
  }

  private _heapify(i: number): void {
    const arr = this._queue;
    const l = 2 * i;
    const r = l + 1;
    let largest = i;
    if (l < arr.length) {
      largest = arr[l].priority < arr[largest].priority ? l : largest;
      if (r < arr.length) {
        largest = arr[r].priority < arr[largest].priority ? r : largest;
      }
      if (largest !== i) {
        this._swap(i, largest);
        this._heapify(largest);
      }
    }
  }

  private _decrease(index_: number): void {
    let index = index_;
    const { priority } = this._queue[index];
    let parent;
    while (index !== 0) {
      // eslint-disable-next-line no-bitwise
      parent = index >> 1;
      if (this._queue[parent].priority < priority) {
        break;
      }
      this._swap(index, parent);
      index = parent;
    }
  }

  private _swap(i: number, j: number): void {
    const queue = this._queue;
    [queue[i], queue[j]] = [queue[j], queue[i]];
    this._keyIndices.set(queue[i].key, i);
    this._keyIndices.set(queue[j].key, j);
  }
}
