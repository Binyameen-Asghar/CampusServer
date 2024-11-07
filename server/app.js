require('dotenv').config();
const express = require('express');
const cors = require('cors'); // Import CORS
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for frontend
app.use(cors({
    origin: 'http://localhost:5173', // Replace with your frontend's origin
    methods: ['GET', 'POST'],
    credentials: true
}));

// Custom delay function
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function autoLoginAfterCaptcha() {
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled'
        ]
    });

    const page = await browser.newPage();
    await page.goto('https://slate.uol.edu.pk');

    const password = process.env.PASSWORD;
    const email = process.env.EMAIL;

    try {
        console.log('Please complete the CAPTCHA manually.');
        await delay(10000);

        await page.waitForSelector('img[width="24"]', { visible: true });
        await page.click('img[width="24"]');
        
        await page.waitForSelector('[type="email"]', { visible: true });
        await page.type('[type="email"]', email);
        
        await page.click('#identifierNext');
        await page.waitForSelector('[type="password"]', { visible: true });
        
        await page.type('[type="password"]', password);
        await page.click('#passwordNext');
        
        await page.waitForNavigation();
        console.log('Logged in successfully');
    } catch (error) {
        console.error('Error during login:', error);
    } finally {
        await browser.close();
    }
}

app.get('/login', async (req, res) => {
    try {
        await autoLoginAfterCaptcha();
        res.send('Login script completed');
    } catch (error) {
        console.error('Error in /login route:', error);
        res.status(500).send('Error occurred while logging in');
    }
});

process.on('SIGINT', () => {
    console.log('Shutting down gracefully...');
    process.exit();
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
