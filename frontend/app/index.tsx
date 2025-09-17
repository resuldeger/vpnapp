import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { useVPNStore } from '../stores/vpnStore';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const { user, isAuthenticated, isGuest, continueAsGuest } = useAuthStore();
  const { 
    isConnected, 
    selectedServer, 
    connectionStatus,
    connect,
    disconnect,
    fetchServers
  } = useVPNStore();

  const [connectionTime, setConnectionTime] = useState(0);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    if (isGuest) {
      // Fetch servers for guest users
      fetchServers();
    }
  }, [isGuest]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isConnected) {
      interval = setInterval(() => {
        setConnectionTime(prev => prev + 1);
      }, 1000);
    } else {
      setConnectionTime(0);
    }
    return () => clearInterval(interval);
  }, [isConnected]);

  const handleConnectionToggle = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (isConnected) {
      disconnect();
    } else {
      if (!selectedServer) {
        Alert.alert(
          "Sunucu Seçin",
          "Lütfen önce bir sunucu seçin",
          [
            { text: "İptal", style: "cancel" },
            { text: "Sunucu Seç", onPress: () => router.push('/servers') }
          ]
        );
        return;
      }
      connect();
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return '#4ECDC4';
      case 'connecting':
        return '#FFD93D';
      case 'disconnecting':
        return '#FF6B6B';
      default:
        return '#95A5A6';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Bağlandı';
      case 'connecting':
        return 'Bağlanıyor...';
      case 'disconnecting':
        return 'Bağlantı kesiliyor...';
      default:
        return 'Bağlantı yok';
    }
  };

  if (!isAuthenticated && !isGuest) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />
        <View style={styles.authContainer}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Ionicons name="shield-checkmark" size={60} color="#4ECDC4" />
            </View>
            <Text style={styles.logoText}>SecureVPN</Text>
            <Text style={styles.tagline}>Güvenli ve hızlı internet erişimi</Text>
          </View>

          <View style={styles.authButtons}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => router.push('/login')}
            >
              <Text style={styles.primaryButtonText}>Giriş Yap</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => router.push('/register')}
            >
              <Text style={styles.secondaryButtonText}>Kayıt Ol</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.guestButton}
              onPress={continueAsGuest}
            >
              <Text style={styles.guestButtonText}>Misafir Olarak Devam Et</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>
          {isGuest 
            ? 'Misafir Kullanıcı' 
            : `Merhaba, ${user?.email?.split('@')[0] || 'Kullanıcı'}`
          }
        </Text>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => isGuest ? router.push('/login') : router.push('/profile')}
        >
          <Ionicons 
            name={isGuest ? "log-in-outline" : "person-circle-outline"} 
            size={28} 
            color="#4ECDC4" 
          />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Connection Status Card */}
        <BlurView intensity={20} style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusIndicator, { backgroundColor: getConnectionStatusColor() }]} />
            <Text style={styles.statusText}>{getConnectionStatusText()}</Text>
          </View>
          
          {selectedServer && (
            <View style={styles.serverInfo}>
              <Ionicons name="location-outline" size={16} color="#95A5A6" />
              <Text style={styles.serverText}>
                {selectedServer.name} - {selectedServer.country}
              </Text>
            </View>
          )}

          {isConnected && (
            <View style={styles.connectionStats}>
              <Text style={styles.connectionTime}>{formatTime(connectionTime)}</Text>
              <TouchableOpacity 
                style={styles.statsButton}
                onPress={() => setShowStats(!showStats)}
              >
                <Ionicons name="bar-chart-outline" size={16} color="#4ECDC4" />
                <Text style={styles.statsButtonText}>İstatistikler</Text>
              </TouchableOpacity>
            </View>
          )}
        </BlurView>

        {/* Connection Button */}
        <TouchableOpacity 
          style={[
            styles.connectionButton,
            { backgroundColor: isConnected ? '#FF6B6B' : '#4ECDC4' }
          ]}
          onPress={handleConnectionToggle}
          disabled={connectionStatus === 'connecting' || connectionStatus === 'disconnecting'}
        >
          <View style={styles.connectionButtonInner}>
            <Ionicons 
              name={isConnected ? "stop" : "play"} 
              size={40} 
              color="#FFFFFF" 
            />
            <Text style={styles.connectionButtonText}>
              {isConnected ? 'Bağlantıyı Kes' : 'Bağlan'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/servers')}
          >
            <Ionicons name="server-outline" size={24} color="#4ECDC4" />
            <Text style={styles.actionButtonText}>Sunucular</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={24} color="#4ECDC4" />
            <Text style={styles.actionButtonText}>Ayarlar</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/subscription')}
          >
            <Ionicons name="diamond-outline" size={24} color="#FFD93D" />
            <Text style={styles.actionButtonText}>Premium</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Modal */}
      {showStats && isConnected && (
        <BlurView intensity={80} style={styles.statsModal}>
          <View style={styles.statsContent}>
            <Text style={styles.statsTitle}>Bağlantı İstatistikleri</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>↓ 45.2 MB</Text>
                <Text style={styles.statLabel}>İndirilen</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>↑ 12.8 MB</Text>
                <Text style={styles.statLabel}>Yüklenen</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{selectedServer?.ping_ms || 0} ms</Text>
                <Text style={styles.statLabel}>Ping</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{selectedServer?.load_percentage || 0}%</Text>
                <Text style={styles.statLabel}>Sunucu Yükü</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.closeStatsButton}
              onPress={() => setShowStats(false)}
            >
              <Text style={styles.closeStatsButtonText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#95A5A6',
    textAlign: 'center',
  },
  authButtons: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#4ECDC4',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#4ECDC4',
    fontSize: 18,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  greeting: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  profileButton: {
    padding: 8,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statusCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    overflow: 'hidden',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  serverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  serverText: {
    fontSize: 14,
    color: '#95A5A6',
    marginLeft: 5,
  },
  connectionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  connectionTime: {
    fontSize: 24,
    color: '#4ECDC4',
    fontWeight: 'bold',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },
  statsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statsButtonText: {
    color: '#4ECDC4',
    fontSize: 12,
    marginLeft: 4,
  },
  connectionButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  connectionButtonInner: {
    alignItems: 'center',
  },
  connectionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  actionButton: {
    alignItems: 'center',
    padding: 15,
  },
  actionButtonText: {
    color: '#95A5A6',
    fontSize: 12,
    marginTop: 5,
  },
  statsModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContent: {
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
    borderRadius: 20,
    padding: 30,
    margin: 20,
    width: width - 40,
  },
  statsTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 25,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  statItem: {
    width: '48%',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 18,
    color: '#4ECDC4',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#95A5A6',
  },
  closeStatsButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 12,
    borderRadius: 15,
    alignItems: 'center',
  },
  closeStatsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});