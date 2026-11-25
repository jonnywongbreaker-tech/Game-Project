import argparse
import json
import platform
import subprocess
import time
from pathlib import Path


def process_tree_kib(root):
    children = {}
    memory = {}
    rows = subprocess.check_output(['ps', '-eo', 'pid=,ppid=,rss='], text=True)
    for row in rows.splitlines():
        pid, parent, rss = map(int, row.split())
        children.setdefault(parent, []).append(pid)
        memory[pid] = rss
    total = 0
    pending = [root]
    while pending:
        pid = pending.pop()
        total += memory.get(pid, 0)
        pending.extend(children.get(pid, ()))
    return total


def measure(command, log):
    start = time.monotonic()
    peak = 0
    with log.open('w') as stream:
        with subprocess.Popen(command, stdout=stream, stderr=subprocess.STDOUT) as process:
            while process.poll() is None:
                peak = max(peak, process_tree_kib(process.pid))
                time.sleep(0.2)
    if process.returncode:
        raise SystemExit(f'Assembly failed ({process.returncode}). See {log}.')
    lines = log.read_text().splitlines()
    return {
        'wallSeconds': round(time.monotonic() - start, 2),
        'peakProcessTreeKiB': peak,
        'renderedShots': sum(line.startswith('Rendering ') for line in lines),
        'cachedShots': sum(line.startswith('Cache hit ') for line in lines),
    }


parser = argparse.ArgumentParser(description='Measure cold and warm assembly on Linux or macOS.')
parser.add_argument('episode', type=Path)
parser.add_argument('output', type=Path)
parser.add_argument('concurrency', nargs='?', type=int, default=2)
args = parser.parse_args()
if not 1 <= args.concurrency <= 32:
    parser.error('concurrency must be between 1 and 32')
args.output.mkdir(parents=True, exist_ok=False)
command = ['npm', 'run', '--silent', 'production', '--', 'assemble', str(args.episode),
           '--out', str(args.output), '--concurrency', str(args.concurrency)]
print(f'Cold assembly. Log: {args.output / "cold.log"}', flush=True)
cold = measure(command, args.output / 'cold.log')
print(f'Warm assembly. Log: {args.output / "warm.log"}', flush=True)
warm = measure(command, args.output / 'warm.log')
if warm['renderedShots'] or warm['cachedShots'] != cold['renderedShots']:
    raise SystemExit('Warm run did not reuse every cold picture.')
manifest, = args.output.glob('*.json')
plan = json.loads(manifest.read_text())
report = {
    'system': platform.platform(),
    'machine': platform.machine(),
    'episode': plan['id'],
    'videoSeconds': plan['totalFrames'] / plan['fps'],
    'concurrency': args.concurrency,
    'sampleIntervalSeconds': 0.2,
    'cold': cold,
    'warm': warm,
}
text = json.dumps(report, indent=2)
(args.output / 'benchmark.json').write_text(text + '\n')
print(text)
