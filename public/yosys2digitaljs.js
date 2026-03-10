#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verilator_lint = verilator_lint;
exports.process = process;
exports.process_files = process_files;
exports.process_sv = process_sv;
const tmp = require("tmp-promise");
const child_process = require("child_process");
const fs = require("fs");
const path = require("path");
const util_1 = require("util");
const core_1 = require("./core");
const sanitize = require('sanitize-filename');
const verilator_re = /^%(Warning|Error)[^:]*: ([^:]*):([0-9]+):([0-9]+): (.*)$/;
function sanitize_files(files) {
    const sanitized = {};
    for (const [name, content] of Object.entries(files)) {
        sanitized[sanitize(name)] = content;
    }
    return sanitized;
}
async function verilator_lint(filenames, dirname, options = {}) {
    try {
        const output = [];
        const verilator_result = await (0, util_1.promisify)(child_process.exec)(`timeout -k10s 40s verilator ${(0, core_1.prepare_verilator_args)(filenames).join(' ')}`, { maxBuffer: 1000000, cwd: dirname || null, timeout: options.timeout || 60000 })
            .catch(exc => exc);
        for (const line of verilator_result.stderr.split('\n')) {
            const result = line.match(verilator_re);
            if (result == null)
                continue;
            output.push({
                type: result[1],
                file: path.basename(result[2]),
                line: Number(result[3]),
                column: Number(result[4]),
                message: result[5]
            });
        }
        return output;
    }
    catch (exc) {
        return null;
    }
}
async function process(filenames, dirname, options = {}) {
    const tmpjson = await tmp.tmpName({ postfix: '.json' });
    let obj = undefined;
    const yosys_result = await (0, util_1.promisify)(child_process.exec)(`timeout -k10s 40s yosys -p "${(0, core_1.prepare_yosys_script)(filenames, options)}" -o ${tmpjson}`, { maxBuffer: 1000000, cwd: dirname || null, timeout: options.timeout || 60000 })
        .catch(exc => exc);
    try {
        if (yosys_result instanceof Error) {
            if (yosys_result.killed)
                yosys_result.message = "Yosys killed";
            else if (yosys_result.code)
                yosys_result.message = "Yosys failed with code " + yosys_result.code;
            else
                yosys_result.message = "Yosys failed";
            throw yosys_result;
        }
        obj = JSON.parse(fs.readFileSync(tmpjson, 'utf8'));
        await (0, util_1.promisify)(fs.unlink)(tmpjson);
        const output = (0, core_1.yosys2digitaljs)(obj, options);
        const ret = {
            output: output,
            yosys_output: obj,
            yosys_stdout: yosys_result.stdout,
            yosys_stderr: yosys_result.stderr
        };
        if (options.lint)
            ret.lint = await verilator_lint(filenames, dirname, options);
        return ret;
    }
    catch (exc) {
        if (obj !== undefined)
            exc.yosys_output = obj;
        exc.yosys_stdout = yosys_result.stdout;
        exc.yosys_stderr = yosys_result.stderr;
        throw exc;
    }
}
async function process_files(data, options = {}) {
    const sanitized_data = sanitize_files(data);
    const dir = await tmp.dir();
    const names = [];
    try {
        for (const [sname, content] of Object.entries(sanitized_data)) {
            await (0, util_1.promisify)(fs.writeFile)(path.resolve(dir.path, sname), content);
            names.push(sname);
        }
        return await process(names, dir.path, options);
    }
    finally {
        for (const sname of Object.keys(sanitized_data)) {
            await (0, util_1.promisify)(fs.unlink)(path.resolve(dir.path, sname)).catch(exc => exc);
        }
        dir.cleanup();
    }
}
async function process_sv(text, options = {}) {
    const tmpsv = await tmp.file({ postfix: '.sv' });
    try {
        await (0, util_1.promisify)(fs.write)(tmpsv.fd, text);
        await (0, util_1.promisify)(fs.close)(tmpsv.fd);
        return await process([tmpsv.path], undefined, options);
    }
    finally {
        tmpsv.cleanup();
    }
}
