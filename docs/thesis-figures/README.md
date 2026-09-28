# Thesis figures

Source files and exported images for the figures in buddhi's final-year thesis about EcoRoute.

## Rules for every figure

- **Implemented code only.** Read the relevant source before drawing and show only what the code actually does. If something is unclear or missing in the code, ask instead of guessing.
- **Keep source and export together.** Each figure has an editable source (`.mmd`, `.svg` or `.py`) and an exported `.png` with the same base name.
- **PNG export:** at least 2000 px wide, white background, black/dark grey lines, colours that still read clearly in greyscale print.
- **Readable at 15 cm wide on A4:** no tiny labels, at most about 12 boxes per diagram.
- **No title or figure number inside the image.** Captions live in the Word document.
- **Tools:** Mermaid CLI for diagrams, Python matplotlib for charts.

## Rendering

Diagrams (shared print-safe theme in `mermaid-config.json`; `puppeteer.json` adds `--no-sandbox` for containers):

```sh
npx @mermaid-js/mermaid-cli -i name.mmd -o name.png \
  -c docs/thesis-figures/mermaid-config.json -p docs/thesis-figures/puppeteer.json \
  -b white --size 2400
```

Mermaid CLI 12 replaced `-w/--width` with `--size` (maximum width or height in px). Check the PNG is still at least 2000 px wide; a very tall diagram may need a larger `--size`.

Charts: each `.py` script saves its PNG next to itself, e.g.

```python
fig.savefig("name.png", dpi=300, facecolor="white", bbox_inches="tight")
```

with a figure width of about 15 cm (5.9 in) so 300 dpi gives roughly 1770 px; use `dpi=400` or wider figures to stay above 2000 px.
