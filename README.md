# Image-Optimizer

In today's media rich world websites tend to have a great deal of imagery. But it's easy to forgot about the user with slow internet connections that have to download these images!

Image-Optimizer aims to solve this problem by:

- Optimise images for web usage 🗜️
- Easily integrating into your projects build pipeline ⚙️
- Keeping track of what is optimised and what isn't 📖

## Usage

### Install
```sh
yarn add image-optimizer
```

### Integrate
```javascript
const imageOptimizer = require('image-optimizer');

imageOptimizer({
  root: 'src/style/img', // The root directory for your images.
  blacklist: []          // The list of directories/files not to optimize.
}, (err, result) => {...});
```

Once the optmization has taken place a ```__image-digest.json``` will be placed in the ```root``` directory.

## Supported Formats

At the moment the following image formats are supported:

- JPEG
- PNG

## Roadmap

- Support custom config for different quality settings file & param based.
- Support different compression algorithms ?
- Provide a report of bytes saved...
