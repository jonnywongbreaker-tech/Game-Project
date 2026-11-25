"""Optional US-English forced alignment for externally produced local audio."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
from tempfile import NamedTemporaryFile

from pocketsphinx import Decoder


def align(audio, request):
    pcm = subprocess.check_output([
        'ffmpeg', '-v', 'error', '-protocol_whitelist', 'file,pipe',
        '-i', str(audio), '-map', '0:a:0', '-ar', '16000', '-ac', '1', '-f', 's16le', '-',
    ])
    probe = json.loads(subprocess.check_output([
        'ffprobe', '-v', 'error', '-protocol_whitelist', 'file,pipe', '-select_streams', 'a:0',
        '-show_entries', 'stream=duration:format=duration', '-of', 'json', str(audio),
    ]))
    duration = probe['streams'][0].get('duration')
    if duration in (None, 'N/A'):
        duration = probe.get('format', {}).get('duration')
    stop = min(len(pcm) / 32000, float(duration)) if duration not in (None, 'N/A') else len(pcm) / 32000
    pronunciation = [re.findall(r"[a-z]+(?:'[a-z]+)?", item['spoken'].lower()) for item in request['words']]
    if any(not word for word in pronunciation):
        raise ValueError(f"Spell out numbers and symbols in pronunciation aliases for {request['shot']}")
    expected = [token for word in pronunciation for token in word]
    decoder = Decoder(samprate=16000, frate=100, loglevel='ERROR')
    decoder.set_align_text(' '.join(expected))
    decoder.start_utt()
    decoder.process_raw(pcm, full_utt=True)
    decoder.end_utt()
    segments = [seg for seg in decoder.seg() if not seg.word.startswith(('<', '['))]
    actual = [re.sub(r'\(\d+\)$', '', seg.word) for seg in segments]
    if actual != expected:
        raise ValueError(f"Alignment did not match the requested pronunciation for {request['shot']}")
    offset = 0
    words = []
    for entry, spoken in zip(request['words'], pronunciation, strict=True):
        first, last = segments[offset], segments[offset + len(spoken) - 1]
        words.append({
            'text': entry['text'], 'start': first.start_frame / 100,
            'end': min((last.end_frame + 1) / 100, stop),
        })
        offset += len(spoken)
    return {'version': 1, 'source': 'pocketsphinx-en-us-forced',
            'audioSha256': hashlib.sha256(audio.read_bytes()).hexdigest(),
            'transcript': request['transcript'], 'words': words}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('episode', type=Path)
    parser.add_argument('requests', type=Path)
    args = parser.parse_args()
    for request in json.loads(args.requests.read_text()):
        audio = (args.episode.parent / request['file']).resolve()
        sidecar = Path(str(audio) + '.timing.json')
        result = align(audio, request)
        with NamedTemporaryFile(mode='w', encoding='utf-8', dir=sidecar.parent, delete=False) as temporary:
            json.dump(result, temporary, indent=2)
            temporary.write('\n')
        Path(temporary.name).replace(sidecar)
        print(sidecar)


if __name__ == '__main__':
    main()
