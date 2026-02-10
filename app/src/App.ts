import Loby from "./pages/Loby.js";
import { Socket } from "socket.io";
declare const io: any;

export default class App {

    _ioUrl: string
    _socket: Socket;

    constructor(ioUrl:string) {

        this._ioUrl = ioUrl;
        this._socket = io(ioUrl);

    }

    init() {
        new Loby(this._socket).init();
        console.log(this._socket);
        
    }

}