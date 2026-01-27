import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Bell, AlertOctagon, AlertTriangle, XCircle, Info,
    ChevronLeft, Search, Filter, Zap, Mail, CheckCheck, Trash2,
    RefreshCw, Wifi, History, Calendar, Play, Pause, SkipBack, SkipForward
} from 'lucide-react';
import { NOTIFICATION_TAGS, NOTIFICATION_CATEGORIES, TYPE_COLORS, NOTIFICATION_TAG_MAP } from '../data/notificationTags';
import { TAG_MAPPINGS, TIME_RANGES, PLAYBACK_SPEEDS } from '../data/telemetryData';
import { useMqtt } from '../hooks/useMqtt';
import { useTopicDiscovery } from '../hooks/useTopicDiscovery';
import { useHistory } from '../hooks/useHistory';
import { useStore, mockData } from '../store/store';

// Generate unique ID
const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

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
    const { equipmentId } = useParams(); // Optional equipment filter
    const isDarkMode = useStore((state) => state.isDarkMode);

    // Get equipment port from mock data (if specific equipment)
    const equipmentData = equipmentId ? mockData.equipment.find(eq => eq.id === equipmentId) : null;
    const portId = equipmentData?.portId || 'SMA';

    // Dynamic topic: specific equipment or wildcard for all
    const dynamicTopic = equipmentId ? `${portId}/${equipmentId}` : '+/+';

    // State
    const [notifications, setNotifications] = useState([]);
    const [filteredNotifications, setFilteredNotifications] = useState([]);
    const [typeFilter, setTypeFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [searchText, setSearchText] = useState('');
    const [showActiveOnly, setShowActiveOnly] = useState(false);

    // History Mode State
    const [isHistoryMode, setIsHistoryMode] = useState(false);
    const [selectedTimeRange, setSelectedTimeRange] = useState(TIME_RANGES[0]); // Default 1h
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(PLAYBACK_SPEEDS[0]);
    const [playbackProgress, setPlaybackProgress] = useState(0);
    const [playbackIndex, setPlaybackIndex] = useState(0);
    const playbackRef = useRef(null);

    // Track previous tag states for edge detection
    const previousStatesRef = useRef(new Map());

    // Use topic discovery for wildcard subscription to all equipment
    const { isConnected, activeEquipment, onlineEquipmentCodes } = useTopicDiscovery({
        portFilter: equipmentId ? portId : null  // Filter by port if specific equipment
    });

    // Also use specific MQTT for single equipment if provided
    const { rawData } = useMqtt(equipmentId || 'notifications', {
        useMock: false,
        brokerUrl: 'ws://localhost:8000/mqtt',
        topic: dynamicTopic
    });

    // History Hook
    const {
        historyData,
        isLoading: historyLoading,
        fetchHistoricalData
    } = useHistory();

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

    // Load History Data when entering history mode
    useEffect(() => {
        if (isHistoryMode && equipmentId && selectedTimeRange) {
            // Need to request ALL tags because Notification tags cover many categories
            // Simplest way is to define tags as [], so backend returns all. 
            // OR explicitly map notification tags. The previous logic was "fetch all" is safest.
            const allTags = Object.values(TAG_MAPPINGS);
            fetchHistoricalData(selectedTimeRange, allTags, equipmentId);
            setPlaybackIndex(0);
            setPlaybackProgress(0);
            setIsPlaying(false);
            setNotifications([]); // Clear live notifications when entering history
            previousStatesRef.current.clear();
        } else if (!isHistoryMode) {
            // Reset when going back to live? Optional.
        }
    }, [isHistoryMode, selectedTimeRange, equipmentId]);

    // Playback Logic
    useEffect(() => {
        if (!isHistoryMode || !isPlaying || historyData.length === 0) return;

        playbackRef.current = setInterval(() => {
            setPlaybackIndex(prev => {
                const next = prev + 1;
                if (next >= historyData.length) {
                    setIsPlaying(false);
                    return prev;
                }
                setPlaybackProgress((next / (historyData.length - 1)) * 100);
                return next;
            });
        }, 1000 / playbackSpeed.value);

        return () => clearInterval(playbackRef.current);
    }, [isHistoryMode, isPlaying, historyData, playbackSpeed]);

    // Playback Controls
    const togglePlayback = () => setIsPlaying(prev => !prev);
    const skipBackward = () => {
        const newIndex = Math.max(0, playbackIndex - 10);
        setPlaybackIndex(newIndex);
        setPlaybackProgress((newIndex / ((historyData?.length || 1) - 1)) * 100);
    };
    const skipForward = () => {
        const newIndex = Math.min((historyData?.length || 1) - 1, playbackIndex + 10);
        setPlaybackIndex(newIndex);
        setPlaybackProgress((newIndex / ((historyData?.length || 1) - 1)) * 100);
    };

    // Process Data (Live or History) for Notifications
    useEffect(() => {
        // Source selection
        let currentData = null;
        let timestamp = new Date();

        if (isHistoryMode) {
            if (historyData && historyData[playbackIndex]) {
                currentData = historyData[playbackIndex].data;
                timestamp = new Date(historyData[playbackIndex].timestamp);
            }
        } else {
            currentData = rawData;
            timestamp = new Date();
        }

        if (!currentData) return;

        const previousStates = previousStatesRef.current;

        // Check each notification tag
        for (const tag of NOTIFICATION_TAGS) {
            // KEY MAPPING LOGIC:
            // Tag definitions use RAW keys (e.g., Dieselmotor_Not_Aus)
            // HistoryService returns data with FRIENDLY keys (e.g., dieselEngineStatus)
            // Live MQTT returns RAW keys.

            let currentValue = undefined;

            if (isHistoryMode) {
                // In History Mode, we must find the friendly key for this raw tag
                // If the raw tag is NOT in TAG_MAPPINGS, we try using the raw tag itself (fallback)
                // We can find the key by searching TAG_MAPPINGS values? 
                // TAG_MAPPINGS is { friendly: raw }. 
                // So we search for key where value === tag.tagName
                const friendlyKey = Object.keys(TAG_MAPPINGS).find(k => TAG_MAPPINGS[k] === tag.tagName);

                if (friendlyKey && currentData[friendlyKey] !== undefined) {
                    currentValue = currentData[friendlyKey];
                } else if (currentData[tag.tagName] !== undefined) {
                    // Fallback check if simple raw key exists
                    currentValue = currentData[tag.tagName];
                }
            } else {
                // Live Mode: Direct Raw Key Access
                currentValue = currentData[tag.tagName];
            }

            if (currentValue !== undefined) {
                // Determine active state (handle numbers, strings, bools)
                let isActive = false;
                if (typeof currentValue === 'boolean') isActive = currentValue;
                else if (typeof currentValue === 'number') isActive = currentValue > 0;
                else if (typeof currentValue === 'string') isActive = currentValue === 'true' || currentValue === '1';

                const wasActive = previousStates.get(tag.tagName) || false;

                // Rising edge: notification triggered
                if (isActive && !wasActive) {
                    setNotifications(prev => [{
                        id: generateId(),
                        tagName: tag.tagName,
                        message: tag.message,
                        type: tag.type,
                        category: tag.category,
                        timestamp: timestamp, // Use source timestamp
                        isRead: false,
                        isActive: true
                    }, ...prev].slice(0, 100)); // Keep max 100

                    // Play sound (only live mode to avoid spam during playback?)
                    // Or play sound only if we are "playing" but user might pause and check.
                    // Let's sound only in LIVE mode to prevent chaos.
                    if (!isHistoryMode && (tag.type === 'Critical' || tag.type === 'Alarm')) {
                        playAlertSound();
                    }
                }
                // Falling edge: notification cleared
                else if (!isActive && wasActive) {
                    setNotifications(prev =>
                        prev.map(n =>
                            n.tagName === tag.tagName && n.isActive
                                ? { ...n, isActive: false }
                                : n
                        )
                    );
                }

                previousStates.set(tag.tagName, isActive);
            }
        }
    }, [rawData, isHistoryMode, historyData, playbackIndex]);

    const playAlertSound = () => {
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ==');
            audio.volume = 0.3;
            audio.play().catch(() => { });
        } catch (e) { }
    };


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
                                Notifications
                            </h1>

                            {/* Mode Indicator */}
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${isHistoryMode
                                ? 'bg-blue-500/15 text-blue-500'
                                : isConnected ? 'bg-green-500/15 text-green-500' : 'bg-red-500/15 text-red-500'
                                }`}>
                                {isHistoryMode ? <History size={14} /> : <Wifi size={14} />}
                                <span className={`w-2 h-2 rounded-full ${isHistoryMode ? 'bg-blue-500'
                                    : isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                                    }`} />
                                {isHistoryMode ? 'HISTORY' : isConnected ? 'LIVE' : 'OFFLINE'}
                            </div>
                        </div>

                        {/* Controls: Mode Toggle & History Params */}
                        <div className="flex items-center gap-4">
                            {/* Mode Toggle */}
                            <div className="flex bg-black/20 rounded-lg p-1 border border-white/10">
                                <button
                                    onClick={() => setIsHistoryMode(false)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${!isHistoryMode
                                        ? 'bg-green-600 text-white shadow-lg'
                                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                                        }`}
                                >
                                    Live
                                </button>
                                <button
                                    onClick={() => setIsHistoryMode(true)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${isHistoryMode
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                                        }`}
                                >
                                    History
                                </button>
                            </div>

                            {/* Time Range (History Only) */}
                            {isHistoryMode && (
                                <select
                                    value={selectedTimeRange.label}
                                    onChange={(e) => {
                                        const range = TIME_RANGES.find(r => r.label === e.target.value);
                                        if (range) setSelectedTimeRange(range);
                                    }}
                                    className="px-2 py-1.5 rounded bg-white/10 text-xs border border-white/20 text-white focus:outline-none"
                                >
                                    {TIME_RANGES.map(range => (
                                        <option key={range.label} value={range.label} className="bg-gray-800">
                                            {range.label}
                                        </option>
                                    ))}
                                </select>
                            )}

                            {/* Playback Controls (History Only) */}
                            {isHistoryMode && historyData.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <button onClick={skipBackward} className="p-1.5 rounded hover:bg-white/10 text-white">
                                        <SkipBack size={16} />
                                    </button>
                                    <button
                                        onClick={togglePlayback}
                                        className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white"
                                    >
                                        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                                    </button>
                                    <button onClick={skipForward} className="p-1.5 rounded hover:bg-white/10 text-white">
                                        <SkipForward size={16} />
                                    </button>

                                    {/* Progress Bar Mini */}
                                    <div className="w-24 h-1.5 bg-white/20 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-400"
                                            style={{ width: `${playbackProgress}%` }}
                                        />
                                    </div>

                                    <span className="text-xs text-white/70 tabular-nums">
                                        {playbackIndex + 1}/{historyData.length}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
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
