# Quick Start Guide - Modern DataViz Frontend

## 🚀 Getting Started

### What's New?
Your DataViz application now has a completely redesigned, modern frontend with:
- ✨ Sleek, gradient-based design
- 🎯 Intuitive navigation with breadcrumbs
- 📊 Enhanced data analyzer with tabs
- 🎨 Beautiful landing page
- 📱 Fully responsive design
- ⚡ Smooth animations and transitions

## 🎨 Key Pages

### 1. Landing Page (`/`)
**First impression for new users**
- Hero section with gradient backgrounds
- Feature showcases with animated cards
- Customer testimonials
- Call-to-action buttons for signup/login

**Try it:** Visit http://localhost:5173/ (or your dev server)

### 2. Dashboard (`/dashboard`)
**Your command center**
- **Personalized Greeting** - See your name and stats
- **Quick Actions** - Upload CSV, Start new analysis, View history
- **Feature Cards** - Navigate to different analysis types
- **Recent Work Tabs:**
  - Drafts - Resume work in progress
  - Saved Analyses - View completed analyses
  - Saved Charts - Access your chart sessions

**Try it:** After login, you'll land here automatically

### 3. Data Analyzer (`/manual-plot`)
**The main analysis workspace**

**Workflow:**
1. **Input Tab** - Add your data
   - Type X, Y values manually
   - Upload CSV file (drag & drop supported)
   - Paste CSV text
2. **View Data Tab** - Review your dataset
   - See all data points in a table
   - Delete individual points if needed
3. **Results Tab** - Analyze and visualize
   - View R² score, RMSE, MAE
   - See your regression chart
   - Export as PNG or PDF

**Pro tip:** Your work auto-saves as you go!

## 🎯 Navigation Guide

### Sidebar Navigation
The sidebar shows:
- **Main Navigation:**
  - Dashboard - Your home base
  - AI Features - Intelligent analysis (NEW!)
  - Data Analyzer - Create charts
  - Categorical Analysis - Category data
  - NLP Analysis - Text analytics
  
- **Resources:**
  - Profile - Your account
  - Documentation - Help docs
  - Settings - App preferences

**Collapse it:** Click the hamburger menu to get more screen space

### Breadcrumbs
At the top of every page, you'll see your location:
```
Home > Data Analyzer > Regression
```
Click any breadcrumb to navigate back.

### Help Mode
Click the **Help Mode** button (❓) in the header to show/hide helpful tooltips and descriptions throughout the app.

## 💡 Common Tasks

### Upload and Analyze Data

1. **Go to Data Analyzer**
   - Click "Data Analyzer" in sidebar OR
   - Use Quick Action "Upload CSV" on Dashboard

2. **Add Your Data**
   - **Option A:** Upload CSV file
     ```
     1.0, 2.5
     2.0, 4.1
     3.0, 6.2
     ```
   - **Option B:** Type values manually
   - **Option C:** Paste CSV text

3. **Review Data**
   - Switch to "View Data" tab
   - Check your data points
   - Delete any errors

4. **Analyze**
   - Click "Analyze Data" button
   - Watch the AI select the best model
   - Results appear in "Results" tab

5. **Export**
   - Click "Export Chart"
   - Choose PNG or PDF
   - Select Light or Dark theme
   - Download!

### Save Your Work

**Automatic:**
- Work is auto-saved every 2 seconds
- Resume from Dashboard > Drafts tab

**Manual:**
- Click "Save Analysis" after analyzing
- Find it in Dashboard > Saved Analyses

### Access Previous Work

**From Dashboard:**
1. Go to Dashboard
2. Click "Recent Work" tabs
3. Choose:
   - **Drafts** - Resume unfinished work
   - **Saved Analyses** - View completed analyses
   - **Saved Charts** - Access chart sessions

## 🎨 Design Features

### Gradients Everywhere
We use beautiful gradients for visual appeal:
- **Blue → Purple** - Primary actions
- **Purple → Pink** - AI features
- **Green → Emerald** - Categorical data
- **Orange → Red** - NLP features

### Interactive Elements
**Hover over cards and buttons** to see:
- Elevation effects (cards lift up)
- Border color changes
- Icon animations
- Glow effects

### Responsive Design
**Try it on different screens:**
- **Desktop** - Full sidebar, multi-column grids
- **Tablet** - Collapsible sidebar, 2-column grids
- **Mobile** - Hidden sidebar (menu), single column

## ⌨️ Keyboard Shortcuts

While entering data:
- **Enter** - Add data point
- **Tab** - Move between X and Y fields

## 🎯 Best Practices

### For Best Results:

1. **Use Meaningful Data**
   - At least 2 data points required
   - More points = better analysis

2. **Review Before Analyzing**
   - Check "View Data" tab
   - Remove outliers if needed

3. **Understand Your Results**
   - R² close to 1.0 = excellent fit
   - Check RMSE and MAE for accuracy

4. **Export Professionally**
   - Use PDF for presentations
   - Use PNG for quick sharing
   - Choose theme matching your needs

## 🐛 Troubleshooting

### Page Not Loading?
- Check you're logged in
- Try refreshing (Ctrl+R / Cmd+R)
- Clear browser cache

### Data Not Saving?
- Check internet connection
- Ensure you're logged in
- Active drafts save automatically

### Chart Not Showing?
- Ensure you have at least 2 data points
- Click "Analyze Data" button
- Switch to "Results" tab

### Want Classic View?
Access original pages with `-classic` suffix:
- `/dashboard-classic`
- `/manual-plot-classic`
- `/landing-classic`

## 🎓 Pro Tips

1. **Quick Upload**
   - Drag CSV files directly onto upload area
   - No need to click!

2. **Keyboard Shortcuts**
   - Press Enter after typing X and Y values
   - Saves time when adding multiple points

3. **Help Mode**
   - Toggle Help Mode for tooltips
   - Great for first-time users

4. **Mobile Use**
   - Works great on tablets
   - Tap hamburger menu for navigation
   - Swipe cards for better interaction

5. **Export Quality**
   - PDF exports are vector (scalable)
   - PNG exports are high-resolution
   - Dark theme great for presentations

## 🎨 Customization

### Theme
- System automatically detects dark/light mode
- Theme Toggle in header

### Layout
- Collapse sidebar for more space
- Tabs organize complex workflows
- Cards group related features

## 📱 Mobile Experience

### Navigation
- Tap **menu icon** (☰) to open sidebar
- Sidebar overlays content
- Tap outside to close

### Data Entry
- Optimized touch targets
- Mobile keyboard for numbers
- Pinch to zoom charts

### Responsive Tables
- Scroll horizontally for data table
- Larger touch targets for delete

## 🚀 Next Steps

1. **Explore AI Features** (`/ai`)
   - Try AI-powered insights
   - Automatic pattern detection

2. **Try Different Analysis Types**
   - Categorical data
   - NLP text analysis
   - Curve fitting

3. **Build Beautiful Charts**
   - Experiment with different datasets
   - Export professional visualizations
   - Share with your team

## 💬 Need Help?

- Click **Help Mode** button in header
- Check **Documentation** in sidebar
- Visit Dashboard for quick actions

## 🎉 Enjoy!

Your DataViz experience is now more intuitive, beautiful, and powerful. Happy analyzing! 📊✨
