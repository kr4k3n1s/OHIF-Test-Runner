import { BrowserWindow, shell } from "electron";
import { TestWindow } from "../html/TestWindow";
import { Question } from "../models/Question";
import { Test } from "../models/Test";
import * as test1 from '../tests/test1.json';
import { ResultWindow } from "../html/ResultWindow";



export class TestRunner {
  window: BrowserWindow
  test: Test;
  onCompletion: (data: any) => void;
  questionIndex: number = 0;
  userAnswers: {questionID: string, answers: string[]}[] = [];

  constructor(test: Test, window: BrowserWindow, onCompletion: (data: any) => void) {
    this.test = test;
    this.window = window;
    this.onCompletion = onCompletion;
  }

  loadQuestion(window: BrowserWindow, question: Question, test: Test) {
    const html = TestWindow(question, test, this.userAnswers);
    window.loadURL(html);
  }

  questionAnswered(event: Electron.IpcMainEvent, data: any) {
      var questionIndex = this.userAnswers.findIndex((ans) => data.qID == ans.questionID);
      console.log('Selected: ' + data.selected + ', qIndex: ' + questionIndex);
      if(data.selected && questionIndex > -1) this.userAnswers[questionIndex].answers.push(data.ansID);
      else if(data.selected) this.userAnswers.push({questionID: data.qID, answers: [data.ansID]});
      else if(this.userAnswers.length > questionIndex && this.userAnswers[questionIndex].answers != undefined) this.userAnswers[questionIndex].answers = this.userAnswers[questionIndex].answers.filter((ans) => ans != data.ansID);
  }

  showQuestion(index: number) {
    this.questionIndex = index;
    shell.openExternal(this.test.questions[index].url);
    setTimeout(() => this.loadQuestion(this.window, this.test.questions[index], this.test), 1000);
  }

  runnerResponseCallback = (event: Electron.IpcMainEvent, data: any) => {
    console.log('Data received: ' + JSON.stringify(data));
    if(data.func == 'selectedAnswer') this.questionAnswered(event, data);
    if(data.func == 'nextQuestion') this.showQuestion((this.questionIndex < this.test.questions.length - 1) ? ++this.questionIndex : this.questionIndex);
    if(data.func == 'prevQuestion') this.showQuestion((this.questionIndex > 0) ? --this.questionIndex : 0);
    if(data.func == 'showQuestion') this.showQuestion(data.index);
    if(data.func == 'finishTest') this.onCompletion(this.userAnswers);
  }

}



