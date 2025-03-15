import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Surface, Text, useTheme, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { useCurrency } from '../contexts/CurrencyContext';
import { useNavigation } from '@react-navigation/native';

// Simple category icons mapping
const CATEGORY_ICONS = {
  food: 'food',
  transport: 'car',
  shopping: 'shopping',
  entertainment: 'movie',
  bills: 'file-document',
  salary: 'cash',
  other: 'dots-horizontal',
};

const TransactionItem = ({
  id,
  type,
  amount,
  category,
  date,
  note,
  name,
  receiptUrl,
  paymentMethod,
  onEdit,
  onDelete,
}) => {
  const theme = useTheme();
  const { formatAmount } = useCurrency();
  const navigation = useNavigation();

  // Pass the full transaction object to the detail screen
  const handlePress = () => {
    navigation.navigate('TransactionDetail', {
      transaction: {
        id,
        type,
        amount,
        category,
        date,
        note,
        name,
        receiptUrl,
        paymentMethod
      }
    });
  };

  // Helper function to safely format dates
  const formatDate = (dateValue) => {
    try {
      if (!dateValue) return 'Unknown date';
      
      // If it's a Firestore Timestamp with toDate method
      if (typeof dateValue.toDate === 'function') {
        return dateValue.toDate().toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric'
        });
      }
      
      // If it's already a JavaScript Date object or can be converted to one
      const date = new Date(dateValue);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown';
    }
  };

  const renderRightActions = () => {
    return (
      <View style={styles.rightActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
          onPress={onEdit}
        >
          <MaterialCommunityIcons name="pencil" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
          onPress={onDelete}
        >
          <MaterialCommunityIcons name="delete" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  // Get icon for the category
  const getCategoryIcon = () => {
    const normalizedCategory = category?.toLowerCase();
    return CATEGORY_ICONS[normalizedCategory] || 'currency-usd';
  };

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <Surface style={styles.container}>
        <TouchableOpacity onPress={handlePress} style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: type === 'income' ? '#E8F5E9' : '#FFEBEE' }]}>
            <MaterialCommunityIcons
              name={getCategoryIcon()}
              size={20}
              color={type === 'income' ? '#4CAF50' : '#F44336'}
            />
          </View>
          
          <View style={styles.details}>
            <View style={styles.headerRow}>
              <Text style={styles.name} numberOfLines={1}>
                {name || category || 'Untitled'}
              </Text>
              <Text
                style={[
                  styles.amount,
                  { color: type === 'income' ? '#4CAF50' : '#F44336' }
                ]}
              >
                {type === 'income' ? '+' : '-'}{formatAmount(amount)}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              {category && (
                <Text style={styles.category}>{category}</Text>
              )}
              <Text style={styles.date}>{formatDate(date)}</Text>
            </View>
            
            {note ? <Text style={styles.note} numberOfLines={1}>{note}</Text> : null}
          </View>
        </TouchableOpacity>
      </Surface>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 8,
    elevation: 1,
  },
  content: {
    flexDirection: 'row',
    padding: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  details: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  amount: {
    fontSize: 15,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  category: {
    fontSize: 13,
    color: '#757575',
    marginRight: 8,
  },
  date: {
    fontSize: 13,
    color: '#757575',
  },
  note: {
    fontSize: 13,
    color: '#757575',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  actionButton: {
    width: 40,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TransactionItem; 