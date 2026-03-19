import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useState, useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/theme/colors';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  const [isDark, setIsDark] = useState(false);

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
