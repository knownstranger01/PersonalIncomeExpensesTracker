// Your web app's Firebase configuration
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, GoogleAuthProvider, signInWithPopup, getAdditionalUserInfo } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDlgZjxv59Labz2xPFRkRc15ovzS2Ut3WY",
  authDomain: "incomeexpensetracker-f3964.firebaseapp.com",
  projectId: "incomeexpensetracker-f3964",
  storageBucket: "incomeexpensetracker-f3964.firebasestorage.app",
  messagingSenderId: "455819888887",
  appId: "1:455819888887:web:cbc20462864efa62c7ebf2",
  measurementId: "G-X1CPVTH6V2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Set language code for authentication
auth.languageCode = 'ne'; // Nepali language code

// Enable testing mode for phone authentication
auth.settings.appVerificationDisabledForTesting = true;

// Test phone number and verification code
const TEST_PHONE_NUMBER = "+9771234567890";
const TEST_VERIFICATION_CODE = "123456";

// Initialize reCAPTCHA verifier
window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
    callback: function(response) {
        // reCAPTCHA solved
        console.log('reCAPTCHA verified');
    }
});

// Store reCAPTCHA widget ID
window.recaptchaVerifier.render().then(function(widgetId) {
    window.recaptchaWidgetId = widgetId;
});

// Function to reset reCAPTCHA
function resetRecaptcha() {
    if (window.recaptchaWidgetId) {
        grecaptcha.reset(window.recaptchaWidgetId);
    } else {
        window.recaptchaVerifier.render().then(function(widgetId) {
            window.recaptchaWidgetId = widgetId;
            grecaptcha.reset(widgetId);
        });
    }
}

// Google Sign-In Function
async function signInWithGoogle() {
    try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
            prompt: 'select_account'
        });
        
        const result = await signInWithPopup(auth, provider);
        
        // Get Google Access Token
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;
        
        // Get user info
        const user = result.user;
        
        // Get additional user info
        const additionalUserInfo = getAdditionalUserInfo(result);
        
        console.log('Google login successful:', {
            user,
            token,
            additionalUserInfo
        });
        
        // Save user data to Firestore if new user
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
            await setDoc(doc(db, 'users', user.uid), {
                name: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
                provider: 'google'
            });
        } else {
            // Update last login time
            await updateDoc(doc(db, 'users', user.uid), {
                lastLogin: serverTimestamp()
            });
        }
        
        return user;
    } catch (error) {
        console.error('Error signing in with Google:', error);
        
        // Handle specific error cases
        const errorCode = error.code;
        const errorMessage = error.message;
        const email = error.customData?.email;
        const credential = GoogleAuthProvider.credentialFromError(error);
        
        console.error('Error details:', {
            errorCode,
            errorMessage,
            email,
            credential
        });
        
        throw error;
    }
}

// Phone Number Authentication Functions
async function sendPhoneOTP(phoneNumber) {
    try {
        const appVerifier = window.recaptchaVerifier;
        // Use test phone number in testing mode
        const numberToUse = auth.settings.appVerificationDisabledForTesting ? TEST_PHONE_NUMBER : phoneNumber;
        const confirmationResult = await signInWithPhoneNumber(auth, numberToUse, appVerifier);
        window.confirmationResult = confirmationResult;
        return confirmationResult.verificationId;
    } catch (error) {
        console.error('Error sending phone OTP:', error);
        resetRecaptcha(); // Reset reCAPTCHA on error
        throw error;
    }
}

async function verifyPhoneOTP(verificationId, otp) {
    try {
        if (!window.confirmationResult) {
            throw new Error('OTP पठाइएको छैन। कृपया पहिले OTP पठाउनुहोस्।');
        }

        // Use test verification code in testing mode
        const codeToUse = auth.settings.appVerificationDisabledForTesting ? TEST_VERIFICATION_CODE : otp;
        const result = await window.confirmationResult.confirm(codeToUse);
        console.log('OTP सत्यापन सफल:', result.user);
        return result.user;
    } catch (error) {
        console.error('Error verifying phone OTP:', error);
        throw error;
    }
}

// Email Authentication Functions
async function sendEmailOTP(email) {
    try {
        const actionCodeSettings = {
            url: window.location.origin + '/login.html',
            handleCodeInApp: true,
            iOS: {
                bundleId: 'com.expensetracker.ios'
            },
            android: {
                packageName: 'com.expensetracker.android',
                installApp: true,
                minimumVersion: '12'
            }
        };
        
        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        return true;
    } catch (error) {
        console.error('Error sending email OTP:', error);
        throw error;
    }
}

async function verifyEmailOTP(email, password) {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        
        // Save user data to Firestore
        await setDoc(doc(db, 'users', result.user.uid), {
            email: email,
            lastLogin: serverTimestamp(),
            provider: 'email'
        }, { merge: true });
        
        return result.user;
    } catch (error) {
        console.error('Error verifying email OTP:', error);
        throw error;
    }
}

// Email Registration Function
async function registerWithEmail(email, password, name) {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        
        // Save user data to Firestore
        await setDoc(doc(db, 'users', result.user.uid), {
            name: name,
            email: email,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            provider: 'email'
        });
        
        return result.user;
    } catch (error) {
        console.error('Error registering with email:', error);
        throw error;
    }
}

// Phone Registration Function
async function registerWithPhone(phoneNumber, name) {
    try {
        const verificationId = await sendPhoneOTP(phoneNumber);
        return { verificationId, name };
    } catch (error) {
        console.error('Error registering with phone:', error);
        throw error;
    }
}

// Complete Phone Registration Function
async function completePhoneRegistration(verificationId, otp, name) {
    try {
        const user = await verifyPhoneOTP(verificationId, otp);
        
        // Save user data to Firestore
        await setDoc(doc(db, 'users', user.uid), {
            name: name,
            phoneNumber: user.phoneNumber,
            createdAt: serverTimestamp()
        });
        
        return user;
    } catch (error) {
        console.error('Error completing phone registration:', error);
        throw error;
    }
}

// Export functions
window.authFunctions = {
    signInWithGoogle,
    sendPhoneOTP,
    verifyPhoneOTP,
    sendEmailOTP,
    verifyEmailOTP,
    registerWithEmail,
    registerWithPhone,
    completePhoneRegistration,
    resetRecaptcha
}; 