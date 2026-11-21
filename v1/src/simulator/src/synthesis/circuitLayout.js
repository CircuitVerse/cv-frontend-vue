// Circuit auto-layout using topological sort (no external deps).
 
var DEVICE_SIZES = {
    Input: { width: 60, height: 40 },
    Output: { width: 60, height: 40 },
    Clock: { width: 60, height: 40 },
    Button: { width: 60, height: 40 },
    Lamp: { width: 40, height: 40 },
    And: { width: 60, height: 40 },
    Nand: { width: 60, height: 40 },
    Or: { width: 60, height: 40 },
    Nor: { width: 60, height: 40 },
    Xor: { width: 60, height: 40 },
    Xnor: { width: 60, height: 40 },
    Not: { width: 50, height: 30 },
    Repeater: { width: 50, height: 30 },
    Mux: { width: 60, height: 80 },
    Dff: { width: 80, height: 60 },
    Subcircuit: { width: 120, height: 80 },
    Constant: { width: 60, height: 30 },
}

var DEFAULT_SIZE = { width: 70, height: 50 }

var LAYER_GAP = 160   
var NODE_GAP = 80    
var MARGIN_X = 80     
var MARGIN_Y = 80     
// Nominal canvas height (px) used as a reference to vertically center each layer's nodes
var LAYER_VIEWPORT_HEIGHT = 400

var PORT_LAYOUT_WIDTH = 120;
var PORT_LAYOUT_START_Y = 30;
var PORT_LAYOUT_GAP = 20;
var PORT_LAYOUT_BOTTOM_PADDING = 20;
var PORT_LAYOUT_TITLE_Y = 13;
function assignLayersWithCycles(deviceIds, successors) {
    var index = 0
    var indices = Object.create(null)
    var lowLinks = Object.create(null)
    var stack = []
    var onStack = Object.create(null)
    var components = []
    var dfsStack = []

    for (var i = 0; i < deviceIds.length; i++) {
        var startNode = deviceIds[i]

        if (indices[startNode] !== undefined) {
            continue
        }

        indices[startNode] = index
        lowLinks[startNode] = index
        index++

        stack.push(startNode)
        onStack[startNode] = true

        dfsStack.push({
            node: startNode,
            nextNeighborIndex: 0,
        })

        while (dfsStack.length > 0) {
            var frame = dfsStack[dfsStack.length - 1]
            var node = frame.node
            var neighbors = successors[node] || []

            if (frame.nextNeighborIndex < neighbors.length) {
                var next = neighbors[frame.nextNeighborIndex]
                frame.nextNeighborIndex++

                if (indices[next] === undefined) {
                    indices[next] = index
                    lowLinks[next] = index
                    index++

                    stack.push(next)
                    onStack[next] = true

                    dfsStack.push({
                        node: next,
                        nextNeighborIndex: 0,
                    })
                } else if (onStack[next]) {
                    lowLinks[node] = Math.min(
                        lowLinks[node],
                        indices[next]
                    )
                }
            } else {
                if (lowLinks[node] === indices[node]) {
                    var component = []
                    var current

                    do {
                        current = stack.pop()
                        onStack[current] = false
                        component.push(current)
                    } while (current !== node)

                    components.push(component)
                }

                dfsStack.pop()

                if (dfsStack.length > 0) {
                    var parent = dfsStack[dfsStack.length - 1].node

                    lowLinks[parent] = Math.min(
                        lowLinks[parent],
                        lowLinks[node]
                    )
                }
            }
        }
    }

    var componentOf = Object.create(null)

    for (var c = 0; c < components.length; c++) {
        for (var n = 0; n < components[c].length; n++) {
            componentOf[components[c][n]] = c
        }
    }

    var componentSuccessors = {}
    var componentInDegree = {}

    for (var c = 0; c < components.length; c++) {
        componentSuccessors[c] = new Set()
        componentInDegree[c] = 0
    }

    for (var node of deviceIds) {
        var fromComponent = componentOf[node]

        for (var next of successors[node] || []) {
            var toComponent = componentOf[next]

            if (
                fromComponent !== toComponent &&
                !componentSuccessors[fromComponent].has(toComponent)
            ) {
                componentSuccessors[fromComponent].add(toComponent)
                componentInDegree[toComponent]++
            }
        }
    }

    var queue = []
    var componentLayer = {}

    for (var c = 0; c < components.length; c++) {
        if (componentInDegree[c] === 0) {
            queue.push(c)
            componentLayer[c] = 0
        }
    }

    var queueIndex = 0

    while (queueIndex < queue.length) {
        var current = queue[queueIndex]
        queueIndex++

        for (var next of componentSuccessors[current]) {
            componentLayer[next] = Math.max(
                componentLayer[next] || 0,
                componentLayer[current] + 1,
            )

            componentInDegree[next]--

            if (componentInDegree[next] === 0) {
                queue.push(next)
            }
        }
    }

    var layerOf = Object.create(null)

    for (var node of deviceIds) {
        layerOf[node] = componentLayer[componentOf[node]]
    }

    return layerOf
}
// Compute subcircuit shell port layout
export function computePortLayout(inputCount, outputCount) {
    var inputs = Math.max(0, inputCount || 0);
    var outputs = Math.max(0, outputCount || 0);
    var maxPorts = Math.max(inputs, outputs, 1);
    var height = PORT_LAYOUT_START_Y + (maxPorts - 1) * PORT_LAYOUT_GAP + PORT_LAYOUT_BOTTOM_PADDING;

    function positions(count, x) {
        var result = [];
        var startY = PORT_LAYOUT_START_Y + ((maxPorts - count) * PORT_LAYOUT_GAP) / 2;
        for (var i = 0; i < count; i++) {
            result.push({
                x: x,
                y: startY + i * PORT_LAYOUT_GAP,
            });
        }
        return result;
    }

    return {
        layout: {
            width: PORT_LAYOUT_WIDTH,
            height: height,
            title_x: PORT_LAYOUT_WIDTH / 2,
            title_y: PORT_LAYOUT_TITLE_Y,
            titleEnabled: true,
        },
        inputs: positions(inputs, 0),
        outputs: positions(outputs, PORT_LAYOUT_WIDTH),
    };
}

