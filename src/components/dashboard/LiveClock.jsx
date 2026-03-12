import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LiveClock = ({ isDarkMode = true }) => {
    const { i18n } = useTranslation();
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formattedDate = time.toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    return (
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-6 ${isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-50 text-blue-600'
            }`}>
            <Calendar size={16} />
            <span className="font-medium tabular-nums">{formattedDate}</span>
        </div>
    );
};

export default LiveClock;
