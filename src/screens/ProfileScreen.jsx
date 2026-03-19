import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch } from 'react-native';
import { getSessionUser, clearSession } from '../services/auth';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen({ isDark, setIsDark, setUser }) {
  const [userProfile, setUserProfile] = useState(null);
  const theme = isDark ? colors.dark : colors.light;

  useEffect(() => {
    async function fetchUser() {
      const u = await getSessionUser();
      setUserProfile(u);
    }
    fetchUser();
  }, []);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Logout', 
        style: 'destructive',
        onPress: async () => {
          await clearSession();
          setUser(null); // This triggers re-render in AppNavigator to switch to AuthStack
        }
      }
    ]);
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  if (!userProfile) return null;

  const initials = userProfile.name ? userProfile.name.charAt(0).toUpperCase() : '?';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={[styles.name, { color: theme.text }]}>{userProfile.name}</Text>
        <Text style={[styles.email, { color: theme.textSecondary }]}>{userProfile.email}</Text>
      </View>

      <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <Ionicons name="moon-outline" size={24} color={theme.text} />
            <Text style={[styles.settingText, { color: theme.text }]}>Dark Mode</Text>
          </View>
          <Switch 
            value={isDark} 
            onValueChange={toggleTheme} 
            trackColor={{ false: theme.border, true: theme.primary }}
          />
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.logoutButton, { backgroundColor: theme.surface, borderColor: theme.danger }]} 
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={24} color={theme.danger} />
        <Text style={[styles.logoutText, { color: theme.danger }]}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginVertical: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
