/**
 * Standardizes date values into DD-MM-YYYY format across the application.
 * Accepts ISO strings (e.g., '2026-08-03T15:00:00Z'), YYYY-MM-DD strings, or Date objects.
 */
export function formatDate(dateVal) {
  if (!dateVal) return ''
  try {
    let dateObj
    if (typeof dateVal === 'string') {
      const cleanStr = dateVal.split('T')[0]
      const parts = cleanStr.split('-')
      if (parts.length === 3 && parts[0].length === 4) {
        const year = parseInt(parts[0], 10)
        const month = parseInt(parts[1], 10) - 1
        const day = parseInt(parts[2], 10)
        dateObj = new Date(year, month, day)
      } else {
        dateObj = new Date(dateVal)
      }
    } else {
      dateObj = new Date(dateVal)
    }

    if (isNaN(dateObj.getTime())) return String(dateVal)

    const day = String(dateObj.getDate()).padStart(2, '0')
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const year = dateObj.getFullYear()

    return `${day}-${month}-${year}`
  } catch {
    return String(dateVal)
  }
}

/**
 * Standardizes currency values into ₹ (Indian Rupee) format.
 * Example: formatCurrency(300) -> '₹300.00'
 */
export function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0.00'
  return `₹${parseFloat(amount).toFixed(2)}`
}
