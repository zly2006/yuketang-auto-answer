// https://github.com/IOL0ol1/GetResponse
// MIT License
// Mofified by zly2006, add url to response data, add websocket support
(function (xhr) {

    var XHR = XMLHttpRequest.prototype;

    var open = XHR.open;
    var send = XHR.send;

    XHR.open = function (method, url) {
        this._method = method;
        this._url = url;
        return open.apply(this, arguments);
    };

    XHR.send = function (postData) {
        this.addEventListener('load', function () {
            console.log('[injected.js] sending xhr response to content script:', this._url, 'type:', typeof this.response);
            window.postMessage({ type: 'xhr', data: this.response, url: this._url }, '*');  // send to content script
        });
        return send.apply(this, arguments);
    };
})(XMLHttpRequest);

const { fetch: origFetch } = window;
window.fetch = async (...args) => {
    const response = await origFetch(...args);
    console.log('[injected.js] fetch request:', response.url, args);
    response
        .clone()
        .blob() // maybe json(), text(), blob()
        .then(data => {
            window.postMessage({ type: 'fetch', data: data, url: response.url }, '*'); // send to content script
            //window.postMessage({ type: 'fetch', data: URL.createObjectURL(data) }, '*'); // if a big media file, can createObjectURL before send to content script
        })
        .catch(err => console.error(err));
    return response;
};

// inject websocket onMessage on open() called
const wsOpen = WebSocket.prototype.open;
WebSocket.prototype.open = function (url, protocols) {
    this._url = url;
    console.log('[injected.js] websocket open:', url, protocols);
    this.addEventListener('message', function (event) {
        console.log('[injected.js] websocket message:', this._url, event.data);
        window.postMessage({ type: 'ws-message-received', data: event.data, url: this._url }, '*'); // send to content script
    });
    return wsOpen.apply(this, arguments);
};