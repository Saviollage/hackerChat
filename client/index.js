import TerminalController from "./src/terminalController.js";
import Events from 'events'
import CliConfig from "./src/cliConfig.js";
import SocketClient from "./src/socket.js"
import Eventmanager from "./src/eventManager.js";

const [nodePath, filePath, ...commands] = process.argv

const config = CliConfig.parseArguments(commands)

const componentEmitter = new Events()

const socketClient = new SocketClient(config)

await socketClient.initialize()

const eventMenager = new Eventmanager({ componentEmitter, socketClient })
const events = eventMenager.getEvents()
socketClient.attachEvents(events)

const data = {
    roomId: config.room,
    username: config.username
}
eventMenager.joinRoomAndWaitForMessages(data)

const controller = new TerminalController()
await controller.initializeTable(componentEmitter)