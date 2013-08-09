const path = require("path");
/**
 * Tests whether or not the passed path exists by checking with the file system. Calls the callback with two arguments: the
 * error that has encountered (always null) and whether (true) or not (false) the passed path exists.
 */
const determineExists = (function determineExists(standardImplementation, path, callback) {
	// The standard implementation will pass a boolean to the callback. The following line binds the callback, to ensure null is
	// prepended for an error.
	standardImplementation(path, callback.bind(this, null));
}).bind(this, require("fs").exists);
const async = require("async");
/**
 * Prefixes quotes in the input with backslashes and then puts the input between quotes. The prefixing prevents code injection.
 */
const quote = (function quote(quoteFinder, input) {
	return "\"" + input.replace(quoteFinder, "\\\"") + "\"";
}).bind(this, /\"/g);
/**
 * Returns whether (true) or not (false) the passed path ends in a character other than the separator. false is returned for an
 * empty input.
 */
function determinePathEndsInNonSeparator(input) {
	return 0 != input.length && path.sep != input.charAt(input.length - 1);
}
/**
 * Crushes the png at the passed path or array of paths.
 */
const crush = (function defineCrush() {
	function crush(spawnCrushProcess, pathOrPaths, pathPrefixes, crushArguments, callback) {
		// If the passed pathOrPaths argument is an array, call this crush method for every value in the array. Note that this
		// recursive design causes nested arrays to be fully transversed, which is OK I guess.
		if (Array.isArray(pathOrPaths)) {
			// As a new process is spawned ‒ in parallel ‒ for every path, this could make use of multiple cores.
			async.each(pathOrPaths, function callCrush(path, callback) {
				crush(spawnCrushProcess, path, pathPrefixes, crushArguments, callback);
			}, callback);
			return;
		}
		// Determine the in and out paths by adding the prefixes and the passed path.
		const inPath = pathPrefixes.inPrefix + pathOrPaths;
		const outPath = pathPrefixes.outPrefix + pathOrPaths;
		// Check whether the in file as well as the directory the out file will be in exist.
		async.map([inPath, path.dirname(outPath)], determineExists, function(error, existences) {
			// Error is always null, so no need to check for non-nullness.
			if (false == existences[0]) {
				error = new Error("Input file at " + quote(inPath) + " does not exist.");
				if (determinePathEndsInNonSeparator(pathPrefixes.inPrefix)) {
					error.message += " Perhaps a trailing " + quote(path.sep) + " should be added to the in-prefix.";
				}
				callback(error);
				return;
			} else if (false == existences[1]) {
				error = new Error("Directory for output file at " + quote(outPath) + " does not exist.");
				if (determinePathEndsInNonSeparator(pathPrefixes.outPrefix)) {
					error.message += " Perhaps a trailing " + quote(path.sep) + " should be added to the out-prefix.";
				}
				callback(error);
				return;
			}
			// Start the crushing.
			const crushProcessArguments = crushArguments.splice(0);
			const crushProcess = spawnCrushProcess((crushProcessArguments.push(inPath, outPath), crushProcessArguments));
			// Listen to errors from the process.
			crushProcess.on("error", function handleError(error) {
				// Check whether this is a simple ENOENT error.
				if ("errno" in error && "ENOENT" == error.errno) {
					error = new Error("Could not spawn pngcrush process. Check whether pngcrush is installed and available.");
				}
				// Pass the error to the callback.
				callback(error);
			});
			// Collect data from stdout, as it contains information about what went wrong should something go wrong. pngcrush doesn't
			// seem to output anything to stderr 
			const stdoutData = [];
			crushProcess.stdout.on("data", stdoutData.push.bind(stdoutData));
			crushProcess.on("close", function callCallback(code) {
				if (0 == code) {
					callback(null);
					return;
				}
				// As the code is not zero, something bad happened. Convert the data obtained from stdout to text, the first step to
				// making some sense of it.
				var stdoutText = stdoutData.map(function convertBufferToString(data) {
					return data.toString("utf8");
				}).join("");
				// Find the parts of the stdout text that aren't comments.
				stdoutText = (function findNonCommentText() {
					const nonCommentLineFinder = /^\s*([^\s|].+)\s*$/gm;
					const result = [];
					var match;
					while (null != (match = nonCommentLineFinder.exec(stdoutText))) {
						result.push(match[1]);
					}
					return result.join("\n");
				})();
				// Pass the found stdout text to the callback.
				callback(new Error(stdoutText));
			});
		});
	}
	const defaultCrushArguments = ["-rem", "alla"];
	const defaultPathPrefixes = {"inPrefix": "", "outPrefix": "out" + path.sep};
	return function checkAndCrush(spawnCrushProcess, pathOrPaths, pathPrefixes, crushArguments, callback) {
		if ("function" == typeof pathPrefixes) {
			callback = pathPrefixes;
			pathPrefixes = crushArguments = undefined;
		} else if ("function" == typeof crushArguments) {
			callback = crushArguments;
			crushArguments = undefined;
		}
		// Check the passed path prefixes. If undefined, use the default. If not undefined, ensure it has an inPrefix and an
		// outPrefix property.
		if (undefined === pathPrefixes) {
			pathPrefixes = defaultPathPrefixes;
		} else {
			if (false == ("inPrefix" in pathPrefixes)) {
				pathPrefixes.inPrefix = defaultPathPrefixes.inPrefix;
			}
			if (false == ("outPrefix" in pathPrefixes)) {
				pathPrefixes.outPrefix = defaultPathPrefixes.outPrefix;
			}
		}
		// Check the passed crush arguments. If undefined, use the default.
		if (undefined === crushArguments) {
			crushArguments = defaultCrushArguments;
		}
		crush(spawnCrushProcess, pathOrPaths, pathPrefixes, crushArguments, callback);
	};
})();
const createApi = (function unboundCreateApi(spawnChildProcess, binaryPath) {
	return {"crush": crush.bind(this, spawnChildProcess.bind(this, binaryPath)),
	// setBinaryPath returns a new object. This ensures the object set as exports below is state-free and therefore safe for
	// re-use.
		"setBinaryPath": createApi};
}).bind(this, require("child_process").spawn);
module.exports = createApi("pngcrush");
