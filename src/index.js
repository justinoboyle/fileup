/**
 * So uh.
 * This code is pretty bad. I take that back. Really bad.
 * I wouldn't really try to fix anything or whatever.
 * Email me or open an issue if it doesn't work. justin@justinoboyle.com
 */

import express from 'express';
import fileUpload from 'express-fileupload';
import fs from 'fs';
import userconfig from './userconfig';
import path from 'path';
import crypto from 'crypto';
import bodyParser from 'body-parser';

userconfig.initSync();

const app = express();
app.use(fileUpload());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
const getExtension = (filename) => filename.split('.').pop();

app.get('/', (req, res) => userconfig.getUserNameByHostName(req.headers.host || ':', (err, usrn) => {
    if (err)
        return res.status(404).send("Error :(") && console.log(err);
    if (!usrn)
        usrn = "_FILEUP";
    userconfig.getUserDataByName(usrn, (err, user) => {
        if (err)
            return res.status(404).send("Error :(");
        try {
            getFilePath(usrn, user, 'index.html', (_path, success, p) => {
                res.status(success ? 200 : 404);
                if (p)
                    return res.send(p);
                else
                    res.sendFile(_path);
            });
        } catch (e) { }
    })
}));

app.post('/', (req, res) => userconfig.getUserNameByHostName(req.headers.host || ':', (err, hostOwner) => {
    if (err)
        return res.status(404).send("Error :(");
    if (!hostOwner)
        hostOwner = "_FILEUP";
    //
    if (!req.files)
        return res.status(404).send("No files.");

    if (!req.body.username || !req.body.token)
        return res.status(404).send("No auth");

    let proto = 'http:';

    if(req.connection.encrypted)
        proto = 'https:';

    let file = req.files.file;

    let fileName = randomValueHex(16) + '.' + getExtension(file.name);
    if (file.name == "index.html" || file.name == "style.css" || file.name == "script.js")
        fileName = file.name;
    let usrn = req.body.username;
    userconfig.getUserDataByName(usrn, (err, user) => {
        if (err)
            return res.status(404).send("Error :(");
        if (!user.token)
            return res.status(404).send("No auth");
        if (user.token !== req.body.token)
            return res.status(404).send("No auth");
        try {
            //console.log(usrn, user, fileName);
            getRawFilePath(usrn, fileName, (_path) => {
                file.mv(_path, function (err) {
                    if (err) return res.status(404).send("something went wrong");
                    let path = req.headers.host + '/' + usrn + '/' + fileName;
                    if (usrn == hostOwner)
                        path = req.headers.host + '/' + fileName
                    res.send(proto + '//' + path);
                });
            });
        } catch (e) { console.log(e) }
    })
    //

}));


app.get('/:username/:filename', (req, res) => userconfig.getUserDataByName(req.params.username || '_FILEUP', (err, usr) => {
    if (!usr)
        return res.status(404).send("Error :(");
    let page = req.params.filename;
    if (!usr) {
        usrn = "_FILEUP";
        page = "_404.html";
    }
    let usrn = req.params.username;
        try {
            getFilePath(usrn, usr, page, (_path, success, p) => {
                res.status(success ? 200 : 404);
                if (p)
                    return res.send(p);
                else
                    res.sendFile(_path);
            });
        } catch (e) { }
}));

app.get('/:filename', (req, res) => userconfig.getUserNameByHostName(req.headers.host || ':', (err, usrn) => {
    if (err)
        return res.status(404).send("Error :(");
    let page = req.params.filename;
    if (!usrn) {
        usrn = "_FILEUP";
        page = "_404.html";
    }
    userconfig.getUserDataByName(usrn, (err, user) => {
        if (err)
            return res.status(404).send("Error :(");
        try {
            getFilePath(usrn, user, page, (_path, success, p) => {
                res.status(success ? 200 : 404);
                if (p)
                    return res.send(p);
                else
                    res.sendFile(_path);
            });
        } catch (e) {

        }
    })
}));

app.get('*', (req, res) => userconfig.getUserNameByHostName(req.headers.host || ':', (err, usrn) => {
    if (err)
        return res.status(404).send("Error :(") && console.log(err);
    if (!usrn)
        usrn = "_FILEUP";
    userconfig.getUserDataByName(usrn, (err, user) => {
        if (err)
            return res.status(404).send("Error :(");
        try {
            getFilePath(usrn, user, '_404.html', (_path, success, p) => {
                res.status(success ? 200 : 404);
                if (p)
                    return res.send(p);
                else
                    res.sendFile(_path);
            });
        } catch (e) {

        }
    })
}));

function getFilePath(usrn, user, file, then) {
    let _path = path.join(__dirname, '../usr/data/', usrn + '/', file);
    fs.mkdir(path.join(__dirname, '../usr/data/'), () => {
        fs.access(_path, fs.constants.R_OK | fs.constants.W_OK, err => {
            if (err)
                return then('/dev/null', false, '<code>404 not found.</code>');
            return then(_path, true);
        });
    })

}

function getRawFilePath(usrn, file, then) {
    fs.mkdir(path.join(__dirname, '../usr/data/', usrn + '/'), () => {
        then(path.join(__dirname, '../usr/data/', usrn + '/', file));
    });
}

app.listen(global.config.port || 3000, () => console.log("Listening on " + (global.config.port || 3000)))

function randomValueHex(len) {
    return crypto.randomBytes(Math.ceil(len / 2))
        .toString('hex') // convert to hexadecimal format
        .slice(0, len);   // return required number of characters
}