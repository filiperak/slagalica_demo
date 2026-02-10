export default class SocketDriver {
    private _socket: any;
    constructor(ioUrl: string) {
        this._socket = (window as any).io(ioUrl);
    }
    on(event: string, cb: (...args: any[]) => void) {
        this._socket.on(event, cb);
    }
    off(event: string, cb?: (...args: any[]) => void) {
        if (typeof cb === "function") this._socket.off(event, cb);
        else this._socket.off(event);
    }
    once(event: string, cb: (...args: any[]) => void) {
        this._socket.once(event, cb);
    }
    emit(event: string, payload?: any) {
        this._socket.emit(event, payload);
    }
    hasListeners(event: string) {
        return typeof this._socket.hasListeners === "function"
            ? this._socket.hasListeners(event)
            : false;
    }
    get raw() {
        return this._socket;
    }
}
