chrome.webRequest.onCompleted.addListener(
    (details) => {
        console.log(details);
    },
    { urls: [ "*://*.yuketang.cn/*"] }
);