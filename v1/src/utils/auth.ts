/**
 * Reads a cookie value by name.
 */
export function getToken(name: string): string | undefined {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
    if (match) return match[2]
    return undefined
}
