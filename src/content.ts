// inject injected script
const s = document.createElement('script');
s.src = chrome.runtime.getURL('injected.js');
s.onload = function () {
    (s).remove();
};
(document.head || document.documentElement).appendChild(s);

type AjaxMessage = {
    url: string;
    type: 'xhr' | 'fetch';
    data: Blob;
}

// receive message from injected script
window.addEventListener('message', function (e: MessageEvent<AjaxMessage>) {
    if (e.data.url.includes("yuketang.cn/api/v3/lesson/presentation/fetch")) {
        e.data.data.text().then((text) => {
            const slides = JSON.parse(text).title.slides;
            const problems = slides
                .filter((slide: object) => Object.keys(slide).includes('problem'))
                .map((slide: {
                    problem: {
                        problemId: string;
                        problemType: number; // 1 单选 2 多选
                        body: string;
                        answers: string[];
                        version: number;
                    }
                }) => slide.problem);
            console.log('找到雨课堂问题信息: ', problems);
        });
    }
});