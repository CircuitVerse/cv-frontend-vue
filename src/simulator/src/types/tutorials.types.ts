export interface Popover {
    className?: string
    title: string
    description: string
    position: 'top' | 'bottom' | 'left' | 'right'
    offset?: number
}

export interface TourStep {
    element: string
    className?: string
    popover: Popover
}

export interface DriverInstance {
    highlight: (options: {
        element: string
        showButtons: boolean
        popover: Popover
    }) => void
    defineSteps: (steps: TourStep[]) => void
    start: () => void
    reset: (clearHighlighted?: boolean) => void
}
