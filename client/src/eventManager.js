import { constants } from "./constants.js"

export default class Eventmanager {
    #allUsers = new Map()
    constructor({ componentEmitter, socketClient }) {
        this.componentEmitter = componentEmitter
        this.socketClient = socketClient
    }

    joinRoomAndWaitForMessages(data) {
        this.socketClient.sendMessage(constants.events.socket.JOIN_ROOM, data)
        this.componentEmitter.on(constants.events.app.MESSAGE_SENT, msg => {
            this.socketClient.sendMessage(constants.events.socket.MESSAGE, msg)
        })
    }

    updateUsers(users) {
        const connectedUsers = users
        connectedUsers.forEach(({ id, username }) => this.#allUsers.set(id, username))
        this.#updateUsersComponent()
    }

    newUserConnected(message) {
        const user = message
        this.#allUsers.set(user.id, user.username)
        this.#updateUsersComponent()
        this.#updateActivityLogComponent(`${user.username} joined!`)
    }

    userDisconnected(user) {
        const { username, id } = user
        this.#allUsers.delete(id)
        this.#updateActivityLogComponent(`${username} left!`)
        this.#updateUsersComponent()
    }

    message(message) {
        this.#emitComponentUpdate(
            constants.events.app.MESSAGE_RECEIVED,
            message
        )
    }

    #emitComponentUpdate(event, message) {
        this.componentEmitter.emit(
            event,
            message
        )
    }

    #updateActivityLogComponent(message) {
        this.#emitComponentUpdate(
            constants.events.app.ACTIVITYLOG_UPDATE,
            message
        )
    }

    #updateUsersComponent() {
        this.#emitComponentUpdate(
            constants.events.app.STATUS_UPDATED,
            Array.from(this.#allUsers.values())
        )
    }

    getEvents() {
        const functions = Reflect.ownKeys(Eventmanager.prototype)
            .filter(fn => fn !== 'constructor')
            .map(name => [name, this[name].bind(this)])

        return new Map(functions)
    }
}