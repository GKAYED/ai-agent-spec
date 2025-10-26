const server = require('./server');
const config = require('./config');
const organizer = require('./organizer');

async function main() {
    console.log('Starting AI Agent...');
    await organizer.run();
    server.listen(config.port, () => {
        console.log(`AI Agent server listening on port ${config.port}`);
    });

    // Periodically run the organizer
    setInterval(async () => {
        console.log('Running periodic data organization...');
        await organizer.run();
    }, 3600000); // Run every hour
}

main();
