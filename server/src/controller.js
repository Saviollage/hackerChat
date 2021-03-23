export default class Controller {

    #users = new Map()

    constructor({ socketServer }) {
        this.socketServer = socketServer
    }

    onNewConnection(socket) {
        const { id } = socket
        console.log('Connection stablished with', id)
        const userData = { id, socket }
        
        this.#updateGlobalUserData(id, userData)

        socket.on('data', this.#onSocketData(id))
        socket.on('error', this.#onSocketError(id))
        socket.on('end', this.#onSocketClosed(id))
    }

    #onSocketData(id) {
        return data => {
            console.log('data', data.toString())
        }
    }

    #onSocketError(id) {
        return data => {
            console.log('error', data.toString())
        }
    }

    #onSocketClosed(id) {
        return data => {
            console.log('closed', data.toString())
        }
    }

    #updateGlobalUserData(socketId, userData) {
        const users = this.#users
        const user = users.get(socketId) ?? {}

        const updateUserData = {
            ...user,
            ...userData
        }

        users.set(socketId, updateUserData)
        return users.get(socketId)
    }
}