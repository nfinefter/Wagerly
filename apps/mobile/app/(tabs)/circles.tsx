import { View, Text, StyleSheet } from 'react-native';

export default function CirclesTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Circles</Text>
      <Text style={styles.muted}>
        Create or join circles via invite link:{'\n'}
        wagerly://join/CODE (phase 2)
      </Text>
      <Text style={styles.muted}>
        Use the web app at localhost:3000 for full circle & bet management.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', padding: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#f4f4f8', marginBottom: 12 },
  muted: { fontSize: 14, color: '#9494a8', lineHeight: 22, marginBottom: 16 },
});
