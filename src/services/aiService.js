import { GoogleGenerativeAI } from '@google/generative-ai';

// Hardcoded API key (not recommended for production apps)
// This key will be visible in your app bundle and can be extracted
const GEMINI_API_KEY = 'AIzaSyA9nbBPMQy34YYJh6uftKS8tsqxEJUPC8Y';

// Initialize the Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Suggests a transaction category based on the transaction name
 * @param {string} transactionName - The name of the transaction
 * @param {Array} availableCategories - Array of available category objects
 * @returns {Promise<string>} - The suggested category
 */
export const suggestTransactionCategory = async (transactionName, availableCategories) => {
  try {
    if (!transactionName || transactionName.trim() === '') {
      return null;
    }

    // Create a stringified version of categories for the prompt
    const categoriesString = availableCategories
      .map(cat => cat.label)
      .join(', ');

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Create the prompt
    const prompt = `
      Based on the transaction name "${transactionName}", suggest the most appropriate category from this list: ${categoriesString}.
      
      Return ONLY the exact category name and nothing else. The category must be one from the provided list.
      
      For example:
      - "Uber" → "Transport"
      - "Grocery store" → "Food"
      - "Netflix subscription" → "Entertainment"
      - "Electricity bill" → "Bills"
      - "Monthly pay" → "Salary"
      - "Amazon purchase" → "Shopping"
    `;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    // Verify the suggested category exists in the available categories
    const matchedCategory = availableCategories.find(
      cat => cat.label.toLowerCase() === text.toLowerCase()
    );

    return matchedCategory ? matchedCategory.label : null;
  } catch (error) {
    console.error('Error suggesting category:', error);
    return null;
  }
};

/**
 * Generates personalized financial advice based on user's specific question
 * @param {string} query - The user's financial question
 * @returns {Promise<Object>} - Personalized financial advice
 */
export const searchFinancialTips = async (query) => {
  try {
    if (!query || query.trim() === '') {
      return null;
    }

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Create the prompt for personalized financial advice
    const prompt = `
      As a financial advisor, provide personalized advice for this question: "${query}"
      
      Your response should be:
      1. Helpful and actionable
      2. Specific to the user's question
      3. Easy to understand for someone without financial expertise
      4. Include concrete steps the user can follow
      5. Well-structured with clear paragraph breaks
      
      Structure your response with these clear sections:
      
      TITLE: A brief, catchy title that captures the main advice (2-5 words)
      
      ADVICE: The detailed explanation and advice
      - Start with a clear introduction paragraph
      - Include 2-4 well-organized body paragraphs with double line breaks between them
      - Each paragraph should focus on one key point
      - Use clear, simple language
      
      After your main advice paragraphs, include 3-5 specific action steps, each formatted as a numbered list:
      1. First step
      2. Second step
      3. Third step
      
      CATEGORY: One word - must be one of: saving, investing, budgeting, debt, income
      
      DIFFICULTY: One word - must be one of: beginner, intermediate, advanced
      
      Format your answer with double line breaks between paragraphs and clear section labels.
    `;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the response
    const titleMatch = text.match(/TITLE:?\s*(.*?)(?=ADVICE:|$)/is);
    const adviceMatch = text.match(/ADVICE:?\s*([\s\S]*?)(?=CATEGORY:|$)/is);
    const categoryMatch = text.match(/CATEGORY:?\s*([a-z]+)/i);
    const difficultyMatch = text.match(/DIFFICULTY:?\s*([a-z]+)/i);
    
    const title = titleMatch ? titleMatch[1].trim() : "Financial Advice";
    const advice = adviceMatch ? adviceMatch[1].trim() : text.trim();
    const category = categoryMatch ? categoryMatch[1].toLowerCase() : "budgeting";
    const difficulty = difficultyMatch ? difficultyMatch[1].toLowerCase() : "beginner";
    
    return {
      id: `ai-advice-${Date.now()}`,
      title,
      advice,
      category,
      difficulty,
      createdAt: new Date().toISOString(),
      isAIGenerated: true,
      originalQuery: query
    };
  } catch (error) {
    console.error('Error generating financial advice:', error);
    return null;
  }
};

export default {
  suggestTransactionCategory,
  searchFinancialTips,
}; 