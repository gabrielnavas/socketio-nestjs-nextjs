import { Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface Message {
  id: string
  nameFrom: string
  nameTo: string
  text: string
  isPrivate: boolean
}

@WebSocketGateway({
  cors: {
    origin: '*'
  }
})
export class AppGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server

  private logger: Logger = new Logger('AppGateway')

  private clients: { name: string, client: Socket }[] = []

  @SubscribeMessage('messageToAll')
  handleMessage(client: Socket, payload: Message): void {
    this.server.emit('messageToAll', payload, client.id)
  }
  
  @SubscribeMessage('messageTo')
  sendMessageTo(client: Socket, payload: Message): void {
    const personTo = this.clients.find((client) => client.name === payload.nameTo)
    if (personTo) {
      personTo.client.emit('messageTo', payload);
      this.logger.log(`Client ${payload.nameFrom} send message to ${payload.nameTo}: ${payload.text}`)
    }
  }

  @SubscribeMessage('connectName')
  connectName(client: Socket, name: string): void {
    console.log(name);
    this.clients.push({ name, client });
    this.server.emit('countOnline', this.clients.length)
    this.server.emit('addPersons', this.clients.map(c => c.name))
    client.emit('enableOnline')
    this.logger.log(`Client connected: ${client.id}`)
  }


  afterInit(server: Server) {
    this.logger.log('Init')
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.server.emit('countOnline', this.clients.length)
    this.server.emit('addPersons', this.clients.map(c => c.name))
    this.logger.log(`Client connected: ${client.id}`)
  }

  handleDisconnect(client: Socket) {
    const clientFind = this.clients.find(c => c.client.id === client.id)
    if (clientFind) {
      this.clients = this.clients.filter(c => c.client.id !== clientFind.client.id)
      this.server.emit('countOnline', this.clients.length)
      this.server.emit('removePerson', clientFind.name)
      this.logger.log(`Client disconncted: ${client.id}`)
    }
  }
}
