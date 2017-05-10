# Tutorial : User Authentication with UAA

## Introduction
Web applications often involve securing access to information.  For this reason one commonly needed feature is that of user authentication.  Requiring login to access restricted portions is an essential feature of a secure web application.

This tutorial shows how to enable authentication for the Predix Web App Starter.  Specifically, we use the Predix UAA service, which has its own user interface, for authentication.  Accessing any restricted page of the application with a browser in unauthenticated state should trigger redirection to the UAA login user interface.  Upon successful login the browser is redirected back to the application.  From there the user is able to access the application's restricted information.  This authenticated session lasts until the user logs out or the session expires.  

We first show how to require authentication for all routes and pages of the application. Then we show how to make specific routes require authentication.

If you prefer a video version (on which this written version is based), one is available [**here**](https://youtu.be/AiJ2IFJoTHg?list=PLibNgo_CBeuujvRV26_uLTksm1ezh7oGd).

### Pre-Requisites
This tutorial requires an existing UAA instance.  Please refer to this [**page**](https://www.predix.io/resources/tutorials/tutorial-details.html?tutorial_id=1544&tag=1605&journey=Build%20a%20basic%20application&resources=1580,1569,1523,1544,1547,1549,1556,1553,1570) for information on creating an instance and selecting a set of credentials.  This step produces the following values:

- URL
- clientId
- secret
- username / password (credentials) 
    
Save these values for use in the later configuration steps below.

This tutorial also requires knowledge of and practical experience with the Predix Web App Starter (this project).  You should have been able to install, minimally configure, and deploy the app prior to performing this tutorial.  Please refer to the README document of this project for this requirement.

## Steps
### Configure for Authentication
1. Install the Predix Web App Starter and have it running locally by following the steps in the **README** document of this project.
2. With the app running locally, access the */secure* route ( For example: *https://localhost:5000/secure* ).  You should see a page that says the site is unavailable ( browser shows page that says *cannot GET /secure* ).  This is because the route has not been defined yet.
3. Find the *localConfig.json* file under the *server* folder.  From this file locate the 3 configuration variables:
  - **uaaURL**
  - **base64ClientCredential**
  - **loginBase64ClientCredential**
4. Replace the values of these variables with the following:

  #### uaaURL
  This is the URL of the UAA instance that was created in the **Pre-Requisites** section.  With the service running and a set of credentials in hand (user and password), use the service URL as the value for this variable.

  #### base64ClientCredential
  This is a [**Base64**](https://en.wikipedia.org/wiki/Base64) encoding of the string '*\<clientId\>*:*\<secret\>*', where '*\<clientId\>*' is the client ID configured for access to back end microservices, and '*\<secret\>*' is the client secret for that UAA client.  

  In a Mac OS or Unix environment, you can get this value by running the following command sequence (for example, using the string literals '*app_client_id*' and '*secret*' for **clientId** and **secret** values, respectively):
  ```
    echo -n app_client_id:secret | base64
  ```
  In a Windows environment, [**certutil**](https://technet.microsoft.com/en-us/library/cc732443\(v=ws.11\).aspx) utility can be used to generate the same value.

  After running the above command sequence in your chosen environment, copy the output string into the variable.

  #### loginBase64ClientCredential
  This is a [**Base64**](https://en.wikipedia.org/wiki/Base64) encoding of the string '*\<clientId\>*:*\<secret\>*', where '*\<clientId\>*' is the client ID configured for user access to this application, and '*\<secret\>*' is the client secret for that UAA client. 

  Here is an example of all three configuration variables in *server/localConfig.json* populated with their respective values :

  ```
    ...
    "uaaURL": "https://162665f2-e477-488a-93d1-bb33ccb3d568.predix-uaa.run.aws-usw02-pr.ice.predix.io",
    "base64ClientCredential": "YXBwX2NsaWVudF9pZDpzZWNyZXQ=",
    "loginBase64ClientCredential": "bG9naW5fY2xpZW50X2lkOnNlY3JldA=="
    ...
  ```

### Verify Authentication
1. After modifying localConfig.json, the local web server should restart.  If not, you can restart the running server by typing `rs` into the terminal where the server is running.

2. By default, the app is configured to require login for all routes in the app.  If you try to access http://localhost:5000 you should be redirected to the UAA login screen.  After successful login, the browser is redirected back to the app running on your localhost.

3. Click your user name in the top right, then click the "Sign Out" link.  This directs your browser to the /logout route, which ends your session and redirects you back to the application.  Since all pages in the app require authentication, you'll be immediately redirected back to the UAA login screen.

### Authenticating Only Specific Routes (Optional)
The previous sections show how authentication can be added to the entire application.  In some cases, you might want to allow unauthenticated access to some parts of your application.  To do that, we'll need to modify the code below in server/app.js. 

```
//Use this route to make the entire app secure.  This forces login for any path in the entire app.
app.use('/', passport.authenticate('main', {
  noredirect: false //Don't redirect a user to the authentication page, just show an error
  }),
  express.static(path.join(__dirname, process.env['base-dir'] ? process.env['base-dir'] : '../public'))
);
```
1. Remove the passport middleware function from the '/' route, so Express will no longer require authentication on all routes.  The route should now look like this:
```
app.use('/',
    express.static(path.join(__dirname, process.env['base-dir'] ? process.env['base-dir'] : '../public'))
);
```
2. After the local server restarts, refresh your browser and visit the "About" page: [http://localhost:5000/#/about]()  (You can access the main */#/rmd* route now, but you'll get errors since the back end service routes still require authentication.)

3. Access the */secure* route.  Notice that the browser now returns a page that says  *Unauthorized*, instead of not being able to find the page (as in the previous section).  This is because that route has now been defined, as an authenticated route (other routes that have also been defined are */login*, */callback*, */predix-api* and */logout*).  At this point authentication is in place, and your browser session is in an unauthenticated state.  Consequently, accessing this route results in "Unauthorized" (with the exception of */login*, which redirects to the authentication service's page).

4. Access the */login* route.  Notice that the browser is redirected to the UAA login page.

5. Enter valid credentials in the login page and click on Submit.  Upon successful login, the browser is redirected back to the main */#/rmd* route, which now shows data.

6. Visit the */secure* route again, and you should see the text **This is a sample secure route**.  At this point, the browser session is now in the authenticated state, and access to such route is now authorized.  We have just shown how to integrate UAA with authentication-requiring routes/pages in an instance of the webapp starter.

7. Access the */logout* route.  This will put the browser session back to the unauthenticated state.

8. Access the */secure* route once more.  Notice that we get the *Unauthorized* result again, because the browser session is now back to being unauthenticated.  

### Deploying to the Cloud
The previous steps showed how authentication is enabled in a local instance of the Predix Web App Starter application.  Ultimately, we want the authentication feature to be part of deployments to the Cloud.  To achieve this, perform these steps:

In the *manifest.yml* file (or your designated manifest file), enable services by uncommenting the *services* section, and enter the name of the UAA instance that will be used.  For example:

   ```
    services
    - my-uaa-service
   ```

In the same file, enter the values for **clientId** and **base64ClientCredential** that were used in the previous sections.  For Example:

   ```
    env:
      base64ClientCredential: YXBwX2NsaWVudF9pZDpzZWNyZXQ=
      loginBase64ClientCredential: bG9naW5fY2xpZW50X2lkOnNlY3JldA==
   ```

From the command terminal, and in the main folder of the application, run

   ```
    gulp dist
   ```

to include the configuration in the distribution package for the application.  

Deploy to the Cloud as usual.  

Perform the same steps above to verify that authentication is working.

## Conclusion

This document has shown how to add UAA authentication to an instance of the Predix Web App Starter, and apply the feature to all routes or specific routes only.  It has also shown how to apply the feature in both local and cloud deployments.

## Support and Further Information

For more information on this tutorial, you can ask questions and file tickets on <a href="https://www.predix.io/community" target="_blank">https://www.predix.io/community</a>.
