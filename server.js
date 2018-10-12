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
    'POST': createComment,
    //'PUT' : updateComment

  },
  '/comments/:id': {

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
debugger;
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
    // now 
    savedArticle.title = requestArticle.title || savedArticle.title;
    savedArticle.url = requestArticle.url || savedArticle.url;

    response.body = {article: savedArticle};
    response.status = 200;
  }

  return response;
}

function deleteArticle(url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1]);
  const savedArticle = database.articles[id];
  const response = {};

  if (savedArticle) {
    database.articles[id] = null;
    savedArticle.commentIds.forEach(commentId => {
      const comment = database.comments[commentId];
      database.comments[commentId] = null;
      const userCommentIds = database.users[comment.username].commentIds;
      userCommentIds.splice(userCommentIds.indexOf(id), 1);
    });
    const userArticleIds = database.users[savedArticle.username].articleIds;
    userArticleIds.splice(userArticleIds.indexOf(id), 1);
    response.status = 204;
  } else {
    response.status = 400;
  }

  return response;
}

function upvoteArticle(url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1]);
  const username = request.body && request.body.username;
  let savedArticle = database.articles[id];
  const response = {};

  if (savedArticle && database.users[username]) {
    savedArticle = upvote(savedArticle, username);

    response.body = {article: savedArticle};
    response.status = 200;
  } else {
    response.status = 400;
  }

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
  if (item.downvotedBy.includes(username)) {
    item.downvotedBy.splice(item.downvotedBy.indexOf(username), 1);
  }
  if (!item.upvotedBy.includes(username)) {
    item.upvotedBy.push(username);
  }
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