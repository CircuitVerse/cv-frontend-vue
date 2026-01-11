export interface TourStep {
    element: string
    className?: string
    popover: Popover
}

export interface Popover {
    className?: string
    title: string
    description: string
    position: 'top' | 'bottom' | 'left' | 'right'
    offset?: number
}

export interface DriverInstance {
    start(): void
    defineSteps(steps: TourStep[]): void
    highlight(options: {
        element: string
        popover: Popover
        showButtons?: boolean
    }): void 
    reset(clearHighlighted?: boolean): void
}
