import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useVPNStore } from '../stores/vpnStore';
import { useAuthStore } from '../stores/authStore';

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

export default function ServersScreen() {
  const { 
    servers, 
    selectedServer, 
    isLoadingServers, 
    fetchServers, 
    selectServer 
  } = useVPNStore();
  const { user } = useAuthStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'free' | 'premium'>('all');

  useEffect(() => {
    fetchServers();
  }, []);

  const filteredServers = servers.filter(server => {
    const matchesSearch = server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         server.country.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'free' && !server.is_premium) ||
                         (filterType === 'premium' && server.is_premium);
    
    return matchesSearch && matchesFilter;
  });

  const handleServerSelect = (server: ProxyServer) => {
    if (server.is_premium && user?.subscription_tier === 'free') {
      router.push('/subscription');
      return;
    }
    
    selectServer(server);
    router.back();
  };

  const getProxyTypeIcon = (type: string) => {
    switch (type) {
      case 'https':
        return 'shield-checkmark-outline';
      case 'socks5':
        return 'flash-outline';
      case 'openvpn':
        return 'lock-closed-outline';
      case 'wireguard':
        return 'rocket-outline';
      default:
        return 'globe-outline';
    }
  };

  const getProxyTypeColor = (type: string) => {
    switch (type) {
      case 'https':
        return '#4ECDC4';
      case 'socks5':
        return '#FFD93D';
      case 'openvpn':
        return '#FF6B6B';
      case 'wireguard':
        return '#A8E6CF';
      default:
        return '#95A5A6';
    }
  };

  const getLoadColor = (load: number) => {
    if (load < 30) return '#4ECDC4';
    if (load < 70) return '#FFD93D';
    return '#FF6B6B';
  };

  const renderServerItem = ({ item }: { item: ProxyServer }) => (
    <TouchableOpacity
      style={[
        styles.serverItem,
        selectedServer?.id === item.id && styles.selectedServerItem
      ]}
      onPress={() => handleServerSelect(item)}
    >
      <View style={styles.serverHeader}>
        <View style={styles.serverInfo}>
          <View style={styles.serverNameRow}>
            <Ionicons 
              name={getProxyTypeIcon(item.proxy_type)} 
              size={18} 
              color={getProxyTypeColor(item.proxy_type)} 
            />
            <Text style={styles.serverName}>{item.name}</Text>
            {item.is_premium && (
              <View style={styles.premiumBadge}>
                <Ionicons name="diamond" size={12} color="#FFD93D" />
                <Text style={styles.premiumText}>PRO</Text>
              </View>
            )}
          </View>
          <Text style={styles.serverDetails}>
            {item.proxy_type.toUpperCase()} • {item.city}
          </Text>
        </View>
        
        {selectedServer?.id === item.id && (
          <Ionicons name="checkmark-circle" size={24} color="#4ECDC4" />
        )}
      </View>

      <View style={styles.serverStats}>
        <View style={styles.statItem}>
          <View style={[styles.loadBar, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
            <View 
              style={[
                styles.loadBarFill,
                { 
                  width: `${item.load_percentage}%`,
                  backgroundColor: getLoadColor(item.load_percentage)
                }
              ]} 
            />
          </View>
          <Text style={styles.statLabel}>Yük: {item.load_percentage}%</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.pingValue}>{item.ping_ms}ms</Text>
          <Text style={styles.statLabel}>Ping</Text>
        </View>

        <View style={styles.statusIndicator}>
          <View style={[
            styles.statusDot,
            { backgroundColor: item.is_online ? '#4ECDC4' : '#FF6B6B' }
          ]} />
          <Text style={styles.statusText}>
            {item.is_online ? 'Çevrimiçi' : 'Çevrimdışı'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#4ECDC4" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sunucular</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchServers}>
          <Ionicons name="refresh-outline" size={24} color="#4ECDC4" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#95A5A6" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Sunucu ara..."
          placeholderTextColor="#95A5A6"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filterType === 'all' && styles.activeFilterButton]}
          onPress={() => setFilterType('all')}
        >
          <Text style={[styles.filterButtonText, filterType === 'all' && styles.activeFilterButtonText]}>
            Tümü
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterButton, filterType === 'free' && styles.activeFilterButton]}
          onPress={() => setFilterType('free')}
        >
          <Text style={[styles.filterButtonText, filterType === 'free' && styles.activeFilterButtonText]}>
            Ücretsiz
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterButton, filterType === 'premium' && styles.activeFilterButton]}
          onPress={() => setFilterType('premium')}
        >
          <Ionicons name="diamond" size={14} color={filterType === 'premium' ? '#1A1A2E' : '#95A5A6'} />
          <Text style={[styles.filterButtonText, filterType === 'premium' && styles.activeFilterButtonText]}>
            Premium
          </Text>
        </TouchableOpacity>
      </View>

      {/* Servers List */}
      {isLoadingServers ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4ECDC4" />
          <Text style={styles.loadingText}>Sunucular yükleniyor...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredServers}
          renderItem={renderServerItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.serversList}
          refreshControl={
            <RefreshControl
              refreshing={isLoadingServers}
              onRefresh={fetchServers}
              tintColor="#4ECDC4"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Footer Info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {filteredServers.length} sunucu bulundu
        </Text>
        {user?.subscription_tier === 'free' && (
          <TouchableOpacity 
            style={styles.upgradeButton}
            onPress={() => router.push('/subscription')}
          >
            <Ionicons name="diamond" size={16} color="#FFD93D" />
            <Text style={styles.upgradeButtonText}>Premium'a Geç</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  refreshButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    marginHorizontal: 20,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 45,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
  },
  activeFilterButton: {
    backgroundColor: '#4ECDC4',
  },
  filterButtonText: {
    color: '#95A5A6',
    fontSize: 14,
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: '#1A1A2E',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#95A5A6',
    fontSize: 16,
    marginTop: 10,
  },
  serversList: {
    paddingHorizontal: 20,
  },
  serverItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedServerItem: {
    borderColor: '#4ECDC4',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
  },
  serverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serverInfo: {
    flex: 1,
  },
  serverNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  serverName: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 217, 61, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  premiumText: {
    color: '#FFD93D',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  serverDetails: {
    fontSize: 14,
    color: '#95A5A6',
    marginLeft: 26,
  },
  serverStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
  },
  loadBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
  },
  loadBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#95A5A6',
  },
  pingValue: {
    fontSize: 14,
    color: '#4ECDC4',
    fontWeight: '600',
    marginBottom: 2,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#95A5A6',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerText: {
    color: '#95A5A6',
    fontSize: 14,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 217, 61, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  upgradeButtonText: {
    color: '#FFD93D',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});