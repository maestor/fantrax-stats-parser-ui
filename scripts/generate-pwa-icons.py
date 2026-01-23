#!/usr/bin/env python3

import os
import struct
import zlib


BG = (25, 118, 210, 255)  # #1976d2
FG = (255, 255, 255, 255)
SHADOW = (0, 0, 0, 110)


FONT_5X7 = {
    "F": [
        "11111",
        "10000",
        "11110",
        "10000",
        "10000",
        "10000",
        "10000",
    ],
    "H": [
        "10001",
        "10001",
        "11111",
        "10001",
        "10001",
        "10001",
        "10001",
    ],
    "L": [
        "10000",
        "10000",
        "10000",
        "10000",
        "10000",
        "10000",
        "11111",
    ],
}


def _png_chunk(chunk_type: bytes, data: bytes) -> bytes:
    crc = zlib.crc32(chunk_type)
    crc = zlib.crc32(data, crc) & 0xFFFFFFFF
    return (
        struct.pack(">I", len(data))
        + chunk_type
        + data
        + struct.pack(">I", crc)
    )


def _write_png(path: str, width: int, height: int, rgba: bytes) -> None:
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)

    stride = width * 4
    raw = bytearray()
    for y in range(height):
        raw.append(0)  # filter type 0
        start = y * stride
        raw.extend(rgba[start : start + stride])

    compressed = zlib.compress(bytes(raw), level=9)

    png = b"\x89PNG\r\n\x1a\n"
    png += _png_chunk(b"IHDR", ihdr)
    png += _png_chunk(b"IDAT", compressed)
    png += _png_chunk(b"IEND", b"")

    with open(path, "wb") as f:
        f.write(png)


def _draw_rect(rgba: bytearray, size: int, x0: int, y0: int, x1: int, y1: int, color):
    r, g, b, a = color
    for y in range(max(0, y0), min(size, y1)):
        for x in range(max(0, x0), min(size, x1)):
            i = (y * size + x) * 4
            rgba[i + 0] = r
            rgba[i + 1] = g
            rgba[i + 2] = b
            rgba[i + 3] = a


def _draw_text_5x7(
    rgba: bytearray,
    size: int,
    text: str,
    scale: int,
    x: int,
    y: int,
    color,
    spacing: int,
):
    cx = x
    for ch in text:
        glyph = FONT_5X7.get(ch)
        if glyph is None:
            cx += (5 + spacing) * scale
            continue

        for gy, row in enumerate(glyph):
            for gx, bit in enumerate(row):
                if bit != "1":
                    continue

                px0 = cx + gx * scale
                py0 = y + gy * scale
                _draw_rect(rgba, size, px0, py0, px0 + scale, py0 + scale, color)

        cx += (5 + spacing) * scale


def _make_icon(size: int, text: str, maskable: bool, pad_ratio: float) -> bytes:
    rgba = bytearray(size * size * 4)

    # Background
    for i in range(0, len(rgba), 4):
        rgba[i + 0] = BG[0]
        rgba[i + 1] = BG[1]
        rgba[i + 2] = BG[2]
        rgba[i + 3] = BG[3]

    # Layout: 5x7 bitmap font
    spacing = 1
    glyph_w = 5
    glyph_h = 7
    text_w_units = len(text) * glyph_w + (len(text) - 1) * spacing

    # Safe padding: maskable icons are frequently clipped by the OS.
    pad = int(size * pad_ratio)
    available_w = max(1, size - 2 * pad)
    available_h = max(1, size - 2 * pad)

    # Choose scale that fits both width & height within safe area.
    max_scale_w = max(1, available_w // text_w_units)
    max_scale_h = max(1, available_h // glyph_h)
    scale = max(1, min(max_scale_w, max_scale_h))

    text_w = text_w_units * scale
    text_h = glyph_h * scale

    x0 = pad + (available_w - text_w) // 2
    y0 = pad + (available_h - text_h) // 2

    # Shadow
    _draw_text_5x7(
        rgba,
        size,
        text,
        scale,
        x0 + max(1, scale // 4),
        y0 + max(1, scale // 4),
        SHADOW,
        spacing,
    )

    # Foreground
    _draw_text_5x7(rgba, size, text, scale, x0, y0, FG, spacing)

    return bytes(rgba)


def main() -> None:
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out_dir = os.path.join(repo_root, "public", "icons")
    os.makedirs(out_dir, exist_ok=True)

    text = "FFHL"

    outputs = [
        # PWA icons
        ("icon-192.png", 192, False, 0.18),
        ("icon-192-maskable.png", 192, True, 0.28),
        ("icon-512.png", 512, False, 0.16),
        ("icon-512-maskable.png", 512, True, 0.26),
        # iOS home screen icon
        ("apple-touch-icon.png", 180, False, 0.20),
        # Favicons (PNG)
        ("favicon-32.png", 32, False, 0.10),
        ("favicon-16.png", 16, False, 0.05),
    ]

    for filename, size, maskable, pad_ratio in outputs:
        rgba = _make_icon(size=size, text=text, maskable=maskable, pad_ratio=pad_ratio)
        _write_png(os.path.join(out_dir, filename), size, size, rgba)

    print("Generated icons:")
    for filename, *_ in outputs:
        print("-", os.path.join("public", "icons", filename))


if __name__ == "__main__":
    main()
