# Date Picker - Month Selector Scroll Navigation

## Date: March 4, 2026

## Enhancement
Made the month selector scrollable so you can change months by scrolling your mouse wheel over it, just like the year selector.

## Problem
Previously, scrolling anywhere on the calendar (including over the month selector) would only change the year. The month selector wasn't responsive to scroll events.

## Solution
Updated the scroll handler to detect which element the mouse is hovering over and respond accordingly:
- **Scroll over month selector** → Changes months
- **Scroll over year selector** → Changes years
- **Scroll over calendar** → Changes years (default)

## Changes Made

### File: `client/src/components/DatePickerCalendar.jsx`

**Updated scroll handler to be context-aware:**

```javascript
const handleWheel = (e) => {
    // Check if the target is the month or year select
    const isMonthSelect = e.target.classList.contains('month-select');
    const isYearSelect = e.target.classList.contains('year-select');
    
    // Don't prevent default if scrolling within a select dropdown that's open
    if ((isMonthSelect || isYearSelect) && e.target === document.activeElement) {
        return; // Let the browser handle dropdown scrolling
    }
    
    e.preventDefault();
    
    if (isMonthSelect) {
        // Scrolling over month selector - change month
        if (e.deltaY > 0) {
            // Scroll down - next month
            if (displayMonth === 11) {
                setDisplayMonth(0);
                setDisplayYear(displayYear + 1);
            } else {
                setDisplayMonth(displayMonth + 1);
            }
        } else {
            // Scroll up - previous month
            if (displayMonth === 0) {
                setDisplayMonth(11);
                setDisplayYear(displayYear - 1);
            } else {
                setDisplayMonth(displayMonth - 1);
            }
        }
    } else if (isYearSelect || !isMonthSelect) {
        // Scrolling over year selector or anywhere else - change year
        if (e.deltaY > 0) {
            setDisplayYear(prev => prev + 1);
        } else {
            setDisplayYear(prev => prev - 1);
        }
    }
};
```

**Updated dependencies:**
```javascript
}, [isOpen, displayMonth, displayYear]);
```

## Features

### Month Selector Scrolling
✅ **Scroll up** → Previous month (December → November → October...)  
✅ **Scroll down** → Next month (January → February → March...)  
✅ **Auto-wrap years** - December → January wraps to next year  
✅ **Auto-wrap years** - January → December wraps to previous year  

### Year Selector Scrolling (unchanged)
✅ **Scroll up** → Previous year  
✅ **Scroll down** → Next year  

### Dropdown Scrolling
✅ **When dropdown is open** - Native scroll works in dropdown list  
✅ **When dropdown is closed** - Mouse wheel changes month/year  

## Behavior Examples

### Scrolling Over Month Selector

**Scroll Down:**
- January → February
- February → March
- ...
- November → December
- December → January (year increases by 1)

**Scroll Up:**
- December → November
- ...
- February → January
- January → December (year decreases by 1)

### Scrolling Over Year Selector

**Scroll Down:**
- 2024 → 2025 → 2026 → 2027...

**Scroll Up:**
- 2026 → 2025 → 2024 → 2023...

### Smart Detection

1. **Mouse over month dropdown** → Scroll changes month
2. **Mouse over year dropdown** → Scroll changes year
3. **Mouse over calendar days** → Scroll changes year
4. **Dropdown is open** → Scroll works normally in dropdown

## User Experience

### How to Use

1. **Open date picker** (click "Pick date")
2. **Hover over month selector**
3. **Scroll mouse wheel:**
   - Up = Previous month
   - Down = Next month
4. **Or hover over year selector**
5. **Scroll mouse wheel:**
   - Up = Previous year
   - Down = Next year

### Benefits

✅ **Faster navigation** - Change months without clicking  
✅ **Intuitive** - Scroll direction matches expectation  
✅ **Context-aware** - Different behavior based on hover target  
✅ **No conflicts** - Dropdown scrolling still works when open  
✅ **Year wrapping** - Automatically handles year transitions  

## Technical Details

### Target Detection
```javascript
const isMonthSelect = e.target.classList.contains('month-select');
const isYearSelect = e.target.classList.contains('year-select');
```

### Dropdown Open Detection
```javascript
if ((isMonthSelect || isYearSelect) && e.target === document.activeElement) {
    return; // Let browser handle dropdown scrolling
}
```

### Month Wrapping Logic
- Month 11 (December) + scroll down → Month 0 (January), year + 1
- Month 0 (January) + scroll up → Month 11 (December), year - 1

### Dependencies
Added `displayMonth` and `displayYear` to useEffect dependencies so the handler always has current values for wrapping logic.

## Examples

**Navigate to specific month:**
1. Start at March 2026
2. Hover over month selector
3. Scroll down 2 times
4. Now at May 2026

**Navigate to different year:**
1. Start at March 2026
2. Hover over year selector
3. Scroll up 3 times
4. Now at March 2023

**Navigate months across year boundary:**
1. Start at December 2025
2. Hover over month selector
3. Scroll down 1 time
4. Now at January 2026 (auto-wrapped)

## Testing

1. **Refresh browser**
2. **Open date picker**
3. **Test month scrolling:**
   - Hover over month dropdown
   - Scroll up/down
   - Verify month changes
4. **Test year scrolling:**
   - Hover over year dropdown
   - Scroll up/down
   - Verify year changes
5. **Test dropdown scrolling:**
   - Click year dropdown to open
   - Scroll in the list
   - Verify dropdown scrolls normally
6. **Test year wrapping:**
   - Set to December
   - Hover over month selector
   - Scroll down
   - Verify it goes to January of next year

## Notes

- Scroll direction is consistent: Up = previous, Down = next
- Month/year wrapping is automatic and seamless
- Dropdown functionality is preserved when open
- Default behavior (scrolling anywhere else) changes year
- Event preventDefault only called when handling our custom behavior

