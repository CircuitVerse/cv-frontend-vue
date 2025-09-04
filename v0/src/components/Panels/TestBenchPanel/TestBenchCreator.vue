<template>
    <v-dialog v-model="showCreator" :persistent="false" max-width="1100px">
        <v-card class="testbench-creator-card">
            <!-- Header Section -->
            <v-card-title class="headline-container">
                <h1 class="headline-title">{{ dialogTitle }}</h1>
                <v-btn icon size="small" variant="text" @click="testBenchStore.showTestBenchCreator.value = false" class="close-button">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-card-title>

            <v-card-text class="pa-6">
                <!-- Title Input -->
                <div class="mb-6 text-center">
                    <input v-model="testTitle" class="title-input" type="text" placeholder="Enter Test Title" />
                </div>

                <!-- Test Type Selection -->
                <div class="test-type-container">
                    <v-btn
                        :class="['test-type-btn', { 'active': testType === 'seq' }]"
                        @click="testType = 'seq'"
                        elevation="0"
                    >
                        Sequential Test
                    </v-btn>
                    <v-btn
                        :class="['test-type-btn', { 'active': testType === 'comb' }]"
                        @click="testType = 'comb'"
                        elevation="0"
                    >
                        Combinational Test
                    </v-btn>
                </div>

                <!-- Empty State Placeholder -->
                <div v-if="groups.length === 0" class="empty-state">
                    <p>No test groups added yet. Click "+ New Group" to start creating your test.</p>
                </div>

                <!-- Test Data Table -->
                <div v-else class="data-table-container">
                    <!-- Table Header -->
                    <div class="data-grid header-grid" :class="{ 'with-results': testBenchStore.showResults }">
                        <div class="grid-cell header-cell label-col"></div>
                        <div class="grid-cell header-cell inputs-col">
                            <span>Inputs</span>
                            <v-btn icon size="x-small" variant="flat" class="ml-2 action-icon" @click="increInputs"><v-icon>mdi-plus</v-icon></v-btn>
                        </div>
                        <div class="grid-cell header-cell outputs-col">
                            <span>Outputs</span>
                             <v-btn icon size="x-small" variant="flat" class="ml-2 action-icon" @click="increOutputs"><v-icon>mdi-plus</v-icon></v-btn>
                        </div>
                        <div v-if="testBenchStore.showResults" class="grid-cell header-cell results-col">
                            Results
                        </div>
                    </div>

                    <!-- Labels Row -->
                    <div class="data-grid labels-grid" :class="{ 'with-results': testBenchStore.showResults }">
                        <div class="grid-cell label-col">Label</div>
                        <div class="grid-cell inputs-col">
                            <div v-for="(name, i) in inputsName" :key="`in-name-${i}`" class="io-cell">
                                <input class="io-input" type="text" v-model="inputsName[i]" />
                                <v-btn icon size="x-small" variant="text" class="delete-io-btn" @click="deleteInput(i)"><v-icon size="small">mdi-minus-circle-outline</v-icon></v-btn>
                            </div>
                        </div>
                        <div class="grid-cell outputs-col">
                            <div v-for="(name, i) in outputsName" :key="`out-name-${i}`" class="io-cell">
                                <input class="io-input" type="text" v-model="outputsName[i]" />
                                <v-btn icon size="x-small" variant="text" class="delete-io-btn" @click="deleteOutput(i)"><v-icon size="small">mdi-minus-circle-outline</v-icon></v-btn>
                            </div>
                        </div>
                    </div>

                     <!-- Bitwidth Row -->
                    <div class="data-grid bitwidth-grid" :class="{ 'with-results': testBenchStore.showResults }">
                        <div class="grid-cell label-col">Bitwidth</div>
                        <div class="grid-cell inputs-col">
                            <div v-for="(_, i) in inputsBandWidth" :key="`in-bw-${i}`" class="io-cell">
                                <input class="io-input bitwidth-input" type="text" v-model="inputsBandWidth[i]" maxlength="1" />
                            </div>
                        </div>
                        <div class="grid-cell outputs-col">
                            <div v-for="(_, i) in outputsBandWidth" :key="`out-bw-${i}`" class="io-cell">
                                <input class="io-input bitwidth-input" type="text" v-model="outputsBandWidth[i]" maxlength="1" />
                            </div>
                        </div>
                    </div>

                    <!-- Data Groups -->
                    <div v-for="(group, groupIndex) in groups" class="group-container" :key="groupIndex">
                        <div class="group-header">
                            <input v-model="group.title" class="group-title-input" type="text" />
                             <v-btn size="small" class="add-test-btn" variant="tonal" @click="addTestToGroup(groupIndex)">
                                <v-icon left>mdi-plus</v-icon>
                                Add Test
                            </v-btn>
                        </div>

                        <div v-for="(_, testIndex) in group.inputs[0]" class="data-grid data-row" :key="testIndex" :class="{ 'with-results': testBenchStore.showResults }">
                             <div class="grid-cell label-col action-col">
                                 <v-btn icon size="x-small" variant="text" class="delete-io-btn" @click="deleteTestFromGroup(groupIndex, testIndex)"><v-icon size="small">mdi-close</v-icon></v-btn>
                             </div>
                             <div class="grid-cell inputs-col">
                                 <div v-for="(_, i) in group.inputs" class="io-cell" :key="`g${groupIndex}-in-${i}-${testIndex}`">
                                     <input class="io-input data-input" type="text" v-model="group.inputs[i][testIndex]" :disabled="testBenchStore.readOnly" :maxlength="inputsBandWidth[i]" />
                                 </div>
                             </div>
                             <div class="grid-cell outputs-col">
                                 <div v-for="(_, i) in group.outputs" class="io-cell" :key="`g${groupIndex}-out-${i}-${testIndex}`">
                                     <input class="io-input data-input" type="text" v-model="group.outputs[i][testIndex]" :disabled="testBenchStore.readOnly" :maxlength="outputsBandWidth[i]" />
                                 </div>
                             </div>
                             <div v-if="testBenchStore.showResults" class="grid-cell results-col">
                                 <div v-for="(_, i) in results[groupIndex]" class="io-cell result-cell" :key="`g${groupIndex}-res-${i}-${testIndex}`" :class="results[groupIndex][i][testIndex] ? 'success' : 'fail'">
                                     {{ results[groupIndex][i][testIndex] ? '✔' : '✘' }}
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
            </v-card-text>

            <!-- Action Buttons Footer -->
            <v-card-actions class="footer-actions">
                <v-btn class="action-btn new-group-btn" @click="addNewGroup">
                    <v-icon left>mdi-plus</v-icon>
                    New Group
                </v-btn>
                <v-btn class="action-btn reset-btn" @click="resetData">Reset</v-btn>
                <v-btn class="action-btn secondary-btn" @click="importFromCSV">Import CSV</v-btn>
                <v-btn class="action-btn secondary-btn" @click="exportAsCSV">Export CSV</v-btn>
                <v-btn class="action-btn attach-btn" @click="sendData">Attach</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
