import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import { syncProfile } from '@/lib/api';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert('Error', error.message);
    else {
      try {
        await syncProfile();
      } catch {
        // API may be unreachable in dev without tunnel
      }
    }
  }

  async function handleOAuth(provider: 'google' | 'apple') {
    const redirectTo = Linking.createURL('/');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    if (data.url) {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const params = new URLSearchParams(url.hash.replace('#', ''));
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token });
          try {
            await syncProfile();
          } catch {
            /* dev */
          }
        }
      }
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>MarketLeague</Text>
      <Text style={styles.subtitle}>Private group betting</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#9494a8"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#9494a8"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.primaryBtn} onPress={handleSignIn} disabled={loading}>
        <Text style={styles.primaryBtnText}>{loading ? '...' : 'Sign in'}</Text>
      </TouchableOpacity>

      <View style={styles.oauthRow}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => handleOAuth('google')}>
          <Text style={styles.secondaryBtnText}>Google</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => handleOAuth('apple')}>
          <Text style={styles.secondaryBtnText}>Apple</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>Set EXPO_PUBLIC_API_URL to your Next.js dev server</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    justifyContent: 'center',
    padding: 24,
  },
  title: { fontSize: 32, fontWeight: '700', color: '#f4f4f8', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#9494a8', textAlign: 'center', marginBottom: 32 },
  input: {
    backgroundColor: '#14141f',
    borderWidth: 1,
    borderColor: '#2a2a3d',
    borderRadius: 12,
    padding: 14,
    color: '#f4f4f8',
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  oauthRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#14141f',
    borderWidth: 1,
    borderColor: '#2a2a3d',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  secondaryBtnText: { color: '#f4f4f8', fontWeight: '500' },
  hint: { color: '#9494a8', fontSize: 12, textAlign: 'center', marginTop: 24 },
});
