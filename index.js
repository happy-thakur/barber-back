const functions = require('firebase-functions');
const admin = require('firebase-admin');
const request = require('request');
const cors = require("cors")
const express = require("express")
const app = express();
const nodemailer = require('nodemailer');
const requestP = require('request-promise');

var serviceAccount = require('./serviceAccountKey.json');

// admin.initializeApp(functions.config().firebase);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://knipnu.firebaseio.com'
});


// const helloWorld = functions.https.onRequest((request, response) => {
//     response.send("Hello from Firebase!");
// });

const SERVER_URL = "http://localhost:4200/";

// const gmailEmail = functions.config().gmail.email;
const gmailEmail = "knipnu.nl@gmail.com";
// const gmailPassword = functions.config().gmail.password;
const gmailPassword = "knipnu.nl@229001";

const mailTransport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: gmailEmail,
        pass: gmailPassword,
    },
});

const APP_NAME = "Knipnu";


// Add headers
app.use(function(req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});


app.get("/welcome", (req, res) => {
    sendWelcomeEmail("suryanshsinghstudy@gmail.com", "happy");
    sendEmail("suryanshsinghstudy@gmail.com", "happy", "this is\n done <a href='http://localhost:4200/delete/-L7iNLWr2_9aqGjIxM-7'>cancel</a>", "ha ha ha");
    res.send("done welcome");
})


app.get("/", (req, res) => {
    res.send("welcome!");
})


function sendWelcomeEmail(email, displayName) {
    const mailOptions = {
        from: `${APP_NAME} <noreply@firebase.com>`,
        to: email,
    };

    // The user subscribed to the newsletter.
    mailOptions.subject = `Welcome to ${APP_NAME}!`;
    mailOptions.text = `Hey ${displayName || ''}! Welcome to ${APP_NAME}. I hope you will enjoy our service.`;
    return mailTransport.sendMail(mailOptions).then(() => {
        return console.log('New welcome email sent to:', email);
    });
}

function sendAccountCreationEmail(email, displayName) {
    const mailOptions = {
        from: `${APP_NAME} <noreply@firebase.com>`,
        to: email,
    };

    // The user subscribed to the newsletter.
    mailOptions.subject = `Welcome to ${APP_NAME}!`;
    mailOptions.text = `New Account Created ` + displayName;
    return mailTransport.sendMail(mailOptions).then(() => {
        return console.log('New welcome email sent to:', email);
    });
}

function sendGoodbyEmail(email, displayName) {
    const mailOptions = {
        from: `${APP_NAME} <noreply@firebase.com>`,
        to: email,
    };

    // The user unsubscribed to the newsletter.
    mailOptions.subject = `Bye!`;
    mailOptions.text = `Hey ${displayName || ''}!, We confirm that we have deleted your ${APP_NAME} account.`;
    console
    return mailTransport.sendMail(mailOptions).then(() => {
        return console.log('Account deletion confirmation email sent to:', email);
    });
}

function sendEmail(email, displayName, message, subject) {
    const mailOptions = {
        from: `${APP_NAME} <noreply@firebase.com>`,
        to: email,
    };

    // The user subscribed to the newsletter.
    mailOptions.subject = subject;
    mailOptions.html = message;
    return mailTransport.sendMail(mailOptions).then(() => {
        return console.log(subject);
    });
}

app.get("/bye", (req, res) => {
    sendGoodbyEmail("suryanshsinghsite@gmail.com", "suryansh");
    res.send("byebyye");
})

app.get("/sendSMS", (req, res) => {
    res.send(
        sendSMS({
            "message": "demo text",
            "phoneNo": "919990957742"
        })
    )
})


app.get("/sendMail", (req, res) => {
    res.json(
        sendMail1({
            "to": "suryanshsinghstudy@gmail.com",
            "subject": "testing",
            "text": "demo text"
        }));
})

app.get('/shopList', (req, res) => {
    res.json(getAllShopUser);
    // res.json({
    //     "done": "done"
    // });
})

