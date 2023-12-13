const admin = require('firebase-admin');
const chatCompletion = require('./functions/chatCompletion').chatCompletion;
const getUserData = require('./functions/getUserData').getUserData;
const sendImageRequest = require('./functions/stableDiffusionAPI').sendImageRequest;
const createNewBetaKey = require('./functions/createNewBetaKey').createNewBetaKey;
const validateBetaKey = require('./functions/validateBetaKey').validateBetaKey;
const registerBetaKeyToUser = require('./functions/registerBetaKeyToUser').registerBetaKeyToUser;
const makeAdmin = require('./functions/makeAdmin').makeAdmin;
const getUserBetaKey = require('./functions/getUserBetaKey').getUserBetaKey;

admin.initializeApp();

exports.getUserData = getUserData;
exports.chatCompletion = chatCompletion;
exports.sendImageRequest = sendImageRequest;
exports.createNewBetaKey = createNewBetaKey;
exports.validateBetaKey = validateBetaKey;
exports.registerBetaKeyToUser = registerBetaKeyToUser;
exports.makeAdmin = makeAdmin;
exports.getUserBetaKey = getUserBetaKey;