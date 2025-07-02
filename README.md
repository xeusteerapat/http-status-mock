# HTTP Status Code Mock Server

A simple web server that demonstrates different HTTP status codes. When you visit a URL with a status code (e.g., `/201`), the server will respond with that status code and display a page with relevant information.

## Setup

1. Install dependencies:

    ```bash
    npm install
    ```

1. Start the server:

    ```bash
    npm start
    ```

1. Visit [http://localhost:3001](http://localhost:3001) in your browser

## Usage

- Visit the homepage at [http://localhost:3001](http://localhost:3001) to see a list of common status codes
- To test a specific status code, append it to the URL (e.g., [http://localhost:3001/404](http://localhost:3001/404))
- Supports all status codes from 100-599
