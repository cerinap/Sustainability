document.addEventListener('DOMContentLoaded', function() {
  const loginButton = document.getElementById('login-button');
  const emailInput = document.getElementById('email');
  const fullNameInput = document.getElementById('fullName');
  const emailError = document.getElementById('email-error');
  const nameError = document.getElementById('name-error');

  // Handle login button click
  loginButton.addEventListener('click', async function() {
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
    
    if (!isValidESCPEmail(email)) {
      emailError.style.display = 'block';
      hasError = true;
    }
    
    if (hasError) return;
    
    // Disable button during login
    loginButton.disabled = true;
    loginButton.textContent = 'Logging in...';
    
    // Login with email
    const result = await loginWithEmail(email, fullName);
    
    if (result.success) {
      // Redirect to game page happens automatically through auth state observer
    } else {
      alert('Error logging in: ' + result.error);
      loginButton.disabled = false;
      loginButton.textContent = 'Login & Start Game';
    }
  });
});
