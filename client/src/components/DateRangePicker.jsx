import {useState} from 'react';
import DatePickerCalendar from './DatePickerCalendar';

const RANGES = [
    {key: 'daily', label: 'Today'},
    {key: 'weekly', label: 'This Week'},
    {key: '4weeks', label: '4 Weeks'},
    {key: 'monthly', label: 'This Month'},
    {key: 'yearly', label: 'This Year'},
    {key: 'all', label: 'All Time'},
    {key: 'custom', label: 'Custom'},
];

export default function DateRangePicker({value, onChange}) {
    const [isCustomMode, setIsCustomMode] = useState(false);
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');
    const [openPicker, setOpenPicker] = useState(null); // 'from' | 'to' | null

    const handleRange = (key) => {
        if (key === 'custom') {
            setIsCustomMode(true);
            setOpenPicker(null);
        } else {
            setIsCustomMode(false);
            setOpenPicker(null);
            onChange({range: key, from: null, to: null});
        }
    };

    const parseDate = (dateStr) => {
        // Accept YYYY-MM-DD format with unlimited year digits
        // e.g., "2026-03-04" or "23847324983274-03-04"
        const match = dateStr.trim().match(/^(-?\d+)-(\d{1,2})-(\d{1,2})$/);
        if (!match) return null;
        const [, year, month, day] = match;
        const y = parseInt(year, 10);
        const m = parseInt(month, 10);
        const d = parseInt(day, 10);
        if (m < 1 || m > 12 || d < 1 || d > 31) return null;
        return new Date(y, m - 1, d).toISOString();
    };

    const handleCustomDateChange = (newFrom, newTo) => {
        // If only one date is set, just update it
        if (!newFrom || !newTo) {
            setCustomFrom(newFrom);
            setCustomTo(newTo);
            return;
        }

        const fromIso = parseDate(newFrom);
        const toIso = parseDate(newTo);

        if (!fromIso || !toIso) {
            setCustomFrom(newFrom);
            setCustomTo(newTo);
            return;
        }

        // Ensure from <= to, swap if necessary
        let finalFrom = newFrom;
        let finalTo = newTo;

        if (fromIso > toIso) {
            // Swap them
            finalFrom = newTo;
            finalTo = newFrom;
        }

        setCustomFrom(finalFrom);
        setCustomTo(finalTo);

        // Only call onChange if both dates are valid and in correct order
        const finalFromIso = parseDate(finalFrom);
        const finalToIso = parseDate(finalTo);
        if (finalFromIso && finalToIso && finalFromIso <= finalToIso) {
            onChange({
                range: null,
                from: finalFromIso,
                to: finalToIso
            });
        }
    };

    const activeKey = isCustomMode ? 'custom' : value.range;

    return (
        <div className="date-range-picker">
            <div className="range-buttons">
                {RANGES.map((r) => (
                    <button
                        key={r.key}
                        className={`range-btn ${activeKey === r.key ? 'active' : ''}`}
                        onClick={() => handleRange(r.key)}
                    >
                        {r.label}
                    </button>
                ))}
            </div>
            {isCustomMode && (
                <div className="custom-range-picker">
                    <div className="date-picker-section">
                        <label>From</label>
                        <DatePickerCalendar
                            value={customFrom}
                            isOpen={openPicker === 'from'}
                            onOpenChange={(isOpen) => setOpenPicker(isOpen ? 'from' : null)}
                            onChange={(date) => handleCustomDateChange(date, customTo)}
                        />
                    </div>
                    <span className="range-separator">→</span>
                    <div className="date-picker-section">
                        <label>To</label>
                        <DatePickerCalendar
                            value={customTo}
                            isOpen={openPicker === 'to'}
                            onOpenChange={(isOpen) => setOpenPicker(isOpen ? 'to' : null)}
                            onChange={(date) => handleCustomDateChange(customFrom, date)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

