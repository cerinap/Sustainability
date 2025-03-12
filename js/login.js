document.addEventListener('DOMContentLoaded', function() {
  const loginButton = document.getElementById('login-button');
  const emailInput = document.getElementById('email');
  const fullNameInput = document.getElementById('fullName');
  const emailError = document.getElementById('email-error');
  const nameError = document.getElementById('name-error');

  // Handle login button click
  loginButton.addEventListener('click', function() {
    // Reset error messages
    emailError.style.display = 'none';
    nameError.style.display = 'none';
    
    const email = emailInput.value.trim();
    const fullName = fullNameInput.value.trim();
    
    // Validate inputs
    let hasError = false;
    
    if (!fullName) {
      nameError.style.display = 'block';
      hasError = true;
    }
    
    // Check for ESCP email format - simplified pattern
    if (!email.endsWith('@edu.escp.eu') || email.indexOf('.') === -1) {
      emailError.style.display = 'block';
      hasError = true;
    }
    
    if (hasError) return;
    
    // Store user info in localStorage
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userName', fullName);
    localStorage.setItem('userLoggedIn', 'true');
    localStorage.setItem('loginTime', new Date().toISOString());
    
    // Redirect to game
    window.location.href = 'game.html';
  });
});
