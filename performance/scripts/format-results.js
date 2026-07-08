const fs = require('fs');
const path = require('path');

const input = fs.readFileSync(0, 'utf8');
const results = [];
const perfDir = path.join(__dirname, '..');
const specsDir = path.join(perfDir, 'specs');
const resultsDir = path.join(perfDir, 'results');
const benchmarkResourcesFile = path.join(perfDir, 'benchmark_resources.json');
const reportsDir = path.join(perfDir, 'build', 'reports', 'specmatic', 'lint');

if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir);
}

function extractJsonObjectsFromText(text) {
    const extracted = [];
    let i = 0;

    while (i < text.length) {
        if (text[i] === '{') {
            let openBraces = 0;
            let jsonStr = "";
            let j = i;
            while (j < text.length) {
                if (text[j] === '{') openBraces++;
                else if (text[j] === '}') openBraces--;
                jsonStr += text[j];
                if (openBraces === 0) break;
                j++;
            }

            try {
                extracted.push(JSON.parse(jsonStr));
                i = j + 1;
                continue;
            } catch (e) {
                i++;
                continue;
            }
        }

        i++;
    }

    return extracted;
}

function collectFiles(rootDir, predicate) {
    if (!fs.existsSync(rootDir)) {
        return [];
    }

    const entries = fs.readdirSync(rootDir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const fullPath = path.join(rootDir, entry.name);
        if (entry.isDirectory()) {
            files.push(...collectFiles(fullPath, predicate));
        } else if (predicate(fullPath)) {
            files.push(fullPath);
        }
    }

    return files;
}

function reportToResult(data) {
    if (!data || !data.totals || !Array.isArray(data.problems)) {
        return null;
    }

    const ref = data.problems.find(problem => problem.location?.[0]?.source?.ref)?.location?.[0]?.source?.ref ?? null;
    if (!ref) {
        return null;
    }

    const fileName = path.basename(ref);
    const filePath = path.join(specsDir, fileName);
    let lineCount = 0;
    if (fs.existsSync(filePath)) {
        lineCount = fs.readFileSync(filePath, 'utf8').split('\n').length;
    }

    return {
        file: fileName,
        errors: data.totals.errors ?? 0,
        warnings: data.totals.warnings ?? 0,
        lines: lineCount,
        data
    };
}

function loadResultsFromReports() {
    const reportFiles = collectFiles(reportsDir, filePath => filePath.endsWith('.json'));

    for (const reportFile of reportFiles) {
        try {
            const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
            const result = reportToResult(report);
            if (result) {
                results.push(result);
            }
        } catch (error) {
            // Ignore malformed files that are not lint reports.
        }
    }
}

function loadResultsFromStdIn() {
    for (const jsonObject of extractJsonObjectsFromText(input)) {
        const result = reportToResult(jsonObject);
        if (result) {
            results.push(result);
        }
    }
}

loadResultsFromReports();
if (results.length === 0 && input.trim().length > 0) {
    loadResultsFromStdIn();
}

if (results.length === 0) {
    console.log("No detailed results found.");
    process.exit(0);
}

let benchmarkResources = null;
if (fs.existsSync(benchmarkResourcesFile)) {
    benchmarkResources = JSON.parse(fs.readFileSync(benchmarkResourcesFile, 'utf8'));
}

// Print header
console.log(`${"Specification File".padEnd(25)} | ${"Lines".padStart(8)} | ${"Errors".padStart(8)} | ${"Warnings".padStart(10)}`);
console.log("-".repeat(25) + "-+-" + "-".repeat(8) + "-+-" + "-".repeat(8) + "-+-" + "-".repeat(10));

let totalErrors = 0;
let totalWarnings = 0;
let totalLines = 0;

results.sort((a, b) => a.file.localeCompare(b.file, undefined, {numeric: true})).forEach(res => {
    console.log(`${res.file.padEnd(25)} | ${res.lines.toString().padStart(8)} | ${res.errors.toString().padStart(8)} | ${res.warnings.toString().padStart(10)}`);
    totalErrors += res.errors;
    totalWarnings += res.warnings;
    totalLines += res.lines;

    // Save individual result file
    const resultFileName = res.file.replace('.yaml', '-results.json');
    const resultFilePath = path.join(resultsDir, resultFileName);
    fs.writeFileSync(resultFilePath, JSON.stringify(res.data, null, 2));
});

console.log("-".repeat(25) + "-+-" + "-".repeat(8) + "-+-" + "-".repeat(8) + "-+-" + "-".repeat(10));
console.log(`${"TOTAL ESTATE".padEnd(25)} | ${totalLines.toString().padStart(8)} | ${totalErrors.toString().padStart(8)} | ${totalWarnings.toString().padStart(10)}`);

if (benchmarkResources && benchmarkResources.sampleCount > 0) {
    console.log("");
    console.log("Resource Utilization");
    console.log(`Average CPU Usage: ${benchmarkResources.averageCpuPercent.toFixed(2)}%`);
    console.log(`Peak CPU Usage:    ${benchmarkResources.peakCpuPercent.toFixed(2)}%`);
} else if (benchmarkResources) {
    console.log("");
    console.log("Resource Utilization");
    console.log("Unavailable in this execution environment.");
}
