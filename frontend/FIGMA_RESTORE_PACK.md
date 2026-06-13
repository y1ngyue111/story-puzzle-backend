# Figma Restore Pack

This package contains Figma-importable assets reconstructed from the current project UI.

## Files

- `src/assets/images/figma-player-mobile-screen.svg`
  Main single-screen game UI reconstruction: flow header, puzzle stage, current player, voice input, companion question cards, style selector.

- `src/assets/images/figma-ui-system-board.svg`
  UI system board: user journey, double diamond model, design tokens, core components.

- `src/assets/images/double-diamond-model.svg`
  Standalone double-diamond design model.

- `src/assets/images/portfolio-usage-scene.png`
  Portfolio usage-scene illustration.

## Suggested Figma Pages

- `01 Product Screen`
  Import `figma-player-mobile-screen.svg`.

- `02 UI System`
  Import `figma-ui-system-board.svg`.

- `03 Design Process`
  Import `double-diamond-model.svg`.

- `04 Portfolio Visual`
  Import `portfolio-usage-scene.png`.

## Notes

- SVG files are vector-based and can be edited in Figma after import.
- The reconstruction is based on the current Vue UI rather than a static screenshot, so it is suitable for design documentation and portfolio presentation.
- Direct canvas writing is not currently exposed in this Codex session, so SVG import is the stable workflow.
