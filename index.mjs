import os from 'os';
import dataJson from './data.mjs';
import { execSync } from 'node:child_process';
import { Worker } from 'node:worker_threads';

const maxThreads = 5; // Maximum number of concurrent threads
const taskQueue = []; // Queue of tasks to be processed
let activeThreads = 0; // Active thread counter
let startTime = new Date(); // Variable to record the start time

// Command to get the number of running processes for the current process - windows
const command = `Get-Process -Id ${process.pid} | Measure-Object | Select-Object -ExpandProperty Count`;

// Run PowerShell command and get output
const output = execSync(`powershell.exe -command "${command}"`).toString();

// Convert output to an integer
const numberOfProcesses = parseInt(output);

console.log('CPU architecture:', os.arch());
console.log('Number of CPU cores:', os.cpus().length);
console.log(
	'Process running',
	process.pid,
	`default threads: ${numberOfProcesses}`
);

async function startNewThread() {
	if (activeThreads < maxThreads && taskQueue.length > 0) {
		const data = taskQueue.shift();
		activeThreads++;
		const worker = new Worker('./mining.mjs');

		const p = new Promise((resolve) => {
			worker.once('message', (message) => {
				activeThreads--;
				startNewThread();

				// console.log(message);

				if (activeThreads === 0) {
					const endTime = Date.now();
					const totalTime = endTime - startTime;
					console.log(`Total time required: ${totalTime / 1000} s`);
				}
				return resolve(message);
			});
		});

		worker.postMessage(data);
		return p;
	}
}

dataJson.map((element) => {
	taskQueue.push(element);
	startNewThread();
});
