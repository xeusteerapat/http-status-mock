const express = require('express');
const { StatusCodes, getReasonPhrase } = require('http-status-codes');

const app = express();
const port = 3001;

// Serve static files
app.use(express.static('public'));

// Handle status code requests
app.get('/:statusCode', (req, res) => {
    const statusCode = parseInt(req.params.statusCode);
    
    // Check if status code is valid
    if (isNaN(statusCode) || statusCode < 100 || statusCode > 599) {
        return res.status(400).send('Invalid status code');
    }

    const reasonPhrase = getReasonPhrase(statusCode);
    
    // Send response with requested status code
    res.status(statusCode).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>HTTP ${statusCode}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    background-color: #f5f5f5;
                }
                .status-container {
                    text-align: center;
                    padding: 2rem;
                    background-color: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .status-code {
                    font-size: 4rem;
                    margin: 0;
                    color: #333;
                }
                .status-text {
                    font-size: 1.5rem;
                    color: #666;
                    margin-top: 1rem;
                }
            </style>
        </head>
        <body>
            <div class="status-container">
                <h1 class="status-code">${statusCode}</h1>
                <p class="status-text">${reasonPhrase}</p>
            </div>
        </body>
        </html>
    `);
});

// Default route
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>HTTP Status Code Tester</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 800px;
                    margin: 2rem auto;
                    padding: 0 1rem;
                }
                h1 {
                    text-align: center;
                }
                .instructions {
                    background-color: #f5f5f5;
                    padding: 1rem;
                    border-radius: 4px;
                    margin-bottom: 2rem;
                }
                .status-groups {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1rem;
                }
                .status-group {
                    background-color: white;
                    padding: 1rem;
                    border-radius: 4px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .status-group h2 {
                    margin-top: 0;
                }
                .status-list {
                    list-style: none;
                    padding: 0;
                }
                .status-list li {
                    margin-bottom: 0.5rem;
                }
                a {
                    color: #0066cc;
                    text-decoration: none;
                }
                a:hover {
                    text-decoration: underline;
                }
            </style>
        </head>
        <body>
            <h1>HTTP Status Code Tester</h1>
            <div class="instructions">
                <p>Enter any status code from 100-599 in the URL path (e.g., /404) to see the corresponding status page.</p>
            </div>
            <div class="status-groups">
                <div class="status-group">
                    <h2>1xx Informational</h2>
                    <ul class="status-list">
                        <li><a href="/100">100 Continue</a></li>
                        <li><a href="/101">101 Switching Protocols</a></li>
                    </ul>
                </div>
                <div class="status-group">
                    <h2>2xx Success</h2>
                    <ul class="status-list">
                        <li><a href="/200">200 OK</a></li>
                        <li><a href="/201">201 Created</a></li>
                        <li><a href="/204">204 No Content</a></li>
                    </ul>
                </div>
                <div class="status-group">
                    <h2>3xx Redirection</h2>
                    <ul class="status-list">
                        <li><a href="/301">301 Moved Permanently</a></li>
                        <li><a href="/302">302 Found</a></li>
                        <li><a href="/304">304 Not Modified</a></li>
                    </ul>
                </div>
                <div class="status-group">
                    <h2>4xx Client Error</h2>
                    <ul class="status-list">
                        <li><a href="/400">400 Bad Request</a></li>
                        <li><a href="/401">401 Unauthorized</a></li>
                        <li><a href="/403">403 Forbidden</a></li>
                        <li><a href="/404">404 Not Found</a></li>
                    </ul>
                </div>
                <div class="status-group">
                    <h2>5xx Server Error</h2>
                    <ul class="status-list">
                        <li><a href="/500">500 Internal Server Error</a></li>
                        <li><a href="/502">502 Bad Gateway</a></li>
                        <li><a href="/503">503 Service Unavailable</a></li>
                    </ul>
                </div>
            </div>
        </body>
        </html>
    `);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
