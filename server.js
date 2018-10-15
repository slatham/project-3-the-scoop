// database is let instead of const to allow us to modify it in test.js
let database = {
  users: {},
  articles: {},
  comments: {},
  nextCommentId: 1,
  nextArticleId: 1
};

const routes = {
  '/users': {
    'POST': getOrCreateUser
  },
  '/users/:username': {
    'GET': getUser
  },
  '/articles': {
    'GET': getArticles,
    'POST': createArticle
  },
  '/articles/:id': {
    'GET': getArticle,
    'PUT': updateArticle,
    'DELETE': deleteArticle
  },
  '/articles/:id/upvote': {
    'PUT': upvoteArticle
  },
  '/articles/:id/downvote': {
    'PUT': downvoteArticle
  },
  '/comments': {
    'POST': createComment
    

  },
  '/comments/:id': {
    'PUT' : updateComment,
    'DELETE': deleteComment

  },
  '/comments/:id/upvote': {

  },
  '/comments/:id/downvote': {

  }
};


/* ------------- Comment functionality - added by SL -------------- */

function createComment (url,request) {
  // Using short-circuit logic, assign request.body.comment to 
  // requestComment if there's a request.body
  const requestComment = request.body && request.body.comment;
  // define an object to hold the response
  const response = {};
  // if requestComment, articleId, username is not undefined and the user exists in 
  // the users object on the database
  if (requestComment && requestComment.body && requestComment.articleId && database.articles[requestComment.articleId] && requestComment.username 
                                 && database.users[requestComment.username]) {
    // crate a comment object to save to the comments object / database
    const comment = {
      id: database.nextCommentId++, // set id to an increment of database.nextCommentId 
      body: requestComment.body,  // define the rest of the properties of the comment
      articleId: requestComment.articleId,
      username: requestComment.username,
      upvotedBy: [],                // no one can upvote the comment as it doesn't exist yet
      downvotedBy: []               // as above
    };
    // save the article object into the articles object
    database.comments[comment.id] = comment;
    // Link the article to the user by saving the incremented article id 
    // to the articleIds array that each user has in the users database object
    database.users[comment.username].commentIds.push(comment.id);

    database.articles[comment.articleId].commentIds.push(comment.id)

    // next set up the response to send back to the user
    // in this case, send back the article that was saved as 
    // the body
    response.body = {comment: comment};
    // because everything went well, set the status to 201
    response.status = 201;
  } else {
    // there was an issue so send back the code 400
    response.status = 400;
  }

  // return back the response
  return response;


};

function updateComment(url,request) {

  // get the id of the comment from the url by
  // splitting on the forward slash, this gives you a 3 element array
  // choose the last element.
  const id = Number(url.split('/')[2]);
  // assign the actual comment by using the id above to select it
  // from the comments object (in the database object) 
  // assign it as savedComment
  const savedComment = database.comments[id];
  // use short circuit evalucation to assign the comment text to 
  // the variable requestComment (if request.body is set)
  const requestComment = request.body && request.body.comment;
  // define an object to return
  const response = {};
  // check that we have a valid id and comment
  // if not this is a bad request and return 400
  if (!id || !requestComment) {
    response.status = 400; 
  // check if the id supplied matches a saved comment in the database
  // object.  If not found, return a 404.  
  } else if (!savedComment) {
    response.status = 404;
  } else {
    // else everything is good, use short circuit evalucation to assign
    // the new comment from the request, or just set it back to
    // the origonal
    savedComment.body = requestComment.body || savedComment.body;
   
    // set up the response object and code ready to be returned
    response.body = {comment: savedComment};
    response.status = 200;
  }
  // return the response
  return response;

}

