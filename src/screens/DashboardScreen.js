import React, { useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, Dimensions, TouchableOpacity, StatusBar } from 'react-native';
import { Text, Chip, IconButton, Surface } from 'react-native-paper';
import { LineChart, PieChart } from 'react-native-chart-kit';
import DashboardCard from '../components/DashboardCard';
import { useTransactions } from '../contexts/TransactionContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useTheme } from '@react-navigation/native';
import { useUser } from '../contexts/UserContext';
import { useNavigation } from '@react-navigation/native';
import { Icon } from 'react-native-elements';

const { width } = Dimensions.get('window');

const DashboardScreen = () => {
  const { getStatistics, transactions } = useTransactions();
  const { formatAmount } = useCurrency();
  const [timeRange, setTimeRange] = useState('month');
  const stats = getStatistics(timeRange);
  const theme = useTheme();
  const user = useUser();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // Colors for pie chart segments
  const CATEGORY_COLORS = {
    Food: '#FF5252',
    Transport: '#FF9800',
    Shopping: '#4CAF50',
    Bills: '#2196F3',
    Entertainment: '#9C27B0',
    Health: '#009688',
    Education: '#795548',
    Salary: '#607D8B',
    Investment: '#3F51B5',
    Other: '#757575'
  };

  // Helper function to safely convert any date format to JS Date
  const toJSDate = (dateValue) => {
    try {
      if (!dateValue) return new Date();
      
      if (typeof dateValue.toDate === 'function') {
        return dateValue.toDate();
      }
      
      if (dateValue instanceof Date) {
        return dateValue;
      }
      
      return new Date(dateValue);
    } catch (error) {
      console.error('Error converting to JS Date:', error);
      return new Date();
    }
  };

  // Process transactions to get expense categories for pie chart
  const expensesByCategory = useMemo(() => {
    // Create an object to store expenses by category
    const categorizedExpenses = {};
    
    // Get date range based on selected time period
    const now = new Date();
    let startDate;
    
    switch(timeRange) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
    }
    
    // Filter expenses within the selected time range
    const filteredExpenses = transactions.filter(t => {
      const transactionDate = toJSDate(t.date);
      return t.type === 'expense' && transactionDate >= startDate;
    });
    
    // Sum expenses by category
    filteredExpenses.forEach(transaction => {
      const category = transaction.category || 'Other';
      const amount = parseFloat(transaction.amount) || 0;
      
      if (!categorizedExpenses[category]) {
        categorizedExpenses[category] = 0;
      }
      categorizedExpenses[category] += amount;
    });
    
    return categorizedExpenses;
  }, [transactions, timeRange]);

  // Generate pie chart data from the expense categories
  const pieChartData = useMemo(() => {
    // Convert the expenses by category to the format needed for the pie chart
    const data = Object.entries(expensesByCategory)
      .filter(([_, amount]) => amount > 0) // Filter out any zero amounts
      .sort((a, b) => b[1] - a[1]) // Sort by highest expense first
      .slice(0, 5) // Take top 5 categories for better readability
      .map(([category, amount]) => ({
        name: category,
        population: amount,
        color: CATEGORY_COLORS[category] || '#757575',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      }));
      
    // If no data, add a placeholder
    if (data.length === 0) {
      data.push({
        name: 'No Expenses',
        population: 1,
        color: '#E0E0E0',
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      });
    }
      
    return data;
  }, [expensesByCategory]);

  // Generate line chart data for income/expense over time
  const getMonthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const lastSixMonths = [];
    
    // Get labels for the last 6 months
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      lastSixMonths.push(months[monthIndex]);
    }
    
    // Initialize data for income and expenses
    const incomeData = Array(6).fill(0);
    const expenseData = Array(6).fill(0);
    
    // Process transaction data
    transactions.forEach(transaction => {
      const transactionDate = toJSDate(transaction.date);
      const transactionMonth = transactionDate.getMonth();
      const transactionYear = transactionDate.getFullYear();
      const currentYear = new Date().getFullYear();
      
      // Only include transactions from the last 6 months
      for (let i = 0; i < 6; i++) {
        const monthIndex = (currentMonth - i + 12) % 12;
        const yearOffset = monthIndex > currentMonth ? -1 : 0;
        
        if (transactionMonth === monthIndex && 
            transactionYear === currentYear + yearOffset) {
          const amount = Number(transaction.amount || 0);
          if (transaction.type === 'income') {
            incomeData[5-i] += amount;
          } else if (transaction.type === 'expense') {
            expenseData[5-i] += amount;
          }
          break;
        }
      }
    });
    
    return {
      labels: lastSixMonths,
      incomeData,
      expenseData
    };
  }, [transactions]);

  const chartConfig = {
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    color: (opacity = 1) => `rgba(98, 0, 238, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
  };

  const lineChartData = {
    labels: getMonthlyData.labels,
    datasets: [
      {
        data: getMonthlyData.incomeData,
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
        strokeWidth: 2,
      },
      {
        data: getMonthlyData.expenseData,
        color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`,
        strokeWidth: 2,
      }
    ],
    legend: ["Income", "Expense"]
  };

  // Calculate total expenses for the pie chart
  const totalExpenses = Object.values(expensesByCategory).reduce((sum, amount) => sum + amount, 0);

  const renderBalanceCard = () => (
    <View style={styles.balanceCard}>
      <Text style={styles.balanceTitle}>Net Balance</Text>
      <Text style={[
        styles.balanceAmount,
        { color: stats.netBalance >= 0 ? '#4CAF50' : '#F44336' }
      ]}>
        {formatAmount(stats.netBalance)}
      </Text>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.cardsContainer}>
      <DashboardCard
        title="Total Income"
        amount={stats.totalIncome}
        icon="arrow-up-circle"
        type="income"
      />
      <DashboardCard
        title="Total Expenses"
        amount={stats.totalExpenses}
        icon="arrow-down-circle"
        type="expense"
      />
    </View>
  );

  const renderRecentTransactions = () => (
    <View style={styles.transactionPlaceholder}>
      <Icon name="receipt" size={48} color={theme.colors.outline} />
      <Text style={styles.placeholderText}>No recent transactions</Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={theme.colors.primary} 
      />
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Balanza</Text>
          <Text style={styles.headerSubtitle}>Welcome back, {user?.displayName || 'User'}</Text>
        </View>
        <IconButton
          icon="logout"
          size={24}
          iconColor={theme.colors.primary}
          onPress={logout}
        />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {renderBalanceCard()}
        {renderQuickActions()}
        
        {/* Recent Transactions Section */}
        <Surface style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {/* Placeholder for transactions list */}
          {renderRecentTransactions()}
        </Surface>
      </ScrollView>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Income vs Expenses (6 Months)</Text>
        <LineChart
          data={lineChartData}
          width={width - 32}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          legend={["Income", "Expense"]}
        />
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Expense Breakdown</Text>
        {pieChartData.length > 0 ? (
          <>
            <PieChart
              data={pieChartData}
              width={width - 32}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
              style={styles.chart}
            />
            <View style={styles.categoryList}>
              {pieChartData.map((item, index) => (
                <View key={index} style={styles.categoryItem}>
                  <View style={[styles.categoryDot, { backgroundColor: item.color }]} />
                  <Text style={styles.categoryName}>{item.name}</Text>
                  <Text style={styles.categoryAmount}>
                    {formatAmount(item.population)} 
                    ({((item.population / totalExpenses) * 100).toFixed(1)}%)
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.emptyChart}>
            <Text style={styles.emptyChartText}>No expense data available</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fa',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  timeRangeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  activeTimeRangeTab: {
    backgroundColor: '#2196F3',
  },
  timeRangeText: {
    fontSize: 14,
    color: '#757575',
  },
  activeTimeRangeText: {
    color: 'white',
    fontWeight: '500',
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 8,
  },
  balanceCard: {
    margin: 16,
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 4,
  },
  balanceTitle: {
    fontSize: 16,
    color: '#666',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 8,
  },
  chartContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 4,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 16,
  },
  emptyChart: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartText: {
    color: '#757575',
    fontSize: 14,
  },
  categoryList: {
    marginTop: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryName: {
    flex: 1,
    fontSize: 14,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  transactionPlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#757575',
    fontSize: 14,
  },
});

export default DashboardScreen; 