// The Background steps and the steps several features share.
import { expect } from '@playwright/test';
import { Given, Then, When } from './world';

Given('the atlas is open on the release {string}', async ({ atlas }, release: string) => {
  await atlas.open(release);
});

Given('the atlas is open on the test release {string}', async ({ atlas }, release: string) => {
  await atlas.open(release);
});

Given('the planetary regime is in force', async ({ atlas }) => {
  await atlas.planetary();
});

Given('the selection is {string}', async ({ atlas }, name: string) => {
  if ((await atlas.selectionName()) === name) return;
  if (!(await atlas.mark(name))?.visible) await atlas.planetary();
  await atlas.click(name);
  expect(await atlas.selectionName()).toBe(name);
});

When('the person selects {string}', async ({ atlas }, name: string) => {
  await atlas.click(name);
});

When('the person goes back', async ({ atlas }) => {
  await atlas.press('Backspace');
});

When('the person focuses the selection', async ({ atlas }) => {
  await atlas.page.locator('body').focus();
  await atlas.press('Enter');
});

Then('the focus is {string}', async ({ atlas }, name: string) => {
  expect(await atlas.focusName()).toBe(name);
});

Then('the selection is {string}', async ({ atlas }, name: string) => {
  expect(await atlas.selectionName()).toBe(name);
});

When('the person changes the date to {string}', async ({ atlas }, date: string) => {
  await atlas.page.locator('body').focus();
  await atlas.page.keyboard.press('d');
  await atlas.page.keyboard.press('ControlOrMeta+a');
  await atlas.page.keyboard.type(date);
  await atlas.page.keyboard.press('Enter');
  await atlas.settle();
});
