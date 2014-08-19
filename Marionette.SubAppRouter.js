;define([
    'underscore',
    'backbone',
    'marionette'
],

/**
 * A module that defines and adds Marionette.SubAppRouter to the Marionette object
 * @module marionette.subapprouter
 * @requires module:underscore
 * @requires module:backbone
 * @requires module:marionette
 * @param {Function} Backbone - Backbone.js
 * @param {Function} Marionette - Marionette.js
 * @exports marionette
 */
function(_, Backbone, Marionette) {

    /**
     * Creates an AppRouter with a particular prefix at the beginning of each route.
     * @class Marionette.SubAppRouter
     * @alias module:marionette.subapprouter
     * @classdesc A router that prepends a specified prefix (passed on instantiation) onto each specified `route` or
     * `appRoute`.  Directly extends from Backbone.SubRoute, but also uses the additional logic provided by
     * Marionette.AppRouter to enable controller objects linked to the `appRoutes` hash. Useful for sub applications
     * that live in sub-directories under root and want to handle all of their own routing.
     */
    Marionette.SubAppRouter = Marionette.AppRouter.extend({

        /**
         * @constructs Marionette.SubAppRouter
         * @param {string} [prefix] - The prefix string to prepend to all routes, making them act as if relative. If
         * blank, then it just acts like a regular Backbone.Router.
         * @param {Object} [options] - The options object expected by Marionette.AppRouter.
         * @param {Object} [options.controller] - An object with function properties corresponding to the hash values
         * from `routes` and `appRoutes`.
         */
        constructor: function(prefix, options) {

            var controller,
                appRoutes,
                createTrailingSlashRoutes,
                routes = {};
                
            options = options || {};
            controller = options.controller || this.controller || {};
            // Prefix is optional, set to empty string if not passed
            prefix = prefix || this.prefix || "";
            // if you want to match "books" and "books/" without creating separate routes, set this
            // option to `true` and the sub-router will automatically create those routes for you.
            createTrailingSlashRoutes = options.createTrailingSlashRoutes || this.createTrailingSlashRoutes || false;

            // each subapproute instance should have its own appRoutes hash
            this.appRoutes = _.clone(this.appRoutes);

            // SubRoute instances may be instantiated using a prefix with or without a trailing slash.
            // If the prefix does *not* have a trailing slash, we need to insert a slash as a separator
            // between the prefix and the sub-route path for each route that we register with Backbone.
            this.separator = (prefix.slice(-1) === "/") ? "" : "/";

            if (this.appRoutes) {

                this.controller = controller;
                
                _.each(this.appRoutes, function(callback, path) {
                    if (path) {
                        // Strip off any leading slashes in the sub-route path,
                        // since we already handle inserting them when needed.
                        if (path.substr(0) === "/") {
                            path = path.substr(1, path.length);
                        }

                        routes[prefix + this.separator + path] = callback;

                        if (createTrailingSlashRoutes) {
                            routes[prefix + this.separator + path + "/"] = callback;
                        }
                    } else {
                        // Default routes (those with a path equal to the empty string)
                        // are simply registered using the prefix as the route path.
                        routes[prefix] = callback;

                        if (createTrailingSlashRoutes) {
                            routes[prefix + "/"] = callback;
                        }
                    }
                }, this);

                // Override the local sub-routes with the fully-qualified routes that we just set up.
                this.appRoutes = routes;
            }

            // Required to have Marionette AppRouter set up routes
            Marionette.AppRouter.prototype.constructor.call(this, options);

            // grab the full URL
            var hash;
            if (Backbone.history.fragment) {
                hash = Backbone.history.getFragment();
            } else {
                hash = Backbone.history.getHash();
            }

            // Trigger the subroute immediately.  this supports the case where
            // a user directly navigates to a URL with a subroute on the first page load.
            // Check every element, if one matches, break. Prevent multiple matches
            _.every(this.appRoutes, function(key, route) {
                // Use the Backbone parser to turn route into regex for matching
                if (hash.match(Backbone.Router.prototype._routeToRegExp(route))) {
                    Backbone.history.loadUrl(hash);
                    return false;
                }
                return true;
            }, this);

            if (this.postInitialize) {
                this.postInitialize(options);
            }
        }
    });

    return Marionette;

});
