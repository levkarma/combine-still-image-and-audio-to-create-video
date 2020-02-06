#!/usr/bin/env node
const homedir = require("os").homedir();
const _ = require("lodash");
const fse = require("fs-extra");
const debug = require("debug")("index");
const spawn = require("child_process").spawn;
const path = require("path");
const promisify = require("util").promisify;

if (!process.argv[2] || !process.argv[3]) {
	throw Error("Missing arguments.");
}

const imageInput = process.argv[2];
debug(imageInput);
const fullAudioFilesDirectoryPath = process.argv[3];

(async () => {
	await mapFilesInDirectory(fullAudioFilesDirectoryPath, createVideoFile);
})();

async function mapFilesInDirectory(fullDirectoryPath, callback) {
	let directoryFiles = await fse.readdir(fullDirectoryPath, {
		withFileTypes: true
	});
	directoryFiles = directoryFiles.filter(file => !file.isDirectory());
	for (var i = 0; i < directoryFiles.length; i++) {
		await callback(directoryFiles[i].name);
	}
}

async function createVideoFile(audioFileName) {
	const outputFileName = changeFileExtension(audioFileName, ".mp4");
	const cp = spawnCustomFfmpeg(imageInput, audioFileName, outputFileName);
	const promisifiedOn = eventName => {
		return new Promise(function(resolve, reject) {
			cp.on(eventName, () => {
				resolve();
			});
		});
	};
	await promisifiedOn("close");
}

function spawnCustomFfmpeg(imageInput, audioInput, outputFileName) {
	return spawn(
		"ffmpeg",
		[
			"-loop",
			"1",
			"-i",
			imageInput,
			"-i",
			audioInput,
			"-vf",
			"format=yuv420p",
			"-c:a",
			"copy",
			"-shortest",
			outputFileName
		],
		{
			stdio: "inherit"
		}
	);
}

function changeFileExtension(originalFileName, newExtension) {
	const parsed = path.parse(originalFileName);
	delete parsed.base; // base must be deleted for ext to be effective
	parsed.ext = newExtension;
	return path.format(parsed);
}
