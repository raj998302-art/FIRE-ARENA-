import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider } from './src/contexts/AuthContext';

import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import DashboardScreen from './src/screens/dashboard/DashboardScreen';
import WalletScreen from './src/screens/wallet/WalletScreen';
import TournamentsScreen from './src/screens/tournaments/TournamentsScreen';
import TeamScreen from './src/screens/team/TeamScreen';
import ChatScreen from './src/screens/chat/ChatScreen';
import VipScreen from './src/screens/vip/VipScreen';

export default function App() {
  const Stack = createNativeStackNavigator();

  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator 
          screenOptions={{
            headerStyle: {
              backgroundColor: '#0a0a0a',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          {/* Auth Stack */}
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="Register" 
            component={RegisterScreen} 
            options={{ headerShown: false }} 
          />
          
          /* App Stack */
          <Stack.Screen 
            name="Dashboard" 
            component={DashboardScreen} 
            options={{ 
              title: 'FIRE ARENA MAX',
              headerStyle: {
                backgroundColor: '#0a0a0a',
              },
            }} 
          />
          <Stack.Screen 
            name="Wallet" 
            component={WalletScreen} 
            options={{ title: 'Wallet' }} 
          />
          <Stack.Screen 
            name="Tournaments" 
            component={TournamentsScreen} 
            options={{ title: 'Tournaments' }} 
          />
          <Stack.Screen 
            name="Team" 
            component={TeamScreen} 
            options={{ title: 'Team' }} 
          />
          <Stack.Screen 
            name="Chat" 
            component={ChatScreen} 
            options={{ title: 'Chat' }} 
          />
          <Stack.Screen 
            name="VIP" 
            component={VipScreen} 
            options={{ title: 'VIP' }} 
          />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
