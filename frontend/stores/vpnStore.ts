import { create } from 'zustand';
import axios from 'axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

interface ProxyServer {
  id: string;
  name: string;
  country: string;
  country_code: string;
  city: string;
  proxy_type: 'http' | 'https' | 'socks5' | 'openvpn' | 'wireguard';
  host: string;
  port: number;
  is_premium: boolean;
  is_online: boolean;
  load_percentage: number;
  ping_ms: number;
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'disconnecting';

interface VPNState {
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  selectedServer: ProxyServer | null;
  servers: ProxyServer[];
  isLoadingServers: boolean;
  connect: () => void;
  disconnect: () => void;
  selectServer: (server: ProxyServer) => void;
  fetchServers: () => Promise<void>;
}

export const useVPNStore = create<VPNState>((set, get) => ({
  isConnected: false,
  connectionStatus: 'disconnected',
  selectedServer: null,
  servers: [],
  isLoadingServers: false,

  connect: () => {
    const { selectedServer } = get();
    if (!selectedServer) return;

    set({ connectionStatus: 'connecting' });
    
    // Simulate connection process
    setTimeout(() => {
      set({ 
        isConnected: true, 
        connectionStatus: 'connected' 
      });
    }, 2000);
  },

  disconnect: () => {
    set({ connectionStatus: 'disconnecting' });
    
    // Simulate disconnection process
    setTimeout(() => {
      set({ 
        isConnected: false, 
        connectionStatus: 'disconnected' 
      });
    }, 1000);
  },

  selectServer: (server: ProxyServer) => {
    set({ selectedServer: server });
  },

  fetchServers: async () => {
    try {
      set({ isLoadingServers: true });
      
      const response = await axios.get(`${API_BASE_URL}/proxies`);
      const servers = response.data;
      
      set({ 
        servers,
        isLoadingServers: false 
      });

      // Auto-select first server if none selected
      const { selectedServer } = get();
      if (!selectedServer && servers.length > 0) {
        set({ selectedServer: servers[0] });
      }
    } catch (error) {
      console.error('Failed to fetch servers:', error);
      set({ isLoadingServers: false });
    }
  },
}));