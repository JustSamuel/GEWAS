const addedRules = []

function lookup (email) {
  const xmlHttp = new XMLHttpRequest()
  xmlHttp.onreadystatechange = function () {
    if (xmlHttp.readyState === 4 && xmlHttp.status === 200)
      parseResult(xmlHttp.responseText)
  }
  xmlHttp.open('GET', `http://localhost:3001/api/email/${email}/aliases`, true) // true for asynchronous
  xmlHttp.send(null)
  return false
}

function parseResult (result) {
  const JSONResult = JSON.parse(result)
  let resultDiv = document.getElementById('result')

  resultDiv.classList.remove(...resultDiv.classList);
  resultDiv.style.visibility = 'hidden'

  setTimeout(() => {
    resultDiv.style.visibility = 'visible'
    resultDiv.classList.add('fly_in_animation_results')
  }, 20)

  resultDiv.textContent = '';

  if (JSONResult.from === null) {
  //  email has no aliases
    return
  }

  resultDiv.classList.add('life-line')

  let children = 0
  let lastCount = 0

  JSONResult.from.forEach((alias) => {
    children += 1
    lastCount = parseAlias(document.getElementById('result'), alias)
    children += lastCount
  })

  addLifeLineStyling(resultDiv, children - lastCount)
}

function parseAlias (parent, alias) {
  var childrenCount = 0
  var lastCount = 0

  const parentDiv = document.createElement('div')
  const label = document.createElement('span')
  label.innerHTML = alias.to
  parentDiv.appendChild(label)
  parent.appendChild(parentDiv)

  if (alias.from !== null) {
    alias.from.forEach((fromAlias) => {
      childrenCount += 1
      lastCount = parseAlias(parentDiv, fromAlias)
      childrenCount += lastCount
    })
  }

  if (childrenCount > 0) {
    const count = childrenCount - lastCount
    addLifeLineStyling(parentDiv, count)
  }

  return childrenCount
}

function addLifeLineStyling(element, count) {
  element.classList.add('life-line')
  element.classList.add(`c${count}`)

  if (addedRules.indexOf(count) === -1) {
    const box = {}
    box.height = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--box-height').replace('px', ''))
    box.border = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--box-border').replace('px', ''))
    box.margin = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--box-margin-top').replace('px', ''))

    const height = box.margin + ((box.height + box.margin) * (count - 0.5)) - box.border * 2
    document.styleSheets[0].addRule(`.life-line.c${count}:before`, 'height: ' + height + 'px')
    addedRules.push(count)
  }
}