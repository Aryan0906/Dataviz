# Quick Reference: NLP-Driven Categorical Visualizer

## 🎯 Quick Start (3 Steps)

1. **Upload** → Click "Import CSV"
2. **Ask** → Type "Show count by [column name]"
3. **Explore** → Click chart bars to filter table

## 💬 Natural Language Examples

### Basic Queries
```
✅ "Show total sales by City"
✅ "Count by Product"
✅ "Show distribution"
✅ "Which category has the most items?"
✅ "Display revenue by Region"
```

### Advanced Queries (Future)
```
🔮 "Top 5 cities by sales"
🔮 "Compare Q1 vs Q2 revenue"
🔮 "Show average price per category"
🔮 "Filter products with sales > 1000"
```

## 🎨 Chart Type Quick Switch

| Type | Icon | Best For | Click |
|------|------|----------|-------|
| Bar | ▬ | Comparisons | Top-Left header |
| Pie | ◐ | Proportions | Top-Left header |
| Treemap | ▦ | Hierarchies | Top-Left header |

## 📊 4-Quadrant Layout

```
┏━━━━━━━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━━━━━━┓
┃ Top-Left         ┃  ┃ Top-Right        ┃
┃ VISUALIZER       ┃  ┃ INTELLIGENCE HUB ┃
┃ Dynamic Chart    ┃  ┃ Chat + Upload    ┃
┗━━━━━━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━━━━━━┛
┏━━━━━━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━━━━━━┓
┃ Bottom-Left      ┃  ┃ Bottom-Right     ┃
┃ INSIGHTS         ┃  ┃ DATA TABLE       ┃
┃ Stats + Summary  ┃  ┃ Search + Paginate┃
┗━━━━━━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━━━━━━┛
```

## 🔧 Key Features

### Top-Left: Visualizer
- ✨ **Dynamic Title**: Auto-updates from your query
- 🎨 **Auto-Colors**: Each category gets unique color
- 👆 **Click Bars**: Filter table by category
- 🔄 **Quick Toggle**: Switch between Bar/Pie/Treemap
- 📥 **Empty State**: Shows upload prompt when no data

### Top-Right: Intelligence Hub
- 💬 **Chat Interface**: Primary input for queries
- 💡 **Suggestions**: Pre-built query chips
- 🏷️ **Active Columns**: Shows available columns with types
- 📝 **Chat History**: See your conversation with AI
- 📁 **Upload**: Import or replace CSV

### Bottom-Left: Insights
- 📖 **NLP Summary**: Plain English explanation
- 🔢 **Cardinality**: Number of unique categories
- 📈 **Top Performer**: Highest value category
- 📉 **Bottom Performer**: Lowest value category
- ⚠️ **Missing Data**: Null/empty row count
- 📊 **Total Count**: Overall row count

### Bottom-Right: Data Table
- 🔍 **Search Bar**: Filter rows without changing chart
- 📄 **Pagination**: 10 rows per page
- 🎯 **Sync Filter**: Auto-filters when clicking chart
- ✏️ **Editable**: Can edit cells (future)
- 📊 **Row Count**: Shows filtered/total in header

## 🎯 Common Workflows

### 1. Quick Analysis
```
1. Upload CSV
2. Type: "Show count by [category]"
3. Done! ✅
```

### 2. Deep Dive
```
1. Upload CSV
2. Query: "Show sales by region"
3. Click highest bar
4. Table filters to that region
5. Search table for specific product
6. Export chart as PNG
```

### 3. Multi-View Comparison
```
1. Query: "Show revenue by category"
2. View as Bar chart (comparisons)
3. Switch to Pie (proportions)
4. Switch to Treemap (hierarchies)
5. Pick best view → Export
```

## ⚡ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Enter` | Submit chat query |
| `Ctrl+V` | Paste CSV data |
| `Esc` | Clear search |
| `←` `→` | Navigate pages |

## 🎨 Visual Indicators

### Column Type Badges
```
[City] (String)    → Blue badge
[Sales] (Number)   → Gray badge
```

### Chat Message Colors
```
You:  Blue background, right side
AI:   Green background, left side
Error: Red background, left side
```

### Insight Card Colors
```
Gray:   Normal metrics
Green:  Top performers
Orange: Bottom performers
Yellow: Warnings/alerts
```

## 📏 Data Limits

| Feature | Limit | Handling |
|---------|-------|----------|
| Categories | 20+ | Shows top 20 + "Others" |
| Table Rows | 10,000+ | Pagination (10 per page) |
| Chart Colors | 8 | Cycles through palette |
| Upload Size | 10MB | Browser limit |

## 🚨 Error Messages & Fixes

### "I couldn't understand that query"
**Fix:** Use format: "Show [metric] by [column]"
**Example:** "Show count by Category"

### "No valid data found in CSV"
**Fix:** Ensure CSV has headers and data rows
**Example:**
```csv
City,Sales,Date
New York,500,2026-01-01
London,300,2026-01-02
```

### "Please upload data first"
**Fix:** Click "Import CSV" in top-right panel

### "No matching results"
**Fix:** 
- Clear search bar
- Check spelling
- Try different search term

## 💡 Pro Tips

### Tip 1: Column Detection
- **Strings** → Categorical (City, Product, Name)
- **Numbers** → Numerical (Sales, Price, Quantity)
- Upload clean data for best detection

### Tip 2: Query Structure
```
[Action] [Aggregation] by [Column]
   ↓         ↓              ↓
"Show"   "total"        "City"
"Count"  "average"      "Product"
"Display" "sum"         "Region"
```

### Tip 3: Filter Workflow
```
Chart → Click bar → Table filters → Search refined
  ↓         ↓            ↓              ↓
1000    →  250 rows  →  250 rows  →   50 rows
rows       (NY only)    (NY only)     (Electronics)
```

### Tip 4: Large Datasets
- Use pagination (10 rows/page)
- Click chart first to reduce scope
- Then search table for specifics

### Tip 5: Chart Selection
- **Bar**: Compare 2-20 categories
- **Pie**: Show proportions of 2-8 categories
- **Treemap**: Visualize hierarchies with many categories

## 🔗 Related Files

| File | Purpose |
|------|---------|
| `DataAnalyzer.jsx` | Main component |
| `UniversalChart.jsx` | Chart rendering |
| `CATEGORICAL_NLP_FEATURES.md` | Full technical docs |
| `VISUAL_GUIDE.md` | Before/after comparison |

## 🐛 Troubleshooting

### Chart Not Showing
1. Check if data uploaded ✅
2. Try submitting query again
3. Refresh page
4. Check browser console

### Table Not Filtering
1. Click bar directly (not white space)
2. Check if chart is rendered
3. Clear table search
4. Reset filters

### Upload Fails
1. Check file is `.csv` format
2. Ensure file < 10MB
3. Verify CSV has headers
4. Check for special characters

## 📚 Learn More

### Next Steps
1. Read `CATEGORICAL_NLP_FEATURES.md` for full details
2. Check `VISUAL_GUIDE.md` for design system
3. Review backend integration points
4. Test with sample data

### Feature Requests
- Multi-column grouping
- Time series support
- Export to Excel
- Custom color themes
- Saved queries

---

**Version:** 1.0.0  
**Last Updated:** January 31, 2026  
**Status:** ✅ Ready for Testing
