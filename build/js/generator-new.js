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
      lineHeight: 0.285 // There is no method in Canvas to set line-height. This is a ratio of how many pixels of line-height is applied per font-size in Helvetica. Needs to be updated for Tex Gyre Heros.
    }
  };

  // Prepare boolean to check for Helvetica Neue
  var isHelveticaNeue = false;

  // Use font-detect.js to determine if the font exists
  try {
    isHelveticaNeue = new Detector();
    isHelveticaNeue = isHelveticaNeue.detect("Helvetica Neue");
    console.log(isHelveticaNeue ? "\"Helvetica Neue\" detected." : "\"Helvetica Neue\" NOT detected.");
  } catch(err) {
    console.log("Missing font-detect.js file: http://www.lalit.org/lab/javascript-css-font-detect/");
  }

  // Courtesy values
  var courtesy = {
    fontSize: isHelveticaNeue ? 30 : 28,
    fontWeight: isHelveticaNeue ? 500 : 800,
    fontColor: "white",
    startX: 100,
    startY: 34,
    rectColor: "black",
    rectOpacity: 0.5,
    rectPadding: {
      top: 18,
      right: 16,
      bottom: 18,
      left: 16
    }
  };

  // Store drawn text or images as needed, throughout the app
  var saved = {};

  // Private
  function _addTextBg(bgDimensions, bgPadding, bgColor, bgOpacity, startX, startY) {

    bgDimensions.width += bgPadding.left + bgPadding.right;
    bgDimensions.height += bgPadding.top + bgPadding.bottom;

    settings.context.fillStyle = bgColor;
    settings.context.globalAlpha = bgOpacity;
    settings.context.fillRect(startX, startY, bgDimensions.width, bgDimensions.height);
    settings.context.globalAlpha = 1.0; // Reset opacity
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

    // Source: https://stackoverflow.com/questions/4793604/how-to-insert-an-element-after-another-element-in-javascript-without-using-a-lib
    parent.insertBefore(newFieldset, fieldset.nextSibling);
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

  function _matchSocial(string) {
    var lowerCase = string.toLowerCase(),
        social = {
          image: new Image(),
          handle: ""
        };

    switch (typeof string === "string") {
      case lowerCase.includes("@facebook"):
        social.image.src = "img/icons/icon-facebook.png";
        social.handle = string.replace(/facebook /i, "");
        break;
      case lowerCase.includes("@twitter"):
        social.image.src = "img/icons/icon-twitter.png";
        social.handle = string.replace(/twitter /i, "");
        break;
      case lowerCase.includes("@instagram"):
        social.image.src = "img/icons/icon-instagram.png";
        social.handle = string.replace(/instagram /i, "");
        break;
      case lowerCase.includes("@youtube"):
        social.image.src = "img/icons/icon-youtube.png";
        social.handle = string.replace(/@youtube /i, "");
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
          console.log("image.width: " + image.width + ", image.height: " + image.height);
        };

        // Must be image.src, see: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
        image.src = event.target.result;
      };

      reader.readAsDataURL(event.target.files[0]);

      setTimeout(function() {
        saved.image = image;
        saved.image.ratio = image.width / image.height;
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
          dataURL = false;

      if (fileName) {
        if (canvas.toBlob) {
          canvasData = canvas.toDataURL(); // Defaults to PNG
          blob = window.dataURLtoBlob && window.dataURLtoBlob(canvasData);
          canvas.toBlob(function (blob) {
            saveAs(blob, fileName + ".png");
          });
        } else {
          console.log("canvas.toBlob and it's polyfills aren't supported in this browser.");
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

        var context = settings.context,
            highestRatio = 0,
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
        context.drawImage(image, croppedAtX, croppedAtY, croppedImageWidth, croppedImageHeight, optStartX, optStartY, optDestWidth, optDestHeight);

        // Save area where courtesy may go
        // saved.image.slice = settings.context.getImageData(courtesy.startX, courtesy.startY, (settings.width - courtesy.startX), (courtesy.fontSize + courtesy.rectPadding.top + courtesy.rectPadding.bottom));
      },

      rotate: function() {
        //
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

        //
        if (axis == "X") {
          //
        } else {
          switch (settings.template) {
            case "fs_landscape":
              break;
            default:
              console.log("Could not find match for settings.template. Make sure it's set on this page.");
              break;
          }
        }
      }
    },

    text: function(string, optFontSize, optFontWeight, optFontColor, optStartX, optStartY, optBgPadding, optBgColor, optBgOpacity) {
      var social = _matchSocial(string),
          textHeight = 0,
          lineHeight = settings.font.lineHeight,
          bgDimensions = {
            width: 0,
            height: 0
          };

      // Default values
      optFontSize = optFontSize || 40;
      optFontWeight = optFontWeight || 400;
      optFontColor = optFontColor || "black";
      optStartX = optStartX || 0;
      optStartY = optStartY || 0;

      // Get text's line-height to exclude it from text's height
      lineHeight *= optFontSize;
      textHeight = optFontSize - lineHeight;

      // Set the font on context
      settings.context.font = optFontWeight + " " + optFontSize + "px " + settings.font.family;
      settings.context.textBaseline = "alphabetical";  // Better cross-browser support, particularly in Firefox: https://stackoverflow.com/questions/35407614/html5-canvas-textbaseline-top-looks-different-in-firefox-and-chrome#45518362
      settings.context.fillStyle = optBgColor;

      if (social) {
        social.size = textHeight;
        social.margin = lineHeight / 2; // Create space between social icon and text that's proportionate to the text's font-size

        social.image.onload = function() {
          settings.context.drawImage(social.image, optStartX, optStartY, social.size, social.size);
        };

        string = social.handle;
      } else {
        social.size = 0;
        social.margin = 0;
      }

      // Prepare background, if any
      if (optBgPadding) {
        bgDimensions.width = settings.context.measureText(string).width + social.size + social.margin;
        bgDimensions.height = textHeight;

        _addTextBg(bgDimensions, optBgPadding, optBgColor, optBgOpacity, optStartX, optStartY);

        // Push text according to padding
        optStartX += optBgPadding.left;
        optStartY += optBgPadding.top;
      }

      settings.context.fillStyle = optFontColor;
      settings.context.fillText(string, (optStartX + social.size + social.margin), (optStartY + textHeight));
    },

    presets: {
      courtesy: function(string) {
        // If argument is a button, then get its corresponding input's value. Not clean, but the best implementation I could think of to keep things DRY.
        if (typeof string == "object") {
          string = _getButtonInput(string).value;
        }

        if (string.length > 0) {

          // Delete previous courtesy, if any
          settings.context.clearRect(courtesy.startX, courtesy.startY, courtesy.width, courtesy.height);

          // Restore the underlying image, if any
          // if (saved.image) {
          //   settings.context.putImageData(saved.image.slice,  courtesy.startX, courtesy.startY);
          // }

          // Draw new courtesy
          exports.text.withBg(string, courtesy.fontSize, courtesy.fontWeight, courtesy.fontColor, courtesy.startX, courtesy.startY, courtesy.rectColor, courtesy.rectOpacity, courtesy.rectPadding);

          // Save new courtesy
          saved.courtesy = {
            area: settings.context.getImageData(courtesy.startX, courtesy.startY, (settings.width - courtesy.startX), (courtesy.fontSize + courtesy.rectPadding.top + courtesy.rectPadding.bottom)),
            message: string
          };

          exports.enable.inputs();
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
            exports.clear.inputs();
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

      portrait: function(button) {
        //
      }
    }
  };

  return exports;

}(canvas));
