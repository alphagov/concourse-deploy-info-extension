const environments = ['staging', 'production']
const localStorageKey = 'concourseDiffData'
const configKeys = ['githubOAuthToken', 'githubOrgName', 'concourseBaseUrl', 'concourseTeamName']

let config = {}
let concourseData = {}

let repoSelectEl = document.getElementById('repo-name')
let diffContainer = document.getElementById('diff-container')

let initialise = () => {
  initialiseConfig()

  repoSelectEl.onchange = (element) => {
    let repoName = element.target.options[element.target.selectedIndex].value
    if (repoName === 'default') return;

    let concourseJobsUrl = `${config.concourseBaseUrl}/api/v1/teams/${config.concourseTeamName}/pipelines/deploy/jobs`

    getJSON({ url: concourseJobsUrl })
      .then(json => {
        if (json == null) return

        populateConcourseBuildUrls(json, repoName)

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

let initialiseRepoSelect = () => {
  Object.keys(concourseData).forEach(key => {
    let selectOption = document.createElement('option')
    selectOption.value = key
    selectOption.label = key
    repoSelectEl.appendChild(selectOption)
  })
}

let initialiseConfig = () => {
  chrome.storage.local.get(configKeys, (data) => {
    for (var key of configKeys) {
      if (data[key] == null) return document.location.href = '/options.html'
      config[key] = data[key]
    }

    getJSON({ url: `data/${config.concourseTeamName}.json` })
      .then(json => {
        concourseData = json
        initialiseRepoSelect()
      })
  })
}

let renderDiff = diffData => {
  let truncate = (str) => { return str.substring(0, 70) + '...' }
  diffContainer.innerHTML = ''

  if (diffData.commits.length === 0) {
    renderMessage('No difference between deployments')
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
    diffContainer.style.display = 'table'
  }
}

let renderMessage = message => {
  diffContainer.innerHTML = message
  diffContainer.style.display = 'block'
}

let populateConcourseBuildUrls = (json, repoName) => {
  for (var env of environments) {
    let job = json.find((item) => { return item.name === concourseData[repoName][env].name })
    if (job != null && job.finished_build != null) {
      concourseData[repoName][env].buildUrl = `${config.concourseBaseUrl}${job.finished_build.api_url}/resources`
    }
  }
}

let fetchAndRenderDiff = repoName => {
  let promises = environments.map(env => fetchBuildCommitSha(repoName, env))
  Promise.all(promises)
    .then((shas) => {
      getJSON({
          url : githubCompareUrl(repoName, shas[1], shas[0]),
          headers : { 'Authorization' : `token ${config.githubOAuthToken}` }
        })
        .then(json => {
          concourseData[repoName].commits = json.commits
          chrome.storage.local.set({ localStorageKey : concourseData[repoName] }, () => {
            renderDiff(concourseData[repoName])
          })
        })
    })
    .catch(e => {
      renderMessage('One or more environments has missing build data')
    })
}

let fetchBuildCommitSha = (repoName, env) => {
  return new Promise((resolve, reject) => {
    let buildUrl = concourseData[repoName][env].buildUrl
    if (buildUrl == null) {
      reject(null)
    } else {
      getJSON({ url : concourseData[repoName][env].buildUrl })
        .then(json => {
          let input = json.inputs.find((item) => { return item.name === 'src' })
          resolve(input.version.ref)
        })
    }
  })
}

/**
 * Make an GET request and return response as JSON.
 */
let getJSON = obj => {
  return fetch(obj.url, { method: 'GET', headers: obj.headers })
    .then(response => {
      if (response.ok) {
        return response.json()
      } else {
        throw new Error(`GET ${obj.url}, status: ${response.status}`)
      }
    })
    .catch(e => {
      renderMessage(`Error requesting data:\n${e}`)
    })
}


let githubCompareUrl = (repoName, from, to) => {
  return `https://api.github.com/repos/${config.githubOrgName}/${repoName}/compare/${from}...${to}`
}

initialise()
