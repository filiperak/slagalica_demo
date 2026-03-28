import { Store, GameState } from '../../app/src/Store';

describe('Store', () => {
    let store: Store;

    beforeEach(() => {
        store = new Store();
    });

    test('getState__ returns null initially', () => {
        expect(store.getState__()).toBeNull();
    });

    test('setState__ updates the state', () => {
        const state = { gameId: 'g1' } as GameState;
        store.setState__(state);
        expect(store.getState__()).toBe(state);
    });

    test('setState__ notifies all subscribers', () => {
        const listenerA = vi.fn();
        const listenerB = vi.fn();
        store.subscribe(listenerA);
        store.subscribe(listenerB);

        const state = { gameId: 'g2' } as GameState;
        store.setState__(state);

        expect(listenerA).toHaveBeenCalledOnce();
        expect(listenerA).toHaveBeenCalledWith(state);
        expect(listenerB).toHaveBeenCalledOnce();
        expect(listenerB).toHaveBeenCalledWith(state);
    });

    test('subscribe returns a working unsubscribe function', () => {
        const listener = vi.fn();
        const unsub = store.subscribe(listener);

        unsub();
        store.setState__({ gameId: 'g3' } as GameState);

        expect(listener).not.toHaveBeenCalled();
    });

    test('unsubscribing one listener does not affect others', () => {
        const listenerA = vi.fn();
        const listenerB = vi.fn();
        const unsubA = store.subscribe(listenerA);
        store.subscribe(listenerB);

        unsubA();
        store.setState__({ gameId: 'g4' } as GameState);

        expect(listenerA).not.toHaveBeenCalled();
        expect(listenerB).toHaveBeenCalledOnce();
    });
});
