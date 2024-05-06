const createParentDiv = () => {
  const parentDivElement = document.createElement('div')
  parentDivElement.style.position = 'fixed'
  parentDivElement.style.inset = '0'
  parentDivElement.style.zIndex = 19
  parentDivElement.style.width = '100vw'
  parentDivElement.style.height = '100vh'
  parentDivElement.style.zIndex = 20
  parentDivElement.style.background = 'black'
  parentDivElement.style.opacity = 0.5

  return parentDivElement
}

const Screenshot = () => {
  function screenshotWindow(leftId, rightId) {
    return new Promise((res) => {
      // Style element
      const body = document.body
      const parent = createParentDiv()
      body.appendChild(parent)

      const leftWindow = document.getElementById(leftId)
      leftWindow.classList.add('hover:blur-lg')
      leftWindow.style.position = 'relative'
      leftWindow.style.zIndex = 21

      const restoreAll = () => {
        document.body.removeEventListener('click', onClickLeft)
        document.body.removeEventListener('click', onClickRight)
        body.removeChild(parent)
      }

      const onClickLeft = function (event) {
        if (leftWindow.contains(event.target)) {
          console.log('left clicked')
          restoreAll()
        }
      }

      const rightWindow = document.getElementById(rightId)
      rightWindow.classList.add('hover:blur-lg')
      rightWindow.style.position = 'relative'
      rightWindow.style.zIndex = 21

      const onClickRight = function (event) {
        if (rightWindow.contains(event.target)) {
          console.log('right clicked')
          restoreAll()
        }
      }

      document.body.addEventListener('click', onClickLeft)
      document.body.addEventListener('click', onClickRight)
    })
  }

  return (
    <div className="flex justify-between p-20">
      <div id="left" className="w-[500px] h-[500px] bg-red-400 "></div>
      <div id="right" className="w-[500px] h-[500px] bg-blue-400"></div>

      <button onClick={() => screenshotWindow('left', 'right')}>
        Screenshot window
      </button>
    </div>
  )
}

export default Screenshot
