chrome.storage.local.get('problems', (data) => {
    const problems = data.problems;
    if (problems) {
        console.log('从 storage 中获取到雨课堂问题信息: ', problems);
    }
    const problemsElement = document.getElementById('problems');
    if (problemsElement) {
        problemsElement.innerText = JSON.stringify(problems, null, 2);
    }
});