YUI.add('coffeespot', function(Y) {


	/* LOCATION MODEL */

	//create a location model class to store latitude longitude
	Y.LocationModel = Y.Base.create('locationModel', Y.Model, [], {
	  // Add prototype methods for your Model here if desired. These methods will be
	  // available to all instances of your Model.

	  // Returns true if all the slices of the pie have been eaten.
	  hasStoredLocation: function () {
	  	var location = this.get('location');
	  	if (!location.latitude && !location.longitude) {
	  		return false;
	  	}
	  	else {
	  		return true;
	  	}
	  },

	  //gets geolocation using HTML5
	  findLocation: function () {
	  	var self = this;
	  	Y.Geo.getCurrentPosition(function(response) {
	  	
  	       //check to see if it was successful
  	       if (response.success){
  	       		var o = {latitude: response.coords.latitude, longitude: response.coords.longitude};
  	       		self.set('location', o);

  	       		self.findPhysicalLocation();

  	       }
  	       else {
  	       	return response.message;
  	       }
  	   });
	  },

	  findPhysicalLocation: function() {
	  	var loc = this.get('location'),
	  	lat = loc.latitude + '',
	  	lng = loc.longitude + '',
	  	q = 'select * from geo.placefinder where text="' + lat + ', ' + lng + '" AND gflags="R"',
	  	self = this;

	  	Y.YQL(q, function(r) {

	  		if (r.query.results.Result) {
	  			self.set('city', r.query.results.Result.city);
	  			self.set('woeid', r.query.results.Result.woeid);
	  			self.set('zip', r.query.results.Result.uzip);
	  		}
	  	});
	  }
	}, {
	  ATTRS: {
	    // Add custom model attributes here. These attributes will contain your
	    // model's data. See the docs for Y.Attribute to learn more about defining
	    // attributes.

	    location: {
	      value: {
	      	latitude: undefined,
	      	longitude: undefined
		  }
	    },

	    city: {
	    	value: undefined
	    },

	    woeid: {
	    	value: undefined
	    },

	    zip: {
	    	value: undefined
	    }

	  }
	});









	// Create a new Y.PieModel class that extends Y.Model.
	// Y.YelpModel = Y.Base.create('yelpModel', Y.Model, [], {
	//   // Add prototype methods for your Model here if desired. These methods will be
	//   // available to all instances of your Model.

	//   // Returns true if all the slices of the pie have been eaten.
	//   hasStoredLocation: function () {
	//   	var location = this.get('location');
	//   	if (!location.latitude && location.longitude) {
	//   		return false;
	//   	}
	//   	else {
	//   		return true;
	//   	}
	//   },
	// }, {
	//   ATTRS: {
	//     // Add custom model attributes here. These attributes will contain your
	//     // model's data. See the docs for Y.Attribute to learn more about defining
	//     // attributes.

	//     location: {
	//       value: {
	//       	latitude: undefined,
	//       	longitude: undefined
	// 	  }
	//     }
	//   }
	// });















	/* LOCATION VIEW */

	// Create a new Y.PieView class that extends Y.View and renders the current
	// state of a Y.PieModel instance.
	Y.LocationView = Y.Base.create('locationView', Y.View, [], {
	  // Add prototype methods and properties for your View here if desired. These
	  // will be available to all instances of your View. You may also override
	  // existing default methods and properties of Y.View.

	  // Override the default container element.
	  container: Y.one('#location'),
	  mapView: undefined,

	  // Provide a template that will be used to render the view. The template can
	  // be anything we want, but in this case we'll use a string that will be
	  // processed with Y.Lang.sub().
	  template: '<div class="input"><input class="xlarge" id="xlInput" name="xlInput" size="30" type="text" value="{value}"></div>',

	  // Specify delegated DOM events to attach to the container.
	  events: {
	    //'.eat': {click: 'eatSlice'}
	  },

	  // The initializer function will run when a view is instantiated. This is a
	  // good time to subscribe to change events on a model instance.
	  initializer: function () {
	  	var model = this.model;

	  	//model.after('locationChange', this.render, this);
	  	model.after('cityChange', this.render, this);
	  	model.after('destroy', this.destroy, this);

	  	this.container = Y.one('#location');

	  	this.mapView = new Y.MapView({model: model});
	  }, 

	  render: function () {
	    // Render this view's HTML into the container element.
	    var self = this,
	    location = this.model.get('location'),
	    city = this.model.get('city'),
	    html = '';

	    if (city) {
	    	html = Y.Lang.sub(self.template, {
	    		value: city
	    	});
	    }
	    else {
	    	html = Y.Lang.sub(self.template, {
	    		value: location.latitude + ', ' + location.longitude
	    	});
	    }

	    self.container.appendChild(html);
	  }
	});



















		/* MAP VIEW */

		// Create a new Y.PieView class that extends Y.View and renders the current
		// state of a Y.PieModel instance.
		Y.MapView = Y.Base.create('mapView', Y.View, [], {
		  // Add prototype methods and properties for your View here if desired. These
		  // will be available to all instances of your View. You may also override
		  // existing default methods and properties of Y.View.

		  // Override the default container element.
		  container: Y.one('#map'),

		  // Provide a template that will be used to render the view. The template can
		  // be anything we want, but in this case we'll use a string that will be
		  // processed with Y.Lang.sub().
		  template: '',

		  // Specify delegated DOM events to attach to the container.
		  events: {
		    //'.eat': {click: 'eatSlice'}
		  },

		  // The initializer function will run when a view is instantiated. This is a
		  // good time to subscribe to change events on a model instance.
		  initializer: function () {
		  	this.container = Y.one('#map');
		  	var model = this.model;

		  	model.after('locationChange', this.render, this);
		  	model.after('destroy', this.destroy, this);
		  }, 

		  render: function () {
			// Render this view's HTML into the container element.
			var latlng = new google.maps.LatLng(this.model.get('location').latitude, this.model.get('location').longitude);
			var myOptions = {
				zoom: 15,
				center: latlng,
				disableDefaultUI: true,
				mapTypeId: google.maps.MapTypeId.HYBRID
			},
			marker = new google.maps.Marker({
			        position: latlng,
			        title:"My location"
			}),
			map = new google.maps.Map(Y.one('#map').getDOMNode(),
			myOptions);

			marker.setMap(map);  
		  }
		});









	/* APP VIEW */

	CoffeeSpotAppView = Y.CoffeeSpotAppView = Y.Base.create('CoffeeSpotAppView', Y.View, [], {
	    // The container node is the wrapper for this view.  All the view's events
	    // will be delegated from the container. In this case, the #todo-app
	    // node already exists on the page, so we don't need to create it.
	    container: Y.one('body'),

	    // The `template` property is a convenience property for holding a template
	    // for this view. In this case, we'll use it to store the contents of the
	    // #todo-stats-template element, which will serve as the template for the
	    // statistics displayed at the bottom of the list.
	    //template: Y.one('#todo-stats-template').getContent(),

	    // This is where we attach DOM events for the view. The `events` object is a
	    // mapping of selectors to an object containing one or more events to attach
	    // to the node(s) matching each selector.
	    events: {
	        // Handle <enter> keypresses on the "new todo" input field.
	        '#startLooking': {click: 'loadLanding'},

	        // Clear all completed items from the list when the "Clear" link is
	        // clicked.
	        //'.todo-clear': {click: 'clearDone'},

	        // Add and remove hover states on todo items.
	        // '.todo-item': {
	        //     mouseover: 'hoverOn',
	        //     mouseout : 'hoverOff'
	        // }
	    },

	    // The initializer runs when a CoffeeSpotAppView instance is created, and gives
	    // us an opportunity to set up the view.
	    initializer: function () {
	        // Create a new TodoList instance to hold the todo items.
	        //var list = this.todoList = new TodoList();

	        // Update the display when a new item is added to the list, or when the
	        // entire list is reset.
	        //list.after('add', this.add, this);
	        //list.after('reset', this.reset, this);

	        // Re-render the stats in the footer whenever an item is added, removed
	        // or changed, or when the entire list is reset.
	        //list.after(['add', 'reset', 'remove', 'todoModel:doneChange'],
	               // this.render, this);

	        // Load saved items from localStorage, if available.
	        //list.load();
	    },

	    // The render function is called whenever a todo item is added, removed, or
	    // changed, thanks to the list event handler we attached in the initializer
	    // above.
	    render: function () {

	        // return this;
	    },

	    // -- Event Handlers -------------------------------------------------------

	    // Creates a new TodoView instance and renders it into the list whenever a
	    // todo item is added to the list.
	    loadLanding: function (e) {
	    	var btn = Y.one('#startLooking'),
	    	wrapper = Y.one('.wrapper'),
	    	url = btn.get('href'),

	
	    	successHandler = function() {
	            Y.log('changed');
	            var location  = new Y.LocationModel();
	            var locationView = new Y.LocationView({model: location});
	            location.findLocation();
	            //locationView.render();
	        };

	        e.preventDefault();
	        
	        wrapper.load(url, '.wrapper', successHandler).removeClass('landing');
	    }
	});

}, '3.4.0', { requires: ['app', 'node-load', 'gallery-geo', 'event-flick', 'cache-offline'] });