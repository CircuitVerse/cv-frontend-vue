<template>
    <div id="verilogEditorPanel"
         class="noSelect defaultCursor draggable-panel draggable-panel-css">
      <div class="panel-header">
        Verilog Module
        <span class="fas fa-minus-square minimize"></span>
        <span class="fas fa-external-link-square-alt maximize"></span>
      </div>
  
      <div class="panel-body">
        <div class="layout-body">
          <button id="resetVerilogCode"
                  class="largeButton btn logixButton btn-xs custom-btn--tertiary"
                  @click="handleResetVerilogCode">
            Reset Code
          </button>
          <button id="saveVerilogCode"
                  class="largeButton btn logixButton btn-xs custom-btn--primary"
                  @click="handleSaveVerilogCode">
            Save Code
          </button>
          <div id="verilogOutput">
            This is an experimental module. The code is not saved unless
            the "Save Code" button is clicked.
          </div>
        </div>
      </div>
  
      <div class="panel-header text-center">Apply Themes</div>
      <div class="panel-body">
        <div class="layout-body">
          <div>
            <p class="text-center mb-2">Select a theme:</p>
            <select id="selectVerilogTheme"
                    class="applyTheme"
                    style="width: 90%"
                    @change="handleApplyVerilogTheme">
              <optgroup label="Light Themes">
                <option>default</option>
                <option>solarized</option>
                <option>elegant</option>
                <option>neat</option>
                <option>idea</option>
                <option>neo</option>
              </optgroup>
              <optgroup label="Dark Themes">
                <option>blackboard</option>
                <option>cobalt</option>
                <option>night</option>
                <option>the-matrix</option>
                <option>midnight</option>
                <option>monokai</option>
              </optgroup>
            </select>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script lang="ts" setup>
  import { applyVerilogTheme, resetVerilogCode, saveVerilogCode } from '#/simulator/src/Verilog2CV';
  
  function handleResetVerilogCode() {
    resetVerilogCode();
  }
  
  function handleSaveVerilogCode() {
    saveVerilogCode();
  }
  
  function handleApplyVerilogTheme() {
    applyVerilogTheme();
  }
  </script>
  