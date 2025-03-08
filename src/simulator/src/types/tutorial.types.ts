export interface TourStep {
    element: string;
    className?: string;
    popover: {
        className?: string;
        title: string;
        description: string;
        position: 'left' | 'right' | 'top' | 'bottom';
        offset?: number;
    };
}