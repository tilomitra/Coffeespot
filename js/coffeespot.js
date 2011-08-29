YUI.add('coffeespot', function(Y) {

	/* LOCATION MODEL */

	//create a location model class to store latitude longitude
	Y.LocationModel = Y.Base.create('locationModel', Y.Model, [Y.ModelSync.YQL], {

	  queryString: 'select * from geo.placefinder where text="{latitude}, {longitude}" AND gflags="R"',
	  buildQuery: function(options) {
	  	return Y.Lang.sub(options.query, { 
	  		latitude: options.latitude,
	  		longitude: options.longitude
	  	});
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
		self = this,
		cb = function(error, r) {
			if (r.Result) {
				self.set('address', r.Result.line1 + ', ' + r.Result.city);
				self.set('city', r.Result.city);
				self.set('woeid', r.Result.woeid);
				self.set('postal', r.Result.postal);
				self.set('zip', r.Result.uzip);
			}

			self.fire('physicalLocationChange', r.Result);
		},
		options = {
			query: this.queryString,
			latitude: lat,
			longitude: lng
		};
		this.load(options, cb);
		
	  },

	  //This script calculates great-circle distances between the two points 
	  //– that is, the shortest distance over the earth’s surface – using the ‘Haversine’ formula.
	  //http://stackoverflow.com/questions/27928/how-do-i-calculate-distance-between-two-latitude-longitude-points
	  findDistanceFromStore: function (lat,lng) {
	  	var lat2 = this.get('location').latitude,
	  	lng2 = this.get('location').longitude,
	  	R = 6371; // Radius of the earth in km
	  	dLat = (lat2-lat).toRad(),  // Javascript functions in radians
	  	dLon = (lng2-lng).toRad(),
	  	a = Math.sin(dLat/2) * Math.sin(dLat/2) +
	  	        Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) * 
	  	        Math.sin(dLon/2) * Math.sin(dLon/2),
	  	c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)),
	  	d = (R * c)*0.621371192; // Distance in miles

	  	return d;
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
		address: {
			value:undefined
		},
		city: {
			value: undefined
		},

		woeid: {
			value: undefined
		},

		zip: {
			value: undefined
		},
		postal: {
			value: undefined
		}

	  }
	});











	// // Create a new Y.PieModel class that extends Y.Model.
	Y.StoreModel = Y.Base.create('storeModel', Y.Model, [Y.ModelSync.YQL], {
		  ywsId: "7tXfk0MkQuPthFVrtTjL0w",
		  queryString: 'select * from yelp.review.search where term="{term}" and location="{location}" and id="{storeId}" and ywsid="{ywsId}"',
		  cache: new Y.CacheOffline,
		  model: Y.StoreModel,
		  buildQuery : function (options) {
			  options || (options = {});

			  return Y.Lang.sub(this.queryString, {
				  term : 'free wifi coffee',
				  location : options.postal || options.zip || options.city,
				  storeid : e.storeId,
				  ywsid : this.ywsid
			  });
		  }
	}, {
	  ATTRS: {
	  	id : {},
		address1 : {},
		avg_rating : {},
		city : {},
		distance : {},
		latitude : {},
		longitude : {},
		mobile_url: {},
		name: {},
		photo_url: {},
		rating_img_url: {},
		rating_img_url_small: {},
		url: {}
	  }
	});









	Y.StoreList = Y.Base.create('storeList', Y.ModelList, [Y.ModelSync.YQL], {
	  // Add prototype properties and methods for your List here if desired. These
	  // will be available to all instances of your List.

	  // Specifies that this list is meant to contain instances of Y.PieModel.
	  ywsId: "7tXfk0MkQuPthFVrtTjL0w",
	  queryString: 'select * from yelp.review.search where term="{term}" and location="{location}" and ywsid="{ywsId}"',
	  cache: new Y.CacheOffline,
	  model: Y.StoreModel,
	  buildQuery : function (options) {
		  options || (options = {});

		  return Y.Lang.sub(this.queryString, {
			  term : 'free wifi coffee',
			  location : options.postal || options.zip || options.city,
			  ywsId : this.ywsId
		  });
	  },

	  parse : function (results) {
		return results ? results.businesses : [];
	  }

	});






	/* LOCATION VIEW */

	Y.LocationView = Y.Base.create('locationView', Y.View, [], {

	  container: Y.one('#location'),

	  template: 'Searching near <span class="area">{value}</span>',

	  events: {},

	  initializer: function (config) {
		if (config) {
			var model = config.model;
			model.after('cityChange', this.render, this);
			model.after('destroy', this.destroy, this);
		}

		this.container = Y.one('#location');

	  },

	  render: function () {
		var location = this.model.get('location'),
		addr = this.model.get('address'),
		html = '';

		if (addr) {
			html = Y.Lang.sub(this.template, {
				value: addr
			});
		}
		else {
			html = Y.Lang.sub(this.template, {
				value: location.latitude + ', ' + location.longitude
			});
		}

		this.container.appendChild(html);

	  }
	});



















		/* MAP VIEW */

		// Create a new Y.PieView class that extends Y.View and renders the current
		// state of a Y.PieModel instance.
		Y.MapView = Y.Base.create('mapView', Y.View, [], {

		  container: Y.one('#map'),
		  template: '',

		  events: {},
		  map:undefined,

		  initializer: function (config) {
			this.container = Y.one('#map');
			if (config) {
				var model = config.model;
				model.after('locationChange', this.render, this);
				model.after('destroy', this.destroy, this);
			}
		  }, 

		  render: function () {
			// Render this view's HTML into the container element.
			var lat = this.model.get('location').latitude, lng = this.model.get('location').longitude,
			latlng = new google.maps.LatLng(lat, lng),
			myOptions = {
				zoom: 11,
				center: latlng,
				disableDefaultUI: true,
				mapTypeId: google.maps.MapTypeId.ROADMAP
			},
			marker = new google.maps.Marker({
					position: latlng,
					title:"My location"
			});
			this.map = new google.maps.Map(Y.one('#map').getDOMNode(),
			myOptions);

			this.addMarker(latlng);
 
		  },

		  addMarker: function (latitude, longitude, title) {
		  	var marker, latlng, icon;
		  	latlng = (latitude instanceof google.maps.LatLng) ? latitude : new google.maps.LatLng(latitude, longitude);

		  	icon = new google.maps.MarkerImage("./img/marker.png", null, null, null, new google.maps.Size(24,24));
		  	marker = new google.maps.Marker({
		  			icon: icon,
		  			position: latlng,
		  			title: title || null
		  	});

		  	marker.setMap(this.map);
		  }
		});














		/* LIST VIEW */

		Y.ListView = Y.Base.create('listView', Y.View, [], {

		  container: Y.one('#resultList ul'),

		  template: '<li id={id}><h2>{title}</h2><h3>{address}</h3><img src="{ratingImage}"></li>',

		  events: {},
		  scrollView: undefined,

		  initializer: function (config) {
			if (config && config.modelList) {
				// Store the modelList config value as a property on this view instance.
				this.modelList = config.modelList;
				// Re-render the view whenever a model is added to or removed from the
				// model list, or when the entire list is refreshed.
				this.modelList.after(['loaded'], this.render, this);
			}

			this.container = Y.one('#resultList ul');

			if (Y.UA.iOS < 5) {
				this.after('render', this.createScrollView);
			}

		  },

		  createScrollView: function () {
		  	if (!(this.scrollView instanceof Y.ScrollView)) {
		  		this.scrollView = new Y.ScrollView({
		  			srcNode: '#resultList',
		  			height: 260,
	  			    flick: {
	  			        minDistance:1,
	  			        minVelocity:0.4,
	  			        axis: "y"
	  			    },
	  			    deceleration: 0.983,
	  			    bounce:0.65,		
		  		});

		  		Y.ScrollView.FRAME_STEP = 15;
		  		Y.ScrollView.EASING = "cubic-bezier(0.000, 1.000, 0.320, 1.000)";	
		  		this.scrollView.render();
		  	}
		  	else {
		  		this.scrollView.syncUI();
		  	}

		  },

		  render: function () {
		  	var self = this,
		  	i = 0,
		  	ml = this.modelList,
		  	html = '';

		  	for (; i < ml.size(); i++) {
		  		html += Y.Lang.sub(this.template, {
		  			id: ml.item(i).get('id'),
		  			title: ml.item(i).get('name'),
		  			address: ml.item(i).get('address1') + ', ' + ml.item(i).get('city'),
		  			ratingImage: ml.item(i).get('rating_img_url_small')
		  		});

		  		this.fire('process', {
		  			latitude: ml.item(i).get('latitude'),
		  			longitude: ml.item(i).get('longitude'),
		  			title: ml.item(i).get('name')
		  		});

		  	}
		  	this.container.appendChild(html);
		  	this.fire('render');
		  }
		});











	Y.StoreDetailView = Y.Base.create('StoreDetailView', Y.View, [], {

		container: Y.one('#store-template'),
		model: undefined,
		popover: undefined,

		initializer: function (config) {
			this.model = config.model;
			//this.container = Y.one('#store-template');
		},

		render: function () {

			if (Y.Lang.isUndefined(this.popover)) {
				this.popover = new Y.Panel({
					headerContent: '<h2>' + this.model.get('name') + '</h2>',
					bodyContent: this.container.getContent(),
					width: 290,
					zIndex: 200, //google maps seems to be around 100 so 200 is a safe zIndex
					visible:true,
					align: {
						node: '#' + this.model.get('id'),
						points: ["bc", "tc"]
					},
					buttons: [],
					hideOn: [{
						eventName: 'clickoutside'
					}],
					plugins: [Y.Plugin.OverlayPointer]
				});
				this.popover.render();
			}

			else {
				this.popover.set('headerContent', '<h2>' + this.model.get('name') + '</h2>');
				this.popover.set('align', {
					node: '#' + this.model.get('id'),
					points: ["bc", "tc"]
				});
				this.popover.show();
			}

		}
	});


















	Y.CoffeeSpot = Y.Base.create('coffeeSpot', Y.Controller, [], {
		root: '/coffeespot',
	     routes : [
	     	 { path: '/', callback: 'handleIndex'},
	         { path: '/locate', callback: 'handleLocate'},
	         { path: '/locate/:id', callback: 'handleStore'}
	     ],

	     initializer : function () {
	     	this.hideUrlBar();
	     	this.store = new Y.StoreModel();
	     	this.storeList = new Y.StoreList();
	     	this.location = new Y.LocationModel();
	     	this.mapView = new Y.MapView({model: this.location});

	     	this.storeDetailView = null;
	     	this.locationView = null;
	     	this.listView = null;
	     	self = this;

	     	var init = function (e) {
	     		var that = self;
	     		self.locationView = new Y.LocationView({model: self.location});
	     		self.listView = new Y.ListView({modelList: self.storeList});

	     		self.listView.after('process', function(e) {
	     			self.addMarker(e.latitude, e.longitude, e.title);
	     		});

	     		self.listView.after('render', function(e) {
	     			Y.all('#resultList ul li').on('click', Y.bind(self.navigateToStore, self));
	     		});
	     	};

	     	var showStores = function (e) {
	     		self.showStores(e);
	     	}

	     	this.location.after('locationChange', init);
	     	this.location.after('physicalLocationChange', showStores);


	     	Y.one('#startLooking').on('click', Y.bind(this.navigateToLocate, this));



	         // do initial dispatch
	         if (window.navigator.standalone) {
	             // iOS saved to home screen,
	             // always route to / so geolocation lookup is preformed.
	             this.replace('/');
	         } else {
	             this.dispatch();
	         }
	     },

	     handleIndex : function (req) {
	     	console.log('controller at /');
	     	if (!Y.one('.wrapper').hasClass('landing')) {
	     		Y.one('.wrapper').addClass('landing');
	     	}
	     	
	     },

	     handleLocate : function (req) {

	     	var wrapper = Y.one('.wrapper'),
	     	location = this.location;
	     	
	     	wrapper.setContent(Y.one('#locate-template').getContent()).removeClass('landing');
	     	location.findLocation();

	     },

	     handleStore : function (req) {

	     	var store = this.storeList.getById(req.params.id),
	     	wrapper = Y.one('.wrapper');

	     	//wrapper.setContent(Y.one('#store-template').getContent());
	     	if (!this.storeDetailView) {
	     		this.storeDetailView = new Y.StoreDetailView({model: store});
	     	}
	     	else {
	     		this.storeDetailView.model = store;
	     	}
	     	this.storeDetailView.render();
	     },

	     showStores : function (e) {
	     	var storeList = this.storeList;
	     	o = {
	     		postal: e.postal,
	     		zip: e.zip,
	     		city: e.city
	     	};
	     	storeList.load(o, function() {

	     		storeList.fire('loaded');

	     		for (var i = 0; i < storeList._items.length; i++) {
	     			console.log(storeList.item(i).get('url'));
	     		}
	     	});
	     },

	     addMarker: function (lat, lng, title) {
	     	this.mapView.addMarker(lat,lng,title);
	     },

	     navigateToLocate: function (e) {
	     	e.preventDefault();
	     	this.save('/locate');
	     },

	     navigateToStore: function (e) {
	     	e.preventDefault();
	     	var id = e.currentTarget.get('id');
	     	this.save('/locate/' + id);
	     },

	     hideUrlBar : Y.UA.ios && ! Y.UA.ipad ? function(){
	         Y.later(1, Y.config.win, function(){
	             this.scrollTo(0, 1);
	         });
	     } : function(){}

	 });





}, '3.4.0', { requires: ['app', 'node-load', 'gallery-geo', 'gallery-model-sync-yql', 'gallery-overlay-extras', 'event-flick', 'cache-offline', 'scrollview', 'panel'] });


