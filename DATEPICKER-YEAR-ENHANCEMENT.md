# Date Picker Enhancement - Year Dropdown and Scroll Navigation

## Date: March 4, 2026

## Changes Made

Enhanced the date picker calendar with improved year selection functionality.

### Features Added

1. **Year Dropdown** - Replaced text input with a dropdown showing 10 years
2. **Scroll Navigation** - Added mouse wheel scroll to change years
3. **Dynamic Year Range** - Shows 5 years before and 5 years after the currently selected year

## Files Modified

### 1. `client/src/components/DatePickerCalendar.jsx`

**Added:**
- `calendarPopupRef` - Reference to the calendar popup for scroll handling
- Scroll event handler in useEffect hook for year navigation
- Year options array generation (5 years before/after current year)
- Year dropdown (replacing the number input)

**Changes:**
```javascript
// Added ref for calendar popup
const calendarPopupRef = useRef(null);

// Added scroll handler
useEffect(() => {
    if (!isOpen || !calendarPopupRef.current) return;
    
    const handleWheel = (e) => {
        e.preventDefault();
        if (e.deltaY > 0) {
            setDisplayYear(prev => prev + 1);  // Scroll down = next year
        } else {
            setDisplayYear(prev => prev - 1);  // Scroll up = previous year
        }
    };
    
    const popup = calendarPopupRef.current;
    popup.addEventListener('wheel', handleWheel, { passive: false });
    return () => popup.removeEventListener('wheel', handleWheel);
}, [isOpen]);

// Generate year options dynamically
const yearOptions = [];
for (let i = displayYear - 5; i <= displayYear + 5; i++) {
    yearOptions.push(i);
}

// Changed from input to select
<select 
    value={displayYear} 
    onChange={handleYearChange} 
    className="year-select"
>
    {yearOptions.map((year) => (
        <option key={year} value={year}>{year}</option>
    ))}
</select>
```

### 2. `client/src/App.css`

**Replaced:**
- `.year-input` class with `.year-select` class

**Added:**
- Hover states for both month and year selects
- Cursor pointer for better UX

**Styling:**
```css
.year-select {
  width: 80px;
  padding: 4px 6px;
  border: 1px solid var(--border);
  background: #1f1f1f;
  color: var(--text);
  border-radius: 3px;
  font-size: 12px;
  cursor: pointer;
}

.month-select:hover,
.year-select:hover {
  border-color: #3a3a3a;
  background: #252525;
}
```

## User Experience Improvements

### Year Dropdown
✅ **10 years visible** - Shows 5 years before and 5 years after current year  
✅ **Easy selection** - Click to open dropdown and select year  
✅ **Dynamic range** - Range updates as you select different years  
✅ **Consistent UI** - Matches the month dropdown style  

### Scroll Navigation
✅ **Mouse wheel** - Scroll up for earlier years, scroll down for later years  
✅ **Smooth navigation** - Quick year changes without dropdown  
✅ **Prevents default** - Scroll only affects year, not page  
✅ **Active only when open** - Scroll works only on the calendar popup  

## How to Use

### Selecting a Year
1. **Dropdown method:**
   - Click the year dropdown
   - Select from the list of 10 years
   - Range automatically updates as you change years

2. **Scroll method:**
   - Hover over the calendar
   - Scroll up with mouse wheel → Go to previous year
   - Scroll down with mouse wheel → Go to next year

### Navigating Years
- Click year dropdown to see current year ± 5 years
- Select a year far from current range will update the range
- Scroll continues to work for further navigation
- Arrow buttons still navigate months (wrapping to next/previous year)

## Technical Details

### Year Range Logic
```javascript
// Always shows 10 years centered on current selection
for (let i = displayYear - 5; i <= displayYear + 5; i++) {
    yearOptions.push(i);
}
```

### Scroll Event Handling
- Uses `wheel` event with `passive: false` to prevent default scrolling
- Only active when calendar popup is open
- Properly cleaned up when component unmounts or calendar closes
- Updates year state which triggers re-render with new year options

### State Management
- Year state (`displayYear`) controls both the dropdown and the calendar display
- Changing year via scroll or dropdown updates the same state
- Year options regenerate on every render based on current year
- Month/year navigation buttons work seamlessly with new dropdown

## Benefits

✅ **Better UX** - Dropdown is more intuitive than typing  
✅ **Faster navigation** - Scroll for quick year changes  
✅ **No invalid input** - Dropdown prevents typing errors  
✅ **Consistent design** - Matches month dropdown  
✅ **Touch-friendly** - Dropdown works better on touch devices  
✅ **Accessible** - Standard select element with keyboard support  

## Example Usage

**Before:** Type "2020" in year input  
**After:** 
- Click year dropdown → Select "2020" from list
- OR scroll up multiple times to reach 2020

## Testing

1. Open date picker (click "Pick date")
2. Click year dropdown - should see 10 years (e.g., 2021-2031)
3. Select a different year - dropdown updates to show new range
4. Hover over calendar and scroll - year should change
5. Scroll up - year decreases (earlier dates)
6. Scroll down - year increases (later dates)
7. Verify month navigation still works with arrow buttons

