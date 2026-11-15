#!/bin/bash
# Build, dump and render one version for RSI review. Usage: measure.sh OUTDIR
set -e
OUT=$1; mkdir -p $OUT; D=$(cd "$(dirname "$0")" && pwd)
python3 -I $D/build.py > $OUT/build.txt
python3 -I $D/dump.py $D/../index.html $OUT/version.md
OUT=$OUT node $D/shoot.js > $OUT/overflow.txt 2>&1
python3 -I - "$OUT" <<'PY'
import glob, sys
from PIL import Image
o = sys.argv[1]
fs = sorted(glob.glob(o + '/s*.png'))
for k in range(0, len(fs), 6):
    ims = [Image.open(f).resize((800, 450)) for f in fs[k:k+6]]
    sh = Image.new('RGB', (1600, 450 * ((len(ims) + 1) // 2)), 'white')
    for j, im in enumerate(ims): sh.paste(im, ((j % 2) * 800, (j // 2) * 450))
    sh.save(f'{o}/sheet_{k:02d}-{min(k+5, len(fs)-1):02d}.png')
PY
cat $OUT/build.txt $OUT/overflow.txt
