// Firebase configuration
// You'll need to replace these with your own Firebase project details
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();

// Check login status and redirect if needed
function checkAuthState() {
  auth.onAuthStateChanged(user => {
    // Get current page
    const currentPage = window.location.pathname.split('/').pop();
    
    if (user) {
      // User is signed in
      // If on login page, redirect to game
      if (currentPage === 'index.html' || currentPage === '') {
        window.location.href = 'game.html';
      }
    } else {
      // No user is signed in
      // If on game page, redirect to login
      if (currentPage === 'game.html') {
        window.location.href = 'index.html';
      }
    }
  });
}

// Call the function to check auth state
checkAuthState();

// Function to validate ESCP email
function isValidESCPEmail(email) {
  const escpPattern = /^[a-zA-Z]+\.[a-zA-Z]+@edu\.escp\.eu$/;
  return escpPattern.test(email);
}

// Anonymous authentication with custom user data
async function loginWithEmail(email, fullName) {
  if (!isValidESCPEmail(email)) {
    return { success: false, error: 'Invalid ESCP email format' };
  }
  
  try {
    // Sign in anonymously (no password required)
    const result = await auth.signInAnonymously();
    
    // Store user data in Firestore
    await db.collection('users').doc(result.user.uid).set({
      email: email,
      fullName: fullName,
      registeredAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error during login:', error);
    return { success: false, error: error.message };
  }
}

// Function to log out
function logout() {
  auth.signOut().then(() => {
    window.location.href = 'index.html';
  }).catch((error) => {
    console.error('Error signing out:', error);
  });
}

// Save game results to Firestore
async function saveGameResults(gameData) {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error('No user logged in');
      return { success: false, error: 'No user logged in' };
    }
    
    // Get user details
    const userDoc = await db.collection('users').doc(user.uid).get();
    const userData = userDoc.data();
    
    // Add a new document in the games collection
    await db.collection('games').add({
      userId: user.uid,
      userEmail: userData.email,
      fullName: userData.fullName,
      finalScore: gameData.finalScore,
      choices: gameData.choices,
      challengeResponses: gameData.challengeResponses || [],
      playedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error saving game results:', error);
    return { success: false, error: error.message };
  }
}
