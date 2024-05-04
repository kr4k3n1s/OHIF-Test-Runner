import { Question } from "./Question";

export interface Test {
    name: string,
    description: string,
    questions: Question[],
    passing: Number,
}