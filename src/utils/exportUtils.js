import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'

/**
 * Export Utilities
 * Functions for exporting data to CSV and PDF formats
 */

/**
 * Export data to CSV file
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Output filename (without extension)
 * @param {Object} options - Export options
 */
export function exportToCSV(data, filename = 'export', options = {}) {
    const {
        columns = null, // Column definitions: [{ key, label }]
        delimiter = ',',
        includeTimestamp = true
    } = options

    if (!data || data.length === 0) {
        console.warn('[exportToCSV] No data to export')
        return false
    }

    try {
        // Determine columns from first data item if not provided
        const cols = columns || Object.keys(data[0]).map(key => ({ key, label: formatLabel(key) }))

        // Build CSV content
        const rows = []

        // Header row
        rows.push(cols.map(col => escapeCSV(col.label)).join(delimiter))

        // Data rows
        data.forEach(item => {
            const row = cols.map(col => {
                const value = item[col.key]
                if (value === null || value === undefined) return ''
                if (typeof value === 'object') return escapeCSV(JSON.stringify(value))
                return escapeCSV(String(value))
            })
            rows.push(row.join(delimiter))
        })

        const csvContent = rows.join('\n')

        // Add timestamp to filename if requested
        const timestampStr = includeTimestamp ? `_${formatTimestamp(new Date())}` : ''
        const fullFilename = `${filename}${timestampStr}.csv`

        // Create and download file
        downloadFile(csvContent, fullFilename, 'text/csv;charset=utf-8;')

        return true
    } catch (error) {
        console.error('[exportToCSV] Error:', error)
        return false
    }
}

/**
 * Export data to PDF file
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Output filename (without extension)
 * @param {Object} options - Export options
 */
export function exportToPDF(data, filename = 'report', options = {}) {
    const {
        title = 'Export Report',
        subtitle = null,
        columns = null,
        orientation = 'landscape', // 'portrait' or 'landscape'
        includeTimestamp = true,
        headerColor = [59, 130, 246], // Blue
        alternateRowColor = [245, 247, 250]
    } = options

    if (!data || data.length === 0) {
        console.warn('[exportToPDF] No data to export')
        return false
    }

    try {
        // Create PDF document
        const doc = new jsPDF({
            orientation,
            unit: 'mm',
            format: 'a4'
        })

        // Page dimensions
        const pageWidth = doc.internal.pageSize.getWidth()
        const margin = 15

        // Title
        doc.setFontSize(18)
        doc.setTextColor(31, 41, 55)
        doc.text(title, margin, 20)

        // Subtitle / timestamp
        doc.setFontSize(10)
        doc.setTextColor(107, 114, 128)
        const subtitleText = subtitle || `Generated: ${new Date().toLocaleString()}`
        doc.text(subtitleText, margin, 28)

        // Determine columns
        const cols = columns || Object.keys(data[0]).map(key => ({ key, label: formatLabel(key) }))

        // Prepare table data
        const tableColumns = cols.map(col => col.label)
        const tableRows = data.map(item =>
            cols.map(col => {
                const value = item[col.key]
                if (value === null || value === undefined) return ''
                if (typeof value === 'boolean') return value ? 'Yes' : 'No'
                if (typeof value === 'number') return value.toFixed(2)
                if (value instanceof Date) return value.toLocaleString()
                return String(value)
            })
        )

        // Add table
        doc.autoTable({
            head: [tableColumns],
            body: tableRows,
            startY: 35,
            margin: { left: margin, right: margin },
            styles: {
                fontSize: 8,
                cellPadding: 3
            },
            headStyles: {
                fillColor: headerColor,
                textColor: 255,
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: alternateRowColor
            },
            didDrawPage: (data) => {
                // Footer with page number
                const pageCount = doc.internal.getNumberOfPages()
                doc.setFontSize(8)
                doc.setTextColor(156, 163, 175)
                doc.text(
                    `Page ${data.pageNumber} of ${pageCount}`,
                    pageWidth / 2,
                    doc.internal.pageSize.getHeight() - 10,
                    { align: 'center' }
                )
            }
        })

        // Save file
        const timestampStr = includeTimestamp ? `_${formatTimestamp(new Date())}` : ''
        doc.save(`${filename}${timestampStr}.pdf`)

        return true
    } catch (error) {
        console.error('[exportToPDF] Error:', error)
        return false
    }
}

