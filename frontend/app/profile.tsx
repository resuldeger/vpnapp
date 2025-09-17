import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../stores/authStore';

export default function ProfileScreen() {
  const { user, logout, refreshProfile } = useAuthStore();

  useEffect(() => {
    refreshProfile();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabınızdan çıkış yapmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Çıkış Yap', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/');
          }
        }
      ]
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Belirsiz';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const getSubscriptionStatus = () => {
    if (user?.subscription_tier === 'premium') {
      const expiresAt = user.subscription_expires_at;
      if (expiresAt && new Date(expiresAt) > new Date()) {
        return {
          text: 'Premium Aktif',
          color: '#4ECDC4',
          icon: 'diamond',
          description: `${formatDate(expiresAt)} tarihine kadar geçerli`
        };
      } else {
        return {
          text: 'Premium Süresi Dolmuş',
          color: '#FF6B6B',
          icon: 'diamond-outline',
          description: 'Premium aboneliğinizi yenileyin'
        };
      }
    }
    return {
      text: 'Ücretsiz Plan',
      color: '#95A5A6',
      icon: 'person-outline',
      description: 'Premium özelliklere erişim için yükseltin'
    };
  };

  const subscriptionStatus = getSubscriptionStatus();

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
        <Text style={styles.headerTitle}>Profil</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => {/* TODO: Edit profile */}}
        >
          <Ionicons name="create-outline" size={24} color="#4ECDC4" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color="#4ECDC4" />
            </View>
            <Text style={styles.userName}>
              {user?.email?.split('@')[0] || 'Kullanıcı'}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>

          {/* Subscription Status */}
          <View style={styles.subscriptionStatus}>
            <View style={styles.subscriptionHeader}>
              <Ionicons 
                name={subscriptionStatus.icon as any} 
                size={20} 
                color={subscriptionStatus.color} 
              />
              <Text style={[styles.subscriptionText, { color: subscriptionStatus.color }]}>
                {subscriptionStatus.text}
              </Text>
            </View>
            <Text style={styles.subscriptionDescription}>
              {subscriptionStatus.description}
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
        </View>

        {/* Menu Options */}
        <View style={styles.menuSection}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/subscription')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="diamond-outline" size={24} color="#FFD93D" />
              <Text style={styles.menuItemText}>Abonelik Yönetimi</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#95A5A6" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/settings')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="settings-outline" size={24} color="#4ECDC4" />
              <Text style={styles.menuItemText}>Ayarlar</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#95A5A6" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="help-circle-outline" size={24} color="#4ECDC4" />
              <Text style={styles.menuItemText}>Yardım & Destek</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#95A5A6" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="document-text-outline" size={24} color="#4ECDC4" />
              <Text style={styles.menuItemText}>Gizlilik Politikası</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#95A5A6" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="information-circle-outline" size={24} color="#4ECDC4" />
              <Text style={styles.menuItemText}>Hakkında</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#95A5A6" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
          <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
        </TouchableOpacity>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>SecureVPN v1.0.0</Text>
        </View>
      </ScrollView>
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
  editButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 25,
    marginBottom: 25,
    alignItems: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  userName: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#95A5A6',
  },
  subscriptionStatus: {
    alignItems: 'center',
    width: '100%',
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  subscriptionText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  subscriptionDescription: {
    fontSize: 14,
    color: '#95A5A6',
    textAlign: 'center',
    marginBottom: 15,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 217, 61, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  upgradeButtonText: {
    color: '#FFD93D',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  menuSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    marginBottom: 25,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    paddingVertical: 16,
    borderRadius: 15,
    marginBottom: 25,
  },
  logoutButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  versionContainer: {
    alignItems: 'center',
    paddingBottom: 30,
  },
  versionText: {
    fontSize: 14,
    color: '#95A5A6',
  },
});