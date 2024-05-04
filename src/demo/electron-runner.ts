import { app, BrowserWindow, globalShortcut, ipcMain, shell} from 'electron'
import { OverlayController, OVERLAY_WINDOW_OPTS } from '..'
import { Test } from '../models/Test';
import * as test1 from '../tests/test1.json';
import { TestRunner } from './test-framework';

// https://github.com/electron/electron/issues/25153
app.disableHardwareAcceleration()
let window: BrowserWindow;
let landingWindow: BrowserWindow;
var testRunner: TestRunner;

const toggleMouseKey = 'CmdOrCtrl + J'
const toggleShowKey = 'CmdOrCtrl + K'

app.on('ready', () => {
  startLanding();
})

function startLanding() {
  landingWindow = new BrowserWindow({
    width: 1200,
    height: 720,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    fullscreenable: false,
    frame: true,
    show: true,
    transparent: false,
    // let Chromium to accept any size changes from OS
    resizable: false,
    title: 'OHIF Test Framework',
  });

  ipcMain.on('app-command', appCommandRouter);

  landingWindow.loadFile("../html/landing.html");
  landingWindow.show();
}

function startTest(test: Test) {

  window = new BrowserWindow({
    width: 400,
    height: 300,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    ...OVERLAY_WINDOW_OPTS
  });

  shell.openExternal(test.questions[0].url);
  setTimeout(() => _initRunner(test), 1000);
}

function onTestCompletion(data: any) {
  console.log('Test finished with data: ' + JSON.stringify(data));
  testRunner.window.hide();
  landingWindow.webContents.send('app-command', {func: 'showResult'});
  window.webContents.send('app-command', {func: 'hidePermanently'});
  toggleOverlayState(false);
  landingWindow.show();
}

function _initRunner(test: Test) {
  testRunner = new TestRunner(test, window, onTestCompletion);
  testRunner.loadQuestion(window, test.questions[0], test);

  // NOTE: if you close Dev Tools overlay window will lose transparency
  window.webContents.openDevTools({ mode: 'detach', activate: true });
  makeDemoInteractive();

  OverlayController.attachByTitle(window, 'OHIF Viewer', { hasTitleBarOnMac: true });
}

function toggleOverlayState (isInteractable: boolean) {
  if (isInteractable) {
    isInteractable = false
    OverlayController.focusTarget()
    window.webContents.send('focus-change', false)
  } else {
    isInteractable = true
    OverlayController.activateOverlay()
    window.webContents.send('focus-change', true)
  }
  return isInteractable;
}

function appCommandRouter(event: Electron.IpcMainEvent, data: any) {
  console.log('Data received: ' + JSON.stringify(data));
  if(data.func == 'startTest') startTest(data.data as Test);
}

function makeDemoInteractive () {
  let isInteractable = true;
  isInteractable = toggleOverlayState(isInteractable)

  window.on('blur', () => {
    isInteractable = false;
    window.webContents.send('focus-change', false);
  });

  ipcMain.on('app-command', testRunner.runnerResponseCallback);

  globalShortcut.register(toggleMouseKey, () => { isInteractable = toggleOverlayState(isInteractable) });
  globalShortcut.register(toggleShowKey, () => { window.webContents.send('visibility-change', false) });
}