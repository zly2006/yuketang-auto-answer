chrome.storage.local.get('problems', (data) => {
    const problems = data.problems;
    if (problems) {
        console.log('从 storage 中获取到雨课堂问题信息: ', problems);
        const problemsElement = document.getElementById('problems');
        if (problemsElement) {
            problemsElement.innerText = JSON.stringify(problems, null, 2);
        }
    }
});
chrome.storage.local.get(['currentProblem', 'currentAnswers'], (data) => {
    const { currentProblem, currentAnswers } = data;
    const statusElement = document.getElementById('status');
    if (statusElement) {
        statusElement.innerHTML = currentProblem
            ? `当前问题: ${currentProblem} <br/> 答案: ${JSON.stringify(currentAnswers)}`
            : `未找到问题，或不在答题页面`;
    }
});