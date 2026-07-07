const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

test('smoke: PipelineCalculator can be loaded and instantiated without DOM', () => {
    const htmlPath = path.resolve(__dirname, '..', 'PipelineGatesCalculator.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);

    assert.ok(scriptMatch, 'Expected inline <script> block in PipelineGatesCalculator.html');

    const moduleExports = {};
    new Function('exports', 'document', scriptMatch[1])(moduleExports, undefined);

    assert.equal(typeof moduleExports.CONSTANTS, 'object');
    assert.equal(typeof moduleExports.Utils, 'object');
    assert.equal(typeof moduleExports.PipelineCalculator, 'function');

    const calculator = new moduleExports.PipelineCalculator(false);
    assert.ok(calculator, 'Expected headless constructor invocation to succeed');
});
