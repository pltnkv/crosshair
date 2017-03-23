const THRESHOLD = 0.02
const VER_SYMBOL = '❘'
const HOR_SYMBOL = '—'
const BOTH_SYMBOL = '⊹'

let container = document.getElementById('container-inner')
let imgInput = document.getElementById('imgInput')
let clearButton = document.getElementById('clear-button')
let toggleTypeButton = document.getElementById('toggle-type-button')

let WIDTH
let HEIGHT
let ctxOrig
let savedCrosshairs = []
let crosshairType = BOTH_SYMBOL

imgInput.addEventListener('change', (e) => {
	container.innerHTML = ''
	clearSavedCrosshairs()
	readURL(imgInput)
})

function readURL(input) {
	if (input.files && input.files[0]) {
		let reader = new FileReader()

		let img = new Image()
		img.onload = getOnImageLoad(img)
		reader.onload = function (e) {
			img.setAttribute('src', e.target.result)
		}
		reader.readAsDataURL(input.files[0])
	}
}

function getOnImageLoad(image) {
	return function onImageLoad() {
		WIDTH = image.width
		HEIGHT = image.height
		let canvas = createCanvas(WIDTH, HEIGHT)
		ctxOrig = canvas.getContext('2d')
		ctxOrig.imageSmoothingEnabled = false
		ctxOrig.drawImage(image, 0, 0)
		// ctxOrig.drawImage(image, 0, 0, WIDTH * 3, HEIGHT * 3)
		clearButton.style.visibility = 'visible'
		toggleTypeButton.style.visibility = 'visible'
		updateToggleTypeButton()
		addButtonsListeners()
		run()
	}
}

function createCanvas(w, h) {
	let canvasElement = document.createElement('canvas')
	canvasElement.width = w
	canvasElement.height = h
	canvasElement.style.position = 'absolute'
	container.appendChild(canvasElement)
	return canvasElement
}

function run() {
	let bgDiv = document.getElementById('bg')

	let currentX = 0
	let currentY = 0

	let canvas2 = createCanvas(WIDTH, HEIGHT)
	let ctx = canvas2.getContext('2d')
	ctx.font = '16px sans-serif'

	function getPixelsUnderPoint(x, y) {
		let pixel = ctxOrig.getImageData(x, y, 1, 1).data
		let r = pixel[0]
		let g = pixel[1]
		let b = pixel[2]
		let a = pixel[3]
		return {r, g, b, a}
	}

	function debugBox() {
		let rgbaColor = getPixelsUnderPoint(currentX, currentY)
		let hexColor = rgbaToHEX(rgbaColor)
		bgDiv.style.backgroundColor = hexColor
		bgDiv.textContent = hexColor + (rgbaColor.a === 255 ? '' : ` (${rgbaColor.a / 255})`)
	}

	function getCrosshair(x, y) {
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
			type: crosshairType,
			point: {x, y},
			x1, x2, y1, y2
		}
	}

	function drawCrossheir(crosshair) {
		ctx.beginPath()
		ctx.lineWidth = 1
		ctx.strokeStyle = 'black'
		ctx.fillStyle = null
		let cType = crosshair.type
		if (cType === HOR_SYMBOL || cType === BOTH_SYMBOL) {
			ctx.moveTo(crosshair.x1, crosshair.point.y)
			ctx.lineTo(crosshair.x2, crosshair.point.y)
		}

		if (cType === VER_SYMBOL || cType === BOTH_SYMBOL) {
			ctx.moveTo(crosshair.point.x, crosshair.y1)
			ctx.lineTo(crosshair.point.x, crosshair.y2)
		}

		ctx.stroke()

		//Draw text
		ctx.beginPath()
		let text
		switch (cType) {
			case HOR_SYMBOL:
				text = `w:${crosshair.x2 - crosshair.x1}`
				break
			case VER_SYMBOL:
				text = `h:${crosshair.y2 - crosshair.y1}`
				break
			case BOTH_SYMBOL:
				text = `w:${crosshair.x2 - crosshair.x1} h:${crosshair.y2 - crosshair.y1}`
				break
		}
		ctx.strokeStyle = 'white'
		ctx.lineWidth = 2
		ctx.strokeText(text, crosshair.point.x + 10, crosshair.point.y - 10)
		ctx.fillStyle = 'black'
		ctx.fillText(text, crosshair.point.x + 10, crosshair.point.y - 10)
		ctx.stroke()
	}

	function compareColor(c1, c2) {
		let dR = c1.r - c2.r
		let dG = c1.g - c2.g
		let dB = c1.b - c2.b
		let dMin = Math.min(dR, dG, dB)
		let dMax = Math.max(dR, dG, dB)
		let distance = Math.abs(dMin - dMax)
		return Math.max(Math.abs(dMin), dMax, distance) / 255
	}

	function render() {
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

	function rgbaToHEX(pixel) {
		function componentToHex(c) {
			let hex = c.toString(16)
			return hex.length === 1 ? '0' + hex : hex
		}

		return '#' + componentToHex(pixel.r) + componentToHex(pixel.g) + componentToHex(pixel.b)
	}

	function copyTextToClipboard(text) {
		let copyTextarea = document.querySelector('.copytextarea')
		copyTextarea.value = text
		copyTextarea.select()

		try {
			document.execCommand('copy')
			showNotification('Color has been copied')
		} catch (err) {
			showNotification('Oops, unable to copy')
		}
	}
}

function showNotification(text) {
	let notification = document.createElement('div')
	notification.classList.add('notification')
	notification.innerText = text
	document.body.appendChild(notification)
	setTimeout(() => {
		notification.parentNode.removeChild(notification)
	}, 1000)
}

////////////////////////////////////////////////////////////
// BUTTONS EVENT
////////////////////////////////////////////////////////////

function addButtonsListeners() {
	document.addEventListener('keyup', (e) => {
		const SPACE_KEYCODE = 32
		if (e.keyCode === SPACE_KEYCODE) {
			toggleCrosshairType()
			e.preventDefault()
		}
	})

	toggleTypeButton.addEventListener('click', toggleCrosshairType)
	clearButton.addEventListener('click', clearSavedCrosshairs)
}

const crosshairTypes = [BOTH_SYMBOL, HOR_SYMBOL, VER_SYMBOL]

function toggleCrosshairType() {
	let index = crosshairTypes.indexOf(crosshairType)
	if (index === crosshairTypes.length - 1) {
		crosshairType = crosshairTypes[0]
	} else {
		crosshairType = crosshairTypes[index + 1]
	}
	updateToggleTypeButton()
}

function updateToggleTypeButton() {
	toggleTypeButton.innerText = crosshairType
}

function clearSavedCrosshairs() {
	savedCrosshairs = []
}