# Highlite Example Plugin Template

A template repository for creating plugins for the HighLite client. This template showcases the basic structure, lifecycle methods, and how to use static resources like HTML, CSS, images, and audio files.

> **📋 This is a Template Repository**  
> Use this template to quickly create your own HighLite plugin by clicking the "Use this template" button on GitHub, or generate a new repository from this template.

## Getting Started

### Prerequisites

- Node.js (v16 or higher recommended)
- Yarn package manager (v4.9.1 or compatible)

### Installation

1. **Use this template**: Click the "Use this template" button on GitHub to create a new repository based on this template
2. **Clone your new repository**: 
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_PLUGIN_NAME.git
   cd YOUR_PLUGIN_NAME
   ```
3. **Install dependencies**:

```bash
yarn install
```
### Development

To build the plugin in development mode with file watching:

```bash
yarn dev
```

To build the plugin for production:

```bash
yarn build
```

The built plugin will be available in the `dist/` directory as `ExamplePlugin.js`.

## Project Structure

```
Example-Plugin/
├── src/
│   ├── ExamplePlugin.ts    # Main plugin class
│   └── types.d.ts          # TypeScript type declarations for static resources
├── resources/
│   ├── css/
│   │   └── base.css        # Stylesheet for the plugin
│   ├── html/
│   │   └── html.html       # HTML template
│   ├── images/
│   │   └── image.png       # Example image asset
│   └── sounds/
│       ├── Middlefern.mp3  # Example audio files
│       └── sound.mp3
├── package.json            # Project configuration and dependencies
├── rollup.config.mjs       # Build configuration
├── tsconfig.json          # TypeScript configuration
└── README.md              # This file
```

## Configuration

### Plugin Configuration

The main plugin class extends the base `Plugin` class from `@highlite/plugin-api`:

```typescript
class ExamplePlugin extends Plugin {
    pluginName = "ExamplePlugin";
    author: string = "Your Name";  // Update this with your name
    
    // Plugin lifecycle methods
    init(): void { }
    start(): void { }
    stop(): void { }
}
```

### Build Configuration

The plugin uses Rollup for bundling with the following features:

- **TypeScript compilation** - Transpiles TypeScript to JavaScript
- **Static resource inlining** - HTML and CSS files are bundled as strings
- **Asset handling** - Images and audio files are inlined (with size limits)
- **ES Module output** - Modern module format for compatibility

Key configuration options in `rollup.config.mjs`:

- Image files: Inlined up to 1MB
- Audio files: Inlined up to 5MB
- HTML/CSS: Always inlined as strings

## Using Static Resources

This example demonstrates how to import and use various types of static resources:

### HTML Templates

```typescript
import htmlContent from "../resources/html/html.html";

// Use in your plugin
document.getElementById("app")!.innerHTML = htmlContent;
```

### CSS Stylesheets

```typescript
import styles from "../resources/css/base.css";

// Inject styles into the document
const styleElement = document.createElement('style');
styleElement.textContent = styles;
document.head.appendChild(styleElement);
```

### Images

```typescript
import imageSrc from "../resources/images/image.png";

// Use the image source
const img = document.createElement('img');
img.src = imageSrc;
```

### Audio Files

```typescript
import audioSrc from "../resources/sounds/sound.mp3";

// Use the audio source
const audio = new Audio(audioSrc);
audio.play();
```

### Type Declarations

The `types.d.ts` file provides TypeScript support for importing static resources:

- Image formats: `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`
- Audio formats: `.mp3`, `.wav`
- Web assets: `.css`, `.html`

### Development Tips

1. **Resource Management**: Keep resource files organized in the `resources/` directory
2. **Type Safety**: Use the provided type declarations for static resource imports
3. **Build Optimization**: Adjust file size limits in `rollup.config.mjs` based on your needs
4. **Debugging**: Use the `this.log()` method for development debugging

### Customization

To customize this template for your own plugin:

1. **Rename your plugin**: Update the `pluginName` and `author` properties in `src/ExamplePlugin.ts`
2. **Update package.json**: 
   - Change the `name` field to match your plugin name (e.g., `"YourPluginName"`)
   - Update the `main` field if you rename the main TypeScript file (e.g., `"src/YourPluginName.ts"`)
3. **Replace the HTML content** in `resources/html/html.html`
4. **Modify styles** in `resources/css/base.css`
5. **Add your own images and audio files** to the respective directories
6. **Implement your plugin logic** in the lifecycle methods
7. **Update this README** to describe your specific plugin functionality

## License

This project is licensed under the terms specified in the LICENSE file.
