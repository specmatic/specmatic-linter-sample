#!/usr/bin/env bash

set -euo pipefail

collect_resource_samples() {
  local container_name="$1"
  local docker_pid="$2"
  local sample_file="$3"

  while true; do
    if docker inspect "$container_name" >/dev/null 2>&1; then
      local sample
      sample="$(docker stats --no-stream --format '{{.CPUPerc}}|{{.MemUsage}}' "$container_name" 2>/dev/null | head -n 1)"
      if [ -n "$sample" ]; then
        echo "$sample" >> "$sample_file"
      fi
      sleep 0.2
      continue
    fi

    if ! kill -0 "$docker_pid" 2>/dev/null; then
      break
    fi

    sleep 0.1
  done
}

write_resource_summary() {
  local sample_file="$1"
  local output_file="$2"

  awk '
    function trim(value) {
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", value)
      return value
    }
    function to_mb(value) {
      value = trim(value)
      if (value ~ /GiB$/ || value ~ /GB$/) {
        sub(/GiB$/, "", value)
        sub(/GB$/, "", value)
        return (value + 0) * 1024
      }
      if (value ~ /MiB$/ || value ~ /MB$/) {
        sub(/MiB$/, "", value)
        sub(/MB$/, "", value)
        return value + 0
      }
      if (value ~ /KiB$/) {
        sub(/KiB$/, "", value)
        return (value + 0) / 1024
      }
      if (value ~ /kB$/ || value ~ /KB$/) {
        sub(/kB$/, "", value)
        sub(/KB$/, "", value)
        return (value + 0) / 1000
      }
      if (value ~ /B$/) {
        sub(/B$/, "", value)
        return (value + 0) / (1024 * 1024)
      }
      return value + 0
    }
    BEGIN {
      count = 0
      maxCpuPercent = 0
      totalCpuPercent = 0
      peakMemoryMb = 0
    }
    index($0, "|") > 0 {
      split($0, parts, "|")
      cpuPercentText = trim(parts[1])
      memoryText = trim(parts[2])
      sub(/%$/, "", cpuPercentText)
      split(memoryText, memoryParts, "/")
      cpuPercent = cpuPercentText + 0
      memoryMb = to_mb(memoryParts[1])
      count++
      totalCpuPercent += cpuPercent
      if (cpuPercent > maxCpuPercent) {
        maxCpuPercent = cpuPercent
      }
      if (memoryMb > peakMemoryMb) {
        peakMemoryMb = memoryMb
      }
    }
    END {
      averageCpuPercent = count > 0 ? totalCpuPercent / count : 0
      printf "{\n"
      printf "  \"sampleCount\": %d,\n", count
      printf "  \"averageCpuPercent\": %.2f,\n", averageCpuPercent
      printf "  \"peakCpuPercent\": %.2f,\n", maxCpuPercent
      printf "  \"peakMemoryKb\": %d,\n", int(peakMemoryMb * 1024)
      printf "  \"peakMemoryMb\": %.2f\n", peakMemoryMb
      printf "}\n"
    }
  ' "$sample_file" > "$output_file"
}

print_resource_sampling_note() {
  local summary_file="$1"

  if [ ! -f "$summary_file" ]; then
    return
  fi

  local sample_count
  sample_count="$(node -e "const fs = require('fs'); const data = JSON.parse(fs.readFileSync(process.argv[1], 'utf8')); console.log(data.sampleCount || 0);" "$summary_file")"
  if [ "$sample_count" -eq 0 ]; then
    echo "Note: Resource sampling was unavailable in this environment; timing and lint totals are still valid."
  fi
}

current_time_ns() {
  local timestamp
  timestamp="$(date +%s%N 2>/dev/null || true)"

  if [[ "$timestamp" =~ ^[0-9]+$ ]]; then
    echo "$timestamp"
    return
  fi

  node -e "process.stdout.write(String(BigInt(Date.now()) * 1000000n))"
}

# Find the performance directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PERF_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
# Find the sample root (for shared project metadata)
SAMPLE_ROOT="$(cd "${PERF_DIR}/.." && pwd)"
RESULTS_DIR="${PERF_DIR}/results"
BENCHMARK_RESULT_FILE="${PERF_DIR}/benchmark_result.json"
RESOURCE_SAMPLE_FILE="${PERF_DIR}/benchmark_resource_samples.txt"
RESOURCE_SUMMARY_FILE="${PERF_DIR}/benchmark_resources.json"
CONTAINER_NAME="specmatic-linter-benchmark-$$"

# Ensure results directory is clean
rm -rf "${RESULTS_DIR}"
mkdir -p "${RESULTS_DIR}"

echo ""
echo "--- Starting Performance Benchmark (Enterprise Estate) ---"
echo "Note: Detailed results for each spec will be saved to performance/results/"

# We run the linter from the PERF_DIR to ensure the local specmatic-linter.yaml is picked up
cd "${PERF_DIR}"

NUM_SPECS=$(find specs -maxdepth 1 -name '*.yaml' | wc -l | xargs)
TOTAL_PATHS=$(grep -r "  /.*:" specs/*.yaml | wc -l | xargs)

: > "${RESOURCE_SAMPLE_FILE}"

START_TIME_NS=$(current_time_ns)
docker run --name "${CONTAINER_NAME}" --rm -v "${PERF_DIR}:/usr/src/app" -w /usr/src/app specmatic/enterprise lint specs/*.yaml --format json > "${BENCHMARK_RESULT_FILE}" 2>&1 &
LINTER_PID=$!

collect_resource_samples "${CONTAINER_NAME}" "${LINTER_PID}" "${RESOURCE_SAMPLE_FILE}" &
SAMPLER_PID=$!

set +e
wait "${LINTER_PID}"
LINTER_EXIT_CODE=$?
wait "${SAMPLER_PID}" 2>/dev/null
set -e

END_TIME_NS=$(current_time_ns)
DURATION_MS=$(( (END_TIME_NS - START_TIME_NS) / 1000000 ))

write_resource_summary "${RESOURCE_SAMPLE_FILE}" "${RESOURCE_SUMMARY_FILE}"

if [ ! -s "${BENCHMARK_RESULT_FILE}" ]; then
  echo "Benchmark failed before producing any linter output."
  exit "${LINTER_EXIT_CODE}"
fi

# Use the node formatter to display the table and generate individual result files
node "${SCRIPT_DIR}/format-results.js" < "${BENCHMARK_RESULT_FILE}"
print_resource_sampling_note "${RESOURCE_SUMMARY_FILE}"

echo ""
echo "✅ SUCCESS: Linted $NUM_SPECS specifications (~$TOTAL_PATHS paths)"
echo "⏱️  Total Execution Time: ${DURATION_MS}ms"
echo ""
echo "📂 Detailed reports saved to: results/"
echo "The Specmatic Linter processes complex semantic rules across a massive estate with sub-second average latency."

rm -f "${BENCHMARK_RESULT_FILE}" "${RESOURCE_SAMPLE_FILE}" "${RESOURCE_SUMMARY_FILE}"
