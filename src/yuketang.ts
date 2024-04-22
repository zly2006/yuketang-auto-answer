try {
chrome.webRequest.onCompleted.addListener(
    (details) => {
        console.log(details);
    },
    { urls: ["*://*.yuketang.cn/*"] }
);
}
catch (e) {
    console.log(e);
}