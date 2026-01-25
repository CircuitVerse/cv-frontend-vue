<template>
    <v-dialog v-model="testBenchStore.showTestBenchCreator" :persistent="false" max-width="1100px">
        <v-card class="testbench-creator-card">
            <v-card-title class="headline-container">
                <h1 class="headline-title">{{ dialogTitle }}</h1>
                <v-btn icon size="small" variant="text" @click="testBenchStore.showTestBenchCreator = false" class="close-button">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-card-title>
            <v-card-text class="pa-6">
                <div class="mb-6 text-center">
                    <input v-model="testTitle" class="title-input" type="text" placeholder="Enter Test Title" />
                </div>
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

                <div v-if="groups.length === 0" class="empty-state">
                    <p>No test groups added yet. Click "+ New Group" to start creating your test.</p>
                </div>

                <div v-else class="data-table-container">
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
                </div>

                    <div class="data-grid labels-grid" :class="{ 'with-results': testBenchStore.showResults }">
                        <div class="grid-cell label-col">
                            Label
                        </div>
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

                    <div class="data-grid bitwidth-grid" :class="{ 'with-results': testBenchStore.showResults }">
                      <div class="grid-cell label-col">Bitwidth</div>
                      <div class="grid-cell inputs-col">
                        <div v-for="(bw, i) in inputsBandWidth" :key="`in-bw-${i}`" class="io-cell bitwidth-row">
                          <v-btn icon size="x-small" variant="text" @click="inputsBandWidth[i] = Math.max(1, inputsBandWidth[i] - 1)" title="Decrease bitwidth">
                            <v-icon>mdi-minus</v-icon>
                          </v-btn>
                          <input class="io-input bitwidth-input no-spinner" v-model="inputsBandWidth[i]" min="1" max="64" @blur="inputsBandWidth[i] = clamp(inputsBandWidth[i])"/>
                          <v-btn icon size="x-small" variant="text" @click="inputsBandWidth[i] = Math.min(64, inputsBandWidth[i] + 1)" title="Increase bitwidth">
                            <v-icon>mdi-plus</v-icon>
                          </v-btn>
                        </div>
                      </div>
                      <div class="grid-cell outputs-col">
                        <div v-for="(bw, i) in outputsBandWidth" :key="`out-bw-${i}`" class="io-cell bitwidth-row">
                          <v-btn icon size="x-small" variant="text" @click="outputsBandWidth[i] = Math.max(1, outputsBandWidth[i] - 1)" title="Decrease bitwidth">
                            <v-icon>mdi-minus</v-icon>
                          </v-btn>
                          <input class="io-input bitwidth-input no-spinner" v-model="outputsBandWidth[i]" min="1" max="64" @blur="outputsBandWidth[i] = clamp(outputsBandWidth[i])"/>
                          <v-btn icon size="x-small" variant="text" @click="outputsBandWidth[i] = Math.min(64, outputsBandWidth[i] + 1)" title="Increase bitwidth">
                            <v-icon>mdi-plus</v-icon>
                          </v-btn>
                        </div>
                      </div>
                    </div>

                    <div v-for="(group, groupIndex) in groups" class="group-container" :key="groupIndex">
                        <div class="group-header">
                            <input v-model="group.title" class="group-title-input" type="text" />
                             <v-btn size="small" class="add-test-btn" variant="tonal" @click="addTestToGroup(groupIndex)">
                                <v-icon left>mdi-plus</v-icon>
                                Add Test
                            </v-btn>
                        </div>

                        <div v-for="(_, testIndex) in (group.inputs[0] || [])" class="data-grid data-row" :key="testIndex" :class="{ 'with-results': testBenchStore.showResults }">
                             <div class="grid-cell label-col action-col">
                                 <v-btn icon size="x-small" variant="text" class="delete-io-btn" @click="deleteTestFromGroup(groupIndex, testIndex)"><v-icon size="small">mdi-close</v-icon></v-btn>
                             </div>
                             <div class="grid-cell inputs-col">
                                 <div v-for="(_, i) in group.inputs" class="io-cell" :key="`g${groupIndex}-in-${i}-${testIndex}`">
                                     <input class="io-input data-input" type="text" v-model="group.inputs[i][testIndex]" :disabled="testBenchStore.readOnly" :maxlength="inputsBandWidth[i] as number" />
                                 </div>
                             </div>
                             <div class="grid-cell outputs-col">
                                 <div v-for="(_, i) in group.outputs" class="io-cell" :key="`g${groupIndex}-out-${i}-${testIndex}`">
                                     <input class="io-input data-input" type="text" v-model="group.outputs[i][testIndex]" :disabled="testBenchStore.readOnly" :maxlength="outputsBandWidth[i]" />
                                 </div>
                             </div>
                             <div v-if="testBenchStore.showResults" class="grid-cell results-col">
                                <div v-for="(_, i) in results[groupIndex]" class="io-cell result-cell" :key="`g${groupIndex}-res-${i}-${testIndex}`" :class="results[groupIndex][i][testIndex] ? 'success' : 'fail'">
                                <div
                                  v-for="(_, i) in (results[groupIndex] || [])"
                                  class="io-cell result-cell"
                                  :key="`g${groupIndex}-res-${i}-${testIndex}`"
                                  :class="(results[groupIndex]?.[i]?.[testIndex]) ? 'success' : 'fail'"
                                >
                                    {{ (results[groupIndex]?.[i]?.[testIndex]) ? '✔' : '✘' }}
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
            </v-card-text>

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


