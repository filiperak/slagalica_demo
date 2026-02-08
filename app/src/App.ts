import Loby from "./pages/Loby.js";

declare const io: any;

export default class App {

    _ioUrl: string
    _socket: any;

    constructor(ioUrl:string) {

        this._ioUrl = ioUrl;
        this._socket = io(ioUrl);

    }

    init() {
        new Loby(this._socket).init();
    }

}