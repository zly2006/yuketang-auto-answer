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

// receive message from injected script
window.addEventListener("message", function (e: MessageEvent<AjaxMessage>) {
  console.log("收到消息: ", e.data);
  if (!e.data.url) return;
  if (e.data.url.includes("/api/v3/lesson/presentation/fetch")) {
    if (e.data instanceof Object) {
      console.log("收到雨课堂问题信息: ", e.data);
      console.log("url=", e.data.url);

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
    if (message.op && message.op == "unlockproblem") {
      problemId = message.problem.prob; // or sid / pres (same value)
    }
    if (message.op && message.op == "probleminfo") {
      problemId = message.problemid;
    }
    if (problemId) {
      console.log("解锁问题: ", problemId);
      chrome.storage.local.get("problems", (data) => {
        console.log("从本地存储中获取问题: ", data);
        const problems = data.problems as {
          problemId: string;
          problemType: number;
          body: string;
          answers: string[];
          version: number;
        }[];
        const problem = problems.find((p) => p.problemId == problemId);
        if (problem) {
          console.log("找到问题: ", problem);
          chrome.storage.local.set({ currentProblem: problem.body });
          chrome.storage.local.set({ currentAnswers: problem.answers });
          fetch("https://changjiang.yuketang.cn/api/v3/lesson/problem/answer", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              problemId: problemId,
              problemType: problem.problemType,
              dt: Date.now(),
              result: problem.answers,
            }),
          });
          window.postMessage({
            type: "answer",
            data: {
              problemId,
              problemType: problem.problemType,
              dt: Date.now(),
              result: problem.answers,
            },
          });
          this.window.location.reload();
          chrome.storage.local.set({
            currentProblem: problem.body + " (答题助手已自动作答)",
          });
        }
      });
    }
    // answer POST https://changjiang.yuketang.cn/api/v3/lesson/problem/answer
    //  {"problemId":"1140576432016954752","problemType":1,"dt":1713806598918,"result":["A"]}
  }
});
