/**
 * Debounce function to limit the rate at which a function can fire.
 * @param {Function} func - The function to debounce.
 * @param {number} wait - The delay in milliseconds.
 * @returns {Function} - The debounced function.
 */
export function debounce(func: Function, wait: number) {
    let timeout: number | null = null
    return (...args: any[]) => {
        if (timeout !== null) {
            clearTimeout(timeout)
        }
        timeout = window.setTimeout(() => {
            func(...args)
        }, wait)
    }
}
