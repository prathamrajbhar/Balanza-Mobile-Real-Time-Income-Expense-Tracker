# Balanza

A comprehensive Income & Expense Tracking App built with React Native Expo, featuring real-time data synchronization, beautiful UI, and advanced features for managing personal finances.

## Features

- **User Authentication**
  - Secure Email/Password and Google Sign-In
  - Real-time data synchronization
  - Account management

- **Dashboard**
  - Overview of income, expenses, and net balance
  - Interactive charts and statistics
  - Modern, glassmorphic design

- **Transaction Management**
  - Add/Edit/Delete transactions
  - Receipt image upload
  - Advanced filtering and search
  - Categorization

- **Statistics & Analytics**
  - Visual representations of financial data
  - Customizable time periods
  - Detailed breakdown by categories

- **Budgeting**
  - Set and track monthly budgets
  - Category-wise budget allocation
  - Real-time alerts for budget limits

- **Settings**
  - Profile management
  - App preferences
  - Data export/import
  - Security settings

## Tech Stack

- Frontend: React Native (Expo)
- UI Framework: React Native Paper
- Navigation: React Navigation
- Backend: Firebase
  - Authentication
  - Firestore
  - Storage
- State Management: Context API

## Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI
- Firebase account

## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd finance-app
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a Firebase project and add your configuration:
   - Go to Firebase Console
   - Create a new project
   - Enable Authentication, Firestore, and Storage
   - Copy your Firebase config
   - Update `src/services/firebase.js` with your config

4. Start the development server:
   ```bash
   npm start
   # or
   yarn start
   ```

5. Run on your device/emulator:
   - Scan the QR code with Expo Go (iOS/Android)
   - Press 'a' for Android emulator
   - Press 'i' for iOS simulator

## Project Structure

```
├── App.js                 # Main application component
├── app.json              # Expo configuration
├── package.json          # Dependencies and scripts
├── assets/              # Static assets
│   ├── fonts/
│   └── images/
├── src/
│   ├── components/      # Reusable components
│   ├── navigation/      # Navigation configuration
│   ├── screens/         # Screen components
│   ├── services/        # Firebase and other services
│   └── contexts/        # Global state management
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- React Native Paper for the beautiful UI components
- Firebase for the backend infrastructure
- Expo for making React Native development easier

## Deployment

1. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Then fill in your Firebase configuration in the `.env` file.

2. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

3. Log in to your Expo account:
   ```bash
   eas login
   ```

4. Configure the build:
   ```bash
   eas build:configure
   ```

5. Build for Android:
   ```bash
   eas build --platform android
   ```

6. Build for iOS:
   ```bash
   eas build --platform ios
   ```

7. Submit to stores:
   ```bash
   # For Android
   eas submit -p android
   
   # For iOS
   eas submit -p ios
   ```

## Security Considerations

1. Never commit your `.env` file
2. Use Firebase Security Rules for Firestore and Storage
3. Implement rate limiting for authentication
4. Regular security audits
5. Keep dependencies updated 