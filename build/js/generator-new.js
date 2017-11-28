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
    font: "\"Helvetica Neue\", \"tex_gyre_heros\"" // Ideally, we could set letter-spacing here, since it seems to be tighter on Canvas than it would be in Photoshop, but support is poor: https://stackoverflow.com/questions/8952909/letter-spacing-in-canvas-element
  };

  // Various checks used throughout app
  var checkFor = {
    helvetica: function() {
      try {
        var isHelvetica = new Detector();
        isHelvetica = isHelvetica.detect("Helvetica Neue");
        console.log(isHelvetica ? "\"Helvetica\" detected." : "\"Helvetica\" NOT detected.");

      } catch(err) {
        console.log("Missing font-detect.js file: http://www.lalit.org/lab/javascript-css-font-detect/");
      }
    },

    socialMedia: function(string) {
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
  };

  // Public
  var exports = {
    effect: {
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

    text: {
      withBg: function() {
      },

      withoutBg: function(string, optFontSize, optFontWeight, optFontColor, optStartX, optStartY) {
        var social = checkFor.socialMedia(string);

        // Default values
        optFontSize = optFontSize || 40;
        optFontWeight = optFontWeight || 400;
        optFontColor = optFontColor || "black";
        optStartX = optStartX || 0;
        optStartY = optStartY || 0;

        if (string.length > 0) {
          settings.context.font = optFontWeight + " " + optFontSize + "px " + settings.font;
          settings.context.textBaseline = "alphabetic"; // Better cross-browser support, particularly in Firefox: https://stackoverflow.com/questions/35407614/html5-canvas-textbaseline-top-looks-different-in-firefox-and-chrome#45518362
          settings.context.fillStyle = optFontColor;

          if (social) {
            social.image.onload = function() {
              var squareDimensions = optFontSize,
                  marginRight = 10,
                  marginOfErr = 5;

              settings.context.drawImage(social.image, optStartX, optStartY, squareDimensions, squareDimensions);
              settings.context.fillText(social.handle, (optStartX + squareDimensions + marginRight), (optStartY + optFontSize - marginOfErr)); // optStartY is adjusted to counter-act alphabetic baseline and make the text act more like a top baseline. See: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/textBaseline
            };
          } else {
            settings.context.fillText(string, optStartX, (optStartY + optFontSize - marginOfErr)); // optStartY is adjusted to counter-act alphabetic baseline and make the text act more like a top baseline. See: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/textBaseline
          }
        }
      }
    },

    template: {

    }
  };

  return exports;

}(canvas));
