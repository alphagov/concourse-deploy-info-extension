let saveOptions = () => {
  let githubOAuthToken  = document.getElementById('github-oauth-token').value
  let githubOrgName     = document.getElementById('github-org-name').value
  let concourseBaseUrl  = document.getElementById('concourse-base-url').value
  let concourseTeamName = document.getElementById('concourse-team-name').value

  chrome.storage.local.set({
    githubOAuthToken : githubOAuthToken,
    githubOrgName : githubOrgName,
    concourseBaseUrl : concourseBaseUrl,
    concourseTeamName : concourseTeamName
  }, () => {
    let messageElement = document.getElementById('message')
    setTimeout(() => { messageElement.textContent = 'Options saved' }, 750)
  })
}

document.getElementById('save').addEventListener('click', saveOptions)
