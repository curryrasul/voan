const nearAPI = require('near-api-js');
const http = require('node:http');
const qs = require('querystring');


const serverConfig = {
    hostname: '127.0.0.1',
    port: 3000
};


const config = {
    contrantId: process.argv[2], // second commad line argument is contractId
};


async function createAccount() {
}

const requestListener = function (req, res) {
    if (req.method == 'POST') {
        var body = '';

        req.on('data', function (data) {
            body += data;
            
            console.log(body)

            // Too much POST data, kill the connection!
            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
            if (body.length > 1e6)
                req.connection.destroy();
        });

        req.on('end', function () {
            var post = qs.parse(body);
            // use post['blah'], etc.
        });
    }
};


const main = async () => {
    const server = http.createServer(requestListener);
    server.listen(serverConfig.port, serverConfig.hostname, () => {
        console.log(`Relayer is running on http://${serverConfig.hostname}:${serverConfig.port}`);
    });
}   

main()

