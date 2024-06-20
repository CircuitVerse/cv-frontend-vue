<template>
    <v-dialog v-model="showCreator" :persistent="false">
        <v-card class="messageBoxContent" id="creatorBox">
            <v-card-text class="creatorHeader">
                <p class="dialogHeader">{{ dialogTitle }}</p>
                <v-btn size="x-small" icon class="dialogClose"
                    @mousedown="testBenchStore.toggleTestBenchCreator(false)">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
                <div class="testInput">
                    <label for="fileNameInputField">Title:</label>
                    <input v-model="testTitle" class="inputField" type="text" />
                </div>
            </v-card-text>

            <v-card-actions class="testType">
                <v-btn class="messageBtn" block @mousedown="testType = 'seq'">
                    Sequential Test
                </v-btn>
                <v-btn class="messageBtn" block @mousedown="testType = 'comb'">
                    Combinational Test
                </v-btn>
            </v-card-actions>

            <v-card-text style="testCard">
                <div class="testCol">
                    <div class="testRow firstCol">

                    </div>
                    <div class="testRow fullTestRow space">
                        <span>Inputs</span> <span @mousedown="increInputs" class="plusBtn">+</span>
                    </div>
                    <div class="testRow fullTestRow space">
                        <span>Outputs</span> <span @mousedown="increOutputs" class="plusBtn">+</span>
                    </div>
                </div>
                <div class="testCol">
                    <div class="testRow firstCol">
                        Label
                    </div>
                    <div class="testContainer">
                        <div v-for="(_, i) in inputsName" class="testRow"
                            :style="{ width: 100 / inputsBandWidth.length + '%' }">
                            <input class="inputField dataGroupTitle smInputName" type="text" v-model="inputsName[i]" />
                        </div>
                    </div>
                    <div class="testContainer">
                        <div v-for="(_, i) in outputsName" class="testRow"
                            :style="{ width: 100 / outputsBandWidth.length + '%' }">
                            <input class="inputField dataGroupTitle smInputName" type="text" v-model="outputsName[i]" />
                        </div>
                    </div>
                </div>
                <div class="testCol">
                    <div class="testRow firstCol">
                        Bandwidth
                    </div>
                    <div class="testContainer">
                        <div v-for="(_, i) in inputsBandWidth" class="testRow"
                            :style="{ width: 100 / inputsBandWidth.length + '%' }">
                            <input class="inputField dataGroupTitle smInput" type="text" v-model="inputsBandWidth[i]"
                                maxlength="1" />
                        </div>
                    </div>
                    <div class="testContainer">
                        <div v-for="(_, i) in outputsBandWidth" class="testRow"
                            :style="{ width: 100 / outputsBandWidth.length + '%' }">
                            <input class="inputField dataGroupTitle smInput" type="text" v-model="outputsBandWidth[i]"
                                maxlength="1" />
                        </div>
                    </div>
                </div>

                <div v-for="(group, groupIndex) in groups" class="groupParent" :key="groupIndex">
                    <input v-model="group.title" class="inputField dataGroupTitle" type="text" />
                    <p>Click + to add tests to the group</p>

                    <div v-for="(_, index) in group.inputs[0]" class="groupRow" :key="index">
                        <div class="testRow firstCol spaceArea"></div>
                        <div class="testContainer">
                            <div v-for="(_, i) in group.inputs" class="testRow colWise"
                                :style="{ width: 100 / inputsBandWidth.length + '%' }">
                                <input class="inputField dataGroupTitle smInput" type="text" v-model="group.inputs[i][index]" maxlength="1" />
                            </div>
                        </div>
                        <div class="testContainer">
                            <div v-for="(_, i) in group.outputs" class="testRow colWise"
                                :style="{ width: 100 / outputsBandWidth.length + '%' }">
                                <input class="inputField dataGroupTitle smInput" type="text" v-model="group.outputs[i][index]" maxlength="1" />
                            </div>
                        </div>
                    </div>

                    <v-btn v-if="groupIndex !== groups.length - 1" class="messageBtn addBtn" block
                        @mousedown="addTestToGroup(groupIndex)">
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
                    <v-btn v-if="showPopup" class="messageBtn" block @mousedown="sendData">
                        Attach
                    </v-btn>
                </div>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';
