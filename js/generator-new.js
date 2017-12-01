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
    var social = {
      image: new Image(),
      handle: ""
    };

    string.toLowerCase();
    switch (typeof string === "string") {
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
        optOffsetCropX = optOffsetCropX || 0.5;
        optOffsetCropY = optOffsetCropY || 0.5;

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
        saved.image.slice = settings.context.getImageData(courtesy.startX, courtesy.startY, (settings.width - courtesy.startX), (courtesy.fontSize + courtesy.rectPadding.top + courtesy.rectPadding.bottom));
      },

      rotate: function() {
        //
      },

      adjust: function () {
        //
      }
    },

    text: {
      withBg: function(string, optFontSize, optFontWeight, optFontColor, optStartX, optStartY, optRectColor, optRectOpacity, optRectPadding) {
        // Source: https://stackoverflow.com/questions/18900117/write-text-on-canvas-with-background

        var rectWidth = 0,
            rectHeight = 0,
            lineHeight = settings.font.lineHeight,
            textHeight = 0;

        // Default values
        optFontSize = optFontSize || 40;
        optFontWeight = optFontWeight || 400;
        optFontColor = optFontColor || "white";
        optStartX = optStartX || 0;
        optStartY = optStartY || 0;
        optRectColor = optRectColor || "black";
        optRectOpacity = optRectOpacity || 1;
        optRectPadding = optRectPadding || {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0
        };

        // Get text's line-height to exclude it from text's height
        lineHeight *= optFontSize;
        textHeight = optFontSize - lineHeight;

        settings.context.font = optFontWeight + " " + optFontSize + "px " + settings.font.family;
        settings.context.textBaseline = "alphabetical";  // Better cross-browser support, particularly in Firefox: https://stackoverflow.com/questions/35407614/html5-canvas-textbaseline-top-looks-different-in-firefox-and-chrome#45518362
        settings.context.fillStyle = optRectColor;

        // Set after context.font so string width is measured accurately
        rectWidth += settings.context.measureText(string).width + optRectPadding.left + optRectPadding.right;
        rectHeight = textHeight + optRectPadding.top + optRectPadding.bottom;

        // Assume these values represent a courtesy
        if (optFontSize == 30 && optRectOpacity == 0.5) {
          // Save the courtesy's destination before it is drawn! That way we can erase it without clearing the entire canvas.
          // actions.saveCourtesyArea(rectWidth, rectHeight);
        }

        settings.context.globalAlpha = optRectOpacity;
        settings.context.fillRect(optStartX, optStartY, rectWidth, rectHeight);
        settings.context.globalAlpha = 1.0; // Reset opacity
        settings.context.fillStyle = optFontColor;

        settings.context.fillText(string, (optStartX + optRectPadding.left), (optStartY + textHeight + optRectPadding.top)); // textHeight is added to optStartY to counter-act alphabetic baseline
      },

      withoutBg: function(string, optFontSize, optFontWeight, optFontColor, optStartX, optStartY) {
        var social = "",
            lineHeight = settings.font.lineHeight,
            textHeight = 0;

        // Default values
        optFontSize = optFontSize || 40;
        optFontWeight = optFontWeight || 400;
        optFontColor = optFontColor || "black";
        optStartX = optStartX || 0;
        optStartY = optStartY || 0;

        // Get text's line-height to exclude it from text's height
        lineHeight *= optFontSize;
        textHeight = optFontSize - lineHeight;

        if (string.length > 0) {
          social = _matchSocial(string);

          settings.context.font = optFontWeight + " " + optFontSize + "px " + settings.font.family;
          settings.context.textBaseline = "alphabetic"; // Better cross-browser support, particularly in Firefox: https://stackoverflow.com/questions/35407614/html5-canvas-textbaseline-top-looks-different-in-firefox-and-chrome#45518362
          settings.context.fillStyle = optFontColor;

          if (social) {
            social.image.onload = function() {
              var squareDimensions = optFontSize,
                  marginRight = 10;

              settings.context.drawImage(social.image, optStartX, optStartY, squareDimensions, squareDimensions);
              settings.context.fillText(social.handle, (optStartX + squareDimensions + marginRight), (optStartY + textHeight)); // textHeight is added to optStartY to counter-act alphabetic baseline
            };
          } else {
            settings.context.fillText(string, optStartX, (optStartY + textHeight)); // textHeight is added to optStartY to counter-act alphabetic baseline
          }
        }
      }
    },

    presets: {
      courtesy: function(button) {
        var string = _getButtonInput(button).value;

        if (string.length > 0) {

          // Delete previous courtesy, if any
          settings.context.clearRect(courtesy.startX, courtesy.startY, (settings.width - courtesy.startX), (courtesy.fontSize + courtesy.rectPadding.top + courtesy.rectPadding.bottom));

          // Restore the underlying image, if any
          if (saved.image) {
            settings.context.putImageData(saved.image.slice,  courtesy.startX, courtesy.startY);
          }

          // Draw new courtesy
          exports.text.withBg(string, courtesy.fontSize, courtesy.fontWeight, courtesy.fontColor, courtesy.startX, courtesy.startY, courtesy.rectColor, courtesy.rectOpacity, courtesy.rectPadding);

          // Save new courtesy
          saved.courtesy = settings.context.getImageData(courtesy.startX, courtesy.startY, (settings.width - courtesy.startX), (courtesy.fontSize + courtesy.rectPadding.top + courtesy.rectPadding.bottom));

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
            exports.clear.inputs();
            exports.image.fit(saved.image);
            exports.enable.inputs();
          } else {
            alert("This image is PORTRAIT-oriented. Please use the fs_portrait template instead.");
          }
        });
      }
    }
  };

  return exports;

}(canvas));
