import { threadId, parentPort } from 'node:worker_threads';
import crypto from 'node:crypto';

parentPort.once('message', (element) => {
	console.time(`benchmark-${threadId}`);

	const target = /^0{5}/;
	const block = {
		block: 0,
		nonce: 0,
	};

	block.data = element;

	while (true) {
		const sha256Hash = crypto.createHash('sha256');

		sha256Hash.update(JSON.stringify(block));

		const hashResult = sha256Hash.digest('hex');

		if (target.test(hashResult)) {
			console.timeEnd(`benchmark-${threadId}`);
			block.hash = hashResult;
			block.nonce = 0;
            
			parentPort.postMessage(block);
			break;
		} else {
			block.nonce++;
			block.block++;
		}
	}
});
