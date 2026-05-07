// Holiday Data for 2026 (Indian Holidays)
const HolidayData = {
  holidays: {
    "2026-01-01": { name: "New Year's Day", type: "GH", desc: "Celebration of the New Year" },
    "2026-01-14": { name: "Makar Sankranti", type: "GH", desc: "Harvest festival marking sun's transit" },
    "2026-01-15": { name: "Pongal", type: "RH", desc: "Tamil harvest festival" },
    "2026-01-26": { name: "Republic Day", type: "GH", desc: "India's Constitution came into effect" },
    "2026-02-17": { name: "Maha Shivaratri", type: "GH", desc: "The great night of Lord Shiva" },
    "2026-03-14": { name: "Holi", type: "GH", desc: "Festival of colours" },
    "2026-03-17": { name: "Holika Dahan", type: "RH", desc: "Burning of Holika" },
    "2026-03-31": { name: "Id-ul-Fitr", type: "GH", desc: "Eid marking end of Ramadan" },
    "2026-04-02": { name: "Good Friday", type: "GH", desc: "Crucifixion of Jesus Christ" },
    "2026-04-06": { name: "Ram Navami", type: "GH", desc: "Birth of Lord Rama" },
    "2026-04-10": { name: "Mahavir Jayanti", type: "GH", desc: "Birth of Lord Mahavira" },
    "2026-04-14": { name: "Dr Ambedkar Jayanti", type: "GH", desc: "Birth of Dr B.R. Ambedkar" },
    "2026-04-15": { name: "Vaisakhi", type: "RH", desc: "Sikh New Year" },
    "2026-05-01": { name: "Buddha Purnima", type: "GH", desc: "Birth of Gautama Buddha" },
    "2026-06-07": { name: "Id-ul-Zuha (Bakrid)", type: "GH", desc: "Festival of Sacrifice" },
    "2026-07-07": { name: "Muharram", type: "GH", desc: "Islamic New Year" },
    "2026-08-15": { name: "Independence Day", type: "GH", desc: "India's Independence from British rule" },
    "2026-08-16": { name: "Janmashtami", type: "GH", desc: "Birth of Lord Krishna" },
    "2026-09-05": { name: "Milad-un-Nabi", type: "GH", desc: "Birthday of Prophet Muhammad" },
    "2026-10-02": { name: "Gandhi Jayanti", type: "GH", desc: "Birth of Mahatma Gandhi" },
    "2026-10-02": { name: "Gandhi Jayanti", type: "GH", desc: "Birth of Mahatma Gandhi" },
    "2026-10-19": { name: "Dussehra", type: "GH", desc: "Victory of good over evil" },
    "2026-10-20": { name: "Dussehra Holiday", type: "RH", desc: "Additional holiday for Dussehra" },
    "2026-11-07": { name: "Diwali", type: "GH", desc: "Festival of Lights" },
    "2026-11-08": { name: "Govardhan Puja", type: "RH", desc: "Day after Diwali celebrations" },
    "2026-11-09": { name: "Bhai Dooj", type: "RH", desc: "Brother-sister bond festival" },
    "2026-11-15": { name: "Guru Nanak Jayanti", type: "GH", desc: "Birth of Guru Nanak Dev" },
    "2026-11-24": { name: "Guru Tegh Bahadur", type: "RH", desc: "Martyrdom of Guru Tegh Bahadur" },
    "2026-12-25": { name: "Christmas", type: "GH", desc: "Birth of Jesus Christ" },
    "2026-12-31": { name: "New Year's Eve", type: "RH", desc: "Last day of the year" }
  },

  // Panchang data generator (simplified)
  getPanchang(dateStr) {
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.getMonth();
    const tithis = ["Pratipada","Dwitiya","Tritiya","Chaturthi","Panchami","Shashthi","Saptami","Ashtami","Navami","Dashami","Ekadashi","Dwadashi","Trayodashi","Chaturdashi","Purnima/Amavasya"];
    const sunSigns = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
    const moonSigns = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
    const tithiIdx = (day + month * 2) % 15;
    const paksha = day <= 15 ? "Shukla" : "Krishna";
    const sunIdx = month;
    const moonIdx = (day + month) % 12;
    // Approximate sunrise/sunset based on month
    const sunriseH = 5 + Math.floor(month < 6 ? (6 - month) * 0.15 : (month - 6) * 0.15);
    const sunriseM = 20 + (day % 30);
    const sunsetH = 17 + Math.floor(month < 6 ? month * 0.2 : (12 - month) * 0.2);
    const sunsetM = 15 + (day % 25);
    return {
      sunrise: `${sunriseH}:${String(sunriseM % 60).padStart(2,'0')} AM`,
      sunset: `${sunsetH}:${String(sunsetM % 60).padStart(2,'0')} PM`,
      tithi: tithis[tithiIdx],
      paksha,
      sunSign: sunSigns[sunIdx],
      moonSign: moonSigns[moonIdx]
    };
  },

  getHoliday(dateStr) {
    return this.holidays[dateStr] || null;
  },

  getAllHolidays() {
    return Object.entries(this.holidays).map(([date, info]) => ({ date, ...info })).sort((a, b) => a.date.localeCompare(b.date));
  },

  getHolidaysForMonth(year, month) {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    return Object.entries(this.holidays)
      .filter(([d]) => d.startsWith(prefix))
      .map(([date, info]) => ({ date, ...info }));
  },

  addHoliday(dateStr, name, type, desc) {
    const data = { name, type, desc };
    this.holidays[dateStr] = data;
    this.saveCustomLocal();
    try {
      if (typeof db !== 'undefined') db.collection('holidays').doc(dateStr).set(data);
    } catch(e) {}
  },

  removeHoliday(dateStr) {
    delete this.holidays[dateStr];
    this.saveCustomLocal();
    try {
      if (typeof db !== 'undefined') db.collection('holidays').doc(dateStr).set({ deleted: true });
    } catch(e) {}
  },

  saveCustomLocal() {
    try { localStorage.setItem('custom_holidays', JSON.stringify(this.holidays)); } catch(e) {}
  },

  loadCustom() {
    try {
      const saved = localStorage.getItem('custom_holidays');
      if (saved) {
        this.holidays = { ...this.holidays, ...JSON.parse(saved) };
      }
    } catch(e) {}

    try {
      if (typeof db !== 'undefined') {
        db.collection('holidays').onSnapshot((snapshot) => {
          let updated = false;
          snapshot.docChanges().forEach((change) => {
            const data = change.doc.data();
            const dateStr = change.doc.id;
            
            if (change.type === "added" || change.type === "modified") {
              if (data.deleted) {
                if (this.holidays[dateStr]) {
                  delete this.holidays[dateStr];
                  updated = true;
                }
              } else {
                this.holidays[dateStr] = data;
                updated = true;
              }
            }
            if (change.type === "removed") {
              if (this.holidays[dateStr]) {
                delete this.holidays[dateStr];
                updated = true;
              }
            }
          });
          if (updated) {
            this.saveCustomLocal();
            if (typeof CalendarEngine !== 'undefined') CalendarEngine.render();
            if (typeof AdminModule !== 'undefined') AdminModule.renderList();
            if (typeof UI !== 'undefined' && UI.filterHolidayList) {
              const activeTab = document.querySelector('.hl-tab.active');
              const filterType = activeTab ? (activeTab.textContent.includes('All') ? 'all' : (activeTab.textContent.includes('GH') ? 'GH' : 'RH')) : 'all';
              UI.filterHolidayList(filterType);
            }
          }
        }, (error) => {
          console.log('Error listening to holidays:', error);
        });
      }
    } catch(e) {}
  }
};

HolidayData.loadCustom();
