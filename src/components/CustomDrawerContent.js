import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Avatar, Title, Caption, Drawer, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth } from '../services/firebase';

const CustomDrawerContent = (props) => {
  const user = auth.currentUser;

  return (
    <View style={styles.container}>
      <DrawerContentScrollView {...props}>
        <View style={styles.userInfoSection}>
          {/* <Avatar.Image
            source={user?.photoURL ? { uri: user.photoURL } : require('../../assets/images/default-avatar.png')}
            size={80}
          /> */}
          <Title style={styles.title}>{user?.displayName || 'User'}</Title>
          <Caption style={styles.caption}>{user?.email}</Caption>
        </View>

        <Drawer.Section style={styles.drawerSection}>
          <Drawer.Item
            icon={({ color, size }) => (
              <MaterialCommunityIcons name="view-dashboard" color={color} size={size} />
            )}
            label="Dashboard"
            onPress={() => props.navigation.navigate('Dashboard')}
          />
          <Drawer.Item
            icon={({ color, size }) => (
              <MaterialCommunityIcons name="plus-circle" color={color} size={size} />
            )}
            label="Add Transaction"
            onPress={() => props.navigation.navigate('AddTransaction')}
          />
          <Drawer.Item
            icon={({ color, size }) => (
              <MaterialCommunityIcons name="history" color={color} size={size} />
            )}
            label="Transaction History"
            onPress={() => props.navigation.navigate('TransactionHistory')}
          />
          <Drawer.Item
            icon={({ color, size }) => (
              <MaterialCommunityIcons name="chart-bar" color={color} size={size} />
            )}
            label="Statistics"
            onPress={() => props.navigation.navigate('Statistics')}
          />
          <Drawer.Item
            icon={({ color, size }) => (
              <MaterialCommunityIcons name="wallet" color={color} size={size} />
            )}
            label="Budgeting"
            onPress={() => props.navigation.navigate('Budgeting')}
          />
          <Drawer.Item
            icon={({ color, size }) => (
              <MaterialCommunityIcons name="cog" color={color} size={size} />
            )}
            label="Settings"
            onPress={() => props.navigation.navigate('Settings')}
          />
        </Drawer.Section>
      </DrawerContentScrollView>

      <Drawer.Section style={styles.bottomDrawerSection}>
        <Drawer.Item
          icon={({ color, size }) => (
            <MaterialCommunityIcons name="exit-to-app" color={color} size={size} />
          )}
          label="Sign Out"
          onPress={() => auth.signOut()}
        />
      </Drawer.Section>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fa',
  },
  userInfoSection: {
    paddingLeft: 20,
    paddingVertical: 20,
  },
  title: {
    marginTop: 20,
    fontWeight: 'bold',
  },
  caption: {
    fontSize: 14,
    lineHeight: 14,
  },
  drawerSection: {
    marginTop: 15,
  },
  bottomDrawerSection: {
    marginBottom: 15,
    borderTopColor: '#f4f4f4',
    borderTopWidth: 1,
  },
});

export default CustomDrawerContent; 