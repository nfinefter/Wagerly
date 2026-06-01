import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { fetchCircles } from '@/lib/api';

type Circle = {
  id: string;
  name: string;
  inviteCode: string;
  moneyMode: string;
  memberCount?: number;
};

export default function HomeTab() {
  const [circles, setCircles] = useState<Circle[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    setRefreshing(true);
    try {
      setError(null);
      const data = await fetchCircles();
      setCircles(data.circles ?? []);
    } catch {
      setError('Could not reach API. Set EXPO_PUBLIC_API_URL (e.g. http://YOUR_IP:3000)');
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor="#6366f1" />}
    >
      <Text style={styles.heading}>Active Circles</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      {circles.length === 0 && !error ? (
        <Text style={styles.muted}>No circles yet. Create one on web or join with a code.</Text>
      ) : (
        circles.map((c) => (
          <View key={c.id} style={styles.card}>
            <Text style={styles.cardTitle}>{c.name}</Text>
            <Text style={styles.muted}>
              {c.memberCount ?? '—'} members · {c.moneyMode === 'PLAY' ? 'Play' : 'Real'} · {c.inviteCode}
            </Text>
          </View>
        ))
      )}
      <Text style={styles.footer}>Full betting UI ships in phase 2</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  content: { padding: 16, paddingBottom: 32 },
  heading: { fontSize: 22, fontWeight: '700', color: '#f4f4f8', marginBottom: 16 },
  card: {
    backgroundColor: '#14141f',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2a3d',
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#f4f4f8' },
  muted: { fontSize: 13, color: '#9494a8', marginTop: 4 },
  error: { color: '#ef4444', marginBottom: 12 },
  footer: { textAlign: 'center', color: '#9494a8', fontSize: 12, marginTop: 24 },
});
