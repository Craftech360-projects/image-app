const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require('uuid');
const app = express();
const port = 3001;

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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

app.get("/capture", (req, res) => {
    res.render("capture");
});

app.post('/upload-images', upload.fields([{ name: 'image1' }, { name: 'image2' }, { name: 'image3' }]), async (req, res) => {
    const { files } = req;
    console.log("here in api");
    if (!files || !files.image1 || !files.image2 || !files.image3) {
        return res.status(400).send('All three images are required');
    }

    const templatePath = './main.jpeg';
    const folderName = uuidv4();
    const folderPath = path.join(__dirname, 'uploads');

    // Create the folder
    fs.mkdirSync(folderPath, { recursive: true });
    const imageName = `${uuidv4()}.jpg`
    const outputPath = path.join(folderPath, imageName);

    try {
        // Load the images
        const template = await sharp(templatePath).toBuffer();
        const image1 = await sharp(files.image1[0].buffer).resize(300, 300).toBuffer();
        const image2 = await sharp(files.image2[0].buffer).resize(300, 300).toBuffer();
        const image3 = await sharp(files.image3[0].buffer).resize(300, 300).toBuffer();

        // Get the template metadata
        const { width, height } = await sharp(template).metadata();

        // Create a new image with the same size as the template
        await sharp({
            create: {
                width: width,
                height: height,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            }
        })
            .composite([
                { input: template },
                { input: image1, top: 130, left: 70 },   // Position the first image
                { input: image2, top: 495, left: 70 },  // Position the second image
                { input: image3, top: 850, left: 70 }   // Position the third image
            ])
            .toFile(outputPath);

        console.log('Image processing complete! Image saved at:', imageName);
        res.status(200).send({ message: 'Images processed successfully', imageName });
    } catch (err) {
        console.error('Error processing images:', err);
        res.status(500).send('Error processing images');
    }
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
