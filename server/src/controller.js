import { constants } from "./constants.js"

export default class Controller {
    #users = new Map()
    #rooms = new Map()

    constructor({ socketServer }) {
        this.socketServer = socketServer
    }

    onNewConnection(socket) {
        const { id } = socket
        console.log('Connection stablished with', id)
        const userData = { id, socket }

        this.#updateGlobalUserData(id, userData)

        socket.on('data', this.#onSocketData(id))
        socket.on('error', this.#onSocketClosed(id))
        socket.on('end', this.#onSocketClosed(id))
    }

    async joinRoom(socketId, data) {
        const userData = data
        console.log(`${userData.username} joined!`, [socketId])
        const user = this.#updateGlobalUserData(socketId, userData)
        const { roomId } = userData
        const users = this.#joinUserOnRoom(roomId, user)
        const currentUsers = Array.from(users.values()).map(({ id, username }) => ({ username, id }))
        this.socketServer.sendMessage(user.socket, constants.events.UPDATE_USERS, currentUsers)

        this.broadcast({
            socketId,
            roomId,
            event: constants.events.NEW_USER_CONNECTED,
            message:
            {
                id: socketId,
                username: userData.username
            }
        })
    }

    broadcast({ socketId, event, message, roomId, includeCurrentSocket = false }) {
        const usersOnRoom = this.#rooms.get(roomId)

        for (const [key, user] of usersOnRoom) {
            if (!includeCurrentSocket && key === socketId) continue;
            this.socketServer.sendMessage(user.socket, event, message)
        }
    }


    message(socketId, data) {
        const { username, roomId } = this.#users.get(socketId)
        this.broadcast({
            roomId,
            socketId,
            event: constants.events.MESSAGE,
            message: { username, message: data },
            includeCurrentSocket: true
        })
    }

    #joinUserOnRoom(roomId, user) {
        const usersOnRoom = this.#rooms.get(roomId) ?? new Map()
        usersOnRoom.set(user.id, user)
        this.#rooms.set(roomId, usersOnRoom)
        return usersOnRoom
    }

    #onSocketData(id) {
        return data => {
            try {
                const { event, message } = JSON.parse(data)
                this[event](id, message)
            }
            catch (error) {
                console.error(`Wrong event format!`, data.toString())
            }
        }
    }

    #logoutUser(id, roomId) {
        this.#users.delete(id)
        const usersOnRoom = this.#rooms.get(roomId)
        usersOnRoom.delete(id)
        this.#rooms.set(roomId, usersOnRoom)
    }

    #onSocketClosed(id) {
        return _ => {
            const { username, roomId } = this.#users.get(id)
            console.log(`User: ${username} disconnected from ${roomId}`)
            this.#logoutUser(id, roomId)
            this.broadcast({
                roomId,
                message: { id, username },
                socketId: id,
                event: constants.events.USER_DISCONNECTED
            })
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