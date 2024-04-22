chrome.runtime.onMessage.addListener((message: any, sender, sendResponse) => {
    if (message.type === 'getProblems') {
        chrome.storage.local.get('problems').then(p => console.log('request data:',p));
        chrome.storage.local.get('problems').then(sendResponse);
        return true;
    }
});