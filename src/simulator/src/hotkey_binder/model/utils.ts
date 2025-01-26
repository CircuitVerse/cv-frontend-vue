// Extend Storage interface to add type-safe set and get methods
interface Storage {
    set<T>(key: string, obj: T): void;
    get<T>(key: string): T | null;
}

// Add type-safe set method to Storage prototype
Storage.prototype.set = function(key: string, obj: any): void {
    this.setItem(key, JSON.stringify(obj));
}

// Add type-safe get method to Storage prototype
Storage.prototype.get = function(key: string): any {
    const item = this.getItem(key);
    return item ? JSON.parse(item) : null;
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
        // Use modern API with fallback
    if (navigator.platform) {
        const platform = navigator.platform.toLowerCase();
        if (platform.includes('windows')) return 'Windows';
        if (platform.includes('mac')) return 'MacOS';
        if (platform.includes('linux')) return 'Linux';
    }
    // Fallback to platform
    const platform = navigator.platform.toLowerCase();
    if (navigator.userAgent.includes('win')) return 'Windows';
    if (navigator.userAgent.includes('mac')) return 'MacOS';
    if (navigator.userAgent.includes('x11')) return 'UNIX';
    if (navigator.userAgent.includes('linux')) return 'Linux';
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