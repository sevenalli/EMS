import { useState, useEffect } from 'react'
import { X, Save, Loader2, Lock, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useStore } from '../../store/store'
import { updateEquipment } from '../../services/equipmentAdmin'

const EditModal = ({ isOpen, onClose, equipment, onSuccess }) => {
    const isDarkMode = useStore((s) => s.isDarkMode)
    const [form, setForm] = useState({ brand: '', model: '', capacity: '', commissionDate: '' })
    const [saving, setSaving] = useState(false)
    const [feedback, setFeedback] = useState(null)
    const [errors, setErrors] = useState({})

    // Populate form when equipment changes
    useEffect(() => {
        if (equipment) {
            setForm({
                brand: equipment.brand || '',
                model: equipment.model || '',
                capacity: equipment.capacity ?? '',
                commissionDate: equipment.commissionDate
                    ? equipment.commissionDate.substring(0, 10)
                    : '',
            })
            setErrors({})
            setFeedback(null)
        }
    }, [equipment])

    const validate = () => {
        const errs = {}
        if (form.capacity !== '' && isNaN(Number(form.capacity))) {
            errs.capacity = 'Capacity must be a number'
        }
        setErrors(errs)
        return Object.keys(errs).length === 0
    }

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }))
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }))
        }
    }

    const handleSave = async () => {
        if (!validate()) return
        setSaving(true)
        setFeedback(null)

        try {
            const payload = {
                ...form,
                capacity: form.capacity !== '' ? Number(form.capacity) : null,
            }
            await updateEquipment(equipment.equipmentId, payload)
            setFeedback({ type: 'success', message: 'Equipment updated successfully!' })
            setTimeout(() => {
                onClose()
                onSuccess?.()
            }, 1200)
        } catch (err) {
            setFeedback({ type: 'error', message: err.message || 'Update failed.' })
        } finally {
            setSaving(false)
        }
    }

    if (!isOpen || !equipment) return null

    const inputClass = (hasError) =>
        `w-full px-4 py-3 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${hasError
            ? 'border-red-500 focus:ring-red-500/50'
            : isDarkMode
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400'
        }`

    const readOnlyClass = `w-full px-4 py-3 rounded-xl border text-sm cursor-not-allowed ${isDarkMode
        ? 'bg-gray-700/50 border-gray-600 text-gray-400'
        : 'bg-gray-100 border-gray-200 text-gray-500'
        }`

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
                onClick={() => !saving && onClose()}
            />

            {/* Modal */}
            <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl animate-scale-in transition-colors ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
                }`}>
                {/* Header */}
                <div className={`flex items-center justify-between px-6 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'
                    }`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-amber-900/50' : 'bg-amber-50'
                            }`}>
                            <Save className="text-amber-500" size={20} />
                        </div>
                        <div>
                            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                Edit Equipment
                            </h2>
                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Modify equipment details
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => !saving && onClose()}
                        className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                            }`}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    {/* Read-only fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={`flex items-center gap-1.5 text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                <Lock size={12} /> Equipment Code
                            </label>
                            <input
                                type="text"
                                value={equipment.equipmentId || ''}
                                readOnly
                                className={readOnlyClass}
                            />
                        </div>
                        <div>
                            <label className={`flex items-center gap-1.5 text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                <Lock size={12} /> Site
                            </label>
                            <input
                                type="text"
                                value={equipment.siteName || equipment.site || ''}
                                readOnly
                                className={readOnlyClass}
                            />
                        </div>
                    </div>

                    {/* Editable fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Brand
                            </label>
                            <input
                                type="text"
                                value={form.brand}
                                onChange={(e) => handleChange('brand', e.target.value)}
                                placeholder="e.g. Liebherr"
                                disabled={saving}
                                className={inputClass(false)}
                            />
                        </div>
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Model
                            </label>
                            <input
                                type="text"
                                value={form.model}
                                onChange={(e) => handleChange('model', e.target.value)}
                                placeholder="e.g. LHM 550"
                                disabled={saving}
                                className={inputClass(false)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Capacity
                            </label>
                            <input
                                type="text"
                                value={form.capacity}
                                onChange={(e) => handleChange('capacity', e.target.value)}
                                placeholder="e.g. 144"
                                disabled={saving}
                                className={inputClass(errors.capacity)}
                            />
                            {errors.capacity && (
                                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                    <AlertCircle size={12} /> {errors.capacity}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Commission Date
                            </label>
                            <input
                                type="date"
                                value={form.commissionDate}
                                onChange={(e) => handleChange('commissionDate', e.target.value)}
                                disabled={saving}
                                className={inputClass(false)}
                            />
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
                        onClick={() => !saving && onClose()}
                        disabled={saving}
                        className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${isDarkMode
                            ? 'text-gray-300 hover:bg-gray-700'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${saving
                            ? isDarkMode
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-primary hover:bg-primary-600 text-white shadow-lg shadow-primary/25 active:scale-95'
                            }`}
                    >
                        {saving ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Saving…
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default EditModal
