/* eslint-disable no-shadow */
/* eslint-disable no-negated-condition */
/* eslint-disable no-alert */
/* eslint-disable new-cap */
/* eslint-disable no-undef */
/* eslint-disable eqeqeq */
/* eslint-disable prefer-template */
/* eslint-disable no-param-reassign */
// Most Listeners are stored here
import { simulationArea } from './simulationArea'
import { hideRestricted, showRestricted } from './restrictedElementDiv';
import { setupTimingListeners } from './plotArea'

// Canvas pointer input now lives in commands/pointer.ts and is bound by
// components/SimulatorCanvas.vue. Re-exported here for backwards compatibility.
export { getCoordinate, pinchZoom, panStart, panMove, panStop } from './commands/pointer'

// Keyboard shortcuts, clipboard and desktop (Tauri) menu commands live in
// commands/keyboard.ts, commands/clipboard.ts and the composables under
// src/composables, bound from pages/simulator.vue.

export default function startListeners() {
    $('#projectName').on('click', () => {
		simulationArea.lastSelected = globalScope.root;
		setTimeout(() => {
			document.getElementById("projname").select();
		}, 100);
	});

    restrictedElements.forEach((element) => {
        $(`#${element}`).mouseover(() => {
            showRestricted()
        })

        $(`#${element}`).mouseout(() => {
            hideRestricted()
        })
    })

    if (!embed) {
        setupTimingListeners()
    }
}

import { ZoomIn, ZoomOut } from './commands/zoom';
export { ZoomIn, ZoomOut };

