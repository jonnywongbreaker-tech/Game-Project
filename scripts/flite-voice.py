import ctypes as c
import json
import sys
import re
import wave as wave_file
from pathlib import Path

lib = c.CDLL('libflite.so.1', mode=c.RTLD_GLOBAL)
voice_lib = c.CDLL('libflite_cmu_us_slt.so.1')
p, s, f = c.c_void_p, c.c_char_p, c.c_float

def fn(module, name, args, result):
    method = getattr(module, name)
    method.argtypes = args
    method.restype = result
    return method

fn(lib, 'flite_init', [], c.c_int)()
voice = fn(voice_lib, 'register_cmu_us_slt', [s], p)(None)
synth = fn(lib, 'flite_synth_text', [s, p], p)
relation = fn(lib, 'utt_relation', [p, s], p)
head = fn(lib, 'relation_head', [p], p)
as_item = fn(lib, 'item_as', [p, s], p)
daughter = fn(lib, 'item_daughter', [p], p)
end_daughter = fn(lib, 'item_last_daughter', [p], p)
prev = fn(lib, 'item_prev', [p], p)
next_item = fn(lib, 'item_next', [p], p)
num = fn(lib, 'item_feat_float', [p, s], f)
feat = fn(lib, 'item_feat_string', [p, s], s)
delete = fn(lib, 'delete_utterance', [p], None)

wave = fn(lib, 'utt_wave', [p], p)
save = fn(lib, 'cst_wave_save_riff', [p, s], c.c_int)

def words(text, output=None):
    utterance = synth(text.encode(), voice)
    if not utterance:
        raise RuntimeError("Flite could not synthesize the transcript")
    results = []
    try:
        if output is not None and save(wave(utterance), bytes(output)) != 0:
            raise RuntimeError(f"Could not save {output}")
        word = head(relation(utterance, b'Word'))
        while word:
            syl = as_item(word, b'SylStructure')
            begin = as_item(daughter(daughter(syl)), b'Segment')
            before = prev(begin)
            end = as_item(end_daughter(end_daughter(syl)), b'Segment')
            results.append((feat(word, b'name').decode(), num(before, b'end') if before else 0, num(end, b'end')))
            word = next_item(word)
        return results
    finally:
        delete(utterance)

if __name__ == '__main__':
    text = Path(sys.argv[1]).read_text(encoding='utf-8')
    output = Path(sys.argv[2])
    marks = words(text, output)
    with wave_file.open(str(output)) as source:
        duration = source.getnframes() / source.getframerate()
    timing = []
    cursor = 0
    for token in text.split():
        key = re.sub(r"[^a-z0-9']", '', token.lower())
        if not key or cursor == len(marks):
            raise ValueError(f'Cannot map transcript token {token!r} to a Flite word')
        combined, start, end = marks[cursor]
        cursor += 1
        while combined != key and key.startswith(combined) and cursor < len(marks):
            suffix, _, end = marks[cursor]
            combined += suffix
            cursor += 1
        if combined != key:
            raise ValueError(f'Cannot map transcript token {token!r} to Flite word {combined!r}')
        timing.append({'text': token, 'start': round(start, 5), 'end': round(min(end, duration), 5)})
    if cursor != len(marks):
        raise ValueError('Flite normalized the transcript into different words')
    print(json.dumps(timing))
