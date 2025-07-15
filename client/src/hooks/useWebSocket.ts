import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const connect = () => {
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        // Attempt to reconnect after 3 seconds
        setTimeout(connect, 3000);
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
    };

    const handleWebSocketMessage = (message: WebSocketMessage) => {
      switch (message.type) {
        case 'odds_update':
          // Invalidate odds-related queries
          queryClient.invalidateQueries({ queryKey: ['/api/odds'] });
          queryClient.invalidateQueries({ queryKey: ['/api/games'] });
          break;
          
        case 'new_recommendation':
          // Invalidate recommendations queries
          queryClient.invalidateQueries({ queryKey: ['/api/recommendations'] });
          break;
          
        case 'game_status_update':
          // Invalidate games queries
          queryClient.invalidateQueries({ queryKey: ['/api/games'] });
          break;
          
        case 'model_metrics_update':
          // Invalidate metrics queries
          queryClient.invalidateQueries({ queryKey: ['/api/metrics'] });
          break;
          
        case 'connection':
          console.log('WebSocket connection confirmed:', message.data.message);
          break;
          
        default:
          console.log('Unknown WebSocket message type:', message.type);
      }
    };

    connect();

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [queryClient]);

  const sendMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  return {
    isConnected,
    sendMessage,
  };
}
