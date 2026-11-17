# Validation

Validated on 2026-11-17 against:

- Digital Garden: `af6a9ecd872be27d1edb5f371748376a62d1a24b`
- Better Quiz Box parser: `a5db7aa03e97f8c25e5ff79094447b8b9d4f1716`
- Node 24.22.1, Chromium headless. The template declares Node 22.x; deployment should follow its supported runtime.

Results:

- Template suite: 18 files, 409 tests passed (`TZ=UTC npm test`). UTC avoids two pre-existing timezone-dependent date assertions.
- Production builds with plugin enabled and disabled passed; no plugin loader warnings.
- Disabled output matches a build with the plugin removed, excluding the template's search-index cache timestamp.
- Development server renders the four example quizzes and loads plugin assets.
- Hook checks passed for Markdown, LaTeX, escaped HTML, rejected JavaScript links, malformed quiz fallback, missing references, and ordinary code fence preservation.
- Browser checks passed for wrong and correct submissions, exact-set multiple-choice grading, reset/unlocking, immediate feedback, hints, read-only binding and hidden stems.
- A 375px viewport had no horizontal overflow; preview had no browser JavaScript errors.

The screenshot uses a standalone preview of the same generated quiz HTML, stylesheet, and script. Core garden styling will depend on the site's theme.

## Version 1.1.0 colors

- Eleven manifest color settings verified against generated CSS variables.
- Hex validation accepts 3/4/6/8 digits and rejects CSS/attribute injection and non-string values.
- Chromium computed-style checks passed for background, text, buttons, selection, correct borders, and incorrect backgrounds.
- Existing rendering checks and the production template build passed again after the color update.

## Version 1.1.1 images

- Obsidian wiki embeds, full vault paths, aliases, width/height, URL encoding, ordinary Markdown images and HTTPS images pass render checks.
- Duplicate basenames, missing files, path traversal, inline code and unsafe HTML inputs are handled without guessing or injecting markup.
- Image index refreshes before builds; no symlinks outside the image root are followed.
- Production build passed without plugin warnings; all 409 template tests passed again.
- Chromium loaded two images from the compiled site after grading; they stay hidden before answering and after reset, and fit a 375px viewport.
- The publisher's actual frontmatter parser recognizes both image filenames from the reported note.
- Files that exist only inside the local Obsidian vault still require publishing, e.g. via the documented quiz-images frontmatter list. A garden-side plugin cannot upload local vault files.