app.get('/userDetail/:id', (req, res) => {
    // res.json(fetchUserData(req.param['id']));
    const uid = req.params['id'];
    admin.auth().getUser(uid)
        .then((userRecord) => {
            // See the UserRecord reference doc for the contents of userRecord.
            // console.log("Successfully fetched user data:", userRecord.toJSON());
            console.log(`/shop/${uid}/address`);
            admin.database().ref(`/shop/${uid}/address`).once('value').then(function(snapshot) {
                res.json({ "status": "Success", "result": userRecord, "address": snapshot.val() });
            });


        })
        .catch(function(error) {
            // console.log("Error fetching user data:", error);
            res.json({ "status": "Error", "result": error })

        });
    // res.json({
    //     "done": req.params,
    //     "this": "this."
    // });
})

app.post("/addUser", (req, res) => {
    // console.warn("this is to add the user");
    console.log(req.body.tokenId);
    if (!req.body.tokenId) {
        console.log()
        console.log(!req.body.tokenId);
        res.json({
            "status": "Error",
            "result": "------Bad parameters."
        })
    }
    checkAdmin(req.body.tokenId)
        .then((data) => {
            console.info(data);
            if (data)
                return addShopUser(req.body.detail);
            else
                return new Promise((resolve, reject) => {
                    resolve({
                        "status": "Error",
                        "result": "No permission to perform this operation.."
                    });
                })
        })
        .then(data => {
            sendAccountCreationEmail("suryanshsinghsite@gmail.com", req.body.detail['email'] + " - " + req.body.detail['phoneNumber']);
            sendWelcomeEmail(req.body.detail['email'], req.body.detail['email']);
            sendSMS({
                    "message": `Hey ${req.body.detail['email'] || ''}! Welcome to ${APP_NAME}. I hope you will enjoy our service.`,
                    "phoneNo": req.body.detail['phoneNumber']
                })
                // sendSMS({
                //     "message": "demo text",
                //     "phoneNo": "919455381836"
                // })
            res.json(data)
        })
        .catch(err => res.json({
            "status": "Error",
            "result": err
        }));
})



// check token id
// admin.auth().verifyIdToken(idToken)
//   .then(function(decodedToken) {
//     var uid = decodedToken.uid;
//     // ...
//   }).catch(function(error) {
//     // Handle error
//   });


app.post("/updateUser", (req, res) => {
    if (!req.body.tokenId || (req.body && req.body.detail && (!req.body.detail['uid'] || req.body.detail['uid'].length == 0)))
        return res.json({
            "status": "Error",
            "result": "*****Bad parameters."
        })
    checkAdmin(req.body.tokenId)
        .then((data) => {
            if (data)
                return updateUser(req.body.detail);
            else
                return new Promise((resolve, reject) => {
                    resolve({
                        "status": "Error",
                        "result": "No permission to perform this operation.."
                    });
                })
        })
        .then(data => res.json(data))
        .catch(err => res.json({
            "status": "Error-admin",
            "result": err
        }));
})

// updateUser

function checkPhoneNo(phoneNo) {

    // return  boolean;
}

function convertPhone(phoneNo) {

    // return phoneNo
}

function addShopUser(detail) {
    return new Promise((resolve, reject) => {

        // check phone no.
        // detail.phoneNo = this.convertPhone(detail.phoneNo);

        // if (!checkPhoneNo(detail.phoneNo))
        //     return {
        //         "status": "Error",
        //         "message": "Please Enter Valid Phone Number"
        //     };

        if (!detail["email"] || !detail['phoneNumber'])
            reject("////Bad parameters.");

        admin.auth().createUser({
                email: detail["email"] || "",
                emailVerified: false,
                phoneNumber: detail['phoneNumber'],
                password: detail['password'],
                displayName: detail['displayName'] || "",
                photoURL: detail['photoURL'] || "https://firebasestorage.googleapis.com/v0/b/barber-e988f.appspot.com/o/default.jpg?alt=media&token=a77d6168-a649-4bd6-8857-cbdc5ad02701",
                disabled: false
            })
            .then(function(userRecord) {
                // See the UserRecord reference doc for the contents of userRecord.
                detail["uid"] = userRecord.uid;
                detail["updatedTime"] = admin.database.ServerValue.TIMESTAMP;
                detail["createdTime"] = admin.database.ServerValue.TIMESTAMP;
                // now add detail to database
                admin.database().ref('/shop/' + userRecord.uid).set(detail).then(function(user) {
                    resolve({
                        "status": "Success",
                        "result": userRecord
                    });
                    // send mail to admin
                    // send message and mail to user..
                    console.log("Successfully created new user:", userRecord.uid);
                })
            })
            .catch(function(error) {
                // error...
                // console.log("Error creating new user:", error);
                reject(error);
            });
    })

}

