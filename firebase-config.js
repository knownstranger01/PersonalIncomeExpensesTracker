// Firebase configuration
const firebaseConfig = {
    // Replace with your Firebase config
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize reCAPTCHA verifier
window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
    size: 'invisible',
    callback: function(response) {
        // reCAPTCHA solved
    }
});

// Google Sign-In Function
async function signInWithGoogle() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await firebase.auth().signInWithPopup(provider);
        
        // Save user data to Firestore if new user
        const userDoc = await firebase.firestore().collection('users').doc(result.user.uid).get();
        if (!userDoc.exists) {
            await firebase.firestore().collection('users').doc(result.user.uid).set({
                name: result.user.displayName,
                email: result.user.email,
                photoURL: result.user.photoURL,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        return result.user;
    } catch (error) {
        console.error('Error signing in with Google:', error);
        throw error;
    }
}

// Phone Number Authentication Functions
async function sendPhoneOTP(phoneNumber) {
    try {
        const appVerifier = window.recaptchaVerifier;
        const confirmationResult = await firebase.auth().signInWithPhoneNumber(phoneNumber, appVerifier);
        return confirmationResult.verificationId;
    } catch (error) {
        console.error('Error sending phone OTP:', error);
        throw error;
    }
}

async function verifyPhoneOTP(verificationId, otp) {
    try {
        const credential = firebase.auth.PhoneAuthProvider.credential(verificationId, otp);
        const result = await firebase.auth().signInWithCredential(credential);
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
            handleCodeInApp: true
        };
        
        await firebase.auth().sendSignInLinkToEmail(email, actionCodeSettings);
        return true;
    } catch (error) {
        console.error('Error sending email OTP:', error);
        throw error;
    }
}

async function verifyEmailOTP(email, password) {
    try {
        const result = await firebase.auth().signInWithEmailAndPassword(email, password);
        return result.user;
    } catch (error) {
        console.error('Error verifying email OTP:', error);
        throw error;
    }
}

// Email Registration Function
async function registerWithEmail(email, password, name) {
    try {
        const result = await firebase.auth().createUserWithEmailAndPassword(email, password);
        
        // Save user data to Firestore
        await firebase.firestore().collection('users').doc(result.user.uid).set({
            name: name,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
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
        await firebase.firestore().collection('users').doc(user.uid).set({
            name: name,
            phoneNumber: user.phoneNumber,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
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
    completePhoneRegistration
}; 