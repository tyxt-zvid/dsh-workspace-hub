#!/usr/bin/env bash
# shot.sh — 用 macOS 已安装的 Chrome（headless）给 DSH 面板 harness 截图，并校验产物。
#
# 依赖：/Applications/Google Chrome.app + node（DSH 自带环境即可）。无 npm 依赖。
#
# 约定（harness 必须实现）：
#   ?theme=dark|light   页面据此设置/移除 <body data-ds-dark-theme>
#   ?state=<name>       页面据此渲染 populated / empty / loading / error / edge…
#   其余 --param k=v    原样拼进 query，供 harness 自行解释
#
# 用法：
#   tools/design/shot.sh --file docs/redesign/prototype/states.html --state empty \
#       --theme dark --size 1120x760 --scale 2 --out docs/redesign/screens/empty-dark.png
#   tools/design/shot.sh --url "http://127.0.0.1:8000/index.html#/now" --theme dark --out /tmp/now.png
#   tools/design/shot.sh --check docs/redesign/screens/empty-dark.png   # 只校验已有产物
#   tools/design/shot.sh --list                                        # 打印本脚本的约定
#
# 退出码：0 = 截图成功且通过校验；1 = 参数/Chrome 失败；2 = 产物疑似空白或尺寸不符。

set -euo pipefail

CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"

FILESRC=""
URLSRC=""
OUT=""
SIZE="1120x760"
SCALE="1"
THEME="dark"
STATE=""
BUDGET="1500"
VERIFY="1"
CHECKONLY=""
DENSITY_COLORS="50"   # 低于此值提示「可能只渲染了外壳」
DENSITY_SD="8"
STRICT="0"
declare -a EXTRA=()

usage() {
  sed -n '2,26p' "$0" | sed 's/^# \{0,1\}//'
  exit 1
}

die() { echo "shot.sh: $*" >&2; exit 1; }

while [ $# -gt 0 ]; do
  case "$1" in
    --file)      FILESRC="$2"; shift 2 ;;
    --url)       URLSRC="$2"; shift 2 ;;
    --out|-o)    OUT="$2"; shift 2 ;;
    --size)      SIZE="$2"; shift 2 ;;
    --scale)     SCALE="$2"; shift 2 ;;
    --theme)     THEME="$2"; shift 2 ;;
    --state)     STATE="$2"; shift 2 ;;
    --budget)    BUDGET="$2"; shift 2 ;;
    --param)     EXTRA+=("$2"); shift 2 ;;
    --no-verify) VERIFY="0"; shift ;;
    --min-colors) DENSITY_COLORS="$2"; shift 2 ;;
    --min-sd)     DENSITY_SD="$2"; shift 2 ;;
    --strict)     STRICT="1"; shift ;;
    --check)     CHECKONLY="$2"; shift 2 ;;
    --list)      usage ;;
    -h|--help)   usage ;;
    *)           die "未知参数：$1（--help 查看用法）" ;;
  esac
done

# ---------- 产物校验：node + zlib 解 PNG，不需要 ImageMagick/PIL ----------
READ_PNG='
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
const f = process.argv[2] ?? process.argv[1];
const buf = readFileSync(f);
if (buf.readUInt32BE(0) !== 0x89504e47) { console.error("not a png: " + f); process.exit(2); }
let off = 8, w = 0, h = 0, bd = 0, ct = 0; const idat = [];
while (off < buf.length) {
  const len = buf.readUInt32BE(off), type = buf.toString("ascii", off + 4, off + 8);
  const data = buf.subarray(off + 8, off + 8 + len);
  if (type === "IHDR") { w = data.readUInt32BE(0); h = data.readUInt32BE(4); bd = data[8]; ct = data[9]; }
  else if (type === "IDAT") idat.push(data);
  else if (type === "IEND") break;
  off += 12 + len;
}
if (bd !== 8) { console.error("unsupported bit depth " + bd); process.exit(2); }
const ch = ct === 6 ? 4 : ct === 2 ? 3 : ct === 4 ? 2 : 1;
const raw = inflateSync(Buffer.concat(idat)), stride = w * ch, px = Buffer.alloc(h * stride);
const paeth = (a, b, c) => { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); return pa <= pb && pa <= pc ? a : pb <= pc ? b : c; };
for (let y = 0; y < h; y++) {
  const ft = raw[y * (stride + 1)], line = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
  const prev = y > 0 ? px.subarray((y - 1) * stride, y * stride) : null;
  const out = px.subarray(y * stride, (y + 1) * stride);
  for (let x = 0; x < stride; x++) {
    const a = x >= ch ? out[x - ch] : 0, b = prev ? prev[x] : 0, c = prev && x >= ch ? prev[x - ch] : 0;
    let v = line[x];
    if (ft === 1) v = (v + a) & 255; else if (ft === 2) v = (v + b) & 255;
    else if (ft === 3) v = (v + ((a + b) >> 1)) & 255; else if (ft === 4) v = (v + paeth(a, b, c)) & 255;
    out[x] = v;
  }
}
const step = Math.max(1, Math.floor((w * h) / 200000));
let n = 0, s1 = 0, s2 = 0; const colors = new Set();
for (let i = 0; i < w * h; i += step) {
  const o = i * ch, r = px[o], g = px[o + 1] ?? r, b = px[o + 2] ?? r;
  const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  s1 += l; s2 += l * l; n++;
  if (colors.size < 4096) colors.add((r << 16) | (g << 8) | b);
}
const mean = s1 / n, sd = Math.sqrt(Math.max(0, s2 / n - mean * mean));
console.log(JSON.stringify({ file: f, w, h, meanLum: +mean.toFixed(2), sdLum: +sd.toFixed(2), colors: colors.size, bytes: buf.length }));
process.exit(sd < 1.5 || colors.size < 8 ? 1 : 0);
'

