export interface ThemeOptions {
    [key: string]: {
        [property: string]: string;
    };
}

interface Theme {
    [key: string]: string;
}

export interface Themes {
    [themeName: string]: Theme;
}