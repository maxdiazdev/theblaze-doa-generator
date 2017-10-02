// Grab the canvas
var canvas = document.querySelector(".generator__canvas");

// Begin generator module
var generator = (function () {

  // Firefox has 6-year-old bug with text alignment: https://github.com/CreateJS/EaselJS/issues/650
  var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

  var settings = {
    width: canvas.width,
    height: canvas.height,
    context: canvas.getContext("2d"),
    template: canvas.dataset.template,
    font: { family:"\"Helvetica Neue\", \"tex_gyre_heros\", Arial, sans-serif" },
    text: "No text set.",
    image: "No image set."
  };

  var content = {
    text: "No text set.",
    image: "No image set.",
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
      gradient.addColorStop(0.5, "rgba(0, 0, 0, 0.7)");
      gradient.addColorStop(1, "rgba(0, 0, 0 ,0)");
      context.fillStyle = gradient;
      context.fillRect(startX, endY, width, height);
    },
    addCourtesy: function(courtesy) {
      var fSize = 30,
          fWeight = 500,
          fColor = "white",
          startX = 100,
          startY = 35,
          rectColor = "black",
          rectOpacity = 0.5,
          padding = { top: 7, right: 35, bottom: 21 , left: 18 };

      if (courtesy.length > 0) {
        actions.drawTextWithRect(courtesy, fSize, fWeight, fColor, startX, startY, rectColor, rectOpacity, padding);
      } else {
        alert("Courtesy field is empty. Please enter text before submitting.");
      }
    },
    addRadialGradient: function() {
      // http://rectangleworld.com/blog/archives/169
      var canvas = document.createElement("canvas"),
          context = canvas.getContext("2d"),
          rectWidth = settings.width,
          rectHeight = settings.height,
          rx = rectWidth,
        	ry = rectHeight,
        	cx = rectWidth/2,
        	cy = rectHeight/2,
        	scaleX = 0,
        	scaleY = 0,
        	invScaleX = 0,
        	invScaleY = 0,
        	gradient = 0;

      canvas.width = settings.width;
      canvas.height = settings.height;

      if (rx >= ry) {
        scaleX = 1;
        invScaleX = 1;
        scaleY = ry/rx;
        invScaleY = rx/ry;
        gradient = context.createRadialGradient(cx, cy*invScaleY, 0, cx, cy*invScaleY, rx);
      } else {
    		scaleY = 1;
    		invScaleY = 1;
    		scaleX = rx/ry;
    		invScaleX = ry/rx;
    		gradient = context.createRadialGradient(cx*invScaleX, cy, 0, cx*invScaleX, cy, ry);
    	}

      context.fillStyle = gradient;
    	gradient.addColorStop(0.35,"rgba(0, 0, 0 ,0)");
    	gradient.addColorStop(1,"rgba(0, 0, 0, 0.8)");
      context.setTransform(1,0,0,scaleY,0,0);
      context.fillRect(0,0,rectWidth*invScaleX,rectHeight*invScaleY);
      settings.context.drawImage(canvas, 0, 0);

    },
    drawText: function(string, fSize, fWeight, startX, startY) {
      var font = settings.font,
          context = settings.context,
          socialIcon = new Image(),
          marginOfErr = 9;

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
        context.textBaseline = "hanging"; // Ensures letters render from the startY position downward
        context.fillStyle = "white";

        if (socialIcon) {
          socialIcon.onload = function () {
            context.drawImage(socialIcon, startX, startY, (fSize - marginOfErr), (fSize - marginOfErr));
          };
          context.fillText(string, (startX + 42), startY);
        } else {
          context.fillText(string, startX, startY);
        }
      }
    },
    drawTextWithRect: function(text, fSize, fWeight, fColor, startX, startY, rectColor, rectOpacity, padding) {
      var context = settings.context,
          font = settings.font;

      font.size = fSize;
      font.weight = fWeight;

      context.font = font.weight + " " + font.size + "px " + font.family; // Set font properly
      context.textBaseline = "top"; // Draw text from top - makes life easier at the moment
      context.fillStyle = rectColor;

      // Get width and height of rectangle using text size
      var rectWidth = context.measureText(text).width;
      var rectHeight = font.size;

      if (rectOpacity) context.globalAlpha = rectOpacity;

      context.fillRect(startX, startY, (rectWidth + padding.right), (rectHeight + padding.bottom));
      context.globalAlpha = 1.0; // Reset opacity for future drawings
      context.fillStyle = fColor;

      if (isFirefox) {
        startY += 5;
        console.log("Firefox detected. This browser has textBaseline issues. startY was adjusted to: " + startY);
      }

      context.fillText(text, (startX + padding.left), (startY + padding.top));
    },
    downloadCanvas: function() {
      canvas.toBlob(function(blob) {
        settings.template = settings.template.toUpperCase();
        saveAs(blob, settings.template + "_Insert-title-here.jpg");
      });
    },
    fitImage: function(context, image, width, height, startX, startY, offsetX, offsetY) {
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
      context.drawImage(image, containerX, containerY, containerWidth, containerHeight, startX, startY, width, height);
    },
    getPhonerSize: function(newHeight) {
      var ratio = content.image.width / content.image.height,
          newWidth = Math.round(newHeight * ratio);

      content.image.width = newWidth;
      content.image.height = newHeight;
      console.log("Phoner dimensions are: " + newWidth + ", " + newHeight);
    },
    matchString: function(search, find) {
      // search.toLowerCase();
      return search.includes(find);
    },
    readFile: function(event, input, callback) {
      var file = input.files[0],
          reader = new FileReader(),
          image = new Image(),
          display = input.parentElement.querySelector("span");

      if (file) {
        reader.onload = function(event) {
          // Must be image.src, see: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
          image.src = event.target.result;
          content.image = image;
        };
        display.innerHTML = input.value.substring(12); // Remove "C:\fakepath\" from imageURL
        reader.readAsDataURL(event.target.files[0]);
        _enableInputs();
        if (actions.matchString(settings.template, "fs_")) _clearInputs();
        console.log("User image uploaded successfully.");
      }

      setTimeout(function() {
        callback();
      }, 200);
    },
    renderArticleHeadline: function() {
      _clearCanvas();
      settings.context.fillStyle = "white";
      settings.context.fillRect(0, 0, settings.width, settings.height);
      actions.rotateArticle(-5);
      actions.addRadialGradient();
    },
    renderPortrait: function(offsetY) {
      var width = settings.width,
          height = settings.height,
          context = settings.context,
          image = content.image;

      _clearCanvas();
      context.filter = "grayscale(100%) brightness(50%) blur(5px)"; // Apply filters to background image
      actions.fitImage(context, image, width, height, 0, 0, 0.5, (offsetY ? offsetY : 0.5)); // Draw background image
      context.filter = "none"; // Reset filters so they don't apply to the next image
      actions.fitImage(context, image, ((width / 2) - (width / 25)), height, (width / 2), 0, 0.5, 0); // Fit foreground image against the half-way point of canvas, crop as portrait
    },
    renderLandscape: function() {
      actions.fitImage(settings.context, content.image, settings.width, settings.height, 0, 0);
    },
    renderLowerThirds: function() {
      var inputsArray = document.querySelectorAll(".js-add-text-group"),
          blankInputs = 0,
          totalHeight = 0,
          startX = 80,
          startY = 720,
          marginTop = 5;

      // Check for blankInputs and get totalHeight
      inputsArray.forEach(function(input) {
        var fSize = Number(input.dataset.fontSize);
        if (!input.value) blankInputs++;
        totalHeight += fSize;
        startY -= fSize + marginTop;
      });

      startY -= 40;
      console.log(startY);

      // If no blankInputs, then get then render inputs using their data-attributes
      if (blankInputs > 0) {
        alert(blankInputs + " text field(s) empty. Please fill them out before submitting.");
      } else {
        _clearCanvas();
        actions.addBottomGradient(1/3);
        if (content.image != "No image set.") {
          actions.getPhonerSize(totalHeight);
          settings.context.drawImage(content.image, startX, startY, content.image.width, content.image.height);
          startX += content.image.width + 20;
        }
        for (var i = 0; i < inputsArray.length; i++) {
          actions.drawText(inputsArray[i].value, inputsArray[i].dataset.fontSize, inputsArray[i].dataset.fontWeight, startX, startY);
          startY += Number(inputsArray[i].dataset.fontSize) + marginTop;
        }
        _enableInputs();
      }
    },
    renderL3_Phoner: function() {
      var inputsArray = document.querySelectorAll(".js-add-text-group"),
          blankInputs = 0,
          fColor = "",
          startX = 80,
          startY = 450,
          rectColor = "",
          rectOpacity = 1,
          padding = { top: 10, right: 60, bottom: 31, left: 25 };

      // Check for blankInputs and get totalHeight
      inputsArray.forEach(function(input) {
        if (!input.value) blankInputs++;
      });

      if (blankInputs > 0) {
        alert(blankInputs + " text field(s) empty. Please fill them out before submitting.");
      } else {
        _clearCanvas();
        if (content.image != "No image set.") {
          settings.context.strokeStyle = "white";
          settings.context.lineWidth = 10;
          settings.context.strokeRect(startX, startY, 217, 217);
          actions.fitImage(settings.context, content.image, 217, 217, startX, startY, 0.5, 0);
          startX += 217 + 20;
        }
        for (var i = 0; i < inputsArray.length; i++) {
          if (i === 0) {
            rectColor = "black";
            fColor = "white";
          } else {
            rectColor = "white";
            fColor = "black";
          }
          if (i === 1) startY = 530;
          if (i === 2) startY = 600;
          actions.drawTextWithRect(inputsArray[i].value, Number(inputsArray[i].dataset.fontSize), Number(inputsArray[i].dataset.fontWeight), fColor, startX, startY, rectColor, rectOpacity, padding);
        }
        _enableInputs();
      }

      console.log(blankInputs);
    },
    renderSideLeft: function() {
      actions.fitImage(settings.context, content.image, settings.width / 2, settings.height, 0, 0, 0.5, 0);
    },
    renderSideRight: function() {
      actions.fitImage(settings.context, content.image, settings.width / 2, settings.height, settings.width / 2, 0, 0.5, 0);
    },
    rotateArticle: function(degrees) {
      var canvas = document.createElement("canvas"),
          context = canvas.getContext("2d");

      canvas.width = settings.width;
      canvas.height = settings.height;

      context.save(); // Save the unrotated context of the canvas so we can restore it later
      context.rotate(degrees*Math.PI/180);
      context.translate(-30, 50);
      actions.fitImage(context, content.image, settings.width, settings.height, 0, 0);
      settings.context.drawImage(canvas, 0, 0);
      context.restore(); // We’re done with the rotating so restore the unrotated context
    }
  };

  function _addListeners() {
    var fieldsets = document.querySelectorAll(".generator__fieldset");

    fieldsets.forEach(function(fieldset) {
      var fieldButton = fieldset.querySelector(".generator__button"),
          fieldInput = fieldset.querySelector("input");

      fieldButton.addEventListener("click", function() {
        var inputClass = fieldInput.className,
            inputValue = fieldInput.value;

        switch (true) {
          case actions.matchString(inputClass, "js-add-courtesy"):
            if (settings.template == "fs_portrait") {
              actions.renderPortrait();
            } else if (settings.template == "fs_landscape") {
              actions.renderLandscape();
            } else {
              _clearCanvas();
            }
            actions.addCourtesy(inputValue);
            break;
          case actions.matchString(inputClass, "js-add-text-group"):
            if (settings.template == "l3_gradient") {
              actions.renderLowerThirds();
            } else if (settings.template == "l3_phoner") {
              actions.renderL3_Phoner();
            }
            break;
          case actions.matchString(inputClass, "js-upload-article"):
            fieldInput.click();
            fieldInput.onchange = function(event) {
              event = event || window.event;
              actions.readFile(event, fieldInput, actions.renderArticleHeadline);
            };
            break;
          case actions.matchString(inputClass, "js-upload-landscape"):
            fieldInput.click();
            fieldInput.onchange = function(event) {
              event = event || window.event;
              actions.readFile(event, fieldInput, actions.renderLandscape);
            };
            break;
          case actions.matchString(inputClass, "js-upload-phoner"):
            fieldInput.click();
            fieldInput.onchange = function(event) {
              event = event || window.event;
              if (settings.template == "l3_gradient") {
                actions.readFile(event, fieldInput, actions.renderLowerThirds);
              } else if (settings.template == "l3_phoner") {
                actions.readFile(event, fieldInput, actions.renderL3_Phoner);
              }
            };
            break;
          case actions.matchString(inputClass, "js-upload-portrait"):
            fieldInput.click();
            fieldInput.onchange = function(event) {
              event = event || window.event;
              actions.readFile(event, fieldInput, actions.renderPortrait);
            };
            break;
          case actions.matchString(inputClass, "js-upload-side-left"):
            fieldInput.click();
            fieldInput.onchange = function(event) {
              event = event || window.event;
              actions.readFile(event, fieldInput, actions.renderSideLeft);
            };
            break;
          case actions.matchString(inputClass, "js-upload-side-right"):
            fieldInput.click();
            fieldInput.onchange = function(event) {
              event = event || window.event;
              actions.readFile(event, fieldInput, actions.renderSideRight);
            };
            break;
          default:
            console.log("No match found for inputClass.");
            break;
        }
      });
    });
  }

  function _clearCanvas() {
    settings.context.clearRect(0, 0, settings.width, settings.height);
    settings.context.beginPath(); // Essential to clear rectangles, images, etc.
  }

  function _clearInputs() {
    var allInputs = document.querySelectorAll("input");

    allInputs.forEach(function(input) {
      input.value = "";
    });
  }

  function _enableInputs() {
    var disabledField = document.querySelector(".generator__fieldset--disabled"),
        children = "";

    if (disabledField) {
      children = disabledField.children;
      disabledField.classList.remove("generator__fieldset--disabled");
      for (var i = 0; i < children.length; i++) {
        if (children[i].tagName == "INPUT" || children[i].tagName == "BUTTON") {
          children[i].disabled = false;
        }
      }
    }
  }

  function _setSortables() {
    var sortParent = document.getElementById("jsSortable");
    if (sortParent) {
      var sortable = Sortable.create(sortParent, {
        draggable: ".js-sortable-item", // must include the dot
        dragClass: "js-sortable-drag",
        ghostClass: "js-sortable-ghost",
        chosenClass: "js-sortable-chosen",
        filter: ".js-sortable-remove",
        onFilter: function(event) {
          var item = event.item,
              control = event.target;

          if (Sortable.utils.is(control, ".js-sortable-remove")) {
            item.parentNode.removeChild(item);
          }
        },
        onEnd: function(event) {
          //
        }
      });
    } else {
      console.log("No sortable items found.");
    }
  }

  // Inits
  _clearInputs();
  _addListeners();
  _setSortables();

  if (settings.template == "l3_gradient") {
    actions.addBottomGradient(1/3);
  } else if (settings.template == "fs_article") {
    actions.addRadialGradient();
  }

  return actions;
})(canvas);
