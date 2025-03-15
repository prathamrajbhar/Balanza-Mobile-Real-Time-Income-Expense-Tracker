import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import {
  Surface,
  Text,
  Button,
  FAB,
  Portal,
  Modal,
  TextInput,
  ProgressBar,
  IconButton,
  useTheme,
  Divider,
  SegmentedButtons,
} from 'react-native-paper';
import { useBudget } from '../contexts/BudgetContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Categories for budgets - same as transaction categories for consistency
const categories = [
  { id: 'food', label: 'Food', icon: 'food' },
  { id: 'transport', label: 'Transport', icon: 'car' },
  { id: 'shopping', label: 'Shopping', icon: 'shopping' },
  { id: 'entertainment', label: 'Entertainment', icon: 'movie' },
  { id: 'bills', label: 'Bills', icon: 'file-document' },
  { id: 'other', label: 'Other', icon: 'dots-horizontal' },
];

const BudgetingScreen = () => {
  const theme = useTheme();
  const { budgets, loading, addBudget, updateBudget, deleteBudget } = useBudget();
  const { formatAmount } = useCurrency();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [budgetName, setBudgetName] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetCategory, setBudgetCategory] = useState('');
  const [errors, setErrors] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  // Calculate total budget and spending
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
  const totalSpent = budgets.reduce((sum, budget) => sum + (budget.spent || 0), 0);
  const totalRemaining = totalBudget - totalSpent;
  const overallProgress = totalBudget > 0 ? totalSpent / totalBudget : 0;

  const handleAddBudget = () => {
    setEditingBudget(null);
    setBudgetName('');
    setBudgetAmount('');
    setBudgetCategory('');
    setErrors({});
    setModalVisible(true);
  };

  const handleEditBudget = (budget) => {
    setEditingBudget(budget);
    setBudgetName(budget.name);
    setBudgetAmount(budget.amount.toString());
    setBudgetCategory(budget.category);
    setErrors({});
    setModalVisible(true);
  };

  const handleDeleteBudget = (budgetId) => {
    Alert.alert(
      'Delete Budget',
      'Are you sure you want to delete this budget?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            await deleteBudget(budgetId);
          }
        }
      ]
    );
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!budgetName.trim()) {
      newErrors.name = 'Budget name is required';
    }
    
    if (!budgetAmount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(parseFloat(budgetAmount)) || parseFloat(budgetAmount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }
    
    if (!budgetCategory) {
      newErrors.category = 'Category is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveBudget = async () => {
    if (!validateForm()) return;
    
    const budgetData = {
      name: budgetName.trim(),
      amount: parseFloat(budgetAmount),
      category: budgetCategory,
    };
    
    if (editingBudget) {
      await updateBudget(editingBudget.id, budgetData);
    } else {
      await addBudget(budgetData);
    }
    
    setModalVisible(false);
  };

  const getProgressColor = (progress) => {
    if (progress >= 1) return theme.colors.error;
    if (progress >= 0.8) return theme.colors.warning || '#FFC107';
    return theme.colors.primary;
  };

  const renderBudgetItem = ({ item }) => {
    const progress = item.progress || 0;
    const progressColor = getProgressColor(progress);
    
    return (
      <Surface style={styles.budgetCard}>
        <View style={styles.budgetHeader}>
          <View style={styles.budgetTitleContainer}>
            <MaterialCommunityIcons 
              name={categories.find(c => c.id === item.category)?.icon || 'cash'} 
              size={24} 
              color={theme.colors.primary} 
              style={styles.categoryIcon}
            />
            <View>
              <Text style={styles.budgetTitle}>{item.name}</Text>
              <Text style={styles.budgetCategory}>{item.category}</Text>
            </View>
          </View>
          <View style={styles.budgetActions}>
            <IconButton
              icon="pencil"
              size={20}
              onPress={() => handleEditBudget(item)}
            />
            <IconButton
              icon="delete"
              size={20}
              onPress={() => handleDeleteBudget(item.id)}
            />
          </View>
        </View>
        
        <View style={styles.budgetAmounts}>
          <Text style={styles.budgetLabel}>Budget</Text>
          <Text style={styles.budgetValue}>{formatAmount(item.amount)}</Text>
        </View>
        
        <View style={styles.budgetAmounts}>
          <Text style={styles.budgetLabel}>Spent</Text>
          <Text style={[
            styles.budgetValue, 
            { color: progress >= 1 ? theme.colors.error : theme.colors.text }
          ]}>
            {formatAmount(item.spent || 0)}
          </Text>
        </View>
        
        <View style={styles.progressContainer}>
          <ProgressBar 
            progress={Math.min(progress, 1)} 
            color={progressColor}
            style={styles.progressBar}
          />
          <View style={styles.remainingContainer}>
            <Text style={styles.remainingLabel}>
              {progress >= 1 ? 'Overspent' : 'Remaining'}
            </Text>
            <Text style={[
              styles.remainingValue,
              { color: progress >= 1 ? theme.colors.error : theme.colors.success }
            ]}>
              {progress >= 1 
                ? `+${formatAmount(item.spent - item.amount)}` 
                : formatAmount(item.amount - (item.spent || 0))}
            </Text>
          </View>
        </View>
      </Surface>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Summary Card */}
      <Surface style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Monthly Budget Summary</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Budget</Text>
            <Text style={styles.summaryValue}>{formatAmount(totalBudget)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Spent</Text>
            <Text style={[
              styles.summaryValue,
              { color: overallProgress >= 1 ? theme.colors.error : theme.colors.text }
            ]}>
              {formatAmount(totalSpent)}
            </Text>
          </View>
        </View>
        
        <ProgressBar 
          progress={Math.min(overallProgress, 1)} 
          color={getProgressColor(overallProgress)}
          style={styles.overallProgress}
        />
        
        <View style={styles.remainingContainer}>
          <Text style={styles.remainingLabel}>
            {overallProgress >= 1 ? 'Overspent' : 'Remaining'}
          </Text>
          <Text style={[
            styles.remainingValue,
            { 
              color: overallProgress >= 1 
                ? theme.colors.error 
                : theme.colors.success 
            }
          ]}>
            {overallProgress >= 1 
              ? `+${formatAmount(totalSpent - totalBudget)}` 
              : formatAmount(totalRemaining)}
          </Text>
        </View>
      </Surface>

      {/* Budget List */}
      {budgets.length > 0 ? (
        <FlatList
          data={budgets}
          renderItem={renderBudgetItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.budgetList}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            setTimeout(() => setRefreshing(false), 1000);
          }}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons 
            name="wallet-outline" 
            size={64} 
            color={theme.colors.disabled} 
          />
          <Text style={styles.emptyText}>No budgets yet</Text>
          <Text style={styles.emptySubtext}>
            Create a budget to track your spending by category
          </Text>
          <Button 
            mode="contained" 
            onPress={handleAddBudget}
            style={styles.emptyButton}
          >
            Create Budget
          </Button>
        </View>
      )}

      {/* Add Budget FAB */}
      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={handleAddBudget}
      />

      {/* Add/Edit Budget Modal */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={[
            styles.modalContainer,
            { backgroundColor: theme.colors.surface }
          ]}
        >
          <Text style={styles.modalTitle}>
            {editingBudget ? 'Edit Budget' : 'Create Budget'}
          </Text>
          
          <TextInput
            label="Budget Name"
            value={budgetName}
            onChangeText={setBudgetName}
            style={styles.input}
            mode="outlined"
            error={!!errors.name}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          
          <TextInput
            label="Amount"
            value={budgetAmount}
            onChangeText={setBudgetAmount}
            keyboardType="decimal-pad"
            style={styles.input}
            mode="outlined"
            error={!!errors.amount}
          />
          {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
          
          <Text style={styles.categoryLabel}>Category</Text>
          {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
          
          <View style={styles.categoryContainer}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  budgetCategory === category.id && {
                    backgroundColor: theme.colors.primary + '20',
                    borderColor: theme.colors.primary,
                  },
                ]}
                onPress={() => setBudgetCategory(category.id)}
              >
                <MaterialCommunityIcons
                  name={category.icon}
                  size={24}
                  color={budgetCategory === category.id ? theme.colors.primary : theme.colors.text}
                />
                <Text
                  style={[
                    styles.categoryText,
                    budgetCategory === category.id && { color: theme.colors.primary },
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.modalActions}>
            <Button 
              mode="outlined" 
              onPress={() => setModalVisible(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={handleSaveBudget}
              style={styles.modalButton}
            >
              Save
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  overallProgress: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  remainingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remainingLabel: {
    fontSize: 14,
    color: '#666',
  },
  remainingValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  budgetList: {
    paddingBottom: 80,
  },
  budgetCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    marginRight: 8,
  },
  budgetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  budgetCategory: {
    fontSize: 14,
    color: '#666',
  },
  budgetActions: {
    flexDirection: 'row',
  },
  budgetAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  budgetLabel: {
    fontSize: 14,
    color: '#666',
  },
  budgetValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  modalContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    margin: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  categoryText: {
    marginLeft: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    marginLeft: 8,
  },
  errorText: {
    color: 'red',
    marginBottom: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  emptyButton: {
    paddingHorizontal: 16,
  },
});

export default BudgetingScreen; 