import { computed, ref, reactive, watch } from 'vue';
import { useTestBenchStore } from '#/store/testBenchStore';

const testBenchStore = useTestBenchStore();

const showCreator = computed(() => testBenchStore.showTestBenchCreator);

const results: boolean[][][] = reactive([]);
const testTitle = ref('Untitled');
const dialogTitle = ref('Create Test');
const testType = ref<string>('comb');

const inputsBandWidth = ref([1]);
const outputsBandWidth = ref([1]);
const inputsName = ref<string[]>(["A"]);
const outputsName = ref<string[]>(["X"]);

interface Group {
    title: string;
    inputs: string[][];
    outputs: string[][];
}

const initialGroupState = (): Group[] => [
    {
        title: 'Group 1',
        inputs: [],
        outputs: [],
    }
];

const groups = reactive<Group[]>(initialGroupState());

const resetData = () => {
    testTitle.value = 'Untitled';
    testType.value = 'comb';
    inputsBandWidth.value = [1];
    outputsBandWidth.value = [1];
    inputsName.value = ["A"];
    outputsName.value = ["X"];
    groups.splice(0, groups.length, ...initialGroupState());
};


watch(() => testBenchStore.testbenchData.testData.groups, (newGroupsData) => {
    if (!newGroupsData || newGroupsData.length === 0) {
         // If store is empty, reset to a default empty state instead of a single group
        groups.splice(0, groups.length);
        inputsBandWidth.value = [1];
        outputsBandWidth.value = [1];
        inputsName.value = ["A"];
        outputsName.value = ["X"];
        return;
    }

    const values = newGroupsData.map(group => ({
        title: group.label,
        inputs: group.inputs.map(input => input.values),
        outputs: group.outputs.map(output => output.values),
    }));

    groups.splice(0, groups.length, ...values);

    if (newGroupsData[0]) {
        const { inputs, outputs } = newGroupsData[0];
        inputsBandWidth.value = inputs.map(input => input.bitWidth);
        outputsBandWidth.value = outputs.map(output => output.bitWidth);
        inputsName.value = inputs.map(input => input.label);
        outputsName.value = outputs.map(output => output.label);
    }
}, { deep: true });

