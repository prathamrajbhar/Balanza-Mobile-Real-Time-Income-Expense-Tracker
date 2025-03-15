import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  RefreshControl
} from 'react-native';
import {
  Surface,
  Text,
  useTheme,
  Button,
  IconButton,
  Card,
  Title,
  Paragraph,
  Avatar,
  ProgressBar,
  Chip
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { useTransactions } from '../contexts/TransactionContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useBudget } from '../contexts/BudgetContext';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Define category colors
const CATEGORY_COLORS = {
  Food: '#FF6B6B',              // Coral red
  Transport: '#4ECDC4',         // Turquoise
  Shopping: '#FFD166',          // Golden yellow
  Entertainment: '#6A0572',     // Deep purple
  Bills: '#1A535C',             // Dark teal
  Salary: '#3A86FF',            // Bright blue
  Other: '#8D99AE'              // Slate gray
};

// Helper function to safely format dates
const formatDate = (dateValue) => {
  try {
    if (!dateValue) return 'No date';
    
    // Handle Firestore timestamp
    if (dateValue && typeof dateValue.toDate === 'function') {
      return dateValue.toDate().toLocaleDateString();
    }
    
    // Handle regular Date objects or strings
    return new Date(dateValue).toLocaleDateString();
  } catch (error) {
    console.log('Error formatting date:', error);
    return 'Invalid date';
  }
};

const HomeScreen = ({ navigation }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const { transactions, getTransactions } = useTransactions();
  const { formatAmount, currency } = useCurrency();
  const { budgets, loading: budgetsLoading, loadBudgets } = useBudget();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const windowWidth = Dimensions.get('window').width;
  const lottieRef = useRef(null);

  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();

    // Play lottie animation
    if (lottieRef.current) {
      setTimeout(() => {
        lottieRef.current?.play();
      }, 100);
    }

    // Load transactions
    getTransactions();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      getTransactions(),
      loadBudgets()
    ]);
    setRefreshing(false);
  };

  // Calculate total income, expenses, and balance
  const calculateFinancials = () => {
    let income = 0;
    let expenses = 0;

    transactions.forEach(transaction => {
      try {
        const amount = parseFloat(transaction.amount);
        if (!isNaN(amount)) {
          if (transaction.type === 'income') {
            income += amount;
          } else {
            expenses += amount;
          }
        }
      } catch (error) {
        console.log('Error processing transaction amount:', error);
      }
    });

    return {
      income,
      expenses,
      balance: income - expenses
    };
  };

  const { income, expenses, balance } = calculateFinancials();

  // Get recent transactions
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, showAllTransactions ? transactions.length : 5);

  // Prepare chart data
  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: [
          Math.random() * 1000,
          Math.random() * 1000,
          Math.random() * 1000,
          Math.random() * 1000,
          Math.random() * 1000,
          Math.random() * 1000
        ],
        color: (opacity = 1) => `rgba(123, 104, 238, ${opacity})`,
        strokeWidth: 2
      }
    ],
    legend: ['Income']
  };

  // Calculate expenses by category for pie chart
  const expensesByCategory = useMemo(() => {
    const categorizedExpenses = {};
    
    transactions.forEach(transaction => {
      if (transaction.type === 'expense') {
        const category = transaction.category || 'Other';
        const amount = parseFloat(transaction.amount) || 0;
        
        if (!categorizedExpenses[category]) {
          categorizedExpenses[category] = 0;
        }
        categorizedExpenses[category] += amount;
      }
    });
    
    return categorizedExpenses;
  }, [transactions]);

  const pieChartData = useMemo(() => {
    const data = Object.entries(expensesByCategory)
      .filter(([_, amount]) => amount > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, amount]) => ({
        name: category,
        population: amount,
        color: CATEGORY_COLORS[category] || '#757575',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12
      }));

    // Add placeholder if no data
    if (data.length === 0) {
      data.push({
        name: 'No Expenses',
        population: 1,
        color: '#E0E0E0',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12
      });
    }

    return data;
  }, [expensesByCategory]);

  const chartConfig = {
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: theme.colors.primary
    }
  };

  // Calculate budget progress from actual budget data
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
  const totalSpent = budgets.reduce((sum, budget) => sum + (budget.spent || 0), 0);
  const budgetProgress = totalBudget > 0 ? Math.min(totalSpent / totalBudget, 1) : 0;
  const budgetRemaining = totalBudget - totalSpent;

  // Animation styles
  const animatedStyle = {
    opacity: fadeAnim,
    transform: [{ translateY: slideAnim }]
  };

  return (
    <View style={[
      styles.container,
      { backgroundColor: '#F6F8FA' }
    ]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[
            styles.greeting,
            { color: '#333333' }
          ]}>
            Hello, {user?.displayName?.split(' ')[0] || 'User'}
          </Text>
          <Text style={[
            styles.date,
            { color: '#666666' }
          ]}>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Balance Summary */}
        <Animated.View style={[animatedStyle, styles.balanceContainer]}>
          <LinearGradient
            colors={['#E8F5E9', '#C8E6C9']}
            style={styles.balanceGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.balanceContent}>
              <View>
                <Text style={[
                  styles.balanceLabel,
                  { color: '#2E7D32' }
                ]}>Total Balance</Text>
                <Text style={[
                  styles.balanceAmount,
                  { color: '#1B5E20' }
                ]}>
                  {formatAmount(balance)}
                </Text>
              </View>
              <View style={styles.lottieContainer}>
                <LottieView
                  ref={lottieRef}
                  source={require('../assets/animations/finance-animation.json')}
                  style={styles.lottie}
                  autoPlay
                  loop
                />
              </View>
            </View>
            <View style={[
              styles.incomeExpenseContainer,
              { backgroundColor: 'rgba(0, 0, 0, 0.05)' }
            ]}>
              <View style={styles.incomeContainer}>
                <Icon name="arrow-down" size={20} color="#4CAF50" />
                <Text style={[
                  styles.incomeExpenseLabel,
                  { color: '#2E7D32' }
                ]}>Income</Text>
                <Text style={[
                  styles.incomeAmount,
                  { color: '#1B5E20' }
                ]}>{formatAmount(income)}</Text>
              </View>
              <View style={[
                styles.divider,
                { backgroundColor: 'rgba(0, 0, 0, 0.1)' }
              ]} />
              <View style={styles.expenseContainer}>
                <Icon name="arrow-up" size={20} color="#F44336" />
                <Text style={[
                  styles.incomeExpenseLabel,
                  { color: '#2E7D32' }
                ]}>Expenses</Text>
                <Text style={[
                  styles.expenseAmount,
                  { color: '#1B5E20' }
                ]}>{formatAmount(expenses)}</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View style={[animatedStyle, { marginTop: 20 }]}>
          <Text style={[
            styles.sectionTitle,
            { color: '#333333' }
          ]}>
            Quick Actions
          </Text>
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity
              style={[
                styles.quickActionButton,
                { backgroundColor: '#FFFFFF' }
              ]}
              onPress={() => navigation.navigate('MainTabs', { screen: 'Transactions' })}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#E8F5E9' }]}>
                <Icon name="swap-horizontal" size={24} color="#4CAF50" />
              </View>
              <Text style={[
                styles.quickActionText,
                { color: '#333333' }
              ]}>
                Transactions
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickActionButton,
                { backgroundColor: '#FFFFFF' }
              ]}
              onPress={() => navigation.navigate('MainTabs', { screen: 'Statistics' })}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#E3F2FD' }]}>
                <Icon name="chart-bar" size={24} color="#2196F3" />
              </View>
              <Text style={[
                styles.quickActionText,
                { color: '#333333' }
              ]}>
                Statistics
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickActionButton,
                { backgroundColor: '#FFFFFF' }
              ]}
              onPress={() => navigation.navigate('MainTabs', { screen: 'Budgeting' })}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#FFF3E0' }]}>
                <Icon name="wallet" size={24} color="#FF9800" />
              </View>
              <Text style={[
                styles.quickActionText,
                { color: '#333333' }
              ]}>
                Budgeting
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickActionButton,
                { backgroundColor: '#FFFFFF' }
              ]}
              onPress={() => navigation.navigate('Profile')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#F3E5F5' }]}>
                <Icon name="account" size={24} color="#9C27B0" />
              </View>
              <Text style={[
                styles.quickActionText,
                { color: '#333333' }
              ]}>
                Profile
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Budget Progress */}
        <Animated.View style={[animatedStyle, { marginTop: 20 }]}>
          <Text style={[
            styles.sectionTitle,
            { color: '#333333' }
          ]}>
            Budget Progress
          </Text>
          {budgets.length > 0 ? (
            <Surface style={[
              styles.budgetCard,
              { backgroundColor: '#FFFFFF' }
            ]}>
              <View style={styles.budgetHeader}>
                <Text style={[
                  styles.budgetTitle,
                  { color: '#333333' }
                ]}>
                  Monthly Budget
                </Text>
                <Text style={[
                  styles.budgetAmount,
                  { color: '#333333' }
                ]}>
                  {formatAmount(totalSpent)} / {formatAmount(totalBudget)}
                </Text>
              </View>
              <ProgressBar
                progress={budgetProgress}
                color={budgetProgress > 0.8 ? '#F44336' : theme.colors.primary}
                style={styles.budgetProgress}
              />
              <Text style={[
                styles.budgetRemaining,
                { color: '#666666' }
              ]}>
                {formatAmount(budgetRemaining)} remaining
              </Text>
            </Surface>
          ) : (
            <Surface style={[
              styles.budgetCard,
              { backgroundColor: '#FFFFFF' }
            ]}>
              <Text style={[
                styles.emptyBudgetText,
                { color: '#333333' }
              ]}>
                No budgets set up yet
              </Text>
              <Button 
                mode="contained" 
                onPress={() => navigation.navigate('Budgeting')}
                style={styles.createBudgetButton}
              >
                Create Budget
              </Button>
            </Surface>
          )}
        </Animated.View>

        {/* Financial Overview - Simplified */}
        <Animated.View style={[animatedStyle, { marginTop: 20 }]}>
          <View style={styles.chartHeader}>
            <Text style={[
              styles.sectionTitle,
              { color: '#333333' }
            ]}>
              Financial Overview
            </Text>
            <View style={styles.periodSelector}>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  selectedPeriod === 'week' && styles.selectedPeriodButton,
                  { backgroundColor: '#FFFFFF' }
                ]}
                onPress={() => setSelectedPeriod('week')}
              >
                <Text style={[
                  styles.periodButtonText,
                  selectedPeriod === 'week' && styles.selectedPeriodButtonText,
                  { color: '#333333' }
                ]}>
                  Week
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  selectedPeriod === 'month' && styles.selectedPeriodButton,
                  { backgroundColor: '#FFFFFF' }
                ]}
                onPress={() => setSelectedPeriod('month')}
              >
                <Text style={[
                  styles.periodButtonText,
                  selectedPeriod === 'month' && styles.selectedPeriodButtonText,
                  { color: '#333333' }
                ]}>
                  Month
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  selectedPeriod === 'year' && styles.selectedPeriodButton,
                  { backgroundColor: '#FFFFFF' }
                ]}
                onPress={() => setSelectedPeriod('year')}
              >
                <Text style={[
                  styles.periodButtonText,
                  selectedPeriod === 'year' && styles.selectedPeriodButtonText,
                  { color: '#333333' }
                ]}>
                  Year
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Surface style={[
            styles.chartCard,
            { backgroundColor: '#FFFFFF' }
          ]}>
            <Text style={[
              styles.chartTitle,
              { color: '#333333' }
            ]}>
              Income vs Expenses
            </Text>
            <Text style={[
              styles.chartDescription,
              { color: '#666666' }
            ]}>
              Summary of your financial activity
            </Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Icon name="arrow-down" size={24} color="#4CAF50" />
                <Text style={styles.statLabel}>Income</Text>
                <Text style={[styles.statValue, { color: '#4CAF50' }]}>
                  {formatAmount(income)}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Icon name="arrow-up" size={24} color="#F44336" />
                <Text style={styles.statLabel}>Expenses</Text>
                <Text style={[styles.statValue, { color: '#F44336' }]}>
                  {formatAmount(expenses)}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Icon name="wallet-outline" size={24} color={balance >= 0 ? "#4CAF50" : "#F44336"} />
                <Text style={styles.statLabel}>Balance</Text>
                <Text style={[styles.statValue, { color: balance >= 0 ? "#4CAF50" : "#F44336" }]}>
                  {formatAmount(balance)}
                </Text>
              </View>
            </View>
            <Button 
              mode="outlined" 
              onPress={() => navigation.navigate('MainTabs', { screen: 'Statistics' })}
              style={styles.viewMoreButton}
            >
              View Detailed Statistics
            </Button>
          </Surface>

          <Surface style={[
            styles.chartCard,
            { backgroundColor: '#FFFFFF', marginTop: 16 }
          ]}>
            <Text style={[
              styles.chartTitle,
              { color: '#333333' }
            ]}>
              Expense Categories
            </Text>
            <Text style={[
              styles.chartDescription,
              { color: '#666666' }
            ]}>
              Where your money is going
            </Text>
            <PieChart
              data={pieChartData}
              width={windowWidth - 48}
              height={180}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </Surface>
        </Animated.View>

        {/* Recent Transactions */}
        <Animated.View style={[animatedStyle, { marginTop: 20 }]}>
          <View style={styles.transactionsHeader}>
            <Text style={[
              styles.sectionTitle,
              { color: '#333333' }
            ]}>
              Recent Transactions
            </Text>
            <Button
              mode="text"
              onPress={() => setShowAllTransactions(!showAllTransactions)}
              labelStyle={{ color: theme.colors.primary }}
            >
              {showAllTransactions ? 'Show Less' : 'View All'}
            </Button>
          </View>

          {recentTransactions.length > 0 ? (
            recentTransactions.map((transaction, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => navigation.navigate('TransactionDetail', { transaction })}
              >
                <Surface
                  style={[
                    styles.transactionCard,
                    { backgroundColor: '#FFFFFF' }
                  ]}
                >
                  <View style={styles.transactionLeft}>
                    <View style={[
                      styles.categoryIcon,
                      { 
                        backgroundColor: transaction.type === 'income' 
                          ? '#E8F5E9' 
                          : '#FFEBEE' 
                      }
                    ]}>
                      <Icon
                        name={transaction.type === 'income' ? 'arrow-down' : 'arrow-up'}
                        size={20}
                        color={transaction.type === 'income' ? '#4CAF50' : '#F44336'}
                      />
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text 
                        style={[
                          styles.transactionTitle,
                          { color: '#333333' }
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {transaction.name || transaction.description || 'Unnamed Transaction'}
                      </Text>
                      <Text style={[
                        styles.transactionDate,
                        { color: '#666666' }
                      ]}>
                        {formatDate(transaction.date)}
                      </Text>
                    </View>
                  </View>
                  <Text 
                    style={[
                      styles.transactionAmount,
                      { 
                        color: transaction.type === 'income' 
                          ? '#4CAF50' 
                          : '#F44336' 
                      }
                    ]}
                    numberOfLines={1}
                  >
                    {transaction.type === 'income' ? '+' : '-'}{formatAmount(transaction.amount)}
                  </Text>
                </Surface>
              </TouchableOpacity>
            ))
          ) : (
            <Surface style={[
              styles.emptyStateCard,
              { backgroundColor: '#FFFFFF' }
            ]}>
              <Text style={[
                styles.emptyStateText,
                { color: '#333333' }
              ]}>
                No transactions yet. Add your first transaction!
              </Text>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('MainTabs', { screen: 'Transactions' })}
                style={[
                  styles.emptyStateButton,
                  { backgroundColor: theme.colors.primary }
                ]}
              >
                Add Transaction
              </Button>
            </Surface>
          )}
        </Animated.View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[
          styles.fab,
          { backgroundColor: theme.colors.primary }
        ]}
        onPress={() => navigation.navigate('MainTabs', { screen: 'Transactions' })}
      >
        <Icon name="plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 14,
    marginTop: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  balanceContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  balanceGradient: {
    borderRadius: 16,
    padding: 16,
  },
  balanceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  lottieContainer: {
    width: 80,
    height: 80,
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  incomeExpenseContainer: {
    flexDirection: 'row',
    marginTop: 16,
    borderRadius: 12,
    padding: 12,
  },
  incomeContainer: {
    flex: 1,
    alignItems: 'center',
  },
  expenseContainer: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: '100%',
    marginHorizontal: 8,
  },
  incomeExpenseLabel: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 4,
  },
  incomeAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  quickActionButton: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  budgetCard: {
    borderRadius: 16,
    padding: 16,
    elevation: 2,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  budgetAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  budgetProgress: {
    height: 8,
    borderRadius: 4,
  },
  budgetRemaining: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'right',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    padding: 2,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  selectedPeriodButton: {
    backgroundColor: '#7B68EE',
  },
  periodButtonText: {
    fontSize: 12,
  },
  selectedPeriodButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  chartCard: {
    borderRadius: 16,
    padding: 16,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  chartDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#E0E0E0',
  },
  viewMoreButton: {
    marginTop: 8,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 3,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  emptyStateCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 2,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyStateButton: {
    borderRadius: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  emptyBudgetText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  createBudgetButton: {
    borderRadius: 8,
  },
});

export default HomeScreen; 