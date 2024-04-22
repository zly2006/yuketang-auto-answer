chrome.webRequest.onCompleted.addListener(
    (details) => {
        if (details.url.includes("yuketang.cn/api/v3/lesson/presentation/fetch")) {
            details.requestId
        }
        const allSlides =
            console.log(details);
        return
    },
    { urls: ["*://*.yuketang.cn/*"], types: ["xmlhttprequest"] },
    ["responseHeaders"]
);
chrome.runtime.onMessage.addListener((message: any, sender, sendResponse) => {
    if (message.type === 'getProblems') {
        chrome.storage.local.get('problems').then(p => console.log('request data:',p));
        chrome.storage.local.get('problems').then(sendResponse);
        return true;
    }
});