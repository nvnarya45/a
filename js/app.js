// ===== Preloaded Avatar Options =====
const AVATAR_OPTIONS = [
  // Emoji avatars
  '👤', '👨', '👩', '🧑', '👦', '👧', '👨‍💻', '👩‍💻',
];

// ===== Calendar Engine =====
const CalendarEngine = {
  year: new Date().getFullYear(),
  month: new Date().getMonth(),
  weekStart: 0, // 0=Sunday
  compact: false,
  showWeekends: true,

  init() {
    this.populateSelectors();
    this.render();
  },

  populateSelectors() {
    const mp = document.getElementById('month-picker');
    const yp = document.getElementById('year-picker');
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    mp.innerHTML = months.map((m,i) => `<option value="${i}" ${i===this.month?'selected':''}>${m}</option>`).join('');
    yp.innerHTML = '';
    for (let y = 1950; y <= 2100; y++) {
      yp.innerHTML += `<option value="${y}" ${y===this.year?'selected':''}>${y}</option>`;
    }
  },

  isAnimating: false,

  render() {
    document.getElementById('header-month-year').textContent =
      new Date(this.year, this.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    document.getElementById('month-picker').value = this.month;
    document.getElementById('year-picker').value = this.year;
    this.renderHeaders();
    this.renderGrid();
  },

  // Animate the calendar grid with a swipe transition
  // direction: 'left' (next month) or 'right' (prev month)
  animateSwipe(direction, callback) {
    if (this.isAnimating) return;
    this.isAnimating = true;
    const grid = document.getElementById('calendar-grid');
    const outClass = direction === 'left' ? 'swipe-left-out' : 'swipe-right-out';
    const inClass = direction === 'left' ? 'swipe-left-in' : 'swipe-right-in';

    // Phase 1: Slide out
    grid.classList.add(outClass);
    grid.addEventListener('animationend', function handler() {
      grid.removeEventListener('animationend', handler);
      grid.classList.remove(outClass);

      // Phase 2: Update month data
      callback();

      // Phase 3: Slide in
      grid.classList.add(inClass);
      grid.addEventListener('animationend', function handler2() {
        grid.removeEventListener('animationend', handler2);
        grid.classList.remove(inClass);
        CalendarEngine.isAnimating = false;
      });
    });
  },

  renderHeaders() {
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const ordered = [...days.slice(this.weekStart), ...days.slice(0, this.weekStart)];
    const container = document.getElementById('day-headers');
    container.innerHTML = ordered.map((d, i) => {
      const realDay = (i + this.weekStart) % 7;
      const isWE = realDay === 0 || realDay === 6;
      return `<div class="day-h ${isWE && this.showWeekends ? 'weekend-h' : ''}">${d}</div>`;
    }).join('');
  },

  renderGrid() {
    const grid = document.getElementById('calendar-grid');
    const firstDay = new Date(this.year, this.month, 1).getDay();
    const daysInMonth = new Date(this.year, this.month + 1, 0).getDate();
    const today = new Date();
    const todayStr = this.formatDate(today.getFullYear(), today.getMonth(), today.getDate());
    let offset = (firstDay - this.weekStart + 7) % 7;
    let html = '';
    // Empty cells
    for (let i = 0; i < offset; i++) html += '<div class="cal-cell empty"></div>';
    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = this.formatDate(this.year, this.month, d);
      const dow = new Date(this.year, this.month, d).getDay();
      const isToday = dateStr === todayStr;
      const isWeekend = dow === 0 || dow === 6;
      const holiday = HolidayData.getHoliday(dateStr);
      let cls = 'cal-cell';
      if (isToday) cls += ' today';
      else if (holiday) cls += holiday.type === 'GH' ? ' gh' : ' rh';
      else if (isWeekend && this.showWeekends) cls += ' weekend-cell';

      let inner = `<span class="day-num">${d}</span>`;
      if (holiday) {
        inner += `<span class="holiday-label">${holiday.name}</span>`;
        inner += `<span class="type-dot">${holiday.type}</span>`;
      }
      html += `<div class="${cls}" onclick="AppMain.openDetail('${dateStr}')" data-date="${dateStr}">${inner}</div>`;
    }
    grid.innerHTML = html;
    if (this.compact) grid.parentElement.classList.add('compact');
    else grid.parentElement.classList.remove('compact');
  },

  formatDate(y, m, d) {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  },

  prevMonth(animate = true) {
    if (animate) {
      this.animateSwipe('right', () => {
        this.month--; if (this.month < 0) { this.month = 11; this.year--; }
        this.render();
      });
    } else {
      this.month--; if (this.month < 0) { this.month = 11; this.year--; }
      this.render();
    }
  },
  nextMonth(animate = true) {
    if (animate) {
      this.animateSwipe('left', () => {
        this.month++; if (this.month > 11) { this.month = 0; this.year++; }
        this.render();
      });
    } else {
      this.month++; if (this.month > 11) { this.month = 0; this.year++; }
      this.render();
    }
  },
  goToToday() {
    const t = new Date();
    const needsAnimation = (this.year !== t.getFullYear() || this.month !== t.getMonth());
    
    let direction = 'left';
    if (this.year > t.getFullYear() || (this.year === t.getFullYear() && this.month > t.getMonth())) {
      direction = 'right'; // we are in the future, returning to today means swiping back
    }

    if (needsAnimation) {
      this.animateSwipe(direction, () => {
        this.year = t.getFullYear(); 
        this.month = t.getMonth();
        this.render();
        this.flashToday();
      });
    } else {
      this.year = t.getFullYear(); 
      this.month = t.getMonth();
      this.render();
      this.flashToday();
    }
  },
  flashToday() {
    setTimeout(() => {
      const todayCell = document.querySelector('.cal-cell.today');
      if (todayCell) {
        todayCell.style.transform = 'scale(1.2)';
        todayCell.style.boxShadow = '0 0 40px rgba(236,72,152,.8)';
        setTimeout(() => { todayCell.style.transform = ''; todayCell.style.boxShadow = ''; }, 500);
      }
    }, 350);
  },
  jumpToMonth() {
    const targetMonth = parseInt(document.getElementById('month-picker').value);
    if (targetMonth === this.month) return;
    const direction = targetMonth > this.month ? 'left' : 'right';
    this.animateSwipe(direction, () => {
      this.month = targetMonth;
      this.render();
    });
  },
  jumpToYear() {
    const targetYear = parseInt(document.getElementById('year-picker').value);
    if (targetYear === this.year) return;
    const direction = targetYear > this.year ? 'left' : 'right';
    this.animateSwipe(direction, () => {
      this.year = targetYear;
      this.render();
    });
  }
};

