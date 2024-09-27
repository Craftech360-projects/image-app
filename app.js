const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { createClient } = require("@supabase/supabase-js");
const axios = require("axios");

const app = express();
const port = 3001;

// Initialize Supabase client
const supabaseUrl = "https://aimistcqlndneimalstl.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzdCIsInJlZiI6ImFpbWlzdGNxbG5kbmVpbWFsc3RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTAyMDA1NjIsImV4cCI6MjAwNTc3NjU2Mn0.qHDDDVAtqG37P0nS9dqzvX6VWSMX00KsV877YXgdf38";
const supabase = createClient(supabaseUrl, supabaseKey);

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Set EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")));

// Folder to watch
const imagesFolder = "C:/dslrBooth/sac/Originals";

// Serve the images statically
app.use('/images', express.static(imagesFolder));

// Render the images page with pagination
app.get('/image-gallery', (req, res) => {
  // Read the image files in the folder
  fs.readdir(imagesFolder, (err, files) => {
    if (err) {
      return res.status(500).send('Unable to scan directory');
    }

    // Filter image files by extension
    const imageFiles = files.filter(file => {
      return ['.jpg', '.jpeg', '.png', '.gif'].includes(path.extname(file).toLowerCase());
    });

    // Pagination logic
    const page = parseInt(req.query.page) || 1; // Current page number
    const limit = 10; // Number of images per page
    const totalImages = imageFiles.length; // Total number of images
    const totalPages = Math.ceil(totalImages / limit); // Total number of pages

    // Ensure page number is within valid range
    if (page > totalPages) {
      return res.redirect(`/image-gallery?page=${totalPages}`);
    } else if (page < 1) {
      return res.redirect('/image-gallery?page=1');
    }

    // Calculate start and end index for pagination
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + limit, totalImages);

    // Slice the images array for the current page
    const paginatedImages = imageFiles.slice(startIndex, endIndex);

    // Render the EJS template and pass the paginated image file names, current page, and total pages
    res.render('index', {
      images: paginatedImages,
      currentPage: page,
      totalPages: totalPages
    });
  });
});

// API call (you can use it when necessary)
async function callApi() {
  const url = "http://localhost:1500/api/start?mode=print&password=1q_15uD-Wjiit4ii";

  try {
    const response = await axios.get(url);
    console.log("API call successful:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error calling the API:", error);
    throw error;
  }
}

// Start the server
app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});
