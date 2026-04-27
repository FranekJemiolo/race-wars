import { startWebSocket } from "./network/websocket"
import { startTick } from "./engine/tick"
import { log } from "./utils/logger"

log("Starting Race Wars server...")

startWebSocket()
startTick()

log("Server initialized")
