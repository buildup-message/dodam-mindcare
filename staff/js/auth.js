let idToken = null;

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

function hasValidStoredToken() {
  const storedToken = localStorage.getItem('dodam_id_token');
  if (storedToken) {
    const payload = parseJwt(storedToken);
    if (payload && payload.exp && (payload.exp * 1000 > Date.now())) {
      idToken = storedToken;
      return true;
    } else {
      localStorage.removeItem('dodam_id_token');
    }
  }
  return false;
}

function initGoogleLogin(onSuccess) {
  google.accounts.id.initialize({
    client_id: window.DODAM_STAFF_CONFIG.googleClientId,
    auto_select: true,
    callback: function (response) {
      idToken = response.credential;
      localStorage.setItem('dodam_id_token', idToken);
      onSuccess();
    }
  });
  google.accounts.id.renderButton(
    document.getElementById('google-signin-button'),
    { theme: 'outline', size: 'large' }
  );
}

function getIdToken() {
  if (!idToken) throw new Error('로그인이 필요합니다');
  return idToken;
}

function clearAuthAndGoToLogin() {
  idToken = null;
  localStorage.removeItem('dodam_id_token');
  const appShell = document.getElementById('app-shell');
  const loginScreen = document.getElementById('login-screen');
  const loginError = document.getElementById('login-error');
  if (appShell) appShell.hidden = true;
  if (loginScreen) loginScreen.hidden = false;
  if (loginError) loginError.textContent = '세션이 만료되었습니다. 다시 로그인해주세요.';
  
  // Need to make sure google login is initialized if it wasn't already
  if (window.appStartFn) {
    initGoogleLogin(window.appStartFn);
  }
}
