// Grab the canvas
var canvas = document.querySelector(".generator__canvas");

// Begin generator module
var generator = (function () {
  var canvasCopy = document.createElement("canvas"); // Used to save canvas edits throughout app

  var settings = {
    width: canvas.width,
    height: canvas.height,
    context: canvas.getContext("2d"),
    template: canvas.dataset.template,
    font: { family:"\"Helvetica Neue\", \"tex_gyre_heros\", Arial, sans-serif" },
    group: "No group set.", // Store a group of elements for later use
    image: "No image set."
  };

  canvasCopy.width = canvas.width;
  canvasCopy.height = canvas.height;

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

      console.log("Courtesy is: " + courtesy);

      if (courtesy.length > 0) {
        if (settings.image != "No image set.") {
          actions.clearCanvas();
          actions.restoreState(); // Restores initial portrait without a courtesy
        }
        actions.drawTextWithRect(courtesy, fSize, fWeight, startX, startY, rectColor, rectOpacity, padding);
      }
    },
    addPhoner: function() {
      var ratio = settings.image.width / settings.image.height,
          newHeight = actions.getLowerThirdsHeight(),
          newWidth = Math.round(newHeight * ratio),
          startX = 80,
          startY = Number(settings.group[0].dataset.baselineY - settings.group[0].dataset.fontSize) + 8;

      actions.clearCanvas();
      actions.addBottomGradient(1/3);
      actions.fitImage(settings.image, newWidth, newHeight, startX, startY);
      settings.image.width = newWidth;
      settings.image.height = newHeight;
      actions.saveState();
      console.log("Phoner dimensions are: " + newWidth + ", " + newHeight);
    },
    clearCanvas: function() {
      settings.context.clearRect(0, 0, settings.width, settings.height);
    },
    clearInputs: function() {
      var allInputs = document.querySelectorAll("input");

      allInputs.forEach(function(input) {
        input.value = "";
      });
    },
    downloadCanvas: function() {
      canvas.toBlob(function(blob) {
        if (settings.template == "lower-thirds") {
          saveAs(blob, "Untitled_1280x720.png");
        } else {
          saveAs(blob, "Untitled_1280x720.jpg");
        }
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
            context.drawImage(socialIcon, startX, (startY - fSize + 5), fSize, fSize);
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

      if (rectOpacity > 0) context.globalAlpha = 0.5;

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
    getLowerThirdsHeight: function() {
      var inputsArray = settings.group,
          totalHeight = 0;

      inputsArray.forEach(function(input) {
        var fSize = Number(input.dataset.fontSize),
            baselineY = Number(input.dataset.baselineY);

        totalHeight += fSize;
      });

      return totalHeight;
    },
    getLowerThirdsBlanks: function() {
      var inputsArray = settings.group,
          blankInputs = 0;

      inputsArray.forEach(function(input) {
        if (!input.value) {
          blankInputs++;
        }
      });

      return blankInputs;
    },
    matchString: function(search, find) {
      search.toLowerCase();
      return search.includes(find);
    },
    readFile: function(input, callback) {
      var file = input.files[0],
          reader = new FileReader(),
          image = new Image(),
          display = input.parentElement.querySelector("span");

      if (file) {
        reader.onload = function(event) {
          // Must be image.src, see: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
          image.src = event.target.result;
          settings.image = image;
        };
        display.innerHTML = input.value.substring(12); // Remove "C:\fakepath\" from imageURL
        reader.readAsDataURL(event.target.files[0]);
        actions.clearInputs();
        console.log("User image uploaded successfully.");
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
      context.filter = "grayscale(100%) brightness(50%) blur(5px)"; // Apply filters to background image
      actions.fitImage(image, width, height, 0, 0, 0.5, (offsetY ? offsetY : 0.5)); // Draw background image
      context.filter = "none"; // Reset filters so they don't apply to the next image
      actions.fitImage(image, ((width / 2) - (width / 25)), height, (width / 2), 0); // Fit foreground image against the half-way point of canvas, crop as portrait
      actions.saveState();
    },
    renderLowerThirds: function() {
      var inputsArray = settings.group,
          blankInputs = actions.getLowerThirdsBlanks(),
          startX = 80,
          marginRight = 35;

      if (settings.image != "No image set.") startX += settings.image.width + marginRight;

      if (blankInputs > 1) {
        alert(blankInputs + " text fields are empty. Please fill them out before submitting.");
      } else if (blankInputs === 1) {
        alert(blankInputs + " text field is empty. Please fill it out before submitting.");
      } else {
        if (settings.image == "No image set.") {
          actions.clearCanvas();
          actions.addBottomGradient(1/3);
        } else {
          actions.clearCanvas();
          actions.restoreState();
        }
        inputsArray.forEach(function(input) {
          inputValue = input.value;
          fSize = input.dataset.fontSize;
          fWeight = input.dataset.fontWeight;
          baselineY = input.dataset.baselineY;

          actions.drawText(inputValue, fSize, fWeight, startX, baselineY);
        });
      }
    },
    restoreState: function() {
      settings.context.drawImage(canvasCopy, 0, 0);
    },
    saveState: function() {
      var contextCopy = canvasCopy.getContext("2d");
      contextCopy.drawImage(canvas, 0, 0);
    }
  };

  function _addListeners() {
    var fieldButtons = document.querySelectorAll(".generator__button--add-margin-top");

    fieldButtons.forEach(function(button) {
      var parent = button.parentElement,
          inputsArray = parent.querySelectorAll("input"),
          input = inputsArray[0],
          inputClass = input.className;

      if (inputsArray.length > 1) {
        settings.group = inputsArray;
      }

      button.addEventListener("click", function() {

        switch (true) {
          case actions.matchString(inputClass, "js-add-courtesy"):
            actions.addCourtesy(input.value);
            break;
          case actions.matchString(inputClass, "js-upload-portrait"):
            input.click();
            input.onchange = function() {
              actions.readFile(input, actions.renderPortrait);
            };
            break;
          case actions.matchString(inputClass, "js-upload-phoner"):
            input.click();
            input.onchange = function() {
              actions.readFile(input, actions.addPhoner);
            };
            break;
          case actions.matchString(inputClass, "js-add-text-group"):
            actions.renderLowerThirds();
            break;
          default:
            console.log("No match found for inputClass.");
            break;
        }
      });
    });
  }

  // Inits
  _addListeners();

  if (settings.template == "lower-thirds") {
    actions.addBottomGradient(1/3);
  }

  return actions;
})(canvas);