// ===== UI Module =====
const UI = {
  sidebarOpen: false,

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
    document.getElementById('sidebar').classList.toggle('open', this.sidebarOpen);
    document.getElementById('sidebar-overlay').classList.toggle('open', this.sidebarOpen);
  },

  openModal(id) {
    if (this.sidebarOpen) this.toggleSidebar(); // close sidebar first
    setTimeout(() => {
      document.getElementById(id).classList.add('open');
      // If avatar modal, populate grid
      if (id === 'avatar-modal') this.populateAvatarGrid();
    }, 100);
  },

  closeModal(id) {
    document.getElementById(id).classList.remove('open');
  },

  closeModalOnBg(e, id) {
    if (e.target === e.currentTarget) this.closeModal(id);
  },

  populateAvatarGrid() {
    const grid = document.getElementById('avatar-grid');
    const savedAvatar = localStorage.getItem('hc_avatar') || '👤';
    grid.innerHTML = AVATAR_OPTIONS.map(avatar => {
      const isSelected = avatar === savedAvatar;
      return `<div class="avatar-option ${isSelected ? 'selected' : ''}" onclick="UI.selectAvatar('${avatar}')">
        <span class="avatar-emoji">${avatar}</span>
      </div>`;
    }).join('');
  },

  selectAvatar(avatar) {
    localStorage.setItem('hc_avatar', avatar);
    AuthModule.setAvatarDisplay(avatar);
    
    // Update selection UI
    document.querySelectorAll('.avatar-option').forEach(el => {
      el.classList.toggle('selected', el.querySelector('.avatar-emoji').textContent === avatar);
    });

    // Save to Firestore if available
    try {
      if (AuthModule.currentUser && AuthModule.currentUser.uid) {
        db.collection('users').doc(AuthModule.currentUser.uid).update({ avatar: avatar });
      }
    } catch (e) { console.log('Firestore avatar save skipped'); }

    UI.toast('Profile picture updated!');
    setTimeout(() => this.closeModal('avatar-modal'), 500);
  },

  filterHolidayList(type) {
    document.querySelectorAll('.hl-tab').forEach(t => t.classList.toggle('active', t.textContent.includes(type === 'all' ? 'All' : type)));
    const list = document.getElementById('holiday-full-list');
    let holidays = HolidayData.getAllHolidays();
    if (type !== 'all') holidays = holidays.filter(h => h.type === type);
    list.innerHTML = holidays.map(h => {
      const dt = new Date(h.date);
      const dateLabel = dt.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
      return `<div class="hl-card">
        <span class="hl-card-date">${dateLabel}</span>
        <span class="hl-card-name">${h.name}</span>
        <span class="hl-card-type" style="background:${h.type === 'GH' ? 'var(--gh)' : 'var(--rh)'}">${h.type}</span>
      </div>`;
    }).join('') || '<p style="color:var(--text-sec)">No holidays found</p>';
  },

  toast(msg) {
    const t = document.getElementById('toast');
    document.getElementById('toast-msg').textContent = msg;
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 2500);
  }
};

