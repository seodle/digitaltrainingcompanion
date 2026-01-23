# Tutorial System Documentation

## Overview

This tutorial system uses Markdown files instead of complex JSON structures, making it much easier to write, update, and maintain tutorial content.

## File Structure

```
src/assets/tutorials/
├── config.json          # Tutorial configuration (steps, buttons)
├── 01-getting-started.md
├── 02-theory.md
├── 03-main-functionalities.md
├── 04-first-monitoring.md
├── 05-advanced-monitoring.md
└── README.md           # This file
```

## How to Update Tutorial Content

### 1. Edit Markdown Files

Simply edit the `.md` files in this directory. Each file represents one step of the tutorial.

**Example:**

```markdown
# Getting Started

Welcome to the Digital Training Companion documentation!

This tutorial will introduce you to the main functionalities...

## Key Features

- Feature 1
- Feature 2
- Feature 3

> 💡 **Tip:** This is a helpful tip!
```

### 2. Update Configuration

Edit `config.json` to:

- Add/remove tutorial steps
- Change step titles
- Update button text

**Example:**

```json
{
  "steps": [
    {
      "title": "Getting Started",
      "file": "01-getting-started.md"
    }
  ],
  "buttons": {
    "back": "Back",
    "next": "Next",
    "startAgain": "Start Again"
  }
}
```

## Markdown Features Supported

- **Headers:** `#`, `##`, `###`
- **Bold text:** `**text**`
- **Italic text:** `*text*`
- **Lists:** `- item` or `1. item`
- **Links:** `[text](url)`
- **Blockquotes:** `> text`
- **Code:** `` `code` `` or code blocks
- **Line breaks:** Double space at end of line

## Styling

The tutorial component automatically applies styling to:

- Headers (different sizes and colors)
- Blockquotes (orange border and background)
- Bold text (orange color)
- Links (blue color with hover effect)
- Code blocks (gray background)

## Adding New Tutorial Steps

1. Create a new `.md` file (e.g., `06-new-step.md`)
2. Add the step to `config.json`:
   ```json
   {
     "title": "New Step Title",
     "file": "06-new-step.md"
   }
   ```
3. The tutorial will automatically load the new content

## Benefits of This System

- **Easy to write:** Just use Markdown syntax
- **Easy to update:** Edit plain text files
- **Version control friendly:** Markdown files are easy to diff
- **No complex JSON:** No nested objects or arrays to manage
- **Readable:** Content is human-readable even in raw form
- **Extensible:** Easy to add new features or styling

## Migration from Old System

The old `tutorialTranslations.json` file can be deleted once you're satisfied with the new system. The new system is much simpler and easier to maintain.
