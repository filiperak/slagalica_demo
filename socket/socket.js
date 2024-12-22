const handleSocket = (io) => {
    io.on("connection", (socket) => {
        socket.emit(socket.id)
        console.log(socket.id);
        
    })
}

export default handleSocket