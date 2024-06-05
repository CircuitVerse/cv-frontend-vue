import Driver from 'driver.js'
import i18n from '#/locales/i18n'

function createTourStep(element, titleKey, descKey, position, offset = 0) {
    return {
        element,
        popover: {
            title: i18n.global.t(titleKey),
            description: i18n.global.t(descKey),
            position,
            offset,
        },
    };
}

export const tour = [
    createTourStep('#guide_1', 'simulator.tutorial_guide.circuit_elements_panel', 'simulator.tutorial_guide.circuit_elements_panel_desc', 'right', 160),
    createTourStep('.guide_2', 'simulator.tutorial_guide.properties_panel', 'simulator.tutorial_guide.properties_panel_desc', 'left', 200),
    createTourStep('.quick-btn', 'simulator.tutorial_guide.quick_access_panel', 'simulator.tutorial_guide.quick_access_panel_desc', 'bottom'),
    createTourStep('#tabsBar', 'simulator.tutorial_guide.circuit_tabs', 'simulator.tutorial_guide.circuit_tabs_desc', 'bottom', 250),
    createTourStep('.timing-diagram-panel', 'simulator.tutorial_guide.timing_diagram_panel', 'simulator.tutorial_guide.timing_diagram_panel_desc', 'bottom'),
    createTourStep('.testbench-manual-panel', 'simulator.tutorial_guide.test_bench_panel', 'simulator.tutorial_guide.test_bench_panel_desc', 'right'),
    createTourStep('.report-sidebar a', 'simulator.tutorial_guide.report_system', 'simulator.tutorial_guide.report_system_desc', 'left', -105),
    createTourStep('.tour-help', 'simulator.tutorial_guide.restart_tutorial', 'simulator.tutorial_guide.restart_tutorial_desc', 'right'),
]

// Not used currently
export const tutorialWrapper = () => {
    const panelHighlight = new Driver()
    document.querySelector('.panelHeader').addEventListener('click', (e) => {
        if (localStorage.tutorials === 'next') {
            panelHighlight.highlight({
                element: '#guide_1',
                showButtons: false,
                popover: {
                    title: 'Here are the elements',
                    description:
                        'Select any element by clicking on it & then click anywhere on the grid to place the element.',
                    position: 'right',
                    offset:
                        e.target.nextElementSibling.offsetHeight +
                        e.target.offsetTop -
                        45,
                },
            })
            localStorage.setItem('tutorials', 'done')
        }
    }, {
        once: true,
      })
    document.querySelector('.icon').addEventListener('click', () => {
        panelHighlight.reset(true)
    })
}

const animatedTourDriver = new Driver({
    animate: true,
    opacity: 0.8,
    padding: 5,
    showButtons: true,
})

export function showTourGuide() {
    document.querySelector('.draggable-panel .maximize').click();
    animatedTourDriver.defineSteps(tour)
    animatedTourDriver.start()
    localStorage.setItem('tutorials_tour_done', true)
}

export default showTourGuide
