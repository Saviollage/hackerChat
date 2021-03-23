import { SocketServer } from "./socket.js";
import Event from 'events'
import Controller from "./controller.js";
import { constants } from "./constants.js";

const eventEmitter = new Event()
const port = process.env.PORT || 8080
const socketServer = new SocketServer({ port })

const server = await socketServer.initialize(eventEmitter)
console.log('Server running at', server.address().port)

const controller = new Controller({ socketServer })

eventEmitter.on(
    constants.events.NEW_USER_CONNECTED,
    controller.onNewConnection.bind(controller)
)