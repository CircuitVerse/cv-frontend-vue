import Driver from 'driver.js'
/**
 * Defines the steps used by the Driver.js tutorial tour.
 * Each step highlights a UI element and displays contextual guidance.
 */

export const tour: (Driver.Step & { className?: string })[] = [
    {
        element: '#guide_1',
        className: 'guide_1',
        popover: {
            className: '',
            title: 'Circuit Elements panel',
            description:
                'This is where you can find all the circuit elements that are offered to build amazing circuits.',
            position: 'right',
            offset: 160,
        },
    },
    {
        element: '.guide_2',
        popover: {
            title: 'Properties Panel',
            description:
                'This panel lets you change element properties as they are selected. When no elements are selected, the panel displays project properties.',
            position: 'left',
            offset: 200,
        },
    },
    {
        element: '.quick-btn',
        popover: {
            title: 'Quick Access Panel',
            description:
                'This movable panel offers to perform some actions like Save Online, Open, Download quickly. Hover over the icons and see for yourself',
            position: 'bottom',
            // offset: 750,
        },
    },
    {
        element: '#tabsBar',
        popover: {
            title: 'Circuit Tabs',
            description:
                'This section displays all the circuits you have in your project. You can easily add and delete circuits.',
            position: 'bottom',
            offset: 250,
        },
    },
    {
        element: '.timing-diagram-panel',
        popover: {
            title: 'Timing Diagram Panel (Waveform)',
            description:
                'This panel displays the waveform created by circuits and can be used for resolving race conditions and debugging circuits.',
            position: 'bottom',
            offset: 0,
        },
    },
    {
        element: '.report-sidebar a',
        popover: {
            className: 'bug-guide',
            title: 'Report System',
            description:
                'You can report any issues/bugs you face through this issue reporting button there and then quickly.',
            position: 'left',
            offset: -105,
        },
    },
    {
        element: '.tour-help',
        popover: {
            className: 'tourHelpStep',
            title: 'Restart tutorial anytime',
            description:
                'You can restart this tutorial anytime by clicking on "Tutorial Guide" under this dropdown.',
            position: 'right',
            offset: 0,
        },
    },
    {
        element: '.testbench-manual-panel',
        popover: {
            title: 'Test Bench Panel',
            description: 'This panel helps you test your circuit correctness by observing how your circuit responds under different test cases, ensuring a thorough and effective validation process.',
            position: 'right',
            offset: 0,
        },
    },
]

// Not used currently

/**
 * Initializes a one-time tutorial highlight for the circuit elements panel.
 * Currently unused but retained for future onboarding flows.
 */
export const tutorialWrapper = (): void => {
    const panelHighlight = new Driver()
    const panelHeaderEl = document.querySelector('.panelHeader')
    if (!panelHeaderEl) return
    panelHeaderEl.addEventListener('click', (e: Event) => {
        if (localStorage.getItem('tutorials') === 'next') {
            const target = e.target
            if (!(target instanceof HTMLElement)) return
            const sibling = target.nextElementSibling as HTMLElement | null
            const siblingHeight = sibling ? sibling.offsetHeight : 0
            type StepWithButtons = Driver.Step & { showButtons?: boolean }
            const step: StepWithButtons = {
                element: '#guide_1',
                showButtons: false,
                popover: {
                    title: 'Here are the elements',
                    description:
                        'Select any element by clicking on it & then click anywhere on the grid to place the element.',
                    position: 'right',
                    offset:
                        siblingHeight + target.offsetTop - 45,
                },
            }
            panelHighlight.highlight(step as Driver.Step)
            localStorage.setItem('tutorials', 'done')
        }
    }, {
        once: true,
      })
    const iconEl = document.querySelector('.icon')
    if (iconEl) {
        iconEl.addEventListener('click', () => {
            panelHighlight.reset(true)
        })
    }
}
const animatedTourDriver = new Driver({
    animate: true,
    opacity: 0.8,
    padding: 5,
    showButtons: true,
})

/**
 * Launches the interactive tutorial tour for the simulator UI.
 */
export function showTourGuide(): void {
    const maximizeButton = document.querySelector('.draggable-panel .maximize') as HTMLElement | null
    if (maximizeButton) {
        maximizeButton.click()
    }
    animatedTourDriver.defineSteps(tour)
    animatedTourDriver.start()
    localStorage.setItem('tutorials_tour_done', 'true')
}

export default showTourGuide
