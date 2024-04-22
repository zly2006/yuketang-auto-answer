console.log('content script start');

// inject injected script
const s = document.createElement('script');
s.src = chrome.runtime.getURL('injected.js');
s.onload = function () {
    (s).remove();
};
(document.head || document.documentElement).appendChild(s);

type AjaxMessage = {
    url: string;
    type: string;
    data: Blob;
}

// receive message from injected script
window.addEventListener('message', function (e: MessageEvent<AjaxMessage>) {
    console.log('content script received:', e.data.url, e.data.type, e.data.data);
});