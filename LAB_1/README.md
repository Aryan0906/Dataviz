# Data Analyzer Pro - HTML5 Semantic Web Application

## Project Overview

This is a comprehensive web application demonstrating **HTML5 semantic elements** combined with modern CSS and JavaScript. The project converts a React-based data analyzer into a pure HTML5/CSS/JavaScript application with full semantic markup.

## HTML5 Semantic Elements Used

### Page Structure
- **`<header>`** - Main page header with branding and theme toggle
- **`<nav>`** - Primary navigation menu with links to different sections
- **`<main>`** - Main content area containing all primary content
- **`<article>`** - Introduction article about the tool with embedded media
- **`<section>`** - Multiple sections for data input, visualization, and analysis
- **`<aside>`** - Sidebar containing analysis results and related information
- **`<footer>`** - Footer with links, contact info, and copyright

### Additional Semantic Elements
- **`<video>`** - Embedded video tutorial
- **`<figure>`** - For images with captions
- **`<table>`** - Structured data display
- **`<form>`** - Data input forms with proper labels
- **`<address>`** - Contact information in footer

## Features

### 1. **Data Input**
- **Manual Input**: Add data points one by one with X and Y values
- **CSV Upload**: Upload data from CSV files with automatic parsing
- **Sample Data**: Pre-loaded sample data for demonstration
- **Data Validation**: Input validation and error handling

### 2. **Data Visualization**
- **Interactive Chart**: Canvas-based chart displaying data points
- **Regression Line**: Visual representation of best-fit regression
- **Grid Lines**: Reference grid for easier value reading
- **Responsive Design**: Charts adapt to screen size

### 3. **Statistical Analysis**
- **Point Count**: Total number of data points
- **Average Values**: Mean of X and Y coordinates
- **Min/Max Values**: Range of X values
- **Regression Analysis**: Linear regression with equation
- **R² Value**: Goodness of fit measurement
- **Correlation Coefficient**: Strength of relationship

### 4. **Predictions**
- **Predict Y from X**: Calculate predicted Y values
- **Equation Display**: Shows regression equation
- **Accuracy Metrics**: Displays R² for model evaluation

### 5. **Data Management**
- **Table Display**: All data points in organized table
- **Remove Individual Points**: Delete specific data points
- **Clear All Data**: Remove all data with confirmation
- **Download Data**: Export data as CSV file

### 6. **User Experience**
- **Dark/Light Theme**: Toggle between themes with persistent storage
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Smooth Animations**: Professional transitions and effects
- **Keyboard Shortcuts**:
  - Ctrl+S / Cmd+S: Download data
  - Ctrl+K / Cmd+K: Clear data
- **Accessibility**: ARIA labels, focus management, keyboard navigation

## File Structure

```
LAb1 submission/
├── index.html       (HTML5 semantic structure - 450+ lines)
├── styles.css       (Comprehensive styling - 1000+ lines)
├── script.js        (Full JavaScript functionality - 600+ lines)
└── README.md        (This file)
```

## Technical Details

### HTML5 Semantic Markup
- Proper use of semantic tags for better accessibility
- ARIA labels for form elements
- Structured data with proper heading hierarchy
- Semantic links with rel attributes
- Proper form structure with labels

### CSS Features
- **CSS Variables**: For easy theme customization
- **Flexbox & Grid**: Modern layout techniques
- **Dark Mode Support**: Full dark theme implementation
- **Responsive Design**: Mobile-first approach with breakpoints
- **Animations**: Smooth transitions and keyframe animations
- **Accessibility**: Focus states and reduced-motion support

### JavaScript Functionality
- **Object-Oriented Design**: Organized with clear separation of concerns
- **Event Handling**: All user interactions properly managed
- **Data Processing**: CSV parsing and validation
- **Mathematical Calculations**: Linear regression analysis
- **Canvas Drawing**: Manual chart rendering
- **Local Storage**: Theme preference persistence
- **Error Handling**: User-friendly error messages

## How to Use

### 1. **Add Data Manually**
   - Enter X and Y values in the input form
   - Click "Add Point" or press Enter
   - View data in the table below

### 2. **Upload CSV**
   - Click "Choose CSV File" button
   - Select your CSV file (format: X,Y columns)
   - System automatically parses and displays data

### 3. **View Analysis**
   - Check statistics in the sidebar
   - See regression equation and R² value
   - Understand data distribution

### 4. **Make Predictions**
   - Enter an X value in the prediction form
   - Click "Predict Y"
   - Get predicted Y value based on regression

### 5. **Download Data**
   - Click "Download Data" button
   - Receive CSV file with all data points
   - Use Ctrl+S shortcut as alternative

## CSV Format

Expected CSV format with headers:
```
X,Y
1,2.5
2,4.1
3,6.2
4,8.0
5,10.1
```

## Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Responsive Breakpoints

- **Desktop**: Full layout with sidebar (1024px and above)
- **Tablet**: Stacked layout, optimized spacing (768px - 1023px)
- **Mobile**: Single column, touch-friendly buttons (below 768px)
- **Small Mobile**: Compact layout (below 480px)

## Accessibility Features

- Semantic HTML structure
- ARIA labels and descriptions
- Keyboard navigation support
- Focus management
- Color contrast compliance
- Motion sensitivity support (prefers-reduced-motion)
- Form validation feedback

## Requirements Met

✅ **Header** - Main page header with title and subtitle
✅ **Navigation** - Navigation menu with links
✅ **Main Content** - Primary content in `<main>` tag
✅ **Article** - Introduction article with text and media
✅ **Section** - Multiple sections for different content areas
✅ **Sidebar (Aside)** - Statistical analysis sidebar
✅ **Text Content** - Extensive descriptive text throughout
✅ **Images** - Placeholder images and visual elements
✅ **Video** - Embedded video tutorial
✅ **Hyperlinks** - Navigation and external links
✅ **Form** - Data input forms with validation
✅ **Input Fields** - Number inputs for data entry
✅ **Buttons** - Action buttons throughout (Add, Clear, Download, etc.)
✅ **Footer** - Comprehensive footer with links and info

## HTML5 Semantic Elements Checklist

- ✅ `<header>` - 1 instance
- ✅ `<nav>` - 2 instances (main + footer)
- ✅ `<main>` - 1 instance
- ✅ `<article>` - 4 instances
- ✅ `<section>` - 8+ instances
- ✅ `<aside>` - 1 instance
- ✅ `<footer>` - 1 instance
- ✅ `<video>` - 1 instance
- ✅ `<table>` - 1 instance
- ✅ `<form>` - 3 instances
- ✅ `<address>` - 1 instance

## Performance Optimizations

- Lightweight without external dependencies
- Efficient canvas rendering
- Minimal DOM manipulation
- Optimized event listeners
- Smooth 60fps animations
- Fast CSV parsing

## Future Enhancements

- Multiple regression types (polynomial, exponential, etc.)
- Advanced chart types (scatter, line, bar)
- Data export in multiple formats (JSON, Excel)
- Collaborative data sharing
- Data import from cloud sources
- Statistical tests and confidence intervals

## Author Notes

This project demonstrates:
- Proper semantic HTML5 markup
- Modern CSS techniques and best practices
- Pure JavaScript (no frameworks)
- Responsive and accessible design
- Professional UX/UI implementation
- Advanced web API usage (FileReader, Canvas, LocalStorage)

---

**Created**: January 2026
**Project Type**: Educational - HTML5 Semantic Elements Demonstration
**Technology Stack**: HTML5, CSS3, Vanilla JavaScript
