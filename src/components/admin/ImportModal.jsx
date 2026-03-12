import { useState, useRef, useCallback } from 'react'
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, ChevronDown } from 'lucide-react'
import { useStore, mockData } from '../../store/store'
import { uploadInventory } from '../../services/equipmentAdmin'

const ImportModal = ({ isOpen, onClose, onSuccess }) => {
    const isDarkMode = useStore((s) => s.isDarkMode)
    const [selectedSite, setSelectedSite] = useState('')
    const [file, setFile] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [dragOver, setDragOver] = useState(false)
    const [feedback, setFeedback] = useState(null) // { type: 'success'|'error', message }
    const fileInputRef = useRef(null)

    const sites = mockData.ports

    const resetForm = () => {
        setSelectedSite('')
        setFile(null)
        setFeedback(null)
    }

    const handleClose = () => {
        if (!uploading) {
            resetForm()
            onClose()
        }
    }

    const handleFileDrop = useCallback((e) => {
        e.preventDefault()
        setDragOver(false)
        const droppedFile = e.dataTransfer.files[0]
        if (droppedFile && droppedFile.name.endsWith('.xlsx')) {
            setFile(droppedFile)
            setFeedback(null)
        } else {
            setFeedback({ type: 'error', message: 'Only .xlsx files are accepted.' })
        }
    }, [])

    const handleFileSelect = (e) => {
        const selected = e.target.files[0]
        if (selected) {
            setFile(selected)
            setFeedback(null)
        }
    }

    const handleUpload = async () => {
        if (!file || !selectedSite) return
        setUploading(true)
        setFeedback(null)

        try {
            await uploadInventory(file, selectedSite)
            setFeedback({ type: 'success', message: 'Fleet imported successfully!' })
            setTimeout(() => {
                resetForm()
                onClose()
                onSuccess?.()
            }, 1500)
        } catch (err) {
            setFeedback({ type: 'error', message: err.message || 'Upload failed. Please try again.' })
        } finally {
            setUploading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl animate-scale-in transition-colors ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
                }`}>
                {/* Header */}
                <div className={`flex items-center justify-between px-6 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'
                    }`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-primary-900/50' : 'bg-primary-50'
                            }`}>
                            <Upload className="text-primary" size={20} />
                        </div>
                        <div>
                            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                Import Fleet
                            </h2>
                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Upload equipment data from Excel
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={uploading}
                        className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                            }`}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-5">
                    {/* Site Dropdown */}
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Select Site / Port
                        </label>
                        <div className="relative">
                            <select
                                value={selectedSite}
                                onChange={(e) => setSelectedSite(e.target.value)}
                                disabled={uploading}
                                className={`w-full appearance-none px-4 py-3 pr-10 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${isDarkMode
                                    ? 'bg-gray-700 border-gray-600 text-white'
                                    : 'bg-gray-50 border-gray-200 text-gray-800'
                                    }`}
                            >
                                <option value="">— Choose a site —</option>
                                {sites.map((site) => (
                                    <option key={site.id} value={site.name}>
                                        {site.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown
                                size={16}
                                className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                    }`}
                            />
                        </div>
                    </div>

                    {/* File Upload Zone */}
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Excel File
                        </label>
                        <div
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleFileDrop}
                            onClick={() => !uploading && fileInputRef.current?.click()}
                            className={`relative flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all ${dragOver
                                ? 'border-primary bg-primary/5 scale-[1.01]'
                                : file
                                    ? isDarkMode
                                        ? 'border-green-600 bg-green-900/20'
                                        : 'border-green-400 bg-green-50'
                                    : isDarkMode
                                        ? 'border-gray-600 hover:border-gray-500 bg-gray-700/50'
                                        : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                                }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            {file ? (
                                <>
                                    <FileSpreadsheet size={32} className="text-green-500" />
                                    <div className="text-center">
                                        <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                            {file.name}
                                        </p>
                                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {(file.size / 1024).toFixed(1)} KB — Click to change
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Upload size={32} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                                    <div className="text-center">
                                        <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                            Drag & drop your <span className="text-primary">.xlsx</span> file here
                                        </p>
                                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                            or click to browse
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Feedback */}
                    {feedback && (
                        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm animate-slide-up ${feedback.type === 'success'
                            ? isDarkMode
                                ? 'bg-green-900/30 text-green-400 border border-green-800'
                                : 'bg-green-50 text-green-700 border border-green-200'
                            : isDarkMode
                                ? 'bg-red-900/30 text-red-400 border border-red-800'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                            {feedback.type === 'success'
                                ? <CheckCircle2 size={18} className="shrink-0" />
                                : <AlertCircle size={18} className="shrink-0" />
                            }
                            <span>{feedback.message}</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'
                    }`}>
                    <button
                        onClick={handleClose}
                        disabled={uploading}
                        className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${isDarkMode
                            ? 'text-gray-300 hover:bg-gray-700'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!file || !selectedSite || uploading}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${!file || !selectedSite || uploading
                            ? isDarkMode
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-primary hover:bg-primary-600 text-white shadow-lg shadow-primary/25 active:scale-95'
                            }`}
                    >
                        {uploading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Uploading…
                            </>
                        ) : (
                            <>
                                <Upload size={16} />
                                Upload
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ImportModal
