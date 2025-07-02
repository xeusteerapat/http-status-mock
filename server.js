const express = require('express');
const { getReasonPhrase } = require('http-status-codes');
const rateLimit = require('express-rate-limit');
const pino = require('pino');
const pinoHttp = require('pino-http');
const statusDescriptions = require('./status-descriptions');

// Custom error classes
class HttpError extends Error {
	constructor(statusCode, message) {
		super(message);
		this.statusCode = statusCode;
		this.name = 'HttpError';
	}
}

class ValidationError extends HttpError {
	constructor(message) {
		super(400, message);
		this.name = 'ValidationError';
	}
}

// Configure logger based on environment
const logger = pino({
	level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
	...(process.env.NODE_ENV !== 'production' && {
		transport: {
			target: 'pino-pretty',
			options: {
				colorize: true,
				ignoreKeys: ['hostname', 'pid'],
				translateTime: 'SYS:standard',
			},
		},
	}),
});

const app = express();
const port = 3001;

// Add request logging middleware
app.use(
	pinoHttp({
		logger,
		// Customize log serialization
		serializers: {
			req(req) {
				return {
					id: req.id,
					method: req.method,
					url: req.url,
					remoteAddress: req.remoteAddress,
				};
			},
			res(res) {
				return {
					statusCode: res.statusCode,
				};
			},
		},
		customLogLevel: function (res, err) {
			if (res.statusCode >= 400 && res.statusCode < 500) return 'warn';
			if (res.statusCode >= 500 || err) return 'error';
			return 'info';
		},
		customSuccessMessage: function (res) {
			let message = `${res.statusCode}`;
			try {
				if (res.statusCode >= 100 && res.statusCode < 600) {
					message += ` ${getReasonPhrase(res.statusCode)}`;
				}
			} catch (err) {}
			return message;
		},
		customErrorMessage: function (error, res) {
			let message = `Error: ${res.statusCode}`;
			try {
				if (res.statusCode >= 100 && res.statusCode < 600) {
					message += ` ${getReasonPhrase(res.statusCode)}`;
				}
			} catch (err) {}
			return message;
		},
	})
);

// Max 100 requests per minute per IP
const limiter = rateLimit({
	windowMs: 1 * 60 * 1000, // 1 minute
	max: 100, // limit each IP to 100 requests per windowMs
	message: {
		status: 429,
		message: 'Too many requests from this IP, please try again after a minute',
	},
});

app.use(limiter);

app.use(express.static('public'));

