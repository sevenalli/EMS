import React from 'react';
import { Box } from 'lucide-react';

const ServiceCard = ({
    name,
    icon: Icon = Box,
    onClick,
    isMonitoring = false,
    isDarkMode = true
}) => {
    return (
        <button
            onClick={onClick}
            className={`group rounded-2xl p-8 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${isMonitoring ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                } ${isDarkMode
                    ? `bg-gray-800 ${isMonitoring ? 'ring-offset-gray-900' : ''} shadow-lg`
                    : 'bg-white shadow-sm'
                }`}
        >
            {/* Icon */}
            <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center group-hover:bg-blue-500 group-hover:scale-110 transition-all duration-300 ${isDarkMode ? 'bg-blue-900/50' : 'bg-blue-50'
                }`}>
                <Icon
                    className="text-blue-500 group-hover:text-white transition-colors"
                    size={28}
                />
            </div>

            {/* Label */}
            <h3 className={`font-medium group-hover:text-blue-500 transition-colors ${isDarkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                {name}
            </h3>
        </button>
    );
};

export default ServiceCard;
