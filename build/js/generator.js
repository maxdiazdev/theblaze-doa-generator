// Grab the canvas
var canvas = document.getElementById("jsGeneratorCanvas");

// Begin generator module
var generator = (function() {

  // Check for Firefox. It has a bug with text alignments: https://github.com/CreateJS/EaselJS/issues/650
  var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

  // Store canvas attributes
  var settings = {
    width: canvas.width,
    height: canvas.height,
    context: canvas.getContext("2d"),
    template: canvas.dataset.template,
    font: "\"Helvetica Neue\""
  };

  // Store drawn text or images as needed, throughout the app
  var content = {};

  // Singular actions (hopefully) that the renders object uses
  var actions = {

    /* ACTIONS: Add Bottom Gradient
    ====================================== */
    addBottomGradient: function(ratio) {
      var startX = 0,
          startY = settings.height,
          endX = 0,
          endY = settings.height - settings.height * ratio,
          gradient = settings.context.createLinearGradient(startX, startY, endX, endY);

      gradient.addColorStop(0, "rgba(0, 0, 0, 1)");
      gradient.addColorStop(0.5, "rgba(0, 0, 0, 0.7)");
      gradient.addColorStop(1, "rgba(0, 0, 0 ,0)");
      settings.context.fillStyle = gradient;
      settings.context.fillRect(startX, endY, settings.width, settings.height);
    },

    /* ACTIONS: Add Phoner
    ====================================== */
    addPhoner: function(offsetCropX, offsetCropY) {
      var context = settings.context,
          startX = 80,
          startY = 500,
          squareDimensions = 178;

      context.strokeStyle = "white";
      context.lineWidth = 7;
      context.strokeRect(startX, startY, squareDimensions, squareDimensions);
      actions.fitImage(content.image, squareDimensions, squareDimensions, startX, startY, offsetCropX, offsetCropY);
    },

    /* ACTIONS: Add Radial Gradient
    ====================================== */
    addRadialGradient: function() {
      // Source: http://rectangleworld.com/blog/archives/169
      var newCanvas = document.createElement("canvas"),
          newContext = newCanvas.getContext("2d"),
          rx = settings.width,
          ry = settings.height,
          cx = rx/2,
          cy = ry/2,
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
        scaleY = ry/rx;
        invScaleY = rx/ry;
        gradient = newContext.createRadialGradient(cx, cy*invScaleY, 0, cx, cy*invScaleY, rx);
      } else {
        scaleY = 1;
        invScaleY = 1;
        scaleX = rx/ry;
        invScaleX = ry/rx;
        gradient = newContext.createRadialGradient(cx*invScaleX, cy, 0, cx*invScaleX, cy, ry);
      }

      newContext.fillStyle = gradient;
      gradient.addColorStop(0.35,"rgba(0, 0, 0 ,0)");
      gradient.addColorStop(1,"rgba(0, 0, 0, 0.8)");
      newContext.setTransform(1,0,0,scaleY,0,0);
      newContext.fillRect(0,0,rx*invScaleX,ry*invScaleY);
      settings.context.drawImage(newCanvas, 0, 0);
    },

    /* ACTIONS: Add Text
    ====================================== */
    addText: function(string, fSize, fWeight, fColor, startX, startY) {
      var fFamily = settings.font,
          context = settings.context,
          social = actions.checkSocial(string);

      if (string.length > 0) {
        context.font = fWeight + " " + fSize + "px " + fFamily;
        context.textBaseline = "hanging"; // Ensures letters render from the startY position downward
        context.fillStyle = fColor;

        if (social) {
          social.image.onload = function() {
            var marginOfErr = 9,
                squareDimensions = fSize - marginOfErr,
                marginRight = 10;

            context.drawImage(social.image, startX, startY, squareDimensions, squareDimensions);
            context.fillText(social.handle, (startX + squareDimensions + marginRight), startY);
          };
        } else {
          context.fillText(string, startX, startY);
        }
      }
    },

    /* ACTIONS: Add Text with Rectangle
    ====================================== */
    addTextWithRect: function(string, fSize, fWeight, fColor, startX, startY, rectColor, rectOpacity, rectPadding) {
      // Source: https://stackoverflow.com/questions/18900117/write-text-on-canvas-with-background
      var context = settings.context,
          fFamily = settings.font,
          rectWidth = "",
          rectHeight = fSize + rectPadding.bottom,
          marginOfErr = 5,
          social = actions.checkSocial(string),
          socialDimensions = fSize - marginOfErr,
          marginRight = 10;

      context.font = fWeight + " " + fSize + "px " + fFamily;
      context.textBaseline = "top";
      context.fillStyle = rectColor;

      if (social) {
        string = social.handle;
        rectWidth = socialDimensions + marginRight;
      }

      // Set after context.font so string width is measured accurately
      rectWidth += context.measureText(string).width + rectPadding.right;

      // Assume these values represent a courtesy
      if (fSize == 30 && rectOpacity == 0.5) {
        // Save the courtesy's destination before it is drawn! That way we can erase it without clearing the entire canvas.
        actions.saveCourtesyArea(rectWidth, rectHeight);
      }

      if (rectOpacity) context.globalAlpha = rectOpacity;
      context.fillRect(startX, startY, rectWidth, rectHeight);
      context.globalAlpha = 1.0; // Reset opacity
      context.fillStyle = fColor;

      if (isFirefox) {
        startY += 5;
        console.log("Firefox detected. startY was adjusted to " + startY + " to compensate for textBaseline bug");
      }

      if (social) {
        social.image.onload = function() {
          context.drawImage(social.image, (startX + rectPadding.left), (startY + rectPadding.top + marginOfErr), socialDimensions, socialDimensions);
        };
      }

      if (social) {
        context.fillText(string, (startX + socialDimensions + rectPadding.left + marginRight), (startY + rectPadding.top));
      } else {
        context.fillText(string, (startX + rectPadding.left), (startY + rectPadding.top));
      }
    },

    /* ACTIONS: Check for Blank Inputs
    ====================================== */
    checkBlankInputs: function(inputsArray) {
      var blankInputs = 0;
      inputsArray.forEach(function(input) {
        if (!input.value) blankInputs++;
      });
      return blankInputs;
    },

    /* ACTIONS: Check for Social Media
    ====================================== */
    checkSocial: function(string) {
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
        default:
          social = false;
          break;
      }

      return social;
    },

    /* ACTIONS: Clear Canvas
    ====================================== */
    clearCanvas: function() {
      settings.context.clearRect(0, 0, settings.width, settings.height);
      settings.context.beginPath(); // Essential to clear rectangles, images, etc.
    },

    /* ACTIONS: Clear Inputs
    ====================================== */
    clearInputs: function() {
      var allInputs = document.querySelectorAll("input");

      allInputs.forEach(function(input) {
        input.value = "";
      });
    },

    /* ACTIONS: Create Adjustment Fieldset
    ====================================== */
    createAdjustment: function(fileFieldset, axisLetter, buttonAttr) {
      var posFieldset = document.createElement("fieldset"),
          axisName = (axisLetter == "X" ? "horizontally" : "vertically");

      posFieldset.className = "generator__fieldset";
      posFieldset.className += " js-generator-pos-fieldset"; // Used for removeAdjustment function. Must include space!

      if (buttonAttr) {
        buttonAttr = "data-" + buttonAttr.name + "='" + buttonAttr.value + "'";

        posFieldset.innerHTML = "<label class=\"generator__directions\">Adjust the photo " + axisName + ", if needed.</label><input class=\"generator__input generator__input--number\" type=\"number\" min=\"0\" max=\"100\" step=\"10\" value=\"50\"/><button class=\"generator__button\" type=\"button\" onclick=\"generator.adjustImg(this, '" + axisLetter + "', 'decrease')\" " + buttonAttr + ">-10%</button><button class=\"generator__button\" type=\"button\" onclick=\"generator.adjustImg(this, '" + axisLetter + "', 'increase')\" " + buttonAttr + ">+10%</button>";
      } else {
        posFieldset.innerHTML = "<label class=\"generator__directions\">Adjust the photo " + axisName + ", if needed.</label><input class=\"generator__input generator__input--number\" type=\"number\" min=\"0\" max=\"100\" step=\"10\" value=\"50\"/><button class=\"generator__button\" type=\"button\" onclick=\"generator.adjustImg(this, '" + axisLetter + "', 'decrease')\">-10%</button><button class=\"generator__button\" type=\"button\" onclick=\"generator.adjustImg(this, '" + axisLetter + "', 'increase')\">+10%</button>";
      }

      insertAfter(posFieldset, fileFieldset);

      // Source: https://stackoverflow.com/questions/4793604/how-to-insert-an-element-after-another-element-in-javascript-without-using-a-lib
      function insertAfter(newNode, referenceNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
      }
    },

    /* ACTIONS: Enable Inputs
    ====================================== */
    enableInputs: function() {
      var disabledField = document.querySelectorAll(".generator__fieldset--disabled");

      disabledField.forEach(function(field) {
        var children = field.children;
        field.classList.remove("generator__fieldset--disabled");
        for (var i = 0; i < children.length; i++) {
          if (children[i].tagName == "INPUT" || children[i].tagName == "BUTTON") children[i].disabled = false;
        }
      });
    },

    /* ACTIONS: Fit Image
    ====================================== */
    fitImage: function(image, dWidth, dHeight, startX, startY, offsetCropX, offsetCropY) {
      // Source: https://stackoverflow.com/questions/21961839/simulation-background-size-cover-in-canvas

      var context = settings.context,
          highestRatio = 0,
          newImageWidth = 0,
          newImageHeight = 0,
          croppedAtX, subRectY, subRectWidth, subRectHeight, aspectRatio = 1;

      if (image != null) {

        // If only image is provided, default destination is top-left corner of canvas
        if (arguments.length === 1) {
          dWidth = settings.width;
          dHeight = settings.height;
          startX = 0;
          startY = 0;
        }

        // Default offset is center
        offsetCropX = typeof offsetCropX === "number" ? offsetCropX : 0.5;
        offsetCropY = typeof offsetCropY === "number" ? offsetCropY : 0.5;

        // Keep bounds [0.0, 1.0]
        if (offsetCropX < 0) offsetCropX = 0;
        if (offsetCropY < 0) offsetCropY = 0;
        if (offsetCropX > 1) offsetCropX = 1;
        if (offsetCropY > 1) offsetCropY = 1;

        highestRatio = Math.min(dWidth / image.width, dHeight / image.height);
        newImageWidth = image.width * highestRatio;
        newImageHeight = image.height * highestRatio;

        // Decide which gap to fill
        if (newImageWidth < dWidth) aspectRatio = dWidth / newImageWidth;
        if (Math.abs(aspectRatio - 1) < 1e-14 && newImageHeight < dHeight) aspectRatio = dHeight / newImageHeight;

        newImageWidth *= aspectRatio;
        newImageHeight *= aspectRatio;

        // Calc source rectangle
        croppedImageWidth = image.width / (newImageWidth / dWidth);
        croppedImageHeight = image.height / (newImageHeight / dHeight);
        croppedAtX = (image.width - croppedImageWidth) * offsetCropX;
        croppedAtY = (image.height - croppedImageHeight) * offsetCropY;

        // Make sure source rectangle is valid
        if (croppedAtX < 0) croppedAtX = 0;
        if (croppedAtY < 0) croppedAtY = 0;
        if (croppedImageWidth > image.width) croppedImageWidth = image.width;
        if (croppedImageHeight > image.height) croppedImageHeight = image.height;

        // Fill image in dest. rectangle
        context.drawImage(image, croppedAtX, croppedAtY, croppedImageWidth, croppedImageHeight, startX, startY, dWidth, dHeight);

        // NOTE: Check for display inputs, and show corresponding pos
      } else {
        console.log("No image passed to fitImage.");
      }
    },

    /* ACTIONS: Get Input
    ====================================== */
    getFile: function(input, callback) {
      input.click();
      input.onchange = function(event) {
        event = event || window.event; // Cross-browser compatibility
        actions.readFile(event, input, callback);
      };
    },

    /* ACTIONS: Get Input
    ====================================== */
    getInput: function(button) {
      parent = button.parentElement;
      input = parent.querySelector("input");
      return input;
    },

    /* ACTIONS: Read File
    ====================================== */
    readFile: function(event, input, callback) {
      var file = input.files[0],
          reader = new FileReader(),
          image = new Image(),
          display = input.parentElement.querySelector("span");

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
          var button = input.parentElement.querySelector("button");
          if (settings.template == "fs_side-by-side") {
            console.log("FS_SIDE-BY-SIDE");
            if (button.dataset.fsSide == "left") {
              content.imageLeft = image;
              content.imageLeft.ratio = image.width / image.height;
            } else {
              content.imageRight = image;
              content.imageRight.ratio = image.width / image.height;
            }
            console.log(content.imageLeft + ", " + content.imageRight);
          } else {
            content.image = image;
            content.image.ratio = image.width / image.height;
          }
          display.innerHTML = input.value.substring(12); // Remove "C:\fakepath\" from imageURL
          callback();
        }, 200);
      }
    },

    /* ACTIONS: Remove Adjustment Fieldsets
    ====================================== */
    removeAdjustment: function(fileFieldset) {
      var sibling = fileFieldset.nextElementSibling;
      if (sibling.classList.contains("js-generator-pos-fieldset")) sibling.remove();
    },

    /* ACTIONS: Restore Courtesy Area
    ====================================== */
    restoreCourtesyArea: function() {
      var startX = 100,
          startY = 35;

      settings.context.putImageData(content.slice, startX, startY);
    },

    /* ACTIONS: Rotate Image
    ====================================== */
    rotateImage: function(degrees) {
      var newCanvas = document.createElement("canvas"),
          newContext = newCanvas.getContext("2d");

      newCanvas.width = settings.width;
      newCanvas.height = settings.height;

      newContext.save(); // Save unrotated phantom canvas
      newContext.rotate(degrees*Math.PI/180);
      newContext.translate(-30, 50);
      settings.context = newContext; // Ensure fitImage uses phantom context
      actions.fitImage(content.image);
      settings.context = canvas.getContext("2d"); // Reset context back to original canvas
      settings.context.drawImage(newCanvas, 0, 0);
      newContext.restore(); // Restore unrotated phantom canvas for future use
    },

    /* ACTIONS: Save Courtesy Area
    ====================================== */
    saveCourtesyArea: function(rectWidth, rectHeight) {
      // Source: https://www.w3schools.com/tags/canvas_getimagedata.asp
      var startX = 100,
          startY = 35,
          marginOfErr = 10; // Occasionally, courtesy will leave behind a few pixels of previous rectangle

      content.slice = settings.context.getImageData(startX, startY, rectWidth + marginOfErr, rectHeight);
    },

    /* ACTIONS: Set Sortables
    ====================================== */
    setSortables: function() {
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
  };

  // Collection of actions to accomplish a render / template
  var render = {

    /* RENDER: Adjust image... It should be in actions, but we need to access it publicly.
    ====================================== */
    adjustImg: function(button, axisLetter, direction) {
      var input = actions.getInput(button);
          value = Number(input.value);

      if (direction == "decrease" && value > 0) {
        value -= 10;
        input.value = value;
      } else if (direction == "increase" && value < 100) {
        value += 10;
        input.value = value;
      }

      // Change value to decimal for fitImage function
      value /= 100;

      // Use core render functions to redraw images according to their axis
      if (axisLetter == "X") {
        if (settings.template == "fs_portrait") actions.fitImage(content.image, (settings.width / 2 - settings.width / 25), settings.height, (settings.width / 2), 0, value, 0.5);

        if (settings.template == "fs_side-by-side" && button.dataset.fsSide == "left") {
          actions.fitImage(content.imageLeft, settings.width / 2, settings.height, 0, 0, value, 0.5);
        } else if (settings.template == "fs_side-by-side" && button.dataset.fsSide == "right") {
          actions.fitImage(content.imageRight, settings.width / 2, settings.height, settings.width / 2, 0, value, 0.5);
        }
      } else {
        if (settings.template == "fs_landscape") {
          actions.fitImage(content.image, settings.width, settings.height, 0, 0, 0.5, value);
          if (content.courtesy != null) actions.addTextWithRect(content.courtesy, 30, 500, "white", 100, 35, "black", 0.5, { top: 7, right: 35, bottom: 21, left: 18});
        }

        if (settings.template == "fs_side-by-side" && button.dataset.fsSide == "left") {
          actions.fitImage(content.imageLeft, settings.width / 2, settings.height, 0, 0, 0.5, value);
        } else if (settings.template == "fs_side-by-side" && button.dataset.fsSide == "right") {
          actions.fitImage(content.imageRight, settings.width / 2, settings.height, settings.width / 2, 0, 0.5, value);
        }

        if (settings.template == "l3_phoner") actions.fitImage(content.image, 170, 170, 80, 500, 0.5, value);
      }
    },

    /* RENDER: Article
    ====================================== */
    article: function(button) {
      var input = actions.getInput(button);
      actions.getFile(input, function() {
        if (content.image.ratio > 1) {
          settings.context.fillStyle = "white";
          settings.context.fillRect(0, 0, settings.width, settings.height);
          actions.rotateImage(-5);
          actions.addRadialGradient();
          actions.enableInputs();
        } else {
          alert("This image is PORTRAIT-oriented. Please submit a different screenshot.");
        }
      });
    },

    /* RENDER: Courtesy
    ====================================== */
    courtesy: function(button) {
      var courtesy = actions.getInput(button).value,
          fSize = 30,
          fWeight = 500,
          fColor = "white",
          startX = 100,
          startY = 35,
          rectColor = "black",
          rectOpacity = 0.5,
          rectPadding = {
            top: 7,
            right: 35,
            bottom: 21,
            left: 18
          };

      if (courtesy.length > 0) {
        if (content.slice) actions.restoreCourtesyArea();
        if (settings.template == "fs_landscape") content.courtesy = courtesy; // adjustImg function redraws the courtesy from scratch after moving fs_landscape background up or down. We can't use content.slice in this situation because it wouldn't match the background after its been moved.
        actions.addTextWithRect(courtesy, fSize, fWeight, fColor, startX, startY, rectColor, rectOpacity, rectPadding);
        if (settings.template == "courtesy") actions.enableInputs();
      } else {
        alert("Courtesy field is empty. Please enter text before submitting.");
      }
    },

    /* RENDER: Download canvas... It should be in actions, but we need to access it publicly.
    ====================================== */
    download: function(button) {
      var fileName = actions.getInput(button).value;

      if (fileName) {
        canvas.toBlob(function(blob) {
          saveAs(blob, fileName + ".png");
        });
      } else {
        alert("Please enter a file name before downloading.");
      }
    },

    /* RENDER: Landscape
    ====================================== */
    landscape: function(button) {
      var input = actions.getInput(button);
      actions.getFile(input, function() {
        if (content.image.ratio > 1) {
          actions.clearCanvas();
          actions.removeAdjustment(button.parentElement);
          actions.clearInputs();
          content.slice = null; // Reset courtesy slices

          actions.fitImage(content.image);
          if (content.image.ratio != settings.width / settings.height) actions.createAdjustment(button.parentElement, "Y");
          actions.enableInputs();
        } else {
          alert("This image is PORTRAIT-oriented. Please use the fs_portrait template instead.");
        }
      });
    },

    /* RENDER: L3 Gradient
    ====================================== */
    l3_gradient: function(button) {
      var input = button.parentElement.querySelector("input"),
          startX = 80,
          startY = 500,
          marginTop = 5,
          marginRight = 20;

      if (input.type == "file") {
        actions.getFile(input, function() {
          var maxHeight = 170,
              newImageWidth = content.image.ratio * maxHeight;

          actions.clearCanvas();
          actions.addBottomGradient(1/3);
          content.slice = settings.context.getImageData((startX + newImageWidth + marginRight), startY, (settings.width - startX), (settings.height - startY));
          actions.clearInputs();
          settings.context.drawImage(content.image, startX, startY, newImageWidth, maxHeight);
          content.image.width = newImageWidth;
          content.image.height = maxHeight;
        });
      } else {
        var inputsArray = button.parentElement.querySelectorAll("input"),
            blankInputs = actions.checkBlankInputs(inputsArray);

        if (content.image != null) {
          startX += content.image.width + marginRight;
          settings.context.clearRect(startX, startY, (settings.width - startX), (settings.height - startY)); // Deletes any previous text
          console.log(startY);
          settings.context.putImageData(content.slice, startX, startY);
        } else {
          actions.clearCanvas();
          actions.addBottomGradient(1/3);
        }

        // Starts inversely, add padding between bottom edge of text group and bottom edge of canvas
        startY = 720 - 40;

        // Calculate how far up the text group needs to be drawn from the bottom of the canvas
        inputsArray.forEach(function(input) {
          var fSize = Number(input.dataset.fontSize);
          startY -= fSize + marginTop;
        });

        if (blankInputs > 0) {
          alert(blankInputs + " text field(s) empty. Please fill them out before submitting.");
        } else {
          // actions.clearCanvas();
          // actions.addBottomGradient(1/3);
          inputsArray.forEach(function(input) {
            actions.addText(input.value, Number(input.dataset.fontSize), input.dataset.fontWeight, "white", startX, startY);
            startY += Number(input.dataset.fontSize) + marginTop;
            // NOTE: Figure out how to combine the two forEach loops above
          });
          actions.enableInputs();
        }
      }
    },

    /* RENDER: L3 Phoner
    ====================================== */
    l3_phoner: function(button) {
      var input = actions.getInput(button),
          startX = 80,
          startY = 500,
          squareDimensions = 170,
          marginRight = 20,
          rectOpacity = 1,
          rectPadding = {
            top: 5,
            right: 40,
            bottom: 20,
            left: 20
          };

      if (input.type == "file") {
        actions.getFile(input, function() {

          if (content.image.ratio <= 1) {
            actions.clearCanvas();
            actions.removeAdjustment(button.parentElement);
            actions.clearInputs();

            // Deletes phoner image previously drawn, leaving behind transparent canvas
            // settings.context.clearRect(startX, startY, squareDimensions, squareDimensions);

            // White border
            settings.context.strokeStyle = "white";
            settings.context.lineWidth = 7;
            settings.context.strokeRect(startX, startY, squareDimensions, squareDimensions);

            // Cropped foreground image
            actions.fitImage(content.image, squareDimensions, squareDimensions, startX, startY);

            // Don't present adjustment to square images – they already fit perfectly
            if (content.image.ratio !== 1) actions.createAdjustment(button.parentElement, "Y");

            // NOTE: What about situation where image size is 1188 x 1189?
          } else {
            alert("This image is LANDSCAPE-oriented. Please submit a different photo.");
          }
        });
      } else {
        var inputsArray = button.parentElement.querySelectorAll("input"),
            blankInputs = actions.checkBlankInputs(inputsArray);

        if (blankInputs > 0) {
          alert(blankInputs + " text field(s) empty. Please fill them out before submitting.");
        } else {
          // Draw "On the Phone"
          if (content.image != null) startX += squareDimensions + marginRight;
          settings.context.clearRect(startX, startY, (settings.width - startX), (settings.height - startY)); // Deletes phoner text previously drawn, leaving behind transparent canvas
          actions.addTextWithRect("On the Phone", 33, 500, "white", startX, startY, "black", rectOpacity, rectPadding);

          // Draw rest of text
          inputsArray.forEach(function(input) {
            startY += 60;
            actions.addTextWithRect(input.value, Number(input.dataset.fontSize), Number(input.dataset.fontWeight), "black", startX, startY, "white", rectOpacity, rectPadding);
          });

          actions.enableInputs();
        }
      }
    },

    /* RENDER: Portrait
    ====================================== */
    portrait: function(button) {
      var input = actions.getInput(button);
      actions.getFile(input, function() {
        var maxWidth = (settings.width / 2) - (settings.width / 25),
            newImageWidth = content.image.ratio * settings.height;

        if (content.image.ratio <= 1) {
          actions.clearCanvas();
          actions.removeAdjustment(button.parentElement);
          actions.clearInputs();
          content.slice = null; // Reset courtesy slices

          // Background image
          settings.context.filter = "grayscale(100%) brightness(50%) blur(5px)";
          actions.fitImage(content.image);

          // Foreground image
          settings.context.filter = "none";
          if (newImageWidth > maxWidth) {
            actions.fitImage(content.image, maxWidth, settings.height, (settings.width / 2), 0);
            actions.createAdjustment(button.parentElement, "X");
          } else {
            settings.context.drawImage(content.image, settings.width / 2, 0, newImageWidth, settings.height);
          }

          actions.enableInputs();
        } else {
          alert("This image is LANDSCAPE-oriented. Please use the fs_landscape template instead.");
        }
      });
    },

    /* RENDER: Side-by-side
    ====================================== */
    sideBySide: function(button) {
      var input = actions.getInput(button),
          side = button.dataset.fsSide;

      actions.getFile(input, function() {
        actions.removeAdjustment(button.parentElement);

        if (side == "left") {
          actions.fitImage(content.imageLeft, settings.width / 2, settings.height, 0, 0);
          determineAdj(content.imageLeft);
        } else {
          actions.fitImage(content.imageRight, settings.width / 2, settings.height, settings.width / 2, 0);
          determineAdj(content.imageRight);
          actions.enableInputs();
        }

        function determineAdj(image) {
          if (image.ratio < 1) {
            actions.createAdjustment(button.parentElement, "Y", {name: "fs-side", value: side});
          } else {
            actions.createAdjustment(button.parentElement, "X", {name: "fs-side", value: side});
          }
        }
      });
    }
  };

  if (settings.template == "l3_gradient") {
    actions.setSortables();
    actions.addBottomGradient(1/3);
  }
  return render;
})(canvas);
