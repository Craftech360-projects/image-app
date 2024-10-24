const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const port = 3001;

// Initialize Supabase client
const supabaseUrl = "https://aimistcqlndneimalstl.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpbWlzdGNxbG5kbmVpbWFsc3RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTAyMDA1NjIsImV4cCI6MjAwNTc3NjU2Mn0.qHDDDVAtqG37P0nS9dqzvX6VWSMX00KsV877YXgdf38";
const supabase = createClient(supabaseUrl, supabaseKey);

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Set EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")));

// Render the home page using EJS
app.get("/", (req, res) => {
  res.render("home");
});

app.get("/capture", (req, res) => {
  res.render("capture");
});

app.get("/show", (req, res) => {
  res.render("show");
});
app.get("/mergeimages", (req, res) => {
  res.render("mergeimages");
});
// app.post(
//   "/upload-images",
//   upload.fields([{ name: "image1" }, { name: "image2" }, { name: "image3" }]),
//   async (req, res) => {
//     const { files } = req;
//     if (!files || !files.image1 || !files.image2 || !files.image3) {
//       return res.status(400).send("All three images are required");
//     }

//     const templatePath = "./wix.jpeg";
//     const folderPath = path.join(__dirname, "public/uploads");

//     // Create the folder
//     fs.mkdirSync(folderPath, { recursive: true });
//     const imageName = `${uuidv4()}.jpg`;
//     const outputPath = path.join(folderPath, imageName);

//     try {
//       // Load the images
//       const template = await sharp(templatePath).toBuffer();
//       const image1 = await sharp(files.image1[0].buffer)
//         .resize(400, 400)
//         .toBuffer();
//       const image2 = await sharp(files.image2[0].buffer)
//         .resize(400, 400)
//         .toBuffer();
//       const image3 = await sharp(files.image3[0].buffer)
//         .resize(400, 400)
//         .toBuffer();

//       // Get the template metadata
//       const { width, height } = await sharp(template).metadata();

//       // Create a new image with the same size as the template
//       await sharp({
//         create: {
//           width: width,
//           height: height,
//           channels: 4,
//           background: { r: 0, g: 0, b: 0, alpha: 0 },
//         },
//       })
//         .composite([
//           { input: template },
//           { input: image1, top: 118, left: 101 }, // Position the first image
//           { input: image2, top: 622, left: 101 }, // Position the second image
//           { input: image3, top: 1126, left: 101 }, // Position the third image
//         ])
//         .toFile(outputPath);

//       const imagePath = path.join('public/uploads', imageName);
//       const outputFilePath = path.join('public/outputs/', `output_${imageName}`);

//       try {
//           const image = sharp(imagePath);
//           const metadata = await image.metadata();

//           await image
//               .extend({
//                   left: metadata.width,
//                   background: { r: 255, g: 255, b: 255, alpha: 1 }
//               })
//               .toFile(outputFilePath);

//           // res.json({ imageName:imageName });
//       } catch (error) {
//           console.error('Error processing image:', error);
//           res.status(500).send('Error processing image');
//       }
//       await uploadImageToSupabase(imageName, outputPath, res);
//     } catch (err) {
//       console.error("Error processing images:", err);
//       res.status(500).send("Error processing images");
//     }
//   }
// );

const axios = require('axios');

// const interval = 30 * 1000; // 30 seconds

// // Function to call the API
// const callUploadImagesAPI = async () => {
//   try {
//     const response = await axios.post('http://localhost:3001/upload-images');
//     console.log('API response:', response.data);
//   } catch (error) {
//     console.error('Error calling API:', error);
//   }
// };

// // Set the interval to call the API every 30 seconds
// setInterval(callUploadImagesAPI, interval);

app.get("/merge-images", async (req, res) => {
  console.log('hitting dslr API');
  
  const url =
    "http://localhost:1500/api/start?mode=print&password=1q_15uD-Wjiit4ii";

  try {
    const response = await axios.get(url);
    setTimeout(async () => {
      const imageUrl = await mergeProcess(res); // Pass res to mergeProcess
      res.json({ imageUrl }); // Send back the image URL in the response
    }, 25000);
    console.log("API call successful:", response.data);
  } catch (error) {
    console.error("Error calling the API:", error);
    res.status(500).send("Error processing images");
  }
});

