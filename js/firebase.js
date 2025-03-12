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

// Initialize Analytics if available
try {
  firebase.analytics();
} catch (e) {
  console.log("Analytics not available");
}

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
      console.log("User is signed in:", user.uid);
      // If on login page, redirect to game
      if (currentPage === 'index.html' || currentPage === '') {
        window.location.href = 'game.html';
      }
    } else {
      // No user is signed in
      console.log("No user is signed in");
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

// Anonymous authentication with custom user data - cross-browser compatible
async function loginWithEmail(email, fullName) {
  if (!isValidESCPEmail(email)) {
    console.error("Invalid email format:", email);
    return { success: false, error: 'Invalid ESCP email format' };
  }
  
  try {
    console.log("Attempting to sign in anonymously for:", email);
    
    // First, store email and name in localStorage (this works across all browsers)
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userName', fullName);
    localStorage.setItem('userLoginTime', new Date().toISOString());
    
    // Sign in anonymously (no password required)
    const result = await auth.signInAnonymously();
    console.log("Anonymous sign-in successful, UID:", result.user.uid);
    
    // Store user data in Firestore with error handling
    try {
      console.log("Storing user data in 'users' collection for:", email);
      await db.collection('users').doc(result.user.uid).set({
        email: email,
        fullName: fullName,
        registeredAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log("User data successfully stored in Firestore");
    } catch (firestoreError) {
      console.error("Error storing user data in Firestore:", firestoreError);
      // Continue anyway since we have the data in localStorage
    }
    
    // Try to update profile (may not work in all browsers)
    try {
      await result.user.updateProfile({
        displayName: fullName
      });
      console.log("User profile updated with displayName");
    } catch (profileError) {
      console.error("Error updating user profile (non-critical):", profileError);
      // This is non-critical as we have the data in both localStorage and Firestore
    }
    
    // Also store in sessionStorage as another fallback
    try {
      sessionStorage.setItem('userEmail', email);
      sessionStorage.setItem('userName', fullName);
    } catch (sessionError) {
      console.error("Error storing in sessionStorage (non-critical):", sessionError);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error during login:', error);
    return { success: false, error: error.message };
  }
}

// Function to log out
function logout() {
  // Clear localStorage and sessionStorage
  try {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userLoginTime');
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('userName');
  } catch (e) {
    console.error('Error clearing storage:', e);
  }
  
  // Sign out from Firebase
  auth.signOut().then(() => {
    window.location.href = 'index.html';
  }).catch((error) => {
    console.error('Error signing out:', error);
    // Even if Firebase sign out fails, redirect anyway
    window.location.href = 'index.html';
  });
}

// Save game results to Firestore - simplified approach
async function saveGameResults(gameData) {
  try {
    // Get user info from localStorage
    const userEmail = localStorage.getItem('userEmail');
    const fullName = localStorage.getItem('userName');
    
    if (!userEmail || !fullName) {
      console.error('User information not found in localStorage');
      return { success: false, error: 'User information not found' };
    }
    
    console.log("Saving game for user:", userEmail);
    
    // Generate a unique ID for this user if we don't have one yet
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('userId', userId);
    }
    
    // Try to save to Firestore
    try {
      // First update or create the user document
      await db.collection('users').doc(userId).set({
        email: userEmail,
        fullName: fullName,
        lastActive: firebase.firestore.FieldValue.serverTimestamp(),
        registeredAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
      // Then save the game data
      const gameRef = await db.collection('games').add({
        userId: userId,
        userEmail: userEmail,
        fullName: fullName,
        finalScore: gameData.finalScore,
        choices: gameData.choices || [],
        challengeResponses: gameData.challengeResponses || [],
        playedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      console.log("Game saved successfully with ID:", gameRef.id);
      return { success: true };
    } catch (firestoreError) {
      console.error('Error saving to Firestore:', firestoreError);
      
      // If Firestore fails, save to localStorage as fallback
      let savedGames = JSON.parse(localStorage.getItem('savedGames') || '[]');
      
      const gameToSave = {
        id: 'local_' + Date.now(),
        userId: userId,
        userEmail: userEmail,
        fullName: fullName,
        finalScore: gameData.finalScore,
        choices: gameData.choices || [],
        challengeResponses: gameData.challengeResponses || [],
        playedAt: new Date().toISOString()
      };
      
      savedGames.push(gameToSave);
      localStorage.setItem('savedGames', JSON.stringify(savedGames));
      
      console.log("Game saved to localStorage as fallback");
      return { success: true, localOnly: true };
    }
  } catch (error) {
    console.error('Error in saveGameResults:', error);
    return { success: false, error: error.message };
  }
}