watch(() => testBenchStore.testbenchData.testData.groups, (newGroupsData) => {
    results.splice(0, results.length);
    if (!newGroupsData) return;

    newGroupsData.forEach(group => {
        const groupResults: boolean[][] = [];
        group.outputs.forEach((output) => {
            const outputResults: boolean[] = [];
            if (output.results) {
                for (let i = 0; i < output.values.length; i++) {
                    outputResults.push(output.values[i] === output.results[i]);
                }
            }
            groupResults.push(outputResults);
        });
        results.push(groupResults);
    });
}, { deep: true });


watch(testType, () => {
    groups.forEach((group, index) => {
        group.title = testType.value === 'comb' ? `Group ${index + 1}` : `Set ${index + 1}`;
    });
});

const sendData = () => {
    const groupsData = groups.map(group => {
        const inputsData = inputsName.value.map((label, index) => ({
            label,
            bitWidth: inputsBandWidth.value[index],
            values: group.inputs[index] || [],
        }));

        const outputsData = outputsName.value.map((label, index) => ({
            label,
            bitWidth: outputsBandWidth.value[index],
            values: group.outputs[index] || [],
        }));

        return {
            label: group.title,
            inputs: inputsData,
            outputs: outputsData,
            n: (inputsData[0]?.values.length) || 0,
        };
    });

    const testData = {
        type: testType.value,
        title: testTitle.value,
        groups: groupsData,
    };

    testBenchStore.sendData(testData);
}

const addTestToGroup = (index: number) => {
    const group = groups[index];
    for (let i = 0; i < inputsName.value.length; i++) {
        if (!group.inputs[i]) group.inputs[i] = [];
        group.inputs[i].push("0".repeat(inputsBandWidth.value[i] || 1));
    }

    for (let i = 0; i < outputsName.value.length; i++) {
        if (!group.outputs[i]) group.outputs[i] = [];
        group.outputs[i].push("0".repeat(outputsBandWidth.value[i] || 1));
    }
};

const deleteTestFromGroup = (groupIndex: number, testIndex: number) => {
    groups[groupIndex].inputs.forEach(input => {
        input.splice(testIndex, 1);
    });

    groups[groupIndex].outputs.forEach(output => {
        output.splice(testIndex, 1);
    });
};

const addNewGroup = () => {
    const nextIndex = groups.length + 1;
    const newGroup: Group = {
        title: testType.value === 'comb' ? `Group ${nextIndex}` : `Set ${nextIndex}`,
        inputs: Array.from({ length: inputsName.value.length }, () => []),
        outputs: Array.from({ length: outputsName.value.length }, () => []),
    };

    // If there are existing tests in other groups, add one empty test to the new group for consistency
    const hasTests = groups.some(g => g.inputs[0]?.length > 0);
    if(groups.length > 0 && hasTests) {
        for (let i = 0; i < inputsName.value.length; i++) {
            newGroup.inputs[i].push("0".repeat(inputsBandWidth.value[i] || 1));
        }
        for (let i = 0; i < outputsName.value.length; i++) {
            newGroup.outputs[i].push("0".repeat(outputsBandWidth.value[i] || 1));
        }
    }

    groups.push(newGroup);
};


const increInputs = () => {
    inputsBandWidth.value.push(1);
    inputsName.value.push(`inp${inputsName.value.length + 1}`);
    groups.forEach((group) => {
        const newCol = group.inputs.length > 0 ? Array(group.inputs[0].length).fill("0") : [];
        group.inputs.push(newCol);
    });
};

const deleteInput = (index: number) => {
    if (inputsName.value.length <= 1) return;
    inputsBandWidth.value.splice(index, 1);
    inputsName.value.splice(index, 1);
    groups.forEach((group) => {
        group.inputs.splice(index, 1);
    });
};

