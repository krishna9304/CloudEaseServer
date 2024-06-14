import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSocketMap = new Map<string, string>();

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.removeUserSocket(client.id);
  }

  @SubscribeMessage('login')
  handleLogin(
    @MessageBody('username') username: string,
    @ConnectedSocket() client: Socket,
  ): void {
    this.userSocketMap.set(username, client.id);
    console.log(`User ${username} logged in with socket ID ${client.id}`);
  }

  @SubscribeMessage('logout')
  handleLogout(@MessageBody() username: string): void {
    const socketId = this.userSocketMap.get(username);
    if (socketId) {
      this.userSocketMap.delete(username);
      console.log(
        `User ${username} logged out and socket ID ${socketId} removed`,
      );
    }
  }

  @SubscribeMessage('events')
  handleMessage(
    @MessageBody() message: { username: string; event: string; data: any },
  ): void {
    const socketId = this.userSocketMap.get(message.username);
    if (socketId) {
      this.server.to(socketId).emit(message.event, message.data);
    }
  }

  sendMessage(username: string, event: string, message: any) {
    const socketId = this.userSocketMap.get(username);
    if (socketId) {
      this.server.to(socketId).emit(event, message);
    }
  }

  private removeUserSocket(socketId: string): void {
    for (const [username, id] of this.userSocketMap.entries()) {
      if (id === socketId) {
        this.userSocketMap.delete(username);
        console.log(`Socket ID ${socketId} for user ${username} removed`);
        break;
      }
    }
  }
}
