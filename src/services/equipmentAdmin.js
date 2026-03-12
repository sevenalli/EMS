/**
 * Equipment Administration Service
 * CRUD API for fleet inventory management
 *
 * Backend: Spring Boot at /api/admin/equipment
 */

const API_BASE = '/api/admin/equipment';

/**
 * Fetch the full equipment inventory list
 * @returns {Promise<Array>} Array of equipment objects
 */
export const getInventory = async () => {
    const response = await fetch(API_BASE);
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch inventory: ${response.status} – ${errorText}`);
    }
    return response.json();
};

/**
 * Download the blank Excel template as a file
 * Triggers a browser download via a temporary <a> element
 */
export const downloadTemplate = async () => {
    const response = await fetch(`${API_BASE}/template`);
    if (!response.ok) {
        throw new Error(`Failed to download template: ${response.status}`);
    }

    const blob = await response.blob();

    // Extract filename from Content-Disposition header, fallback to default
    const disposition = response.headers.get('Content-Disposition');
    let filename = 'equipment_template.xlsx';
    if (disposition) {
        const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) {
            filename = match[1].replace(/['"]/g, '');
        }
    }

    // Create a temporary link and trigger download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};

/**
 * Upload an Excel file for a given site/port
 * @param {File} file - The .xlsx file to upload
 * @param {string} siteName - The target site/port name
 * @returns {Promise<Object>} Server response
 */
export const uploadInventory = async (file, siteName) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('siteName', siteName);

    const response = await fetch(`${API_BASE}/import`, {
        method: 'POST',
        body: formData,
        // NOTE: Do NOT set Content-Type — browser will set multipart boundary automatically
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} – ${errorText}`);
    }
    return response.json();
};

/**
 * Update equipment details
 * @param {number|string} id - Equipment primary key
 * @param {Object} data - Fields to update (brand, model, capacity, commissionDate)
 * @returns {Promise<Object>} Updated equipment
 */
export const updateEquipment = async (id, data) => {
    const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Update failed: ${response.status} – ${errorText}`);
    }
    return response.json();
};

/**
 * Soft-delete equipment (sets isActive = false)
 * @param {number|string} id - Equipment primary key
 * @returns {Promise<void>}
 */
export const deleteEquipment = async (id) => {
    const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Delete failed: ${response.status} – ${errorText}`);
    }
};

export default {
    getInventory,
    downloadTemplate,
    uploadInventory,
    updateEquipment,
    deleteEquipment,
};
