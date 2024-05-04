import { Question } from "../models/Question";
import { Test } from "../models/Test";

export function TestWindow(question: Question, test: Test, userAnswers: {questionID: string, answers: string[]}[]) {
    return (
        `data:text/html;charset=utf-8,
        <head>
            <title>Hi!</title>
        </head>
        <body id="mainBody" style="padding: 0; margin: 0;">
            <div style=" padding: 70px; text-align: left; padding-left: 20px; width: 25%; height: 90%; display: flex; flex-direction: column; justify-content: space-between;">
                <div id="testBody" style="padding: 16px; border-radius: 15px; background: rgb(255,255,255); border: 3px solid red; display: flex; flex-direction: column; gap: 10px; opacity: 1">
                    <img id="icon1" src="https://cdn.iconscout.com/icon/free/png-256/free-right-true-verify-perfect-trust-64-32776.png" style="display: none; width: 50px; height: 50px;" />
                    <img id="icon2" src="https://t3.ftcdn.net/jpg/04/21/60/12/360_F_421601274_EUYaZ0sOUgmTdWXBm3MbTRKXFczQpk3u.jpg" style="display: none; width: 50px; height: 50px;" />
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-size: 30px; font-weight: 800; font-family: Arial, Helvetica, sans-serif; margin-bottom: 15px">${test.name}</span>
                        <span style="font-size: 13px;font-family: Arial, Helvetica, sans-serif; color: grey;">${test.description}</span>
                        <span style="font-size: 13px;font-family: Arial, Helvetica, sans-serif; color: black; margin-top: 13px; font-weight: 600;">Total number of questions: ${test.questions.length}</span>
                        <div>
                            ${test.questions.map((quest, index) => {
                                return quest.id === question.id ? `<button style="padding: 10px; margin-top: 10px; border-radius: 5px; border-width: 0px; background-color: rgb(92, 152, 215);" onClick="showQuestion(${index})">${(index+1).toString().padStart(2, '0')}</button>`
                                                                : `<button style="padding: 10px; margin-top: 10px; border-radius: 5px; border-width: 0px; background-color: ${userAnswers.findIndex(ans => ans.questionID == quest.id && ans.answers.length > 0) > -1 ? "rgb(92, 152, 215)" : "rgb(200, 200, 200)"};" onClick="showQuestion(${index})">${(index+1).toString().padStart(2, '0')}</button>`
                            }).join('\n')}
                        </div>
                        <span id="text1"></span>
                    </div>
                    <div style="display: flex; flex-direction: column">
                        <span style="font-size: 18px;font-family: Arial, Helvetica, sans-serif; color: black; margin-top: 13px; font-weight: 900; color: grey;">Question ${test.questions.indexOf(question) + 1}</span>
                        <span style="font-size: 23px;font-family: Arial, Helvetica, sans-serif; color: black; margin-top: 3px; font-weight: 600;">${question.question}</span>
                        <div style="display: flex; flex-direction: column; justify: flex-start; margin-top: 20px">
                            ${question.answers.map((ans, index) => {
                                var qIndex = userAnswers.findIndex((ans) => ans.questionID == question.id)
                                return `<div><input type="checkbox" ${qIndex > -1 && userAnswers[qIndex].answers.indexOf(ans) > -1 ? 'checked' : ''} id="${ans}" name="${ans}" style="font-size: 13px;" onClick="markedAnswer('${ans}', ${question.correctAnswers.length},'${question.id}')"><label style="margin-left: 10px; font-size: 15px; font-family: Arial, Helvetica, sans-serif;">${ans}</label></div>`
                            }).join('\n')}
                        </div>
                    </div>
                    <div id="test_end" style="display: none;">
                            <p id="want_finish" style="color: grey; display: none; font-size: 15px; font-family: Arial, Helvetica, sans-serif;">Are you sure that you want finish this test?</p>
                            <p id="finish_not_answered" style="color: red; display: none; font-size: 15px; font-family: Arial, Helvetica, sans-serif;">You haven't answered all question, are you sure finishing test?</p>
                    </div>
                    <div style="display: flex; flex-direction: row; justify-content: space-between; margin-top: 25px;">
                        <button style="font-size: 13px; padding: 7px 15px 7px 15px; border-radius: 50px; border-width: 0px; font-weight: 600" onClick="prevQuestion()">Previous</button>
                        <button style="font-size: 13px; padding: 7px 15px 7px 15px; border-radius: 50px; border-width: 0px; font-weight: 600" onClick="${test.questions.findIndex(quest => quest.id == question.id) == test.questions.length - 1 ? "finishTest()" : "nextQuestion()"}">${test.questions.findIndex(quest => quest.id == question.id) == test.questions.length - 1 ? "Finish" : "Next"}</button>
                    </div>
                </div>
                <div style="padding: 16px; padding-bottom: 10px; border-radius: 15px; background: rgb(255,255,255); border: 3px solid red;">
                    <p style="font-size: 18px; font-family: Arial, Helvetica, sans-serif; color: black; font-weight: 900; color: grey;">To interact with test interface please click CMD + J</p>
                </div>
            </div>
            <script>
                const electron = require('electron');
                var answers = [${(() => {
                    var ansIndex = userAnswers.findIndex(ans => ans.questionID == question.id);
                    console.log('Index of existing answers is: ' + ansIndex);
                    return ansIndex > -1 ? userAnswers[ansIndex].answers.map(val => '"' + val + '"').join(',') : '';
                })()}];

                function markedAnswer(answerID, ansNum, questID) {

                    console.log('Answer index: ' + answers.indexOf(answerID))
                    electron.ipcRenderer.send('app-command', {
                        func: 'selectedAnswer',
                        qID: questID,
                        ansID: answerID,
                        selected: answers.indexOf(answerID) == -1
                    });

                    if(answers.indexOf(answerID) >= 0) {
                        answers = answers.filter((item, index) => item != answerID);
                    } else {
                        answers.push(answerID);
                    }

                    console.log(JSON.stringify(answers));
                    
                }

                function finishTest() {
                    if(document.getElementById('test_end').style.display == 'none') {
                        document.getElementById('test_end').style.display = 'block';
                        document.getElementById('${userAnswers.length == test.questions.length - 1 ? 'want_finish' : 'finish_not_answered'}').style.display = 'block';
                    } else {
                        electron.ipcRenderer.send('app-command', {
                            func: 'finishTest'
                        });
                    }
                }

                function nextQuestion() {
                    electron.ipcRenderer.send('app-command', { func: 'nextQuestion' });
                }

                function prevQuestion() {
                    electron.ipcRenderer.send('app-command', { func: 'prevQuestion' });
                }

                function showQuestion(index) {
                    electron.ipcRenderer.send('app-command', { func: 'showQuestion', index: index });
                }

                electron.ipcRenderer.on('focus-change', (e, state) => {
                   document.getElementById('testBody').style.opacity = (state) ? "1" : "0.3";
                });

                electron.ipcRenderer.on('visibility-change', (e, state) => {
                    if (document.getElementById('testBody').style.display) {
                        document.getElementById('testBody').style.display = null
                    } else {
                        document.getElementById('testBody').style.display = 'none'
                    }
                });

                electron.ipcRenderer.on('app-command', (e, state) => {
                    if(state.func == 'hidePermanently') document.getElementById('mainBody').style.display = 'none';
                });
            </script>
        </body>`);
}

