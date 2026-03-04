import {useState, useEffect, useRef} from 'react';

export default function DatePickerCalendar({value, onChange, isOpen, onOpenChange}) {
    const pickerRef = useRef(null);
    const calendarPopupRef = useRef(null);
    const [displayYear, setDisplayYear] = useState(() => {
        if (value) {
            const parts = value.split('-');
            return parseInt(parts[0], 10);
        }
        return new Date().getFullYear();
    });
    const [displayMonth, setDisplayMonth] = useState(() => {
        if (value) {
            const parts = value.split('-');
            return parseInt(parts[1], 10) - 1; // 0-indexed
        }
        return new Date().getMonth();
    });

    // Close picker when clicking outside
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target)) {
                onOpenChange(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onOpenChange]);

    // Handle scroll for year navigation
    useEffect(() => {
        if (!isOpen || !calendarPopupRef.current) return;

        const handleWheel = (e) => {
            e.preventDefault();
            if (e.deltaY > 0) {
                // Scroll down - go to next year
                setDisplayYear(prev => prev + 1);
            } else {
                // Scroll up - go to previous year
                setDisplayYear(prev => prev - 1);
            }
        };

        const popup = calendarPopupRef.current;
        popup.addEventListener('wheel', handleWheel, { passive: false });
        return () => popup.removeEventListener('wheel', handleWheel);
    }, [isOpen]);

    const handleDateClick = (day) => {
        const dateStr = `${displayYear}-${String(displayMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        onChange(dateStr);
        onOpenChange(false);
    };

    const handleYearChange = (e) => {
        setDisplayYear(parseInt(e.target.value, 10));
    };

    const handleMonthChange = (e) => {
        setDisplayMonth(parseInt(e.target.value, 10));
    };

    const handlePrevMonth = () => {
        if (displayMonth === 0) {
            setDisplayMonth(11);
            setDisplayYear(displayYear - 1);
        } else {
            setDisplayMonth(displayMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (displayMonth === 11) {
            setDisplayMonth(0);
            setDisplayYear(displayYear + 1);
        } else {
            setDisplayMonth(displayMonth + 1);
        }
    };

    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year, month) => {
        return new Date(year, month, 1).getDay();
    };

    const daysInMonth = getDaysInMonth(displayYear, displayMonth);
    const firstDay = getFirstDayOfMonth(displayYear, displayMonth);
    const days = [];

    // Add empty cells for days before the month starts
    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Generate year options: 5 years before and 5 years after the current displayed year
    const yearOptions = [];
    for (let i = displayYear - 5; i <= displayYear + 5; i++) {
        yearOptions.push(i);
    }

    const displayValue = value || 'Pick date';

    return (
        <div className="date-picker-calendar" ref={pickerRef}>
            <button className="date-picker-button" onClick={() => onOpenChange(!isOpen)}>
                {displayValue}
            </button>

            {isOpen && (
                <div className="calendar-popup" ref={calendarPopupRef}>
                    <div className="calendar-header">
                        <button onClick={handlePrevMonth} className="nav-btn">←</button>

                        <select value={displayMonth} onChange={handleMonthChange} className="month-select">
                            {monthNames.map((name, idx) => (
                                <option key={idx} value={idx}>{name}</option>
                            ))}
                        </select>

                        <select
                            value={displayYear}
                            onChange={handleYearChange}
                            className="year-select"
                        >
                            {yearOptions.map((year) => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>

                        <button onClick={handleNextMonth} className="nav-btn">→</button>
                    </div>

                    <div className="calendar-weekdays">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                            <div key={day} className="weekday">{day}</div>
                        ))}
                    </div>

                    <div className="calendar-days">
                        {days.map((day, idx) => (
                            <div
                                key={idx}
                                className={`calendar-day ${day ? 'active' : 'empty'} ${
                                    value && value === `${displayYear}-${String(displayMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                                        ? 'selected'
                                        : ''
                                }`}
                                onClick={() => day && handleDateClick(day)}
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    <button className="calendar-close" onClick={() => onOpenChange(false)}>Done</button>
                </div>
            )}
        </div>
    );
}