// ===== Settings Module =====
const SettingsModule = {
  init() {
    const s = JSON.parse(localStorage.getItem('hc_settings') || '{}');
    if (s.compact) { CalendarEngine.compact = true; document.querySelectorAll('.seg-btn').forEach(b => { if(b.textContent==='Compact') b.classList.add('active'); if(b.textContent==='Regular') b.classList.remove('active'); }); }
    if (s.weekStart === 1) { CalendarEngine.weekStart = 1; }
    if (s.panchang === false) document.getElementById('toggle-panchang').checked = false;
    if (s.weekends === false) { CalendarEngine.showWeekends = false; document.getElementById('toggle-weekends').checked = false; }
    // Load profile
    const p = JSON.parse(localStorage.getItem('hc_profile') || '{}');
    if (p.name) document.getElementById('profile-name').value = p.name;
    // Set email from auth
    const email = AuthModule.currentUser ? (AuthModule.currentUser.email || '') : '';
    document.getElementById('profile-email').value = email || (p.email || '');
    if (p.mobile) document.getElementById('profile-mobile').value = p.mobile;
    if (p.gender) document.getElementById('profile-gender').value = p.gender;
    if (p.state) document.getElementById('profile-state').value = p.state;
    this.updateProfileDisplay(p);
  },

  save() {
    const s = { compact: CalendarEngine.compact, weekStart: CalendarEngine.weekStart, panchang: document.getElementById('toggle-panchang').checked, weekends: CalendarEngine.showWeekends };
    localStorage.setItem('hc_settings', JSON.stringify(s));
  },

  setCalMode(mode) {
    CalendarEngine.compact = mode === 'compact';
    document.querySelectorAll('.seg-control').forEach(c => {
      const btns = c.querySelectorAll('.seg-btn');
      if (btns[0] && (btns[0].textContent === 'Regular' || btns[0].textContent === 'Compact')) {
        btns.forEach(b => b.classList.toggle('active', b.textContent.toLowerCase() === mode));
      }
    });
    CalendarEngine.render();
    this.save();
  },

  setWeekStart(day) {
    CalendarEngine.weekStart = day;
    document.querySelectorAll('[data-start]').forEach(b => b.classList.toggle('active', parseInt(b.dataset.start) === day));
    CalendarEngine.render();
    this.save();
  },

  togglePanchang() { this.save(); },
  toggleWeekends() {
    CalendarEngine.showWeekends = document.getElementById('toggle-weekends').checked;
    CalendarEngine.render();
    this.save();
  },

  saveProfile() {
    const p = {
      name: document.getElementById('profile-name').value,
      email: document.getElementById('profile-email').value,
      mobile: document.getElementById('profile-mobile').value,
      gender: document.getElementById('profile-gender').value,
      state: document.getElementById('profile-state').value
    };
    localStorage.setItem('hc_profile', JSON.stringify(p));
    this.updateProfileDisplay(p);

    // Save to Firestore
    try {
      if (AuthModule.currentUser && AuthModule.currentUser.uid) {
        db.collection('users').doc(AuthModule.currentUser.uid).update({
          name: p.name,
          mobile: p.mobile,
          gender: p.gender,
          state: p.state
        });
      }
    } catch (e) { console.log('Firestore profile save skipped'); }

    UI.toast('Profile saved!');
  },

  updateProfileDisplay(p) {
    if (p.name) {
      document.getElementById('profile-display-name').textContent = p.name;
      document.getElementById('sidebar-username').textContent = p.name;
    }
    const email = AuthModule.currentUser ? (AuthModule.currentUser.email || '') : (p.email || '');
    if (email) {
      document.getElementById('profile-display-email').textContent = email;
      document.getElementById('sidebar-email').textContent = email;
    }
    document.getElementById('profile-display-mobile').textContent = p.mobile || '—';
    document.getElementById('profile-display-gender').textContent = p.gender || '—';
    document.getElementById('profile-display-state').textContent = p.state || '—';
  }
};

