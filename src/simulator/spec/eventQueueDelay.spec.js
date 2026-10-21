import { describe, test, expect } from 'vitest';
import { EventQueue } from '../src/eventQueue';

function makeObj(propagationDelay) {
    return {
        queueProperties: { inQueue: false, time: 0, index: 0 },
        propagationDelay,
    };
}

describe('EventQueue scheduling with an explicit delay of 0', () => {
    test('add() must schedule at the literal delay passed in, not fall back to propagationDelay when delay is 0', () => {
        const queue = new EventQueue(10);
        const counterLikeObj = makeObj(10);

        queue.add(counterLikeObj, 0);

        expect(counterLikeObj.queueProperties.time).toBe(0);
    });

    test('control case: add() still falls back to propagationDelay when no delay argument is given', () => {
        const queue = new EventQueue(10);
        const obj = makeObj(10);

        queue.add(obj, undefined);

        expect(obj.queueProperties.time).toBe(10);
    });

    test('control case: a non-zero explicit delay is still honored exactly as before', () => {
        const queue = new EventQueue(10);
        const obj = makeObj(10);

        queue.add(obj, 5);

        expect(obj.queueProperties.time).toBe(5);
    });
});
