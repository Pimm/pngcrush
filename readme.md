`pngcrush` wraps around the PNG-optimising utility.

======================================================================================

After equipping your machine with the PNG-optimising `pngcrush` utility, this wrapper has you crushing from JavaScript. This
wrapper's API is designed to help you crush batches of images. If that isn't what you're looking for, check out
[papandreou's wrapper](https://github.com/papandreou/node-pngcrush).

Crush an image (love.png → out/love.png):
```javascript
const pngcrush = require("pngcrush");
pngcrush.crush("love.png", function handleCrushed(error) {
	if (null !== error) {
		process.stderr.write(error.toString() + "\n");
		return;
	}
});
```

Crush multiple images (mercury.png → out/mercury.png et cetera):
```javascript
const pngcrush = require("pngcrush");
pngcrush.crush(["mercury.png", "venus.png", "earth.png", "mars.png"], function handleCrushed(error) {
	if (null !== error) {
		process.stderr.write(error.toString() + "\n");
		return;
	}
});
```

Crush every image in a directory (original/* → crushed/*):
```javascript
const pngcrush = require("pngcrush");
const async = require("async");
const fileSystem = require("fs");
async.waterfall([fileSystem.readdir.bind(this, "original"),
function crushAll(files, callback) {
	pngcrush.crush(files, {"inPrefix": "original/", "outPrefix": "crushed/"}, callback);
}], function handleCrushed(error) {
	if (null !== error) {
		process.stderr.write(error.toString() + "\n");
		return;
	}
});
```

Use a different version of pngcrush from the one in your `PATH`.
```javascript
const pngcrush = require("pngcrush").setBinaryPath("./pngcrush-bin");
```

Note that any existing files will be overwritten while crushing. If you need protection from accidental overwrites, you will
have to implement it yourself. An exception to this rule exists for equal in and out paths: the utility will halt if those two
are equal. Finally you should note that if an error occurs when crushing multiple images, some of the images might have been
crushed and written to the file system anyway. It's not an all-or-nothing deal.

## Copying

Copyright 2013 Pimm Hogeling

pngcrush is free software. Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

**The Software is provided "as is", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose and noninfringement. In no event shall the authors or copyright holders be liable for any claim, damages or other liability, whether in an action of contract, tort or otherwise, arising from, out of or in connection with the Software or the use or other dealings in the Software.**

Alternatively, the Software may be used under the terms of either the GNU General Public License Version 3 or later (the "GPL"), or the GNU Lesser General Public License Version 3 or later (the "LGPL"), in which case the provisions of the GPL or the LGPL are applicable instead of those above.
