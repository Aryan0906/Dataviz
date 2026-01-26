/**
 * Debounce utility function to limit how often a function can be called
 * @param func - The function to debounce
 * @param wait - The delay in milliseconds
 * @returns Debounced function
 */
export function debounce(
    func,
    wait
) {
    let timeout = null;

    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            func(...args);
        };

        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(later, wait);
    };
}
