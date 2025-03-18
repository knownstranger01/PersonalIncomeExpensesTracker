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
    size: 'invisible',
    callback: () => {
        // reCAPTCHA solved
    }
});

// Store reCAPTCHA widget ID
window.recaptchaWidgetId = null;

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
        provider.addScope('https://www.googleapis.com/auth/userinfo.email');
        provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
        
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const credential = result.credential;
        
        // Get additional user info
        const additionalUserInfo = result.additionalUserInfo;
        
        // Save user data to Firestore
        await getDoc(doc(db, 'users', user.uid)).then(async (userDoc) => {
            if (!userDoc.exists()) {
                await setDoc(doc(db, 'users', user.uid), {
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    createdAt: serverTimestamp(),
                    lastLogin: serverTimestamp(),
                    provider: 'google',
                    isNewUser: additionalUserInfo.isNewUser
                });
            } else {
                // Update last login time
                await updateDoc(doc(db, 'users', user.uid), {
                    lastLogin: serverTimestamp()
                });
            }
        });
        
        console.log('Google Sign In Success:', {
            user: user.email,
            isNewUser: additionalUserInfo.isNewUser,
            profile: additionalUserInfo.profile
        });
        
        return user;
    } catch (error) {
        console.error('Google Sign In Error:', {
            code: error.code,
            message: error.message,
            email: error.email,
            credential: error.credential
        });
        throw error;
    }
}

// Phone Number Authentication Functions
async function sendPhoneOTP(phoneNumber) {
    try {
        const appVerifier = window.recaptchaVerifier;
        const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
        window.confirmationResult = confirmationResult;
        return confirmationResult;
    } catch (error) {
        console.error('Phone OTP Error:', error);
        resetRecaptcha(); // Reset reCAPTCHA on error
        throw error;
    }
}

async function verifyPhoneOTP(code) {
    try {
        if (!window.confirmationResult) {
            throw new Error('OTP पठाइएको छैन। कृपया पहिले OTP पठाउनुहोस्।');
        }

        const result = await window.confirmationResult.confirm(code);
        const user = result.user;
        
        // Save user data to Firestore
        await getDoc(doc(db, 'users', user.uid)).then(async (userDoc) => {
            if (!userDoc.exists()) {
                await setDoc(doc(db, 'users', user.uid), {
                    phoneNumber: user.phoneNumber,
                    lastLogin: serverTimestamp(),
                    provider: 'phone'
                });
            } else {
                await updateDoc(doc(db, 'users', user.uid), {
                    phoneNumber: user.phoneNumber,
                    lastLogin: serverTimestamp()
                });
            }
        });
        
        return user;
    } catch (error) {
        console.error('Phone OTP Verification Error:', error);
        throw error;
    }
}

// Email Authentication Functions
async function sendEmailOTP(email) {
    try {
        const actionCodeSettings = {
            url: 'https://knownstranger01.github.io/PersonalIncomeExpensesTracker/login.html',
            handleCodeInApp: true,
            iOS: {
                bundleId: 'com.example.ios'
            },
            android: {
                packageName: 'com.example.android',
                installApp: true,
                minimumVersion: '12'
            },
            dynamicLinkDomain: 'example.page.link'
        };
        
        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        return true;
    } catch (error) {
        console.error('Email OTP Error:', error);
        throw error;
    }
}

async function verifyEmailOTP(email, password) {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        const user = result.user;
        
        // Save user data to Firestore
        await getDoc(doc(db, 'users', user.uid)).then(async (userDoc) => {
            if (!userDoc.exists()) {
                await setDoc(doc(db, 'users', user.uid), {
                    email: user.email,
                    lastLogin: serverTimestamp(),
                    provider: 'email'
                });
            } else {
                await updateDoc(doc(db, 'users', user.uid), {
                    lastLogin: serverTimestamp()
                });
            }
        });
        
        return user;
    } catch (error) {
        console.error('Email OTP Verification Error:', error);
        throw error;
    }
}

// Email Registration Function
async function registerWithEmail(email, password, name) {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const user = result.user;
        
        // Update profile
        await user.updateProfile({
            displayName: name
        });
        
        // Save user data to Firestore
        await getDoc(doc(db, 'users', user.uid)).then(async (userDoc) => {
            if (!userDoc.exists()) {
                await setDoc(doc(db, 'users', user.uid), {
                    email: user.email,
                    displayName: name,
                    createdAt: serverTimestamp(),
                    lastLogin: serverTimestamp(),
                    provider: 'email'
                });
            } else {
                await updateDoc(doc(db, 'users', user.uid), {
                    lastLogin: serverTimestamp()
                });
            }
        });
        
        return user;
    } catch (error) {
        console.error('Email Registration Error:', error);
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
        const user = await verifyPhoneOTP(otp);
        
        // Save user data to Firestore
        await getDoc(doc(db, 'users', user.uid)).then(async (userDoc) => {
            if (!userDoc.exists()) {
                await setDoc(doc(db, 'users', user.uid), {
                    name: name,
                    phoneNumber: user.phoneNumber,
                    createdAt: serverTimestamp()
                });
            } else {
                await updateDoc(doc(db, 'users', user.uid), {
                    name: name,
                    phoneNumber: user.phoneNumber,
                    lastLogin: serverTimestamp()
                });
            }
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