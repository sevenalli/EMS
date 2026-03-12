import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    ChevronLeft,
    Download,
    Upload,
    Pencil,
    Trash2,
    RefreshCw,
    Search,
    CheckCircle2,
    AlertCircle,
    X,
    Loader2,
    ShieldAlert,
    Database,
    AlertTriangle,
} from 'lucide-react'
import { useStore } from '../store/store'
import { getInventory, downloadTemplate, deleteEquipment } from '../services/equipmentAdmin'
import ImportModal from '../components/admin/ImportModal'
import EditModal from '../components/admin/EditModal'

// ─── Toast Component ─────────────────────────────────────────────
const Toast = ({ toast, onDismiss, isDarkMode }) => {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 4000)
        return () => clearTimeout(timer)
    }, [onDismiss])

    return (
        <div className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-sm animate-slide-up ${toast.type === 'success'
            ? isDarkMode
                ? 'bg-green-900/90 text-green-300 border border-green-700'
                : 'bg-green-600 text-white'
            : isDarkMode
                ? 'bg-red-900/90 text-red-300 border border-red-700'
                : 'bg-red-600 text-white'
            }`}>
            {toast.type === 'success'
                ? <CheckCircle2 size={18} className="shrink-0" />
                : <AlertCircle size={18} className="shrink-0" />
            }
            <span className="flex-1">{toast.message}</span>
            <button onClick={onDismiss} className="p-1 hover:opacity-70 transition-opacity">
                <X size={14} />
            </button>
        </div>
    )
}

// ─── Delete Confirm Dialog ───────────────────────────────────────
const DeleteDialog = ({ isOpen, equipment, onConfirm, onCancel, isDarkMode, deleting }) => {
    if (!isOpen || !equipment) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onCancel} />
            <div className={`relative w-full max-w-md rounded-2xl shadow-2xl animate-scale-in ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
                }`}>
                <div className="px-6 py-6 text-center">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${isDarkMode ? 'bg-red-900/30' : 'bg-red-50'
                        }`}>
                        <ShieldAlert size={32} className="text-red-500" />
                    </div>
                    <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        Soft Delete Equipment
                    </h3>
                    <p className={`text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        You are about to archive <span className="font-semibold text-primary">{equipment.equipmentId}</span>.
                    </p>
                    <div className={`flex items-start gap-2 text-xs mt-4 p-3 rounded-xl ${isDarkMode ? 'bg-amber-900/20 text-amber-400 border border-amber-800' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                        <span>This will hide the crane from monitoring. If it sends data later, it will reappear.</span>
                    </div>
                </div>
                <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'
                    }`}>
                    <button
                        onClick={onCancel}
                        disabled={deleting}
                        className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={deleting}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-all active:scale-95 shadow-lg shadow-red-600/25"
                    >
                        {deleting ? (
                            <><Loader2 size={16} className="animate-spin" /> Archiving…</>
                        ) : (
                            <><Trash2 size={16} /> Archive</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Main Page ───────────────────────────────────────────────────
const AdminInventory = () => {
    const navigate = useNavigate()
    const isDarkMode = useStore((s) => s.isDarkMode)

    const [inventory, setInventory] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [toast, setToast] = useState(null)

    // Modal states
    const [importOpen, setImportOpen] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [editTarget, setEditTarget] = useState(null)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [deleting, setDeleting] = useState(false)

    // ── Fetch inventory ──
    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const data = await getInventory()
            setInventory(data)
        } catch (err) {
            setToast({ type: 'error', message: 'Failed to load inventory: ' + err.message })
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    // ── Actions ──
    const handleDownloadTemplate = async () => {
        try {
            await downloadTemplate()
            setToast({ type: 'success', message: 'Template downloaded!' })
        } catch (err) {
            setToast({ type: 'error', message: err.message })
        }
    }

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await deleteEquipment(deleteTarget.equipmentId)
            setToast({ type: 'success', message: `${deleteTarget.equipmentId} archived.` })
            setDeleteOpen(false)
            setDeleteTarget(null)
            fetchData()
        } catch (err) {
            setToast({ type: 'error', message: err.message })
        } finally {
            setDeleting(false)
        }
    }

    // ── Filter ──
    const filtered = inventory.filter((eq) => {
        if (!searchQuery) return true
        const q = searchQuery.toLowerCase()
        return (
            (eq.equipmentId || '').toLowerCase().includes(q) ||
            (eq.siteName || '').toLowerCase().includes(q) ||
            (eq.category || '').toLowerCase().includes(q) ||
            (eq.brand || '').toLowerCase().includes(q) ||
            (eq.model || '').toLowerCase().includes(q)
        )
    })

    // ── Table Columns ──
    const columns = [
        { key: 'status', label: 'Status', width: 'w-20' },
        { key: 'equipmentCode', label: 'Equipment Code' },
        { key: 'siteName', label: 'Site' },
        { key: 'category', label: 'Category' },
        { key: 'brand', label: 'Brand' },
        { key: 'model', label: 'Model' },
        { key: 'capacity', label: 'Capacity' },
        { key: 'commissionDate', label: 'Commission Date' },
        { key: 'actions', label: 'Actions', width: 'w-28' },
    ]

    return (
        <div className={`min-h-screen py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
            }`}>
            <div className="max-w-7xl mx-auto">
                {/* ── Back + Title ── */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/')}
                        className={`flex items-center gap-2 mb-4 transition-colors group ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-primary'
                            }`}
                    >
                        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Home
                    </button>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDarkMode ? 'bg-primary-900/50' : 'bg-primary-50'
                                }`}>
                                <Database className="text-primary" size={24} />
                            </div>
                            <div>
                                <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                    Fleet <span className="text-primary">Administration</span>
                                </h1>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Manage crane inventory, import data, and modify equipment details
                                </p>
                            </div>
                        </div>

                        {/* Stats badges */}
                        <div className="flex items-center gap-3">
                            <div className={`px-4 py-2 rounded-xl text-sm font-medium ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600 shadow-sm'
                                }`}>
                                <span className="text-primary font-bold">{inventory.length}</span> Total
                            </div>
                            <div className={`px-4 py-2 rounded-xl text-sm font-medium ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600 shadow-sm'
                                }`}>
                                <span className="text-green-500 font-bold">
                                    {inventory.filter((e) => e.isActive !== false).length}
                                </span> Active
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Toolbar ── */}
                <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 p-4 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-sm'
                    }`}>
                    {/* Search */}
                    <div className="relative flex-1 max-w-md w-full">
                        <Search size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'
                            }`} />
                        <input
                            type="text"
                            placeholder="Search by code, site, brand…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${isDarkMode
                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                                : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400'
                                }`}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchData}
                            className={`p-2.5 rounded-xl border transition-colors ${isDarkMode
                                ? 'border-gray-600 text-gray-400 hover:text-white hover:border-gray-500'
                                : 'border-gray-200 text-gray-500 hover:text-primary hover:border-primary'
                                }`}
                            title="Refresh"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <button
                            onClick={handleDownloadTemplate}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all hover:shadow-md ${isDarkMode
                                ? 'border-gray-600 text-gray-300 hover:border-primary hover:text-primary'
                                : 'border-gray-300 text-gray-700 hover:border-primary hover:text-primary'
                                }`}
                        >
                            <Download size={16} />
                            Download Template
                        </button>
                        <button
                            onClick={() => setImportOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-primary hover:bg-primary-600 text-white transition-all shadow-lg shadow-primary/25 active:scale-95"
                        >
                            <Upload size={16} />
                            Import Fleet
                        </button>
                    </div>
                </div>

                {/* ── Data Table ── */}
                <div className={`rounded-2xl overflow-hidden transition-colors ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white shadow-sm'
                    }`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className={isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}>
                                    {columns.map((col) => (
                                        <th
                                            key={col.key}
                                            className={`px-4 py-3.5 text-left font-semibold text-xs uppercase tracking-wider ${col.width || ''} ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                                }`}
                                        >
                                            {col.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                                {loading ? (
                                    <tr>
                                        <td colSpan={columns.length} className="px-4 py-16 text-center">
                                            <Loader2 size={32} className={`mx-auto mb-3 animate-spin ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                                            <p className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>Loading inventory…</p>
                                        </td>
                                    </tr>
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={columns.length} className="px-4 py-16 text-center">
                                            <Database size={32} className={`mx-auto mb-3 opacity-30 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                                            <p className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                {searchQuery ? 'No equipment matches your search' : 'No equipment found'}
                                            </p>
                                            <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                                                {searchQuery ? 'Try a different query' : 'Import fleet data to get started'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((eq) => {
                                        const isArchived = eq.isActive === false
                                        return (
                                            <tr
                                                key={eq.equipmentId}
                                                className={`transition-colors ${isArchived
                                                    ? isDarkMode ? 'opacity-60' : 'opacity-60'
                                                    : isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
                                                    }`}
                                            >
                                                {/* Status */}
                                                <td className="px-4 py-3.5">
                                                    {isArchived ? (
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isDarkMode
                                                            ? 'bg-red-900/30 text-red-400'
                                                            : 'bg-red-50 text-red-600'
                                                            }`}>
                                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                                            Archived
                                                        </span>
                                                    ) : (
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isDarkMode
                                                            ? 'bg-green-900/30 text-green-400'
                                                            : 'bg-green-50 text-green-600'
                                                            }`}>
                                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                            Online
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Code */}
                                                <td className={`px-4 py-3.5 font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                                    {eq.equipmentId || '—'}
                                                </td>

                                                {/* Site */}
                                                <td className={`px-4 py-3.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                    <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-primary'
                                                        }`}>
                                                        {eq.siteName || '—'}
                                                    </span>
                                                </td>

                                                {/* Category */}
                                                <td className={`px-4 py-3.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                    {eq.category || '—'}
                                                </td>

                                                {/* Brand */}
                                                <td className={`px-4 py-3.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                    {eq.brand || '—'}
                                                </td>

                                                {/* Model */}
                                                <td className={`px-4 py-3.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                    {eq.model || '—'}
                                                </td>

                                                {/* Capacity */}
                                                <td className={`px-4 py-3.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                    {eq.capacity != null ? `${eq.capacity}T` : '—'}
                                                </td>

                                                {/* Commission Date */}
                                                <td className={`px-4 py-3.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                    {eq.commissionDate
                                                        ? new Date(eq.commissionDate).toLocaleDateString('en-GB')
                                                        : '—'}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => { setEditTarget(eq); setEditOpen(true) }}
                                                            className={`p-2 rounded-lg transition-colors ${isDarkMode
                                                                ? 'hover:bg-gray-600 text-gray-400 hover:text-amber-400'
                                                                : 'hover:bg-amber-50 text-gray-400 hover:text-amber-600'
                                                                }`}
                                                            title="Edit"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => { setDeleteTarget(eq); setDeleteOpen(true) }}
                                                            className={`p-2 rounded-lg transition-colors ${isDarkMode
                                                                ? 'hover:bg-gray-600 text-gray-400 hover:text-red-400'
                                                                : 'hover:bg-red-50 text-gray-400 hover:text-red-600'
                                                                }`}
                                                            title="Archive"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer count */}
                    {!loading && filtered.length > 0 && (
                        <div className={`px-4 py-3 border-t text-xs ${isDarkMode ? 'border-gray-700 text-gray-500' : 'border-gray-100 text-gray-400'
                            }`}>
                            Showing {filtered.length} of {inventory.length} equipment
                        </div>
                    )}
                </div>
            </div>

            {/* ── Modals ── */}
            <ImportModal
                isOpen={importOpen}
                onClose={() => setImportOpen(false)}
                onSuccess={fetchData}
            />
            <EditModal
                isOpen={editOpen}
                onClose={() => { setEditOpen(false); setEditTarget(null) }}
                equipment={editTarget}
                onSuccess={fetchData}
            />
            <DeleteDialog
                isOpen={deleteOpen}
                equipment={deleteTarget}
                onConfirm={handleDeleteConfirm}
                onCancel={() => { setDeleteOpen(false); setDeleteTarget(null) }}
                isDarkMode={isDarkMode}
                deleting={deleting}
            />

            {/* ── Toast ── */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-[60]">
                    <Toast
                        toast={toast}
                        onDismiss={() => setToast(null)}
                        isDarkMode={isDarkMode}
                    />
                </div>
            )}
        </div>
    )
}

export default AdminInventory
