// Auth Module - Firebase Email/Password Authentication with Email Verification
const AuthModule = {
  currentUser: null,
  isAdmin: false,
  pendingUser: null, // holds user during email verification

  init() {
    // Setup tab switching for Login/Register
    document.querySelectorAll('.login-tabs .tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.login-tabs .tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        const tabId = btn.dataset.tab + '-tab';
        document.getElementById(tabId).classList.add('active');
      });
    });

    // Check Firebase auth state
    try {
      auth.onAuthStateChanged(user => {
        if (user && user.emailVerified) {
          this.currentUser = user;
          this.isAdmin = (user.email === ADMIN_EMAIL);
          this.showApp();
        } else if (user && !user.emailVerified) {
          // User exists but not verified - show verify screen
          this.pendingUser = user;
          this.showVerifyScreen();
        } else {
          // No user - check localStorage fallback
          const session = localStorage.getItem('hc_session');
          if (session) {
            this.currentUser = JSON.parse(session);
            this.isAdmin = (this.currentUser.email === ADMIN_EMAIL);
            this.showApp();
          }
        }
      });
    } catch (e) {
      // Firebase not configured - use localStorage fallback
      console.log('Firebase not configured, using localStorage fallback');
      const session = localStorage.getItem('hc_session');
      if (session) {
        this.currentUser = JSON.parse(session);
        this.isAdmin = (this.currentUser.email === ADMIN_EMAIL);
        this.showApp();
      }
    }
  },

  // ===== REGISTER =====
  async registerWithEmail() {
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;

    if (!name) { this.showError('Please enter your name'); return; }
    if (!email || !email.includes('@')) { this.showError('Please enter a valid email'); return; }
    if (password.length < 6) { this.showError('Password must be at least 6 characters'); return; }
    if (password !== confirm) { this.showError('Passwords do not match'); return; }

    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Update display name
      await user.updateProfile({ displayName: name });

      // Send verification email
      await user.sendEmailVerification();

      // Save profile to Firestore
      try {
        await db.collection('users').doc(user.uid).set({
          name: name,
          email: email,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          avatar: '👤'
        });
      } catch (e) {
        console.log('Firestore save skipped:', e.message);
      }

      this.pendingUser = user;
      this.showSuccess('Account created! Please verify your email.');
      setTimeout(() => this.showVerifyScreen(), 1500);
    } catch (error) {
      this.handleFirebaseError(error);
    }
  },

  // ===== LOGIN =====
  async loginWithEmail() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !email.includes('@')) { this.showError('Enter a valid email'); return; }
    if (!password) { this.showError('Enter your password'); return; }

    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        this.pendingUser = user;
        this.showError('Please verify your email first');
        setTimeout(() => this.showVerifyScreen(), 1500);
        return;
      }

      this.currentUser = user;
      this.isAdmin = (user.email === ADMIN_EMAIL);
      
      // Save session to localStorage as backup
      localStorage.setItem('hc_session', JSON.stringify({
        email: user.email,
        name: user.displayName || email.split('@')[0],
        uid: user.uid
      }));

      this.showSuccess('Login successful!');
      setTimeout(() => this.showApp(), 600);
    } catch (error) {
      this.handleFirebaseError(error);
    }
  },

  // ===== FORGOT PASSWORD =====
  showForgotPassword() {
    document.querySelectorAll('.login-tabs .tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById('forgot-tab').classList.add('active');
  },

  async sendPasswordReset() {
    const email = document.getElementById('forgot-email').value.trim();
    if (!email || !email.includes('@')) { this.showError('Enter a valid email'); return; }

    try {
      await auth.sendPasswordResetEmail(email);
      this.showSuccess('Password reset link sent to ' + email + '. Check your inbox!');
    } catch (error) {
      this.handleFirebaseError(error);
    }
  },

  // ===== VERIFY EMAIL =====
  showVerifyScreen() {
    document.querySelectorAll('.login-tabs .tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById('verify-tab').classList.add('active');
  },

  async checkVerification() {
    if (this.pendingUser) {
      try {
        await this.pendingUser.reload();
        if (this.pendingUser.emailVerified) {
          this.currentUser = this.pendingUser;
          this.isAdmin = (this.pendingUser.email === ADMIN_EMAIL);
          localStorage.setItem('hc_session', JSON.stringify({
            email: this.pendingUser.email,
            name: this.pendingUser.displayName || this.pendingUser.email.split('@')[0],
            uid: this.pendingUser.uid
          }));
          this.showSuccess('Email verified! Logging in...');
          setTimeout(() => this.showApp(), 600);
        } else {
          this.showError('Email not yet verified. Please check your inbox.');
        }
      } catch (e) {
        this.showError('Error checking verification. Try again.');
      }
    } else {
      this.showError('No pending verification. Please register first.');
    }
  },

  async resendVerification() {
    if (this.pendingUser) {
      try {
        await this.pendingUser.sendEmailVerification();
        this.showSuccess('Verification email resent!');
      } catch (e) {
        this.showError('Could not resend. Wait a moment and try again.');
      }
    }
  },

  showLogin() {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById('login-tab').classList.add('active');
    document.querySelectorAll('.login-tabs .tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-login').classList.add('active');
  },

  // ===== SHOW APP =====
  showApp() {
    document.getElementById('login-screen').classList.remove('active-screen');
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-screen').classList.add('active-screen');

    // Update sidebar info
    const name = this.currentUser.displayName || this.currentUser.name || 'User';
    const email = this.currentUser.email || '';
    document.getElementById('sidebar-username').textContent = name;
    document.getElementById('sidebar-email').textContent = email;

    // Load saved avatar
    const savedAvatar = localStorage.getItem('hc_avatar') || '👤';
    this.setAvatarDisplay(savedAvatar);

    // Show admin button in sidebar if admin
    if (this.isAdmin) {
      const adminBtn = document.createElement('button');
      adminBtn.className = 'sidebar-item';
      adminBtn.innerHTML = '<span>🔒</span>Admin Panel';
      adminBtn.onclick = () => UI.openModal('admin-modal');
      const nav = document.querySelector('.sidebar-nav');
      const divider = document.querySelector('.sidebar-divider');
      nav.insertBefore(adminBtn, divider);
    }

    // Init app
    if (typeof AppMain !== 'undefined') AppMain.init();
  },

  setAvatarDisplay(avatar) {
    // Update all avatar displays
    const sidebarAvatar = document.getElementById('sidebar-avatar-img');
    const profileAvatar = document.getElementById('profile-avatar-img');
    const settingsDp = document.getElementById('settings-dp');

    if (avatar.startsWith('http') || avatar.startsWith('data:')) {
      // Image URL
      const imgTag = `<img src="${avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
      if (sidebarAvatar) sidebarAvatar.innerHTML = imgTag;
      if (profileAvatar) profileAvatar.innerHTML = imgTag;
      if (settingsDp) settingsDp.innerHTML = imgTag;
    } else {
      // Emoji
      if (sidebarAvatar) sidebarAvatar.textContent = avatar;
      if (profileAvatar) profileAvatar.textContent = avatar;
      if (settingsDp) settingsDp.textContent = avatar;
    }
  },

  // ===== LOGOUT =====
  logout() {
    try { auth.signOut(); } catch (e) {}
    localStorage.removeItem('hc_session');
    this.currentUser = null;
    this.isAdmin = false;
    location.reload();
  },

  // ===== ERROR HANDLING =====
  handleFirebaseError(error) {
    const code = error.code || '';
    const errorMessages = {
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/email-already-in-use': 'An account with this email already exists',
      'auth/weak-password': 'Password is too weak (min 6 characters)',
      'auth/invalid-email': 'Invalid email address',
      'auth/too-many-requests': 'Too many attempts. Try again later',
      'auth/network-request-failed': 'Network error. Check your connection',
      'auth/invalid-credential': 'Invalid email or password'
    };
    this.showError(errorMessages[code] || error.message || 'Authentication failed');
  },

  showError(msg) {
    const el = document.getElementById('login-error');
    el.textContent = msg; el.classList.remove('hidden');
    document.getElementById('login-success').classList.add('hidden');
    setTimeout(() => el.classList.add('hidden'), 4000);
  },

  showSuccess(msg) {
    const el = document.getElementById('login-success');
    el.textContent = msg; el.classList.remove('hidden');
    document.getElementById('login-error').classList.add('hidden');
    setTimeout(() => el.classList.add('hidden'), 4000);
  }
};
