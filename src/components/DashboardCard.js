import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Surface, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const DashboardCard = ({ title, amount, icon, type }) => {
  const theme = useTheme();

  const getGradientColors = () => {
    switch (type) {
      case 'income':
        return ['#4CAF50', '#81C784'];
      case 'expense':
        return ['#F44336', '#E57373'];
      default:
        return ['#2196F3', '#64B5F6'];
    }
  };

  return (
    <Surface style={styles.card}>
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name={icon}
              size={32}
              color="#fff"
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.amount}>
              ${amount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </Surface>
  );
};

const styles = StyleSheet.create({
  card: {
    width: width * 0.45,
    height: 120,
    margin: 8,
    borderRadius: 16,
    elevation: 4,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    padding: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  iconContainer: {
    alignItems: 'flex-end',
  },
  textContainer: {
    justifyContent: 'flex-end',
  },
  title: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 4,
  },
  amount: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default DashboardCard; 