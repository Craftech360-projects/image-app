const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Load the template09
const templatePath = './main.jpeg';
const image1Path = './a.jpg';
const image2Path = './b.jpg';
const image3Path = './c.jpg';

// Generate a random folder name
const folderName = uuidv4();
const folderPath = path.join(__dirname, 'uploads');

// Create the folder
fs.mkdirSync(folderPath, { recursive: true });

const outputPath = path.join(folderPath, 'final_image.jpg');

async function mergeImages() {
    try {
        // Load the images
        const template = await sharp(templatePath).toBuffer();
        const image1 = await sharp(image1Path).resize(300, 300).toBuffer(); // Resize as necessary
        const image2 = await sharp(image2Path).resize(300, 300).toBuffer();
        const image3 = await sharp(image3Path).resize(300, 300).toBuffer();

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

        console.log('Image processing complete! Image saved at:', outputPath);
    } catch (err) {
        console.error('Error processing images:', err);
    }
}

mergeImages();
