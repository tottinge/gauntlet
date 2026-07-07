const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

function loadCalculatorExports() {
    const htmlPath = path.resolve(__dirname, '..', 'PipelineGatesCalculator.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);

    assert.ok(scriptMatch, 'Expected inline <script> block in PipelineGatesCalculator.html');

    const moduleExports = {};
    new Function('exports', 'document', scriptMatch[1])(moduleExports, undefined);
    return moduleExports;
}

test('calculateOverallPassRate returns 100 for no gates', () => {
    const {PipelineCalculator} = loadCalculatorExports();
    const calc = new PipelineCalculator(false);

    assert.equal(calc.calculateOverallPassRate(), 100);
});

test('calculateOverallPassRate multiplies gate pass rates', () => {
    const {PipelineCalculator} = loadCalculatorExports();
    const calc = new PipelineCalculator(false);
    calc.gates = [{passRate: 90}, {passRate: 80}, {passRate: 50}];
    assert.ok(Math.abs(calc.calculateOverallPassRate() - 36) < 1e-9);
});

test('calculateTotalDuration sums all gate durations', () => {
    const {PipelineCalculator} = loadCalculatorExports();
    const calc = new PipelineCalculator(false);
    calc.gates = [{duration: 10}, {duration: 25}, {duration: 5}];

    assert.equal(calc.calculateTotalDuration(), 40);
});

test('calculatePipelineDurationUpTo returns cumulative duration up to index', () => {
    const {PipelineCalculator} = loadCalculatorExports();
    const calc = new PipelineCalculator(false);
    calc.gates = [{duration: 10}, {duration: 20}, {duration: 30}];

    assert.equal(calc.calculatePipelineDurationUpTo(0), 0);
    assert.equal(calc.calculatePipelineDurationUpTo(2), 30);
    assert.equal(calc.calculatePipelineDurationUpTo(3), 60);
});

test('calculateExpectedExtraTime returns 0 when pass rate is 100%', () => {
    const {PipelineCalculator} = loadCalculatorExports();
    const calc = new PipelineCalculator(false);
    calc.gates = [{passRate: 100, duration: 45}];

    assert.equal(calc.calculateExpectedExtraTime(100, 100), 0);
});

test('calculateExpectedExtraTime matches expected value for single 50% gate', () => {
    const {PipelineCalculator} = loadCalculatorExports();
    const calc = new PipelineCalculator(false);
    calc.gates = [{passRate: 50, duration: 60}];

    const resultHours = calc.calculateExpectedExtraTime(100, 50);
    assert.equal(resultHours, 100);
});

test('calculateExpectedExtraTime accounts for cumulative failure waste across gates', () => {
    const {PipelineCalculator} = loadCalculatorExports();
    const calc = new PipelineCalculator(false);
    calc.gates = [
        {passRate: 80, duration: 10},
        {passRate: 50, duration: 20}
    ];

    const overallPassRate = calc.calculateOverallPassRate(); // 40%
    const resultHours = calc.calculateExpectedExtraTime(100, overallPassRate);
    const expectedHours = 58.333333333333336;

    assert.ok(Math.abs(resultHours - expectedHours) < 1e-9);
});