/**
 * Export data to Excel (.xlsx) file
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Output filename (without extension)
 * @param {Object} options - Export options
 */
export function exportToExcel(data, filename = 'export', options = {}) {
    const {
        columns = null,
        sheetName = 'Sheet1',
        includeTimestamp = true
    } = options

    if (!data || data.length === 0) {
        console.warn('[exportToExcel] No data to export')
        return false
    }

    try {
        // Determine columns from first data item if not provided
        const cols = columns || Object.keys(data[0]).map(key => ({ key, label: formatLabel(key) }))

        // Prepare sheet data
        const sheetData = [
            // Header row
            cols.map(col => col.label),
            // Data rows
            ...data.map(item =>
                cols.map(col => {
                    const value = item[col.key]
                    if (value === null || value === undefined) return ''
                    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
                    if (typeof value === 'number') return value
                    if (value instanceof Date) return value.toLocaleString()
                    return String(value)
                })
            )
        ]

        // Create worksheet
        const worksheet = XLSX.utils.aoa_to_sheet(sheetData)

        // Set column widths safely
        const colWidths = cols.map(col =>
            Math.max(col.label.length + 2, 15)
        )
        worksheet['!cols'] = colWidths.map(wch => ({ wch }))

        // Create workbook
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

        // Generate filename with optional timestamp
        const timestampStr = includeTimestamp ? `_${formatTimestamp(new Date())}` : ''
        const fullFilename = `${filename}${timestampStr}.xlsx`

        // Save file
        XLSX.writeFile(workbook, fullFilename)

        return true
    } catch (error) {
        console.error('[exportToExcel] Error:', error)
        return false
    }
}

/**
 * Export telemetry data with equipment context
 */
export function exportTelemetryData(telemetryHistory, equipmentId, options = {}) {
    const { format = 'csv', timeRange = '1h' } = options

    // Prepare data with equipment context
    const data = telemetryHistory.map(frame => ({
        timestamp: frame.timestamp?.toISOString() || frame.ts,
        equipmentId,
        ...frame.data
    }))

    const filename = `telemetry_${equipmentId}_${timeRange}`
    const title = `Telemetry Report - ${equipmentId}`
    const subtitle = `Time Range: ${timeRange} | Exported: ${new Date().toLocaleString()}`

    if (format === 'pdf') {
        return exportToPDF(data, filename, { title, subtitle, ...options })
    } else {
        return exportToCSV(data, filename, options)
    }
}

/**
 * Export a single telemetry snapshot
 * Formats data as vertical rows: Parameter, Value, Unit
 */
