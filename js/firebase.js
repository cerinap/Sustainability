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

// Save game results to Firestore - cross-browser compatible
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
    
    // First try: Get from localStorage (most reliable across browsers)
    userEmail = localStorage.getItem('userEmail');
    fullName = localStorage.getItem('userName');
    
    if (userEmail && fullName) {
      console.log("Found user data in localStorage:", userEmail, fullName);
    } else {
      console.log("User data not found in localStorage, checking other sources");
      
      // Second try: Get from sessionStorage
      try {
        if (!userEmail && sessionStorage.getItem('userEmail')) {
          userEmail = sessionStorage.getItem('userEmail');
          fullName = sessionStorage.getItem('userName');
          console.log("Found user data in sessionStorage:", userEmail);
        }
      } catch (sessionError) {
        console.error("Error accessing sessionStorage:", sessionError);
      }
      
      // Third try: Get from Firestore
      if (!userEmail) {
        try {
          const userDoc = await db.collection('users').doc(user.uid).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            userEmail = userData.email;
            fullName = userData.fullName;
            console.log("Found user data in Firestore:", userEmail);
            
            // Store back in localStorage for future use
            localStorage.setItem('userEmail', userEmail);
            localStorage.setItem('userName', fullName);
          } else {
            console.warn("User document not found in Firestore");
          }
        } catch (userDocError) {
          console.error("Error fetching user doc:", userDocError);
        }
      }
      
      // Fourth try: Get from auth user profile
      if (!userEmail && user.displayName) {
        fullName = user.displayName;
        console.log("Using displayName from auth profile:", fullName);
      }
      
      // Last resort: Use default values
      if (!userEmail) {
        userEmail = "anonymous@edu.escp.eu";
        fullName = "ESCP Student";
        console.log("Using default values for missing user data");
      }
    }
    
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
    
    // Try to update or create user document in Firestore
    try {
      await db.collection('users').doc(user.uid).set({
        email: userEmail,
        fullName: fullName,
        lastActive: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      console.log("Updated user document in Firestore");
    } catch (updateError) {
      console.error("Error updating user document (non-critical):", updateError);
      // This is non-critical since we already saved the game data
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error saving game results:', error);
    return { success: false, error: error.message };
  }
}
      
