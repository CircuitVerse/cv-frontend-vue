<template>
    <div id="simulation" class="simulation">
        <!-- <div id="restrictedDiv" class="alert alert-danger display--none"></div> -->
        <div id="canvasArea" class="canvasArea">
            <canvas
                id="backgroundArea"
                style="
                    position: absolute;
                    left: 0;
                    top: 0;
                    z-index: 0;
                    width: 100%;
                    height: 100%;
                "
            ></canvas>
            <canvas
                id="simulationArea"
                style="
                    position: absolute;
                    left: 0;
                    top: 0;
                    z-index: 1;
                    width: 100%;
                    height: 100%;
                "
            ></canvas>
            <div id="miniMap">
                <canvas
                    id="miniMapArea"
                    style="position: absolute; left: 0; top: 0; z-index: 3"
                ></canvas>
            </div>

            <div id="Help"></div>
            <div
                class="sk-folding-cube loadingIcon"
                style="
                    display: none;
                    position: absolute;
                    right: 50%;
                    bottom: 50%;
                    z-index: 100;
                "
            >
                <div class="sk-cube1 sk-cube"></div>
                <div class="sk-cube2 sk-cube"></div>
                <div class="sk-cube4 sk-cube"></div>
                <div class="sk-cube3 sk-cube"></div>
            </div>
        </div>
    </div>
</template>

<script setup></script>

<style lang="scss" scoped></style>
