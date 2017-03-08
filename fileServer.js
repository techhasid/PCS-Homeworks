'use strict';

const http = require('http'),
    fs = require('fs'),
    path = require('path'),
    contentType = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript'
    },
    util = require('util');

let cache = {};

var server = http.createServer((request, response) => {

    console.log('serving', request.url);

    const ext = path.extname(request.url);

    if (ext && contentType[ext]) {
        response.setHeader('Content-type', contentType[ext]);
    }

    response.setHeader('X-Powered-By', 'PCS');

    if (cache[request.url]) {
        console.log('Serving from cache');
        cache[request.url].accessed = new Date();
        response.end(cache[request.url].data);
    } 
    
    else {
        console.log('Serving from disk');
        fs.readFile('content/' + request.url, 'utf-8', (err, data) => {

            if (err) {

                response.setHeader('Content-type', contentType['.html']);

                if (err.code === 'ENOENT') {
                    response.statusCode = 404;
                    response.write('No such page. Sorry.<br><h1>404</h1>');
                } 
                
                else {
                    response.statusCode = 500;
                }

                response.end(err.message);
                return;
            }

            cache[request.url] = {
                accessed: new Date(),
                data: data,
                loaded: new Date()
            };

            response.end(data);
        });
    }

}).listen(80);

const intervalTime = 5000;

setInterval(() => {

    console.log('Cleaning cache');

    const cutOff = new Date() - intervalTime;

    Object.keys(cache).forEach(key => {
        
        if (cache[key].accessed < cutOff) {
            console.log('Removing stale ', key, ' from cache');
            delete cache[key];
            return;
        } 

        fs.stat('content/' + key, (err, stats) => {
            //console.log('stats', stats,'\n\n');
            //console.log('util.inspect', util.inspect(stats));
            if(stats && stats.mtime > cache[key].loaded) {
                console.log('Removing modified ', key, ' from cache');
                delete cache[key];
            }
        });
    });

}, intervalTime);

/*
var foo = {
    foo: 25
};

var bar = Object.create(foo);
bar.bar = 50;

for (var key in bar) {
    if (bar.hasOwnProperty(key)) {
        console.log(key, bar[key]);
    }
}
*/

