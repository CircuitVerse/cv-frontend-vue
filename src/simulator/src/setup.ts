/* eslint-disable import/no-cycle */
/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */
import { generateId, showMessage } from './utils'
import { backgroundArea } from './backgroundArea'
import plotArea from './plotArea'
import { simulationArea } from './simulationArea'
import { dots } from './canvasApi'
import { update, updateSimulationSet, updateCanvasSet } from './engine'
import { setupUI } from './ux'
import startMainListeners from './listeners'
import { newCircuit } from './circuit'
import load from './data/load'
import save from './data/save'
import { showTourGuide } from './tutorials'
import setupModules from './moduleSetup'
import 'codemirror/lib/codemirror.css'
import 'codemirror/addon/hint/show-hint.css'
import 'codemirror/mode/javascript/javascript' // verilog.js from codemirror is not working because array prototype is changed.
import 'codemirror/addon/edit/closebrackets'
import 'codemirror/addon/hint/anyword-hint'
import 'codemirror/addon/hint/show-hint'
import { setupCodeMirrorEnvironment } from './Verilog2CV'
import '../vendor/jquery-ui.min.css'
import '../vendor/jquery-ui.min'
import { confirmSingleOption } from '#/components/helpers/confirmComponent/ConfirmComponent.vue'
import { getToken } from '#/pages/simulatorHandler.vue'
import { ProjectData } from './types/setup.types'

interface PlotArea {
    setup: () => void
}

/**
 * to resize window and setup things it
 * sets up new width for the canvas variables.
 * Also redraws the grid.
 * @category setup
 */
export function resetup(): void {
    window.DPR = window.devicePixelRatio || 1
    if (window.lightMode) {
        window.DPR = 1
    }
    const simulationAreaElement = document.getElementById('simulationArea')
    if (!simulationAreaElement) {
        throw new Error('simulationArea element not found')
    }
    window.width = simulationAreaElement.clientWidth * window.DPR
    if (!window.embed) {
        const toolbar = document.getElementById('toolbar')
        window.height =
            (document.body.clientHeight - (toolbar?.clientHeight || 0)) *
            window.DPR
    } else {
        const simulationElement = document.getElementById('simulation')
        if (!simulationElement) {
            throw new Error('simulation element not found')
        }
        window.height = simulationElement.clientHeight * window.DPR
    }
    // setup simulationArea and backgroundArea variables used to make changes to canvas.
    backgroundArea.setup()
    simulationArea.setup()
    // redraw grid
    dots()
    const bgArea = document.getElementById('backgroundArea')
    const canvasArea = document.getElementById('canvasArea')

    if (bgArea) {
        bgArea.style.height = window.height / window.DPR + 100 + 'px'
        bgArea.style.width = window.width / window.DPR + 100 + 'px'
    }

    if (canvasArea) {
        canvasArea.style.height = window.height / window.DPR + 'px'
    }

    simulationArea.canvas.width = window.width
    simulationArea.canvas.height = window.height

    if (backgroundArea.canvas) {
        backgroundArea.canvas.width = window.width + 100 * window.DPR
        backgroundArea.canvas.height = window.height + 100 * window.DPR
    }

    if (!window.embed) {
        ;(plotArea as PlotArea).setup()
    }
    updateCanvasSet(true)
    update() // INEFFICIENT, needs to be deprecated
    simulationArea.prevScale = 0
    dots()
}

window.onresize = resetup // listener
window.onorientationchange = resetup // listener

// for mobiles
window.addEventListener('orientationchange', resetup) // listener

/**
 * Function to setup environment variables like projectId and DPR
 * @category setup
 * @export
 */
export function setupEnvironment(): void {
    setupModules()
    const projectId = generateId()
    window.projectId = projectId
    updateSimulationSet(true)
    // const DPR = window.devicePixelRatio || 1 // unused variable
    newCircuit('Main', undefined, false, false)
    window.data = {}
    resetup()
    setupCodeMirrorEnvironment()
}

/**
 * Fetches project data from API and loads it into the simulator.
 * @param {number} projectId The ID of the project to fetch data for
 * @category setup
 */
export async function fetchProjectData(projectId: number): Promise<void> {
    try {
        const response = await fetch(
            `/api/v1/projects/${projectId}/circuit_data`,
            {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    Authorization: `Token ${getToken('cvt')}`,
                },
            }
        )
        if (response.ok) {
            const data: ProjectData = await response.json()
            const simulatorVersion = data.simulatorVersion
            const projectName = data.name
            const safeName = encodeURIComponent(projectName ?? '')

            if (!simulatorVersion) {
                window.location.assign(`/simulator/edit/${safeName}`)
                return
            }

            if (simulatorVersion !== 'v0') {
                window.location.assign(
                    `/simulatorvue/edit/${safeName}?simver=${encodeURIComponent(
                        simulatorVersion
                    )}`
                )
                return
            }

            await load(data as any)
            await simulationArea.changeClockTime(data.timePeriod || 500)
            $('.loadingIcon').fadeOut()
        } else {
            throw new Error('API call failed')
        }
    } catch (error) {
        console.error(error)
        confirmSingleOption('Error: Could not load.')
        $('.loadingIcon').fadeOut()
    }
}

/**
 * Load project data immediately when available.
 * Improvement to eliminate delay caused by setTimeout in previous implementation revert if issues arise.
 * @category setup
 */
export async function loadProjectData(): Promise<void> {
    window.logixProjectId = window.logixProjectId ?? 0
    if (window.logixProjectId !== 0) {
        $('.loadingIcon').fadeIn()
        try {
            await fetchProjectData(window.logixProjectId)
        } catch (error) {
            console.error('Failed to load project data:', error)
            $('.loadingIcon').fadeOut()
            showMessage('Failed to load project. Please try again.')
        }
    } else if (localStorage.getItem('recover_login') && window.isUserLoggedIn) {
        // Restore unsaved data and save
        try {
            const item = localStorage.getItem('recover_login')
            if (item) {
                const data = JSON.parse(item) as unknown as ProjectData
                await load(data as any)
                localStorage.removeItem('recover')
                localStorage.removeItem('recover_login')
                await save()
            }
        } catch (error) {
            console.error('Failed to recover project data:', error)
            showMessage(
                'Failed to recover project data. The saved data may be corrupted.'
            )
        }
    } else if (localStorage.getItem('recover')) {
        // Restore unsaved data which didn't get saved due to error
        showMessage(
            "We have detected that you did not save your last work. Don't worry we have recovered them. Access them using Project->Recover"
        )
    }
}

/**
 * Show tour guide if it hasn't been completed yet.
 * The tour is shown after a delay of 2 seconds.
 * @category setup
 * @export
 */
export function showTour(): void {
    if (!localStorage.getItem('tutorials_tour_done') && !window.embed) {
        setTimeout(() => {
            showTourGuide()
        }, 2000)
    }
}

/**
 * The first function to be called to setup the whole simulator.
 * This function sets up the simulator environment, the UI, the listeners,
 * loads the project data, and shows the tour guide.
 * @category setup
 */
export function setup(): void {
    setupEnvironment()
    if (!embed) {
        setupUI()
        startMainListeners()
    }
    // startListeners()
    loadProjectData()
    showTour()
}
