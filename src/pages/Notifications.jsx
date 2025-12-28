import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell, AlertOctagon, AlertTriangle, XCircle, Info,
    ChevronLeft, Search, Filter, Zap, Mail, CheckCheck, Trash2,
    RefreshCw
} from 'lucide-react';
import { NOTIFICATION_TAGS, NOTIFICATION_CATEGORIES, TYPE_COLORS } from '../data/notificationTags';

// Notification type icons
const TypeIcon = ({ type, size = 20 }) => {
    const icons = {
        Critical: AlertOctagon,
        Alarm: Bell,
        Warning: AlertTriangle,
        Fault: XCircle,
        Info: Info,
    };
    const Icon = icons[type] || Info;
    return <Icon size={size} />;
};

function Notifications() {
    const navigate = useNavigate();
    const isDarkMode = true;

    // State
    const [notifications, setNotifications] = useState([]);
    const [filteredNotifications, setFilteredNotifications] = useState([]);
    const [typeFilter, setTypeFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [searchText, setSearchText] = useState('');
    const [showActiveOnly, setShowActiveOnly] = useState(false);
    const [isSimulating, setIsSimulating] = useState(true);

    // Stats
    const getCriticalCount = () => notifications.filter(n => n.type === 'Critical' && n.isActive).length;
    const getActiveCount = () => notifications.filter(n => n.isActive).length;
    const getUnreadCount = () => notifications.filter(n => !n.isRead).length;

    // Apply filters
    const applyFilters = useCallback(() => {
        let filtered = [...notifications];

        if (typeFilter !== 'all') {
            filtered = filtered.filter(n => n.type === typeFilter);
        }
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(n => n.category === categoryFilter);
        }
        if (showActiveOnly) {
            filtered = filtered.filter(n => n.isActive);
        }
        if (searchText.trim()) {
            const search = searchText.toLowerCase();
            filtered = filtered.filter(n =>
                n.message.toLowerCase().includes(search) ||
                n.tagName.toLowerCase().includes(search)
            );
        }

        setFilteredNotifications(filtered);
    }, [notifications, typeFilter, categoryFilter, showActiveOnly, searchText]);

    useEffect(() => {
        applyFilters();
    }, [applyFilters]);

    // Simulated MQTT - for testing only
    useEffect(() => {
        if (!isSimulating) return;

        let notifId = 0;

        // Add initial notifications
        const initialNotifs = NOTIFICATION_TAGS.slice(0, 5).map((tag, idx) => ({
            id: ++notifId,
            tagName: tag.tagName,
            message: tag.message,
            type: tag.type,
            category: tag.category,
            timestamp: new Date(Date.now() - idx * 60000),
            isRead: idx > 1,
            isActive: idx < 3
        }));
        setNotifications(initialNotifs);

        // Simulate random notifications
        const interval = setInterval(() => {
            const randomTag = NOTIFICATION_TAGS[Math.floor(Math.random() * NOTIFICATION_TAGS.length)];
            const isActive = Math.random() > 0.3;

            setNotifications(prev => {
                // Check if tag already exists and is active
                const existing = prev.find(n => n.tagName === randomTag.tagName && n.isActive);

                if (existing && !isActive) {
                    // Clear existing notification
                    return prev.map(n =>
                        n.id === existing.id ? { ...n, isActive: false } : n
                    );
                } else if (!existing && isActive) {
                    // Add new notification
                    return [{
                        id: ++notifId,
                        tagName: randomTag.tagName,
                        message: randomTag.message,
                        type: randomTag.type,
                        category: randomTag.category,
                        timestamp: new Date(),
                        isRead: false,
                        isActive: true
                    }, ...prev].slice(0, 50); // Keep max 50
                }
                return prev;
            });
        }, 3000);

        return () => clearInterval(interval);
    }, [isSimulating]);

    // Actions
    const markAsRead = (id) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const clearAllInactive = () => {
        setNotifications(prev => prev.filter(n => n.isActive));
    };

    const formatDate = (date) => {
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-[#0a1628] via-[#1a2a4a] to-[#0d1f3c]' : 'bg-gray-100'}`}>
            {/* Header */}
            <div className="p-4">
                <div className={`rounded-xl p-4 ${isDarkMode ? 'bg-white/5' : 'bg-white shadow-sm'}`}>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(-1)}
                                className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100'}`}
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <h1 className={`text-xl font-bold flex items-center gap-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                <Bell className="text-amber-500" />
                                Notifications en Temps Réel
                            </h1>
                            {/* LIVE Indicator */}
                            <div className="flex items-center gap-2 bg-green-500/15 text-green-500 px-3 py-1 rounded-full text-xs font-semibold">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                LIVE
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-2 flex-wrap">
                            {getCriticalCount() > 0 && (
                                <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500/20 text-red-500 animate-pulse">
                                    <AlertOctagon size={16} />
                                    {getCriticalCount()} Critical
                                </span>
                            )}
                            <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-500/20 text-blue-500">
                                <Zap size={16} />
                                {getActiveCount()} Active
                            </span>
                            <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-500/20 text-amber-500">
                                <Mail size={16} />
                                {getUnreadCount()} Unread
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="px-4 pb-4">
                <div className={`rounded-xl p-4 ${isDarkMode ? 'bg-white/5' : 'bg-white shadow-sm'}`}>
                    <div className="flex flex-wrap gap-3 items-center">
                        {/* Type Filter */}
                        <div className="flex items-center gap-2">
                            <label className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Type:</label>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className={`px-3 py-1.5 rounded-lg text-sm ${isDarkMode ? 'bg-black/30 border-white/10 text-white' : 'bg-gray-100 border-gray-200'} border`}
                            >
                                <option value="all">All Types</option>
                                <option value="Critical">Critical</option>
                                <option value="Alarm">Alarm</option>
                                <option value="Warning">Warning</option>
                                <option value="Fault">Fault</option>
                                <option value="Info">Info</option>
                            </select>
                        </div>

                        {/* Category Filter */}
                        <div className="flex items-center gap-2">
                            <label className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Category:</label>
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className={`px-3 py-1.5 rounded-lg text-sm ${isDarkMode ? 'bg-black/30 border-white/10 text-white' : 'bg-gray-100 border-gray-200'} border`}
                            >
                                <option value="all">All Categories</option>
                                {NOTIFICATION_CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        {/* Search */}
                        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg flex-1 ${isDarkMode ? 'bg-black/30 border-white/10' : 'bg-gray-100 border-gray-200'} border`}>
                                <Search size={16} className="text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    className={`bg-transparent border-none outline-none text-sm flex-1 ${isDarkMode ? 'text-white placeholder-gray-500' : ''}`}
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 ml-auto">
                            <button
                                onClick={() => setShowActiveOnly(!showActiveOnly)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${showActiveOnly
                                        ? 'bg-blue-500/30 border-blue-500 text-blue-400'
                                        : 'bg-blue-500/15 border-blue-500/30 text-blue-500'
                                    }`}
                            >
                                <Zap size={14} />
                                Active Only
                            </button>
                            <button
                                onClick={markAllAsRead}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/15 border border-blue-500/30 text-blue-500 hover:bg-blue-500/25 transition-colors"
                            >
                                <CheckCheck size={14} />
                                Mark All Read
                            </button>
                            <button
                                onClick={clearAllInactive}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/15 border border-red-500/30 text-red-500 hover:bg-red-500/25 transition-colors"
                            >
                                <Trash2 size={14} />
                                Clear Inactive
                            </button>
                            <button
                                onClick={() => setIsSimulating(!isSimulating)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${isSimulating
                                        ? 'bg-green-500/30 border-green-500 text-green-400'
                                        : 'bg-gray-500/15 border-gray-500/30 text-gray-500'
                                    }`}
                            >
                                <RefreshCw size={14} className={isSimulating ? 'animate-spin' : ''} />
                                Simulation
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notifications List */}
            <div className="px-4 pb-4">
                <div className="flex flex-col gap-3">
                    {filteredNotifications.length === 0 ? (
                        <div className={`rounded-xl p-12 text-center ${isDarkMode ? 'bg-white/5' : 'bg-white shadow-sm'}`}>
                            <Bell size={48} className={`mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                            <p className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>No notifications</p>
                        </div>
                    ) : (
                        filteredNotifications.map(notification => {
                            const colors = TYPE_COLORS[notification.type] || TYPE_COLORS.Info;

                            return (
                                <div
                                    key={notification.id}
                                    onClick={() => markAsRead(notification.id)}
                                    className={`
                    flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all
                    border-l-4 ${colors.border}
                    ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-white hover:bg-gray-50 shadow-sm'}
                    ${!notification.isRead ? (isDarkMode ? 'bg-white/10' : 'bg-blue-50') : ''}
                    ${notification.isActive && notification.type === 'Critical' ? 'animate-pulse' : ''}
                  `}
                                >
                                    {/* Icon */}
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.bgLight}`}>
                                        <TypeIcon type={notification.type} size={20} className={colors.text} />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${colors.bg} ${colors.text}`}>
                                                {notification.type}
                                            </span>
                                            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                <Filter size={12} className="inline mr-1" />
                                                {notification.category}
                                            </span>
                                            <span className={`text-xs ml-auto ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                                {formatDate(notification.timestamp)}
                                            </span>
                                        </div>
                                        <p className={`text-sm mb-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                            {notification.message}
                                        </p>
                                        <p className={`text-xs font-mono ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {notification.tagName}
                                        </p>
                                    </div>

                                    {/* Status */}
                                    <div className="flex flex-col items-center gap-1 px-2">
                                        <span className={`w-3 h-3 rounded-full ${notification.isActive
                                                ? 'bg-green-500 shadow-lg shadow-green-500/50 animate-pulse'
                                                : 'bg-gray-500'
                                            }`} />
                                        <span className={`text-[10px] uppercase ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {notification.isActive ? 'ACTIVE' : 'CLEARED'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}

export default Notifications;