verify_png() {
  local png="$1" expect_w="${2:-}" expect_h="${3:-}"
  [ -f "$png" ] || { echo "shot.sh: 产物不存在：$png" >&2; exit 2; }
  local json rc=0
  json="$(node --input-type=module -e "$READ_PNG" "$png" 2>&1)" || rc=$?
  echo "  verify: $json"
  if [ "$rc" -ne 0 ]; then
    echo "shot.sh: 产物疑似空白/纯色（stddev<1.5 或 颜色数<8）：$png" >&2
    exit 2
  fi
  local sd cols
  sd="$(printf '%s' "$json" | sed -n 's/.*"sdLum":\([0-9.]*\).*/\1/p')"
  cols="$(printf '%s' "$json" | sed -n 's/.*"colors":\([0-9]*\).*/\1/p')"
  # 内容密度：只画了外壳（JS 未跑完/内容为空）时 colors 与 sd 会明显偏低
  if [ -n "$sd" ] && [ -n "$cols" ]; then
    if awk -v c="$cols" -v s="$sd" -v mc="$DENSITY_COLORS" -v ms="$DENSITY_SD" \
         'BEGIN{exit !(c < mc || s < ms)}'; then
      if [ "$STRICT" = "1" ]; then
        echo "shot.sh: 内容密度不足 colors=${cols} sdLum=${sd} (阈值 ${DENSITY_COLORS}/${DENSITY_SD}) file=${png}" >&2
        exit 2
      fi
      echo "  WARN: 画面元素偏少 (colors=${cols}, sdLum=${sd}) - 可能只渲染了外壳或页面 JS 未完成; --strict 可视为失败" >&2
    fi
  fi
  if [ -n "$expect_w" ] && [ -n "$expect_h" ]; then
    local w h
    w="$(printf '%s' "$json" | sed -n 's/.*"w":\([0-9]*\).*/\1/p')"
    h="$(printf '%s' "$json" | sed -n 's/.*"h":\([0-9]*\).*/\1/p')"
    if [ "$w" != "$expect_w" ] || [ "$h" != "$expect_h" ]; then
      echo "shot.sh: 尺寸不符：期望 ${expect_w}x${expect_h}，实际 ${w}x${h}" >&2
      exit 2
    fi
  fi
}

if [ -n "$CHECKONLY" ]; then
  verify_png "$CHECKONLY"
  exit 0
fi

[ -n "$OUT" ] || die "缺少 --out"
[ -n "$FILESRC$URLSRC" ] || die "缺少 --file 或 --url"
[ -x "$CHROME" ] || die "找不到 Chrome：${CHROME}（可用 CHROME=... 覆盖）"
command -v node >/dev/null || die "找不到 node（校验需要）"

# ---------- 组装 URL ----------
if [ -n "$FILESRC" ]; then
  [ -f "$FILESRC" ] || die "文件不存在：$FILESRC"
  ABS="$(cd "$(dirname "$FILESRC")" && pwd)/$(basename "$FILESRC")"
  BASE="file://${ABS}"
else
  BASE="$URLSRC"
fi

QS="theme=${THEME}"
[ -n "$STATE" ] && QS="${QS}&state=${STATE}"
for kv in ${EXTRA[@]+"${EXTRA[@]}"}; do QS="${QS}&${kv}"; done
# hash 路由（#/now）时 query 必须插在 # 之前，否则页面读不到 location.search
HASH=""
case "$BASE" in
  *\#*) HASH="#${BASE#*#}"; BASE="${BASE%%#*}" ;;
esac
case "$BASE" in
  *\?*) FULL="${BASE}&${QS}${HASH}" ;;
  *)    FULL="${BASE}?${QS}${HASH}" ;;
esac

W="${SIZE%x*}"; H="${SIZE#*x}"
case "$W" in ''|*[!0-9]*) die "--size 形如 1120x760" ;; esac
case "$H" in ''|*[!0-9]*) die "--size 形如 1120x760" ;; esac
case "$THEME" in dark|light) ;; *) die "--theme 只有 dark|light" ;; esac

mkdir -p "$(dirname "$OUT")"

echo "shot: ${FULL}"
echo "  out=${OUT} size=${W}x${H}@${SCALE}x budget=${BUDGET}ms"
set +e
LOG="$("$CHROME" --headless=new --disable-gpu --hide-scrollbars \
  --force-device-scale-factor="$SCALE" \
  --window-size="${W},${H}" \
  --virtual-time-budget="$BUDGET" \
  --screenshot="$OUT" "$FULL" 2>&1)"
RC=$?
set -e
printf '%s\n' "$LOG" | grep -Ei 'bytes written|error|failed' | grep -v 'CVDisplayLink' || true
[ -f "$OUT" ] || die "Chrome 未产出文件（rc=${RC}）"

if [ "$VERIFY" = "1" ]; then
  verify_png "$OUT" "$((W * SCALE))" "$((H * SCALE))"
fi
echo "ok: $OUT"
