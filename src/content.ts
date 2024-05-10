import { Settings } from "./background";

// inject injected script
const s = document.createElement("script");
s.src = chrome.runtime.getURL("injected.js");
s.onload = function () {
  s.remove();
};
(document.head || document.documentElement).appendChild(s);

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

function init() {
  const button = document.createElement("button");
  button.style.position = "fixed";
  button.style.top = "10px";
  button.style.left = "10px";
  button.style.background = "#639ef4";
  button.style.height = "30px";
  button.style.color = "white";
  button.style.padding = "0 10px";
  button.textContent = "点击此处允许播放提醒音";
  button.onclick = () => {
    chrome.storage.local.set({ notificationSound: true });
    button.remove();
  };
  document.children[0]?.appendChild(button);
  console.log("初始化按钮完成");
}

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
      init();
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
        try {
          const audio = new Audio(chrome.runtime.getURL("ping.mp3"));
          audio.play();
          await delay(500);
        } catch (e) {
          console.error(e);
        }
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
        if (problem.problemType === 1 || problem.problemType === 2) {
          try {
            await delay(100);
            try {
              const slides = this.document.getElementsByClassName("timeline__item");
              (slides[slides.length - 1] as HTMLElement).click();
            } catch (e) {
              console.error('Exception finding slide', e);
            }
            await delay(100);
            const button = this.document.getElementsByClassName("submit-btn")[0] as HTMLButtonElement;
            if (!button) {
              throw Error("未找到提交按钮");
            }
            const options = document.getElementsByClassName('options-label');
            let answers = problem.answers;
            for (let option of options) {
              const element = option as HTMLElement;
              if (answers.includes(element.dataset.option as string)) {
                element.click();
                answers = answers.filter((a) => a !== element.dataset.option);
              }
            }
            if (answers.length > 0) {
              console.error("未找到所有答案, Missing:", answers);
              return;
            }
            button.click();
          } catch (e) {
            console.error('Exception using interaction', e);
          }
        }
        else {
          try {
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
          } catch (e) {
            console.error('Exception using post method', e);
          }
          this.setTimeout(() => {
            // reload
          }, 10000);
        }
      }
    }
  }
});
