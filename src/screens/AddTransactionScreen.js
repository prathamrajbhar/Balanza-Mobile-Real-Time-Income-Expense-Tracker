import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform, Alert, Image } from 'react-native';
import {
  TextInput,
  Button,
  SegmentedButtons,
  Text,
  Surface,
  IconButton,
  Chip,
  ActivityIndicator,
  useTheme,
  Menu,
  Snackbar,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useTransactions } from '../contexts/TransactionContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { suggestTransactionCategory } from '../services/aiService';

const categories = [
  { id: 'food', label: 'Food', icon: 'food' },
  { id: 'transport', label: 'Transport', icon: 'car' },
  { id: 'shopping', label: 'Shopping', icon: 'shopping' },
  { id: 'entertainment', label: 'Entertainment', icon: 'movie' },
  { id: 'bills', label: 'Bills', icon: 'file-document' },
  { id: 'salary', label: 'Salary', icon: 'cash' },
  { id: 'other', label: 'Other', icon: 'dots-horizontal' },
];

const AddTransactionScreen = ({ navigation, route }) => {
  const theme = useTheme();
  const { addTransaction, updateTransaction } = useTransactions();
  const { currency } = useCurrency();
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [receiptImage, setReceiptImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [menuVisible, setMenuVisible] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [timerRef, setTimerRef] = useState(null);
  
  // Check if we're editing an existing transaction
  const editMode = route.params?.transaction;
  
  useEffect(() => {
    if (editMode) {
      const transaction = route.params.transaction;
      setType(transaction.type);
      setAmount(transaction.amount.toString());
      setCategory(transaction.category);
      setName(transaction.name || '');
      setNote(transaction.note || '');
      setDate(new Date(transaction.date));
      if (transaction.receiptUrl) {
        setReceiptImage({ uri: transaction.receiptUrl });
      }
    }
  }, [route.params]);

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const pickImage = async () => {
    setMenuVisible(false);
    Alert.alert(
      'Feature Under Progress',
      'Receipt upload functionality is currently under development. This feature will be available soon!',
      [{ text: 'OK' }]
    );
  };

  const takePhoto = async () => {
    setMenuVisible(false);
    Alert.alert(
      'Feature Under Progress',
      'Receipt upload functionality is currently under development. This feature will be available soon!',
      [{ text: 'OK' }]
    );
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }
    
    if (!category) {
      newErrors.category = 'Category is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors in the form');
      return;
    }

    setLoading(true);
    try {
      const transactionData = {
        type,
        amount: parseFloat(amount),
        category,
        name,
        note,
        date,
      };
      
      if (editMode) {
        await updateTransaction(
          route.params.transaction.id,
          transactionData,
          receiptImage && receiptImage.uri !== route.params.transaction.receiptUrl ? receiptImage : null
        );
        Alert.alert(
          'Transaction Updated',
          `Successfully updated transaction:
          
Amount: ${currency.symbol}${amount}
Category: ${category}
${name ? `Name: ${name}` : ''}
Date: ${date.toLocaleDateString()}`,
          [
            {
              text: 'Done',
              onPress: () => navigation.goBack(),
              style: 'default'
            }
          ],
          { cancelable: false }
        );
      } else {
        await addTransaction(transactionData, receiptImage);
        Alert.alert(
          'Transaction Added',
          `Successfully added new transaction:
          
Amount: ${currency.symbol}${amount}
Category: ${category}
${name ? `Name: ${name}` : ''}
Date: ${date.toLocaleDateString()}`,
          [
            {
              text: 'Done',
              onPress: () => navigation.goBack(),
              style: 'default'
            }
          ],
          { cancelable: false }
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        `Failed to ${editMode ? 'update' : 'add'} transaction:
        
${error.message}`,
        [{ text: 'Try Again' }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Function to get AI suggestion for category based on transaction name
  const getCategorySuggestion = async (transactionName) => {
    if (!transactionName || transactionName.trim() === '') return;
    
    setAiLoading(true);
    try {
      const suggestedCategory = await suggestTransactionCategory(transactionName, categories);
      
      if (suggestedCategory) {
        setCategory(suggestedCategory);
        setSnackbarMessage(`AI suggested "${suggestedCategory}" category`);
        setSnackbarVisible(true);
      }
    } catch (error) {
      console.error('Error getting category suggestion:', error);
    } finally {
      setAiLoading(false);
    }
  };

  // Handle name input with debounce for AI suggestion
  const handleNameChange = (text) => {
    setName(text);
    
    // Clear any previous debounce timer
    if (timerRef) {
      clearTimeout(timerRef);
    }
    
    // Set a new timer to get AI suggestion after typing stops
    const newTimer = setTimeout(() => {
      if (text.trim().length >= 3) {
        getCategorySuggestion(text);
      }
    }, 800); // 800ms debounce time
    
    setTimerRef(newTimer);
  };

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.form}>
        <Text style={styles.title}>{editMode ? 'Edit Transaction' : 'Add New Transaction'}</Text>
        
        <SegmentedButtons
          value={type}
          onValueChange={setType}
          buttons={[
            { 
              value: 'expense', 
              label: 'Expense',
              style: { 
                backgroundColor: type === 'expense' ? theme.colors.error : undefined 
              }
            },
            { 
              value: 'income', 
              label: 'Income',
              style: { 
                backgroundColor: type === 'income' ? theme.colors.success : undefined 
              }
            },
          ]}
          style={styles.segmentedButtons}
        />

        <TextInput
          label="Amount"
          value={amount}
          onChangeText={(text) => {
            setAmount(text);
            setErrors({ ...errors, amount: null });
          }}
          keyboardType="decimal-pad"
          style={styles.input}
          mode="outlined"
          error={!!errors.amount}
          left={<TextInput.Affix text={currency.symbol} />}
          right={<TextInput.Affix text={type === 'expense' ? '-' : '+'} />}
        />
        {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}

        <TextInput
          label="Transaction Name (Optional)"
          value={name}
          onChangeText={handleNameChange}
          style={styles.input}
          mode="outlined"
          placeholder="e.g., Grocery Shopping, Salary"
          right={aiLoading ? <TextInput.Icon icon="brain" color={theme.colors.primary} /> : null}
        />
        {name.trim().length >= 3 && aiLoading && (
          <Text style={styles.aiHintText}>
            AI is suggesting a category...
          </Text>
        )}

        <View style={styles.dateContainer}>
          <Text style={styles.label}>Date</Text>
          <Button
            onPress={() => setShowDatePicker(true)}
            mode="outlined"
            icon="calendar"
          >
            {date.toLocaleDateString()}
          </Button>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
          />
        )}

        <Text style={[styles.label, { marginTop: 16 }]}>Category</Text>
        {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
        
        <View style={styles.categoryContainer}>
          {categories.map((cat) => (
            <Chip
              key={cat.id}
              selected={category === cat.label}
              onPress={() => {
                setCategory(cat.label);
                setErrors({ ...errors, category: null });
              }}
              style={[
                styles.categoryChip,
                category === cat.label && { backgroundColor: theme.colors.primary }
              ]}
              icon={cat.icon}
              textStyle={category === cat.label ? { color: 'white' } : {}}
            >
              {cat.label}
            </Chip>
          ))}
        </View>

        <TextInput
          label="Note"
          value={note}
          onChangeText={setNote}
          style={styles.input}
          mode="outlined"
          multiline
          numberOfLines={3}
        />

        <View style={styles.receiptContainer}>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setMenuVisible(true)}
                icon="receipt"
                style={styles.uploadButton}
              >
                {receiptImage ? 'Change Receipt' : 'Add Receipt'}
              </Button>
            }
          >
            <Menu.Item 
              leadingIcon="camera"
              onPress={takePhoto} 
              title="Take Photo" 
            />
            <Menu.Item 
              leadingIcon="image"
              onPress={pickImage} 
              title="Choose from Gallery" 
            />
          </Menu>
          
          {receiptImage && (
            <View style={styles.receiptPreviewContainer}>
              <IconButton
                icon="check"
                size={24}
                iconColor="green"
                style={styles.checkIcon}
              />
              <Text style={styles.receiptText}>Receipt added</Text>
            </View>
          )}
        </View>
        
        {receiptImage && (
          <View style={styles.imagePreviewContainer}>
            <Image 
              source={{ uri: receiptImage.uri }} 
              style={styles.imagePreview} 
              resizeMode="contain"
            />
            <IconButton
              icon="delete"
              size={24}
              style={styles.deleteImageButton}
              onPress={() => setReceiptImage(null)}
            />
          </View>
        )}

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          style={styles.submitButton}
        >
          {editMode ? 'Update Transaction' : 'Add Transaction'}
        </Button>
      </Surface>
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fa',
  },
  form: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  dateContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  categoryChip: {
    margin: 4,
  },
  receiptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadButton: {
    flex: 1,
  },
  checkIcon: {
    marginLeft: 8,
  },
  submitButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  errorText: {
    color: 'red',
    marginBottom: 8,
  },
  receiptPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  receiptText: {
    fontSize: 12,
    color: 'green',
  },
  imagePreviewContainer: {
    marginBottom: 16,
    alignItems: 'center',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  deleteImageButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  aiHintText: {
    fontSize: 12,
    color: '#666666',
    marginTop: -12,
    marginBottom: 12,
    fontStyle: 'italic',
  },
});

export default AddTransactionScreen; 