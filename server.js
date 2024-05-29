 require('dotenv').config();
const http = require('http');
const app = require('./index');

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Add error handling
server.on('error', (error) => {
    console.log(error);
    if (error.syscall !== 'listen') {
        throw error;
    }

    const bind = typeof PORT === 'string'
        ? 'Pipe ' + PORT
        : 'Port ' + PORT;

    // Handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(`${bind} requires elevated privileges`);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(`${bind} is already in use`);
            process.exit(1);
            break;
        default:
            throw error;
    }
});
