import { EventQueue } from '../src/eventQueue';

describe('EventQueue', () => {
    test('preserves a zero delay when adding and rescheduling an object', () => {
        const queue = new EventQueue(2);
        const obj = {
            propagationDelay: 5,
            queueProperties: {
                inQueue: false,
                time: undefined,
                index: undefined,
            },
        };

        queue.time = 10;
        queue.add(obj, 0);
        expect(obj.queueProperties.time).toBe(10);

        queue.time = 20;
        queue.add(obj, 0);
        expect(obj.queueProperties.time).toBe(20);
    });
});
