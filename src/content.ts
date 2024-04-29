import { Settings } from "./background";

// inject injected script
const s = document.createElement("script");
s.src = chrome.runtime.getURL("injected.js");
s.onload = function () {
  s.remove();
};
(document.head || document.documentElement).appendChild(s);

type AjaxMessage = {
  url: string;
  type: "xhr" | "fetch" | "ws-message-received";
  data: Blob | ArrayBuffer | string | object | Document;
};

type Problem = {
  problemId: string;
  problemType: number;
  body: string;
  answers: string[];
  version: number;
};
let danmakuTimes: { [name: string]: number } = {};

// receive message from injected script
window.addEventListener("message", async function (e: MessageEvent<AjaxMessage>) {
  // console.log("收到消息: ", e.data);
  if (!e.data.url) return;
  const settings = (await chrome.storage.local.get("settings") as { settings: Settings; }).settings;
  if (!settings) return;
  if (e.data.url.includes("/api/v3/lesson/presentation/fetch") && settings.autoAnswer) {
    if (e.data instanceof Object) {
      console.log("收到雨课堂课件信息: ", e.data.url, e.data);

      const slides = JSON.parse(e.data.data as string).data.slides;
      const problems = slides
        .filter((slide: object) => Object.keys(slide).includes("problem"))
        .map(
          (slide: {
            problem: {
              problemId: string;
              problemType: number; // 1 单选 2 多选
              body: string;
              answers: string[];
              version: number;
            };
          }) => slide.problem,
        );
      chrome.storage.local.set({ problems });
      console.log("找到雨课堂问题信息: ", problems);
    }
  } else if (e.data.type == "ws-message-received") {
    const message = JSON.parse(e.data.data as string);
    let problemId: string | null = null;
    let lessonId: string | null = null;
    let danmu: string | null = null;
    if (message.op) {
      if (message.op == "unlockproblem") {
        problemId = message.problem.prob; // or sid / pres (same value)
        lessonId = message.lessonid;
      }
      if (message.op && message.op == "probleminfo") {
        problemId = message.problemid;
      }
      if (message.op == "newdanmu")
        danmu = message.danmu;
    }
    if (problemId && settings.autoAnswer) {
      console.log("解锁问题: ", problemId);
      if (settings.notificationSound) {
        const audio = new Audio(chrome.runtime.getURL("ping.mp3"));
        audio.play();
      }
      const problems = (await chrome.storage.local.get("problems") as { problems: Problem[]; }).problems;
      const problem = problems.find((p) => p.problemId == problemId);
      if (problem && settings.autoAnswerTypes.includes(problem.problemType)) {
        const number = problems.indexOf(problem) + 1;
        console.log("找到问题: ", problem);
        if (!problem.answers) {
          console.log("未找到答案，跳过");
          return;
        }
        chrome.storage.local.set({
          currentProblem: problem.body,
          currentAnswers: problem.answers
        });
        const postData = {
          problemId: problemId,
          problemType: problem.problemType,
          dt: Date.now(),
          result: problem.answers,
        };
        window.postMessage({ type: "answer", postData });
        chrome.storage.local.set({
          currentProblem: problem.body + " (答题助手已自动作答)",
        });
        this.setTimeout(() => {
          // reload
        }, 10000);
      }
    }
  }
});
