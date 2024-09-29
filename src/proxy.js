"use strict";
import axios from 'axios';
import lodash from 'lodash';
import http2 from 'http2-wrapper';
import { generateRandomIP, randomUserAgent } from './utils.js';
import { copyHeaders as copyHdrs } from './copyHeaders.js';
import { compressImg as applyCompression } from './compress.js';
import { bypass as performBypass } from './bypass.js';
import { redirect as handleRedirect } from './redirect.js';
import { shouldCompress as checkCompression } from './shouldCompress.js';

const viaHeaders = [
    '2.0 example-proxy-service.com (ExampleProxy/1.0)',
    '2.0 another-proxy.net (Proxy/2.0)',
    '2.0 different-proxy-system.org (DifferentProxy/3.1)',
    '2.0 some-proxy.com (GenericProxy/4.0)',
];

function randomVia() {
    const index = Math.floor(Math.random() * viaHeaders.length);
    return viaHeaders[index];
}

export async function processRequest(request, reply) {
    let url = request.query.url;

    if (!url) {
        
        return reply.send(`bandwidth-hero-proxy`);
    }

    request.params.url = decodeURIComponent(url);
    request.params.webp = !request.query.jpeg;
    request.params.grayscale = request.query.bw != '0';
    request.params.quality = parseInt(request.query.l, 10) || 40;

    const randomIP = generateRandomIP();
    const userAgent = randomUserAgent();

    try {
        const response = await axios.get(request.params.url, {
            headers: {
                ...lodash.pick(request.headers, ['cookie', 'dnt', 'referer']),
                'user-agent': userAgent,
                'x-forwarded-for': randomIP,
                'via': randomVia(),
            },
            responseType: 'stream', // We need to handle the response as a stream
            timeout: 10000,
            maxRedirects: 5,// max redirects
            decompress: false,
            validateStatus: function (status) {
                return status === 200; // Only accept status 200 as valid
            },
            httpAgent: new http2.Http2Agent(),

            proxy: {
    protocol: 'https',
    host: '192.168.1.100', // Replace with your proxy server IP
    port: 9000,
    // Optional: If your proxy requires authentication
    // auth: {
    //     username: 'yourUsername',
    //     password: 'yourPassword'
    // }
}

        });

        // We only reach here if the status code is exactly 200
        copyHdrs(response, reply);  // Copy headers from response to reply
        reply.header('content-encoding', 'identity');
        request.params.originType = response.headers['content-type'] || '';
        request.params.originSize = parseInt(response.headers['content-length'], 10) || 0;

        const input = { body: response.data }; // Pass the stream

        if (checkCompression(request)) {
            return applyCompression(request, reply, input);
        } else {
            return performBypass(request, reply, response.data);
        }
    } catch (err) {
        // Handle non-200 responses or other errors
        return handleRedirect(request, reply);
    }
}
