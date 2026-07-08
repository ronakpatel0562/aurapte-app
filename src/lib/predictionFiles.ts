export interface PredictionFile {
  module: string;
  title: string;
  filename: string;
}

export const PREDICTION_FILES: PredictionFile[] = [
  { module: "This Month", title: "Exam This Month", filename: "Exam-This-Month.html" },
  { module: "Speaking", title: "Repeat Sentence", filename: "Repeat-Sentence.html" },
  { module: "Speaking", title: "Describe Image", filename: "Describe-Image.html" },
  { module: "Speaking", title: "Responding to Situation", filename: "Responding-to-Situation.html" },
  { module: "Speaking", title: "Answer Short Question", filename: "Answer-Short-Question.html" },
  { module: "Writing", title: "Write an Email", filename: "Write-an-Email.html" },
  { module: "Reading", title: "Fill in the Blanks", filename: "Fill-in-the-Blanks.html" },
  { module: "Listening", title: "Summarize Spoken Text", filename: "Summarize-Spoken-Text.html" },
  { module: "Listening", title: "Write from Dictation", filename: "Write-from-Dictation.html" },
];

export function getPredictionFile(filename: string): PredictionFile | undefined {
  return PREDICTION_FILES.find((f) => f.filename === filename);
}
