import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

export class WebSocketService {
  private wss?: WebSocketServer;
  private clients: Set<WebSocket> = new Set();

  initialize(server: Server): void {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws'  // Use specific path to avoid conflicts with Vite
    });
    
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New WebSocket connection established');
      this.clients.add(ws);
      
      // Send welcome message
      this.sendToClient(ws, {
        type: 'connection',
        data: { message: 'Connected to Bet Bot WebSocket' },
        timestamp: Date.now()
      });
      
      ws.on('message', (message: string) => {
        try {
          const parsedMessage = JSON.parse(message);
          this.handleClientMessage(ws, parsedMessage);
        } catch (error) {
          console.error('Invalid WebSocket message:', error);
        }
      });
      
      ws.on('close', () => {
        console.log('WebSocket connection closed');
        this.clients.delete(ws);
      });
      
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });
  }

  private handleClientMessage(ws: WebSocket, message: any): void {
    switch (message.type) {
      case 'ping':
        this.sendToClient(ws, {
          type: 'pong',
          data: { timestamp: Date.now() },
          timestamp: Date.now()
        });
        break;
      
      case 'subscribe':
        // Handle subscription to specific data feeds
        this.sendToClient(ws, {
          type: 'subscribed',
          data: { feed: message.data.feed },
          timestamp: Date.now()
        });
        break;
        
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private sendToClient(ws: WebSocket, message: WebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  broadcast(message: WebSocketMessage): void {
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  broadcastOddsUpdate(gameId: string, odds: any): void {
    this.broadcast({
      type: 'odds_update',
      data: { gameId, odds },
      timestamp: Date.now()
    });
  }

  broadcastNewRecommendation(recommendation: any): void {
    this.broadcast({
      type: 'new_recommendation',
      data: recommendation,
      timestamp: Date.now()
    });
  }

  broadcastGameStatusUpdate(gameId: string, status: string): void {
    this.broadcast({
      type: 'game_status_update',
      data: { gameId, status },
      timestamp: Date.now()
    });
  }

  broadcastModelMetricsUpdate(metrics: any): void {
    this.broadcast({
      type: 'model_metrics_update',
      data: metrics,
      timestamp: Date.now()
    });
  }
}

export const websocketService = new WebSocketService();
