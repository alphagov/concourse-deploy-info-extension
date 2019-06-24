chrome.runtime.onInstalled.addListener(() => {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [new chrome.declarativeContent.PageStateMatcher({
        pageUrl: { hostEquals: 'cd.gds-reliability.engineering' },
      })],
      actions: [new chrome.declarativeContent.ShowPageAction()]
    }])
  })
})