// Topological layered layout for a DigitalJS circuit
export function computeLayout(circuitJSON) {
    if (!circuitJSON || !circuitJSON.devices || Object.keys(circuitJSON.devices).length === 0) {
        return {}
    }

    try {
        var deviceIds = Object.keys(circuitJSON.devices)

        // Build adjacency lists
        var successors = Object.create(null)
        for (var i = 0; i < deviceIds.length; i++) {
            successors[deviceIds[i]] = []
        }

        if (circuitJSON.connectors) {
            for (var j = 0; j < circuitJSON.connectors.length; j++) {
                var conn = circuitJSON.connectors[j]
                var fromId = conn.from.id
                var toId = conn.to.id

                if (successors[fromId] !== undefined && successors[toId] !== undefined) {
                    successors[fromId].push(toId)
                }
            }
        }

        // Assign layers using cycle-aware topological sorting
        var layerOf = assignLayersWithCycles(deviceIds, successors)

        // Group devices by layer
        var layers = {}
        for (var d = 0; d < deviceIds.length; d++) {
            var id = deviceIds[d]
            var layer = layerOf[id]
            if (!layers[layer]) layers[layer] = []
            layers[layer].push(id)
        }

        // Assign positions: x by layer, y by position within layer
        var positions = Object.create(null)
        var layerNums = Object.keys(layers).map(Number).sort(function (a, b) { return a - b })

        for (var li = 0; li < layerNums.length; li++) {
            var layerNum = layerNums[li]
            var nodesInLayer = layers[layerNum]
            var x = MARGIN_X + layerNum * LAYER_GAP

            // Center the layer vertically
            var totalHeight = 0
            for (var n = 0; n < nodesInLayer.length; n++) {
                var size = DEVICE_SIZES[circuitJSON.devices[nodesInLayer[n]].type] || DEFAULT_SIZE
                totalHeight += size.height
            }
            totalHeight += (nodesInLayer.length - 1) * NODE_GAP

            var startY = MARGIN_Y + Math.max(0, (LAYER_VIEWPORT_HEIGHT - totalHeight) / 2)
            var currentY = startY

            for (var p = 0; p < nodesInLayer.length; p++) {
                var nodeId = nodesInLayer[p]
                var nodeSize = DEVICE_SIZES[circuitJSON.devices[nodeId].type] || DEFAULT_SIZE
                positions[nodeId] = {
                    x: Math.round(x),
                    y: Math.round(currentY + nodeSize.height / 2)
                }
                currentY += nodeSize.height + NODE_GAP
            }
        }

        return positions
    } catch (err) {
        console.warn('Circuit auto-layout failed, using default positions:', err)
        return {}
    }
}
