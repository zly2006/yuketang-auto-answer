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