app.get('/:statusCode', (req, res, next) => {
	const statusCode = parseInt(req.params.statusCode);

	if (isNaN(statusCode) || statusCode < 100 || statusCode > 599) {
		return next(new ValidationError('Invalid status code'));
	}

	const reasonPhrase = getReasonPhrase(statusCode);

	res.status(statusCode).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>HTTP ${statusCode}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    background-color: #f5f5f5;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 2rem;
                }
                .status-container {
                    text-align: center;
                    padding: 2rem;
                    background-color: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    max-width: 800px;
                    width: 100%;
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
                .status-description {
                    margin-top: 2rem;
                    color: #444;
                    line-height: 1.6;
                    text-align: left;
                    padding: 1rem;
                    background-color: #f8f9fa;
                    border-radius: 4px;
                }
                .home-link {
                    display: inline-block;
                    margin-top: 1.5rem;
                    color: #0066cc;
                    text-decoration: none;
                }
                .home-link:hover {
                    text-decoration: underline;
                }
            </style>
        </head>
        <body>
            <div class="status-container">
                <h1 class="status-code">${statusCode}</h1>
                <p class="status-text">${reasonPhrase}</p>
                <div class="status-description">
                    <p>${statusDescriptions[statusCode] || 'No additional description available.'}</p>
                </div>
                <a href="/" class="home-link">Back to Home</a>
            </div>
        </body>
        </html>
    `);
});

app.get('/', (req, res) => {
	// Group status codes by their classes
	const statusGroups = {
		'1xx Informational': Object.keys(statusDescriptions).filter(code => code >= 100 && code < 200),
		'2xx Success': Object.keys(statusDescriptions).filter(code => code >= 200 && code < 300),
		'3xx Redirection': Object.keys(statusDescriptions).filter(code => code >= 300 && code < 400),
		'4xx Client Error': Object.keys(statusDescriptions).filter(code => code >= 400 && code < 500),
		'5xx Server Error': Object.keys(statusDescriptions).filter(code => code >= 500 && code < 600)
	};

	res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>HTTP Status Code Tester</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 1200px;
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
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 1.5rem;
                }
                .status-group {
                    background-color: white;
                    padding: 1.5rem;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .status-group h2 {
                    margin-top: 0;
                    color: #333;
                    border-bottom: 2px solid #eee;
                    padding-bottom: 0.5rem;
                }
                .status-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                .status-list li {
                    margin: 0.5rem 0;
                    padding: 0.5rem;
                    border-radius: 4px;
                    transition: background-color 0.2s;
                }
                .status-list li:hover {
                    background-color: #f5f5f5;
                }
                a {
                    color: #0066cc;
                    text-decoration: none;
                    display: block;
                }
                a:hover {
                    text-decoration: underline;
                }

            </style>
        </head>
        <body>
            <h1>HTTP Status Code Tester</h1>
            <div class="instructions">
                <p>Click on any status code below to see its details, or enter a status code (100-599) in the URL path (e.g., /404).</p>
            </div>
            <div class="status-groups">
                ${Object.entries(statusGroups).map(([groupName, codes]) => `
                    <div class="status-group">
                        <h2>${groupName}</h2>
                        <ul class="status-list">
                            ${codes.map(code => {
                                let reasonPhrase = '';
                                try {
                                    reasonPhrase = getReasonPhrase(parseInt(code));
                                } catch (err) {}
                                return `
                                <li>
                                    <a href="/${code}">${code} ${reasonPhrase}</a>
                                </li>
                            `}).join('')}
                        </ul>
                    </div>
                `).join('')}
            </div>
        </body>
        </html>
    `);
});

app.use((req, res, next) => {
	next(new HttpError(404, 'Resource not found'));
});

app.use((err, req, res, next) => {
	const statusCode = err.statusCode || 500;
	const errorMessage = err.message || 'Internal Server Error';

	// Create a minimal log object with essential information
	const logInfo = {
		statusCode,
		path: req.path,
		error: {
			name: err.name,
			message: err.message,
			...(err.stack && { stack: err.stack }),
		},
	};

	if (statusCode >= 500) {
		logger.error(logInfo, `Server Error: ${errorMessage}`);
	} else {
		logger.warn(logInfo, `Client Error: ${errorMessage}`);
	}

	res.status(statusCode).send(`
		<!DOCTYPE html>
		<html>
		<head>
			<title>Error ${statusCode}</title>
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
				.error-container {
					text-align: center;
					padding: 2rem;
					background-color: white;
					border-radius: 8px;
					box-shadow: 0 2px 4px rgba(0,0,0,0.1);
				}
				.error-code {
					font-size: 4rem;
					margin: 0;
					color: #dc3545;
				}
				.error-message {
					font-size: 1.5rem;
					color: #666;
					margin-top: 1rem;
				}
				.home-link {
					display: inline-block;
					margin-top: 1.5rem;
					color: #0066cc;
					text-decoration: none;
				}
				.home-link:hover {
					text-decoration: underline;
				}
			</style>
		</head>
		<body>
			<div class="error-container">
				<h1 class="error-code">${statusCode}</h1>
				<p class="error-message">${errorMessage}</p>
				<a href="/" class="home-link">Back to Home</a>
			</div>
		</body>
		</html>
	`);
});

app.listen(port, () => {
	logger.info(`Server running at http://localhost:${port}`);
});