/*

        data:text/html;charset=utf-8,
        <head>
          <title>Hi!</title>
        </head>
        <body style="padding: 0; margin: 0;">
          <div style="position: absolute; width: 30%; height: 100%; border: 4px solid red; background: rgba(255,255,255,0.1); box-sizing: border-box; pointer-events: none;"></div>
          <div style="padding-top: 50vh; text-align: left; padding-left: 20px; width: 30%;">
            <div style="padding: 16px; border-radius: 8px; background: rgb(255,255,255); border: 4px solid red; display: flex; flex-direction: column; gap: 10px;">
              <img id="icon1" src="https://cdn.iconscout.com/icon/free/png-256/free-right-true-verify-perfect-trust-64-32776.png" style="display: none; width: 50px; height: 50px;" />
              <img id="icon2" src="https://t3.ftcdn.net/jpg/04/21/60/12/360_F_421601274_EUYaZ0sOUgmTdWXBm3MbTRKXFczQpk3u.jpg" style="display: none; width: 50px; height: 50px;" />
              <div>
                <span>${question.question}</span>
                <span id="text1"></span>
              </div>
              <div>
                ${question.answers.map((ans, index) => {
                  console.log('Index: ' + index.toString() + ', Result: ' + question.correctAnswers.indexOf(index));
                  return `<button onClick="markedCorrect(${question.correctAnswers.indexOf(index) > -1}, ${question.correctAnswers.length}, '${question.id}')">${ans}</button>`
                })}
              </div>
            </div>
          </div>
          <script>
            const electron = require('electron');
            var correctAnswers = 0;
    
            function markedCorrect(isCorrect, ansNum, questID){
              if(isCorrect) document.getElementById("icon1").style.display = "block";
              else document.getElementById("icon2").style.display = "block";
    
              console.log('clicked');
              if(isCorrect) correctAnswers += 1;
              if(isCorrect && correctAnswers == ansNum) electron.ipcRenderer.send('app-command', {func: 'markedCorrect', qID: questID, correct: true});
              if(!isCorrect) electron.ipcRenderer.send('app-command', {func: 'markedCorrect', qID: questID, correct: false});
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
*/

