'use strict'

var Config 	= require('./config')
var wit 	= require('./services/wit').getWit()
var FB 		= require('./connectors/facebook')
// LETS SAVE USER SESSIONS
var sessions = {}

var findOrCreateSession = function (fbid) {
  var sessionId

  // DOES USER SESSION ALREADY EXIST?
  Object.keys(sessions).forEach(k => {
    if (sessions[k].fbid === fbid) {
      // YUP
        sessionId = k
    }
  })

  // No session so we will create one
  var newSessionId = new Date().toISOString()
  if (!sessionId) {
    sessions[newSessionId] = {
      fbid: fbid,
      context: {
        _fbid_: fbid
      }
    }
    return newSessionId
  } else if (sessions[sessionId].context.done) {
  	sessions[newSessionId] = Object.assign({}, sessions[sessionId])
  	delete sessions[newSessionId].context.done
  	delete sessions[sessionId];
  	//console.log('[bot sess]: ', sessions[newSessionId]);
  	return newSessionId
  }

  return sessionId
}

var read = function (sender, message, reply) {
	if (message === 'TestBot') {
		// Let's reply back hello
		message = 'Hello Cardinal"'
		reply(sender, message)
	} else {
		// Let's find the user
		var sessionId = findOrCreateSession(sender)
    console.log('[bot] [read]: ' + message);
		if (!sessions[sessionId].context.isFetchUser) {
			sessions[sessionId].context.isFetchUser = true;
			FB.getUserProfile(sender, function (err, resp, data) {
	      		if(!err) {
	      			sessions[sessionId].context.first_name = data.first_name
	      			sessions[sessionId].context.last_name = data.last_name
	      			sessions[sessionId].context.sex = data.gender
	      			sessions[sessionId].context.name = data.first_name + ' ' + data.last_name
					// Let's forward the message to the Wit.ai bot engine
					// This will run all actions until there are no more actions left to do
					wit.runActions(
						sessionId, // the user's current session by id
						message,  // the user's message
						sessions[sessionId].context
					)
	      		} else {
	        		console.err(err, data);
	      		}
	  		})
	  	} else {
	  		wit.runActions(
				sessionId, // the user's current session by id
				message,  // the user's message
				sessions[sessionId].context
			)
	  	}
		
	}
}



module.exports = {
	findOrCreateSession: findOrCreateSession,
	read: read,
}