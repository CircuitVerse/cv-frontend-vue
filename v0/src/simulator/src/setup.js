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

// Debounce timer for resize events
let resizeTimeout = null

/**
 * to resize window and setup things it
 * sets up new width for the canvas variables.
 * Also redraws the grid.
 * @category setup
 */
export function resetup() {
    DPR = window.devicePixelRatio || 1
    if (lightMode) {
        DPR = 1
    }
    
    // Get DOM element references
    const simulationAreaEl = document.getElementById('simulationArea')
    if (!simulationAreaEl) return // Element not ready yet
    
    // Calculate dimensions - ensure we have valid measurements
    const newWidth = simulationAreaEl.clientWidth * DPR
    let newHeight
    if (!embed) {
        const toolbarEl = document.getElementById('toolbar')
        const toolbarHeight = toolbarEl?.clientHeight || 0
        newHeight = (document.body.clientHeight - toolbarHeight) * DPR
    } else {
        const simulationEl = document.getElementById('simulation')
        if (!simulationEl) return // Element not ready yet
        newHeight = simulationEl.clientHeight * DPR
    }
    
    // Validate dimensions
    if (newWidth <= 0 || newHeight <= 0) {
        // Dimensions not ready yet, schedule retry
        if (resizeTimeout) clearTimeout(resizeTimeout)
        resizeTimeout = setTimeout(resetup, 50)
        return
    }
    
    width = newWidth
    height = newHeight
    
    // Set DOM element styles first to ensure proper layout
    const backgroundAreaEl = document.getElementById('backgroundArea')
    const canvasAreaEl = document.getElementById('canvasArea')
    if (backgroundAreaEl) {
        backgroundAreaEl.style.height = height / DPR + 100 + 'px'
        backgroundAreaEl.style.width = width / DPR + 100 + 'px'
    }
    if (canvasAreaEl) {
        canvasAreaEl.style.height = height / DPR + 'px'
    }
    
    // Now set canvas dimensions before getting context
    // This ensures the context is initialized with correct dimensions
    if (simulationArea.canvas) {
        simulationArea.canvas.width = width
        simulationArea.canvas.height = height
    }
    if (backgroundArea.canvas) {
        backgroundArea.canvas.width = width + 100 * DPR
        backgroundArea.canvas.height = height + 100 * DPR
    }
    
    // Setup canvas contexts after dimensions are set
    backgroundArea.setup()
    simulationArea.setup()
    
    // Reset scale to force grid redraw
    simulationArea.prevScale = 0
    
    // Redraw grid
    dots(true, false, true) // Force redraw
    
    // Update plot area if not in embed mode
    if (!embed && plotArea.canvas) {
        // Only resize plotArea, don't call setup() which creates new intervals
        plotArea.resize()
    }
    
    // Force canvas update
    updateCanvasSet(true)
    update() // INEFFICIENT, needs to be deprecated
}

// Debounced resize handler
function handleResize() {
    if (resizeTimeout) clearTimeout(resizeTimeout)
    // Use requestAnimationFrame to ensure DOM has settled
    requestAnimationFrame(() => {
        resizeTimeout = setTimeout(resetup, 100) // 100ms debounce
    })
}

window.onresize = handleResize // listener
window.onorientationchange = handleResize // listener

// for mobiles
window.addEventListener('orientationchange', handleResize) // listener

/**
 * function to setup environment variables like projectId and DPR
 * @category setup
 */
function setupEnvironment() {
    setupModules()
    const projectId = generateId()
    window.projectId = projectId
    updateSimulationSet(true)
    // const DPR = window.devicePixelRatio || 1 // unused variable
    newCircuit('Main')
    window.data = {}
    resetup()
    setupCodeMirrorEnvironment()
}

/**
 * Fetches project data from API and loads it into the simulator.
 * @param {number} projectId The ID of the project to fetch data for
 * @category setup
 */
async function fetchProjectData(projectId) {
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
            const data = await response.json()
            const simulatorVersion = data.simulatorVersion  
            const projectName = data.name
            if(!simulatorVersion){                 
                window.location.href = `/simulator/edit/${projectName}`             
            }           
            if(simulatorVersion && simulatorVersion != "v0"){                 
                window.location.href = `/simulatorvue/edit/${projectName}?simver=${simulatorVersion}`             
            }
            await load(data)
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
async function loadProjectData() {
    window.logixProjectId = window.logixProjectId ?? 0
    if (window.logixProjectId !== 0) {
        $('.loadingIcon').fadeIn()
        await fetchProjectData(window.logixProjectId)
    } else if (localStorage.getItem('recover_login') && window.isUserLoggedIn) {
        // Restore unsaved data and save
        const data = JSON.parse(localStorage.getItem('recover_login'))
        await load(data)
        localStorage.removeItem('recover')
        localStorage.removeItem('recover_login')
        await save()
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
 */
function showTour() {
    if (!localStorage.tutorials_tour_done && !embed) {
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
export function setup() {
    setupEnvironment()
    if (!embed) {
        setupUI()
        startMainListeners()
    }
    // startListeners()
    loadProjectData()
    showTour()
}
