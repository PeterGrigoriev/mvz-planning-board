var http = require("http");
var express = require("express");
var io = require("socket.io");
var easyrtc = require("easyrtc");

process.title = "mvz-webrtc-server";

var httpApp = express();
httpApp.use(express.static('.'));
var webServer = http.createServer(httpApp);
webServer.listen(+process.env.PORT || 3000);
var socketServer = io.listen(webServer, {"log level": 1});


easyrtc.setOption("logLevel", "debug");

easyrtc.events.on("easyrtcAuth", easyrtcAuthListener);

easyrtc.events.on("roomJoin", roomJoinListener);

easyrtc.listen(httpApp, socketServer, null, startServerListener);

function startServerListener(err, pub) {
    if (err == null) {
        console.info("RTC server started");
        pub.events.on("roomCreate", roomCreateListener);
    }
}

function roomCreateListener(appObj, creatorConnectionObj, roomName, roomOptions, callback) {
    console.info("roomCreate event fired");
    appObj.events.defaultListeners.roomCreate(appObj, creatorConnectionObj, roomName, roomOptions, callback);
}

function easyrtcAuthListener(socket, easyrtcid, msg, socketCallback, callback) {
    console.info("easyrtcAuth event fired");
    easyrtc.events.defaultListeners.easyrtcAuth(socket, easyrtcid, msg, socketCallback, function (err, connectionObj) {
        if (err || !msg.msgData || !msg.msgData.credential || !connectionObj) {
            callback(err, connectionObj);
            return;
        }

        connectionObj.setField("credential", msg.msgData.credential, {"isShared": false});

        console.log("[" + easyrtcid + "] Credential saved!", connectionObj.getFieldValueSync("credential"));

        callback(err, connectionObj);
    });
}

function roomJoinListener(connectionObj, roomName, roomParameter, callback) {
    console.log("[" + connectionObj.getEasyrtcid() + "] Credential retrieved!", connectionObj.getFieldValueSync("credential"));
    easyrtc.events.defaultListeners.roomJoin(connectionObj, roomName, roomParameter, callback);
}
