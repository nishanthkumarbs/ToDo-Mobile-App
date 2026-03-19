import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/theme/colors';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// Detect if app is running in Expo Go
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Dynamically load notifications only if NOT in Expo Go
let Notifications;
if (!isExpoGo) {
  Notifications = require('expo-notifications');
  
  // Configure notification behavior for foreground reception
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export default function App() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    async function requestPermissions() {
      // Skip notification permission request in Expo Go
      if (isExpoGo || !Notifications) return;

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
    }
    requestPermissions();
  }, []);

  return (
    <SafeAreaProvider>
      <View style={[styles.container, { backgroundColor: isDark ? colors.dark.background : colors.light.background }]}>
        <AppNavigator isDark={isDark} setIsDark={setIsDark} />
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
