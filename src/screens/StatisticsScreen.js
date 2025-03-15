import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Surface, Text, useTheme, Card, Divider, IconButton, ActivityIndicator, Snackbar } from 'react-native-paper';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { useTransactions } from '../contexts/TransactionContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Constants
const CHART_WIDTH = 320;
const CHART_HEIGHT = 180;
const PIE_CHART_HEIGHT = 200;
const TIMEOUT_DELAY = 300;
const MAX_CATEGORIES = 5;

// Custom error logger for production
const logError = (error, context = '') => {
  if (__DEV__) {
    console.error(`${context}: `, error);
  } else {
    console.error(`${context}: `, error.message);
  }
};

const StatisticsScreen = () => {
  // Contexts and states
  const { transactions } = useTransactions();
  const { formatAmount } = useCurrency();
  const [timeRange, setTimeRange] = useState('month');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processedData, setProcessedData] = useState({
    dailyData: {},
    expensesByCategory: {},
    incomeByCategory: {},
    totalIncome: 0,
    totalExpense: 0,
    maxDailyAmount: 0,
  });
  const theme = useTheme();

  // Modern color palette
  const colors = useMemo(() => ({
    income: '#4CAF50',
    expense: '#F44336',
    savings: '#2196F3',
    categories: [
      '#2196F3', '#FF9800', '#9C27B0', '#4CAF50', '#F44336',
      '#009688', '#673AB7', '#FFC107', '#795548', '#607D8B'
    ]
  }), []);

  const chartConfig = useMemo(() => ({
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.7,
    decimalPlaces: 0,
    useShadowColorFromDataset: false,
    labelColor: () => theme.colors.text,
    propsForLabels: {
      fontSize: 10,
    },
  }), [theme.colors.text]);

  // Safe date conversion with error handling
  const getJSDate = useCallback((dateValue) => {
    try {
      if (!dateValue) return new Date();
      if (typeof dateValue.toDate === 'function') return dateValue.toDate();
      if (dateValue instanceof Date) return dateValue;
      return new Date(dateValue);
    } catch (error) {
      logError(error, 'Error converting date');
      return new Date();
    }
  }, []);

  const formatDateToISOString = useCallback((dateValue) => {
    try {
      const jsDate = getJSDate(dateValue);
      return jsDate.toISOString().split('T')[0];
    } catch (error) {
      logError(error, 'Error formatting date to ISO string');
      return 'unknown-date';
    }
  }, [getJSDate]);

  const formatDateLabel = useCallback((dateStr) => {
    try {
      const date = new Date(dateStr);
      if (timeRange === 'week') {
        return date.toLocaleDateString(undefined, { weekday: 'short' });
      } else if (timeRange === 'month') {
        return date.getDate().toString();
      } else {
        return date.toLocaleDateString(undefined, { month: 'short' });
      }
    } catch (error) {
      logError(error, 'Error formatting date label');
      return '';
    }
  }, [timeRange]);

  const processTransactions = useCallback(() => {
    try {
      const filtered = transactions.filter((t) => {
        try {
          const date = getJSDate(t.date);
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
          
          switch (timeRange) {
            case 'week': return date >= oneWeekAgo;
            case 'month': return date >= oneMonthAgo;
            case 'year': return date >= oneYearAgo;
            default: return true;
          }
        } catch (error) {
          logError(error, 'Error filtering transaction');
          return false;
        }
      });

      const dailyData = {};
      const expensesByCategory = {};
      const incomeByCategory = {};
      let totalIncome = 0;
      let totalExpense = 0;
      let maxDailyAmount = 0;

      filtered.forEach((t) => {
        try {
          const dateStr = formatDateToISOString(t.date);
          
          if (!dailyData[dateStr]) {
            dailyData[dateStr] = { income: 0, expense: 0 };
          }

          if (t.type === 'expense') {
            dailyData[dateStr].expense += t.amount;
            expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
            totalExpense += t.amount;
          } else {
            dailyData[dateStr].income += t.amount;
            incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
            totalIncome += t.amount;
          }

          const dailyTotal = dailyData[dateStr].income + dailyData[dateStr].expense;
          if (dailyTotal > maxDailyAmount) {
            maxDailyAmount = dailyTotal;
          }
        } catch (error) {
          logError(error, 'Error processing transaction');
        }
      });

      return {
        dailyData,
        expensesByCategory,
        incomeByCategory,
        totalIncome,
        totalExpense,
        maxDailyAmount,
      };
    } catch (error) {
      logError(error, 'Error in processTransactions');
      setError('Failed to process transactions. Please try again.');
      return {
        dailyData: {},
        expensesByCategory: {},
        incomeByCategory: {},
        totalIncome: 0,
        totalExpense: 0,
        maxDailyAmount: 0,
      };
    }
  }, [transactions, timeRange, getJSDate, formatDateToISOString]);

  // Use effect to process data when timeRange or transactions change
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    
    // Small delay to show loading state for better UX
    const timer = setTimeout(() => {
      try {
        const data = processTransactions();
        setProcessedData(data);
        setIsLoading(false);
      } catch (error) {
        logError(error, 'Error processing data');
        setError('Failed to load statistics. Please try again later.');
        setIsLoading(false);
      }
    }, TIMEOUT_DELAY);
    
    return () => clearTimeout(timer);
  }, [processTransactions]);

  const {
    dailyData,
    expensesByCategory,
    incomeByCategory,
    totalIncome,
    totalExpense,
    maxDailyAmount,
  } = processedData;

  // Get top spending categories
  const topCategories = useMemo(() => {
    try {
      return Object.entries(expensesByCategory)
        .sort((a, b) => b[1] - a[1])
        .slice(0, MAX_CATEGORIES)
        .map(([category, amount], index) => ({
          category,
          amount,
          color: colors.categories[index % colors.categories.length],
          percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0
        }));
    } catch (error) {
      logError(error, 'Error calculating top categories');
      return [];
    }
  }, [expensesByCategory, totalExpense, colors.categories]);

  // Prepare pie chart data
  const pieChartData = useMemo(() => {
    try {
      return Object.entries(expensesByCategory)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([category, amount], index) => ({
          name: category,
          population: amount,
          color: colors.categories[index % colors.categories.length],
          legendFontColor: theme.colors.text,
          legendFontSize: 11,
        }));
    } catch (error) {
      logError(error, 'Error preparing pie chart data');
      return [];
    }
  }, [expensesByCategory, theme.colors.text, colors.categories]);

  // Prepare bar chart data
  const barChartData = useMemo(() => {
    try {
      // Get the most recent dates
      const sortedDates = Object.keys(dailyData).sort();
      const recentDates = sortedDates.slice(-7);
      
      return {
        labels: recentDates.map(date => formatDateLabel(date)),
        datasets: [
          {
            data: recentDates.map(date => (dailyData[date]?.income || 0)),
            color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
            name: 'Income',
          },
          {
            data: recentDates.map(date => (dailyData[date]?.expense || 0)),
            color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`,
            name: 'Expense',
          },
        ],
        legend: ['Income', 'Expense'],
      };
    } catch (error) {
      logError(error, 'Error preparing bar chart data');
      return {
        labels: [],
        datasets: [
          { data: [], color: () => 'rgba(76, 175, 80, 1)', name: 'Income' },
          { data: [], color: () => 'rgba(244, 67, 54, 1)', name: 'Expense' }
        ],
        legend: ['Income', 'Expense'],
      };
    }
  }, [dailyData, formatDateLabel]);

  const savingsRate = useMemo(() => 
    totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0
  , [totalIncome, totalExpense]);
  
  const netBalance = useMemo(() => 
    totalIncome - totalExpense
  , [totalIncome, totalExpense]);

  // Handle time range change
  const handleTimeRangeChange = useCallback((range) => {
    setTimeRange(range);
  }, []);

  const dismissError = useCallback(() => {
    setError(null);
  }, []);

  // Handle retry if data loading fails
  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    const timer = setTimeout(() => {
      try {
        const data = processTransactions();
        setProcessedData(data);
        setIsLoading(false);
      } catch (error) {
        logError(error, 'Error retrying data processing');
        setError('Failed to load statistics. Please try again.');
        setIsLoading(false);
      }
    }, TIMEOUT_DELAY);
    return () => clearTimeout(timer);
  }, [processTransactions]);

  // Financial Summary component
  const FinancialSummary = () => (
    <Card style={styles.summaryCard}>
      <View style={styles.summaryContent}>
        <View style={styles.summaryColumn}>
          <Text style={styles.summaryLabel}>Income</Text>
          <Text style={[styles.summaryValue, styles.incomeText]}>
            {formatAmount(totalIncome)}
          </Text>
        </View>
        
        <View style={styles.summaryDivider} />
        
        <View style={styles.summaryColumn}>
          <Text style={styles.summaryLabel}>Expense</Text>
          <Text style={[styles.summaryValue, styles.expenseText]}>
            {formatAmount(totalExpense)}
          </Text>
        </View>
        
        <View style={styles.summaryDivider} />
        
        <View style={styles.summaryColumn}>
          <Text style={styles.summaryLabel}>Balance</Text>
          <Text style={[
            styles.summaryValue,
            netBalance >= 0 ? styles.incomeText : styles.expenseText
          ]}>
            {formatAmount(netBalance)}
          </Text>
        </View>
      </View>
    </Card>
  );

  // Time Period Selector component
  const TimePeriodSelector = () => (
    <View style={styles.timeRangeContainer}>
      <Text style={styles.sectionTitle}>Time Period</Text>
      <View style={styles.timeRangeTabs}>
        <TouchableOpacity
          style={[
            styles.timeRangeTab,
            timeRange === 'week' && styles.activeTimeRangeTab
          ]}
          onPress={() => handleTimeRangeChange('week')}
        >
          <Text
            style={[
              styles.timeRangeText,
              timeRange === 'week' && styles.activeTimeRangeText
            ]}
          >
            Week
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.timeRangeTab,
            timeRange === 'month' && styles.activeTimeRangeTab
          ]}
          onPress={() => handleTimeRangeChange('month')}
        >
          <Text
            style={[
              styles.timeRangeText,
              timeRange === 'month' && styles.activeTimeRangeText
            ]}
          >
            Month
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.timeRangeTab,
            timeRange === 'year' && styles.activeTimeRangeTab
          ]}
          onPress={() => handleTimeRangeChange('year')}
        >
          <Text
            style={[
              styles.timeRangeText,
              timeRange === 'year' && styles.activeTimeRangeText
            ]}
          >
            Year
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Empty Chart State
  const EmptyChartState = ({ title, icon }) => (
    <View style={styles.emptyChartContainer}>
      <MaterialCommunityIcons name={icon} size={36} color="#ccc" />
      <Text style={styles.emptyChartText}>No data available</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading statistics...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={40} color={theme.colors.error} />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRetry}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Time Period Selector */}
          <TimePeriodSelector />
          
          {/* Financial Summary */}
          <FinancialSummary />
          
          {/* Income vs Expense Chart */}
          <Card style={styles.chartCard}>
            <Text style={styles.sectionTitle}>Income vs Expense</Text>
            {barChartData.datasets[0].data.length > 0 ? (
              <View style={styles.chartContainer}>
                <BarChart
                  data={barChartData}
                  width={CHART_WIDTH}
                  height={CHART_HEIGHT}
                  chartConfig={chartConfig}
                  fromZero
                  showValuesOnTopOfBars={false}
                  withInnerLines={false}
                  withHorizontalLabels={true}
                  segments={4}
                  style={styles.chart}
                />
              </View>
            ) : (
              <EmptyChartState title="Income vs Expense" icon="chart-bar" />
            )}
          </Card>
          
          {/* Spending by Category */}
          <Card style={styles.chartCard}>
            <Text style={styles.sectionTitle}>Spending by Category</Text>
            {pieChartData.length > 0 ? (
              <View style={styles.chartContainer}>
                <PieChart
                  data={pieChartData}
                  width={CHART_WIDTH}
                  height={PIE_CHART_HEIGHT}
                  chartConfig={chartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="10"
                  center={[10, 0]}
                  absolute
                />
              </View>
            ) : (
              <EmptyChartState title="Expense Breakdown" icon="chart-pie" />
            )}
          </Card>
          
          {/* Top Spending Categories */}
          <Card style={styles.chartCard}>
            <Text style={styles.sectionTitle}>Top Spending Categories</Text>
            {topCategories.length > 0 ? (
              <View style={styles.categoriesList}>
                {topCategories.map((item, index) => (
                  <View key={index} style={styles.categoryItem}>
                    <View style={styles.categoryLeft}>
                      <View style={[styles.categoryDot, { backgroundColor: item.color }]} />
                      <Text style={styles.categoryName}>{item.category}</Text>
                    </View>
                    <View style={styles.categoryRight}>
                      <Text style={styles.categoryAmount}>{formatAmount(item.amount)}</Text>
                      <Text style={styles.categoryPercentage}>{item.percentage.toFixed(1)}%</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <EmptyChartState title="Top Categories" icon="format-list-bulleted" />
            )}
          </Card>
          
          {/* Key Insights */}
          <Card style={styles.chartCard}>
            <Text style={styles.sectionTitle}>Key Insights</Text>
            <View style={styles.insightsList}>
              {savingsRate !== 0 && (
                <View style={styles.insightItem}>
                  <View style={styles.insightIconContainer}>
                    <MaterialCommunityIcons 
                      name={savingsRate > 0 ? "piggy-bank" : "alert-circle"} 
                      size={20} 
                      color={savingsRate > 0 ? "#4CAF50" : "#F44336"} 
                    />
                  </View>
                  <Text style={styles.insightText}>
                    {savingsRate > 20 
                      ? `Great job! Your savings rate is ${savingsRate.toFixed(1)}%.` 
                      : savingsRate > 0 
                        ? `Your savings rate is ${savingsRate.toFixed(1)}%. Try to aim for 20%.` 
                        : `You're spending more than you earn. Consider reducing expenses.`}
                  </Text>
                </View>
              )}
              
              {topCategories.length > 0 && (
                <View style={styles.insightItem}>
                  <View style={styles.insightIconContainer}>
                    <MaterialCommunityIcons name="trending-up" size={20} color="#2196F3" />
                  </View>
                  <Text style={styles.insightText}>
                    Your highest spending category is {topCategories[0].category} at {formatAmount(topCategories[0].amount)} ({topCategories[0].percentage.toFixed(1)}% of expenses).
                  </Text>
                </View>
              )}
              
              {netBalance >= 0 && (
                <View style={styles.insightItem}>
                  <View style={styles.insightIconContainer}>
                    <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
                  </View>
                  <Text style={styles.insightText}>
                    You're keeping a positive balance. Keep it up!
                  </Text>
                </View>
              )}
            </View>
          </Card>
        </ScrollView>
      )}
      
      <Snackbar
        visible={!!error}
        onDismiss={dismissError}
        action={{
          label: 'Dismiss',
          onPress: dismissError,
        }}
        duration={3000}
      >
        {error}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#2196F3',
    borderRadius: 4,
  },
  retryText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  timeRangeContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    color: '#424242',
  },
  timeRangeTabs: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  timeRangeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTimeRangeTab: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
  },
  timeRangeText: {
    fontSize: 14,
    color: '#757575',
  },
  activeTimeRangeText: {
    color: 'white',
    fontWeight: '500',
  },
  summaryCard: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 1,
  },
  summaryContent: {
    flexDirection: 'row',
    padding: 16,
  },
  summaryColumn: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#eee',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 8,
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
  chartCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    elevation: 1,
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  chart: {
    borderRadius: 8,
  },
  emptyChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyChartText: {
    marginTop: 8,
    color: '#757575',
  },
  categoriesList: {
    marginTop: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 14,
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  insightsList: {
    marginTop: 8,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
  },
  insightIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
  },
});

export default StatisticsScreen; 