<template>
    <v-dialog v-model="show" :persistent="false">
        <v-card class="messageBoxContent" id="creatorBox">
            <v-card-text class="creatorHeader">
                <p class="dialogHeader">Create Test</p>
                <v-btn size="x-small" icon class="dialogClose" @mousedown="show = false">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
                <div class="testInput">
                    <label for="fileNameInputField">Title:</label>
                    <input v-model="testTitle" class="inputField" type="text" />
                </div>
            </v-card-text>

            <v-card-actions class="testType">
                <v-btn class="messageBtn" block @mousedown="() => { }">
                    Sequential Test
                </v-btn>
                <v-btn class="messageBtn" block @mousedown="() => { }">
                    Combinational Test
                </v-btn>
            </v-card-actions>

            <v-card-text style="testCard">
                <div class="testCol">
                    <div class="testRow firstCol">

                    </div>
                    <div class="testRow fullTestRow space">
                        <span>Inputs</span> <span @mousedown="increInputs()" class="plusBtn">+</span>
                    </div>
                    <div class="testRow fullTestRow space">
                        <span>Outputs</span> <span @mousedown="increOutputs()" class="plusBtn">+</span>
                    </div>
                </div>
                <div class="testCol">
                    <div class="testRow firstCol">
                        Label
                    </div>
                    <div class="testRow fullTestRow">
                        inp1
                    </div>
                    <div class="testRow fullTestRow">
                        out1
                    </div>
                </div>
                <div class="testCol">
                    <div class="testRow firstCol">
                        Bandwidth
                    </div>
                    <div class="testContainer">
                        <div v-for="(_, i) in inputs" class="testRow" :style="{ width: 100 / inputs.length + '%' }">
                            <input class="inputField dataGroupTitle smInput" type="text" v-model="inputs[i]" maxlength="1" />
                        </div>
                    </div>
                    <div class="testContainer">
                        <div v-for="(_, i) in outputs" class="testRow" :style="{ width: 100 / outputs.length + '%' }">
                            <input class="inputField dataGroupTitle smInput" type="text" v-model="outputs[i]" maxlength="1" />
                        </div>
                    </div>
                </div>

                <div v-for="(group, groupIndex) in groups" class="groupParent" :key="groupIndex">
                    <input v-model="group.title" class="inputField dataGroupTitle" type="text" />
                    <p>Click + to add tests to the group</p>

                    <div v-for="(test, index) in group.inputs" class="groupRow" :key="index">
                        <div class="testRow firstCol spaceArea"></div>
                        <div class="testContainer">
                            <div v-for="(_, i) in inputs" class="testRow" :style="{ width: 100 / inputs.length + '%' }">
                                <input class="inputField dataGroupTitle smInput" type="text" v-model="group.inputs[index][i]" maxlength="1" />
                            </div>
                        </div>
                        <div class="testContainer">
                            <div v-for="(_, i) in outputs" class="testRow" :style="{ width: 100 / outputs.length + '%' }">
                                <input class="inputField dataGroupTitle smInput" type="text" v-model="group.outputs[index][i]" maxlength="1" />
                            </div>
                        </div>
                    </div>

                    <v-btn v-if="groupIndex !== groups.length - 1" class="messageBtn addBtn" block @mousedown="addTestToGroup(groupIndex)">
                        +
                    </v-btn>
                </div>
            </v-card-text>

            <v-card-actions class="testActionBtns">
                <div class="btnDiv">
                    <v-btn class="messageBtn" block @mousedown="addTestToGroup(groups.length - 1)">
                        +
                    </v-btn>
                    <v-btn class="messageBtn" block @mousedown="addNewGroup">
                        New Group
                    </v-btn>
                </div>
                <div class="btnDiv">
                    <v-btn class="messageBtn" block>
                        Import From CSV
                    </v-btn>
                    <v-btn class="messageBtn" block>
                        Export As CSV
                    </v-btn>
                    <v-btn class="messageBtn" block>
                        Attach
                    </v-btn>
                </div>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue';

const show = ref(true);
const testTitle = ref('Untitled');
const inputs = ref([1]);
const outputs = ref([1]);

interface Group {
    title: string;
    inputs: number[][];
    outputs: number[][];
}

const groups = reactive<Group[]>([
    {
        title: 'Group 1',
        inputs: [],
        outputs: [],
    }
]);

const addTestToGroup = (index: number) => {
    const group = groups[index];
    group.inputs.push([]);
    group.outputs.push([]);

    for(let i = 0; i < inputs.value.length; i++) {
        group.inputs[group.inputs.length - 1].push(0);
        group.outputs[group.outputs.length - 1].push(0);
    }
};

const addNewGroup = () => {
    groups.push({
        title: `Group ${groups.length + 1}`,
        inputs: [],
        outputs: [],
    });
};

const increInputs = () => {
    for(let i = 0; i < groups.length; i++) {
        for(let j = 0; j < groups[i].inputs.length; j++) {
            groups[i].inputs[j].push(0);
        }
    }

    inputs.value.push(1);
};

const increOutputs = () => {
    for(let i = 0; i < groups.length; i++) {
        for(let j = 0; j < groups[i].outputs.length; j++) {
            groups[i].outputs[j].push(0);
        }
    }

    outputs.value.push(1);
};
</script>

<style scoped>
#creatorBox {
    width: 1100px;
}

.creatorHeader {
    position: relative;
}

.testInput {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.testType {
    width: 97%;
}

.testActionBtns {
    width: 97%;
    display: flex;
    justify-content: space-between;
    padding-bottom: 1rem;
}

.btnDiv {
    display: flex;
    gap: 0.1rem;
    align-items: center;
}

.testRow {
    border: 1px solid #c5c5c5;
    padding: 0.75rem;
    padding-left: 1.5rem;
    padding-right: 1.5rem;
    display: flex;
    justify-content: center;
    align-items: center;
}

.testCol {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    margin-bottom: 0.5rem;
}

.firstCol {
    width: 30%;
}

.dataGroupTitle {
    border: none;
    padding: 0;
    margin: 0;
}

.spaceArea {
    visibility: hidden;
}

.testContainer{
    display: flex;
    width: 35%;
    gap: 0.5rem;
    overflow-x: scroll;
}

.fullTestRow {
    width: 35%;
}

.groupRow{
    display: flex;
    gap: 0.5rem;
    justify-content: center;
}

.plusBtn {
    cursor: pointer;
    padding: 2px;
    padding-top: 0.5px;
    padding-bottom: 0.5px;
    border: 1px solid #c5c5c5;
}

.space{
    gap: 0.25rem;
}

.groupParent{
   margin-bottom: 2rem;
   margin-top: 2rem;
}

.addBtn{
    background-color: transparent;
    color: white;
}

.testCard{
    padding-left: 2.2rem;
}

.smInput{
    width: 12px;
    border: none;
}

.smInput:focus{
    outline: none;
    border: none;
}
</style>