function updateUser(detail) {
    return new Promise((resolve, reject) => {

        admin.auth().updateUser(detail["uid"], {
                email: detail["email"] || "",
                emailVerified: false,
                phoneNumber: detail['phoneNumber'],
                password: detail['password'],
                displayName: detail['displayName'] || "",
                photoURL: detail['photoURL'] || "https://firebasestorage.googleapis.com/v0/b/barber-e988f.appspot.com/o/default.jpg?alt=media&token=a77d6168-a649-4bd6-8857-cbdc5ad02701",
                disabled: detail["disable"] || false
            })
            .then(function(userRecord) {
                // See the UserRecord reference doc for the contents of userRecord.
                detail["uid"] = detail["uid"] || userRecord.uid;
                detail["updatedTime"] = admin.database.ServerValue.TIMESTAMP;
                // now add detail to database
                admin.database().ref('/shop/' + userRecord.uid).update(detail).then(function(user) {
                    resolve({
                        "status": "Success",
                        "result": userRecord
                    });
                    // send mail to admin
                    // send message and mail to user..
                    console.log("Successfully updated user:", userRecord.uid);
                })
            })
            .catch(function(error) {
                console.log("Error updating user:", error);
                reject(error);
            });
    })
}


function deleteUser(uid) {
    admin.auth().deleteUser(uid)
        .then(function() {
            console.log("Successfully deleted user");
        })
        .catch(function(error) {
            console.log("Error deleting user:", error);
        });
}


function fetchUserData(uid) {
    admin.auth().getUser(uid)
        .then(function(userRecord) {
            // See the UserRecord reference doc for the contents of userRecord.
            // console.log("Successfully fetched user data:", userRecord.toJSON());

            return { "status": "Success", "result": userRecord }
        })
        .catch(function(error) {
            // console.log("Error fetching user data:", error);
            return { "status": "Error", "result": error }

        });
}

app.post("/bookAppointment", (req, res) => {
    // check of no is verified

    const uid = req.body.user_uid;
    const shop_uid = req.body['shop_uid'];
    let recId;

    admin.auth().getUser(req.body.user_uid)
        .then(function(userRecord) {
            // push the data into database.

            // check if phone no is verified..
            if (userRecord.toJSON()['phoneNumber'] == req.body.phoneNumber) {
                delete req.body['user_uid'];
                delete req.body['shop_uid'];
                return admin.database().ref("/shop/" + shop_uid + "/appointment").push(req.body);
            }
            console.log("Successfully fetched user data:", userRecord.toJSON());
        })
        .then(data => {
            console.log(data.key);
            recId = data.key;
            return admin.auth().deleteUser(uid);
        })
        .then(data => {

            // mail that appointment done with url to delete it..

            console.log(req.body);
            // sendAccountCreationEmail(req.body.email, `Appointment done\n Use this url to delete appointment ${SERVER_URL}delete/${shop_uid}/${recID} `)
            // \n Use this url to delete appointment ${SERVER_URL}delete/${shop_uid}/${recID} 
            console.log(recId);
            console.log(SERVER_URL);
            console.log(shop_uid);
            console.log(req.body.name);
            console.log(req.body.email);
            console.log();
            sendEmail(req.body.email, req.body.name, 'Appointment done Use this url to delete appointment' + SERVER_URL + 'apps/delete/' + shop_uid + '/' + recId, `Knipnu - Appointment done.`)
                .then(() => {
                    sendSMS({
                        "message": 'Appointment done Use this url to delete appointment' + SERVER_URL + 'apps/delete/' + shop_uid + '/' + recId,
                        "phoneNo": req.body.phoneNumber
                    })
                    res.json({ "status": "Success", "result": "done appointment" })
                })

        })
        .catch(function(error) {
            res.json({ "status": "Error", "result": error });
        });





});

app.get('/write', (req, res) => {
    admin.database().ref("/this").push("ths.");

})


