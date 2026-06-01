import { Tabs } from 'expo-router';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { supabase } from '@/lib/supabase';

export default function TabsLayout() {
  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#0a0a0f' },
        headerTintColor: '#f4f4f8',
        tabBarStyle: {
          backgroundColor: '#14141f',
          borderTopColor: '#2a2a3d',
        },
        tabBarActiveTintColor: '#818cf8',
        tabBarInactiveTintColor: '#9494a8',
        headerRight: () => (
          <TouchableOpacity onPress={signOut} style={styles.signOut}>
            <Text style={styles.signOutText}>Out</Text>
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarLabel: 'Home' }} />
      <Tabs.Screen name="circles" options={{ title: 'Circles', tabBarLabel: 'Circles' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  signOut: { marginRight: 16 },
  signOutText: { color: '#9494a8', fontSize: 14 },
});
