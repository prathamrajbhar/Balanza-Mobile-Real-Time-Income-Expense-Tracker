import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity, 
  Share,
  RefreshControl,
  Platform,
  Dimensions,
  StatusBar,
  Image
} from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  useTheme, 
  Divider, 
  Chip, 
  IconButton,
  Searchbar,
  Portal,
  Dialog,
  Paragraph,
  Surface,
  Avatar
} from 'react-native-paper';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown, FadeInUp, Layout, SlideInRight, SlideInLeft } from 'react-native-reanimated';
import { searchFinancialTips } from '../services/aiService';

const { width } = Dimensions.get('window');

// Categories with their respective icons and colors
const CATEGORIES = [
  { id: 'all', name: 'All Tips', icon: 'view-grid', color: '#5C6BC0' },
  { id: 'saving', name: 'Saving', icon: 'piggy-bank', color: '#26A69A' },
  { id: 'investing', name: 'Investing', icon: 'chart-line', color: '#AB47BC' },
  { id: 'budgeting', name: 'Budgeting', icon: 'calculator', color: '#42A5F5' },
  { id: 'debt', name: 'Debt', icon: 'credit-card', color: '#EF5350' },
  { id: 'income', name: 'Income', icon: 'cash', color: '#66BB6A' },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  contentContainer: {
    flex: 1,
  },
  searchBar: {
    flex: 1,
    elevation: 0,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoriesContainer: {
    maxHeight: 50,
    marginBottom: 12,
    marginTop: 4,
  },
  categoriesContentContainer: {
    paddingHorizontal: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 6,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  selectedCategoryButton: {
    backgroundColor: '#EFF6FF',
  },
  categoryIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingAnimation: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  tipsContainer: {
    flex: 1,
  },
  tipsContentContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  tipCardSurface: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  tipCard: {
    padding: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
    color: '#FFFFFF',
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    color: '#1E293B',
    lineHeight: 24,
  },
  tipDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: '#475569',
    marginBottom: 14,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  actionButtonText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  emptyImage: {
    width: 180,
    height: 180,
    marginBottom: 24,
    opacity: 0.8,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    color: '#1E293B',
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#64748B',
    marginBottom: 24,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  emptyStateButtonsContainer: {
    width: '100%',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  aiSearchEmptyButton: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 4,
  },
  resetButton: {
    borderRadius: 12,
    paddingHorizontal: 20,
    width: '100%',
  },
  fabButton: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  dialogContent: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    paddingVertical: 8,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#92400E',
  },
  dialogActions: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  dialogButton: {
    borderRadius: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 8,
    alignItems: 'center',
  },
  aiSearchButton: {
    marginLeft: 8,
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  aiTipsContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  aiTipsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 12,
  },
  aiLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  aiLoadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  aiLoadingSubText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
  aiTipsContent: {
    marginBottom: 16,
  },
  aiTipCard: {
    marginBottom: 12,
  },
  noAiTipsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  noAiTipsText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  noAiTipsSubText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
  hideAiTipsButton: {
    marginTop: 8,
  },
  aiAdviceContainer: {
    marginVertical: 16,
    paddingHorizontal: 16,
    maxHeight: 550,
    flex: 0,
  },
  aiAdviceCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 6,
    backgroundColor: '#FFFFFF',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  aiAdviceHeader: {
    padding: 18,
  },
  aiAdviceHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiAdviceHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 10,
  },
  aiAdviceScrollContainer: {
    flex: 1,
  },
  aiAdviceScrollContentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  aiAdviceContent: {
    paddingBottom: 16,
  },
  aiAdviceQuestion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F1F5F9',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  aiAdviceQuestionText: {
    fontSize: 15,
    color: '#334155',
    fontWeight: '500',
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  aiAdviceTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 14,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  aiAdviceMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 8,
  },
  divider: {
    backgroundColor: '#E2E8F0',
    height: 1,
    marginBottom: 20,
  },
  aiAdviceText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#334155',
    marginBottom: 20,
    textAlign: 'left',
    letterSpacing: 0.2,
  },
  aiAdviceFooter: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  aiAdviceShareButton: {
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
    paddingVertical: 6,
  },
  hideAiAdviceButton: {
    marginTop: 4,
  },
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  stepNumberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumber: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  stepContent: {
    flex: 1,
  },
  stepText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#1E293B',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  bulletContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  bulletPoint: {
    fontSize: 20,
    color: '#6366F1',
    marginRight: 10,
    marginTop: -2,
  },
  aiAdviceHeaderSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  emptyStateSurface: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 2,
  },
  emptyStateGradient: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiOptionContainer: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: 20,
    elevation: 3,
  },
  aiOptionHeader: {
    backgroundColor: '#6366F1',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiOptionIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 20,
  },
  aiOptionTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 12,
  },
  aiOptionContent: {
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  aiOptionText: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
});

const FinanceTipsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tips, setTips] = useState([]);
  const [filteredTips, setFilteredTips] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiSearchLoading, setAiSearchLoading] = useState(false);
  const [showAiAdvice, setShowAiAdvice] = useState(false);
  const [aiAdvice, setAiAdvice] = useState(null);
  const [isQuestion, setIsQuestion] = useState(false);
  const theme = useTheme();

  // Create dynamic styles that depend on theme
  const dynamicStyles = {
    selectedCategoryText: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    fabButton: {
      backgroundColor: theme.colors.primary,
    }
  };

  // Function to fetch finance tips from Gemini API
  const fetchFinanceTips = async (forceRefresh = false) => {
    if (forceRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // Check if we have cached tips
      const cachedTips = await AsyncStorage.getItem('financeTips');
      const cachedDate = await AsyncStorage.getItem('financeTipsDate');
      const today = new Date().toDateString();

      // Use cached tips if available and not forcing refresh
      if (cachedTips && cachedDate === today && !forceRefresh) {
        const parsedTips = JSON.parse(cachedTips);
        setTips(parsedTips);
        setFilteredTips(parsedTips);
        setError(null);
      } else {
        // Initialize the Gemini API with your API key
        const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyA9nbBPMQy34YYJh6uftKS8tsqxEJUPC8Y';
        const genAI = new GoogleGenerativeAI(API_KEY);
        
        // Use a more capable model for better structure
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        // Enhanced prompt for better structured data with 10 tips
        const prompt = `
          Give me 10 practical financial tips for better money management.
          For each tip, provide:
          1. A short title (3-5 words)
          2. A concise description (1-3 sentences)
          3. A category (one of: saving, investing, budgeting, debt, income)
          4. A difficulty level (beginner, intermediate, advanced)
          
          Format the response in a clear structure where I can identify each tip and its components.
          Each tip should start with "TIP:" and each component should be on a new line.
          Make sure to provide exactly 10 tips with varied categories and difficulty levels.
        `;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Parse the response into structured tip objects
        const tipsList = text.split(/TIP:/).filter(tip => tip.trim().length > 0);
        
        const structuredTips = tipsList.map((tipText, index) => {
          const lines = tipText.trim().split('\n').filter(line => line.trim());
          
          // Extract details (this parsing logic might need adjustment based on actual response format)
          const title = lines[0]?.trim() || `Tip ${index + 1}`;
          const description = lines[1]?.trim() || "No description available";
          
          // Extract category using regex
          const categoryMatch = tipText.match(/category:?\s*([a-z]+)/i);
          const category = categoryMatch ? categoryMatch[1].toLowerCase() : 
                          CATEGORIES[Math.floor(Math.random() * (CATEGORIES.length - 1)) + 1].id;
          
          // Extract difficulty
          const difficultyMatch = tipText.match(/difficulty:?\s*([a-z]+)/i);
          const difficulty = difficultyMatch ? difficultyMatch[1].toLowerCase() : 
                            ["beginner", "intermediate", "advanced"][Math.floor(Math.random() * 3)];
          
          return {
            id: `tip-${Date.now()}-${index}`, // Add timestamp to ensure unique IDs
            title,
            description,
            category,
            difficulty,
            createdAt: new Date().toISOString(),
          };
        });
        
        // Ensure we have exactly 10 tips
        const finalTips = structuredTips.slice(0, 10);
        
        // Store in AsyncStorage for caching
        await AsyncStorage.setItem('financeTips', JSON.stringify(finalTips));
        await AsyncStorage.setItem('financeTipsDate', today);
        
        setTips(finalTips);
        setFilteredTips(finalTips);
      }
      
      // Load favorites
      const savedFavorites = await AsyncStorage.getItem('favoriteTips');
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }
      
    } catch (err) {
      console.error('Error fetching finance tips:', err);
      setError('Failed to load finance tips. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFinanceTips();
  }, []);

  // Filter tips based on selected category and search query
  useEffect(() => {
    let result = [...tips];
    
    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(tip => tip.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        tip => tip.title.toLowerCase().includes(query) || 
               tip.description.toLowerCase().includes(query)
      );
    }
    
    setFilteredTips(result);
  }, [selectedCategory, searchQuery, tips]);

  const onRefresh = useCallback(() => {
    fetchFinanceTips(true);
  }, []);

  const toggleFavorite = async (tipId) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    let newFavorites;
    if (favorites.includes(tipId)) {
      newFavorites = favorites.filter(id => id !== tipId);
    } else {
      newFavorites = [...favorites, tipId];
    }
    
    setFavorites(newFavorites);
    await AsyncStorage.setItem('favoriteTips', JSON.stringify(newFavorites));
  };

  const shareTip = async (tip) => {
    try {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      await Share.share({
        message: `💰 Financial Tip: ${tip.title}\n\n${tip.description}\n\nShared from FinanceApp`,
      });
    } catch (error) {
      console.error('Error sharing tip:', error);
    }
  };

  const renderDifficultyLabel = (difficulty) => {
    // Normalize the difficulty value
    const normalizedDifficulty = (difficulty || '').toLowerCase();
    
    const colors = {
      beginner: {
        bg: '#DCFCE7',
        text: '#14532D'
      },
      intermediate: {
        bg: '#FEF9C3',
        text: '#713F12'
      },
      advanced: {
        bg: '#FEE2E2',
        text: '#7F1D1D'
      }
    };

    // Default colors if difficulty is not recognized
    const defaultColors = {
      bg: '#F3F4F6',
      text: '#4B5563'
    };
    
    const colorScheme = colors[normalizedDifficulty] || defaultColors;
    
    return (
      <View style={[styles.difficultyBadge, { backgroundColor: colorScheme.bg }]}>
        <Text style={[styles.difficultyText, { color: colorScheme.text }]}>
          {normalizedDifficulty ? normalizedDifficulty.charAt(0).toUpperCase() + normalizedDifficulty.slice(1) : 'Unknown'}
        </Text>
      </View>
    );
  };

  const renderCategoryBadge = (categoryId) => {
    const category = CATEGORIES.find(cat => cat.id === categoryId) || CATEGORIES[0];
    return (
      <View style={[styles.categoryBadge, { backgroundColor: category.color + '20' }]}>
        <Icon name={category.icon} size={14} color={category.color} />
        <Text style={[styles.categoryText, { color: category.color }]}>
          {category.name}
        </Text>
      </View>
    );
  };

  const handleCategoryPress = (categoryId) => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
    setSelectedCategory(categoryId);
  };

  // Function to check if the search query is a question
  const checkIfQuestion = (query) => {
    const query_lower = query.toLowerCase().trim();
    // Check if the query is phrased as a question or starts with common question phrases
    return query_lower.includes('?') || 
           query_lower.startsWith('how') || 
           query_lower.startsWith('what') ||
           query_lower.startsWith('why') ||
           query_lower.startsWith('when') ||
           query_lower.startsWith('where') ||
           query_lower.startsWith('which') ||
           query_lower.startsWith('can') ||
           query_lower.startsWith('should') ||
           query_lower.length > 15; // Longer queries are likely questions
  };

  // Handle search submission
  const handleSearch = async (query) => {
    const isQuestionQuery = checkIfQuestion(query);
    setIsQuestion(isQuestionQuery);
    
    if (isQuestionQuery) {
      await getAiAdvice(query);
    }
  };

  // Function to handle AI-powered financial advice
  const getAiAdvice = async (query) => {
    if (!query.trim()) {
      return;
    }
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setAiSearchLoading(true);
      setShowAiAdvice(true);
      
      // Call AI service to get personalized advice
      const advice = await searchFinancialTips(query);
      
      if (advice) {
        setAiAdvice(advice);
        setError(null);
      } else {
        setAiAdvice(null);
        setError('Could not generate advice. Please try a different question.');
      }
    } catch (err) {
      console.error('Error fetching AI financial advice:', err);
      setError('Failed to generate advice. Please try again.');
      setAiAdvice(null);
    } finally {
      setAiSearchLoading(false);
    }
  };
  
  // Clear AI advice when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setShowAiAdvice(false);
      setAiAdvice(null);
      setIsQuestion(false);
    }
  }, [searchQuery]);

  // Helper function to format paragraphs with proper spacing
  const formatAdviceText = (text) => {
    if (!text) return '';
    
    // Clean up the text to ensure proper paragraph breaks
    const cleanedText = text.replace(/\n{3,}/g, '\n\n').trim();
    
    // Split the text by paragraphs
    const paragraphs = cleanedText.split(/\n\n+/);
    
    return (
      <>
        {paragraphs.map((paragraph, index) => {
          // Check if this paragraph is a numbered step or bullet point
          const stepMatch = paragraph.match(/^(\d+)\.\s(.*)/);
          const isBullet = paragraph.match(/^(\*\s|-\s)/);
          
          if (stepMatch) {
            // Render the step with a nice number badge
            const [_, number, content] = stepMatch;
            return (
              <View key={index} style={styles.stepContainer}>
                <View style={styles.stepNumberContainer}>
                  <Text style={styles.stepNumber}>{number}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepText}>{content.trim()}</Text>
                </View>
              </View>
            );
          } else if (isBullet) {
            // Render bullet points
            return (
              <View key={index} style={styles.bulletContainer}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={[styles.aiAdviceText, { marginBottom: index < paragraphs.length - 1 ? 12 : 20 }]}>
                  {paragraph.replace(/^(\*\s|-\s)/, '').trim()}
                </Text>
              </View>
            );
          } else {
            // Regular paragraph
            return (
              <Text 
                key={index} 
                style={[
                  styles.aiAdviceText, 
                  index < paragraphs.length - 1 && { marginBottom: 20 }
                ]}
              >
                {paragraph.trim()}
              </Text>
            );
          }
        })}
      </>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {loading ? (
        <Animated.View 
          style={styles.loadingContainer}
          entering={FadeInUp.duration(400)}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Animated.Text 
            entering={FadeInUp.delay(300).springify()} 
            style={styles.loadingText}
          >
            Gathering financial wisdom...
          </Animated.Text>
        </Animated.View>
      ) : error ? (
        <Animated.View 
          style={styles.emptyContainer}
          entering={FadeInUp.duration(400)}
        >
          <Icon name="alert-circle-outline" size={80} color="#CBD5E1" />
          <Text style={styles.emptyText}>Couldn't Load Tips</Text>
          <Text style={styles.emptySubText}>{error}</Text>
          <Button 
            mode="contained" 
            onPress={() => fetchFinanceTips(true)} 
            style={styles.resetButton}
            buttonColor={theme.colors.primary}
          >
            Try Again
          </Button>
        </Animated.View>
      ) : (
        <View style={[styles.contentContainer, { paddingTop: Platform.OS === 'ios' ? StatusBar.currentHeight || 20 : StatusBar.currentHeight || 0 }]}>
          {/* Search bar */}
          <Animated.View entering={FadeInDown.duration(400)}>
            <View style={styles.searchContainer}>
              <Searchbar
                placeholder="Ask me anything about finance"
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={[styles.searchBar]}
                iconColor={theme.colors.primary}
                placeholderTextColor="#94A3B8"
                inputStyle={{ color: '#334155', fontSize: 15 }}
                onSubmitEditing={() => handleSearch(searchQuery)}
                returnKeyType="search"
              />
              <TouchableOpacity
                onPress={() => handleSearch(searchQuery)}
                style={[styles.aiSearchButton, { backgroundColor: theme.colors.primary }]}
                disabled={!searchQuery.trim() || aiSearchLoading}
              >
                {aiSearchLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Icon name={isQuestion ? "brain" : "magnify"} size={22} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
          
          {/* Categories */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesContainer}
              contentContainerStyle={styles.categoriesContentContainer}
            >
              {CATEGORIES.map((category, index) => (
                <Animated.View 
                  key={category.id}
                  entering={FadeInDown.delay(400 + index * 50).duration(300)}
                >
                  <TouchableOpacity
                    onPress={() => handleCategoryPress(category.id)}
                    style={[
                      styles.categoryButton,
                      selectedCategory === category.id && styles.selectedCategoryButton
                    ]}
                  >
                    <View style={[
                      styles.categoryIcon, 
                      { backgroundColor: category.color + '20' }
                    ]}>
                      <Icon 
                        name={category.icon} 
                        size={14} 
                        color={category.color} 
                      />
                    </View>
                    <Text style={[
                      styles.categoryButtonText,
                      selectedCategory === category.id && dynamicStyles.selectedCategoryText
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>
          
          {/* AI Advice Section */}
          {showAiAdvice && (
            <Animated.View 
              style={styles.aiAdviceContainer}
              entering={FadeInDown.duration(400)}
              layout={Layout.springify()}
            >
              {aiSearchLoading ? (
                <Surface style={styles.aiAdviceCard}>
                  <LinearGradient
                    colors={['#6366F1', '#7C3AED']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.aiAdviceHeader}
                  >
                    <View style={styles.aiAdviceHeaderContent}>
                      <Avatar.Icon 
                        size={40} 
                        icon="brain" 
                        color="#FFFFFF" 
                        style={{backgroundColor: 'rgba(255,255,255,0.2)'}} 
                      />
                      <View style={{marginLeft: 10}}>
                        <Text style={styles.aiAdviceHeaderText}>AI Financial Advice</Text>
                        <Text style={styles.aiAdviceHeaderSubtext}>Generating your insights...</Text>
                      </View>
                    </View>
                  </LinearGradient>
                  <View style={styles.aiLoadingContainer}>
                    <ActivityIndicator size="large" color="#6366F1" />
                    <Text style={styles.aiLoadingText}>
                      Analyzing your financial question...
                    </Text>
                    <Text style={styles.aiLoadingSubText}>
                      Creating personalized advice just for you
                    </Text>
                  </View>
                </Surface>
              ) : aiAdvice ? (
                <Surface style={styles.aiAdviceCard}>
                  <LinearGradient
                    colors={['#6366F1', '#7C3AED']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.aiAdviceHeader}
                  >
                    <View style={styles.aiAdviceHeaderContent}>
                      <Avatar.Icon 
                        size={40} 
                        icon="brain" 
                        color="#FFFFFF" 
                        style={{backgroundColor: 'rgba(255,255,255,0.2)'}} 
                      />
                      <View style={{marginLeft: 10}}>
                        <Text style={styles.aiAdviceHeaderText}>AI Financial Advice</Text>
                        <Text style={styles.aiAdviceHeaderSubtext}>Personalized suggestions</Text>
                      </View>
                    </View>
                  </LinearGradient>
                  
                  <ScrollView 
                    style={styles.aiAdviceScrollContainer} 
                    contentContainerStyle={styles.aiAdviceScrollContentContainer}
                    showsVerticalScrollIndicator={true}
                    bounces={false}
                  >
                    <View style={styles.aiAdviceContent}>
                      <View style={styles.aiAdviceQuestion}>
                        <Icon name="help-circle" size={22} color="#64748B" />
                        <Text style={styles.aiAdviceQuestionText}>{aiAdvice.originalQuery}</Text>
                      </View>
                      
                      <Text style={styles.aiAdviceTitle}>{aiAdvice.title}</Text>
                      
                      <View style={styles.aiAdviceMetaContainer}>
                        {renderCategoryBadge(aiAdvice.category)}
                        {renderDifficultyLabel(aiAdvice.difficulty)}
                      </View>
                      
                      <Divider style={styles.divider} />
                      
                      {formatAdviceText(aiAdvice.advice)}
                    </View>
                  </ScrollView>
                  
                  <View style={styles.aiAdviceFooter}>
                    <Button 
                      mode="contained" 
                      icon="share-variant"
                      onPress={() => shareTip({
                        title: aiAdvice.title,
                        description: aiAdvice.advice
                      })}
                      style={styles.aiAdviceShareButton}
                      buttonColor={theme.colors.primary}
                    >
                      Share Advice
                    </Button>
                    
                    <Button
                      mode="text"
                      onPress={() => {
                        setShowAiAdvice(false);
                        setAiAdvice(null);
                      }}
                      style={styles.hideAiAdviceButton}
                    >
                      Close
                    </Button>
                  </View>
                </Surface>
              ) : (
                <Surface style={styles.aiAdviceCard}>
                  <LinearGradient
                    colors={['#EF4444', '#F97316']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.aiAdviceHeader}
                  >
                    <View style={styles.aiAdviceHeaderContent}>
                      <Avatar.Icon 
                        size={40} 
                        icon="alert-circle" 
                        color="#FFFFFF" 
                        style={{backgroundColor: 'rgba(255,255,255,0.2)'}} 
                      />
                      <View style={{marginLeft: 10}}>
                        <Text style={styles.aiAdviceHeaderText}>Advice Unavailable</Text>
                        <Text style={styles.aiAdviceHeaderSubtext}>Something went wrong</Text>
                      </View>
                    </View>
                  </LinearGradient>
                  <View style={styles.noAiTipsContainer}>
                    <Icon name="help-circle" size={50} color="#CBD5E1" />
                    <Text style={styles.noAiTipsText}>Could not generate advice</Text>
                    <Text style={styles.noAiTipsSubText}>Try rephrasing your question or asking something different</Text>
                    <Button
                      mode="outlined"
                      onPress={() => {
                        setShowAiAdvice(false);
                        setAiAdvice(null);
                      }}
                      style={{marginTop: 16}}
                    >
                      Close
                    </Button>
                  </View>
                </Surface>
              )}
            </Animated.View>
          )}

          {/* Filtered Tips List */}
          {!showAiAdvice && filteredTips.length > 0 ? (
            <ScrollView 
              style={styles.tipsContainer}
              contentContainerStyle={styles.tipsContentContainer}
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
              {filteredTips.map((tip, index) => {
                const categoryColor = CATEGORIES.find(cat => cat.id === tip.category)?.color || '#5C6BC0';
                
                return (
                  <Animated.View 
                    key={tip.id} 
                    entering={FadeInDown.delay(500 + index * 80).springify()}
                    layout={Layout.springify()}
                  >
                    <Surface style={styles.tipCardSurface}>
                      {/* Top color bar based on category */}
                      <LinearGradient
                        colors={[categoryColor, categoryColor + '90']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.tipCardImage}
                      />
                      
                      <View style={styles.tipCard}>
                        <View style={styles.cardHeader}>
                          {renderCategoryBadge(tip.category)}
                          {renderDifficultyLabel(tip.difficulty)}
                        </View>
                        
                        <Text style={styles.tipTitle}>{tip.title}</Text>
                        <Text style={styles.tipDescription}>{tip.description}</Text>
                        
                        <View style={styles.cardActions}>
                          <TouchableOpacity 
                            style={styles.actionButton}
                            onPress={() => toggleFavorite(tip.id)}
                          >
                            <Icon 
                              name={favorites.includes(tip.id) ? "heart" : "heart-outline"} 
                              size={16} 
                              color={favorites.includes(tip.id) ? theme.colors.error : '#64748B'} 
                            />
                            <Text style={styles.actionButtonText}>
                              {favorites.includes(tip.id) ? "Saved" : "Save"}
                            </Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity 
                            style={styles.actionButton}
                            onPress={() => shareTip(tip)}
                          >
                            <Icon name="share-variant" size={16} color="#64748B" />
                            <Text style={styles.actionButtonText}>Share</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </Surface>
                  </Animated.View>
                );
              })}
            </ScrollView>
          ) : !showAiAdvice ? (
            <Animated.View 
              style={styles.emptyContainer}
              entering={FadeInUp.duration(400)}
            >
              <Surface style={styles.emptyStateSurface}>
                <LinearGradient
                  colors={['#F1F5F9', '#EFF6FF']}
                  style={styles.emptyStateGradient}
                >
                  <Icon name="text-search" size={70} color="#CBD5E1" />
                  <Text style={styles.emptyText}>No matching tips found</Text>
              <Text style={styles.emptySubText}>
                    We couldn't find any tips matching "{searchQuery}".
                    Get AI-powered personalized advice instead!
                  </Text>
                  
                  <Surface style={styles.aiOptionContainer}>
                    <View style={styles.aiOptionHeader}>
                      <Icon name="brain" size={22} color="#FFFFFF" style={styles.aiOptionIcon} />
                      <Text style={styles.aiOptionTitle}>Get Smart Financial Advice</Text>
                    </View>
                    <View style={styles.aiOptionContent}>
                      <Text style={styles.aiOptionText}>
                        Our AI can analyze your query and provide personalized financial guidance tailored to your needs.
              </Text>
              <Button 
                mode="contained" 
                        icon="lightbulb-on"
                        onPress={() => getAiAdvice(searchQuery)}
                        style={styles.aiSearchEmptyButton}
                        buttonColor="#6366F1"
                      >
                        Get AI Advice
                      </Button>
                    </View>
                  </Surface>
                  
                  <Button 
                    mode="outlined" 
                    icon="refresh"
                onPress={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                style={styles.resetButton}
              >
                    Reset Search
              </Button>
                </LinearGradient>
              </Surface>
            </Animated.View>
          ) : null}
        </View>
      )}
      
      {!loading && !error && (
        <Animated.View 
          entering={FadeInUp.delay(800).duration(500)}
        >
          <TouchableOpacity 
            style={[styles.fabButton, dynamicStyles.fabButton]}
            onPress={() => fetchFinanceTips(true)}
          >
            <Icon name="refresh" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

export default FinanceTipsScreen; 