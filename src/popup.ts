import { Settings } from "./background";

chrome.storage.local.get("problems", (data) => {
  const problems = data.problems;
  if (problems) {
    console.log("从 storage 中获取到雨课堂问题信息: ", problems);
    const problemsElement = document.getElementById("problems");
    if (problemsElement) {
      problemsElement.innerText = JSON.stringify(problems, null, 2);
    }
  }
});
chrome.storage.local.get(["currentProblem", "currentAnswers"], (data) => {
  const { currentProblem, currentAnswers } = data;
  const statusElement = document.getElementById("status");
  if (statusElement) {
    statusElement.innerHTML = currentProblem
      ? `当前问题: ${currentProblem} <br/> 答案: ${JSON.stringify(currentAnswers)}`
      : `未找到问题，或不在答题页面`;
  }
});
document.getElementById("testSound")?.addEventListener("click", () => {
  console.log("测试声音");
  const audio = new Audio(chrome.runtime.getURL("ping.mp3"));
  audio.play();
});
const settingForm = document.forms.namedItem("settings");
if (settingForm) {
  chrome.storage.local.get("settings", (data) => {
    const settings = data.settings as Settings;
    if (settings) {
      settingForm.autoAnswer.checked = settings.autoAnswer;
      settingForm.autoDanmaku.value = settings.autoDanmaku.toString();
      settingForm.notificationSound.checked = settings.notificationSound;
    }
  });
  settingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const settings = {
      autoAnswer: settingForm.autoAnswer.checked,
      autoDanmaku: parseInt(settingForm.autoDanmaku.value),
      notificationSound: settingForm.notificationSound.checked,
    };
    chrome.storage.local.set({ settings }, () => {
      console.log("保存设置: ", settings);
      alert("保存成功, 请刷新页面生效");
    });
  });
}
