import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../stores/authStore';

const { width } = Dimensions.get('window');

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: PlanFeature[];
  popular?: boolean;
  color: string;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Ücretsiz',
    price: '₺0',
    period: 'her zaman',
    description: 'Temel VPN koruması',
    color: '#95A5A6',
    features: [
      { text: '5 sunucu lokasyonu', included: true },
      { text: 'Temel hız', included: true },
      { text: '1 eş zamanlı bağlantı', included: true },
      { text: 'Reklam engelleme', included: false },
      { text: 'Premium sunucular', included: false },
      { text: 'Özel müşteri desteği', included: false },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '₺29.99',
    period: 'aylık',
    description: 'Tam VPN deneyimi',
    color: '#4ECDC4',
    popular: true,
    features: [
      { text: '50+ sunucu lokasyonu', included: true },  
      { text: 'Maksimum hız', included: true },
      { text: '5 eş zamanlı bağlantı', included: true },
      { text: 'Reklam engelleme', included: true },
      { text: 'Premium sunucular', included: true },
      { text: '7/24 müşteri desteği', included: true },
    ],
  },
];

export default function SubscriptionScreen() {
  const { user, refreshProfile } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = useState<string>('premium');

  const handleSubscribe = async () => {
    if (selectedPlan === 'free') {
      Alert.alert('Bilgi', 'Zaten ücretsiz plana sahipsiniz.');
      return;
    }

    Alert.alert(
      'Premium Abonelik',
      `${plans.find(p => p.id === selectedPlan)?.name} planına geçmek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Devam Et', 
          onPress: () => {
            // TODO: Implement RevenueCat purchase flow
            Alert.alert(
              'Başarılı!',
              'Premium aboneliğiniz başarıyla aktifleştirildi!',
              [{ text: 'Tamam', onPress: () => {
                refreshProfile();
                router.back();
              }}]
            );
          }
        }
      ]
    );
  };

  const renderFeature = (feature: PlanFeature) => (
    <View key={feature.text} style={styles.featureItem}>
      <Ionicons 
        name={feature.included ? "checkmark-circle" : "close-circle"} 
        size={20} 
        color={feature.included ? '#4ECDC4' : '#FF6B6B'} 
      />
      <Text style={[
        styles.featureText,
        !feature.included && styles.featureTextDisabled
      ]}>
        {feature.text}
      </Text>
    </View>
  );

  const renderPlan = (plan: Plan) => (
    <TouchableOpacity
      key={plan.id}
      style={[
        styles.planCard,
        selectedPlan === plan.id && styles.selectedPlanCard,
        plan.popular && styles.popularPlanCard
      ]}
      onPress={() => setSelectedPlan(plan.id)}
    >
      {plan.popular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularBadgeText}>EN POPÜLER</Text>
        </View>
      )}

      <View style={styles.planHeader}>
        <Text style={styles.planName}>{plan.name}</Text>
        {selectedPlan === plan.id && (
          <Ionicons name="checkmark-circle" size={24} color="#4ECDC4" />
        )}
      </View>

      <View style={styles.priceContainer}>
        <Text style={[styles.price, { color: plan.color }]}>{plan.price}</Text>
        <Text style={styles.period}>/ {plan.period}</Text>
      </View>

      <Text style={styles.planDescription}>{plan.description}</Text>

      <View style={styles.featuresContainer}>
        {plan.features.map(renderFeature)}
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
        <Text style={styles.headerTitle}>Abonelik Planları</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Info */}
        <View style={styles.headerInfo}>
          <View style={styles.headerIcon}>
            <Ionicons name="diamond" size={50} color="#FFD93D" />
          </View>
          <Text style={styles.headerInfoTitle}>Premium'a Geçin</Text>
          <Text style={styles.headerInfoSubtitle}>
            Sınırsız VPN erişimi ve premium özellikler
          </Text>
        </View>

        {/* Current Plan */}
        {user?.subscription_tier && (
          <View style={styles.currentPlanCard}>
            <Text style={styles.currentPlanTitle}>Mevcut Planınız</Text>
            <View style={styles.currentPlanInfo}>
              <Ionicons 
                name={user.subscription_tier === 'premium' ? 'diamond' : 'person-outline'} 
                size={20} 
                color={user.subscription_tier === 'premium' ? '#4ECDC4' : '#95A5A6'} 
              />
              <Text style={styles.currentPlanText}>
                {user.subscription_tier === 'premium' ? 'Premium' : 'Ücretsiz'}
              </Text>
            </View>
            {user.subscription_expires_at && (
              <Text style={styles.currentPlanExpiry}>
                {new Date(user.subscription_expires_at) > new Date() 
                  ? `${new Date(user.subscription_expires_at).toLocaleDateString('tr-TR')} tarihine kadar geçerli`
                  : 'Süresi dolmuş'
                }
              </Text>
            )}
          </View>
        )}

        {/* Plans */}
        <View style={styles.plansContainer}>
          {plans.map(renderPlan)}
        </View>

        {/* Benefits */}
        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsTitle}>Neden Premium?</Text>
          
          <View style={styles.benefitItem}>
            <Ionicons name="flash" size={24} color="#FFD93D" />
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Ultra Hızlı Bağlantı</Text>
              <Text style={styles.benefitDescription}>
                Premium sunucularımızla maksimum hız deneyimi
              </Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <Ionicons name="globe" size={24} color="#4ECDC4" />
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Global Sunucu Ağı</Text>
              <Text style={styles.benefitDescription}>
                Dünya çapında 50+ lokasyonda sunucular
              </Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <Ionicons name="shield-checkmark" size={24} color="#A8E6CF" />
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Maksimum Güvenlik</Text>
              <Text style={styles.benefitDescription}>
                Askeri düzeyde şifreleme ve gizlilik koruması
              </Text>
            </View>
          </View>
        </View>

        {/* Subscribe Button */}
        <TouchableOpacity 
          style={[
            styles.subscribeButton,
            selectedPlan === 'free' && styles.subscribeButtonDisabled
          ]}
          onPress={handleSubscribe}
          disabled={selectedPlan === 'free'}
        >
          <Text style={styles.subscribeButtonText}>
            {selectedPlan === 'free' ? 'Mevcut Plan' : 'Premium\'a Geç'}
          </Text>
        </TouchableOpacity>

        {/* Terms */}
        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>
            Devam ederek <Text style={styles.termsLink}>Kullanım Koşulları</Text> 
            ve <Text style={styles.termsLink}>Gizlilik Politikası</Text>'nı kabul etmiş olursunuz.
          </Text>
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
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  headerInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 217, 61, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerInfoTitle: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerInfoSubtitle: {
    fontSize: 16,
    color: '#95A5A6',
    textAlign: 'center',
  },
  currentPlanCard: {
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(78, 205, 196, 0.3)',
  },
  currentPlanTitle: {
    fontSize: 16,
    color: '#4ECDC4',
    fontWeight: '600',
    marginBottom: 10,
  },
  currentPlanInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentPlanText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  currentPlanExpiry: {
    fontSize: 14,
    color: '#95A5A6',
  },
  plansContainer: {
    marginBottom: 30,
  },
  planCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 25,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedPlanCard: {
    borderColor: '#4ECDC4',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
  },
  popularPlanCard: {
    borderColor: '#FFD93D',
    backgroundColor: 'rgba(255, 217, 61, 0.05)',
  },
  popularBadge: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    backgroundColor: '#FFD93D',
    paddingVertical: 8,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
  },
  popularBadgeText: {
    color: '#1A1A2E',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 10,
  },
  planName: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  period: {
    fontSize: 16,
    color: '#95A5A6',
    marginLeft: 5,
  },
  planDescription: {
    fontSize: 16,
    color: '#95A5A6',
    marginBottom: 20,
  },
  featuresContainer: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 12,
    flex: 1,
  },
  featureTextDisabled: {
    color: '#95A5A6',
    textDecorationLine: 'line-through',
  },
  benefitsSection: {
    marginBottom: 30,
  },
  benefitsTitle: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 20,
  },
  benefitContent: {
    marginLeft: 15,
    flex: 1,
  },
  benefitTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 5,
  },
  benefitDescription: {
    fontSize: 14,
    color: '#95A5A6',
    lineHeight: 20,
  },
  subscribeButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  subscribeButtonDisabled: {
    backgroundColor: '#95A5A6',
    shadowOpacity: 0,
    elevation: 0,
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  termsContainer: {
    alignItems: 'center',
  },
  termsText: {
    fontSize: 12,
    color: '#95A5A6',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#4ECDC4',
  },
});