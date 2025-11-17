/**
 * EventQueue implements a priority queue where events are ordered by time.
 * Uses a binary min-heap for O(log n) insertion and removal.
 * @category eventQueue
 */

export interface QueueObject {
    queueProperties: {
        inQueue: boolean;
        time: number;
        index: number; // heap index
    };
    propagationDelay: number;
}

export class EventQueue {
    private heap: QueueObject[] = [];
    time = 0;

    constructor(private size: number) {}

    /**
     * Insert an object with delay. Maintains min-heap by event time.
     */
    add(obj: QueueObject, delay: number) {
        const eventTime = this.time + (delay ?? obj.propagationDelay);
        obj.queueProperties.time = eventTime;

        if (obj.queueProperties.inQueue) {
            // Update time + reposition
            this.heapifyUp(obj.queueProperties.index);
            this.heapifyDown(obj.queueProperties.index);
            return;
        }

        if (this.heap.length === this.size) {
            throw new Error("EventQueue size exceeded");
        }

        obj.queueProperties.index = this.heap.length;
        obj.queueProperties.inQueue = true;
        this.heap.push(obj);
        this.heapifyUp(obj.queueProperties.index);
    }

    /**
     * Insert object at current time.
     */
    addImmediate(obj: QueueObject) {
        this.add(obj, 0);
    }

    /**
     * Pop next event (minimum event time)
     */
    pop() {
        if (this.isEmpty()) throw new Error("Queue Empty");

        const top = this.heap[0];
        const last = this.heap.pop()!;

        if (this.heap.length > 0) {
            this.heap[0] = last;
            last.queueProperties.index = 0;
            this.heapifyDown(0);
        }

        top.queueProperties.inQueue = false;
        this.time = top.queueProperties.time;
        return top;
    }

    /**
     * Whether queue contains zero events.
     */
    isEmpty() {
        return this.heap.length === 0;
    }

    /**
     * Reset entire queue.
     */
    reset() {
        for (const obj of this.heap) obj.queueProperties.inQueue = false;
        this.heap = [];
        this.time = 0;
    }

    // -------------------------------
    //   Heap Utility Functions
    // -------------------------------

    private swap(i: number, j: number) {
        const a = this.heap[i];
        const b = this.heap[j];
        this.heap[i] = b;
        this.heap[j] = a;
        a.queueProperties.index = j;
        b.queueProperties.index = i;
    }

    private heapifyUp(i: number) {
        while (i > 0) {
            const parent = Math.floor((i - 1) / 2);
            if (this.heap[i].queueProperties.time >= this.heap[parent].queueProperties.time) break;
            this.swap(i, parent);
            i = parent;
        }
    }

    private heapifyDown(i: number) {
        const n = this.heap.length;

        while (true) {
            let smallest = i;
            const left = 2 * i + 1;
            const right = 2 * i + 2;

            if (left < n && this.heap[left].queueProperties.time < this.heap[smallest].queueProperties.time) {
                smallest = left;
            }

            if (right < n && this.heap[right].queueProperties.time < this.heap[smallest].queueProperties.time) {
                smallest = right;
            }

            if (smallest === i) break;

            this.swap(i, smallest);
            i = smallest;
        }
    }
}
