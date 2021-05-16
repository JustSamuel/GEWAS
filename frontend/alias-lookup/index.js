// Global variable to keep track of what CSS rules have already been created.
const addedRules = []

/**
 * Function for the API call.
 * @param email - The email to lookup.
 * @returns false - To clear the form.
 */
function lookup (email) {
  const xmlHttp = new XMLHttpRequest()

  // API Return Handler.
  xmlHttp.onreadystatechange = function () {
    if (xmlHttp.readyState === 4 && xmlHttp.status === 200)
      parseResult(xmlHttp.responseText)
  }

  // Make request
  xmlHttp.open('GET', `http://localhost:9404/api/email/${email}/aliases`, true) // true for asynchronous
  xmlHttp.send(null)

  return false
}

/**
 * Parses the result from the API call.
 * @param result - The API result.
 * <p>
 *   Since an Alias can have an Alias its type can be recursively defined as:
 *   Type Alias = {to: string, from: null | Alias[]}
 *   This is also why the parsing is recursive.
 * </p>
 * <p>
 *   The way the lifelines, the black stripes, are created is by adding pseudo :before elements to the div of uppermost
 *   alias. But since in DOM information only flows downwards we don't know how many children an alias has in pure css
 *   so that is why we count the amount of children and calculate the height the pseudo element needs to be.
 * </p>
 */
function parseResult (result) {
  // Parse result to JSON.
  const JSONResult = JSON.parse(result)

  // Clear the classlist and hide the div.
  let resultDiv = document.getElementById('result')
  resultDiv.classList.remove(...resultDiv.classList);
  resultDiv.style.visibility = 'hidden'

  // This re-enables the fly-in-animation of the results.
  setTimeout(() => {
    resultDiv.style.visibility = 'visible'
    resultDiv.classList.add('fly_in_animation_results')
  }, 20)

  // Remove the previous result.
  resultDiv.textContent = '';

  if (JSONResult.from === null) {
  //  email has no aliases
    return
  }

  JSONResult.from.sort((a, b) => a.to > b.to && 1 || -1)

  // We add the lifeline to the result div.
  resultDiv.classList.add('life-line')

  // Needed for lifeline length.
  let children = 0
  let lastCount = 0

  // We parse each alias recursively.
  JSONResult.from.forEach((alias) => {
    children += 1
    lastCount = parseAlias(document.getElementById('result'), alias)
    children += lastCount
  })

  // Set the length of the main lifeline.
  addLifeLineStyling(resultDiv, children - lastCount)
}

function parseAlias (parent, alias) {
  // Needed for lifeline length
  let childrenCount = 0
  let lastCount = 0

  // Create a new div for the alias.
  const newDiv = document.createElement('div')

  // Add a label with the correct text to the div.
  const label = document.createElement('span')
  label.classList.add(alias.type)
  label.innerHTML = alias.to
  newDiv.appendChild(label)

  // Add the new div to the parent.
  parent.appendChild(newDiv)

  // Alias is recursive..
  if (alias.from !== null) {
    alias.from.sort((a, b) => a.to > b.to && 1 || -1)
    // ..recurse on the aliases.
    alias.from.forEach((fromAlias) => {
      childrenCount += 1
      lastCount = parseAlias(newDiv, fromAlias)
      childrenCount += lastCount
    })
  }

  // If the alias has children we set the lifeline.
  if (childrenCount > 0) {
    const count = childrenCount - lastCount
    addLifeLineStyling(newDiv, count)
  }

  // We need to know the total amount of children.
  return childrenCount
}

/**
 * Function that adds the lifeline with the correct length.
 * @param element - The element to add the lifeline to.
 * @param count - The amount of children the line should span.
 */
function addLifeLineStyling(element, count) {
  // Add the styling.
  element.classList.add('life-line')
  // We store the length of the lifeline in the class.
  element.classList.add(`c${count}`)

  // If the relevant `c${count}` already exists we don't need to recreate it.
  if (addedRules.indexOf(count) === -1) {
    // Get the height of the labels from the css.
    const box = {}
    box.height = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--box-height').replace('px', ''))
    box.border = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--box-border').replace('px', ''))
    box.margin = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--box-margin-top').replace('px', ''))

    // Calculate the height the line.
    const height = box.margin + ((box.height + box.margin) * (count - 0.5)) - box.border * 2

    // Add this to the stylesheet.
    document.styleSheets[0].addRule(`.life-line.c${count}:before`, 'height: ' + height + 'px')
    addedRules.push(count)
  }
}