require([
  'jquery',
  'utils/context',
  'hbs!./map-message',
  'utils/tracking' // no ref
 ],
  function($, context, mapMessageTemplate) {
    "use strict";

    function random(a) {return a[Math.floor(Math.random() * a.length)]; }

    $('#arrow-1').click(function() {
      if (window.mixpanel) window.mixpanel.track('arrow-click', { arrow: 'arrow-1' });
    });

    $('#arrow-2').click(function() {
      if (window.mixpanel) window.mixpanel.track('arrow-click', { arrow: 'arrow-2' });
    });
    
    var featuredRooms  = [
      { uri: 'marionettejs/backbone.marionette',
        name: 'Marionette',
        language: 'JavaScript',
        locale: 'en'
      },
      { uri: 'LaravelRUS/chat',
        name: 'LaravelRUS',
        channel: true,
        language: 'PHP',
        locale: 'ru'
      },
      { uri: 'gitterHQ/nodejs',
        name: '#nodejs',
        channel: true,
        language: 'JavaScript',
        locale: 'en'
      },
      { uri: 'lotus/chat',
        name: 'Lotus',
        channel: true,
        language: 'Ruby',
        locale: 'en'
      },
      { uri: 'rom-rb/chat',
        name: 'rom-rb',
        channel: true,
        language: 'Ruby',
        locale: 'en'
      },
      { uri: 'webpack/webpack',
        name: 'WebPack',
        language: 'JavaScript',
        locale: 'en'
      },
      { uri: 'ruby-vietnam/chat',
        name: 'Ruby Vietnam',
        channel: true,
        language: 'Ruby',
        locale: 'vi'
      },
      { uri: 'require-lx/group',
        name: "require('lx')",
        language: 'JavaScript',
        locale: 'en'
      },
      { uri: 'angular-ui/ng-grid',
        name: 'Angular UI',
        language: 'JavaScript',
        locale: 'en'
      },
      { uri: 'opscode/supermarket',
        name: 'Supermarket',
        language: 'Ruby',
        locale: 'en'
      },
      { uri: 'MahApps/MahApps.Metro',
        name:'MahApps.Metro',
        language: 'PowerShell',
        locale: 'en'
      },
      { uri: 'sympy/sympy',
        name: 'Sympy',
        language: 'Python',
        locale: 'en'
      },
      { uri: 'rogeriopvl/erebot',
        name: 'erebot',
        language: 'JavaScript',
        locale: 'es'
      }
    ];

    var active = [];
 
    // TODO: malditogeek comment
    function roomByLocale(locale) {
      var rooms = featuredRooms.filter(function(r) { return r.locale === locale;});
      if (rooms.length) {
        active.push(rooms[0].name);
        return rooms[0];
      } else {
        return randomRoom();
      } 
    }

    // TODO: malditogeek comment
    function randomRoom() {
      var room = random(featuredRooms);
      if (active.indexOf(room.name) === -1) {
        active.push(room.name);
        return room;
      } else {
        return randomRoom();
      }
    }

    /**
     *  Gitter() hadnles front-page client-side stuff
     *  inside the scope of Gitter we have a window argument which is simply
     */
    var Gitter = function (window) {
      // ui elements
      var ui = {
        map: $('.map'),
        apps: $('#apps-panel'),
        blockquotes: $('#testimonials-panel blockquote'),
        integration: $('.loves li')
      };

      // initialises all the things
      this.init = function() {
        this.embedChats(); // embedded chats
        this.appsPanel(); // #app-panel for animation
        this.map(); //  map conversations
        
        this.cycle(ui.blockquotes, 7000); // cycle blockquotes
        this.cycle(ui.integration, 2500); // cycle blockquotes

        $('.tooltip-container').on('mouseout', function() {
          $(this).addClass('out');
          setTimeout(function () { $(this).removeClass('out'); }, 400);
        }).on('mouseover', function () {
          $(this).removeClass('out');
        });
      };

      // TODO: comment, since "el designer" was the author
      this.cycle = function(el, speed) {
        el.first().addClass('visible');

        el.parent().css('height', el.outerHeight());

        setInterval(function () {
          var active = el.filter('.visible').removeClass('visible').addClass('going');
          var target = active.next();

          if(!target.length) {
            target = el.first();
          }

          target.removeClass('going').addClass('visible');
        }, speed || 4000);
      };

      // handles the sliding of the devices onto #apps-panel
      this.appsPanel = function () {
        var POS = ui.apps.position().top;
        var OFFSET = 150;
        
        // handleScroll() handles the scrolling event, adds the visible class and detaches itself from the window
        function handleScroll (e) {
          e.preventDefault();
          if (window.scrollTop() + OFFSET >= POS) {
            ui.apps.addClass('visible');
            window.off('scroll', handleScroll);
          }
        }
        
        // if the div hasn't got the class visible the attach event listener
        if (!ui.apps.hasClass('visible')) window.on('scroll', handleScroll);
      };

      // generates pseudo-random conversations for the map TODO: malditogeek comment
      this.map = function() {
        //  Make sure we don't randomly generate people in the ocean
        var coords = [
          [64, 113], [150, 142], [194, 222], [345, 221], [275, 70],
          [340, 95], [490, 141], [531, 206], [579, 268], [345, 104],
          [532, 21], [218, 48], [384, 226], [153, 226], [420, 157]
        ];

        var messages = [];

        var generate = function(chatMessage, pos) {

          var html = mapMessageTemplate({
            username: chatMessage.username,
            avatarUrl: chatMessage.avatarUrl,
            fullRoomName: chatMessage.room,
            roomName: chatMessage.room.split('/').pop(),
            left: pos[0],
            top: pos[1]
          });

          var msg = $(html);

          msg.appendTo(ui.map);

          var $span = msg.find('span');
          $span.css('left', (400 - $span.outerWidth()) / 2);

          msg.children('img').load(function() {
            msg.children().addClass('enter');
          });

          setTimeout(function() {
            coords.push(pos);
            messages.push(chatMessage);

            msg.children().removeClass('enter').animate({opacity: 0}, function() {
              msg.remove();
            });
          }, 5000);
        };

        /* fetches sample chats and sets an interval to loop through them */
        $.get('/api/private/sample-chats', function (data) {
          messages = data;
          setInterval(function () {
            var msg = messages.shift();
            var pos = coords.shift();
            if (msg && pos) generate(msg, pos);
          }, 2500);
        });
      };

      // generates pseudo-random conversations for the map TODO: malditogeek comment
      this.embedChats = function() {
        var navs = $('.communities-tabs a');

        function link(a, room) {
          var owner = room.uri.split('/').shift();

          $(a).html(
            '<img src="https://avatars.githubusercontent.com/' + owner + '?s=48" width="48" height="48">' +
            '<h3>' + room.name + '</h3>' +
            '<em>' + room.language + '</em>');

          $(a).click(function() {
            $('#embedded-chat').attr({src: '/' + room.uri + '/~embed'});
          });
        }

        var a0 = navs[0];
        var room0 = {name: 'GitterHQ', uri: 'gitterHQ/gitter', language: "Let's talk about Gitter!"};
        link(a0, room0);

        var a1 = navs[1];
        var room1 = roomByLocale(context.lang());
        link(a1, room1);

        var a2 = navs[2];
        var room2 = randomRoom();
        link(a2, room2);

        var a3 = navs[3];
        var room3 = randomRoom();
        link(a3, room3);
      };
      
      // initialise
      window.ready(this.init.bind(this));
    };
         
    
    new Gitter($(window));
});
