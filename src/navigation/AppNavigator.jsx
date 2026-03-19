import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';

// Screens
import LandingScreen from '../screens/LandingScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import TaskDetailScreen from '../screens/TaskDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CalendarScreen from '../screens/CalendarScreen';

// Services
import { getSessionUser } from '../services/auth';
import { colors } from '../theme/colors';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs({ screenProps }) {
  const isDark = screenProps?.isDark || false;
  const themeColors = isDark ? colors.dark : colors.light;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Calendar') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: themeColors.primary,
        tabBarInactiveTintColor: themeColors.textSecondary,
        tabBarStyle: {
          backgroundColor: themeColors.surface,
          borderTopColor: themeColors.border,
        },
        headerStyle: {
          backgroundColor: themeColors.surface,
        },
        headerTintColor: themeColors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        options={{ title: 'My Tasks' }}
      >
        {(props) => <HomeScreen {...props} isDark={isDark} />}
      </Tab.Screen>
      <Tab.Screen 
        name="Calendar" 
      >
        {(props) => <CalendarScreen {...props} isDark={isDark} />}
      </Tab.Screen>
      <Tab.Screen 
        name="Profile"
      >
        {(props) => (
          <ProfileScreen 
            {...props} 
            isDark={isDark} 
            setIsDark={screenProps?.setIsDark} 
            setUser={screenProps?.setUser}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function AppStack({ screenProps }) {
  const isDark = screenProps?.isDark || false;
  const themeColors = isDark ? colors.dark : colors.light;

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: themeColors.surface,
        },
        headerTintColor: themeColors.text,
      }}
    >
      <Stack.Screen 
        name="MainTabs" 
        options={{ headerShown: false }}
      >
        {(props) => <MainTabs {...props} screenProps={screenProps} />}
      </Stack.Screen>
      <Stack.Screen 
        name="TaskDetail" 
        options={{ title: 'Task Details' }}
      >
        {(props) => <TaskDetailScreen {...props} isDark={isDark} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

function AuthStack({ setUser }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="Login">
        {(props) => <LoginScreen {...props} setUser={setUser} />}
      </Stack.Screen>
      <Stack.Screen name="Register">
        {(props) => <RegisterScreen {...props} setUser={setUser} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

export default function AppNavigator({ isDark, setIsDark }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      try {
        const sessionUser = await getSessionUser();
        setUser(sessionUser);
      } catch (error) {
        console.error("Error loading session:", error);
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.light.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? (
        <AppStack screenProps={{ isDark, setIsDark, setUser }} />
      ) : (
        <AuthStack setUser={setUser} />
      )}
    </NavigationContainer>
  );
}
