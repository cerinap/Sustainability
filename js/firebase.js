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

// Initialize services (only using Firestore, not Auth)
const db = firebase.firestore();

// Try to initialize Analytics
try {
  firebase.analytics();
} catch (e) {
  console.log("Analytics not available");
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