const increOutputs = () => {
    outputsBandWidth.value.push(1);
    outputsName.value.push(`out${outputsName.value.length + 1}`);
    groups.forEach((group) => {
         const newCol = group.outputs.length > 0 ? Array(group.outputs[0].length).fill("0") : [];
        group.outputs.push(newCol);
    });
};

const deleteOutput = (index: number) => {
    if (outputsName.value.length <= 1) return;
    outputsBandWidth.value.splice(index, 1);
    outputsName.value.splice(index, 1);
    groups.forEach((group) => {
        group.outputs.splice(index, 1);
    });
};


const exportAsCSV = () => {
    let csv = `${testType.value},${testTitle.value}\n`;

    csv += `Inputs BandWidth:${inputsBandWidth.value.join(',')}\n`;
    csv += `Outputs BandWidth:${outputsBandWidth.value.join(',')}\n`;
    csv += `Inputs Name:${inputsName.value.join(',')}\n`;
    csv += `Outputs Name:${outputsName.value.join(',')}\n`;

    csv += groups.map(group => {
        let groupStr = `G-${group.title}\n`;
        groupStr += group.inputs.map((input, index) => `I-${inputsName.value[index]}:${input.join(',')}`).join('\n');
        groupStr += '\n';
        groupStr += group.outputs.map((output, index) => `O-${outputsName.value[index]}:${output.join(',')}`).join('\n');
        return groupStr;
    }).join('\n\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${testTitle.value}.csv`;
    a.click();
    URL.revokeObjectURL(url);
};

const importFromCSV = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const csv = reader.result as string;
            const lines = csv.split('\n').filter(line => line.trim() !== '');

            const firstLine = lines.shift();
            if (firstLine) {
                [testType.value, testTitle.value] = firstLine.split(',');
            }

            const config: { [key: string]: string } = {};
            while(lines.length > 0 && lines[0].includes(':') && !lines[0].startsWith('G-')) {
                const line = lines.shift();
                if(!line) continue;
                const [key, value] = line.split(/:(.*)/s);
                config[key] = value;
            }

            inputsBandWidth.value = config['Inputs BandWidth']?.split(',').map(Number) || [];
            outputsBandWidth.value = config['Outputs BandWidth']?.split(',').map(Number) || [];
            inputsName.value = config['Inputs Name']?.split(',') || [];
            outputsName.value = config['Outputs Name']?.split(',') || [];


            const newGroups: Group[] = [];
            let currentGroup: Group | null = null;

            for (const line of lines) {
                 if (line.startsWith('G-')) {
                    if (currentGroup) newGroups.push(currentGroup);
                    currentGroup = { title: line.substring(2), inputs: [], outputs: [] };
                } else if (currentGroup) {
                    const [typeAndLabel, values] = line.split(':');
                    const valuesArr = values ? values.split(',') : [];

                    if (typeAndLabel.startsWith('I-')) {
                        currentGroup.inputs.push(valuesArr);
                    } else if (typeAndLabel.startsWith('O-')) {
                        currentGroup.outputs.push(valuesArr);
                    }
                }
            }
            if (currentGroup) newGroups.push(currentGroup);

            groups.splice(0, groups.length, ...newGroups);
        };

        reader.readAsText(file);
    };

    input.click();
};

</script>

<style scoped>
/* Main Dialog Styling */
.testbench-creator-card {
    /* Color Palette */
    --cv-green: #4caf50;
    --cv-green-dark: #388e3c;
    --cv-red: #f44336;
    --cv-red-dark: #d32f2f;
    --cv-background: #f7f9fb;
    --cv-surface: #ffffff;
    --cv-border: #e0e0e0;
    --cv-text-primary: #212121;
    --cv-text-secondary: #757575;

    background-color: var(--cv-background);
    border-radius: 12px;
}

.headline-container {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    padding: 16px 24px;
    border-bottom: 1px solid var(--cv-border);
}

.headline-title {
    color: var(--cv-text-primary);
    font-size: 1.5rem;
    font-weight: 500;
}

.close-button {
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
}

/* Title Input */
.title-input {
    border: 1px solid var(--cv-border);
    border-radius: 8px;
    padding: 12px 16px;
    font-size: 1rem;
    width: 50%;
    max-width: 400px;
    text-align: center;
    transition: border-color 0.3s, box-shadow 0.3s;
}