const results: boolean[][][] = reactive([]);
const testTitle = ref('Untitled');
const dialogTitle = ref('Create Test');
const testType = ref<string>('comb');

const inputsBandWidth = ref([1]);
const outputsBandWidth = ref([1]);
const inputsName = ref<string[]>(["inp1"]);
const outputsName = ref<string[]>(["out1"]);
const clamp = (val) => {
  if (!val) return 1
  const n = Number(val)
  if (isNaN(n)) return 1
  return Math.min(Math.max(n, 1), 64)
}

interface Group {
    title: string;
    inputs: string[][];
    outputs: string[][];
}

const groups = reactive<Group[]>([
  {
    title: 'Group 1',
    inputs: Array.from({ length: inputsName.value.length }, () => []),
    outputs: Array.from({ length: outputsName.value.length }, () => []),
  }
]);

watch(() => testBenchStore.testbenchData.testData.groups, () => {
    const { groups: newGroups } = testBenchStore.testbenchData.testData;

    const values = newGroups.map(group => ({
        title: group.label,
        inputs: group.inputs.map(input => input.values),
        outputs: group.outputs.map(output => output.values),
    }));

    groups.splice(0, groups.length, ...values);

    if (newGroups[0]) {
        const { inputs, outputs } = newGroups[0];

        inputsBandWidth.value.splice(0, inputsBandWidth.value.length, ...inputs.map(input => input.bitWidth));
        outputsBandWidth.value.splice(0, outputsBandWidth.value.length, ...outputs.map(output => output.bitWidth));
        inputsName.value.splice(0, inputsName.value.length, ...inputs.map(input => input.label));
        outputsName.value.splice(0, outputsName.value.length, ...outputs.map(output => output.label));
    } else {
        inputsBandWidth.value.splice(0, inputsBandWidth.value.length, 1);
        outputsBandWidth.value.splice(0, outputsBandWidth.value.length, 1);
        inputsName.value.splice(0, inputsName.value.length, "inp1");
        outputsName.value.splice(0, outputsName.value.length, "out1");
    }
});

watch(() => testBenchStore.testbenchData.testData.groups, () => {
    results.splice(0, results.length);
    testBenchStore.testbenchData.testData.groups.map(group => {
        results.push([]);
        group.outputs.map((output) => {
            results[results.length - 1].push([]);
            for(let i = 0; i < output.values.length; i++) {
                if(output.results && output.values[i] === output.results[i]) {
                    results[results.length - 1][results[results.length - 1].length - 1].push(true);
                } else {
                    results[results.length - 1][results[results.length - 1].length - 1].push(false);
                }
            }
        });
    });
},
    { deep: true }
);

