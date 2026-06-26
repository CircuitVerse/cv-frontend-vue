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
var PORT_LAYOUT_WIDTH = 120;
var PORT_LAYOUT_START_Y = 30;
var PORT_LAYOUT_GAP = 20;
var PORT_LAYOUT_BOTTOM_PADDING = 20;
var PORT_LAYOUT_TITLE_Y = 13;

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
        var successors = {}
        var inDegree = {}
        for (var i = 0; i < deviceIds.length; i++) {
            successors[deviceIds[i]] = []
            inDegree[deviceIds[i]] = 0
        }

        if (circuitJSON.connectors) {
            for (var j = 0; j < circuitJSON.connectors.length; j++) {
                var conn = circuitJSON.connectors[j]
                var fromId = conn.from.id
                var toId = conn.to.id
                if (successors[fromId] !== undefined && inDegree[toId] !== undefined) {
                    successors[fromId].push(toId)
                    inDegree[toId]++
                }
            }
        }

        // Topological sort using Kahn's algorithm to assign layers
        var queue = []
        var layerOf = {}
        for (var k = 0; k < deviceIds.length; k++) {
            if (inDegree[deviceIds[k]] === 0) {
                queue.push(deviceIds[k])
                layerOf[deviceIds[k]] = 0
            }
        }

        var sorted = []
        while (queue.length > 0) {
            var node = queue.shift()
            sorted.push(node)
            var succs = successors[node]
            for (var s = 0; s < succs.length; s++) {
                var next = succs[s]
                var nextLayer = (layerOf[node] || 0) + 1
                if (layerOf[next] === undefined || nextLayer > layerOf[next]) {
                    layerOf[next] = nextLayer
                }
                inDegree[next]--
                if (inDegree[next] === 0) {
                    queue.push(next)
                }
            }
        }

        // Handle any nodes not reached (cycles or disconnected)
        for (var m = 0; m < deviceIds.length; m++) {
            if (layerOf[deviceIds[m]] === undefined) {
                layerOf[deviceIds[m]] = 0
            }
        }

        // Group devices by layer
        var layers = {}
        for (var d = 0; d < deviceIds.length; d++) {
            var id = deviceIds[d]
            var layer = layerOf[id]
            if (!layers[layer]) layers[layer] = []
            layers[layer].push(id)
        }

        // Assign positions: x by layer, y by position within layer
        var positions = {}
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

            var startY = MARGIN_Y + Math.max(0, (400 - totalHeight) / 2)
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
