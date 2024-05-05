import { app, BrowserWindow, dialog, globalShortcut, ipcMain, shell} from 'electron'
import { OverlayController, OVERLAY_WINDOW_OPTS } from '..'
import { Test } from '../models/Test';
import { TestRunner } from './test-framework';
import * as CryptoJS from 'crypto-js';
const fs = require('fs');

app.disableHardwareAcceleration()
let window: BrowserWindow;
let landingWindow: BrowserWindow;
var testRunner: TestRunner;

const toggleMouseKey = 'CmdOrCtrl + J'
const toggleShowKey = 'CmdOrCtrl + K'

app.on('ready', () => { startLanding(); });

ipcMain.on('decrypt-test', (event, data) => {
  var test = data.data;
  var password = data.password;
  var nextOp = data.next;

  try {
    if(test.encrypted) {
      var testPlain = CryptoJS.AES.decrypt(test.payload, password).toString(CryptoJS.enc.Utf8);
      test = JSON.parse(testPlain) as Test;
    }
    console.log('File data:', test);
    landingWindow.webContents.send('decrypted-test', {test: test, next: nextOp});
  } catch(e) {
    console.log((e as any).message);
    landingWindow.webContents.send('bad-password', nextOp);
    console.log('Wrong pass on edit');
  }
})

ipcMain.on('open-test', (event, data) => {
  dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'JSON Files', extensions: ['json'] }
    ]
  })
    .then(result => {
      if (!result.canceled && result.filePaths.length > 0) {
        // Read the selected JSON file
        const filePath = result.filePaths[0];
        const fileData = fs.readFileSync(filePath, 'utf-8');
        var jsonData = JSON.parse(fileData);
        // const password = data.password;
        
        console.log('File data:', jsonData);
        landingWindow.webContents.send('edit-test', jsonData);        
      }
    })
    .catch(err => {
      console.log('Error:', err);
    });
})

ipcMain.on('save-file', (event, data) => {
    saveJSON(data, 'Test');
});

function saveJSON(data: any, type: 'Test' | 'Result') {
  const options = {
    title: 'Save JSON File',
    buttonLabel: 'Save',
    filters: [
      { name: 'JSON', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  };

  if(type == 'Result') data = {...data, password: testRunner.test.password, correctAnswers: testRunner.evaluateCorrectAnswers(testRunner.userAnswers), passed: testRunner.evaluateCorrectAnswers(testRunner.userAnswers) >= testRunner.test.passing}
  console.log('Saving data: ' + JSON.stringify(data));

  var strData = JSON.stringify(data, null, 2);
  if(data.password != undefined && data.password != '') {
    var encrypted = CryptoJS.AES.encrypt(strData, data.password);
    data = (type == 'Test') ? { encrypted: true, type: type, name: data.name, description: data.description, payload: encrypted.toString() } :  { encrypted: true, type: type, passed: data.passed, payload: encrypted.toString() };
  }

  dialog.showSaveDialog(options).then(result => {
    if (!result.canceled) {
      const filePath = result.filePath;
      const jsonData = JSON.stringify(data, null, 2);
      fs.writeFile(filePath, jsonData, (err: any) => {
        if (err) {
          console.log('Error saving file:', err);
        } else {
          console.log('File saved successfully:', filePath);
        }
      });
    }
  }).catch(err => {
    console.log(err);
  });
}

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
  var correctAns = testRunner.evaluateCorrectAnswers(data);
  console.log('Correct answers: ' + correctAns);
  landingWindow.webContents.send('app-command', {func: 'showResult', passing: testRunner.test.passing <= correctAns, answers: testRunner.evaluateCorrectAnswers(data)});
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
  if(data.func == 'startTest') {

    try {
      var testData = data.data;
      var testPass = data.password;
      if(testData.encrypted) {
        var testPlain = CryptoJS.AES.decrypt(testData.payload, testPass).toString(CryptoJS.enc.Utf8);
        testData = JSON.parse(testPlain) as Test;
      }
      landingWindow.webContents.send('exec-test', true);
      startTest(testData as Test);
    } catch (ex) {
      console.log((ex as any).message);
      landingWindow.webContents.send('bad-password', 'Wrong password');
      console.log('Wrong pass');
    }
  }
  if(data.func == 'saveResult') saveJSON(data.data, 'Result');
  if(data.func == 'sendResult') 
  if(data.func == 'processTest') console.log('P')
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