import axios from "axios"
import * as dotenv from "dotenv"
import * as http from "http"
import { stat } from "node:fs"
import { Server, Socket } from "socket.io"
import ShardixServer from "./ShardixServer"
import Shardix from "./ShardixServer"

dotenv.config()

if (!process.env.DISCORD_TOKEN) {
  console.error('No token was provided, exiting...')
  process.exit(1)
}

const shardix = new ShardixServer()

shardix.fetchGatewayData()

const httpServer = http.createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

function chunk (arr: Array<any>, chunkSize: number) {
  if (chunkSize <= 0) throw "Invalid chunk size";
  var R = [];
  for (var i=0,len=arr.length; i<len; i+=chunkSize)
    R.push(arr.slice(i,i+chunkSize));
  return R;
}

setTimeout(async () => {
  const shardCount = 15
  const shards = Array.from(Array(shardCount).keys())
  const division = chunk(shards, 5)

  const sockets = await io.sockets.fetchSockets()
  sockets.length
  
  sockets.forEach((socket, index) => {
    console.log(`[${socket.id}] Sending shard count to worker - ${shardCount}`)
    socket.emit("shardCount", shardCount)
  
    console.log(`[${socket.id}] Sending shard IDs - ${division[index]}`)
    socket.emit("shards", JSON.stringify(division[index]))
  
    console.log(`[${socket.id}] Telling worker to login to Discord`)
    socket.emit("login")
  })
}, 15 * 1000)

io.on("connection", (socket: Socket) => {
  console.log(`Worker connected: ${socket.id}`)

  socket.on("disconnect", (reason) => {
    console.log(`[${socket.id}] Disconnected: ${reason}`)
  })

  socket.on("shardDisconnect", id => {
    console.log(`[${socket.id}] shardDisconnect ${id}`)
  })

  socket.on("shardError", id => {
    console.log(`[${socket.id}] shardError ${id}`)
  })

  socket.on("shardReady", id => {
    console.log(`[${socket.id}] shardReady ${id}`)
  })

  socket.on("shardReconnecting", id => {
    console.log(`[${socket.id}] shardReconnecting ${id}`)
  })

  socket.on("shardResume", id => {
    console.log(`[${socket.id}] shardResume ${id}`)
  })

  socket.on("hello", status => {
    console.log(`Worker ${socket.id} said hello: ${status}`)
  })
})

httpServer.listen(3000)

httpServer.on("listening", () => {
  console.log('Waiting for workers to connect...')
})