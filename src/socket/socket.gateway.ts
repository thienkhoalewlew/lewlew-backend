import { 
  WebSocketGateway, 
  WebSocketServer, 
  OnGatewayConnection, 
  OnGatewayDisconnect 
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger = new Logger('SocketGateway');
  private userSocketMap: Map<string, Socket> = new Map();

  constructor(private readonly jwtService: JwtService) {}

  onModuleInit() {
    this.logger.log('WebSocket Gateway initialized');
  }
  async handleConnection(client: Socket): Promise<void> {
    try {
      this.logger.log(`Đang xử lý kết nối socket từ client ID: ${client.id}`);
      const token = client.handshake.auth.token;
      
      if (!token) {
        this.logger.error('Không cung cấp token, ngắt kết nối client');
        client.disconnect();
        return;
      }
      
      // Log phần đầu của token để debug (không log toàn bộ vì lý do bảo mật)
      this.logger.log(`Nhận được token: ${token.substring(0, 20)}... (${token.length} ký tự)`);

      let payload;
      try {
        payload = this.jwtService.verify(token);
        this.logger.log(`Decoded payload: ${JSON.stringify(payload)}`);
      } catch (jwtError) {
        this.logger.error(`JWT verification failed: ${jwtError.message}`);
        this.logger.error(`Invalid token: ${token.substring(0, 20)}...`);
        client.disconnect();
        return;
      }      // Kiểm tra cấu trúc payload
      this.logger.log(`Token payload type: ${typeof payload}`);
      this.logger.log(`Token payload keys: ${Object.keys(payload)}`);
      
      // Kiểm tra cả userId và sub (vì AuthService sử dụng sub)
      const userId = payload.userId || payload.sub;
      this.logger.log(`Extracted userId: ${userId}`);

      if (!userId) {
        this.logger.error('Token không hợp lệ, không có userId hoặc sub trong payload');
        this.logger.error(`Payload: ${JSON.stringify(payload)}`);
        client.disconnect();
        return;
      }

      // Lưu trữ kết nối socket với userId
      this.userSocketMap.set(userId, client);
      client.data.userId = userId;

      this.logger.log(`Client kết nối: ${userId}`);
    } catch (error) {
      this.logger.error(`Lỗi kết nối socket: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    const userId = client.data.userId;
    if (userId) {
      this.userSocketMap.delete(userId);
      this.logger.log(`Client disconnected: ${userId}`);
    }
  }

  // Gửi thông báo đến một người dùng cụ thể
  sendNotificationToUser(userId: string, notification: any): void {
    this.logger.log(`🔍 Attempting to send notification to user: ${userId}`);
    this.logger.log(`📋 Connected users: ${Array.from(this.userSocketMap.keys()).join(', ')}`);
    
    const userSocket = this.userSocketMap.get(userId);
    if (userSocket && userSocket.connected) {
      this.logger.log(`✅ Sending notification to connected user: ${userId}`);
      this.logger.log(`📧 Notification data:`, JSON.stringify({
        id: notification._id,
        type: notification.type,
        message: notification.message,
        recipient: notification.recipient
      }));
      userSocket.emit('notification', notification);
    } else {
      this.logger.warn(`❌ User not connected or socket not found: ${userId}`);
      this.logger.log(`🔌 User socket exists: ${!!userSocket}`);
      this.logger.log(`🟢 Socket connected: ${userSocket?.connected || false}`);
    }
  }
}