/*
<!DOCTYPE html>

<head>
    <title>Hi!</title>
</head>

<body style="padding: 0; margin: 0;">
    <div style="position: absolute; width: 100%; height: 100%; box-sizing: border-box; pointer-events: none;"></div>
    <div style=" padding: 50px; text-align: left; padding-left: 20px; width: 50%; height: 100%;">
        <div style="padding: 16px; border-radius: 15px; background: rgb(255,255,255); border: 3px solid red; display: flex; flex-direction: column; gap: 10px;">
            <img id="icon1" src="https://cdn.iconscout.com/icon/free/png-256/free-right-true-verify-perfect-trust-64-32776.png" style="display: none; width: 50px; height: 50px;" />
            <img id="icon2" src="https://t3.ftcdn.net/jpg/04/21/60/12/360_F_421601274_EUYaZ0sOUgmTdWXBm3MbTRKXFczQpk3u.jpg" style="display: none; width: 50px; height: 50px;" />
            <div style="display: flex; flex-direction: column;">
                <span style="font-size: 30px; font-weight: 800; font-family: Arial, Helvetica, sans-serif; margin-bottom: 15px">Lung anatomy test #1</span>
                <span style="font-size: 13px;font-family: Arial, Helvetica, sans-serif; color: grey;">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi vestibulum est in molestie egestas. Aenean accumsan turpis vehicula, bibendum ex vel, sagittis dui. Sed augue felis, tempus id accumsan at, dignissim id arcu. Integer dapibus viverra dui, nec vulputate ex blandit eget. Etiam id mauris lectus.</span>
                <span style="font-size: 13px;font-family: Arial, Helvetica, sans-serif; color: black; margin-top: 13px; font-weight: 600;">Total number of questions: 15</span>
                <div>
                    <button style="padding: 10px; margin-top: 10px; border-radius: 5px; border-width: 0px; background-color: #5394fc">01</button>
                    <button style="padding: 10px; margin-top: 10px; border-radius: 5px; border-width: 0px;">02</button>
                    <button style="padding: 10px; margin-top: 10px; border-radius: 5px; border-width: 0px;">03</button>
                    <button style="padding: 10px; margin-top: 10px; border-radius: 5px; border-width: 0px;">04</button>
                    <button style="padding: 10px; margin-top: 10px; border-radius: 5px; border-width: 0px;">05</button>
                    <button style="padding: 10px; margin-top: 10px; border-radius: 5px; border-width: 0px;">06</button>
                    <button style="padding: 10px; margin-top: 10px; border-radius: 5px; border-width: 0px;">07</button>
                    <button style="padding: 10px; margin-top: 10px; border-radius: 5px; border-width: 0px;">08</button>
                    <button style="padding: 10px; margin-top: 10px; border-radius: 5px; border-width: 0px;">09</button>
                    <button style="padding: 10px; margin-top: 10px; border-radius: 5px; border-width: 0px;">10</button>
                    <button style="padding: 10px; margin-top: 10px; border-radius: 5px; border-width: 0px;">11</button>
                    <button style="padding: 10px; margin-top: 10px; border-radius: 5px; border-width: 0px;">12</button>
                    <button style="padding: 10px; margin-top: 10px; border-radius: 5px; border-width: 0px;">13</button>
                    <button style="padding: 10px; margin-top: 10px; border-radius: 5px; border-width: 0px;">14</button>
                    <button style="padding: 10px; margin-top: 10px; border-radius: 5px; border-width: 0px;">15</button>
                </div>
                <span id="text1"></span>
            </div>
            <div style="display: flex; flex-direction: column">
                <span style="font-size: 18px;font-family: Arial, Helvetica, sans-serif; color: black; margin-top: 13px; font-weight: 800; color: grey;">Question 1</span>
                <span style="font-size: 23px;font-family: Arial, Helvetica, sans-serif; color: black; margin-top: 5px; font-weight: 600;">On the shown xray image we can see patient with pneumonia, on what lung part is inflammation located?</span>
                <div>
                    <button> Answer1 </button>
                    <button> Answer1 </button>
                    <button> Answer1 </button>
                </div>
            </div>
        </div>
    </div>
    <script>
        const electron = require('electron');
        var correctAnswers = 0;

        function markedCorrect(isCorrect, ansNum, questID) {
            if (isCorrect) document.getElementById("icon1").style.display = "block";
            else document.getElementById("icon2").style.display = "block";

            console.log('clicked');
            if (isCorrect) correctAnswers += 1;
            if (isCorrect && correctAnswers == ansNum) electron.ipcRenderer.send('app-command', {
                func: 'markedCorrect',
                qID: questID,
                correct: true
            });
            if (!isCorrect) electron.ipcRenderer.send('app-command', {
                func: 'markedCorrect',
                qID: questID,
                correct: false
            });
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
*/