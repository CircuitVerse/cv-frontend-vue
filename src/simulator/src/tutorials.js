import Driver from 'driver.js'
import i18n from '#/locales/i18n'

export const tour = [
    {
        element: '#guide_1',
        className: 'guide_1',
        popover: {
            className: '',
            title: i18n.global.t('simulator.tutorial_guide.circuit_elements_panel'), 
            description: i18n.global.t('simulator.tutorial_guide.circuit_elements_panel_desc'),
            position: 'right',
            offset: 160,
        },
    },
    {
        element: '.guide_2',
        popover: {
            title: i18n.global.t('simulator.tutorial_guide.properties_panel'),
            description: i18n.global.t('simulator.tutorial_guide.properties_panel_desc'),
            position: 'left',
            offset: 200,
        },
    },
    {
        element: '.quick-btn',
        popover: {
            title: i18n.global.t('simulator.tutorial_guide.quick_access_panel'),
            description: i18n.global.t('simulator.tutorial_guide.quick_access_panel_desc'),
            position: 'bottom',
            // offset: 750,
        },
    },
    // {
    //     element: '.forum-tab',
    //     popover: {
    //         className: "",
    //         title: 'Forum Tab',
    //         description: "The forums can help you report issues & bugs, feature requests, and discussing about circuits with the community!",
    //         position: 'right',
    //         // offset: -25,
    //     },
    // },
    {
        element: '#tabsBar',
        popover: {
            title: i18n.global.t('simulator.tutorial_guide.circuit_tabs'),
            description: i18n.global.t('simulator.tutorial_guide.circuit_tabs_desc'),
            position: 'bottom',
            offset: 250,
        },
    },
    {
        element: '.timing-diagram-panel',
        popover: {
            title: i18n.global.t('simulator.tutorial_guide.timing_diagram_panel'),
            description: i18n.global.t('simulator.tutorial_guide.timing_diagram_panel_desc'),
            position: 'bottom',
            offset: 0,
        },
    },
    {
        element: '.testbench-manual-panel',
        popover: {
            title: i18n.global.t('simulator.tutorial_guide.test_bench_panel'),
            description: i18n.global.t('simulator.tutorial_guide.test_bench_panel_desc'),
            position: 'right',
            offset: 0,
        },
    },

    // {
    //     element: '#delCirGuide',
    //     popover: {
    //         title: 'Delete sub-circuit button',
    //         description: "You can make delete sub-circuits by pressing the cross *Note that main circuit cannot be deleted.",
    //         position: 'right',
    //         // offset: 250,
    //     },
    // },
    {
        element: '.report-sidebar a',
        popover: {
            className: 'bug-guide',
            title: i18n.global.t('simulator.tutorial_guide.report_system'),
            description: i18n.global.t('simulator.tutorial_guide.report_system_desc'),
            position: 'left',
            offset: -105,
        },
    },
    {
        element: '.tour-help',
        popover: {
            className: 'tourHelpStep',
            title: i18n.global.t('simulator.tutorial_guide.restart_tutorial'),
            description: i18n.global.t('simulator.tutorial_guide.restart_tutorial_desc'),
            position: 'right',
            offset: 0,
        },
    },
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
