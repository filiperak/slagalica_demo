export class PlayerState{
    constructor(){
        this.players = []
    }

    setPlayers(newPlayers) {
        this.players = newPlayers
    }

    activatePlayer(id,name,game) {
        const player = {id,name,game}
        this.setPlayers([
            ...this.players.filter(player => player.id !== id),
            player
        ])
        return player
    }

    playerLeaves(id){
        this.setPlayers(
            this.players.filter(player => player.id !== id)
        )
    }

    getPlayer(id){
        return this.players.find(player => player.id === id)
    }

    getPlayers(){
        return Array.from(new Set(this.players.map(player => player.game)))
    }

}