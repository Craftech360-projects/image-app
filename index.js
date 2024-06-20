const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const app = express();
const port = 3001;

const upload = multer({ dest: 'uploads/' });

// Set EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve the uploads directory statically

// Render the home page using EJS
app.get("/", (req, res) => {
    res.render("home");
});

app.post('/upload', upload.single('image'), async (req, res) => {
    const imagePath = req.file.path;
    const outputFilePath = path.join('uploads', `output_${req.file.filename}.png`);

    try {
        const image = sharp(imagePath);
        const metadata = await image.metadata();

        await image
            .extend({
                left: metadata.width,
                background: { r: 255, g: 255, b: 255, alpha: 1 }
            })
            .toFile(outputFilePath);

        res.json({ imageUrl: `/uploads/output_${req.file.filename}.png` });
    } catch (error) {
        res.status(500).send('Error processing image');
    }
});

app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
});
