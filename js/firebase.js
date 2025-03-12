// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDzGaeXix9k7LCdEzLgkDix6WkALzWnvuM",
  authDomain: "carbon-choices-game-9b52c.firebaseapp.com",
  projectId: "carbon-choices-game-9b52c",
  storageBucket: "carbon-choices-game-9b52c.firebasestorage.app",
  messagingSenderId: "1018967130362",
  appId: "1:1018967130362:web:58d4ffb7c42b06cb500943",
  measurementId: "G-RGC8WSZJBR"
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

// Function to validate ESCP email with more flexibility
function isValidESCPEmail(email) {
  // This pattern allows for more flexible naming conventions:
  // - Any characters before the @ symbol
  // - Must contain at least one dot
  // - Must end with @edu.escp.eu
  const escpPattern = /^.+\..+@edu\.escp\.eu$/;
  return escpPattern.test(email);
}

// Anonymous authentication with custom user data
async function loginWithEmail(email, fullName) {
  if (!isValidESCPEmail(email)) {
    console.error("Invalid email format:", email);
    return { success: false, error: 'Invalid ESCP email format' };
  }
  
  try {
    console.log("Attempting to sign in anonymously for:", email);
    
    // Sign in anonymously (no password required)
    const result = await auth.signInAnonymously();
    console.log("Anonymous sign-in successful, UID:", result.user.uid);
    
    // Store user data in Firestore - CRITICAL STEP
    console.log("Storing user data in 'users' collection for:", email);
    await db.collection('users').doc(result.user.uid).set({
      email: email,
      fullName: fullName,
      registeredAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // IMPORTANT: Also store this information in the auth user profile
    await result.user.updateProfile({
      displayName: fullName
    });
    
    // Store the email in localStorage as backup
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userName', fullName);
    
    console.log("User data successfully stored");
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
    
    console.log("Saving game for user:", user.uid);
    
    // Try to get user data from multiple sources
    let userEmail = '';
    let fullName = '';
    
    // First try: Get from Firestore
    try {
      const userDoc = await db.collection('users').doc(user.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        userEmail = userData.email;
        fullName = userData.fullName;
        console.log("Found user data in Firestore:", userEmail);
      } else {
        console.warn("User document not found in Firestore");
      }
    } catch (userDocError) {
      console.error("Error fetching user doc:", userDocError);
    }
    
    // Second try: Get from auth user profile
    if (!userEmail && user.displayName) {
      fullName = user.displayName;
      console.log("Using displayName from auth profile:", fullName);
    }
    
    // Third try: Get from localStorage
    if (!userEmail) {
      userEmail = localStorage.getItem('userEmail');
      fullName = localStorage.getItem('userName');
      console.log("Using data from localStorage:", userEmail);
    }
    
    // Last resort: Use default values
    if (!userEmail) {
      userEmail = "unknown@edu.escp.eu";
      fullName = "ESCP Student";
      console.log("Using default values for missing user data");
    }
    
    // Save or re-save user data to ensure it exists
    await db.collection('users').doc(user.uid).set({
      email: userEmail,
      fullName: fullName,
      registeredAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    console.log("Saving game with user data:", userEmail, fullName);
    
    // Add a new document in the games collection
    const gameRef = await db.collection('games').add({
      userId: user.uid,
      userEmail: userEmail,
      fullName: fullName,
      finalScore: gameData.finalScore,
      choices: gameData.choices || [],
      challengeResponses: gameData.challengeResponses || [],
      playedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    console.log("Game saved successfully with ID:", gameRef.id);
    return { success: true };
  } catch (error) {
    console.error('Error saving game results:', error);
    return { success: false, error: error.message };
  }
}
      
