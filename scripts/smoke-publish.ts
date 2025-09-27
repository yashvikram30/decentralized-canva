import { encryptedStorage } from '../src/services/encryptedStorage';
import { walrusClient } from '../src/services/walrusClient';
import { suiSignerService } from '../src/services/suiSigner';

(async () => {
  try {
    console.log('Starting smoke test: save (encrypted) -> publish -> retrieve public copy');

    // Prepare signer fallback
    if (!suiSignerService.hasSigner()) {
      suiSignerService.generateKeypair();
    }
  const signer = suiSignerService.getSigner();
  const owner = suiSignerService.getAddress() || 'local_owner';

    // Save design
  const design = await encryptedStorage.saveDesign('smoke-test', { foo: 'bar', ts: Date.now() }, owner, signer as any);
    console.log('Saved design:', design.id, 'blobId:', design.blobId);

    // Publish
    const publishRes = await encryptedStorage.publishDesign(design.id, owner || '', signer as any);
    console.log('Published public blobId:', publishRes.publicBlobId);

    // Retrieve public
    const retrieved = await walrusClient.retrieve(publishRes.publicBlobId);
    console.log('Retrieved public data:', retrieved.data);

    console.log('Smoke test complete.');
  } catch (err) {
    console.error('Smoke test failed:', err);
    process.exit(1);
  }
})();
