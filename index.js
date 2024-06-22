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

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Set EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Serve the uploads directory statically

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

app.post(
  "/upload-images",
  upload.fields([{ name: "image1" }, { name: "image2" }, { name: "image3" }]),
  async (req, res) => {
    const { files } = req;
    console.log("here in api");
    if (!files || !files.image1 || !files.image2 || !files.image3) {
      return res.status(400).send("All three images are required");
    }

    const templatePath = "./main.jpeg";
    const folderPath = path.join(__dirname, "uploads");

    // Create the folder
    fs.mkdirSync(folderPath, { recursive: true });
    const imageName = `${uuidv4()}.jpg`;
    const outputPath = path.join(folderPath, imageName);

    try {
      // Load the images
      const template = await sharp(templatePath).toBuffer();
      const image1 = await sharp(files.image1[0].buffer)
        .resize(300, 300)
        .toBuffer();
      const image2 = await sharp(files.image2[0].buffer)
        .resize(300, 300)
        .toBuffer();
      const image3 = await sharp(files.image3[0].buffer)
        .resize(300, 300)
        .toBuffer();

      // Get the template metadata
      const { width, height } = await sharp(template).metadata();

      // Create a new image with the same size as the template
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
          { input: image1, top: 130, left: 70 }, // Position the first image
          { input: image2, top: 495, left: 70 }, // Position the second image
          { input: image3, top: 850, left: 70 }, // Position the third image
        ])
        .toFile(outputPath);

      console.log("Image processing complete! Image saved at:", imageName);
      const imagePath = path.join('uploads', imageName);
      const outputFilePath = path.join('uploads/outputs/', `output_${imageName}.png`);
    
      try {
          const image = sharp(imagePath);
          const metadata = await image.metadata();
    
          await image
              .extend({
                  left: metadata.width,
                  background: { r: 255, g: 255, b: 255, alpha: 1 }
              })
              .toFile(outputFilePath);
    
          // res.json({ imageName:imageName });
      } catch (error) {
          console.error('Error processing image:', error);
          res.status(500).send('Error processing image');
      }
      await uploadImageToSupabase(imageName, outputPath, res);
    } catch (err) {
      console.error("Error processing images:", err);
      res.status(500).send("Error processing images");
    }
  }
);

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
    res.json({ imageName: imageUrl });
  } catch (error) {
    console.error("Error uploading image to Supabase:", error);
    res.status(500).send("Error uploading image to Supabase");
  }
}

async function mergeImages(imageName, res) {
  const imagePath = path.join('uploads', imageName);
  const outputFilePath = path.join('uploads/outputs/', `output_${imageName}.png`);

  try {
      const image = sharp(imagePath);
      const metadata = await image.metadata();

      await image
          .extend({
              left: metadata.width,
              background: { r: 255, g: 255, b: 255, alpha: 1 }
          })
          .toFile(outputFilePath);

      // res.json({ imageName:imageName });
  } catch (error) {
      console.error('Error processing image:', error);
      res.status(500).send('Error processing image');
  }
}

// Endpoint to fetch images
app.get("/fetch-images", (req, res) => {
  const folderPath = path.join(__dirname, "uploads/outputs/");

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
        path: `uploads/outputs/${file}`, // Assuming the 'outputs' folder is served statically
        date: stats.mtime, // Use file modification time for sorting
      };
    });

    res.json(images);
  });
});

app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});
