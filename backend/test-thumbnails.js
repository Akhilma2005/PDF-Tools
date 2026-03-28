const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

async function testThumbnails() {
    const filePath = path.join(__dirname, 'test.pdf');
    // Create a dummy PDF if it doesn't exist
    if (!fs.existsSync(filePath)) {
        console.log("No test.pdf found in backend folder. Skipping.");
        return;
    }

    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));

    try {
        console.log("Requesting thumbnails...");
        const res = await axios.post('http://localhost:5000/api/get-thumbnails', form, {
            headers: form.getHeaders()
        });
        console.log("Response:", JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error("Error:", err.response ? err.response.data : err.message);
    }
}

testThumbnails();