function deleteComment(url, request) {
  // gets the id in the same way as updateComment
  const id = Number(url.split('/').filter(segment => segment)[1]);
  // assigns the saved comment to the variable saveedComment
  const savedComment = database.comments[id];
  // gets the response ready by initialising it
  const response = {};

  // if there is a comment at that id
  if (savedComment) {
    // set it to null - i.e. delete it from the 
    // database comments object
    database.comments[id] = null;
    // next we want to remove the comments id from the article object
    // first get all the comment ids on the article this comment was attached to
    const articleCommentIds = database.articles[savedComment.articleId].commentIds;
    // then remove the comment id from the articles object
    articleCommentIds.splice(articleCommentIds.indexOf(id),1);
    // get the commentIds array from the user object for the user that created this comment
    const userCommentIds = database.users[savedComment.username].commentIds;
    // alter the array by splicing it from the indexOf our comment on that 1 element only
    userCommentIds.splice(userCommentIds.indexOf(id), 1);
    // set the the status code
    response.status = 204;
  } else {
    // something went wrong, set the status code
    response.status = 404;
  }
  // return the status code
  return response;
}




/* ------------------------------------------------------------------ */




function getUser(url, request) {
  const username = url.split('/').filter(segment => segment)[1];
  const user = database.users[username];
  const response = {};

  if (user) {
    const userArticles = user.articleIds.map(
        articleId => database.articles[articleId]);
    const userComments = user.commentIds.map(
        commentId => database.comments[commentId]);
    response.body = {
      user: user,
      userArticles: userArticles,
      userComments: userComments
    };
    response.status = 200;
  } else if (username) {
    response.status = 404;
  } else {
    response.status = 400;
  }

  return response;
}

function getOrCreateUser(url, request) {
  const username = request.body && request.body.username;
  const response = {};

  if (database.users[username]) {
    response.body = {user: database.users[username]};
    response.status = 200;
  } else if (username) {
    const user = {
      username: username,
      articleIds: [],
      commentIds: []
    };
    database.users[username] = user;

    response.body = {user: user};
    response.status = 201;
  } else {
    response.status = 400;
  }

  return response;
}

function getArticles(url, request) {
  const response = {};

  response.status = 200;
  response.body = {
    articles: Object.keys(database.articles)
        .map(articleId => database.articles[articleId])
        .filter(article => article)
        .sort((article1, article2) => article2.id - article1.id)
  };

  return response;
}

function getArticle(url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1]);
  const article = database.articles[id];
  const response = {};

  if (article) {
    article.comments = article.commentIds.map(
      commentId => database.comments[commentId]);

    response.body = {article: article};
    response.status = 200;
  } else if (id) {
    response.status = 404;
  } else {
    response.status = 400;
  }

  return response;
}

function createArticle(url, request) {

  // see short circuit evaluation https://mzl.la/2OKhoKJ
  // basically if (false) && (something), the something never
  // gets evaluated becuase the first part of the AND is false.
  // in this case if request.body is not set, request.body.article
  // definitly won't be set!  requestArticle is set to the 2nd
  // half as that's where the short circuit ends.  If request.body
  // was undefined, then becuasse it is an AND, the short-circuit will
  // be on the first half -- so requestArticle will be set to undefined.
  const requestArticle = request.body && request.body.article;
  // define a response object that we'll be returning later
  const response = {};
  // check we have a request article, then the properties of requestArticle are set
  if (requestArticle && requestArticle.title && requestArticle.url &&
      requestArticle.username && database.users[requestArticle.username]) {
    // crate an article object to save to the articles object / database
    const article = {
      id: database.nextArticleId++, // set id to an increment of database.nextArticleId 
      title: requestArticle.title,  // define the rest of the properties of the article
      url: requestArticle.url,
      username: requestArticle.username,
      commentIds: [],               // can't have any comments yet - the article doesn't even exit
      upvotedBy: [],                // no one can upvote the article for the same reason as above
      downvotedBy: []               // dito as above
    };
    // save the article object into the articles object
    database.articles[article.id] = article;
    // Link the article to the user by saving the incremented article id 
    // to the articleIds array that each user has in the users database object
    database.users[article.username].articleIds.push(article.id);

    // next set up the response to send back to the user
    // in this case, send back the article that was saved as 
    // the body
    response.body = {article: article};
    // because everything went well, set the status to 201
    response.status = 201;
  } else {
    // there was an issue so send back the code 400
    response.status = 400;
  }

  // return back the response
  return response;
}