export function exportTelemetrySnapshot(telemetry, equipmentId, options = {}) {
    const { format = 'csv', columns = [] } = options

    if (!columns || columns.length === 0) {
        console.warn('[exportTelemetrySnapshot] No columns provided')
        return false
    }

    // Build data rows from telemetry object
    const data = columns
        .filter(col => col && col.key) // Ensure column has key
        .map(col => {
            const value = telemetry[col.key]
            return {
                'Parameter': col.label || col.key,
                'Value': value !== undefined && value !== null
                    ? (typeof value === 'number'
                        ? value.toFixed(2)
                        : String(value))
                    : '–',
                'Unit': col.unit || '—'
            }
        })

    console.log(`[exportTelemetrySnapshot] Exporting ${data.length} parameters in ${format}`)

    const timestamp = new Date().toLocaleString()
    const filename = `telemetry_snapshot_${equipmentId}`
    const title = `Telemetry Snapshot - ${equipmentId}`
    const subtitle = `Equipment: ${equipmentId} | ${timestamp}`

    try {
        if (format === 'pdf') {
            // Use jsPDF directly without autoTable for reliability
            const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

            const pageWidth = doc.internal.pageSize.getWidth()
            const margin = 15
            let yPos = 20

            // Title
            doc.setFontSize(16)
            doc.setTextColor(31, 41, 55)
            doc.text(title, margin, yPos)
            yPos += 10

            // Subtitle
            doc.setFontSize(10)
            doc.setTextColor(107, 114, 128)
            doc.text(subtitle, margin, yPos)
            yPos += 15

            // Column widths (landscape A4: 297mm width)
            const colWidths = {
                parameter: 120,
                value: 60,
                unit: 40
            }
            const colX = {
                parameter: margin,
                value: margin + colWidths.parameter,
                unit: margin + colWidths.parameter + colWidths.value
            }

            // Table headers
            doc.setFontSize(11)
            doc.setTextColor(255, 255, 255)
            doc.setFillColor(59, 130, 246)
            const headerHeight = 10
            doc.rect(margin, yPos - 5, pageWidth - 2 * margin, headerHeight, 'F')
            doc.text('Parameter', colX.parameter + 2, yPos + 2)
            doc.text('Value', colX.value + 2, yPos + 2)
            doc.text('Unit', colX.unit + 2, yPos + 2)
            yPos += headerHeight

            // Data rows
            doc.setFontSize(9)
            doc.setTextColor(0, 0, 0)
            const rowHeight = 6
            data.forEach((row, index) => {
                if (yPos > 180) {
                    doc.addPage()
                    yPos = 20
                }
                // Alternating row colors
                if (index % 2 === 0) {
                    doc.setFillColor(240, 245, 250)
                    doc.rect(margin, yPos - 4, pageWidth - 2 * margin, rowHeight, 'F')
                }
                doc.setTextColor(0, 0, 0)
                // Use splitTextToSize for long parameters
                const paramLines = doc.splitTextToSize(row.Parameter, colWidths.parameter - 3)
                doc.text(paramLines, colX.parameter + 2, yPos)
                doc.text(row.Value, colX.value + 2, yPos)
                doc.text(row.Unit, colX.unit + 2, yPos)
                yPos += rowHeight
            })

            doc.save(`${filename}_${formatTimestamp(new Date())}.pdf`)
            return true
        } else if (format === 'xlsx') {
            return exportToExcel(data, filename, {
                sheetName: `${equipmentId}`,
                ...options
            })
        } else {
            // CSV
            return exportToCSV(data, filename, {
                ...options
            })
        }
    } catch (error) {
        console.error('[exportTelemetrySnapshot] Error:', error)
        return false
    }
}

/**
 * Export notifications data
 */
export function exportNotifications(notifications, options = {}) {
    const { format = 'csv' } = options

    const data = notifications.map(n => ({
        timestamp: n.timestamp?.toISOString() || n.timestamp,
        type: n.type,
        category: n.category,
        message: n.message,
        tagName: n.tagName,
        isActive: n.isActive,
        isRead: n.isRead
    }))

    const filename = 'notifications'
    const title = 'Notifications Report'

    if (format === 'pdf') {
        return exportToPDF(data, filename, { title, ...options })
    } else {
        return exportToCSV(data, filename, options)
    }
}

// Helper: Format camelCase/snake_case to Title Case
function formatLabel(key) {
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .replace(/^./, str => str.toUpperCase())
        .trim()
}

// Helper: Escape CSV values
function escapeCSV(value) {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`
    }
    return value
}

// Helper: Format timestamp for filename
function formatTimestamp(date) {
    return date.toISOString().slice(0, 19).replace(/[T:]/g, '-')
}

// Helper: Download file in browser
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

export default {
    exportToCSV,
    exportToPDF,
    exportToExcel,
    exportTelemetryData,
    exportTelemetrySnapshot,
    exportNotifications
}