watch(testType, () => {
    if (testType.value === 'comb') {
        groups.forEach(group => {
            group.title = `Group ${groups.indexOf(group) + 1}`;
        });
    }
    else {
        groups.forEach(group => {
            group.title = `Set ${groups.indexOf(group) + 1}`;
        });
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
            n: inputsData[0] ? inputsData[0].values.length : 0,
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
    for (let i = 0; i < inputsBandWidth.value.length; i++) {
        if (group.inputs.length === i)
            group.inputs.push([]);
        group.inputs[i].push("0");
    }

    for (let i = 0; i < outputsBandWidth.value.length; i++) {
        if (group.outputs.length === i)
            group.outputs.push([]);
        group.outputs[i].push("0");
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
  groups.push({
    title: `Group ${groups.length + 1}`,
    inputs: Array.from({ length: inputsName.value.length }, () => []),
    outputs: Array.from({ length: outputsName.value.length }, () => []),
  });
};

const increInputs = () => {
    groups.forEach((group) => {
        if (group.inputs.length === 0) return;

        group.inputs.push([]);

        for (let i = 0; i < group.inputs[0].length; i++) {
            group.inputs[group.inputs.length - 1].push("0");
        }
    });

    inputsBandWidth.value.push(1);
    inputsName.value.push(`inp${inputsName.value.length + 1}`);
};

const deleteInput = (index:number) => {
    if(inputsName.value.length === 1) return;
    groups.forEach((group) => {
        if (group.inputs.length === 0) return;

        group.inputs.splice(index, 1);
    });

    inputsBandWidth.value.splice(index, 1);
    inputsName.value.splice(index, 1);
};

const increOutputs = () => {
    groups.forEach((group) => {
        if (group.outputs.length === 0) return;

        group.outputs.push([]);

        for (let i = 0; i < group.outputs[0].length; i++) {
            group.outputs[group.outputs.length - 1].push("0");
        }
    });

    outputsBandWidth.value.push(1);
    outputsName.value.push(`out${outputsName.value.length + 1}`);
};

const deleteOutput = (index:number) => {
    if(outputsName.value.length === 1) return;
    groups.forEach((group) => {
        if (group.outputs.length === 0) return;

        group.outputs.splice(index, 1);
    });

    outputsBandWidth.value.splice(index, 1);
    outputsName.value.splice(index, 1);
};

const resetData = () => {
    testTitle.value = 'Untitled';
    testType.value = 'comb';
    inputsBandWidth.value = [1];
    outputsBandWidth.value = [1];
    inputsName.value = ["inp1"];
    outputsName.value = ["out1"];
    groups.splice(0, groups.length, {
      title: 'Group 1',
      inputs: Array.from({ length: inputsName.value.length }, () => []),
      outputs: Array.from({ length: outputsName.value.length }, () => []),
    });
};

const exportAsCSV = () => {
    let csv = `${testType.value},${testTitle.value}\n`;

    csv += `Inputs BandWidth: ${inputsBandWidth.value.join(',')}\n`;
    csv += `Outputs BandWidth: ${outputsBandWidth.value.join(',')}\n`;
    csv += `Inputs Name: ${inputsName.value.join(',')}\n`;
    csv += `Outputs Name: ${outputsName.value.join(',')}\n`;

    csv += groups.map(group => {
        let groupStr = `G-${group.title}:\n`;
        groupStr += group.inputs.map((input, index) => `I-${inputsName.value[index]}:${input.join(',')}`).join('\n');
        groupStr += '\n';
        groupStr += group.outputs.map((output, index) => `O-${outputsName.value[index]}:${output.join(',')}`).join('\n');
        return groupStr;
    }).join('\n');

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
            const lines = csv.split('\n');

            const firstLine = lines.shift();
            if (firstLine) {
                [testType.value, testTitle.value] = firstLine.split(',');
            }

            let line = lines.shift();
            if (line) {
                inputsBandWidth.value = line.split(': ')[1].split(',').map(Number);
            }
            line = lines.shift();
            if (line) {
                outputsBandWidth.value = line.split(': ')[1].split(',').map(Number);
            }
            line = lines.shift();
            if (line) {
                inputsName.value = line.split(': ')[1].split(',');
            }
            line = lines.shift();
            if (line) {
                outputsName.value = line.split(': ')[1].split(',');
            }

            const newGroups: Group[] = [];
            let group: Group = {
                title: '',
                inputs: [],
                outputs: [],
            }
            lines.forEach(line => {
                if (line.startsWith('G-')) {
                    if (group.title) {
                        newGroups.push(group);
                    }
                    group = { title: line.slice(2), inputs: [], outputs: [] };
                } else {
                    const [name, values] = line.split(':');
                    const isInput = name.startsWith('I-') && inputsName.value.includes(name.slice(2));
                    const isOutput = name.startsWith('O-') && outputsName.value.includes(name.slice(2));
                    if (isInput) {
                        group.inputs.push(values.split(','));
                    } else if (isOutput) {
                        group.outputs.push(values.split(','));
                    }
                }
            });
            if (group.title) {
                newGroups.push(group);
            }

            groups.splice(0, groups.length, ...newGroups);
        };

        reader.readAsText(file);
    };

    input.click();
};
</script>

<style scoped>
.testbench-creator-card {
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

.empty-state {
    border: 2px dashed var(--cv-border);
    border-radius: 8px;
    padding: 48px 24px;
    text-align: center;
    color: var(--cv-text-secondary);
    margin: 24px;
}

.data-table-container {
    padding: 0 16px;
}
.data-grid {
    display: grid;
    gap: 16px;
    align-items: center;
    padding: 8px 0;
}
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
.no-spinner::-webkit-inner-spin-button,
.no-spinner::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.no-spinner[type=number] {
  -moz-appearance: textfield;
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

