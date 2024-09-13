      let captured = false;
      let HappyCntr = 0;
      let currentImageIndex = 0;
      const imagePreviews = [
        document.getElementById("imagePreview1"),
        document.getElementById("imagePreview2"),
        document.getElementById("imagePreview3")
      ];
      const capturedImages = [];

      const mycanvas = document.getElementById("mycanvas");
      const video = document.getElementById("video");

      // Load face-api models
      Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        faceapi.nets.faceExpressionNet.loadFromUri('/models')
      ]).then(startVideoStream);

      async function startVideoStream() {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
          video.srcObject = stream;
        } catch (error) {
          console.error("Error accessing the camera:", error);
        }
      }

      function startFaceDetection() {
        const displaySize = { width: video.width, height: video.height };
        const canvas = faceapi.createCanvasFromMedia(video);
        document.body.append(canvas);
        faceapi.matchDimensions(canvas, displaySize);

        setInterval(async () => {
          const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();
          const resizedDetections = faceapi.resizeResults(detections, displaySize);
          canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
          faceapi.draw.drawDetections(canvas, resizedDetections);
          faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

          if (!captured && detections.length > 0) {
            if (detections[0].expressions.happy > 0.90) {
              HappyCntr++;
              if (HappyCntr > 4 && currentImageIndex < 3) {
                captured = true;
                captureImage();
              }
            } else {
              HappyCntr = 0;
            }
          }
        }, 100);
      }

      function captureImage() {
        const context = mycanvas.getContext('2d');
        context.drawImage(video, 0, 0, mycanvas.width, mycanvas.height);
        const imageDataUrl = mycanvas.toDataURL('image/jpeg');
        displayImagePreview(imageDataUrl, currentImageIndex);
        capturedImages.push(imageDataUrl);
        currentImageIndex++;

        // Reset the state for capturing the next image
        if (currentImageIndex < 3) {
          captured = false;
        } else {
          submitImages();
        }
      }

      function displayImagePreview(imageDataURL, index) {
        imagePreviews[index].style.display = "block";
        imagePreviews[index].src = imageDataURL;
      }

      async function submitImages() {
        const formData = new FormData();
        for (let i = 0; i < capturedImages.length; i++) {
          const blob = dataURLToBlob(capturedImages[i]);
          formData.append(`image${i + 1}`, blob, `image${i + 1}.jpeg`);
        }

        try {
          const response = await fetch("/upload-images", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error("Failed to upload images");
          }

          const responseData = await response.json();
          console.log("Images uploaded successfully:", responseData);
          resultImage.src = `${responseData.imageName}`;
          generateQRCode(responseData.imageName);
          loadingElement.style.display = "none";
          finalContainer.style.display = "flex";
        } catch (error) {
          console.error("Error uploading images:", error);
        }
      }

      function dataURLToBlob(dataURL) {
        const parts = dataURL.split(",");
        const byteString = atob(parts[1]);
        const mimeString = parts[0].split(":")[1].split(";")[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], { type: mimeString });
      }

      function generateQRCode(imageUrl) {
        const qrcodeContainer = document.getElementById("qrcode");
        qrcodeContainer.innerHTML = ""; // Clear previous QR code
        new QRCode(qrcodeContainer, imageUrl);
      }
