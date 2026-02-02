<template>
	<p v-if="helplink" class="btn-parent">
		<button 
			id="HelpButton" 
			class="btn btn-primary btn-xs" 
			type="button" 
			@click="helpButtonClick"
		>
			&#9432; Help
		</button>
	</p>
</template>

<script lang="ts" setup>
import { isTauri } from '@tauri-apps/api/core'
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import { computed } from 'vue'

const props = defineProps({
	obj: { type: Object, default: undefined },
})

const helplink = computed(() => props.obj?.helplink)

async function helpButtonClick() {
	const link = helplink.value
	if (!link) return
	
	if (await isTauri()) {
		new WebviewWindow(`help-${Date.now()}`, {
			url: link,
			title: 'Help - CircuitVerse',
			width: 1000,
			height: 700
		})
	} else {
		window.open(link, '_blank')
	}
}
</script>