const githubTeam = 'alphagov'
const concourseTeam = 'govwifi'
const environments = ['staging', 'production']
const localStorageKey = 'concourseDiffData'

// FIXME : This should come from settings/config
const githubOAuthToken = 'xxxxxxxxxxxxxxxxxxxxxxxxxxx'

const githubApiBaseUrl = `https://api.github.com/repos/${githubTeam}/`
const concourseBaseUrl = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
const concourseJobsUrl = `${concourseBaseUrl}/api/v1/teams/${concourseTeam}/pipelines/deploy/jobs`

// TODO : Deploy job info should be in config. It would be ideal to get all team and project specifics from config.
let concourseData = {
  'govwifi-admin' : {
    staging : {
      name : 'Admin Staging Deploy'
    },
    production : {
      name : 'Admin Production Deploy'
    }
  },
  'govwifi-user-signup-api' : {
    staging : {
      name : 'User Signup API Staging Deploy'
    },
    production : {
      name: 'User Signup API Production Deploy'
    }
  },
  'govwifi-logging-api' : {
    staging : {
      name : 'Logging API Staging Deploy'
    },
    production : {
      name : 'Logging API Production Deploy'
    }
  }
}

let initialise = () => {
  let compareButtons = document.getElementsByClassName('compare-releases')

  for (var compareButton of compareButtons) {
    compareButton.onclick = (element) => {
      let repoName = element.target.id
      getJSON({ url: concourseJobsUrl })
        .then(data => {
          populateConcourseBuildUrls(data, repoName)

          chrome.storage.local.get(localStorageKey, data => {
            if (data !== null && data[repoName] === concourseData[repoName]) {
              renderDiff(data[repoName])
            } else {
              fetchAndRenderDiff(repoName)
            }
          })
        })
    }
  }
}

let renderDiff = diffData => {
  let diffContainer = document.getElementById('diff-container')
  let truncate = (str) => { return str.substring(0, 75) + '...' }
  diffContainer.innerHTML = ''

  if (diffData.commits.length === 0) {
    let messageElement = document.createElement('div')
    messageElement.textContent = 'No difference between deployments'
    diffContainer.appendChild(messageElement)
  } else {
    for (var commit of diffData.commits) {
      let item = document.createElement('div')
      let link = document.createElement('a')
      link.textContent = truncate(commit.commit.message)
      link.href = commit.html_url
      link.target = '_blank'
      item.appendChild(link)
      diffContainer.appendChild(item)
    }
  }

  diffContainer.style.display = 'table'
}

let populateConcourseBuildUrls = (json, repoName) => {
  for (var env of environments) {
    let job = json.find((item) => { return item.name === concourseData[repoName][env].name })
    if (job != null) {
      concourseData[repoName][env].buildUrl = `${concourseBaseUrl}${job['finished_build']['api_url']}/resources`
    }
  }
}

let fetchAndRenderDiff = repoName => {
  let promises = environments.map(env => fetchBuildCommitSha(repoName, env))
  Promise.all(promises)
    .then((shas) => {
      getJSON({
          url : githubCompareUrl(repoName, shas[1], shas[0]),
          headers : { 'Authorization' : `token ${githubOAuthToken}` }
        })
        .then(json => {
          concourseData[repoName].commits = json.commits
          // Save to local storage and render
          chrome.storage.local.set({ localStorageKey : concourseData[repoName] }, () => {
            renderDiff(concourseData[repoName])
          })
        })
    })
}

let fetchBuildCommitSha = (repoName, env) => {
  return new Promise((resolve) => {
    getJSON({ url : concourseData[repoName][env].buildUrl })
      .then(json => {
        let input = json.inputs.find((item) => { return item.name === 'src' })
        resolve(input.version.ref)
    })
  })
}

let getJSON = obj => {
  return new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest()
    xhr.open('GET', obj.url, true)
    if (obj.headers) {
      Object.keys(obj.headers).forEach(key => {
        xhr.setRequestHeader(key, obj.headers[key])
      })
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText))
      } else {
        reject(xhr.statusText)
      }
    }
    xhr.onerror = () => reject(xhr.statusText)
    xhr.send()
  })
}

let githubCompareUrl = (repoName, from, to) => {
  return `${githubApiBaseUrl}${repoName}/compare/${from}...${to}`
}

initialise()
