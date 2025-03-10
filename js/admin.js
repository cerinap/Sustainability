document.addEventListener('DOMContentLoaded', function() {
  // Simple admin authentication (this should be replaced with proper authentication in production)
  const adminPassword = "carbon2024"; // Change this to a secure password
  const adminLoginButton = document.getElementById('admin-login-button');
  const adminLogoutButton = document.getElementById('admin-logout-button');
  const adminLogin = document.getElementById('admin-login');
  const adminDashboard = document.getElementById('admin-dashboard');
  
  // Check if admin is already logged in
  if (localStorage.getItem('adminLoggedIn') === 'true') {
    showAdminDashboard();
  }
  
  // Admin login
  adminLoginButton.addEventListener('click', function() {
    const passwordInput = document.getElementById('admin-password');
    if (passwordInput.value === adminPassword) {
      localStorage.setItem('adminLoggedIn', 'true');
      showAdminDashboard();
    } else {
      alert('Incorrect password');
    }
  });
  
  // Admin logout
  adminLogoutButton.addEventListener('click', function() {
    localStorage.removeItem('adminLoggedIn');
    adminLogin.style.display = 'block';
    adminDashboard.style.display = 'none';
  });
  
  // Tab switching
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      // Remove active class from all tabs
      tabs.forEach(t => t.classList.remove('active'));
      // Add active class to clicked tab
      this.classList.add('active');
      
      // Hide all tab content
      document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
      });
      
      // Show selected tab content
      const tabName = this.getAttribute('data-tab');
      document.getElementById(`${tabName}-tab`).style.display = 'block';
      
      // Load data for the selected tab if needed
      if (tabName === 'detailed') {
        loadDetailedResults();
      } else if (tabName === 'users') {
        loadUsers();
      }
    });
  });
  
  // Export to CSV
  document.getElementById('export-csv-button').addEventListener('click', function() {
    exportToCSV();
  });
  
  // Export to Excel
  document.getElementById('export-excel-button').addEventListener('click', function() {
    exportToExcel();
  });
  
  function showAdminDashboard() {
    adminLogin.style.display = 'none';
    adminDashboard.style.display = 'block';
    loadSummaryData();
  }
  
  // Load summary data
  async function loadSummaryData() {
    try {
      // Get all games
      const gamesSnapshot = await db.collection('games').get();
      const games = [];
      gamesSnapshot.forEach(doc => {
        games.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Total players (unique users)
      const uniqueUsers = new Set();
      games.forEach(game => uniqueUsers.add(game.userId));
      document.getElementById('total-players').textContent = `Total Players: ${uniqueUsers.size}`;
      
      // Average score
      const avgScore = games.reduce((sum, game) => sum + game.finalScore, 0) / games.length;
      document.getElementById('average-score').textContent = `Average Final Score: ${avgScore.toFixed(2)} points`;
      
      // Completion rate
      const completedGames = games.filter(game => game.completedGame).length;
      const completionRate = (completedGames / games.length) * 100;
      document.getElementById('completion-rate').textContent = `Completion Rate: ${completionRate.toFixed(2)}%`;
      
      // Analyze choices
      analyzeChoices(games);
      
      // Analyze challenges
      analyzeChallenges(games);
      
    } catch (error) {
      console.error('Error loading summary data:', error);
      document.getElementById('total-players').textContent = 'Error loading statistics.';
    }
  }
  
  // Analyze player choices
  function analyzeChoices(games) {
    // Flatten all choices
    const allChoices = [];
    games.forEach(game => {
      if (game.choices && Array.isArray(game.choices)) {
        game.choices.forEach(choice => {
          allChoices.push({
            title: choice.title,
            selectedOption: choice.selectedOption
          });
        });
      }
    });
    
    // Group by title and count options
    const choicesByTitle = {};
    allChoices.forEach(choice => {
      if (!choicesByTitle[choice.title]) {
        choicesByTitle[choice.title] = {};
      }
      
      if (!choicesByTitle[choice.title][choice.selectedOption]) {
        choicesByTitle[choice.title][choice.selectedOption] = 0;
      }
      
      choicesByTitle[choice.title][choice.selectedOption]++;
    });
    
    // Display results
    let html = '<ul>';
    for (const title in choicesByTitle) {
      html += `<li><strong>${title}</strong>:<ul>`;
      
      const options = choicesByTitle[title];
      const sortedOptions = Object.entries(options)
        .sort((a, b) => b[1] - a[1])
        .map(([option, count]) => `<li>${option}: ${count} player(s) (${((count / allChoices.length) * 100).toFixed(1)}%)</li>`);
      
      html += sortedOptions.join('');
      html += '</ul></li>';
    }
    html += '</ul>';
    
    document.getElementById('common-choices').innerHTML = html;
  }
  
  // Analyze challenge responses
  function analyzeChallenges(games) {
    // Collect all challenge responses
    const allChallenges = [];
    games.forEach(game => {
      if (game.challengeResponses && Array.isArray(game.challengeResponses)) {
        game.challengeResponses.forEach(challenge => {
          allChallenges.push({
            challenge: challenge.challenge,
            selectedOption: challenge.selectedOption
          });
        });
      }
    });
    
    // Group by challenge and count options
    const challengesGrouped = {};
    allChallenges.forEach(challenge => {
      if (!challengesGrouped[challenge.challenge]) {
        challengesGrouped[challenge.challenge] = {};
      }
      
      if (!challengesGrouped[challenge.challenge][challenge.selectedOption]) {
        challengesGrouped[challenge.challenge][challenge.selectedOption] = 0;
      }
      
      challengesGrouped[challenge.challenge][challenge.selectedOption]++;
    });
    
    // Display results
    let html = '<ul>';
    for (const challenge in challengesGrouped) {
      html += `<li><strong>${challenge}</strong>:<ul>`;
      
      const options = challengesGrouped[challenge];
      const sortedOptions = Object.entries(options)
        .sort((a, b) => b[1] - a[1])
        .map(([option, count]) => {
          const total = Object.values(options).reduce((sum, c) => sum + c, 0);
          return `<li>${option}: ${count} player(s) (${((count / total) * 100).toFixed(1)}%)</li>`;
        });
      
      html += sortedOptions.join('');
      html += '</ul></li>';
    }
    html += '</ul>';
    
    document.getElementById('challenge-stats').innerHTML = html;
  }
  
  // Load detailed results
  async function loadDetailedResults() {
    try {
      const tbody = document.getElementById('results-body');
      tbody.innerHTML = '<tr><td colspan="6">Loading data...</td></tr>';
      
      const gamesSnapshot = await db.collection('games').orderBy('playedAt', 'desc').get();
      if (gamesSnapshot.empty) {
        tbody.innerHTML = '<tr><td colspan="6">No games found</td></tr>';
        return;
      }
      
      let html = '';
      gamesSnapshot.forEach(doc => {
        const game = doc.data();
        const date = game.playedAt ? game.playedAt.toDate().toLocaleString() : 'N/A';
        
        html += `
        <tr>
          <td>${game.fullName || 'N/A'}</td>
          <td>${game.userEmail || 'N/A'}</td>
          <td>${date}</td>
          <td>${game.finalScore}</td>
          <td>${game.completedGame ? 'Yes' : 'No'}</td>
          <td>
            <button class="view-details" data-id="${doc.id}">View Details</button>
          </td>
        </tr>
        `;
      });
      
      tbody.innerHTML = html;
      
      // Add event listeners to view details buttons
      document.querySelectorAll('.view-details').forEach(button => {
        button.addEventListener('click', function() {
          const gameId = this.getAttribute('data-id');
          viewGameDetails(gameId);
        });
      });
      
    } catch (error) {
      console.error('Error loading detailed results:', error);
      document.getElementById('results-body').innerHTML = '<tr><td colspan="6">Error loading data</td></tr>';
    }
  }
  
  // Load users
  async function loadUsers() {
    try {
      const tbody = document.getElementById('users-body');
      tbody.innerHTML = '<tr><td colspan="4">Loading users...</td></tr>';
      
      const usersSnapshot = await db.collection('users').orderBy('registeredAt', 'desc').get();
      if (usersSnapshot.empty) {
        tbody.innerHTML = '<tr><td colspan="4">No users found</td></tr>';
        return;
      }
      
      // Get game counts by user
      const gamesSnapshot = await db.collection('games').get();
      const gameCountsByUser = {};
      gamesSnapshot.forEach(doc => {
        const game = doc.data();
        if (game.userId) {
          if (!gameCountsByUser[game.userId]) {
            gameCountsByUser[game.userId] = 0;
          }
          gameCountsByUser[game.userId]++;
        }
      });
      
      let html = '';
      usersSnapshot.forEach(doc => {
        const user = doc.data();
        const date = user.registeredAt ? user.registeredAt.toDate().toLocaleString() : 'N/A';
        const gamesPlayed = gameCountsByUser[doc.id] || 0;
        
        html += `
        <tr>
          <td>${user.fullName || 'N/A'}</td>
          <td>${user.email || 'N/A'}</td>
          <td>${date}</td>
          <td>${gamesPlayed}</td>
        </tr>
        `;
      });
      
      tbody.innerHTML = html;
      
    } catch (error) {
      console.error('Error loading users:', error);
      document.getElementById('users-body').innerHTML = '<tr><td colspan="4">Error loading users</td></tr>';
    }
  }
  
  // View game details
  async function viewGameDetails(gameId) {
    try {
      const gameDoc = await db.collection('games').doc(gameId).get();
      if (!gameDoc.exists) {
        alert('Game not found');
        return;
      }
      
      const game = gameDoc.data();
      
      // Create modal for game details
      const modal = document.createElement('div');
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
      modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      modal.style.display = 'flex';
      modal.style.justifyContent = 'center';
      modal.style.alignItems = 'center';
      modal.style.zIndex = '1000';
      
      // Create modal content
      const content = document.createElement('div');
      content.style.backgroundColor = 'white';
      content.style.padding = '20px';
      content.style.borderRadius = '10px';
      content.style.maxWidth = '800px';
      content.style.width = '90%';
      content.style.maxHeight = '90vh';
      content.style.overflow = 'auto';
      
      // Add close button
      const closeButton = document.createElement('button');
      closeButton.textContent = 'Close';
      closeButton.style.float = 'right';
      closeButton.style.padding = '5px 10px';
      closeButton.style.backgroundColor = '#f44336';
      closeButton.style.color = 'white';
      closeButton.style.border = 'none';
      closeButton.style.borderRadius = '5px';
      closeButton.style.cursor = 'pointer';
      closeButton.addEventListener('click', function() {
        document.body.removeChild(modal);
      });
      
      // Game details HTML
      const detailsHTML = `
        <h2>Game Details</h2>
        <p><strong>Player:</strong> ${game.fullName} (${game.userEmail})</p>
        <p><strong>Date:</strong> ${game.playedAt ? game.playedAt.toDate().toLocaleString() : 'N/A'}</p>
        <p><strong>Final Score:</strong> ${game.finalScore}</p>
        <p><strong>Completed:</strong> ${game.completedGame ? 'Yes' : 'No'}</p>
        
        <h3>Player Choices</h3>
        <ul>
          ${game.choices && game.choices.map(choice => 
            `<li><strong>${choice.title}</strong>: ${choice.selectedOption} (${choice.points} points)</li>`
          ).join('') || 'No choices recorded'}
        </ul>
        
        <h3>Challenge Responses</h3>
        <ul>
          ${game.challengeResponses && game.challengeResponses.map(challenge => 
            `<li><strong>${challenge.challenge}</strong>: ${challenge.selectedOption} (${challenge.points} points)</li>`
          ).join('') || 'No challenges encountered'}
        </ul>
      `;
      
      content.innerHTML = detailsHTML;
      content.appendChild(closeButton);
      modal.appendChild(content);
      document.body.appendChild(modal);
      
    } catch (error) {
      console.error('Error viewing game details:', error);
      alert('Error viewing game details');
    }
  }
  
  // Export all data to CSV
  async function exportToCSV() {
    try {
      // Get all games
      const gamesSnapshot = await db.collection('games').orderBy('playedAt', 'desc').get();
      const games = [];
      gamesSnapshot.forEach(doc => {
        games.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      if (games.length === 0) {
        alert('No data to export');
        return;
      }
      
      // Format data for CSV
      const csvData = [];
      
      // Headers
      csvData.push([
        'Full Name', 
        'Email', 
        'Date', 
        'Final Score', 
        'Completed Game',
        'Challenges',
        'Choices'
      ]);
      
      // Data rows
      games.forEach(game => {
        const row = [
          game.fullName || '',
          game.userEmail || '',
          game.playedAt ? game.playedAt.toDate().toLocaleString() : '',
          game.finalScore || 0,
          game.completedGame ? 'Yes' : 'No',
          // Format challenges
          game.challengeResponses ? game.challengeResponses.map(c => 
            `${c.challenge}: ${c.selectedOption} (${c.points})`
          ).join('; ') : '',
          // Format choices
          game.choices ? game.choices.map(c => 
            `${c.title}: ${c.selectedOption} (${c.points})`
          ).join('; ') : ''
        ];
        
        csvData.push(row);
      });
      
      // Convert to CSV string
      let csvContent = '';
      csvData.forEach(row => {
        // Properly escape and quote CSV fields
        const formattedRow = row.map(field => {
          // If field contains commas, quotes, or newlines, wrap in quotes and escape quotes
          if (typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
            return `"${field.replace(/"/g, '""')}"`;
          }
          return field;
        });
        csvContent += formattedRow.join(',') + '\n';
      });
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `carbon_choices_data_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      alert('Error exporting data to CSV');
    }
  }
  
  // Export all data to Excel
  async function exportToExcel() {
    try {
      // Get all games
      const gamesSnapshot = await db.collection('games').orderBy('playedAt', 'desc').get();
      const games = [];
      gamesSnapshot.forEach(doc => {
        games.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      if (games.length === 0) {
        alert('No data to export');
        return;
      }
      
      // Format data for Excel
      const excelData = [];
      
      // Data rows for summary sheet
      games.forEach(game => {
        // Convert Firestore timestamp to date string
        let playedAtString = '';
        if (game.playedAt) {
          const date = game.playedAt.toDate();
          playedAtString = date.toLocaleString();
        }
        
        excelData.push({
          'Full Name': game.fullName || '',
          'Email': game.userEmail || '',
          'Date': playedAtString,
          'Final Score': game.finalScore || 0,
          'Completed Game': game.completedGame ? 'Yes' : 'No',
          'Challenges': game.challengeResponses ? game.challengeResponses.length : 0,
          'Choices': game.choices ? game.choices.length : 0
        });
      });
      
      // Create workbook with multiple sheets
      const wb = XLSX.utils.book_new();
      
      // Summary sheet
      const summaryWs = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
      
      // Choices sheet - detailed breakdown of all choices
      const choicesData = [];
      games.forEach(game => {
        if (game.choices && Array.isArray(game.choices)) {
          game.choices.forEach(choice => {
            choicesData.push({
              'Player': game.fullName || '',
              'Email': game.userEmail || '',
              'Section': choice.section || '',
              'Choice': choice.title || '',
              'Selected Option': choice.selectedOption || '',
              'Points': choice.points || 0
            });
          });
        }
      });
      
      if (choicesData.length > 0) {
        const choicesWs = XLSX.utils.json_to_sheet(choicesData);
        XLSX.utils.book_append_sheet(wb, choicesWs, 'Choices');
      }
      
      // Challenges sheet
      const challengesData = [];
      games.forEach(game => {
        if (game.challengeResponses && Array.isArray(game.challengeResponses)) {
          game.challengeResponses.forEach(challenge => {
            challengesData.push({
              'Player': game.fullName || '',
              'Email': game.userEmail || '',
              'Challenge': challenge.challenge || '',
              'Selected Option': challenge.selectedOption || '',
              'Points': challenge.points || 0
            });
          });
        }
      });
      
      if (challengesData.length > 0) {
        const challengesWs = XLSX.utils.json_to_sheet(challengesData);
        XLSX.utils.book_append_sheet(wb, challengesWs, 'Challenges');
      }
      
      // Generate Excel file and download
      XLSX.writeFile(wb, `carbon_choices_data_${new Date().toISOString().slice(0, 10)}.xlsx`);
      
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Error exporting data to Excel');
    }
  }
});
