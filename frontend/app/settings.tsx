import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function SettingsScreen() {
  const [autoConnect, setAutoConnect] = useState(false);
  const [killSwitch, setKillSwitch] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [analytics, setAnalytics] = useState(false);

  const handleProtocolChange = () => {
    Alert.alert(
      'VPN Protokolü',
      'Hangi protokolü kullanmak istiyorsunuz?',
      [
        { text: 'OpenVPN', onPress: () => console.log('OpenVPN selected') },
        { text: 'WireGuard', onPress: () => console.log('WireGuard selected') },
        { text: 'IKEv2', onPress: () => console.log('IKEv2 selected') },
        { text: 'İptal', style: 'cancel' }
      ]
    );
  };

  const handleDNSChange = () => {
    Alert.alert(
      'DNS Ayarları',
      'DNS sağlayıcısını seçin:',
      [
        { text: 'Otomatik', onPress: () => console.log('Auto DNS') },
        { text: 'Cloudflare', onPress: () => console.log('Cloudflare DNS') },
        { text: 'Google', onPress: () => console.log('Google DNS') },
        { text: 'Özel', onPress: () => console.log('Custom DNS') },
        { text: 'İptal', style: 'cancel' }
      ]
    );
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightComponent,
    showArrow = true 
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    rightComponent?: React.ReactNode;
    showArrow?: boolean;
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon as any} size={24} color="#4ECDC4" />
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightComponent}
        {showArrow && <Ionicons name="chevron-forward" size={20} color="#95A5A6" />}
      </View>
    </TouchableOpacity>
  );

  const SwitchItem = ({ 
    icon, 
    title, 
    subtitle, 
    value, 
    onValueChange 
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon as any} size={24} color="#4ECDC4" />
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#2C2C54', true: '#4ECDC4' }}
        thumbColor={value ? '#FFFFFF' : '#95A5A6'}
      />
    </View>
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
        <Text style={styles.headerTitle}>Ayarlar</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Connection Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bağlantı Ayarları</Text>
          
          <SwitchItem
            icon="flash-outline"
            title="Otomatik Bağlan"
            subtitle="Uygulamayı açtığınızda otomatik bağlan"
            value={autoConnect}
            onValueChange={setAutoConnect}
          />

          <SwitchItem
            icon="shield-outline"
            title="Kill Switch"
            subtitle="VPN bağlantısı kesilirse internet erişimini engelle"
            value={killSwitch}
            onValueChange={setKillSwitch}
          />

          <SettingItem
            icon="settings-outline"
            title="VPN Protokolü"
            subtitle="OpenVPN (UDP)"
            onPress={handleProtocolChange}
          />

          <SettingItem
            icon="globe-outline"
            title="DNS Ayarları"
            subtitle="Otomatik"
            onPress={handleDNSChange}
          />
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Uygulama Ayarları</Text>
          
          <SwitchItem
            icon="notifications-outline"
            title="Bildirimler"
            subtitle="Bağlantı durumu bildirimleri"
            value={notifications}
            onValueChange={setNotifications}
          />

          <SwitchItem
            icon="analytics-outline"
            title="Kullanım Analizi"
            subtitle="Anonim kullanım verilerini paylaş"
            value={analytics}
            onValueChange={setAnalytics}
          />

          <SettingItem
            icon="color-palette-outline"
            title="Tema"
            subtitle="Koyu"
            onPress={() => Alert.alert('Bilgi', 'Tema değiştirme özelliği yakında!')}
          />

          <SettingItem
            icon="language-outline"
            title="Dil"
            subtitle="Türkçe"
            onPress={() => Alert.alert('Bilgi', 'Dil değiştirme özelliği yakında!')}
          />
        </View>

        {/* Advanced Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gelişmiş Ayarlar</Text>
          
          <SettingItem
            icon="code-outline"
            title="Debug Modu"
            subtitle="Geliştirici ayarları"
            onPress={() => Alert.alert('Debug', 'Debug modu aktifleştirildi')}
          />

          <SettingItem
            icon="refresh-outline"
            title="Önbelleği Temizle"
            subtitle="Uygulama verilerini temizle"
            onPress={() => Alert.alert('Onay', 'Önbellek temizlensin mi?', [
              { text: 'İptal', style: 'cancel' },
              { text: 'Temizle', onPress: () => Alert.alert('Başarılı', 'Önbellek temizlendi') }
            ])}
          />

          <SettingItem
            icon="download-outline"
            title="Güncellemeleri Kontrol Et"
            subtitle="v1.0.0 (Güncel)"
            onPress={() => Alert.alert('Güncelleme', 'Uygulama güncel!')}
          />
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Destek & Bilgi</Text>
          
          <SettingItem
            icon="help-circle-outline"
            title="Yardım Merkezi"
            subtitle="SSS ve rehberler"
            onPress={() => Alert.alert('Bilgi', 'Yardım merkezi yakında!')}
          />

          <SettingItem
            icon="chatbubble-outline"
            title="Canlı Destek"
            subtitle="7/24 müşteri desteği"
            onPress={() => Alert.alert('Bilgi', 'Canlı destek yakında!')}
          />

          <SettingItem
            icon="star-outline"
            title="Uygulamayı Değerlendir"
            subtitle="App Store'da değerlendirin"
            onPress={() => Alert.alert('Teşekkürler!', 'Değerlendirme sayfasına yönlendiriliyorsunuz...')}
          />

          <SettingItem
            icon="share-outline"
            title="Arkadaşlarınıza Öner"
            subtitle="SecureVPN'i paylaşın"
            onPress={() => Alert.alert('Paylaş', 'Paylaşım özelliği yakında!')}
          />
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yasal</Text>
          
          <SettingItem
            icon="document-text-outline"
            title="Gizlilik Politikası"
            onPress={() => Alert.alert('Bilgi', 'Gizlilik politikası yakında!')}
          />

          <SettingItem
            icon="reader-outline"
            title="Kullanım Koşulları"
            onPress={() => Alert.alert('Bilgi', 'Kullanım koşulları yakında!')}
          />

          <SettingItem
            icon="information-circle-outline"
            title="Açık Kaynak Lisansları"
            onPress={() => Alert.alert('Bilgi', 'Lisans bilgileri yakında!')}
          />
        </View>

        {/* Version Info */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>SecureVPN v1.0.0</Text>
          <Text style={styles.buildText}>Build 2024001</Text>
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 16,
    marginBottom: 10,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#95A5A6',
    marginTop: 2,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  versionText: {
    fontSize: 16,
    color: '#95A5A6',
    fontWeight: '500',
  },
  buildText: {
    fontSize: 12,
    color: '#95A5A6',
    marginTop: 5,
  },
});