function updateArticle(url, request) {
//debugger;
  // get the id of the article to update by parsing the url string
  // split the url string on the forward slash.  The result is an array of three elements
  // then filter the array to remove the blank first element
  // assign id to the second element of the resulting filtered array
  // in this case, the number of the article.
  const id = Number(url.split('/').filter(segment => segment)[1]);
  // get the saved article that is saved in the database object
  // using the id we extracted in the last step
  const savedArticle = database.articles[id];
  // using short-circuit evalucation assign the article text to the
  // variable requestArticle
  const requestArticle = request.body && request.body.article;
  // define the response object we'll be sending back
  const response = {};

  // if id or requestArticle are not set
  // send the 400 status code
  if (!id || !requestArticle) {
    response.status = 400;
    // else if the article is not found, send back a 404 error
  } else if (!savedArticle) {
    response.status = 404;
  } else {
    // else everything is ok 
    // now, if the request contains a title use short circuit evaluation to set it
    // if the request doesn't contain a title, set it back to the origonal, for example.
    // same with the url.  This stops the user deleting one of the inputs while editing the other.
    // Unlike before the Short Circuit is an OR statement, so if the first half is false it'll try the next 
    // until it short circuits.  If it was an AND it'd short circuit on the first item if it was false.  That's
    // becuase false and (anything) will always be false, no point in even trything the next item.
    savedArticle.title = requestArticle.title || savedArticle.title;
    savedArticle.url = requestArticle.url || savedArticle.url;
    // Note the above is actuallly saving the title and url to the database object becuase we set savedArticle
    // equal to one of the saved articles with the line 'const savedArticle = database.articles[id];'


    // set the response body and status code ready to be returned back
    response.body = {article: savedArticle};
    response.status = 200;
  }
  //return the response
  return response;
}

function deleteArticle(url, request) {
  debugger
  // gets the id in the same way as updateArticle 
  const id = Number(url.split('/').filter(segment => segment)[1]);
  // assigns the saved article to a variable
  const savedArticle = database.articles[id];
  // gets the response ready by initialising it
  const response = {};

  // if there is an article at that id
  if (savedArticle) {
    // set it to null - i.e. delete it from the 
    // database object
    database.articles[id] = null;
    // next we remove all the comments for that article
    savedArticle.commentIds.forEach(commentId => {
      // for each comment on that article,
      const comment = database.comments[commentId];
      // delete it from the comments object
      database.comments[commentId] = null;
      // next we need to remove the comment ids from the users object
      // specifically the commentIds array
      // assign a variable to hold the commentIds array
      const userCommentIds = database.users[comment.username].commentIds;
      // next, use indexOf to get the index of the comment given the id
      // then use splice to rempve the element from the index of the comment to
      // just 1.  I.e. remove the 1 element starting at the comment.
      userCommentIds.splice(userCommentIds.indexOf(id), 1);
    });
    // get the array of all articles from the users object
    const userArticleIds = database.users[savedArticle.username].articleIds;
    // use splice to alter the array.  Use indexOf to the get the index of the article
    // given the article's id, then use splice to remove 1 element starting at that point
    // i.e. delete the article from the users object
    userArticleIds.splice(userArticleIds.indexOf(id), 1);
    // set the the status code
    response.status = 204;
  } else {
    // something went wrong, set the status code
    response.status = 400;
  }
  // return the status code
  return response;
}

function upvoteArticle(url, request) {
  debugger
  // get the id from the url as done in other functions
  const id = Number(url.split('/').filter(segment => segment)[1]);
  // SHort circuit eval to assign the username similar to before
  const username = request.body && request.body.username;
  // get and assign the article using the id we extracted
  let savedArticle = database.articles[id];
  // set up our response object
  const response = {};
  // if the id of the article was a valid one in the articles object
  // and the username sent in the request exists in the users database object
  if (savedArticle && database.users[username]) {
    // run the upvote helper function passing it the article and 
    // username of the person upvoting it
    savedArticle = upvote(savedArticle, username);
    // set the body of the response to the altered article
    // after the upvote has been processed
    response.body = {article: savedArticle};
    // set the status code to ok
    response.status = 200;
  } else {
    // there must be an issue, set the status code accordingly
    response.status = 400;
  }
  // return the response
  return response;
}