app.get("/happList", (req, res) => {
    admin.auth().listUsers(1000)
        .then(function(listUsersResult) {
            res.json({
                "status": "Success",
                "result": listUsersResult.users
            });
            // if (listUsersResult.pageToken) {
            //     // List next batch of users.
            //     listAllUsers(listUsersResult.pageToken)
            // }
        })
        .catch(function(error) {
            console.log("Error listing users:", error);
            res.json({
                "status": "Error",
                "message": "Unable to fetch the users"
            })
        });
});

function getAllShopUser() {
    // List batch of users, 1000 at a time.
    console.info("hello");
    admin.auth().listUsers(1000)
        .then(function(listUsersResult) {
            return {
                "status": "Success",
                "result": listUsersResult.users
            };
            // if (listUsersResult.pageToken) {
            //     // List next batch of users.
            //     listAllUsers(listUsersResult.pageToken)
            // }
        })
        .catch(function(error) {
            console.log("Error listing users:", error);
            return {
                "status": "Error",
                "result": "Unable to fetch the users"
            }
        });
}

// returns admin info or null..
function checkAdmin(tokenId) {
    return new Promise((resolve, reject) => {
        // admin.auth().verifyIdToken(JSON.stringify(tokenId))
        // .then((decodedToken) => {
        const uid = tokenId['uid'];
        console.error(uid);
        admin.database().ref('/admins/' + uid).once('value').then(function(snapshot) {
            let admins = snapshot.val();
            if (admins) {
                resolve(admin);
            } else {
                resolve(null);
            }
        });
        // }).catch((error) => {
        //     reject(error);
        // });
    })
}

// 
function checkUser(uid) {

    // return boolean.
    return true;
}

// firebase functions:config:set gmail.email="suryansh2017.10@gmail.com" gmail.password="suryansh@2017"
// firebase functions:config:set sms.consumer_key="OCAy9ukYwtdGtavzqNZHjeyY" sms.consumer_secret="Tlovwa&^)st7agF@mqzF7F)Wtw9a&9Wh%-KvylZO"



app.get("/two", (req, res) => {

    const mailOptions = {
        from: "suryansh2017.14@gmail.com",
        to: "suryanshsinghstudy@gmail.com",
        subject: "subh",
        text: "text"
    };


    mailTransport.sendMail(mailOptions)
        .then(() => {
            console.log(`New confirmation email sent to:`);
            res.json({
                "ppp": mailOptions
            });
        })
        .catch((error) => {
            console.error('There was an error while sending the email:', error);
            res.json({
                "ppp": error
            });
        });
})


// detail -> object
function sendMail1(from, detail) {

    const mailOptions = {
        from: from,
        to: detail['to'],
        subject: ['subject'],
        text: ['text']
    };

    // return promise..
    return mailTransport.sendMail(mailOptions);
}



app.get("/delete/:uid/:recId", (req, res) => {

    const uid = req.params.uid;
    const recId = req.params.recId;

    // get data first..



    admin.database().ref("/shop/" + uid + "/appointment/" + recId).remove()
        .then(data => {
            console.log(data);
            // mail that appointment removed..

            sendEmail(user.email, user.name, `Appotinment deleted`, 'Knipnu - Appointment delete')
            res.json({
                "status": "Success",
                "result": "Deleted Succesfully"
            })
        })
        .catch(err => {
            console.log(err);
            res.json({
                "status": "Error",
                "result": "Error Occured"
            })
        })


})





// detail -> object..
function sendSMS(detail) {
    request.post({
        url: 'https://gatewayapi.com/rest/mtsms',
        oauth: {
            consumer_key: 'OCAy9ukYwtdGtavzqNZHjeyY',
            consumer_secret: 'Tlovwa&^)st7agF@mqzF7F)Wtw9a&9Wh%-KvylZO',
        },
        // oauth: functions.config().sms,
        json: true,
        body: {
            sender: 'KNIPNU',
            message: detail['message'],
            recipients: [{ msisdn: detail['phoneNo'] }],
        },
    }, function(err, r, body) {
        console.log(err ? err : body);
        return (err ? err : body);
    });
}

// exports.helloError = functions.https.onRequest((request, response) => {
//     console.log('I am a log entry!');
//     response.send('Hello World...');
// });

// exports.app = functions.https.onRequest(app);



app.listen(2525, () => {
    console.log("listening at 2525");
})