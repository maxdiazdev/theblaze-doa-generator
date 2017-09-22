// Grab the canvas
var canvas = document.querySelector(".generator__canvas");

// Begin generator module
var generator = (function () {

  var settings = {
    width: canvas.width,
    height: canvas.height,
    context: canvas.getContext("2d"),
    template: canvas.dataset.template,
    font: { family:"\"Helvetica Neue\", \"tex_gyre_heros\", Arial, sans-serif" },
    image: "No image set."
  };

  var actions = {
    addBottomGradient: function(ratio) {
      var width = settings.width,
          height = settings.height,
          context = settings.context,
          startX = 0,
          startY = height,
          endX = 0,
          endY = height - height * ratio,
          gradient = context.createLinearGradient(startX, startY, endX, endY);

      gradient.addColorStop(0, "rgba(0, 0, 0, 1)");
      gradient.addColorStop(1, "rgba(0, 0, 0 ,0)");
      context.fillStyle = gradient;
      context.fillRect(startX, endY, width, height);
    },
    addCourtesy: function(courtesy) {
      var fSize = 30,
          fWeight = "bold",
          startX = 100,
          startY = 35,
          rectColor = "black",
          rectOpacity = 0.5,
          padding = { top: 14, right: 70, bottom: 35, left: 35 };

      if (courtesy.length > 0) {
        actions.clearCanvas();
        actions.renderPortrait();
        actions.drawTextWithRect(courtesy, fSize, fWeight, startX, startY, rectColor, rectOpacity, padding);
      }
    },
    clearCanvas: function() {
      settings.context.clearRect(0, 0, settings.width, settings.height);
    },
    downloadCanvas: function() {
      canvas.toBlob(function(blob) {
        saveAs(blob, "Untitled_1280x720.jpg");
      });
    },
    drawText: function(string, fSize, fWeight, startX, startY) {
      var font = settings.font,
          context = settings.context,
          socialIcon = new Image();

      font.size = fSize;
      font.weight = fWeight;

      switch(true) {
        case actions.matchString(string, "facebook"):
          socialIcon.src = "img/icons/icon-facebook.png";
          break;
        case actions.matchString(string, "instagram"):
          socialIcon.src = "img/icons/icon-instagram.png";
          break;
        case actions.matchString(string, "twitter"):
          socialIcon.src = "img/icons/icon-twitter.png";
          break;
        default:
          socialIcon = false;
      }

      if (string.length > 0) {
        context.font = font.weight + " " + font.size + "px " + font.family;
        context.fillStyle = 'white';

        if (socialIcon) {
          socialIcon.onload = function () {
            context.drawImage(socialIcon, 80, (startY - fSize + 5), fSize, fSize);
          };
          context.fillText(string, (startX + 50), startY);
        } else {
          context.fillText(string, startX, startY);
        }
      }
    },
    drawTextWithRect: function(text, fSize, fWeight, startX, startY, rectColor, rectOpacity, padding) {
      var context = settings.context,
          font = settings.font;

      font.size = fSize;
      font.weight = fWeight;

      context.font = font.weight + " " + font.size + "px " + font.family; // Set font properly
      context.textBaseline = 'top'; // Draw text from top - makes life easier at the moment
      context.fillStyle = rectColor;

      // Get width and height of rectangle using text size
      var rectWidth = context.measureText(text).width;
      var rectHeight = font.size;

      if (rectOpacity > 0) {
        context.globalAlpha = 0.5;
      }

      context.fillRect(startX, startY, (rectWidth + padding.right), (rectHeight + padding.bottom));
      context.globalAlpha = 1.0; // Reset opacity for future drawings
      context.fillStyle = 'white';
      context.fillText(text, (startX + padding.left), (startY + padding.top));
    },
    fitImage: function(image, width, height, startX, startY, offsetX, offsetY) {
      // Default offset is center
      offsetX = typeof offsetX === "number" ? offsetX : 0.5;
      offsetY = typeof offsetY === "number" ? offsetY : 0.5;

      // Keep bounds [0.0, 1.0]
      if (offsetX < 0) offsetX = 0;
      if (offsetY < 0) offsetY = 0;
      if (offsetX > 1) offsetX = 1;
      if (offsetY > 1) offsetY = 1;

      var imageWidth = image.width,
          imageHeight = image.height,
          ratio = Math.min(width / imageWidth, height / imageHeight),
          newWidth = imageWidth * ratio,   // New prop. width
          newHeight = imageHeight * ratio,   // New prop. height
          containerX, containerY, containerWidth, containerHeight, aspectRatio = 1;

      // Decide which gap to fill
      if (newWidth < width) aspectRatio = width / newWidth;
      if (Math.abs(aspectRatio - 1) < 1e-14 && newHeight < height) aspectRatio = height / newHeight;
      newWidth *= aspectRatio;
      newHeight *= aspectRatio;

      // Calc source rectangle
      containerWidth = imageWidth / (newWidth / width);
      containerHeight = imageHeight / (newHeight / height);

      containerX = (imageWidth - containerWidth) * offsetX;
      containerY = (imageHeight - containerHeight) * offsetY;

      // Make sure source rectangle is valid
      if (containerX < 0) containerX = 0;
      if (containerY < 0) containerY = 0;
      if (containerWidth > imageWidth) containerWidth = imageWidth;
      if (containerHeight > imageHeight) containerHeight = imageHeight;

      // Fill image in dest. rectangle
      settings.context.drawImage(image, containerX, containerY, containerWidth, containerHeight, startX, startY, width, height);
    },
    matchString: function(search, find) {
      return search.includes(find);
    },
    readFile: function(input, callback) {
      var file = input.files[0],
          reader = new FileReader(),
          image = new Image(),
          span = input.nextSibling; // Assume input.js-get-file has span sibling to display file name

      if (file) {
        reader.onload = function(event) {
          // Must be image.src, see: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
          image.src = event.target.result;
          settings.image = image;
        };
        span.innerHTML = input.value.substring(12); // Remove "C:\fakepath\" from imageURL
        reader.readAsDataURL(event.target.files[0]);
        console.log("User image uploaded successfully.");
        // return file;
      }
      setTimeout(function() {
        callback();
      }, 200);
    },
    renderPortrait: function(offsetY) {
      var width = settings.width,
          height = settings.height,
          context = settings.context,
          image = settings.image;

      actions.clearCanvas();
      context.filter = "grayscale(100%) brightness(50%)"; // Apply filters to background image
      actions.fitImage(image, width, height, 0, 0, 0.5, (offsetY ? offsetY : 0.5)); // Draw background image
      context.filter = "none"; // Reset filters so they don't apply to the next image
      actions.fitImage(image, ((width / 2) - (width / 25)), height, (width / 2), 0); // Fit foreground image against the half-way point of canvas, crop as portrait
    }
  };

  function _addListeners() {
    document.querySelectorAll(".generator__button--add-margin-top").forEach(function(thisButton) {
      var parent = thisButton.parentElement,
          input = parent.querySelectorAll("input");

      if (input.length > 1) {
        thisButton.addEventListener("click", function() {
          var blankInputs = 0;

          for(i = 0; i < input.length; i++) {
            if (!input[i].value) {
              blankInputs++;
            }
          }

          if (blankInputs === 0) {
            actions.clearCanvas();

            input.forEach(function(thisInput) {
              var thisValue = thisInput.value,
                  thisFSize = thisInput.dataset.fontSize,
                  thisFWeight = thisInput.dataset.fontWeight,
                  thisYPos = thisInput.dataset.yPos;

                actions.drawText(thisValue, thisFSize, thisFWeight, 80, thisYPos);
            });
          } else {
            alert(blankInputs + " text field(s) were left empty. You must fill each of them to submit.");
          }
        });
      } else {
        thisButton.addEventListener("click", function() {
          var thisInput = input[0],
              thisClass = thisInput.className,
              thisValue = thisInput.value;

          switch (true) {
            case actions.matchString(thisClass, "js-add-courtesy"):
              if (thisValue) {
                actions.addCourtesy(thisValue);
              } else {
                alert("No text added to courtesy field.");
              }
              break;
            case actions.matchString(thisClass, "js-upload-portrait"):
              thisInput.click();
              thisInput.onchange = function() {
                actions.readFile(thisInput, actions.renderPortrait);
              };
              break;
            default:
              console.log("No match found for thisClass.");
              break;
          }
        });
      }
    });
    /*
    document.querySelectorAll("input").forEach(function(thisInput) {
      var parent = thisInput.parentElement,
          button = parent.querySelector(".generator__button"),
          inputClass = thisInput.className;

      if (button) {
        button.addEventListener("click", function() {
          var inputValue = thisInput.value;

          switch (true) {
            case actions.matchString(inputClass, "js-add-courtesy"):
              if (inputValue) {
                actions.addCourtesy(inputValue);
              } else {
                alert("No text added to courtesy field.");
              }
              break;
            case actions.matchString(inputClass, "js-upload-portrait"):
              thisInput.click();
              thisInput.onchange = function() {
                actions.readFile(thisInput, actions.renderPortrait);
              };
              break;
            default:
              console.log("No match found for inputClass.");
              break;
          }
        });
      }
    });
    */
  }

  // Inits
  _addListeners();

  return actions;
})(canvas);
