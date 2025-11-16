/**
 * EventQueue implements a priority queue where events are ordered by time.
 * This is a simple O(n²) shifting implementation used by the CircuitVerse simulator.
 * @category eventQueue
 */

export interface QueueObject {
    queueProperties: {
        inQueue: boolean;
        time: number;
        index: number;
    };
    propagationDelay: number;
}

export class EventQueue {
    private size: number;
    private queue: QueueObject[];
    private frontIndex: number;
    time: number;

    constructor(size: number) {
        this.size = size;
        this.queue = new Array(size);
        this.frontIndex = 0;
        this.time = 0;
    }

    /**
     * Insert an object with a delay (or the object's default propagation delay).
     * This maintains the queue sorted by event time.
     */
    add(obj: QueueObject, delay: number) {
        const eventTime = this.time + (delay ?? obj.propagationDelay);

        if (obj.queueProperties.inQueue) {
            // Update the time and re-order
            obj.queueProperties.time = eventTime;
            this.reorder(obj);
            return;
        }

        if (this.frontIndex === this.size) {
            throw new Error("EventQueue size exceeded");
        }

        // Insert at end
        this.queue[this.frontIndex] = obj;
        obj.queueProperties.time = eventTime;
        obj.queueProperties.index = this.frontIndex;
        obj.queueProperties.inQueue = true;
        this.frontIndex++;

        this.shiftUp(obj);
    }

    /**
     * Insert an object at current time without delay.
     */
    addImmediate(obj: QueueObject) {
        if (this.frontIndex === this.size) {
            throw new Error("EventQueue size exceeded");
        }

        this.queue[this.frontIndex] = obj;
        obj.queueProperties.time = this.time;
        obj.queueProperties.index = this.frontIndex;
        obj.queueProperties.inQueue = true;
        this.frontIndex++;
    }

    /**
     * Ensure correct ordering when an in-queue object's time changes.
     */
    private reorder(obj: QueueObject) {
        this.shiftUp(obj);
        this.shiftDown(obj);
    }

    /**
     * Move object earlier in queue if its time increased.
     */
    private shiftUp(obj: QueueObject) {
        let i = obj.queueProperties.index;
        while (
            i > 0 &&
            obj.queueProperties.time > this.queue[i - 1].queueProperties.time
        ) {
            this.swap(i, i - 1);
            i--;
        }
    }

    /**
     * Move object later in queue if its time decreased.
     */
    private shiftDown(obj: QueueObject) {
        let i = obj.queueProperties.index;
        while (
            i < this.frontIndex - 1 &&
            obj.queueProperties.time < this.queue[i + 1].queueProperties.time
        ) {
            this.swap(i, i + 1);
            i++;
        }
    }

    /**
     * Swap two queue positions and update indices.
     */
    private swap(i: number, j: number) {
        const obj1 = this.queue[i];
        const obj2 = this.queue[j];

        obj1.queueProperties.index = j;
        obj2.queueProperties.index = i;

        this.queue[i] = obj2;
        this.queue[j] = obj1;
    }

    /**
     * Pop the next event (highest time).
     */
    pop() {
        if (this.isEmpty()) {
            throw new Error("Queue Empty");
        }

        this.frontIndex--;
        const obj = this.queue[this.frontIndex];

        this.time = obj.queueProperties.time;
        obj.queueProperties.inQueue = false;

        return obj;
    }

    /**
     * Reset entire queue.
     */
    reset() {
        for (let i = 0; i < this.frontIndex; i++) {
            this.queue[i].queueProperties.inQueue = false;
        }
        this.time = 0;
        this.frontIndex = 0;
    }

    /**
     * Whether queue contains zero events.
     */
    isEmpty() {
        return this.frontIndex === 0;
    }
}
