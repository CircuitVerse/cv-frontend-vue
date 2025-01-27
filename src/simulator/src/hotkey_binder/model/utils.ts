// Extend Storage interface to add type-safe set and get methods
interface Storage {
    set<T>(key: string, obj: T): void;
    get<T>(key: string): T | null;
}

// Add type-safe set method to Storage prototype
Storage.prototype.set = function<T>(key: string, obj: T): void {
    this.setItem(key, JSON.stringify(obj));
}

// Add type-safe get method to Storage prototype
Storage.prototype.get = function<T>(key: string): T | null {
    const item = this.getItem(key);
    if (!item) return null;
    try {
        return JSON.parse(item) as T;
    } catch (e) {
        console.error(`Failed to parse stored item ${key}:`, e);
        return null;
    }

}

// Type-safe object size function
export function objectSize(obj: Record<string, any>): number {
    return Object.keys(obj).length;
}

// Find key by value in an object
export function getKey<T extends Record<string, any>>(obj: T, val: any): string | undefined {
    return Object.keys(obj).find(key => obj[key] === val);
}


// Detect operating system
export function getOS(): string {
    const platform = navigator.platform.toLowerCase();
    const userAgent = navigator.userAgent.toLowerCase();

    const osMap: Record<string, string> = {
        windows: 'Windows',
        mac: 'MacOS',
        linux: 'Linux',
        x11: 'UNIX',
    };

    // Helper function to find OS based on a string (platform or userAgent)
    const findOS = (str: string): string | undefined => {
        for (const [key, value] of Object.entries(osMap)) {
            if (str.includes(key)) {
                return value;
            }
        }
        return undefined;
    };

    // Check platform first
    const osFromPlatform = findOS(platform);
    if (osFromPlatform) {
        return osFromPlatform;
    }

    // Fallback to user agent
    const osFromUserAgent = findOS(userAgent);
    if (osFromUserAgent) {
        return osFromUserAgent;
    }

    // Default return if no match is found
    return '';
}
// Check for restricted key combinations
export function checkRestricted(key: string): boolean {
    const restrictedKeys: string[] = [
        'Ctrl + N', 'Ctrl + W', 'Ctrl + T', 'Ctrl + C', 'Ctrl + V',
        'Ctrl + Delete', 'Ctrl + Backspace', 'Ctrl + /', 'Ctrl + \\',
        'Ctrl + ]', "Ctrl + '", 'Ctrl + `', 'Ctrl + [', 'Ctrl + ~',
        'Ctrl + Num1', 'Ctrl + Num2', 'Ctrl + Num3', 'Ctrl + Num4',
        'Ctrl + Num5', 'Ctrl + Num6', 'Ctrl + Num*', 'Ctrl + Num/',
        'Ctrl + Num.', 'Ctrl + Num0'
    ];

    // Adjust for MacOS if needed
    const modifiedKeys = getOS() === 'MacOS' 
        ? restrictedKeys.map(value => 
            value.startsWith('Ctrl') 
                ? value.replace('Ctrl', 'Meta') 
                : value
          )
        : restrictedKeys;

    return modifiedKeys.includes(key);
}