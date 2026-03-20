import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch } from 'react-native';
import { getSessionUser, clearSession } from '../services/auth';
import { updateUser } from '../services/api';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput, ActivityIndicator, ScrollView } from 'react-native';

export default function ProfileScreen({ isDark, setIsDark, setUser }) {
  const [userProfile, setUserProfile] = useState(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const theme = isDark ? colors.dark : colors.light;

  useEffect(() => {
    fetchUser();
  }, []);

  async function fetchUser() {
    const u = await getSessionUser();
    setUserProfile(u);
    if (u) setNewName(u.name);
  }

  const handleUpdateName = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      await updateUser(userProfile.id, { name: newName });
      await fetchUser();
      setIsEditingName(false);
      Alert.alert('Success', 'Name updated successfully');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update name');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await updateUser(userProfile.id, { password: newPassword });
      setIsChangingPassword(false);
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Password updated successfully');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={[styles.name, { color: theme.text }]}>{userProfile.name}</Text>
          <Text style={[styles.email, { color: theme.textSecondary }]}>{userProfile.email}</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>PROFILE SETTINGS</Text>
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Update Name */}
          <View style={styles.settingRow}>
            <View style={styles.settingLabel}>
              <Ionicons name="person-outline" size={24} color={theme.text} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingText, { color: theme.text }]}>Full Name</Text>
                {isEditingName ? (
                  <View style={styles.editRow}>
                    <TextInput
                      style={[styles.smallInput, { color: theme.text, borderColor: theme.border }]}
                      value={newName}
                      onChangeText={setNewName}
                      autoFocus
                    />
                    <TouchableOpacity onPress={handleUpdateName} disabled={loading}>
                      <Ionicons name="checkmark-circle" size={28} color={theme.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setIsEditingName(false)}>
                      <Ionicons name="close-circle" size={28} color={theme.danger} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={[styles.subText, { color: theme.textSecondary }]}>{userProfile.name}</Text>
                )}
              </View>
            </View>
            {!isEditingName && (
              <TouchableOpacity onPress={() => setIsEditingName(true)}>
                <Text style={{ color: theme.primary, fontWeight: '600' }}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.divider} />

          {/* Change Password */}
          <View style={[styles.settingRow, { alignItems: 'flex-start' }]}>
            <View style={styles.settingLabel}>
              <Ionicons name="lock-closed-outline" size={24} color={theme.text} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingText, { color: theme.text }]}>Security</Text>
                {isChangingPassword ? (
                  <View style={styles.passwordForm}>
                    <TextInput
                      style={[styles.smallInput, { color: theme.text, borderColor: theme.border, marginBottom: 8 }]}
                      placeholder="New Password"
                      placeholderTextColor={theme.textSecondary}
                      secureTextEntry
                      value={newPassword}
                      onChangeText={setNewPassword}
                    />
                    <TextInput
                      style={[styles.smallInput, { color: theme.text, borderColor: theme.border, marginBottom: 8 }]}
                      placeholder="Confirm Password"
                      placeholderTextColor={theme.textSecondary}
                      secureTextEntry
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                    <View style={styles.editRow}>
                      <TouchableOpacity 
                        style={[styles.smallButton, { backgroundColor: theme.primary }]} 
                        onPress={handleUpdatePassword}
                        disabled={loading}
                      >
                        {loading ? <ActivityIndicator size="small" color="white" /> : <Text style={{ color: 'white' }}>Save</Text>}
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.smallButton, { backgroundColor: theme.border }]} 
                        onPress={() => setIsChangingPassword(false)}
                      >
                        <Text style={{ color: theme.text }}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <Text style={[styles.subText, { color: theme.textSecondary }]}>Change Password</Text>
                )}
              </View>
            </View>
            {!isChangingPassword && (
              <TouchableOpacity onPress={() => setIsChangingPassword(true)}>
                <Text style={{ color: theme.primary, fontWeight: '600' }}>Change</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>PREFERENCES</Text>
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginVertical: 24,
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
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 1,
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
    minHeight: 48,
  },
  settingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  subText: {
    fontSize: 13,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#00000010',
    marginVertical: 12,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  smallInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  passwordForm: {
    marginTop: 8,
    width: '100%',
  },
  smallButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
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