function downvoteArticle(url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1]);
  const username = request.body && request.body.username;
  let savedArticle = database.articles[id];
  const response = {};

  if (savedArticle && database.users[username]) {
    savedArticle = downvote(savedArticle, username);

    response.body = {article: savedArticle};
    response.status = 200;
  } else {
    response.status = 400;
  }

  return response;
}

function upvote(item, username) {
  // if the person has already downvoted the article, deal with that first
  if (item.downvotedBy.includes(username)) {
    // remove the downvote
    item.downvotedBy.splice(item.downvotedBy.indexOf(username), 1);
  }
  // if they haven't already upvoted, add them to the upvotedBy array
  if (!item.upvotedBy.includes(username)) {
    item.upvotedBy.push(username);
  }
  // return item (either article or comment array) back
  return item;
}

function downvote(item, username) {
  if (item.upvotedBy.includes(username)) {
    item.upvotedBy.splice(item.upvotedBy.indexOf(username), 1);
  }
  if (!item.downvotedBy.includes(username)) {
    item.downvotedBy.push(username);
  }
  return item;
}

// Write all code above this line.

const http = require('http');
const url = require('url');

const port = process.env.PORT || 4000;
const isTestMode = process.env.IS_TEST_MODE;

const requestHandler = (request, response) => {
  const url = request.url;
  const method = request.method;
  const route = getRequestRoute(url);

  if (method === 'OPTIONS') {
    var headers = {};
    headers["Access-Control-Allow-Origin"] = "*";
    headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
    headers["Access-Control-Allow-Credentials"] = false;
    headers["Access-Control-Max-Age"] = '86400'; // 24 hours
    headers["Access-Control-Allow-Headers"] = "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept";
    response.writeHead(200, headers);
    return response.end();
  }

  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.setHeader(
      'Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  if (!routes[route] || !routes[route][method]) {
    response.statusCode = 400;
    return response.end();
  }

  if (method === 'GET' || method === 'DELETE') {
    const methodResponse = routes[route][method].call(null, url);
    !isTestMode && (typeof saveDatabase === 'function') && saveDatabase();

    response.statusCode = methodResponse.status;
    response.end(JSON.stringify(methodResponse.body) || '');
  } else {
    let body = [];
    request.on('data', (chunk) => {
      body.push(chunk);
    }).on('end', () => {
      body = JSON.parse(Buffer.concat(body).toString());
      const jsonRequest = {body: body};
      const methodResponse = routes[route][method].call(null, url, jsonRequest);
      !isTestMode && (typeof saveDatabase === 'function') && saveDatabase();

      response.statusCode = methodResponse.status;
      response.end(JSON.stringify(methodResponse.body) || '');
    });
  }
};

const getRequestRoute = (url) => {
  const pathSegments = url.split('/').filter(segment => segment);

  if (pathSegments.length === 1) {
    return `/${pathSegments[0]}`;
  } else if (pathSegments[2] === 'upvote' || pathSegments[2] === 'downvote') {
    return `/${pathSegments[0]}/:id/${pathSegments[2]}`;
  } else if (pathSegments[0] === 'users') {
    return `/${pathSegments[0]}/:username`;
  } else {
    return `/${pathSegments[0]}/:id`;
  }
}

if (typeof loadDatabase === 'function' && !isTestMode) {
  const savedDatabase = loadDatabase();
  if (savedDatabase) {
    for (key in database) {
      database[key] = savedDatabase[key] || database[key];
    }
  }
}

const server = http.createServer(requestHandler);

server.listen(port, (err) => {
  if (err) {
    return console.log('Server did not start succesfully: ', err);
  }

  console.log(`Server is listening on ${port}`);
});