import { useTestBenchStore } from '#/store/testBenchStore';

const testBenchStore = useTestBenchStore();

const showCreator = computed(() => testBenchStore.showTestBenchCreator);
const showPopup = computed(() => testBenchStore.showPopup);

const testTitle = ref('Untitled');
const dialogTitle = ref('Create Test');
const testType = ref('comb');

const inputsBandWidth = ref([1]);
const outputsBandWidth = ref([1]);
const inputsName = ref<string[]>(["inp1"]);
const outputsName = ref<string[]>(["out1"]);

const circuitScopeID = ref<null | string>(null);

interface Group {
    title: string;
    inputs: string[][];
    outputs: string[][];
}

const groups = reactive<Group[]>([
    {
        title: 'Group 1',
        inputs: [],
        outputs: [],
    }
]);

watch([testBenchStore.data, testBenchStore.result], () => {
    if (testBenchStore.data) {
        dialogTitle.value = 'Edit Test';
        circuitScopeID.value = testBenchStore.scopeId;
        // loadData(testBenchStore.data);
    }
    else if (testBenchStore.result) {
        dialogTitle.value = 'Test Result';
        // loadResult(testBenchStore.result);
        // readOnlyUI();
    }
    else {
        dialogTitle.value = 'Create Test';
        circuitScopeID.value = testBenchStore.scopeId;
    }
});

const sendData = () => {
    const groupsData = groups.map(group => {
        const inputsData = group.inputs.map((input, index) => {
            return {
                label: inputsName.value[index],
                bitWidth: inputsBandWidth.value[index],
                values: input
            };
        });

        const outputsData = group.outputs.map((output, index) => {
            return {
                label: outputsName.value[index],
                bitWidth: outputsBandWidth.value[index],
                values: output
            };
        });

        return {
            label: group.title,
            inputs: inputsData,
            outputs: outputsData,
            n: inputsData[0].values.length,
        };
    });

    const testData = {
        type: testType.value,
        title: testTitle.value,
        groups: groupsData,
    };

    testBenchStore.sendData(testData, circuitScopeID.value);
}

const addTestToGroup = (index: number) => {
    const group = groups[index];
    for (let i = 0; i < inputsBandWidth.value.length; i++) {
        if(group.inputs.length === i)
            group.inputs.push([]);
        group.inputs[i].push("0");
    }

    for (let i = 0; i < outputsBandWidth.value.length; i++) {
        if(group.outputs.length === i)
            group.outputs.push([]);
        group.outputs[i].push("0");
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
    groups.forEach((group) => {
        if(group.inputs.length === 0) return;

        group.inputs.push([]);

        for (let i = 0; i < inputsBandWidth.value.length; i++) {
            group.inputs[group.inputs.length - 1].push("0");
        }
    });

    inputsBandWidth.value.push(1);
    inputsName.value.push(`inp${inputsName.value.length + 1}`);
};

const increOutputs = () => {
    groups.forEach((group) => {
        if(group.outputs.length === 0) return;

        group.outputs.push([]);

        for (let i = 0; i < outputsBandWidth.value.length; i++) {
            group.outputs[group.outputs.length - 1].push("0");
        }
    });

    outputsBandWidth.value.push(1);
    outputsName.value.push(`out${outputsName.value.length + 1}`);
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

.colWise{
    display: flex;
    flex-direction: column;
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

.testContainer {
    display: flex;
    width: 35%;
    gap: 0.5rem;
    overflow-x: scroll;
}

.fullTestRow {
    width: 35%;
}

.groupRow {
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

.space {
    gap: 0.25rem;
}

.groupParent {
    margin-bottom: 2rem;
    margin-top: 2rem;
}

.addBtn {
    background-color: transparent;
    color: white;
}

.testCard {
    padding-left: 2.2rem;
}

.smInput {
    width: 12px;
    border: none;
}

.smInputName {
    width: 34px;
    border: none;
}

.smInputName:focus,
.smInput:focus {
    outline: none;
    border: none;
}

.smInput:focus {
    outline: none;
    border: none;
}
</style>
