import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { 
  Text, 
  Divider, 
  Avatar, 
  useTheme, 
  IconButton
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';

// Screens
import HomeScreen from '../screens/HomeScreen';
import TransactionHistoryScreen from '../screens/TransactionHistoryScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import BudgetingScreen from '../screens/BudgetingScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FinanceTipsScreen from '../screens/FinanceTipsScreen';

// Icons
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

// Custom Drawer Content
const CustomDrawerContent = (props) => {
  const { navigation, state } = props;
  const { user, logout } = useAuth();
  const theme = useTheme();

  const handleLogout = async () => {
    try {
      await logout();
      // Navigation will be handled by the auth state change in AuthContext
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Function to check if a route is active
  const isRouteActive = (routeName) => {
    // Use the built-in state from drawer navigation props
    const currentRouteName = state?.routes[state?.index || 0]?.name || '';
    return routeName === currentRouteName || 
      (routeName === 'MainTabs' && currentRouteName === 'MainTabs');
  };

  const drawerItems = [
    {
      label: 'Home',
      icon: 'home',
      onPress: () => navigation.navigate('MainTabs', { screen: 'Home' }),
      routeName: 'MainTabs',
    },
    {
      label: 'Transaction History',
      icon: 'history',
      onPress: () => navigation.navigate('TransactionHistory'),
      routeName: 'TransactionHistory',
    },
    {
      label: 'Statistics',
      icon: 'chart-bar',
      onPress: () => navigation.navigate('Statistics'),
      routeName: 'Statistics',
    },
    {
      label: 'Budgeting',
      icon: 'wallet',
      onPress: () => navigation.navigate('Budgeting'),
      routeName: 'Budgeting',
    },
  ];

  const utilityItems = [
    {
      label: 'Finance Tips',
      icon: 'lightbulb-on',
      onPress: () => navigation.navigate('FinanceTips'),
      routeName: 'FinanceTips',
    },
    {
      label: 'Settings',
      icon: 'cog',
      onPress: () => navigation.navigate('Settings'),
      routeName: 'Settings',
    },
    {
      label: 'Profile',
      icon: 'account',
      onPress: () => navigation.navigate('Profile'),
      routeName: 'Profile',
    },
  ];

  // Render drawer item
  const renderDrawerItem = (item, index) => (
    <TouchableOpacity
      key={index}
      style={[
        styles.drawerItem,
        isRouteActive(item.routeName) && styles.activeDrawerItem
      ]}
      onPress={item.onPress}
    >
      <Icon 
        name={item.icon} 
        size={22} 
        color={isRouteActive(item.routeName) ? theme.colors.primary : '#666666'} 
        style={styles.drawerItemIcon}
      />
      <Text 
        style={[
          styles.drawerItemLabel,
          isRouteActive(item.routeName) && styles.activeDrawerItemLabel
        ]}
      >
        {item.label}
      </Text>
      {isRouteActive(item.routeName) && (
        <View style={styles.activeItemIndicator} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.drawerContainer}>
      <LinearGradient
        colors={['#E8F5E9', '#FFFFFF']}
        style={styles.drawerHeader}
      >
        <View style={styles.headerOverlay}>
          <TouchableOpacity 
            style={styles.profileSection}
            onPress={() => navigation.navigate('Profile')}
          >
            <Avatar.Image
              source={{ 
                uri: user?.photoURL || 'https://ui-avatars.com/api/?name=' + (user?.displayName || 'User') 
              }}
              size={70}
              style={styles.avatar}
            />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {user?.displayName 
                  ? (user.displayName.length > 18 
                      ? user.displayName.slice(0, 18) + '...' 
                      : user.displayName)
                  : 'User'
                }
              </Text>
              <Text style={styles.userEmail}>
                {user?.email 
                  ? (user.email.length > 22
                      ? user.email.slice(0, 22) + '...'
                      : user.email)
                  : 'No email'
                }
              </Text>
              <View style={styles.viewProfileButton}>
                <Text style={styles.viewProfileText}>View Profile</Text>
                <Icon name="chevron-right" size={14} color="#4CAF50" />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <DrawerContentScrollView
        contentContainerStyle={styles.drawerContent}
      >
        <Text style={styles.sectionTitle}>MAIN</Text>
        {drawerItems.map(renderDrawerItem)}
        
        <Divider style={styles.divider} />
        
        <Text style={styles.sectionTitle}>UTILITIES</Text>
        {utilityItems.map(renderDrawerItem)}
      </DrawerContentScrollView>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Icon 
          name="logout" 
          size={22} 
          color="#FF5252" 
          style={styles.logoutIcon}
        />
        <Text style={styles.logoutText}>
          Logout
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// Bottom Tab Navigator
const MainTabNavigator = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Transactions') {
            iconName = 'swap-horizontal';
          } else if (route.name === 'Statistics') {
            iconName = 'chart-bar';
          } else if (route.name === 'Budgeting') {
            iconName = 'wallet';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          height: 60,
          paddingBottom: 10,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Transactions" component={TransactionHistoryScreen} />
      <Tab.Screen name="Statistics" component={StatisticsScreen} />
      <Tab.Screen name="Budgeting" component={BudgetingScreen} />
    </Tab.Navigator>
  );
};

// Main Drawer Navigator
const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerStyle: {
          width: 290,
          borderTopRightRadius: 30,
          borderBottomRightRadius: 30,
          overflow: 'hidden',
        },
        headerStyle: {
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        swipeEdgeWidth: 100,
      }}
    >
      <Drawer.Screen name="MainTabs" component={MainTabNavigator} options={{ title: 'Dashboard' }} />
      <Drawer.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
      <Drawer.Screen name="Statistics" component={StatisticsScreen} />
      <Drawer.Screen name="Budgeting" component={BudgetingScreen} />
      <Drawer.Screen name="FinanceTips" component={FinanceTipsScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
      <Drawer.Screen name="Profile" component={ProfileScreen} />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  drawerHeader: {
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerOverlay: {
    paddingHorizontal: 16,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    backgroundColor: '#E0E0E0',
    elevation: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userInfo: {
    marginLeft: 15,
    flexDirection: 'column',
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#333333',
  },
  userEmail: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 6,
  },
  viewProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewProfileText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
    marginRight: 2,
  },
  drawerContent: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9E9E9E',
    marginLeft: 16,
    marginTop: 12,
    marginBottom: 4,
    letterSpacing: 1,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 2,
    borderRadius: 10,
    marginHorizontal: 8,
    position: 'relative',
  },
  activeDrawerItem: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  drawerItemIcon: {
    marginRight: 12,
    width: 22,
  },
  drawerItemLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  activeDrawerItemLabel: {
    color: '#333333',
    fontWeight: '700',
  },
  activeItemIndicator: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 4,
    backgroundColor: '#4CAF50',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  divider: {
    marginVertical: 12,
    height: 1,
    backgroundColor: '#EEEEEE',
    marginHorizontal: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
  },
  logoutIcon: {
    marginRight: 12,
    width: 22,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF5252',
  },
});

export default DrawerNavigator; 