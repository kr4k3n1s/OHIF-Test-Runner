import { BrowserWindow } from "electron";
import { TestResult } from '../models/TestResult';

export function ResultWindow(window: BrowserWindow, result: TestResult) {
    window.loadURL(`data:text/html;charset=utf-8,
      <head>
        <title>Hi!</title>
      </head>
      <body style="padding: 0; margin: 0;">
        <div style="position: absolute; width: 30%; height: 100%; border: 4px solid red; background: rgba(255,255,255,0.1); box-sizing: border-box; pointer-events: none;"></div>
        <div style="padding-top: 50vh; text-align: left; padding-left: 20px; width: 30%;">
          <div style="padding: 16px; border-radius: 8px; background: rgb(255,255,255); border: 4px solid red; display: flex; flex-direction: column; gap: 10px;">
            <img id="icon1" src="https://cdn.iconscout.com/icon/free/png-256/free-right-true-verify-perfect-trust-64-32776.png" style="display: none; width: 50px; height: 50px;" />
            <div>
              <span>Nice! You have asnwered all questions!</span>
              <span id="text1"></span>
              <span>Correct answers ${result.correctAnswers} / ${result.questions}</span>
            </div>
            <div>
              <button onClick="finish()">Finish</button>
            </div>
          </div>
        </div>
        <script>
          const electron = require('electron');
          var correctAnswers = 0;
  
          function markedCorrect(isCorrect, ansNum, questID){
            document.getElementById("icon1").style.display = "block";
            console.log('clicked');
            if(isCorrect) correctAnswers += 1;
            if(isCorrect && correctAnswers == ansNum) electron.ipcRenderer.send('app-command', {func: 'markedCorrect', qID: questID, correct: true});
            if(!isCorrect) electron.ipcRenderer.send('app-command', {func: 'markedCorrect', qID: questID, correct: false});
          }
  
          function finish() {
            electron.ipcRenderer.send('app-command', {func: 'finish'});
          }
  
          // electron.ipcRenderer.on('focus-change', (e, state) => {
          //   document.getElementById('text1').textContent = (state) ? ' (overlay is clickable) ' : 'clicks go through overlay'
          // });
  
          electron.ipcRenderer.on('visibility-change', (e, state) => {
            if (document.body.style.display) {
              document.body.style.display = null
            } else {
              document.body.style.display = 'none'
            }
          });
        </script>
      </body>
    `)
  }