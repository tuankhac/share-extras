/**
 * Twitter feed dashlet.
 * 
 * @namespace Alfresco
 * @class Alfresco.dashlet.TwitterUserTimeline
 */
(function()
{
   /**
    * YUI Library aliases
    */
   var Dom = YAHOO.util.Dom,
      Event = YAHOO.util.Event;

   /**
    * Alfresco Slingshot aliases
    */
   var $html = Alfresco.util.encodeHTML,
      $combine = Alfresco.util.combinePaths;


   /**
    * Dashboard TwitterUserTimeline constructor.
    * 
    * @param {String} htmlId The HTML id of the parent element
    * @return {Alfresco.dashlet.TwitterUserTimeline} The new component instance
    * @constructor
    */
   Alfresco.dashlet.TwitterUserTimeline = function TwitterUserTimeline_constructor(htmlId)
   {
      return Alfresco.dashlet.TwitterUserTimeline.superclass.constructor.call(this, "Alfresco.dashlet.TwitterUserTimeline", htmlId);
   };

   /**
    * Extend from Alfresco.component.Base and add class implementation
    */
   YAHOO.extend(Alfresco.dashlet.TwitterUserTimeline, Alfresco.component.Base,
   {
      /**
       * Object container for initialization options
       *
       * @property options
       * @type object
       */
      options:
      {
         /**
          * The component id.
          *
          * @property componentId
          * @type string
          * @default ""
          */
         componentId: "",

         /**
          * Twitter username of the user to display the timeline for
          * 
          * @property twitterUser
          * @type string
          * @default ""
          */
         twitterUser: "",

         /**
          * Default Twitter username of the user to display the timeline for, if no specific user is configured
          * 
          * @property defaultTwitterUser
          * @type string
          * @default ""
          */
         defaultTwitterUser: "",

         /**
          * Number of Tweets to load per batch
          * 
          * @property pageSize
          * @type int
          * @default 20
          */
         pageSize: 20,

         /**
          * How often the dashlet should poll for new Tweets, in seconds. Setting to zero disabled checking.
          * 
          * @property checkInterval
          * @type int
          * @default 300
          */
         checkInterval: 300
      },

      /**
       * User timeline DOM container.
       * 
       * @property activityList
       * @type object
       * @default null
       */
      timeline: null,

      /**
       * Dashlet title DOM container.
       * 
       * @property title
       * @type object
       * @default null
       */
      title: null,

      /**
       * Notifications DOM container.
       * 
       * @property notifications
       * @type object
       * @default null
       */
      notifications: null,

      /**
       * Load More button
       * 
       * @property moreButton
       * @type object
       * @default null
       */
      moreButton: null,

      /**
       * New Tweets cache. Populated by polling function, but cached so that the user
       * can then choose to display the tweets by clicking a link.
       * 
       * @property newTweets
       * @type object
       * @default null
       */
      newTweets: null,

      /**
       * Timer for new tweets poll function
       * 
       * @property pollTimer
       * @type object
       * @default null
       */
      pollTimer: null,

      /**
       * Fired by YUI when parent element is available for scripting
       * 
       * @method onReady
       */
      onReady: function TwitterUserTimeline_onReady()
      {
         Event.addListener(this.id + "-configure-link", "click", this.onConfigClick, this, true);
         
         // The user timeline container
         this.timeline = Dom.get(this.id + "-timeline");
         
         // The dashlet title container
         this.title = Dom.get(this.id + "-title");
         
         // The new tweets notification container
         this.notifications = Dom.get(this.id + "-notifications");
         Event.addListener(this.notifications, "click", this.onShowNewClick, null, this);
         
         // Set up the More Tweets button
         this.moreButton = new YAHOO.widget.Button(
            this.id + "-btn-more",
            {
               disabled: true,
               onclick: {
                  fn: this.onMoreButtonClick,
                  obj: this.moreButton,
                  scope: this
               }
            }
         );
         
         // Load the timeline
         this.load();
      },

      /**
       * Reload the timeline from the Twitter API and refresh the contents of the dashlet
       * 
       * @method load
       */
      load: function TwitterUserTimeline_load()
      {
         // Load the timeline
         this._request(
         {
            dataObj:
            {
               twitterUser: this._getTwitterUser(),
               pageSize: this.options.pageSize
            },
            successCallback:
            {
               fn: this.onLoadSuccess,
               scope: this
            },
            failureCallback:
            {
               fn: this.onLoadFailure,
               scope: this
            }
         });
      },
      
      /**
       * Timeline loaded successfully
       * 
       * @method onLoadSuccess
       * @param p_response {object} Response object from request
       * @param p_obj {object} Custom object passed to function
       */
      onLoadSuccess: function TwitterUserTimeline_onLoadSuccess(p_response, p_obj)
      {
         // Update the dashlet title
         this.title.innerHTML = this.msg("header.userTimeline", this._getTwitterUser());
         
         var html = "", tweets, t,userLink, postedLink, isList = this._getTwitterUser().indexOf("/") > 0;
         
         if (p_response.json)
         {
            tweets = p_response.json;
            
            if (tweets.length > 0)
            {
               html += this._generateTweetsHTML(tweets);
            }
            else
            {
               html += "<div class=\"detail-list-item first-item last-item\">\n";
               html += "<span>\n";
               if (isList)
               {
                  html += this.msg("list.noTweets");
               }
               else
               {
                  html += this.msg("user.noTweets");
               }
               html += "</span>\n";
               html += "</div>\n";
            }
         }
         
         this.timeline.innerHTML = html;
         
         // Enable the Load More button
         this.moreButton.set("disabled", false);
         Dom.setStyle(this.id + "-buttons", "display", "block");
         
         // Start the timer to poll for new tweets, if enabled
         this._resetTimer();
      },

      /**
       * Timeline load failed
       * 
       * @method onLoadFailure
       * @param p_response {object} Response object from request
       * @param p_obj {object} Custom object passed to function
       */
      onLoadFailure: function TwitterUserTimeline_onLoadFailure(p_response, p_obj)
      {
         // Update the dashlet title
         this.title.innerHTML = this.msg("header.userTimeline", this._getTwitterUser());
          
         var status = p_response.serverResponse.status,
            isList = this._getTwitterUser().indexOf("/") > 0;
         if (status == 401 || status == 404)
         {
            this.timeline.innerHTML = "<div class=\"msg\">" + this.msg("error." + (isList ? "list" : "user") + "." + status) + "</div>";
         }
         else
         {
            this.timeline.innerHTML = "<div class=\"msg\">" + this.msg("label.error") + "</div>";
         }
         
         // Disable the Load More button
         this.moreButton.set("disabled", true);
         Dom.setStyle(this.id + "-buttons", "display", "none");
      },

      /**
       * Load Tweets further back in time from the Twitter API and add to the dashlet contents
       * 
       * @method extend
       */
      extend: function TwitterUserTimeline_extend()
      {
         // Load the user timeline
         this._request(
         {
            dataObj:
            {
               maxId: this._getEarliestTweetId(),
               pageSize: this.options.pageSize + 1
            },
            successCallback:
            {
               fn: this.onExtensionLoaded,
               scope: this
            },
            failureCallback:
            {
               fn: this.onExtensionLoadFailure,
               scope: this
            }
         });
      },
      
      /**
       * Extended timeline loaded successfully
       * 
       * @method onExtensionLoaded
       * @param p_response {object} Response object from request
       * @param p_obj {object} Custom object passed to function
       */
      onExtensionLoaded: function TwitterUserTimeline_onExtensionLoaded(p_response, p_obj)
      {
         this._refreshDates(); // Refresh existing dates
         this.timeline.innerHTML += this._generateTweetsHTML(p_response.json.slice(1)); // Do not include duplicate tweet
         this.moreButton.set("disabled", false);
      },
      
      /**
       * Extended timeline load failed
       * 
       * @method onExtensionLoadFailure
       * @param p_response {object} Response object from request
       * @param p_obj {object} Custom object passed to function
       */
      onExtensionLoadFailure: function TwitterUserTimeline_onExtensionLoadFailure(p_response, p_obj)
      {
         Alfresco.util.PopupManager.displayMessage(
         {
            text: this.msg("message.extendFailed")
         });
         
         // Re-enable the button
         this.moreButton.set("disabled", false);
      },
      
      /**
       * Check for new Tweets since the last Tweet shown. Display a notice to the user
       * indicating that new Tweets are available, if shown.
       * 
       * @method pollNew
       */
      pollNew: function TwitterUserTimeline_pollNew()
      {
         // Refresh existing dates
         this._refreshDates();
          
         // Load the user timeline
         this._request(
         {
            dataObj:
            {
               minId: this._getLatestTweetId()
            },
            successCallback:
            {
               fn: this.onNewTweetsLoaded,
               scope: this
            },
            failureCallback:
            {
               fn: this.onNewTweetsLoadFailure,
               scope: this
            }
         });
      },
      
      /**
       * New tweets loaded successfully
       * 
       * @method onNewTweetsLoaded
       * @param p_response {object} Response object from request
       * @param p_obj {object} Custom object passed to function
       */
      onNewTweetsLoaded: function TwitterUserTimeline_onNewTweetsLoaded(p_response, p_obj)
      {
         this.newTweets = p_response.json;
         this._refreshNotification();
         
         // Schedule a new poll
         this._resetTimer();
      },
      
      /**
       * New tweets load failed
       * 
       * @method onNewTweetsLoadFailure
       * @param p_response {object} Response object from request
       * @param p_obj {object} Custom object passed to function
       */
      onNewTweetsLoadFailure: function TwitterUserTimeline_onNewTweetsLoadFailure(p_response, p_obj)
      {
         // Schedule a new poll
         this._resetTimer();
      },
      
      /**
       * PRIVATE FUNCTIONS
       */
      
      /**
       * Generate HTML markup for a collection of Tweets
       * 
       * @method _generateTweetsHTML
       * @private
       * @param tweets {array} Tweet objects to render into HTML
       * @return {string} HTML markup
       */
      _generateTweetsHTML: function TwitterUserTimeline__generateTweetsHTML(tweets)
      {
         var html = "", t;
         for (var i = 0; i < tweets.length; i++)
         {
            t = tweets[i];
            if (t.retweeted_status)
            {
               html += this._generateTweetHTML(t.retweeted_status, t);
            }
            else
            {
               html += this._generateTweetHTML(t);
            }
         }
         return html;
      },
      
      /**
       * Generate HTML markup for a single Tweet
       * 
       * @method _generateTweetHTML
       * @private
       * @param t {object} Tweet object to render into HTML
       * @param rt {object} Retweet object, if the Tweet has been RT'ed
       * @return {string} HTML markup
       */
      _generateTweetHTML: function TwitterUserTimeline__generateTweetHTML(t, rt)
      {
         var html = "", 
            profileUri = "http://twitter.com/" + encodeURIComponent(t.user.screen_name),
            userLink = "<a href=\"" + profileUri + "\" title=\"" + $html(t.user.name) + "\" class=\"theme-color-1\">" + $html(t.user.screen_name) + "</a>",
            postedRe = /([A-Za-z]{3}) ([A-Za-z]{3}) ([0-9]{2}) ([0-9]{2}:[0-9]{2}:[0-9]{2}) (\+[0-9]{4}) ([0-9]{4})/,
            postedMatch = postedRe.exec(t.created_at),
            postedOn = postedMatch != null ? (postedMatch[1] + ", " + postedMatch[3] + " " + postedMatch[2] + " " + postedMatch[6] + " " + postedMatch[4] + " GMT" + postedMatch[5]) : (t.created_at),
            postedLink = "<a href=\"" + profileUri + "\/status\/" + encodeURIComponent(t.id_str) + "\"><span class=\"tweet-date\" title=\"" + postedOn + "\">" + this._relativeTime(new Date(postedOn)) + "</span><\/a>";

         html += "<div class=\"user-tweet" + " detail-list-item\" id=\"" + $html(this.id) + "-tweet-" + $html(t.id_str) + "\">\n";
         html += "<div class=\"user-icon\"><a href=\"" + profileUri + "\" title=\"" + $html(t.user.name) + "\"><img src=\"" + $html(t.user.profile_image_url) + "\" alt=\"" + $html(t.user.screen_name) + "\" width=\"48\" height=\"48\" /></a></div>\n";
         html += "<div class=\"tweet\">\n";
         html += "<div class=\"tweet-hd\">\n";
         html += "<span class=\"screen-name\">" + userLink + "</span> <span class=\"user-name\">" + $html(t.user.name) + "</span>\n";
         html += !YAHOO.lang.isUndefined(rt) ? " <span class=\"retweeted\">" + this.msg("label.retweetedBy", rt.user.screen_name) + "</span>\n" : "";
         html += "</div>\n";
         html += "<div class=\"tweet-bd\">" + this._formatTweet(t.text) + "</div>\n";
         html += "<div class=\"tweet-details\">" + this.msg("text.tweetDetails", postedLink, t.source) + "</div>\n";
         html += "</div>\n"; // end tweet
         html += "</div>\n"; // end list-tweet
         return html;
      },

      /**
       * Insert links into Tweet text to highlight users, hashtags and links
       * 
       * @method _formatTweet
       * @private
       * @param {string} text The plain tweet text
       * @return {string} The tweet text, with hyperlinks added
       */
      _formatTweet: function TwitterUserTimeline__formatTweet(text)
      {
         return text.replace(
               /https?:\/\/\S+[^\s.]/gm, "<a href=\"$&\">$&</a>").replace(
               /@(\w+)/gm, "<a href=\"http://twitter.com/$1\">$&</a>").replace(
               /#(\w+)/gm, "<a href=\"http://twitter.com/search?q=%23$1\">$&</a>");
      },
      
      /**
       * Get the current Twitter user or list ID
       * 
       * @method _getTwitterUser
       * @private
       * @return {string} The name of the currently-configured user or list, or the default
       * user/list if unconfigured or blank
       */
      _getTwitterUser: function TwitterUserTimeline__getTwitterUser()
      {
         return (this.options.twitterUser != null && this.options.twitterUser != "") ? 
               this.options.twitterUser : this.options.defaultTwitterUser;
      },
      
      /**
       * Get the ID of the earliest Tweet in the timeline
       * 
       * @method _getEarliestTweetId
       * @private
       * @return {string} The ID of the earliest Tweet shown in the timeline, or null if
       * no Tweets are available or the last Tweet has no compatible ID on its element
       */
      _getEarliestTweetId: function TwitterUserTimeline__getEarliestTweetId()
      {
         var div = Dom.getLastChild(this.timeline);
         if (div !== null)
         {
            var id = Dom.getAttribute(div, "id");
            if (id !== null && id.lastIndexOf("-") != -1)
            {
               return id.substring(id.lastIndexOf("-") + 1);
            }
         }
         return null;
      },
      
      /**
       * Get the ID of the latest Tweet in the timeline
       * 
       * @method _getLatestTweetId
       * @private
       * @return {string} The ID of the latest Tweet shown in the timeline, or null if
       * no Tweets are available or the last Tweet has no compatible ID on its element
       */
      _getLatestTweetId: function TwitterUserTimeline__getLatestTweetId()
      {
         var div = Dom.getFirstChild(this.timeline);
         if (div !== null)
         {
            var id = Dom.getAttribute(div, "id");
            if (id !== null && id.lastIndexOf("-") != -1)
            {
               return id.substring(id.lastIndexOf("-") + 1);
            }
         }
         return null;
      },

      /**
       * Reset the poll timer
       * 
       * @method _resetCounter
       * @private
       */
      _resetTimer: function TwitterUserTimeline__resetTimer()
      {
         this._stopTimer();
         if (this.options.checkInterval > 0)
         {
            // Schedule next transition
            this.pollTimer = YAHOO.lang.later(this.options.checkInterval * 1000, this, this.pollNew);
         }
      },

      /**
       * Stop the poll timer
       * 
       * @method _stopTimer
       * @private
       */
      _stopTimer: function TwitterUserTimeline__stopTimer()
      {
         if (this.pollTimer != null)
         {
            this.pollTimer.cancel();
         }
      },
      
      /**
       * Set up or refresh new tweets notification area
       * 
       * @method _refreshNotification
       * @private
       */
      _refreshNotification: function TwitterSearch__refreshNotification()
      {
          if (this.newTweets != null && this.newTweets.length > 0)
          {
             // Create notification
             if (this.newTweets.length == 1)
             {
                this.notifications.innerHTML = this.msg("message.newTweet");
             }
             else
             {
                this.notifications.innerHTML = this.msg("message.newTweets", this.newTweets.length);
             }
             Dom.setStyle(this.notifications, "display", "block");
          }
          else
          {
             // Remove notification
             Dom.setStyle(this.notifications, "display", "none");
          }
      },
      
      /**
       * Get relative time where possible, otherwise just return a simple string representation of the suppplied date
       * 
       * @method _relativeTime
       * @private
       * @param d {date} Date object
       */
      _relativeTime: function TwitterUserTimeline__getRelativeTime(d)
      {
          return typeof(Alfresco.util.relativeTime) === "function" ? Alfresco.util.relativeTime(d) : Alfresco.util.formatDate(d)
      },

      /**
       * Re-render relative post times in the tweet stream
       * 
       * @method _refreshDates
       * @private
       */
      _refreshDates: function TwitterUserTimeline__refreshDates()
      {
         var els = Dom.getElementsByClassName("tweet-date", "span", this.searchResults), dEl;
         for (var i = 0; i < els.length; i++)
         {
            dEl = els[i];
            dEl.innerHTML = this._relativeTime(new Date(Dom.getAttribute(dEl, "title")));
         }
      },

      /**
       * Request data from the web service
       * 
       * @method _request
       */
      _request: function TwitterUserTimeline__request(p_obj)
      {
         var url;
         var uparts = this._getTwitterUser().split("/");
         var params = {};

         if (uparts.length > 1)
         {
            url = Alfresco.constants.PROXY_URI.replace("/alfresco/", "/twitter/") + "1/" + uparts[0] + "/lists/" + uparts[1] + 
               "/statuses.json";
            params = {
                    per_page: p_obj.dataObj.pageSize || this.options.pageSize
            };
            /*
            url = Alfresco.constants.PROXY_URI.replace("/alfresco/", "/twitter/") + "1/statuses/lists/show.json";
            params = {
                    slug: uparts[0],
                    owner_screen_name: uparts[1],
                    per_page: p_obj.dataObj.pageSize || this.options.pageSize
            };*/
         }
         else
         {
            url = Alfresco.constants.PROXY_URI.replace("/alfresco/", "/twitter/") + "1/statuses/user_timeline.json";
            params = {
                    screen_name: uparts[0],
                    count: p_obj.dataObj.pageSize || this.options.pageSize,
                    include_rts: true
            };
         }

         if (p_obj.dataObj.maxId != null)
         {
             params.max_id = p_obj.dataObj.maxId;
         }
         if (p_obj.dataObj.minId != null)
         {
             params.since_id = p_obj.dataObj.minId;
         }
         
         // Load the timeline
         Alfresco.util.Ajax.request(
         {
            url: url,
            dataObj: params,
            successCallback: p_obj.successCallback,
            failureCallback: p_obj.failureCallback,
            scope: this,
            noReloadOnAuthFailure: true
         });
      },

      /**
       * YUI WIDGET EVENT HANDLERS
       * Handlers for standard events fired from YUI widgets, e.g. "click"
       */

      /**
       * Configuration click handler
       *
       * @method onConfigClick
       * @param e {object} HTML event
       */
      onConfigClick: function TwitterUserTimeline_onConfigClick(e)
      {
         var actionUrl = Alfresco.constants.URL_SERVICECONTEXT + "modules/dashlet/config/" + encodeURIComponent(this.options.componentId);
         
         Event.stopEvent(e);
         
         if (!this.configDialog)
         {
            this.configDialog = new Alfresco.module.SimpleDialog(this.id + "-configDialog").setOptions(
            {
               width: "50em",
               templateUrl: Alfresco.constants.URL_SERVICECONTEXT + "extras/modules/dashlets/twitter-user-timeline/config", actionUrl: actionUrl,
               onSuccess:
               {
                  fn: function VideoWidget_onConfigFeed_callback(response)
                  {
                     // Refresh the feed
                     var u = YAHOO.lang.trim(Dom.get(this.configDialog.id + "-twitterUser").value),
                        newUser = (u != "") ? u : this.options.defaultTwitterUser;
                     
                     if (this.options.twitterUser != newUser)
                     {
                        this.options.twitterUser = newUser;
                        this.load();
                     }
                  },
                  scope: this
               },
               doSetupFormsValidation:
               {
                  fn: function VideoWidget_doSetupForm_callback(form)
                  {
                     Dom.get(this.configDialog.id + "-twitterUser").value = this._getTwitterUser();

                     // Search term is mandatory
                     this.configDialog.form.addValidation(this.configDialog.id + "-twitterUser", Alfresco.forms.validation.mandatory, null, "keyup");
                     this.configDialog.form.addValidation(this.configDialog.id + "-twitterUser", Alfresco.forms.validation.mandatory, null, "blur");
                  },
                  scope: this
               }
            });
         }
         else
         {
            this.configDialog.setOptions(
            {
               actionUrl: actionUrl,
               twitterUser: this.options.twitterUser
            });
         }
         this.configDialog.show();
      },

      /**
       * Click handler for Show More button
       *
       * @method onMoreButtonClick
       * @param e {object} HTML event
       */
      onMoreButtonClick: function TwitterUserTimeline_onMoreButtonClick(e, obj)
      {
         // Disable the button while we make the request
         this.moreButton.set("disabled", true);
         this.extend();
      },

      /**
       * Click handler for show new tweets link
       *
       * @method onShowNewClick
       * @param e {object} HTML event
       */
      onShowNewClick: function TwitterUserTimeline_onShowNewClick(e, obj)
      {
         Event.stopEvent(e);
         if (this.newTweets !== null && this.newTweets.length > 0)
         {
            var thtml = this._generateTweetsHTML(this.newTweets);
            this._refreshDates(); // Refresh existing dates
            this.timeline.innerHTML = thtml + this.timeline.innerHTML;
            this.newTweets = null;
         }
         
         // Fade out the notification
         this._refreshNotification();
      }
      
   });
})();