.title-input:focus {
    outline: none;
    border-color: var(--cv-green);
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

/* Test Type Selection */
.test-type-container {
    display: flex;
    justify-content: center;
    background-color: #eef1f5;
    border-radius: 8px;
    padding: 4px;
    margin: 0 auto 24px auto;
    width: fit-content;
}

.test-type-btn {
    border-radius: 6px !important;
    text-transform: none;
    font-weight: 500;
    color: var(--cv-text-secondary);
    background-color: transparent;
    border: none;
}

.test-type-btn.active {
    background-color: var(--cv-green);
    color: white;
}

/* Empty State */
.empty-state {
    border: 2px dashed var(--cv-border);
    border-radius: 8px;
    padding: 48px 24px;
    text-align: center;
    color: var(--cv-text-secondary);
    margin: 24px;
}

/* Data Table Styling */
.data-table-container {
    padding: 0 16px;
}
.data-grid {
    display: grid;
    gap: 16px;
    align-items: center;
    padding: 8px 0;
}
/* Grid column definitions */
.data-grid:not(.data-row) { grid-template-columns: 120px 1fr 1fr; }
.data-grid.data-row { grid-template-columns: 40px 1fr 1fr; }
.data-grid.with-results:not(.data-row) { grid-template-columns: 120px 1fr 1fr 120px; }
.data-grid.data-row.with-results { grid-template-columns: 40px 1fr 1fr 120px; }

.data-row {
     border-top: 1px solid var(--cv-border);
}

.grid-cell {
    display: flex;
    align-items: center;
    gap: 8px;
}

.header-cell {
    font-weight: 600;
    color: var(--cv-text-primary);
    font-size: 1rem;
    justify-content: center;
}
.action-icon {
    background-color: #e0e0e0;
    color: #616161;
}

.label-col {
    font-weight: 500;
    color: var(--cv-text-secondary);
    padding-left: 12px;
}
.action-col {
    justify-content: center;
}

.inputs-col, .outputs-col, .results-col {
    background-color: var(--cv-surface);
    border: 1px solid var(--cv-border);
    border-radius: 8px;
    padding: 4px;
}

.io-cell {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    padding: 4px;
}

.io-input {
    width: 100%;
    text-align: center;
    border: none;
    background-color: transparent;
    font-size: 0.9rem;
}
.io-input:focus {
    outline: none;
}
.bitwidth-input {
    max-width: 40px;
    background-color: #f5f5f5;
    border-radius: 4px;
}
.data-input {
    border: 1px solid transparent;
    border-radius: 4px;
}
.data-input:focus {
    border-color: var(--cv-green);
}

.delete-io-btn {
    opacity: 0;
    transition: opacity 0.2s;
    color: var(--cv-text-secondary);
}
.io-cell:hover .delete-io-btn, .action-col:hover .delete-io-btn {
    opacity: 1;
}

/* Group Styling */
.group-container {
    margin-top: 24px;
}
.group-header {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    gap: 16px;
}
.group-title-input {
    font-size: 1.1rem;
    font-weight: 500;
    border: none;
    border-bottom: 1px solid transparent;
    padding: 4px 0;
}
.group-title-input:focus {
    outline: none;
    border-bottom-color: var(--cv-green);
}
.add-test-btn {
    color: var(--cv-green);
}
.result-cell {
    font-weight: bold;
}
.result-cell.success {
    color: var(--cv-green);
}
.result-cell.fail {
    color: var(--cv-red);
}


/* Footer Actions */
.footer-actions {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 16px 24px;
    border-top: 1px solid var(--cv-border);
    background-color: var(--cv-surface);
    gap: 12px;
}

.action-btn {
    text-transform: none;
    border-radius: 8px;
    font-weight: 600;
}

.new-group-btn {
    background-color: var(--cv-green);
    color: white;
}
.new-group-btn:hover {
    background-color: var(--cv-green-dark);
}

.reset-btn {
    background-color: transparent;
    color: var(--cv-red);
    border: 1px solid var(--cv-red);
}
.reset-btn:hover {
    background-color: rgba(244, 67, 54, 0.1);
}

.secondary-btn {
    background-color: transparent;
    color: var(--cv-text-secondary);
    border: 1px solid var(--cv-border);
}
.secondary-btn:hover {
    background-color: #f5f5f5;
    border-color: #bdbdbd;
}

.attach-btn {
    background-color: #626262;
    color: white;
}
.attach-btn:hover {
    background-color: #424242;
}
</style>

