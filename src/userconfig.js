/**
 * So uh.
 * This code is pretty bad. I take that back. Really bad.
 * I wouldn't really try to fix anything or whatever.
 * Email me or open an issue if it doesn't work. justin@justinoboyle.com
 */


import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';

const __approot = path.join(__dirname, "../"),
    __templateUsr = path.join(__approot, './template/usr_template/'),
    __usr = path.join(__approot, './usr/');

let x = {
    initSync: () => {
        if (!fs.existsSync(__usr)) {
            fs.copySync(__templateUsr, __usr)
        }
        global.config = require(path.join(__usr, './config/config.json'))
        x.initUsers();
    },
    getUserDB: then => {
        return fs.readFile(path.join(__usr, './config/users.json'), (err, res) => {
            if (err)
                return then(err);
            else try {
                return then(null, JSON.parse(res));
            } catch (e) {
                return then(e);
            }
        });
    },
    saveUser: (username, userData, db, then) => {
        //console.log(username, userData)
        db[username] = userData;
        fs.writeFile(path.join(__usr, './config/users.json'), JSON.stringify(db, null, 4), (err) => console.log(err));
        then();
    },
    getUserDataByName: (username, then) => {
        return x.getUserDB((err, db) => {
            //console.log("AAAA", username, "AAAA")
            if (err)
                return then(err);
            if (!!db[username]) {
                let user = db[username];
                try {
                    if (!user.token || (user.token && !user.token.startsWith('fu'))) {
                        user.token = 'fu' + crypto.randomBytes(32).toString('hex');
                        x.saveUser(username, user, db, () => { }) // no callback, because... speed! /s
                    }
                } catch (e) { }
             //   console.log('1asdfasdfs')
                return then(null, user);
            }
            else
                return then('no user for ' + username);
        });
    },

    getUserNameByHostName: (hostname, then) => {
        return x.getUserDB((err, db) => {
            if (err)
                return then(err);
            for (let user in db)
                if (db[user].rootOn)
                    for (let rootOn of db[user].rootOn)
                        if (rootOn == hostname)
                            return then(null, user);
            return then(null, '_FILEUP');
        });
    },

    initUsers: () => {
        return x.getUserDB((err, db) => {
            // if (err)
            //     return then(err);
            for (let user in db)
                x.getUserDataByName(user, () => {});
            return;
        });
    },

};
export default x;