// ===== Notes Module =====
const NotesModule = {
  currentDate: '',

  loadNote(dateStr) {
    this.currentDate = dateStr;
    const notes = JSON.parse(localStorage.getItem('hc_notes') || '{}');
    document.getElementById('note-textarea').value = notes[dateStr] || '';
  },

  saveNote() {
    const text = document.getElementById('note-textarea').value;
    const notes = JSON.parse(localStorage.getItem('hc_notes') || '{}');
    if (text.trim()) notes[this.currentDate] = text;
    else delete notes[this.currentDate];
    localStorage.setItem('hc_notes', JSON.stringify(notes));
    UI.toast('Note saved!');
  }
};

// ===== Admin Module =====
const AdminModule = {
  saveHoliday() {
    // Check admin access
    if (!AuthModule.isAdmin) { UI.toast('Admin access denied'); return; }
    const date = document.getElementById('admin-date').value;
    const type = document.getElementById('admin-type').value;
    const name = document.getElementById('admin-name').value.trim();
    const desc = document.getElementById('admin-desc').value.trim();
    if (!date || !name) { UI.toast('Fill date and name'); return; }
    HolidayData.addHoliday(date, name, type, desc);
    CalendarEngine.render();
    this.renderList();
    UI.toast('Holiday saved!');
  },

  removeHoliday() {
    if (!AuthModule.isAdmin) { UI.toast('Admin access denied'); return; }
    const date = document.getElementById('admin-date').value;
    if (!date) { UI.toast('Select a date'); return; }
    HolidayData.removeHoliday(date);
    CalendarEngine.render();
    this.renderList();
    UI.toast('Holiday removed');
  },

  renderList() {
    const list = document.getElementById('admin-holiday-list');
    const all = HolidayData.getAllHolidays();
    list.innerHTML = all.map(h => `<div class="hl-card"><span class="hl-card-date">${h.date}</span><span class="hl-card-name">${h.name}</span><span class="hl-card-type" style="background:${h.type==='GH'?'var(--gh)':'var(--rh)'}">${h.type}</span></div>`).join('');
  },

  saveInlineHoliday() {
    if (!AuthModule.isAdmin) return;
    const date = AppMain.currentDate;
    const type = document.getElementById('inline-admin-type').value;
    const name = document.getElementById('inline-admin-name').value.trim();
    const desc = document.getElementById('inline-admin-desc').value.trim();
    if (!date || !name) { UI.toast('Fill name'); return; }
    HolidayData.addHoliday(date, name, type, desc);
    CalendarEngine.render();
    this.renderList();
    UI.toast('Holiday saved!');
    AppMain.openDetail(date); // Refresh view
  },

  removeInlineHoliday() {
    if (!AuthModule.isAdmin) return;
    const date = AppMain.currentDate;
    if (!date) return;
    HolidayData.removeHoliday(date);
    CalendarEngine.render();
    this.renderList();
    UI.toast('Holiday removed');
    AppMain.openDetail(date); // Refresh view
  }
};

