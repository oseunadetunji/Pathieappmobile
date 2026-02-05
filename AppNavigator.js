import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Screens
import AuthScreen from '../screens/AuthScreen';
import DashboardScreen from '../screens/DashboardScreen';
import KidsScreen from '../screens/KidsScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import CalendarScreen from '../screens/CalendarScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ChildProfileScreen from '../screens/ChildProfileScreen';
import AddGoalScreen from '../screens/AddGoalScreen';
import ActivityPlanScreen from '../screens/ActivityPlanScreen';
import FindProvidersScreen from '../screens/FindProvidersScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Custom Tab Bar Icon Component
function TabBarIcon({ icon, label, focused }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 8 }}>
      <Text style={{ fontSize: 26, marginBottom: 2 }}>{icon}</Text>
      <Text 
        style={{ 
          fontSize: 11, 
          color: focused ? '#9333EA' : '#6B7280',
          fontWeight: focused ? '600' : '400'
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

// Bottom Tab Navigator
function MainTabs() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 5,
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
        },
        tabBarShowLabel: false,
        tabBarItemStyle: {
          paddingVertical: 0,
        },
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon icon="🏠" label="Home" focused={focused} />
          ),
        }}
      />
      <Tab.Screen 
        name="Kids" 
        component={KidsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon icon="👶" label="Kids" focused={focused} />
          ),
        }}
      />
      <Tab.Screen 
        name="Discover" 
        component={DiscoverScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon icon="🔍" label="Discover" focused={focused} />
          ),
        }}
      />
      <Tab.Screen 
        name="Calendar" 
        component={CalendarScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon icon="📅" label="Calendar" focused={focused} />
          ),
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon icon="⚙️" label="Settings" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Main App Navigator
export default function AppNavigator({ user }) {
  const isAuthenticated = Boolean(user);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#9333EA',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen 
            name="Auth" 
            component={AuthScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen 
              name="Home" 
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="ChildProfile" 
              component={ChildProfileScreen}
              options={{ title: 'Child Profile' }}
            />
            <Stack.Screen 
              name="AddGoal" 
              component={AddGoalScreen}
              options={{ title: 'Add Goal' }}
            />
            <Stack.Screen 
              name="ActivityPlan" 
              component={ActivityPlanScreen}
              options={{ title: 'Activity Plan' }}
            />
            <Stack.Screen 
              name="FindProviders" 
              component={FindProvidersScreen}
              options={{ title: 'Find Activities' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}