import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Animated,
  Dimensions,
  StatusBar,
  SectionList
} from 'react-native';
import {
  Searchbar,
  Chip,
  Portal,
  Modal,
  Button,
  Surface,
  Text,
  FAB,
  useTheme,
  IconButton,
  Divider,
  Card
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TransactionItem from '../components/TransactionItem';
import { useTransactions } from '../contexts/TransactionContext';
import { useCurrency } from '../contexts/CurrencyContext';

const { width } = Dimensions.get('window');

const TransactionHistoryScreen = ({ navigation }) => {
  const theme = useTheme();
  const { transactions, deleteTransaction } = useTransactions();
  const { formatAmount } = useCurrency();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState({ income: 0, expenses: 0, balance: 0, count: 0 });
  
  // Animation values for list items
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Helper function to safely get date values for comparison
  const getDateValue = (date) => {
    if (!date) return 0;
    
    try {
      // If it's a Firestore Timestamp with toDate method
      if (typeof date.toDate === 'function') {
        return date.toDate().getTime();
      }
      
      // If it's already a JavaScript Date object
      if (date instanceof Date) {
        return date.getTime();
      }
      
      // If it's a timestamp number
      if (typeof date === 'number') {
        return date;
      }
      
      // If it's a string, try to parse it
      if (typeof date === 'string') {
        return new Date(date).getTime();
      }
      
      return 0;
    } catch (error) {
      console.error('Error processing date:', error);
      return 0;
    }
  };

  // Convert any date to a JS Date object
  const toJSDate = (date) => {
    try {
      if (!date) return new Date();
      
      if (typeof date.toDate === 'function') {
        return date.toDate();
      }
      
      if (date instanceof Date) {
        return date;
      }
      
      return new Date(date);
    } catch (error) {
      console.error('Error converting to JS Date:', error);
      return new Date();
    }
  };

  // Format date to display in headers
  const formatDateHeader = (dateStr) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const dateObj = new Date(dateStr);
    
    // Check if date is today
    if (dateObj.setHours(0, 0, 0, 0) === today.setHours(0, 0, 0, 0)) {
      return 'Today';
    }
    // Check if date is yesterday
    else if (dateObj.setHours(0, 0, 0, 0) === yesterday.setHours(0, 0, 0, 0)) {
      return 'Yesterday';
    }
    // For other dates, show clean format
    else {
      return dateObj.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  const filterTransactions = useCallback(() => {
    let filtered = [...transactions];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (t) =>
          (t.note && t.note.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (t.category && t.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (t.name && t.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter((t) => t.type === selectedType);
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        // Safely convert dates for comparison
        const dateA = getDateValue(a.date);
        const dateB = getDateValue(b.date);
        
        return sortOrder === 'desc'
          ? dateB - dateA
          : dateA - dateB;
      } else {
        return sortOrder === 'desc'
          ? b.amount - a.amount
          : a.amount - b.amount;
      }
    });

    return filtered;
  }, [
    transactions,
    searchQuery,
    selectedType,
    selectedCategory,
    sortBy,
    sortOrder,
  ]);

  // Organize transactions into sections by date
  const transactionSections = useMemo(() => {
    const filtered = filterTransactions();
    const sections = {};
    
    filtered.forEach(transaction => {
      const jsDate = toJSDate(transaction.date);
      const dateStr = jsDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      if (!sections[dateStr]) {
        sections[dateStr] = {
          title: formatDateHeader(dateStr),
          data: []
        };
      }
      
      sections[dateStr].data.push(transaction);
    });
    
    // Convert to array and sort by date
    return Object.values(sections).sort((a, b) => {
      const dateA = new Date(a.data[0].date).getTime();
      const dateB = new Date(b.data[0].date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [filterTransactions, sortOrder]);

  // Calculate totals for the summary
  const calculateSummary = useCallback(() => {
    const filtered = filterTransactions();
    let income = 0;
    let expenses = 0;

    filtered.forEach(transaction => {
      if (transaction.type === 'income') {
        income += parseFloat(transaction.amount || 0);
      } else {
        expenses += parseFloat(transaction.amount || 0);
      }
    });

    return {
      income,
      expenses,
      balance: income - expenses,
      count: filtered.length
    };
  }, [filterTransactions]);

  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  // Update summary when filters or transactions change
  useEffect(() => {
    setSummary(calculateSummary());
  }, [calculateSummary]);

  const handleEdit = (transaction) => {
    navigation.navigate('AddTransaction', { transaction });
  };

  const handleDelete = async (id) => {
    try {
      await deleteTransaction(id);
    } catch (error) {
      alert('Error deleting transaction: ' + error.message);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderSectionHeader = ({ section }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
    </View>
  );

  const renderItem = ({ item, index }) => {
    // Calculate animation delay based on index
    const animationDelay = index * 50;
    
    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          animationDelay: animationDelay
        }}
      >
        <TransactionItem
          {...item}
          onEdit={() => handleEdit(item)}
          onDelete={() => handleDelete(item.id)}
        />
      </Animated.View>
    );
  };

  const categories = [
    'all',
    'Food',
    'Transport',
    'Shopping',
    'Entertainment',
    'Bills',
    'Salary',
    'Other',
  ];

  // Simple Filter Tabs
  const FilterTabs = () => (
    <View style={styles.filterTabsContainer}>
      <View style={styles.filterTabs}>
        <TouchableOpacity 
          style={[
            styles.filterTab, 
            selectedType === 'all' && styles.activeFilterTab
          ]}
          onPress={() => setSelectedType('all')}
        >
          <Text style={[
            styles.filterTabText,
            selectedType === 'all' && styles.activeFilterTabText
          ]}>All</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.filterTab, 
            selectedType === 'income' && styles.activeFilterTab
          ]}
          onPress={() => setSelectedType('income')}
        >
          <Text style={[
            styles.filterTabText,
            selectedType === 'income' && styles.activeFilterTabText
          ]}>Income</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.filterTab, 
            selectedType === 'expense' && styles.activeFilterTab
          ]}
          onPress={() => setSelectedType('expense')}
        >
          <Text style={[
            styles.filterTabText,
            selectedType === 'expense' && styles.activeFilterTabText
          ]}>Expense</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.filterActions}>
        {selectedCategory !== 'all' && (
          <Chip
            onPress={() => setSelectedCategory('all')}
            style={styles.categoryChip}
            closeIcon="close"
            onClose={() => setSelectedCategory('all')}
          >
            {selectedCategory}
          </Chip>
        )}
        
        <IconButton
          icon="tune-vertical"
          size={20}
          onPress={() => setShowFilters(true)}
        />
      </View>
    </View>
  );

  // Simple Summary Component
  const SummaryView = () => (
    <Card style={styles.summaryCard}>
      <View style={styles.summaryContent}>
        <View style={styles.summaryColumn}>
          <Text style={styles.summaryLabel}>Income</Text>
          <Text style={[styles.summaryValue, styles.incomeText]}>
            {formatAmount(summary.income)}
          </Text>
        </View>
        
        <View style={styles.summaryDivider} />
        
        <View style={styles.summaryColumn}>
          <Text style={styles.summaryLabel}>Expense</Text>
          <Text style={[styles.summaryValue, styles.expenseText]}>
            {formatAmount(summary.expenses)}
          </Text>
        </View>
        
        <View style={styles.summaryDivider} />
        
        <View style={styles.summaryColumn}>
          <Text style={styles.summaryLabel}>Balance</Text>
          <Text style={[
            styles.summaryValue,
            summary.balance >= 0 ? styles.incomeText : styles.expenseText
          ]}>
            {formatAmount(summary.balance)}
          </Text>
        </View>
      </View>
    </Card>
  );

  // Empty state component
  const EmptyState = () => (
    <Surface style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="tray-arrow-down"
        size={48}
        color={theme.colors.disabled}
      />
      <Text style={styles.emptyText}>No transactions found</Text>
      <Text style={styles.emptySubtext}>
        {searchQuery || selectedCategory !== 'all' || selectedType !== 'all'
          ? 'Try adjusting your filters'
          : 'Add your first transaction'}
      </Text>
      <Button
        mode="outlined"
        onPress={() => navigation.navigate('AddTransaction')}
        style={styles.emptyButton}
      >
        Add Transaction
      </Button>
    </Surface>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search transactions..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          iconColor={theme.colors.primary}
        />
      </View>
      
      {/* Summary View */}
      <SummaryView />
      
      {/* Filter Tabs */}
      <FilterTabs />
      
      {/* Transaction List */}
      <SectionList
        sections={transactionSections}
        renderSectionHeader={renderSectionHeader}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={EmptyState}
      />

      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={() => navigation.navigate('AddTransaction')}
      />

      <Portal>
        <Modal
          visible={showFilters}
          onDismiss={() => setShowFilters(false)}
          contentContainerStyle={[
            styles.modal,
            { backgroundColor: theme.colors.surface }
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters</Text>
            <IconButton
              icon="close"
              size={20}
              onPress={() => setShowFilters(false)}
            />
          </View>
          
          <Divider />

          <View style={styles.modalContent}>
            <Text style={styles.filterSectionTitle}>Transaction Type</Text>
            <View style={styles.filterOptions}>
              <Chip
                selected={selectedType === 'all'}
                onPress={() => setSelectedType('all')}
                style={styles.filterChip}
              >
                All
              </Chip>
              <Chip
                selected={selectedType === 'income'}
                onPress={() => setSelectedType('income')}
                style={styles.filterChip}
              >
                Income
              </Chip>
              <Chip
                selected={selectedType === 'expense'}
                onPress={() => setSelectedType('expense')}
                style={styles.filterChip}
              >
                Expenses
              </Chip>
            </View>

            <Text style={styles.filterSectionTitle}>Category</Text>
            <View style={styles.filterOptions}>
              {categories.map((category) => (
                <Chip
                  key={category}
                  selected={selectedCategory === category}
                  onPress={() => setSelectedCategory(category)}
                  style={styles.filterChip}
                >
                  {category === 'all' ? 'All Categories' : category}
                </Chip>
              ))}
            </View>
            
            <Text style={styles.filterSectionTitle}>Sort By</Text>
            <View style={styles.filterOptions}>
              <Chip
                selected={sortBy === 'date'}
                onPress={() => setSortBy('date')}
                style={styles.filterChip}
              >
                Date
              </Chip>
              <Chip
                selected={sortBy === 'amount'}
                onPress={() => setSortBy('amount')}
                style={styles.filterChip}
              >
                Amount
              </Chip>
            </View>

            <Text style={styles.filterSectionTitle}>Order</Text>
            <View style={styles.filterOptions}>
              <Chip
                selected={sortOrder === 'desc'}
                onPress={() => setSortOrder('desc')}
                style={styles.filterChip}
              >
                Newest First
              </Chip>
              <Chip
                selected={sortOrder === 'asc'}
                onPress={() => setSortOrder('asc')}
                style={styles.filterChip}
              >
                Oldest First
              </Chip>
            </View>
          </View>
          
          <Divider />

          <View style={styles.modalActions}>
            <Button
              mode="text"
              onPress={() => {
                setSelectedType('all');
                setSelectedCategory('all');
                setSortBy('date');
                setSortOrder('desc');
              }}
            >
              Reset
            </Button>
            
            <Button
              mode="contained"
              onPress={() => setShowFilters(false)}
            >
              Apply
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
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchBar: {
    elevation: 0,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    height: 40,
  },
  summaryCard: {
    margin: 16,
    borderRadius: 8,
    elevation: 1,
  },
  summaryContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  summaryColumn: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#e0e0e0',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  incomeText: {
    color: '#4CAF50',
  },
  expenseText: {
    color: '#F44336',
  },
  filterTabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterTabs: {
    flexDirection: 'row',
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 4,
    backgroundColor: '#f5f5f5',
  },
  activeFilterTab: {
    backgroundColor: '#e3f2fd',
  },
  filterTabText: {
    fontSize: 14,
    color: '#757575',
  },
  activeFilterTabText: {
    color: '#2196F3',
    fontWeight: '500',
  },
  filterActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryChip: {
    height: 32,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#616161',
  },
  list: {
    paddingBottom: 80,
  },
  emptyContainer: {
    margin: 24,
    padding: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    elevation: 1,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    color: '#757575',
    marginBottom: 16,
  },
  emptyButton: {
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modal: {
    margin: 20,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 16,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 16,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    margin: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
});

export default TransactionHistoryScreen; 