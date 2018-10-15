// Grab the canvas
var canvas = document.getElementById("jsGeneratorCanvas");

// Begin generator module
var generate = (function() {

	// Store canvas attributes
	var settings = {
		width: canvas.width,
		height: canvas.height,
		context: canvas.getContext("2d"),
		template: canvas.dataset.template,
		font: {
			// Ideally, we could set letter-spacing here, since it seems to be tighter on Canvas than it would be in Photoshop, but support is poor: https://stackoverflow.com/questions/8952909/letter-spacing-in-canvas-element
			family: "\"Helvetica Neue\", \"tex_gyre_heros\"",
			lineHeight: 0.285 // There is no method in canvas to set line-height. This is a ratio of how many pixels of line-height is applied per font-size in Helvetica. Needs to be updated for Tex Gyre Heros.
		}
	};

	// Prepare boolean to check for Helvetica Neue
	var isHelveticaNeue = false;

	// Use font-detect.js to determine if the font exists
	try {
		isHelveticaNeue = new Detector();
		isHelveticaNeue = isHelveticaNeue.detect("Helvetica Neue");
		console.log(isHelveticaNeue ? "\"Helvetica Neue\" detected." : "\"Helvetica Neue\" NOT detected.");
	} catch (err) {
		console.log("Missing font-detect.js file: http://www.lalit.org/lab/javascript-css-font-detect/");
	}

	// Store drawn text or images as needed, throughout the app
	var saved = {};

	// Private
	function _calcGCD(val, lim) {
		// https://stackoverflow.com/questions/1186414/whats-the-algorithm-to-calculate-aspect--i-need-an-output-like-43-169

		var lower = [0, 1];
		var upper = [1, 0];

		while (true) {
			var mediant = [lower[0] + upper[0], lower[1] + upper[1]];

			if (val * mediant[1] > mediant[0]) {
				if (lim < mediant[1]) {
					return upper;
				}
				lower = mediant;
			} else if (val * mediant[1] == mediant[0]) {
				if (lim >= mediant[1]) {
					return mediant;
				}
				if (lower[1] < upper[1]) {
					return lower;
				}
				return upper;
			} else {
				if (lim < mediant[1]) {
					return lower;
				}
				upper = mediant;
			}
		}
	}

	function _calcAspectRatio(width, height) {
		var gcd = _calcGCD(width / height, 50),
			ratio = gcd[0] / gcd[1];

		console.log("Aspect Ratio: " + gcd[0] + ":" + gcd[1] + ", Floating: " + ratio);
		return ratio;
	}

	function _createImageAdj(fieldset, axis, buttonAttr) {
		var parent = fieldset.parentNode,
			newFieldset = document.createElement("fieldset"),
			labelMessage = "",
			inputMessage = "",
			arrowStyle = [];

		if (axis == "X") {
			labelMessage = "left or right";
			inputMessage = "% from the left.";
			arrowStyle = ["transform: rotate(90deg);", "transform: rotate(-90deg);"];
		} else {
			labelMessage = "up or down";
			inputMessage = "% from the top.";
			arrowStyle = ["transform: rotate(0deg);", "transform: rotate(180deg);"];
		}

		newFieldset.className = "generator__fieldset";
		newFieldset.className += " js-generator-pos-fieldset"; // Used for _removeImageAdj function. Must include space!

		if (buttonAttr) {
			buttonAttr = "data-" + buttonAttr.name + "='" + buttonAttr.value + "'";
		} else {
			buttonAttr = "";
		}

		newFieldset.innerHTML = "<label class=\"generator__directions\">Move photo " + labelMessage + ", if needed.</label><span style=\"display: block; font-size: 20px; margin-top: -15px; margin-bottom: 25px;\">Image is currently cropped <input class\"generator__input generator__input--number\" type=\"number\" min=\"0\" max=\"100\" step=\"10\" value=\"50\" disabled/>" + inputMessage + "</span><button class=\"generator__button\" type=\"button\" onclick=\"generate.image.adjust(this, '" + axis + "', 'decrease')\" " + buttonAttr + "><img src=\"img/icons/icon-arrow.png\" style=\"width: 20px; " + arrowStyle[0] + "\"/></button><button class=\"generator__button\" type=\"button\" onclick=\"generate.image.adjust(this, '" + axis + "', 'increase')\" " + buttonAttr + "><img src=\"img/icons/icon-arrow.png\" style=\"width: 20px; " + arrowStyle[1] + "\"/></button>";

		parent.insertBefore(newFieldset, fieldset.nextSibling);
	}

	function _checkBlankInputs(inputsArray) {
		var blankInputs = 0;

		inputsArray.forEach(function(input) {
			if (!input.value) blankInputs++;
		});

		return blankInputs;
	}

	function _getButtonInput(button) {
		parent = button.parentElement;
		input = parent.querySelector("input");
		return input;
	}

	function _getImageFile(input, callback) {
		input.onchange = function(event) {
			event = event || window.event; // Cross-browser compatibility
			_readImageFile(event, input, callback);
		};

		// Fixes IE, Edge clicking the input before it is assigned the onchange event
		setTimeout(function() {
			input.click();
		}, 200);
	}

	function _getSocial(string) {
		var lowerCase = string.toLowerCase(),
			social = {
				image: new Image(),
				handle: ""
			};

		switch (typeof string == "string") {
			case string.includes("@facebook #"):
				social.image.src = "img/icons/icon-facebook.png";
				social.handle = string.replace("@facebook ", "");
				break;
			case string.includes("@twitter #"):
				social.image.src = "img/icons/icon-twitter.png";
				social.handle = string.replace("@twitter ", "");
				break;
			case string.includes("@instagram #"):
				social.image.src = "img/icons/icon-instagram.png";
				social.handle = string.replace("@instagram ", "");
				break;
			case string.includes("@facebook"):
				social.image.src = "img/icons/icon-facebook.png";
				social.handle = string.replace("facebook ", "");
				break;
			case string.includes("@twitter"):
				social.image.src = "img/icons/icon-twitter.png";
				social.handle = string.replace("twitter ", "");
				break;
			case string.includes("@instagram"):
				social.image.src = "img/icons/icon-instagram.png";
				social.handle = string.replace("instagram ", "");
				break;
			case string.includes("@youtube"):
				social.image.src = "img/icons/icon-youtube.png";
				social.handle = string.replace("@youtube ", "");
				break;
			default:
				social = false;
				break;
		}

		return social;
	}

	function _readImageFile(event, input, callback) {
		var file = input.files[0],
			reader = new FileReader(),
			image = new Image(),
			display = input.parentElement.querySelector(".generator__input--image");

		if (file) {
			reader.onload = function(event) {
				image.onload = function() {
					console.log("Image Width: " + image.width + ", Image Height: " + image.height);
				};

				// Must be image.src, see: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
				image.src = event.target.result;
			};

			reader.readAsDataURL(event.target.files[0]);

			setTimeout(function() {
				// Find button if template is side-by-side
				var button = "";

				if (settings.template == "fs_side-by-side") {
					button = input.parentElement.querySelector("button");

					// Use the button to determine which side the image will go
					if (button.dataset.fsSide == "left") {
						saved.imageLeft = image;
						saved.imageLeft.ratio = _calcAspectRatio(image.width, image.height);
					} else {
						saved.imageRight = image;
						saved.imageRight.ratio = _calcAspectRatio(image.width, image.height);
					}
				} else {
					// Otherwise, save the image as usual
					saved.image = image;
					saved.image.ratio = _calcAspectRatio(image.width, image.height);
				}

				display.innerHTML = input.value.substring(12); // Remove "C:\fakepath\" from imageURL
				callback();
			}, 400); // Set to 400 to give time for uploads from the server. Used to be 200.
		}
	}

	function _removeImageAdj(fieldset) {
		var sibling = fieldset.nextElementSibling;

		if (sibling.classList.contains("js-generator-pos-fieldset")) {
			sibling.remove();
		}
	}

	function _setSortables() {
		// Source: https://github.com/RubaXa/Sortable
		var sortParent = document.getElementById("jsSortable");

		if (sortParent) {
			var sortable = Sortable.create(sortParent, {
				draggable: ".js-sortable-item", // must include the dot
				dragClass: "js-sortable-drag",
				ghostClass: "js-sortable-ghost",
				chosenClass: "js-sortable-chosen",
				handle: ".js-sortable-move", // must include the dot
				filter: ".js-sortable-remove", // must include the dot
				onFilter: function(event) {
					var item = event.item,
						control = event.target;

					if (Sortable.utils.is(control, ".js-sortable-remove")) {
						item.parentNode.removeChild(item);
					}
				}
			});
		} else {
			console.log("No sortable items found.");
		}
	}

	// Public
	var exports = {
		clear: {
			canvas: function() {
				settings.context.clearRect(0, 0, settings.width, settings.height);
				settings.context.beginPath(); // Essential to clear rectangles, images, etc.
			},

			inputs: function() {
				var allInputs = document.querySelectorAll("input");

				allInputs.forEach(function(input) {
					input.value = "";
				});
			}
		},

		download: function(button) {
			var fileName = _getButtonInput(button).value,
				newCanvas = document.createElement("canvas"), // Used as a "merged" canvas below
				newContext = newCanvas.getContext("2d"),
				textLayer = document.getElementById("jsTextLayer") || false;

			newCanvas.width = settings.width;
			newCanvas.height = settings.height;

			if (fileName) {
				if (canvas.toBlob) {
					// Draw first layer
					newContext.drawImage(canvas, 0, 0);

					// Draw second layer
					if (textLayer) {
						newContext.drawImage(textLayer, 0, 0);
					}

					newCanvasData = newCanvas.toDataURL(); // Defaults to PNG
					blob = window.dataURLtoBlob && window.dataURLtoBlob(newCanvasData);
					newCanvas.toBlob(function(blob) {
						saveAs(blob, fileName + ".png");
					});
				} else {
					console.log("newCanvas.toBlob and it's polyfills aren't supported in this browser.");
				}
			} else {
				alert("Please name your file before downloading.");
			}
		},

		enable: {
			inputs: function() {
				var disabledField = document.querySelectorAll(".generator__fieldset--disabled");

				disabledField.forEach(function(field) {
					var children = field.children;
					field.classList.remove("generator__fieldset--disabled");
					for (var i = 0; i < children.length; i++) {
						if (children[i].tagName == "INPUT" || children[i].tagName == "BUTTON") children[i].disabled = false;
					}
				});
			}
		},

		effects: {
			addBottomGradient: function(ratio) {
				var startX = 0,
					startY = settings.height,
					endX = 0,
					endY = settings.height - settings.height * ratio,
					gradient = settings.context.createLinearGradient(startX, startY, endX, endY);

				gradient.addColorStop(0, "rgba(0, 0, 0, 0.8)");
				gradient.addColorStop(0.43, "rgba(0, 0, 0, 0.75)");
				gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
				settings.context.fillStyle = gradient;
				settings.context.fillRect(startX, endY, settings.width, settings.height);
			},

			addRadialGradient: function() {
				// Source: http://rectangleworld.com/blog/archives/169
				var newCanvas = document.createElement("canvas"),
					newContext = newCanvas.getContext("2d"),
					rx = settings.width,
					ry = settings.height,
					cx = rx / 2,
					cy = ry / 2,
					scaleX = 0,
					scaleY = 0,
					invScaleX = 0,
					invScaleY = 0,
					gradient = 0;

				newCanvas.width = rx;
				newCanvas.height = ry;

				if (rx >= ry) {
					scaleX = 1;
					invScaleX = 1;
					scaleY = ry / rx;
					invScaleY = rx / ry;
					gradient = newContext.createRadialGradient(cx, cy * invScaleY, 0, cx, cy * invScaleY, rx);
				} else {
					scaleY = 1;
					invScaleY = 1;
					scaleX = rx / ry;
					invScaleX = ry / rx;
					gradient = newContext.createRadialGradient(cx * invScaleX, cy, 0, cx * invScaleX, cy, ry);
				}

				newContext.fillStyle = gradient;
				gradient.addColorStop(0.35, "rgba(0, 0, 0 ,0)");
				gradient.addColorStop(1, "rgba(0, 0, 0, 0.8)");
				newContext.setTransform(1, 0, 0, scaleY, 0, 0);
				newContext.fillRect(0, 0, rx * invScaleX, ry * invScaleY);
				settings.context.drawImage(newCanvas, 0, 0);
			}
		},

		image: {
			fit: function(image, optDestWidth, optDestHeight, optStartX, optStartY, optOffsetCropX, optOffsetCropY) {
				// Source: https://stackoverflow.com/questions/21961839/simulation-background-size-cover-in-canvas

				var highestRatio = 0,
					newImageWidth = 0,
					newImageHeight = 0,
					croppedAtX, subRectY, subRectWidth, subRectHeight, aspectRatio = 1;

				// If only image is provided, default destination is canvas, starting from the top-left corner, with the image cropped to fit and centered
				optDestWidth = optDestWidth || settings.width;
				optDestHeight = optDestHeight || settings.height;
				optStartX = optStartX || 0;
				optStartY = optStartY || 0;

				optOffsetCropX = typeof optOffsetCropX === "number" ? optOffsetCropX : 0.5;
				optOffsetCropY = typeof optOffsetCropY === "number" ? optOffsetCropY : 0.5;

				// Keep bounds [0.0, 1.0]
				if (optOffsetCropX < 0) optOffsetCropX = 0;
				if (optOffsetCropY < 0) optOffsetCropY = 0;
				if (optOffsetCropX > 1) optOffsetCropX = 1;
				if (optOffsetCropY > 1) optOffsetCropY = 1;

				highestRatio = Math.min(optDestWidth / image.width, optDestHeight / image.height);
				newImageWidth = image.width * highestRatio;
				newImageHeight = image.height * highestRatio;

				// Decide which gap to fill
				if (newImageWidth < optDestWidth) aspectRatio = optDestWidth / newImageWidth;
				if (Math.abs(aspectRatio - 1) < 1e-14 && newImageHeight < optDestHeight) aspectRatio = optDestHeight / newImageHeight;

				newImageWidth *= aspectRatio;
				newImageHeight *= aspectRatio;

				// Calc source rectangle
				croppedImageWidth = image.width / (newImageWidth / optDestWidth);
				croppedImageHeight = image.height / (newImageHeight / optDestHeight);
				croppedAtX = (image.width - croppedImageWidth) * optOffsetCropX;
				croppedAtY = (image.height - croppedImageHeight) * optOffsetCropY;

				// Make sure source rectangle is valid
				if (croppedAtX < 0) croppedAtX = 0;
				if (croppedAtY < 0) croppedAtY = 0;
				if (croppedImageWidth > image.width) croppedImageWidth = image.width;
				if (croppedImageHeight > image.height) croppedImageHeight = image.height;

				// Fill image in dest. rectangle
				settings.context.drawImage(image, croppedAtX, croppedAtY, croppedImageWidth, croppedImageHeight, optStartX, optStartY, optDestWidth, optDestHeight);
			},

			rotate: function(degrees) {
				var newCanvas = document.createElement("canvas"),
					newContext = newCanvas.getContext("2d");

				newCanvas.width = settings.width;
				newCanvas.height = settings.height;

				// Save unrotated canvas to restore later
				newContext.save();

				newContext.rotate(degrees * Math.PI / 180);
				newContext.translate(-30, 50);
				settings.context = newContext;
				exports.image.fit(saved.image, settings.width, settings.height, 0, 0);
				settings.context = canvas.getContext("2d");
				settings.context.drawImage(newCanvas, 0, 0);

				// We’re done with the rotating so restore the unrotated context
				newContext.restore();
			},

			adjust: function(button, axis, action) {
				var input = _getButtonInput(button),
					value = Number(input.value);

				if (action == "decrease" && value > 0) {
					value -= 10;
					input.value = value;
				} else if (action == "increase" && value < 100) {
					value += 10;
					input.value = value;
				}

				// Change value to decimal for generate.image.fit
				value /= 100;

				// Re-create presets when images are adjusted
				switch (settings.template) {
					case "fs_landscape":
						exports.image.fit(saved.image, settings.width, settings.height, 0, 0, 0.5, value);
						break;

					case "fs_portrait":
						exports.image.fit(saved.image, (settings.width / 2 - settings.width / 25), settings.height, (settings.width / 2), 0, value, 0.5);
						break;

					case "l3_phoner":
						exports.image.fit(saved.image, 170, 170, 80, 500, 0.5, value);
						break;

					case "fs_side-by-side":
						if (axis == "X") {
							if (button.dataset.fsSide == "left") {
								exports.image.fit(saved.imageLeft, settings.width / 2, settings.height, 0, 0, value, 0.5);
							} else {
								exports.image.fit(saved.imageRight, settings.width / 2, settings.height, settings.width / 2, 0, value, 0.5);
							}
						} else {
							if (button.dataset.fsSide == "left") {
								exports.image.fit(saved.imageLeft, settings.width / 2, settings.height, 0, 0, 0.5, value);
							} else {
								exports.image.fit(saved.imageRight, settings.width / 2, settings.height, settings.width / 2, 0, 0.5, value);
							}
						}
						break;

						case "asset_4x3":
							if (axis == "X") {
								exports.image.fit(saved.image, settings.width, settings.height, 0, 0, value, 0.5);
							} else {
								exports.image.fit(saved.image, settings.width, settings.height, 0, 0, 0.5, value);
							}
							break;

					default:
						console.log("Could not find match for settings.template. Make sure it's set on this page.");
						break;
				}
			}
		},

		text: function(string, fontSize, fontWeight, fontColor, startX, startY, optBgPadding, optBgColor, optBgOpacity) {
			var social = _getSocial(string),
				lineHeight = settings.font.lineHeight * fontSize,
				textHeight = fontSize - lineHeight,
				bgDimensions = {},
				newCanvas = document.getElementById("jsTextLayer") || false,
				newContext = (newCanvas) ? newCanvas.getContext("2d") : false;

			// Create separate canvas and use it as a second layer for text
			if (!newCanvas) {
				newCanvas = document.createElement("canvas");
				newCanvas.setAttribute("id", "jsTextLayer");
				newCanvas.style.width = "580px";
				newCanvas.style.height = "326px";
				newCanvas.style.border = "5px solid #ededed";
				newCanvas.style.borderRadius = "3px";
				newCanvas.style.position = "relative";
				newCanvas.style.top = "-329px";
				newContext = newCanvas.getContext("2d");

				newCanvas.width = settings.width;
				newCanvas.height = settings.height;

				canvas.parentNode.insertBefore(newCanvas, canvas.nextSibling);
			}

			// Set the font on context
			newContext.font = fontWeight + " " + fontSize + "px " + settings.font.family;
			newContext.textBaseline = "alphabetical"; // Better cross-browser support, particularly in Firefox: https://stackoverflow.com/questions/35407614/html5-canvas-textbaseline-top-looks-different-in-firefox-and-chrome#45518362

			if (social) {
				social.width = textHeight;
				social.height = textHeight;
				social.margin = lineHeight / 2; // Create space between social icon and text that's proportionate to the text's font-size

				social.image.onload = function() {
					newContext.drawImage(social.image, startX, startY, social.width, social.height);
				};

				string = social.handle;
			} else {
				social = {
					width: 0,
					height: 0,
					margin: 0
				};
			}

			if (optBgPadding) {
				bgDimensions.width = newContext.measureText(string).width;
				bgDimensions.height = textHeight;

				bgDimensions.width += optBgPadding.left + optBgPadding.right;
				bgDimensions.width += social.width + social.margin;
				bgDimensions.height += optBgPadding.top + optBgPadding.bottom;

				newContext.fillStyle = optBgColor;
				newContext.globalAlpha = optBgOpacity;
				newContext.fillRect(startX, startY, bgDimensions.width, bgDimensions.height);
				newContext.globalAlpha = 1.0; // Reset opacity

				// Push text according to padding
				startX += optBgPadding.left;
				startY += optBgPadding.top;
			}

			// Draw text
			newContext.fillStyle = fontColor;
			newContext.fillText(string, (startX + social.width + social.margin), (startY + textHeight)); // Add textHeight to optStartY to counter-act textBaseline "alphabetical", makes it act like "top"
		},

		presets: {
			article: function(button) {
				var input = _getButtonInput(button);

				_getImageFile(input, function() {
					if (saved.image.ratio > 1) {
						exports.clear.canvas();
						settings.context.fillStyle = "white";
						settings.context.fillRect(0, 0, settings.width, settings.height);
						exports.image.rotate(-5);
						exports.effects.addRadialGradient();
						exports.enable.inputs();
					} else {
						alert("This image is PORTRAIT-oriented. Please submit a different screenshot.");
					}
				});
			},

			boxedAd: function(button) {
				var input = _getButtonInput(button);

				_getImageFile(input, function() {
					var newWidth = 812,
						newHeight = 457; // These are consistent, per Alexander

					// Require images to be 16:9 ratio. I could adjust the lim on _calcGCD to be more forgiving instead of using a range here. See the link within that function
					if (saved.image.ratio >= 1.7 && saved.image.ratio <= 1.8) {
						exports.clear.canvas();
						_removeImageAdj(button.parentElement);
						// exports.clear.inputs();

						// Background
						settings.context.fillStyle = "black";
						settings.context.fillRect(0, 0, settings.width, settings.height);
						settings.context.filter = "blur(60px)";
						exports.image.fit(saved.image);

						// Foreground
						settings.context.filter = "none";
						settings.context.drawImage(saved.image, ((settings.width - newWidth) / 2), ((settings.height - newHeight) / 2), newWidth, newHeight);

						exports.enable.inputs();
					} else {
						alert("This template accepts ONLY accepts 16:9 fullscreens. Example widths are: 1280 x 720.");
					}
				});
			},

			courtesy: function(string) {
				var courtesy = {
					fontSize: isHelveticaNeue ? 30 : 28,
					fontWeight: isHelveticaNeue ? 500 : 800,
					fontColor: "white",
					startX: 100,
					startY: 34,
					bgPadding: {
						top: 18,
						right: 16,
						bottom: 18,
						left: 16
					},
					bgColor: "black",
					bgOpacity: 0.5
				};

				// If argument is a button, then get its corresponding input's value. Otherwise, we can pass a string. Not clean, but the best implementation I could think of to keep things DRY.
				if (typeof string == "object") {
					string = _getButtonInput(string).value;
				}

				if (string.length > 0) {
					// Delete old courtesy, if any
					if (saved.courtesy) {
						settings.context = document.getElementById("jsTextLayer").getContext("2d");
						exports.clear.canvas();
						settings.context = canvas.getContext("2d");
					}

					// Draw new courtesy
					exports.text(string, courtesy.fontSize, courtesy.fontWeight, courtesy.fontColor, courtesy.startX, courtesy.startY, courtesy.bgPadding, courtesy.bgColor, courtesy.bgOpacity);

					// Save new courtesy message
					saved.courtesy = string;

					// Enable inputs on courtesy template
					if (settings.template == "courtesy-only") {
						exports.enable.inputs();
					}

				} else {
					alert("Courtesy field is empty. Please enter text before submitting.");
				}
			},

			landscape: function(button) {
				var input = _getButtonInput(button);

				_getImageFile(input, function() {
					if (saved.image.ratio > 1) {
						exports.clear.canvas();
						_removeImageAdj(button.parentElement);
						// exports.clear.inputs();
						exports.image.fit(saved.image);

						if (saved.image.ratio != settings.width / settings.height) {
							_createImageAdj(button.parentElement, "Y");
						}

						exports.enable.inputs();
					} else {
						alert("This image is PORTRAIT-oriented. Please use the fs_portrait template instead.");
					}
				});
			},

			fourByThree: function(button) {
				var input = _getButtonInput(button);

				_getImageFile(input, function() {
					console.log(settings.width/settings.height);
					exports.clear.canvas();
					_removeImageAdj(button.parentElement);
					exports.image.fit(saved.image);

					if (saved.image.ratio > (settings.width / settings.height) + 0.05) {
						_createImageAdj(button.parentElement, "X");
					}

					if (saved.image.ratio < (settings.width / settings.height) - 0.05) {
						_createImageAdj(button.parentElement, "Y");
					}

					exports.enable.inputs();
				});
			},

			noCrop: function(button) {
				var input = _getButtonInput(button);

				_getImageFile(input, function() {
					var maxImageHeight = settings.height,
						newImageWidth = maxImageHeight * saved.image.ratio,
						startX = (settings.width - newImageWidth) / 2, // Center images
						startY = 0;

					exports.clear.canvas();
					// exports.clear.inputs();

					// Use white background for tweets, everything else black
					if (settings.template == "fs_tweet") {
						settings.context.fillStyle = "white";
					} else {
						settings.context.fillStyle = "black";
					}

					settings.context.fillRect(0, 0, settings.width, settings.height);

					if (newImageWidth <= settings.width) {
						settings.context.drawImage(saved.image, startX, startY, newImageWidth, maxImageHeight);
					} else {
						// Reverse max limits, set width to 720 and allow flexible height
						newImageWidth = settings.width;
						maxImageHeight = newImageWidth / saved.image.ratio; // https://eikhart.com/blog/aspect-ratio-calculator
						startX = 0;
						startY = (settings.height - maxImageHeight) / 2;

						console.log("Extreme landscape. newImageWidth: " + newImageWidth + ", maxImageHeight: " + maxImageHeight + ", startX: " + startX + ", startY: " + startY);

						settings.context.drawImage(saved.image, startX, startY, newImageWidth, maxImageHeight);
					}

					exports.enable.inputs();
				});
			},

			l3PhonerImage: function(button) {
				var input = _getButtonInput(button),
					startX = 80,
					startY = 500,
					phoner = {
						width: 170,
						height: 170,
						margin: 20
					};

				_getImageFile(input, function() {
					if (saved.image.ratio <= 1) {
						exports.clear.canvas();
						_removeImageAdj(button.parentElement);
						// exports.clear.inputs();

						// White border
						settings.context.strokeStyle = "white";
						settings.context.lineWidth = 7;
						settings.context.strokeRect(startX, startY, phoner.width, phoner.height);

						// Cropped foreground image
						exports.image.fit(saved.image, phoner.width, phoner.height, startX, startY);

						// Square images don't need adjustment. Only present to portrait images.
						if (saved.image.ratio !== 1) {
							_createImageAdj(button.parentElement, "Y");
						}

						// Save phoner dimensions
						saved.phoner = phoner;
					} else {
						alert("This image is LANDSCAPE-oriented. Please submit a different photo.");
					}
				});
			},

			l3PhonerText: function(button) {
				var inputsArray = button.parentElement.querySelectorAll("input"),
					blankInputs = _checkBlankInputs(inputsArray),
					textLayer = document.getElementById("jsTextLayer") || false,
					startX = (saved.phoner) ? saved.phoner.width + saved.phoner.margin + 80 : 80,
					startY = 500,
					bgOpacity = 1,
					bgPadding = {
						top: 15,
						right: 20,
						bottom: 15,
						left: 20
					};

				if (blankInputs > 0) {
					alert(blankInputs + " text field(s) empty. Please fill them out before submitting.");
				} else {
					if (textLayer) {
						settings.context = textLayer.getContext("2d");
						exports.clear.canvas();
						settings.context = canvas.getContext("2d");
					}

					/*
					if (document.getElementById("OnthePhone").checked) {
					  exports.text("On the Phone", 33, 800, "white", startX, startY, bgPadding, "black", bgOpacity);
					} else if (document.getElementById("VoiceOf").checked) {
					  exports.text("Voice of", 33, 800, "white", startX, startY, bgPadding, "black", bgOpacity);
					}
					*/

					// Draw "On the Phone"
					exports.text("On the Phone", 33, 800, "white", startX, startY, bgPadding, "black", bgOpacity);

					// Draw rest of text
					inputsArray.forEach(function(input) {
						startY += 60;
						exports.text(input.value, Number(input.dataset.fontSize), Number(input.dataset.fontWeight), "black", startX, startY, bgPadding, "white", bgOpacity);
					});
				}
			},

			l3GradientImage: function(button) {
				var input = _getButtonInput(button),
					startX = 80,
					startY = 500,
					phoner = {
						// width determined at line 795
						height: 170,
						margin: 20
					};

				_getImageFile(input, function() {
					exports.clear.canvas();
					exports.effects.addBottomGradient(1 / 4);
					// exports.clear.inputs();

					// Scale image proportionate to phoner.height
					phoner.width = phoner.height * saved.image.ratio;

					// Cropped foreground image
					settings.context.drawImage(saved.image, startX, startY, phoner.width, phoner.height);

					// Save phoner dimensions
					saved.phoner = phoner;
				});
			},

			l3GradientText: function(button) {
				var inputsArray = button.parentElement.querySelectorAll("input"),
					blankInputs = _checkBlankInputs(inputsArray),
					textLayer = document.getElementById("jsTextLayer") || false,
					startX = (saved.phoner) ? saved.phoner.width + saved.phoner.margin + 80 : 80,
					startY = 720, // Start inversely from the bottom of canvas
					marginTop = 5,
					marginRight = 20;

				if (blankInputs > 0) {
					alert(blankInputs + " text field(s) empty. Please fill them out before submitting.");
				} else {
					if (textLayer) {
						settings.context = textLayer.getContext("2d");
						exports.clear.canvas();
						settings.context = canvas.getContext("2d");
					}

					// Calculate how far up the text group needs to be drawn
					startY -= 40; // Subtract 40px of padding from the bottom of canvas
					inputsArray.forEach(function(input) {
						var fontSize = Number(input.dataset.fontSize);
						startY -= fontSize + marginTop;
					});

					// Then draw text from top to bottom
					inputsArray.forEach(function(input) {
						var fontSize = Number(input.dataset.fontSize);
						exports.text(input.value, fontSize, input.dataset.fontWeight, "white", startX, startY);
						startY += fontSize + marginTop;
					});

					exports.enable.inputs();
				}
			},

			portrait: function(button) {
				var input = _getButtonInput(button);

				_getImageFile(input, function() {
					var maxWidth = (settings.width / 2) - (settings.width / 25),
						newImageWidth = settings.height * saved.image.ratio;

					if (saved.image.ratio <= 1) {
						exports.clear.canvas();
						_removeImageAdj(button.parentElement);
						// exports.clear.inputs();

						// Background
						settings.context.fillStyle = "black";
						settings.context.fillRect(0, 0, settings.width, settings.height);
						settings.context.filter = "grayscale(100%) brightness(50%) blur(5px)";
						exports.image.fit(saved.image);

						// Foreground
						settings.context.filter = "none";
						if (newImageWidth > maxWidth) {
							exports.image.fit(saved.image, maxWidth, settings.height, (settings.width / 2), 0);
							_createImageAdj(button.parentElement, "X");
						} else {
							settings.context.drawImage(saved.image, (settings.width / 2), 0, newImageWidth, settings.height);
						}

						exports.enable.inputs();
					} else {
						alert("This image is LANDSCAPE-oriented. Please use the fs_landscape template instead.");
					}
				});
			},

			sideBySide: function(button) {
				var input = _getButtonInput(button),
					side = button.dataset.fsSide;

				_getImageFile(input, function() {
					_removeImageAdj(button.parentElement);

					if (side == "left") {
						exports.image.fit(saved.imageLeft, settings.width / 2, settings.height, 0, 0);
						_determineImageAdj(saved.imageLeft);
					} else {
						exports.image.fit(saved.imageRight, settings.width / 2, settings.height, settings.width / 2, 0);
						_determineImageAdj(saved.imageRight);
					}

					if (saved.imageLeft && saved.imageRight) {
						exports.enable.inputs();
					}

					function _determineImageAdj(image) {
						var axis = (image.ratio < 1) ? "Y" : "X";

						_createImageAdj(button.parentElement, axis, {
							name: "fs-side",
							value: side
						});
					}
				});
			}
		}
	};

	// Check for L3_Gradient. If so, apply bottom gradient and set sortables when page loads.
	if (settings.template == "l3_gradient") {
		_setSortables();
		exports.effects.addBottomGradient(1 / 4);
	}

	return exports;

}(canvas));
