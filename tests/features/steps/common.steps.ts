// The Background steps and the preconditions the features share.
import { Given } from './world';

Given('the atlas is open on the release {string}', async ({ atlas }, release: string) => {
  await atlas.open(release);
});

Given('the atlas is open on the test release {string}', async ({ atlas }, release: string) => {
  await atlas.open(release, { test: true });
});
