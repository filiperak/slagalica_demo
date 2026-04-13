import { Store, GameState } from '../../app/src/Store';

describe('Store', () => {
    let store: Store;

    beforeEach(() => {
        store = new Store();
    });

    test('getState returns null initially', () => {
        expect(store.getState()).toBeNull();
    });

    test('setState updates the state', () => {
        const state = { gameId: 'g1' } as GameState;
        store.setState(state);
        expect(store.getState()).toBe(state);
    });

    test('setState notifies all subscribers', () => {
        const listenerA = vi.fn();
        const listenerB = vi.fn();
        store.subscribe(listenerA);
        store.subscribe(listenerB);

        const state = { gameId: 'g2' } as GameState;
        store.setState(state);

        expect(listenerA).toHaveBeenCalledOnce();
        expect(listenerA).toHaveBeenCalledWith(state);
        expect(listenerB).toHaveBeenCalledOnce();
        expect(listenerB).toHaveBeenCalledWith(state);
    });

    test('subscribe returns a working unsubscribe function', () => {
        const listener = vi.fn();
        const unsub = store.subscribe(listener);

        unsub();
        store.setState({ gameId: 'g3' } as GameState);

        expect(listener).not.toHaveBeenCalled();
    });

    test('unsubscribing one listener does not affect others', () => {
        const listenerA = vi.fn();
        const listenerB = vi.fn();
        const unsubA = store.subscribe(listenerA);
        store.subscribe(listenerB);

        unsubA();
        store.setState({ gameId: 'g4' } as GameState);

        expect(listenerA).not.toHaveBeenCalled();
        expect(listenerB).toHaveBeenCalledOnce();
    });
});
