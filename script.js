// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginOTP = document.getElementById('loginOTP');
const registerOTP = document.getElementById('registerOTP');
const tabBtns = document.querySelectorAll('.tab-btn');
const expenseForm = document.getElementById('expenseForm');
const expenseList = document.getElementById('expenseList');
const totalExpenses = document.getElementById('totalExpenses');
const monthlyExpenses = document.getElementById('monthlyExpenses');
const logoutBtn = document.getElementById('logoutBtn');
const userName = document.getElementById('userName');
const googleLoginBtn = document.getElementById('googleLoginBtn');

// Tab Switching
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        if (btn.dataset.tab === 'login') {
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
        } else {
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
        }
    });
});

// Firebase Authentication
let currentUser = null;
let verificationId = '';

// Login Form Submit
if (loginForm) {
    loginForm.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const phoneNumber = document.getElementById('loginPhone').value;
        
        try {
            const appVerifier = window.recaptchaVerifier;
            const confirmationResult = await firebase.auth().signInWithPhoneNumber(phoneNumber, appVerifier);
            verificationId = confirmationResult.verificationId;
            loginOTP.classList.remove('hidden');
        } catch (error) {
            alert('Error sending OTP: ' + error.message);
        }
    });
}

// Register Form Submit
if (registerForm) {
    registerForm.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const phoneNumber = document.getElementById('registerPhone').value;
        
        try {
            const appVerifier = window.recaptchaVerifier;
            const confirmationResult = await firebase.auth().signInWithPhoneNumber(phoneNumber, appVerifier);
            verificationId = confirmationResult.verificationId;
            registerOTP.classList.remove('hidden');
        } catch (error) {
            alert('Error sending OTP: ' + error.message);
        }
    });
}

// Verify Login OTP
document.getElementById('verifyLoginOTP')?.addEventListener('click', async () => {
    const otp = document.getElementById('loginOTPInput').value;
    
    try {
        const credential = firebase.auth.PhoneAuthProvider.credential(verificationId, otp);
        await firebase.auth().signInWithCredential(credential);
        window.location.href = 'index.html';
    } catch (error) {
        alert('Error verifying OTP: ' + error.message);
    }
});

// Verify Register OTP
document.getElementById('verifyRegisterOTP')?.addEventListener('click', async () => {
    const otp = document.getElementById('registerOTPInput').value;
    const name = document.getElementById('registerName').value;
    
    try {
        const credential = firebase.auth.PhoneAuthProvider.credential(verificationId, otp);
        const userCredential = await firebase.auth().signInWithCredential(credential);
        
        // Save user data to Firestore
        await firebase.firestore().collection('users').doc(userCredential.user.uid).set({
            name: name,
            phoneNumber: userCredential.user.phoneNumber,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        window.location.href = 'index.html';
    } catch (error) {
        alert('Error verifying OTP: ' + error.message);
    }
});

// Expense Form Submit
if (expenseForm) {
    expenseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const amount = document.getElementById('amount').value;
        const category = document.getElementById('category').value;
        const description = document.getElementById('description').value;
        
        try {
            await firebase.firestore().collection('expenses').add({
                userId: currentUser.uid,
                amount: parseFloat(amount),
                category: category,
                description: description,
                date: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            expenseForm.reset();
            loadExpenses();
            updateSummary();
        } catch (error) {
            alert('Error adding expense: ' + error.message);
        }
    });
}

// Load Expenses
async function loadExpenses() {
    try {
        const snapshot = await firebase.firestore()
            .collection('expenses')
            .where('userId', '==', currentUser.uid)
            .orderBy('date', 'desc')
            .limit(10)
            .get();
        
        expenseList.innerHTML = '';
        snapshot.forEach(doc => {
            const expense = doc.data();
            const date = expense.date.toDate().toLocaleDateString();
            
            const expenseElement = document.createElement('div');
            expenseElement.className = 'expense-item';
            expenseElement.innerHTML = `
                <div>
                    <strong>${expense.description}</strong>
                    <span>${expense.category}</span>
                    <span>${date}</span>
                </div>
                <div class="amount">₹${expense.amount}</div>
            `;
            
            expenseList.appendChild(expenseElement);
        });
    } catch (error) {
        console.error('Error loading expenses:', error);
    }
}

// Update Summary
async function updateSummary() {
    try {
        const snapshot = await firebase.firestore()
            .collection('expenses')
            .where('userId', '==', currentUser.uid)
            .get();
        
        let total = 0;
        let monthly = 0;
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        snapshot.forEach(doc => {
            const expense = doc.data();
            total += expense.amount;
            
            if (expense.date.toDate() >= firstDayOfMonth) {
                monthly += expense.amount;
            }
        });
        
        totalExpenses.textContent = `₹${total.toFixed(2)}`;
        monthlyExpenses.textContent = `₹${monthly.toFixed(2)}`;
    } catch (error) {
        console.error('Error updating summary:', error);
    }
}

// Logout
logoutBtn?.addEventListener('click', async () => {
    try {
        await firebase.auth().signOut();
        window.location.href = 'login.html';
    } catch (error) {
        alert('Error logging out: ' + error.message);
    }
});

// Auth State Observer
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        if (userName) {
            firebase.firestore().collection('users').doc(user.uid).get()
                .then(doc => {
                    if (doc.exists) {
                        userName.textContent = `Welcome, ${doc.data().name}`;
                    }
                });
        }
        loadExpenses();
        updateSummary();
    } else {
        currentUser = null;
        if (window.location.pathname !== '/login.html') {
            window.location.href = 'login.html';
        }
    }
});

// Google Login
if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', async () => {
        try {
            await window.authFunctions.signInWithGoogle();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Google login error:', error);
            alert('Google लगइनमा त्रुटि भयो: ' + error.message);
        }
    });
} 