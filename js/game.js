$(document).ready(function() {
  // Display logged in user info
  auth.onAuthStateChanged(user => {
    if (user) {
      db.collection('users').doc(user.uid).get().then((doc) => {
        if (doc.exists) {
          document.getElementById('user-email').textContent = doc.data().email;
        }
      });
    }
  });

  // Logout functionality
  document.getElementById('logout-button').addEventListener('click', function() {
    logout();
  });

  // All choices data
  const choices = [
    {
      section: "🌅 Morning Routine",
      title: "🚿 Shower",
      options: [
        { text: "Taking a 15-Minute Shower", points: -10 },
        { text: "Taking a 5-Minute Shower", points: -3 }
      ]
    },
    {
      section: "🌅 Morning Routine",
      title: "🦷 Brushing Teeth",
      options: [
        { text: "Brushing Teeth with the Tap Running", points: -3 },
        { text: "Turning Off Tap While Brushing Teeth", points: 0 }
      ]
    },
{
      section: "🌅 Morning Routine",
      title: "☕ Beverage Choices",
      options: [
        { text: "Drinking Coffee", points: -4 },
        { text: "Drinking Tea", points: -2 }
      ]
    },
    {
      section: "🚶‍♂️ Commuting to Work/School",
      title: "🚗 Transportation",
      options: [
        { text: "Driving a Car to Work (Takes only 10 mins)", points: -20 },
        { text: "Taking public transport (Takes 30 mins)", points: 0 }
      ]
    },
    {
      section: "🚶‍♂️ Commuting to Work/School",
      title: "🏢 Walking (Office/School)",
      options: [
        { text: "Taking the Elevator (5 floors up/down)", points: -4 },
        { text: "Using the Stairs", points: 0 }
      ]
    },
    {
      section: "🛒 Midday Activities",
      title: "🥤 Drinking Habit",
      options: [
        { text: "Using a Plastic Bottle", points: -2 },
        { text: "Using a Reusable Bottle", points: 0 }
      ]
    },
    {
      section: "🛒 Midday Activities",
      title: "📖 Studying / Office Work",
      options: [
        { text: "Printing Documents", points: -4 },
        { text: "Using Digital Notes", points: 0 }
      ]
    },
    {
      section: "🛒 Midday Activities",
      title: "🍔 Lunch Choices",
      options: [
        { text: "Eating a Beef Burger", points: -12 },
        { text: "Eating a Veggie Burger", points: -2 }
      ]
    },
    {
      section: "🛒 Midday Activities",
      title: "🛒 Shopping Habits",
      options: [
        { text: "Buying New Products", points: -10 },
        { text: "Buying Second-Hand or Repaired Items", points: -2 }
      ]
    },
    {
      section: "🏡 Evening Activities",
      title: "🛍️ Buying Groceries",
      options: [
        { text: "Buying Packaged Food", points: -5 },
        { text: "Buying Fresh Local Produce", points: -1 }
      ]
    },
    {
      section: "🏡 Evening Activities",
      title: "🥤 Reusability",
      options: [
        { text: "Using a Plastic Bag", points: -2 },
        { text: "Using a Reusable Shopping Bag", points: 0 }
      ]
    },
    {
      section: "🏡 Evening Activities",
      title: "🍽️ Dinner Choices",
      options: [
        { text: "Ordering Takeout with Plastic Packaging", points: -7 },
        { text: "Cooking at Home", points: -2 }
      ]
    },
    {
      section: "🏡 Evening Activities",
      title: "🧊 Refrigeration",
      options: [
        { text: "Keeping Refrigerator Door Open While Deciding", points: -3 },
        { text: "Deciding What You Need Before Opening the Door", points: -1 }
      ]
    },
    {
      section: "🏡 Evening Activities",
      title: "🍳 Cooking",
      options: [
        { text: "Using a Gas Stove", points: -8 },
        { text: "Using an Induction Stove", points: -3 }
      ]
    },
    {
      section: "🏡 Evening Activities",
      title: "🧺 Washing Clothes",
      options: [
        { text: "Using a Dryer for Laundry", points: -7 },
        { text: "Air-Drying Laundry", points: 0 }
      ]
    },
    {
      section: "🏡 Evening Activities",
      title: "🧻 Cleaning Habit",
      options: [
        { text: "Using Paper Towels", points: -3 },
        { text: "Using a Cloth Towel", points: 0 }
      ]
    },
    {
      section: "🏡 Evening Activities",
      title: "🍎 Waste Management",
      options: [
        { text: "Throwing Food in the Trash", points: -15 },
        { text: "Composting Food Waste", points: -2 }
      ]
    }
  ];

  let currentScore = 50;
  let currentChoiceIndex = 0;
  let previousSection = "";
  let activeChallenge = null;
  let transportationChoiceIndex = 3; // Index of transportation choice
  let groceriesChoiceIndex = 9; // Index of buying groceries choice
  
  // Track user choices for data saving
  let userChoices = [];
  let challengeResponses = [];

  // Function to handle option selection
  window.selectOption = function(points, optionText) {
    // Record the choice
    const currentChoice = choices[currentChoiceIndex];
    userChoices.push({
      section: currentChoice.section,
      title: currentChoice.title,
      selectedOption: optionText,
      points: points
    });
    
    currentScore += points;
    if (currentScore <= 0) {
      currentScore = 0;
      updateScoreDisplay();
      showResults(true); // Pass true to indicate the user has run out of points
    } else {
      updateScoreDisplay();
      currentChoiceIndex++;
      displayCurrentChoice();
    }
  };

  // Start game button click handler
  $("#start-game-button").click(function() {
    $("#home-screen").hide();
    initGame();
  });

  // Restart button click handler
  $("#restart-button").click(function() {
    $("#result-screen").hide();
    $("#home-screen").show();
    // Clear previous game data
    userChoices = [];
    challengeResponses = [];
  });

  // Initialize the game
  function initGame() {
    currentScore = 50;
    currentChoiceIndex = 0;
    previousSection = "";
    userChoices = [];
    challengeResponses = [];
    updateScoreDisplay();
    selectRandomChallenge();
    
    // If Challenge 4 was not selected, proceed normally
    if (activeChallenge !== 4) {
      $("#game-screen").show();
      displayCurrentChoice();
    }
  }

  // Select a random challenge
  function selectRandomChallenge() {
    const randomNum = Math.random();
    
    if (randomNum < 0.2) {
      activeChallenge = 1; // Public transport strike
    } else if (randomNum < 0.4) {
      activeChallenge = 2; // Late for work
    } else if (randomNum < 0.6) {
      activeChallenge = 3; // Farmers market changed hours
    } else if (randomNum < 0.8) {
      activeChallenge = 4; // Weekend trip to Spain
    } else {
      activeChallenge = null; // No challenge
    }
    
    // Show Challenge 4 immediately if selected
    if (activeChallenge === 4) {
      showWeekendTripChallenge();
    }
  }

  // Display the current choice
  function displayCurrentChoice() {
    if (currentChoiceIndex >= choices.length) {
      showResults();
      return;
    }
    
    // Check if we should show a challenge before this choice
    if ((activeChallenge === 1 || activeChallenge === 2) && currentChoiceIndex === transportationChoiceIndex) {
      showTransportationChallenge(activeChallenge);
      return;
    } else if (activeChallenge === 3 && currentChoiceIndex === groceriesChoiceIndex) {
      showFarmersMarketChallenge();
      return;
    }
    
    const choice = choices[currentChoiceIndex];
    const $choiceContainer = $("#choice-container");
    
    // Fade out current content
    $choiceContainer.addClass('fade');
    
    setTimeout(() => {
      // Check if section header should be shown
      let sectionHeader = '';
      if (choice.section !== previousSection) {
        sectionHeader = `<h2>${choice.section}</h2>`;
        previousSection = choice.section;
      }
      
      // Create HTML for the current choice
      let html = `
        ${sectionHeader}
        <div class="choice-title">${choice.title}</div>
        <div class="options">
      `;
      
      // Add options
      choice.options.forEach((option, index) => {
        html += `
          <div class="option" onclick="selectOption(${option.points}, '${option.text}')">
            <h3>${option.text}</h3>
          </div>
        `;
      });
      
      html += `</div>`;
      
      // Update and fade in
      $choiceContainer.html(html);
      $choiceContainer.removeClass('fade');
      
      // Update progress bar
      const progress = (currentChoiceIndex / choices.length) * 100;
      $("#progress-bar").css("width", `${progress}%`);
    }, 600); // Match the CSS transition time
  }

  // Show transportation challenges (1 and 2)
  function showTransportationChallenge(challengeType) {
    const $choiceContainer = $("#choice-container");
    $choiceContainer.addClass('fade');
    
    setTimeout(() => {
      let challengeTitle, challengeDescription, options;
      
      if (challengeType === 1) {
        challengeTitle = "Transportation Challenge!";
        challengeDescription = "Public transports are on strike and it's raining 🌧️.";
        options = [
          { text: "Cycling to work", points: 0 },
          { text: "Driving to work", points: -15 }
        ];
      } else { // challengeType === 2
        challengeTitle = "Transportation Challenge!";
        challengeDescription = "You wake up late. If you take the car you arrive on time to work, instead if you take the public transport you arrive 30 mins late ⏰.";
        options = [
          { text: "Taking public transport (arrive late)", points: 0 },
          { text: "Driving to work (arrive on time)", points: -20 }
        ];
      }
      
      let html = `
        <h2>${challengeTitle}</h2>
        <p>${challengeDescription}</p>
        <div class="options">
      `;
      
      options.forEach(option => {
        html += `
          <div class="option" onclick="handleChallengeChoice(${option.points}, '${option.text}', '${challengeTitle}')">
            <h3>${option.text}</h3>
          </div>
        `;
      });
      
      html += `</div>`;
      
      $choiceContainer.html(html);
      $choiceContainer.removeClass('fade');
    }, 600);
  }

  // Show farmers market challenge (3)
  function showFarmersMarketChallenge() {
    const $choiceContainer = $("#choice-container");
    $choiceContainer.addClass('fade');
    
    setTimeout(() => {
      const challengeTitle = "Grocery Shopping Challenge!";
      const challengeDescription = "Your favorite Farmers market changed its schedule and is now open from 6am to 9am. Do you wake up earlier before work or do you choose to go to the supermarket later on instead? 🧑‍🌾";
      
      let html = `
        <h2>${challengeTitle}</h2>
        <p>${challengeDescription}</p>
        <div class="options">
          <div class="option" onclick="handleChallengeChoice(-1, 'Wake up early for the farmers market', '${challengeTitle}')">
            <h3>Wake up early for the farmers market</h3>
          </div>
          <div class="option" onclick="handleChallengeChoice(-5, 'Go to the supermarket later', '${challengeTitle}')">
            <h3>Go to the supermarket later</h3>
          </div>
        </div>
      `;
      
      $choiceContainer.html(html);
      $choiceContainer.removeClass('fade');
    }, 600);
  }

  // Show the weekend trip challenge (Challenge 4) after game start
  function showWeekendTripChallenge() {
    $("#game-screen").hide();
    
    // Create a challenge screen and append it to the container
    const challengeTitle = "Weekend Challenge!";
    const challengeDescription = "Your friends invite you to do a weekend trip to Spain 🇪🇸. You have the money and the time to go, what transportation method do you choose?";
    
    const challengeHTML = `
      <div id="challenge-screen">
        <h2>${challengeTitle}</h2>
        <p>${challengeDescription}</p>
        <div class="options">
          <div class="option" onclick="handleWeekendTripChoice(-20, 'Airplane', '${challengeTitle}')">
            <h3>Airplane</h3>
          </div>
          <div class="option" onclick="handleWeekendTripChoice(-10, 'Bus (e.g., Flixbus)', '${challengeTitle}')">
            <h3>Bus (e.g., Flixbus)</h3>
          </div>
        </div>
      </div>
    `;
    
    $(".container").append(challengeHTML);
    $("#challenge-screen").css({
      "display": "flex",
      "flex-direction": "column",
      "align-items": "center",
      "text-align": "center",
      "min-height": "300px"
    });
  }

  // Handle the weekend trip choice
  window.handleWeekendTripChoice = function(points, optionText, challengeTitle) {
    // Record challenge response
    challengeResponses.push({
      challenge: challengeTitle,
      selectedOption: optionText,
      points: points
    });
    
    currentScore += points;
    if (currentScore <= 0) {
      currentScore = 0;
      $("#challenge-screen").remove();
      updateScoreDisplay();
      showResults(true);
    } else {
      $("#challenge-screen").remove();
      $("#game-screen").show();
      updateScoreDisplay();
      displayCurrentChoice();
    }
  };

  // Handle challenge choices
  window.handleChallengeChoice = function(points, optionText, challengeTitle) {
    // Record challenge response
    challengeResponses.push({
      challenge: challengeTitle,
      selectedOption: optionText,
      points: points
    });
    
    currentScore += points;
    if (currentScore <= 0) {
      currentScore = 0;
      updateScoreDisplay();
      showResults(true);
    } else {
      updateScoreDisplay();
      currentChoiceIndex++;
      displayCurrentChoice();
    }
  };

  // Update score display
  function updateScoreDisplay() {
    $("#carbon-points").text(currentScore);
    $("#final-score").text(currentScore);
  }

  // Show results screen
  function showResults(outOfPoints) {
    $("#game-screen").hide();
    $("#result-screen").css("display", "flex");
    
    // Calculate and display impact message
    let message = '';
    
    if (outOfPoints) {
      message = "Your daily choices have a significant impact on your carbon footprint. Unfortunately you ran out of carbon credits, consider how to change your schedule to have a better impact.";
    } else if (currentScore >= 40) {
      message = "Amazing! You're making eco-friendly choices that significantly reduce your carbon footprint!";
    } else if (currentScore >= 25) {
      message = "Good job! You're making some sustainable choices that help the environment.";
    } else if (currentScore >= 10) {
      message = "There's room for improvement in your daily carbon choices.";
    } else {
      message = "Your daily choices are having a significant impact on your carbon footprint. Consider making more sustainable choices.";
    }
    
    $("#impact-message").text(message);
    
    // Save game results to database
    const gameData = {
      finalScore: currentScore,
      choices: userChoices,
      challengeResponses: challengeResponses,
      outcomeMessage: message,
      completedGame: !outOfPoints
    };
    
    saveGameResults(gameData).then(result => {
      if (!result.success) {
        console.error('Failed to save game results:', result.error);
      }
    });
  }
});
