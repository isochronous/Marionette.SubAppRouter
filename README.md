# Backbone.SubAppRouter #

Remixing Marionette.AppRouter and Backbone.SubRouter to enable easy application extensibility.

This extension to the Marionette.AppRouter is designed to allow sub-applications to define their own routes, and assumes that any sub-application will have its own routing prefix.  For example, if you were trying to create an Outlook clone in Marionette, you might have one "host" application that allows you to switch between a Mail app, a Calendar app, and a Contacts app.  Since those applications are likely to each have separate routes, it makes sense to allow the applications to provide their own routers, rather than tightly coupling the host's router to each sub-application.

Basically, it allows you to easily add a routing prefix to all defined appRoutes.  It does not currently support
dynamically adding new routes after instantiation, but that behavior shouldn't be hard to add if needed.

## Dependencies ##

* [Underscore](http://www.underscorejs.org)
* [Backbone 0.99+](http://www.backbonejs.org)
* [Marionette 1.0+](http://www.marionettejs.com)

## Usage ##

Marionette.SubAppRouter has been designed to allow pre-configuration of all necessary information, dynamic configuration at instantiation, or just about anything in between.

```js
// Pre-configuration
var MailSubRouter = Marionette.SubAppRouter.extend({
  prefix: "mail",
  controller: mailController
  appRoutes: mailRouteHash,
  createTrailingSlashRoutes: true // defaults to false
});
var mailSubRouter = new MailSubRouter();

// Configuration on Instantiation
var mailSubRouter = new Marionette.SubAppRouter("mail", {
    controller: mailController,
    appRouter: mailRouteHash,
    createTrailingSlashRoutes: true
});
```

## Integrating into your Project ##

There are two steps involved in integrating Marionette.SubAppRouter into your project.  The first step is to use `Marionette.SubAppRouter` instead of `Marionette.AppRouter`.  As SubAppRouter is merely an extension of AppRouter, all of your routes and function calls should work with no additional effort.

The second step is to initialize your SubAppRouters with the route prefix you'd like them to handle. This can be done in several ways, but here I'll describe the method I'm currently using.  

In the Outlook clone example, the simplest separation of concerns would probably mean "mail", "calendar", and "contacts" applications, each with their own router.

I generally create an array of objects that contains all of the necessary information for initializing all desired routers, and use Marionette.Application's `addInitializer` method to instantiate and start them.  The `options` object passed to the root application (NOT the router) contains:

* `Router`: the base application's router class
* `controller`: the base application router's controller instance
* `applications`: an array of sub-application info sufficient to instantiate and start all sub-applications

I highly suggest using an AMD loader or other dependency management tool to modularize and load your scripts when working with complex applications. Using this method, all that's required to add another sub-application to your root app is to add dependencies for the app and its router and associated controller, then add their information to the `applications` array in `options`.  To completely change the base routing prefix for an app, just modify the `name` property for that application.

In the examples below, all of the referenced variables (aside from `options`) have been loaded as dependencies via requireJS.  Constructors are cap-case, while instances are camel-case.

### Example Code ###

```js
// Assume mailRouter, calRouter, and contactRouter are all pre-configured except for their prefixes
// This would be  part of the bootstrap method for the root application (main.js for requireJS users)
var options = {
        controller: AppController,
        Router: AppRouter,
        applications: [{
                name: "mail",
                application: mailApp,
                controller: mailController,
                Router: MailAppRouter
            },{
                name: "calendar",
                application: calApp,
                controller: calController,
                Router: CalAppRouter
            },{
                name: "contacts",
                application: contactsApp,
                controller: contactsController,
                Router: ContactsAppRouter
        }]
    };
 
rootApp.start(options);
```

And then in `rootApp`, you'd have:

```js
rootApp.addInitializer(function (options) {
    var i, il, anApp;
    var that = this;

    // Maintain a dictionary of references to all sub-apps by name
    rootApp.subApps = rootApp.subApps || {};

    // Initialize the root app's router first
    rootApp.router = new options.Router({
        controller: options.controller
    });

    for(i=0, il=options.applications.length; i<il; i++) {
        anApp = options.applications[i];

        // Save a reference to the router in the app itself
        anApp.application.router = new anApp.Router(anApp.name, {
          controller: anApp.controller
        });

        subApps[anApp.name] = anApp.application;
    }
});
```

### Example Result ###

If, for the purposes of this example, Mail, Calendar, and Contacts all have four routes: '', foo, bar, and baz, the result of this would be:

Mail Router Routes:

 * /mail
 * /mail/
 * /mail/foo
 * /mail/foo/
 * /mail/bar
 * /mail/bar/
 * /mail/baz
 * /mail/baz/

Calendar Router Routes:

 * /calendar
 * /calendar/
 * /calendar/foo
 * /calendar/foo/
 * /calendar/bar
 * /calendar/bar/
 * /calendar/baz
 * /calendar/baz/
 
etc.  Note that the creation of the routes with trailing slashes is determined by the `createTrailingSlashRoutes` option - set it to false to prevent these additional routes from being created.

## Acknowledgments ##

* Thanks to @chiplay from [Relay Foods](https://github.com/relayfoods) for implementing the immediate triggering of sub-routes on application start
