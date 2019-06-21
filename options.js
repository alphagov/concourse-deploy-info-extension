let githubOAuthTokenEl  = document.getElementById('github-oauth-token')
let githubOrgNameEl     = document.getElementById('github-org-name')
let concourseBaseUrlEl  = document.getElementById('concourse-base-url')
let concourseTeamNameEl = document.getElementById('concourse-team-name')

let loadOptions = () => {
  chrome.storage.local.get([
    'githubOAuthToken',
    'githubOrgName',
    'concourseBaseUrl',
    'concourseTeamName'
  ], data => {
    githubOAuthTokenEl.value = data.githubOAuthToken || ''
    githubOrgNameEl.value = data.githubOrgName || 'alphagov'
    concourseBaseUrlEl.value = data.concourseBaseUrl || 'https://cd.gds-reliability.engineering'
    concourseTeamNameEl.value = data.concourseTeamName || ''
  })
}

let saveOptions = () => {
  let githubOAuthToken  = githubOAuthTokenEl.value
  let githubOrgName     = githubOrgNameEl.value
  let concourseBaseUrl  = concourseBaseUrlEl.value
  let concourseTeamName = concourseTeamNameEl.value

  chrome.storage.local.set({
    githubOAuthToken : githubOAuthToken,
    githubOrgName : githubOrgName,
    concourseBaseUrl : concourseBaseUrl,
    concourseTeamName : concourseTeamName
  }, () => { setTimeout(() => { document.location.href = '/popup.html' }, 750) })
}

document.getElementById('save').addEventListener('click', saveOptions)

loadOptions()
