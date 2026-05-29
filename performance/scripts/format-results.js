const fs = require('fs');
const path = require('path');

const input = fs.readFileSync(0, 'utf8');
const results = [];
const perfDir = path.join(__dirname, '..');
const specsDir = path.join(perfDir, 'specs');
const resultsDir = path.join(perfDir, 'results');
const benchmarkResourcesFile = path.join(perfDir, 'benchmark_resources.json');

if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir);
}

// Extract and parse all JSON objects
// We'll use a more robust way to find valid JSON blocks by counting braces
let i = 0;
while (i < input.length) {
    if (input[i] === '{') {
        let openBraces = 0;
        let jsonStr = "";
        let j = i;
        while (j < input.length) {
            if (input[j] === '{') openBraces++;
            else if (input[j] === '}') openBraces--;
            jsonStr += input[j];
            if (openBraces === 0) break;
            j++;
        }
        
        try {
            const data = JSON.parse(jsonStr);
            if (data.totals && data.problems) {
                const ref = data.problems.length > 0 
                    ? data.problems[0].location[0].source.ref 
                    : null;
                
                if (ref) {
                    const fileName = ref.split('/').pop();
                    const filePath = path.join(specsDir, fileName);
                    let lineCount = 0;
                    if (fs.existsSync(filePath)) {
                        lineCount = fs.readFileSync(filePath, 'utf8').split('\n').length;
                    }
                    
                    results.push({
                        file: fileName,
                        errors: data.totals.errors,
                        warnings: data.totals.warnings,
                        lines: lineCount,
                        data: data
                    });
                }
            }
            i = j + 1;
        } catch (e) {
            i++;
        }
    } else {
        i++;
    }
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
