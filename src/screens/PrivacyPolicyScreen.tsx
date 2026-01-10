import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type PrivacyPolicyScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PrivacyPolicy'>;

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation<PrivacyPolicyScreenNavigationProp>();

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
      </TouchableOpacity>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Privacy Policy</Text>
      
      <Text style={styles.lastUpdated}>Last updated: January 5, 2026</Text>
      
      <Text style={styles.paragraph}>
        Lolo ("we," "our," or "us") respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your information when you use the Lolo mobile application.
      </Text>

      <Text style={styles.sectionTitle}>Information We Collect</Text>
      
      <Text style={styles.paragraph}>
        We collect only the information necessary to provide and improve the app experience.
      </Text>

      <Text style={styles.subsectionTitle}>Information you provide:</Text>
      <Text style={styles.paragraph}>
        • Email address (used for account creation and login){'\n'}
        • Display name (optional){'\n'}
        • Relationship status and personal reflections you choose to share within the app
      </Text>

      <Text style={styles.subsectionTitle}>Automatically collected information:</Text>
      <Text style={styles.paragraph}>
        • Basic technical data required to operate the app securely (such as authentication tokens)
      </Text>

      <Text style={styles.paragraph}>
        We do not collect sensitive demographic data such as age, gender, or location unless you explicitly choose to provide it in the future.
      </Text>

      <Text style={styles.sectionTitle}>How We Use Your Information</Text>
      
      <Text style={styles.paragraph}>
        We use your information to:{'\n'}
        • Create and manage your account{'\n'}
        • Personalize your in-app experience{'\n'}
        • Save and display your reflections and entries{'\n'}
        • Maintain the security and functionality of the app
      </Text>

      <Text style={styles.paragraph}>
        We do not sell your data or use it for advertising.
      </Text>

      <Text style={styles.sectionTitle}>Data Storage & Security</Text>
      
      <Text style={styles.paragraph}>
        Your data is securely stored using trusted third-party infrastructure providers. We take reasonable measures to protect your information, but no method of transmission or storage is 100% secure.{'\n'}
        Only you can access your personal data within the app.
      </Text>

      <Text style={styles.sectionTitle}>Sharing of Information</Text>
      
      <Text style={styles.paragraph}>
        We do not share your personal information with third parties except:{'\n'}
        • When required to operate the app (e.g., secure authentication services){'\n'}
        • When required by law
      </Text>

      <Text style={styles.sectionTitle}>Your Choices & Rights</Text>
      
      <Text style={styles.paragraph}>
        You can:{'\n'}
        • Update or edit your profile information at any time{'\n'}
        • Delete your account and associated data from within the app
      </Text>

      <Text style={styles.paragraph}>
        If you delete your account, your personal data will be permanently removed.
      </Text>

      <Text style={styles.sectionTitle}>Children's Privacy</Text>
      
      <Text style={styles.paragraph}>
        Lolo is intended for users aged 18 and older. We do not knowingly collect personal information from children.
      </Text>

      <Text style={styles.sectionTitle}>Changes to This Policy</Text>
      
      <Text style={styles.paragraph}>
        We may update this Privacy Policy from time to time. If we make changes, we will update the "Last updated" date above.
      </Text>

      <Text style={styles.sectionTitle}>Contact Us</Text>
      
      <Text style={styles.paragraph}>
        If you have questions or concerns about this Privacy Policy, please contact Theodore Chow at chow.theodore@gmail.com.
      </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'Lora' : 'serif',
  },
  lastUpdated: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 12,
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'Lora' : 'serif',
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
});