const imagesFolder = "C:/dslrBooth/sac/Originals";

async function mergeProcess(res) { // Accept res as a parameter
  const templatePath = "./wix.jpeg";
  const folderPath = path.join(__dirname, "public/uploads");

  // Create the folder if it doesn't exist
  fs.mkdirSync(folderPath, { recursive: true });

  try {
    // Read the three most recent images from the folder
    const files = fs
      .readdirSync(imagesFolder)
      .filter((file) => /\.(jpg|jpeg|png)$/i.test(file)) // Filter for image files
      .map((file) => ({
        name: file,
        time: fs.statSync(path.join(imagesFolder, file)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time) // Sort by modification time (descending)
      .slice(0, 3); // Get the three most recent images

    if (files.length < 3) {
      return console.log("Not enough images found");
    }

    const imagePaths = files.map((file) => path.join(imagesFolder, file.name));
    const imageName = `${uuidv4()}.jpg`;
    const outputPath = path.join(folderPath, imageName);

    // Load the images and the template
    const template = await sharp(templatePath).toBuffer();
    const image1 = await sharp(imagePaths[0]).resize(400, 400).toBuffer();
    const image2 = await sharp(imagePaths[1]).resize(400, 400).toBuffer();
    const image3 = await sharp(imagePaths[2]).resize(400, 400).toBuffer();

    // Get the template metadata
    const { width, height } = await sharp(template).metadata();

    // Create a new image with the same size as the template and composite the images
    await sharp({
      create: {
        width: width,
        height: height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([
        { input: template },
        { input: image1, top: 118, left: 101 },
        { input: image2, top: 622, left: 101 },
        { input: image3, top: 1126, left: 101 },
      ])
      .toFile(outputPath);

    // Extend the final image if needed
    const outputFilePath = path.join("public/outputs/", `output_${imageName}`);
    try {
      const image = sharp(outputPath);
      const metadata = await image.metadata();

      await image
        .extend({
          left: metadata.width,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        })
        .toFile(outputFilePath);
    } catch (error) {
      console.error("Error extending image:", error);
      res.status(500).send("Error processing image");
      return;
    }

    // Upload the final image to Supabase
    return await uploadImageToSupabase(imageName, outputPath, res); // Ensure to return the image URL
  } catch (err) {
    console.error("Error processing images:", err);
  }
}

async function uploadImageToSupabase(imageName, outputPath, res) {
  try {
    const fileBuffer = fs.readFileSync(outputPath);
    const { data, error } = await supabase.storage
      .from("test-bucket") // Replace with your actual bucket name
      .upload(`public/${imageName}`, fileBuffer, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw error;
    }
    const imageUrl = `https://aimistcqlndneimalstl.supabase.co/storage/v1/object/public/test-bucket/${data.path}`;
    console.log(imageUrl);
    return imageUrl; // Return the image URL
  } catch (error) {
    console.error("Error uploading image to Supabase:", error);
    res.status(500).send("Error uploading image to Supabase");
  }
}


// Endpoint to fetch images
app.get("/fetch-images", (req, res) => {
  const folderPath = path.join(__dirname, "public/outputs/");

  // Read directory and get file stats
  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error("Error reading directory:", err);
      res.status(500).json({ error: "Failed to fetch images" });
      return;
    }

    // Filter only files with image extensions (adjust as per your file types)
    const imageFiles = files.filter((file) =>
      /\.(jpg|jpeg|png|gif)$/i.test(file)
    );

    // Get file stats and prepare response
    const images = imageFiles.map((file) => {
      const filePath = path.join(folderPath, file);
      const stats = fs.statSync(filePath);
      return {
        filename: file,
        path: `/outputs/${file}`, // Assuming the 'outputs' folder is served statically
        date: stats.mtime, // Use file modification time for sorting
      };
    });

    res.json(images);
  });
});

app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});
