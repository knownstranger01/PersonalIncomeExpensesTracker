# Personal Expense Tracker

A web-based personal expense tracking application that helps users manage their daily expenses with phone number authentication.

## Features

- Phone number authentication with OTP verification
- Add and track daily expenses
- Categorize expenses
- View expense summary (total and monthly)
- Responsive design for mobile and desktop

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- Firebase Authentication
- Firebase Firestore
- Firebase Hosting

## Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/yourusername/personal-expense-tracker.git
cd personal-expense-tracker
```

2. Create a Firebase project:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Phone Authentication in Authentication section
   - Create a Firestore database
   - Get your Firebase configuration

3. Update Firebase configuration:
   - Open `firebase-config.js`
   - Replace the placeholder values with your Firebase config

4. Host the application:
   - Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```
   - Login to Firebase:
   ```bash
   firebase login
   ```
   - Initialize Firebase:
   ```bash
   firebase init
   ```
   - Deploy the application:
   ```bash
   firebase deploy
   ```

## Project Structure

```
personal-expense-tracker/
├── index.html          # Dashboard page
├── login.html          # Login and registration page
├── styles.css          # CSS styles
├── script.js           # Main JavaScript functionality
├── firebase-config.js  # Firebase configuration
└── README.md          # Project documentation
```

## Usage

1. Open the application in a web browser
2. Register with your phone number
3. Verify your phone number using OTP
4. Start adding your expenses
5. View your expense summary and history

## Security

- Phone number authentication ensures secure access
- Data is stored securely in Firebase Firestore
- Each user can only access their own expenses

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Firebase for authentication and database services
- Modern UI/UX design principles 