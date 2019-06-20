const githubApiBaseUrl = 'https://api.github.com/repos/alphagov/'
const concourseBaseUrl = 'https://cd.gds-reliability.engineering'
const concourseJobsUrl = `${concourseBaseUrl}/api/v1/teams/govwifi/pipelines/deploy/jobs`
const environments = ['staging', 'production']

// TODO : deploy job info should be in config. It would be ideal to get all team and project specifics from config.
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
};

let githubData = {
  'oauthToken' : ''
}

let initialise = function() {
  let compareButtons = document.getElementsByClassName('compare-releases')

  for (var compareButton of compareButtons) {
    compareButton.onclick = (element) => {
      let repoName = element.target.id
      req({ url: concourseJobsUrl })
        .then(data => {
          populateConcourseBuildUrls(data, repoName)
          // TODO: compare the urls to those in storage
          fetchGithubCommits(repoName)
        })
    }
  }
}

let populateConcourseBuildUrls = (data, repoName) => {
  let json = JSON.parse(data)
  for (var env of environments) {
    let job = json.find((item) => {
      return item.name === concourseData[repoName][env].name
    })
    if (job != null) {
      concourseData[repoName][env].buildUrl = `${concourseBaseUrl}${job['finished_build']['api_url']}/resources`
    }
  }
}

let fetchGithubCommits = repoName => {
  let promises = environments.map(env => fetchBuildCommitSha(repoName, env))
  Promise.all(promises)
    .then((shas) => {
      req({
          url : githubCompareUrl(repoName, shas[1], shas[0]),
          headers : { 'Authorization' : `token ${githubData.oauthToken}` }
        })
        .then(data => {
          let json = JSON.parse(data)
          githubData[repoName].commits = json.commits
        })
    })
}

let fetchBuildCommitSha = (repoName, env) => {
  return new Promise((resolve) => {
    req({ url : concourseData[repoName][env].buildUrl })
      .then(data => {
        let json = JSON.parse(data)
        let input = json.inputs.find((item) => { return item.name === 'src' })
        resolve(input.version.ref)
    })
  })
}

let req = obj => {
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
        resolve(xhr.responseText)
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
