# 雨课堂自动答题

这是一个 Chrome 插件，由于雨课堂把题目答案放在了前端，所以我们可以自动操作。

雨课堂使用 HTTP 请求获取所有ppt和答案，使用 Websocket 进行实时通讯。

本拓展在 Websocket 收到 unlockproblem 通知时自动发送答案。
