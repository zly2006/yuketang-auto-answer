// inject injected script
const s = document.createElement('script');
s.src = chrome.runtime.getURL('injected.js');
s.onload = function () {
    (s).remove();
};
(document.head || document.documentElement).appendChild(s);

type AjaxMessage = {
    url: string;
    type: 'xhr' | 'fetch' | 'ws-message-received';
    data: Blob | ArrayBuffer | string | object | Document;
}

// receive message from injected script
window.addEventListener('message', function (e: MessageEvent<AjaxMessage>) {
    if (e.data.url.includes("/api/v3/lesson/presentation/fetch")) {
        if (e.data instanceof Object) {
            console.log('收到雨课堂问题信息: ', e.data);
            console.log('url=', e.data.url);

            const slides = JSON.parse(e.data.data as string).data.slides;
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
            chrome.storage.local.set({ problems });
            console.log('找到雨课堂问题信息: ', problems);
        }
    }
    else if (e.type == 'ws-message-received') {
        // todo
        // answer POST https://changjiang.yuketang.cn/api/v3/lesson/problem/answer
        //  {"problemId":"1140576432016954752","problemType":1,"dt":1713806598918,"result":["A"]}
    }
});