// ===== Main App =====
const AppMain = {
  adminTapCount: 0,
  currentDate: null,

  init() {
    ThemeEngine.init();
    SettingsModule.init();
    CalendarEngine.init();
    UI.filterHolidayList('all');
    AdminModule.renderList();

    // Admin access: 5-tap header title (only works for admin email)
    document.getElementById('header-month-year').addEventListener('click', () => {
      if (!AuthModule.isAdmin) return; // Only admin can access
      this.adminTapCount++;
      if (this.adminTapCount >= 5) {
        this.adminTapCount = 0;
        UI.openModal('admin-modal');
      }
      setTimeout(() => this.adminTapCount = 0, 2000);
    });

    // Swipe navigation with animation
    let touchStartX = 0;
    let touchStartY = 0;
    const cal = document.getElementById('calendar-container');
    cal.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    cal.addEventListener('touchend', e => {
      const diffX = e.changedTouches[0].clientX - touchStartX;
      const diffY = e.changedTouches[0].clientY - touchStartY;
      // Only trigger if horizontal swipe is dominant
      if (Math.abs(diffX) > 60 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
        if (diffX > 0) CalendarEngine.prevMonth(true);
        else CalendarEngine.nextMonth(true);
      }
    }, { passive: true });
  },

  openDetail(dateStr) {
    this.currentDate = dateStr;
    const dt = new Date(dateStr + 'T00:00:00');
    const holiday = HolidayData.getHoliday(dateStr);
    const dayLabel = dt.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    document.getElementById('detail-date').textContent = dayLabel;
    document.getElementById('detail-title').textContent = holiday ? holiday.name : 'Regular Day';
    document.getElementById('detail-desc').textContent = holiday ? holiday.desc : 'No holiday on this date.';

    const badge = document.getElementById('detail-type-badge');
    if (holiday) {
      badge.textContent = holiday.type === 'GH' ? 'Gazetted Holiday' : 'Restricted Holiday';
      badge.className = 'type-badge ' + (holiday.type === 'GH' ? 'gh-b' : 'rh-b');
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }

    // Panchang
    const showP = document.getElementById('toggle-panchang').checked;
    const pSection = document.getElementById('panchang-section');
    pSection.style.display = showP ? 'block' : 'none';
    if (showP) {
      const p = HolidayData.getPanchang(dateStr);
      document.getElementById('p-sunrise').textContent = p.sunrise;
      document.getElementById('p-sunset').textContent = p.sunset;
      document.getElementById('p-tithi').textContent = p.tithi;
      document.getElementById('p-paksha').textContent = p.paksha;
      document.getElementById('p-sun').textContent = p.sunSign;
      document.getElementById('p-moon').textContent = p.moonSign;
    }

    // Inline Admin
    const inlineAdmin = document.getElementById('inline-admin-section');
    if (AuthModule && AuthModule.isAdmin) {
      inlineAdmin.classList.remove('hidden');
      if (holiday) {
        document.getElementById('inline-admin-type').value = holiday.type;
        document.getElementById('inline-admin-name').value = holiday.name;
        document.getElementById('inline-admin-desc').value = holiday.desc || '';
      } else {
        document.getElementById('inline-admin-type').value = 'GH';
        document.getElementById('inline-admin-name').value = '';
        document.getElementById('inline-admin-desc').value = '';
      }
    } else {
      if (inlineAdmin) inlineAdmin.classList.add('hidden');
    }

    // Notes
    NotesModule.loadNote(dateStr);

    UI.closeModal('settings-modal');
    document.getElementById('detail-modal').classList.add('open');
  }
};

// ===== Bootstrap =====
document.addEventListener('DOMContentLoaded', () => {
  AuthModule.init();
});
