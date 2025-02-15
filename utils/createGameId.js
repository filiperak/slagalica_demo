export const createGameId = () => {
    return  gid() +  "-" + gid() + "-"  + gid()
}

const gid = () => {
    return Math.floor(Math.random() * 900) + 99
}

export const createGameIdSingleGame = () => {
    return "sg" + gid() +  "-" + gid() + "-"  + gid()

}