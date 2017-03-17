const WIDTH = 1366
const HEIGHT = 785
const THRESHOLD = 0.02

let canvas = document.getElementById('canvas')
let ctxOrig = canvas.getContext('2d')
let image = document.getElementById('source')
let imgInput = document.getElementById('imgInput')

function readURL (input) {
  if (input.files && input.files[0]) {
    let reader = new FileReader()

    reader.onload = function (e) {
      image.setAttribute('src', e.target.result)
    }
    reader.readAsDataURL(input.files[0])
  }
}

imgInput.addEventListener('change', (e) => {
  readURL(imgInput)
})

image.onload = function () {
  console.log('onload')
  ctxOrig.imageSmoothingEnabled = false
  ctxOrig.drawImage(image, 0, 0)
  // ctxOrig.drawImage(image, 0, 0, WIDTH * 3, HEIGHT * 3)
  run()
}

function run () {
  let bgDiv = document.getElementById('bg')

  let currentX = 0
  let currentY = 0
  let savedCrosshairs = []

  let canvas2 = document.getElementById('canvas2')
  let ctx = canvas2.getContext('2d')
  ctx.font = '15px sans-serif'

  function getPixelsUnderPoint (x, y) {
    let pixel = ctxOrig.getImageData(x, y, 1, 1).data
    let r = pixel[0]
    let g = pixel[1]
    let b = pixel[2]
    let a = pixel[3]
    return {r, g, b, a}
  }

  function debugBox () {
    let color = getPixelsUnderPoint(currentX, currentY)
    let rgba = 'rgba(' + color.r + ', ' + color.g +
      ', ' + color.b + ', ' + (color.a / 255) + ')'
    bgDiv.style.background = rgba
    bgDiv.textContent = rgba
  }

  function getCrosshair (x, y) {
    let colorUnderPoint = getPixelsUnderPoint(x, y)
    let i
    let x1
    let x2
    let y1
    let y2

    //LEFT
    for (i = x - 1; i >= 0; i--) {
      let nextColor = getPixelsUnderPoint(i, y)
      let diff = compareColor(colorUnderPoint, nextColor)
      if (diff > THRESHOLD) {
        break
      }
    }
    x1 = i + 1

    //RIGHT
    for (i = x + 1; i < WIDTH; i++) {
      let nextColor = getPixelsUnderPoint(i, y)
      let diff = compareColor(colorUnderPoint, nextColor)
      if (diff > THRESHOLD) {
        break
      }
    }
    x2 = i

    //TOP
    for (i = y - 1; i >= 0; i--) {
      let nextColor = getPixelsUnderPoint(x, i)
      let diff = compareColor(colorUnderPoint, nextColor)
      if (diff > THRESHOLD) {
        break
      }
    }
    y1 = i + 1

    //BOTTOM
    for (i = y + 1; i < HEIGHT; i++) {
      let nextColor = getPixelsUnderPoint(x, i)
      let diff = compareColor(colorUnderPoint, nextColor)
      if (diff > THRESHOLD) {
        break
      }
    }
    y2 = i

    return {
      point: {x, y},
      x1, x2, y1, y2
    }
  }

  function drawCrossheir (crosshair) {
    ctx.beginPath()
    ctx.lineWidth = 1
    ctx.strokeStyle = 'black'
    ctx.fillStyle = null
    ctx.moveTo(crosshair.x1, crosshair.point.y)
    ctx.lineTo(crosshair.x2, crosshair.point.y)

    ctx.moveTo(crosshair.point.x, crosshair.y1)
    ctx.lineTo(crosshair.point.x, crosshair.y2)

    ctx.stroke()

    //Draw text
    ctx.beginPath()

    let text = `${crosshair.x2 - crosshair.x1} ˣ ${crosshair.y2 - crosshair.y1}`
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 2
    ctx.strokeText(text, crosshair.point.x + 10, crosshair.point.y - 10)
    ctx.fillStyle = 'black'
    ctx.fillText(text, crosshair.point.x + 10, crosshair.point.y - 10)
    ctx.stroke()
  }

  function compareColor (c1, c2) {
    let dR = c1.r - c2.r
    let dG = c1.g - c2.g
    let dB = c1.b - c2.b
    let dMin = Math.min(dR, dG, dB)
    let dMax = Math.max(dR, dG, dB)
    let distance = Math.abs(dMin - dMax)
    return Math.max(Math.abs(dMin), dMax, distance) / 255
  }

  function render () {
    ctx.clearRect(0, 0, WIDTH, HEIGHT)

    savedCrosshairs.forEach((crf) => drawCrossheir(crf))
    drawCrossheir(getCrosshair(currentX, currentY))

    debugBox()

    requestAnimationFrame(render)
  }

  render()

  canvas2.addEventListener('mousemove', (e) => {
    currentX = e.clientX - canvas2.offsetLeft
    currentY = e.clientY - canvas2.offsetTop
  })

  canvas2.addEventListener('contextmenu', (e) => {
    e.preventDefault()
  })

  canvas2.addEventListener('click', (e) => {
    savedCrosshairs.push(getCrosshair(currentX, currentY))
  })

  canvas2.addEventListener('mouseup', (e) => {
    if (e.button === 2) {
      copyTextToClipboard(rgbaToHEX(getPixelsUnderPoint(currentX, currentY)))
    }
  })

  function rgbaToHEX (pixel) {
    function componentToHex (c) {
      let hex = c.toString(16)
      return hex.length == 1 ? '0' + hex : hex
    }

    return '#' + componentToHex(pixel.r) + componentToHex(pixel.g) + componentToHex(pixel.b)
  }

  function copyTextToClipboard (text) {
    let copyTextarea = document.querySelector('.copytextarea')
    copyTextarea.value = text
    copyTextarea.select()

    try {
      let successful = document.execCommand('copy')
      let msg = successful ? 'successful' : 'unsuccessful'
      console.log('Copying text command was ' + msg)
    } catch (err) {
      console.log('Oops, unable to copy')
    }
  }
}

