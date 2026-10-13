import React from 'react';
import { NavigationContainer, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity } from 'react-native';
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
import PricingScreen from '../screens/PricingScreen';

// Settings Screens (Session 6 & 7)
import LocationSettingsScreen from '../screens/LocationSettingsScreen';
import ProfileSettingsScreen from '../screens/ProfileSettingsScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import ManageAccountScreen from '../screens/ManageAccountScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import HelpCenterScreen from '../screens/HelpCenterScreen';
import FeedbackScreen from '../screens/FeedbackScreen';
import AboutScreen from '../screens/AboutScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Custom Tab Bar Icon Component
function TabBarIcon({ icon, label, focused }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 8 }}>
      <Text style={{ fontSize: 20, marginBottom: 2 }}>{icon}</Text>
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

// Settings stack: keeps the bottom tab bar visible on every settings screen
const SettingsStack = createStackNavigator();
const settingsHeader = {
  headerStyle: { backgroundColor: '#9333EA' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: 'bold' },
};
function SettingsNavigator() {
  return (
    <SettingsStack.Navigator
      screenOptions={({ navigation }) => ({
        ...settingsHeader,
        headerLeft: () => (navigation.canGoBack() ? <BackButton onPress={() => navigation.goBack()} /> : null),
      })}
    >
      <SettingsStack.Screen name="SettingsHome" component={SettingsScreen} options={{ headerShown: false }} />
      <SettingsStack.Screen name="ProfileSettings" component={ProfileSettingsScreen} options={{ title: 'Profile Settings' }} />
      <SettingsStack.Screen name="Pricing" component={PricingScreen} options={{ title: 'Choose Your Plan', headerShown: false }} />
      <SettingsStack.Screen name="ManageAccount" component={ManageAccountScreen} options={{ title: 'Manage Account', headerShown: false }} />
      <SettingsStack.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={{ title: 'Notification Settings' }} />
      <SettingsStack.Screen name="LocationSettings" component={LocationSettingsScreen} options={{ title: 'Location Settings', headerShown: false }} />
      <SettingsStack.Screen name="Privacy" component={PrivacyScreen} options={{ title: 'Privacy & Security', headerShown: false }} />
      <SettingsStack.Screen name="HelpCenter" component={HelpCenterScreen} options={{ title: 'Help Center', headerShown: false }} />
      <SettingsStack.Screen name="Feedback" component={FeedbackScreen} options={{ title: 'Send Feedback' }} />
      <SettingsStack.Screen name="About" component={AboutScreen} options={{ title: 'About', headerShown: false }} />
    </SettingsStack.Navigator>
  );
}

// Plain-text back button (no image assets), always visible in the purple header
function BackButton({ onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8 }}
    >
      <Text style={{ color: '#fff', fontSize: 30, lineHeight: 32, marginRight: 4 }}>{'\u2039'}</Text>
      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Back</Text>
    </TouchableOpacity>
  );
}

// Slim purple bar with a Back button, shown above the main tabs (Home, Kids, Discover, Calendar,
// Settings) whenever there is somewhere to go back to (e.g. arriving from Activity Plan or Pricing).
function BackBar({ onPress }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ backgroundColor: '#9333EA', paddingTop: insets.top, flexDirection: 'row', alignItems: 'center' }}>
      <BackButton onPress={onPress} />
    </View>
  );
}

const mainTab = (icon, label, { slimBack = false } = {}) => ({ navigation }) => ({
  // Screens with their own purple header render the Back button inside it (HeaderBack).
  // Only screens without one (Calendar) get the slim bar.
  headerShown: slimBack,
  header: () => (navigation.canGoBack() ? <BackBar onPress={() => navigation.goBack()} /> : null),
  tabBarIcon: ({ focused }) => <TabBarIcon icon={icon} label={label} focused={focused} />,
});

// Detail screens registered as hidden tabs: they open inside the tab navigator so the
// bottom tab bar stays visible, but have no tab button of their own.
const detailScreen = (title, { ownHeader = false } = {}) => ({ navigation }) => ({
  title,
  // ownHeader: the screen draws its own purple header with a HeaderBack inside it
  headerShown: !ownHeader,
  headerStyle: { backgroundColor: '#9333EA' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: 'bold' },
  headerLeft: () => (
    <BackButton
      onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard'))}
    />
  ),
  tabBarButton: () => null,
  tabBarItemStyle: { display: 'none' },
  unmountOnBlur: true,
});

// Bottom Tab Navigator
function Home() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      backBehavior="history"
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
        options={mainTab('🏠', 'Home')}
      />
      <Tab.Screen 
        name="Kids" 
        component={KidsScreen}
        options={mainTab('👶', 'Kids')}
      />
      <Tab.Screen 
        name="Discover" 
        component={DiscoverScreen}
        options={mainTab('🔍', 'Discover')}
      />
      <Tab.Screen 
        name="Calendar" 
        component={CalendarScreen}
        options={mainTab('📅', 'Calendar', { slimBack: true })}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsNavigator}
        options={mainTab('⚙️', 'Settings')}
      />
      <Tab.Screen name="ChildProfile" component={ChildProfileScreen} options={detailScreen('Child Profile', { ownHeader: true })} />
      <Tab.Screen name="AddGoal" component={AddGoalScreen} options={detailScreen('Add Goal')} />
      <Tab.Screen name="ActivityPlan" component={ActivityPlanScreen} options={detailScreen('Activity Plan', { ownHeader: true })} />
      <Tab.Screen name="FindProviders" component={FindProvidersScreen} options={detailScreen('Find Activities', { ownHeader: true })} />
      <Tab.Screen name="Pricing" component={PricingScreen} options={detailScreen('Choose Your Plan', { ownHeader: true })} />
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
              component={Home}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}