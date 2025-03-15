import React from 'react';
import { View, StyleSheet, ScrollView, Image, Dimensions } from 'react-native';
import { Surface, Text, Button, Divider, useTheme, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCurrency } from '../contexts/CurrencyContext';

const { width } = Dimensions.get('window');

const TransactionDetailScreen = ({ route, navigation }) => {
  const { transaction } = route.params;
  const theme = useTheme();
  const { formatAmount } = useCurrency();

  // Helper function to safely format dates
  const formatDate = (dateValue) => {
    try {
      if (!dateValue) return 'Unknown date';
      
      // If it's a Firestore Timestamp with toDate method
      if (typeof dateValue.toDate === 'function') {
        return dateValue.toDate().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }
      
      // If it's already a JavaScript Date object or can be converted to one
      return new Date(dateValue).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const formatTime = (dateValue) => {
    try {
      if (!dateValue) return '';
      
      // If it's a Firestore Timestamp with toDate method
      if (typeof dateValue.toDate === 'function') {
        return dateValue.toDate().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        });
      }
      
      // If it's already a JavaScript Date object or can be converted to one
      return new Date(dateValue).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  };

  const getCategoryIcon = () => {
    switch (transaction.category?.toLowerCase()) {
      case 'food':
        return 'food';
      case 'transport':
        return 'car';
      case 'shopping':
        return 'shopping';
      case 'entertainment':
        return 'movie';
      case 'bills':
        return 'file-document';
      case 'salary':
        return 'cash';
      default:
        return 'currency-usd';
    }
  };

  const handleEditTransaction = () => {
    navigation.navigate('AddTransaction', { transaction });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
          color={theme.colors.primary}
        />
        <Text style={styles.headerTitle}>Transaction Details</Text>
        <IconButton
          icon="pencil"
          size={24}
          onPress={handleEditTransaction}
          color={theme.colors.primary}
        />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Transaction Summary Card */}
        <Surface style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.amountRow}>
            <View style={[
              styles.iconContainer, 
              { backgroundColor: transaction.type === 'income' ? '#E8F5E9' : '#FFEBEE' }
            ]}>
              <MaterialCommunityIcons
                name={getCategoryIcon()}
                size={36}
                color={transaction.type === 'income' ? '#4CAF50' : '#F44336'}
              />
            </View>
            <Text style={[
              styles.amount,
              { color: transaction.type === 'income' ? '#4CAF50' : '#F44336' }
            ]}>
              {transaction.type === 'income' ? '+' : '-'}
              {formatAmount(transaction.amount)}
            </Text>
          </View>
          
          <Text style={styles.transactionName}>
            {transaction.name || (transaction.note ? transaction.note.slice(0, 30) : 'Untitled Transaction')}
          </Text>
          
          <View style={styles.typeAndCategoryRow}>
            <Surface style={[styles.badge, { backgroundColor: transaction.type === 'income' ? '#E8F5E9' : '#FFEBEE' }]}>
              <Text style={{ color: transaction.type === 'income' ? '#4CAF50' : '#F44336' }}>
                {transaction.type === 'income' ? 'Income' : 'Expense'}
              </Text>
            </Surface>
            
            <Surface style={[styles.badge, { backgroundColor: theme.colors.primary + '20' }]}>
              <Text style={{ color: theme.colors.primary }}>
                {transaction.category || 'Uncategorized'}
              </Text>
            </Surface>
          </View>
        </Surface>

        {/* Transaction Details Card */}
        <Surface style={[styles.detailsCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={styles.sectionTitle}>Details</Text>
          
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="calendar" size={20} color={theme.colors.primary} />
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{formatDate(transaction.date)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="clock" size={20} color={theme.colors.primary} />
            <Text style={styles.detailLabel}>Time</Text>
            <Text style={styles.detailValue}>{formatTime(transaction.date)}</Text>
          </View>

          {transaction.note && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="text" size={20} color={theme.colors.primary} />
              <Text style={styles.detailLabel}>Note</Text>
              <Text style={styles.detailValue}>{transaction.note}</Text>
            </View>
          )}

          {transaction.paymentMethod && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="credit-card" size={20} color={theme.colors.primary} />
              <Text style={styles.detailLabel}>Payment Method</Text>
              <Text style={styles.detailValue}>{transaction.paymentMethod}</Text>
            </View>
          )}
        </Surface>

        {/* Receipt Image if available */}
        {transaction.receiptUrl && (
          <Surface style={[styles.receiptCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={styles.sectionTitle}>Receipt</Text>
            <Image 
              source={{ uri: transaction.receiptUrl }} 
              style={styles.receiptImage}
              resizeMode="contain"
            />
          </Surface>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button 
            mode="contained" 
            onPress={handleEditTransaction}
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            icon="pencil"
          >
            Edit Transaction
          </Button>
          
          <Button 
            mode="outlined" 
            onPress={() => navigation.goBack()}
            style={styles.button}
            icon="arrow-left"
          >
            Back to List
          </Button>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 16,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  amount: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  transactionName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  typeAndCategoryRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  detailsCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#666',
  },
  detailValue: {
    flex: 2,
    fontSize: 16,
    textAlign: 'right',
  },
  receiptCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
  },
  receiptImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
  },
  actionButtons: {
    marginVertical: 16,
  },
  button: {
    marginBottom: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
});

export default TransactionDetailScreen; 