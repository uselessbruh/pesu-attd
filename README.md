# PESU Academy - Attendance Tracker

<div align="center">
  <img src="public/logo.png" alt="PESU Academy Logo" width="120"/>
  
  ### 📊 Smart Attendance Management Tool
  
  **Live Demo:** [https://pesu-attd.vercel.app/](https://pesu-attd.vercel.app/)
  
  ![Status](https://img.shields.io/badge/status-active-success.svg)
  ![Privacy](https://img.shields.io/badge/privacy-no%20data%20stored-blue.svg)
  ![Platform](https://img.shields.io/badge/platform-web-orange.svg)
</div>

---

## 🌟 Features

- **Real-time Attendance Tracking** - View your current attendance percentage for all courses
- **Smart Calculator** - Add presents/absents to see projected attendance
- **Intelligent Insights** - Get recommendations on sessions to attend or skip
- **Flexible Sorting** - Sort courses by default, ascending, or descending attendance percentage
- **Mobile Responsive** - Fully optimized for phones, tablets, and desktops
- **Session-based Display** - All calculations based on 45-minute sessions

## 🔒 Privacy & Security

### **Your Data is Safe**

This application is designed with privacy as a top priority:

- ✅ **No Data Storage** - We don't store any user credentials or attendance data
- ✅ **No Databases** - No backend database means your information never persists
- ✅ **Session-Only** - Data exists only during your active session
- ✅ **Direct API Calls** - Communicates directly with PESU Academy servers
- ✅ **No Tracking** - No analytics, cookies, or user tracking implemented
- ✅ **Open Source** - All code is transparent and can be audited

**How it works:** When you log in, the application authenticates directly with PESU Academy's servers and fetches your attendance data in real-time. Once you close the browser or log out, all data is immediately cleared. Nothing is saved on our servers.

## 🛠️ Technology Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with CSS Grid & Flexbox
- **Vanilla JavaScript** - No frameworks, lightweight and fast

### Backend
- **Python** - Flask-based API
- **Beautiful Soup** - Web scraping for attendance data
- **Requests** - HTTP client for PESU Academy API

### Deployment
- **Vercel** - Serverless deployment platform
- **Edge Functions** - Fast global CDN delivery

## 🚀 How It Works

1. **Authentication** - User logs in with PESU Academy credentials
2. **Data Fetching** - Application scrapes attendance data from PESU Academy portal
3. **Processing** - Attendance percentages and statistics are calculated
4. **Display** - Clean, organized view of all course attendance
5. **Predictions** - Calculator allows "what-if" scenarios for attendance planning

### Architecture

```
User Browser
    ↓
Frontend (HTML/CSS/JS)
    ↓
Vercel Edge Function (Python API)
    ↓
PESU Academy Servers
    ↓
Real-time Attendance Data
```

## 📱 Usage

1. Visit [https://pesu-attd.vercel.app/](https://pesu-attd.vercel.app/)
2. Enter your PESU Academy Student ID and Password
3. View your attendance dashboard with all courses
4. Use the attendance calculator:
   - Enter number of sessions to **Add Presents**
   - Enter number of sessions to **Add Absents**
   - Click **Calculate** to see projected attendance
5. Sort courses using the dropdown menu at the top

## 🎯 Attendance Calculator

The calculator helps you plan your attendance strategy:

- **Add Presents**: See how attending X sessions improves your attendance
- **Add Absents**: See how skipping Y sessions affects your attendance
- **Combined Analysis**: Mix both to create realistic scenarios

### Insights Provided:

- 📈 New attendance percentage with change indicator
- ⚠️ Sessions needed to reach 75% (if below threshold)
- 🎉 Sessions you can safely skip (if above threshold)
- ✅ Current status if at exactly 75%

## 💻 Local Development

### Prerequisites
- Python 3.8+
- Node.js (for Vercel CLI)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd pesu-attd

# Install Python dependencies
pip install -r requirements.txt

# Run locally
vercel dev
```

### Project Structure

```
pesu-attd/
├── public/
│   ├── index.html      # Main HTML file
│   ├── script.js       # Frontend JavaScript
│   ├── style.css       # Styling
│   └── logo.png        # PESU Academy logo
├── api/
│   ├── index.py        # Flask API routes
│   ├── scraping.py     # Web scraping logic
│   └── config.py       # Configuration settings
├── requirements.txt    # Python dependencies
├── vercel.json        # Vercel deployment config
└── README.md          # This file
```

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## ⚠️ Disclaimer

This is an unofficial tool and is not affiliated with, endorsed by, or connected to PES University or PESU Academy. It is created for educational purposes to help students track their attendance more effectively.

- Use at your own discretion
- Verify important attendance data with official PESU Academy portal
- The developers are not responsible for any discrepancies

## 📄 License

This project is open source and available for educational purposes.

## 🙏 Acknowledgments

- Built for PESU students by PESU students
- Thanks to the PESU Academy platform for providing attendance data
- Inspired by the need for better attendance visualization

---

<div align="center">
  
  **Made with ❤️ for PESU Students**
  
  [Report Bug](https://github.com/yourusername/pesu-attd/issues) · [Request Feature](https://github.com/yourusername/pesu-attd/issues)
  
</div>
