<template>
	<p v-if="helplink" class="btn-parent">
		<button
			id="HelpButton"
			class="btn btn-primary btn-xs" type="button"
			@click="helpButtonClick"
		>
			&#9432 Help
		</button>
	</p>
</template>

<script lang="ts" setup>
const props = defineProps({
    obj: { type: Object, default: undefined },
})
const helplink = props.obj ?. helplink
function helpButtonClick() {
	window.open(helplink)
}
</script>

<style scoped>
#HelpButton {
	background-color: transparent;
	border: 2px solid white;
	width: 90%;
	margin-bottom: 15px;
	margin-top: 15px;
	font-weight: bold;
}
</style>