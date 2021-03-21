import axios, { AxiosInstance } from "axios"
import * as dotenv from "dotenv"
import * as http from "http"
import { Server, Socket } from "socket.io"

export default class ShardixServer {
  minShardsPerWorker: number
  maxShardsPerWorker: number | null
  recommendedShards: number | null
  discordAxios: AxiosInstance

  constructor () {
    this.minShardsPerWorker = 1
    this.maxShardsPerWorker = null

    this.recommendedShards = null
    
    this.discordAxios = axios.create({
      baseURL: 'https://discord.com/api/v8',
      headers: {
        authorization: `Bot ${process.env.DISCORD_TOKEN}`
      }
    })
  }

  fetchGatewayData () {
    console.log('Fetching gateway data')
    return this.discordAxios.get('/gateway/bot').then(res => res.data).then(res => {
      console.log(`Gateway recommends ${res.shards} shard(s)`)
      this.recommendedShards = res.shards
    })
  }
}