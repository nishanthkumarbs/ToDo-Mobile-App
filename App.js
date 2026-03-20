import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/theme/colors';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import Constants, { ExecutionEnvironment } from 'expo-constants';

import { initNotifications } from './src/utils/notificationUtils';

export default function App() {
  const [isDark, setIsDark] = useState(false);

  // Load theme on startup
  useEffect(() => {
    async function loadTheme() {
      try {
        const savedTheme = await SecureStore.getItemAsync('theme');
        if (savedTheme !== null) {
          setIsDark(savedTheme === 'dark');
        }
      } catch (error) {
        console.error("Failed to load theme:", error);
      }
    }
    loadTheme();
  }, []);

  // Save theme whenever it changes
  const toggleTheme = async (newVal) => {
    setIsDark(newVal);
    try {
      await SecureStore.setItemAsync('theme', newVal ? 'dark' : 'light');
    } catch (error) {
      console.error("Failed to save theme:", error);
    }
  };

  useEffect(() => {
    initNotifications();
  }, []);

  return (
    <SafeAreaProvider>
      <View style={[styles.container, { backgroundColor: isDark ? colors.dark.background : colors.light.background }]}>
        <AppNavigator isDark={isDark} setIsDark={toggleTheme} />
        <StatusBar style={isDark ? "light" : "dark"} />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
