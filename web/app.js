// ===== CONSTANTS =====
var PROXY = 'https://cors.noh.am/?';
var AUTH_BASE = 'https://cdn-1.strava.com/api/v3/oauth';
var GRAPHQL_URL = 'https://graphql.strava.com/';
var CLIENT_SECRET = '0012dc03a59bfd0340b1c75763e6e880985816a3';
var COLORS = ['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00','#a65628','#f781bf'];
var TOKEN_KEY = 'strava_token';
var SUGGESTED_ROUTES_QUERY = 'query SuggestedRoutes($args: SuggestedRouteOptionsInput!, $first: Int, $after: Cursor, $resolutions: [FlatmapResolutionInput!]!, $minSizeDesired: Short!, $lookupOptions: LookupOptionsInput) { suggestedRoutesBySourceGeo(args: $args, first: $first, after: $after) { __typename routes { __typename nodes { __typename ... on SuggestedRoute { elevationGain completionTimeEstimation { __typename expectedTime } length locationSummary(lookupOptions: $lookupOptions) routeSource title routeType routeUrl routeDetails { __typename overallDifficulty } themedMapImages(resolutions: $resolutions) { __typename darkUrl lightUrl } routePolylineData { __typename media(limit: 3, preferUnique: true) { __typename mediaDetails { __typename ... on Photo { imageUrlWithMetadata(minSizeDesired: $minSizeDesired) { __typename imageUrl size { __typename height width } } imageUrl(minSizeDesired: $minSizeDesired) } } } } legs { __typename paths { __typename polyline { __typename data } } } } } pageInfo { __typename hasNextPage endCursor } } totalCount adjustedBoundingBox { __typename northeastCorner { __typename lat lng } southwestCorner { __typename lat lng } } pointSourceType { __typename searchPoint { __typename point { __typename lat lng } } droppedPin { __typename point { __typename lng lat } } currentLocation { __typename point { __typename lng lat } } } } }';

// ===== STATE =====
var mapForm, mapResults;
var pickerMarker, locationMarker;
var routesData = [];
var polylines = [];
var activeIndex = -1;
var otpState = null;

// ===== MAP HELPERS =====
function createTileLayers() {
  var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 19,
  });
  var topo = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>', maxZoom: 19,
  });
  var street = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>', subdomains: 'abcd', maxZoom: 20,
  });
  var dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>', subdomains: 'abcd', maxZoom: 20,
  });
  var satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>', maxZoom: 19,
  });
  var hybrid = L.layerGroup([
    satellite,
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>', subdomains: 'abcd', maxZoom: 20, opacity: 0.85,
    }),
  ]);
  return { osm: osm, topo: topo, street: street, dark: dark, satellite: satellite, hybrid: hybrid };
}

function initMap(containerId) {
  var m = L.map(containerId, { zoomControl: true }).setView([20, 0], 2);
  var layers = createTileLayers();
  layers.osm.addTo(m);
  L.control.layers(
    { 'OSM': layers.osm, 'Topo': layers.topo, 'Street': layers.street, 'Dark': layers.dark, 'Satellite': layers.satellite, 'Hybrid': layers.hybrid },
    null,
    { position: 'bottomleft' }
  ).addTo(m);
  return m;
}

// ===== INIT =====
function init() {
  var wasAuthed = getToken();
  updateAuthUI(wasAuthed);

  mapForm = initMap('map-form');

  mapForm.on('click', function(e) {
    var lat = e.latlng.lat.toFixed(6);
    var lng = e.latlng.lng.toFixed(6);
    document.getElementById('lat').value = lat;
    document.getElementById('lng').value = lng;
    placePickerMarker(parseFloat(lat), parseFloat(lng));
  });

  document.getElementById('lat').addEventListener('change', function() {
    var lat = parseFloat(this.value);
    var lng = parseFloat(document.getElementById('lng').value);
    if (!isNaN(lat) && !isNaN(lng)) placePickerMarker(lat, lng);
  });
  document.getElementById('lng').addEventListener('change', function() {
    var lat = parseFloat(document.getElementById('lat').value);
    var lng = parseFloat(this.value);
    if (!isNaN(lat) && !isNaN(lng)) placePickerMarker(lat, lng);
  });

  document.getElementById('custom-bbox').addEventListener('change', function() {
    document.getElementById('bbox-fields').classList.toggle('hidden', !this.checked);
  });
}

function placePickerMarker(lat, lng) {
  if (pickerMarker) mapForm.removeLayer(pickerMarker);
  pickerMarker = L.marker([lat, lng], { draggable: true }).addTo(mapForm);
  pickerMarker.on('dragend', function() {
    var pos = pickerMarker.getLatLng();
    document.getElementById('lat').value = pos.lat.toFixed(6);
    document.getElementById('lng').value = pos.lng.toFixed(6);
  });
  mapForm.setView([lat, lng], 13);
}

// ===== AUTH =====
function getToken() { return localStorage.getItem(TOKEN_KEY); }
function setToken(t) { localStorage.setItem(TOKEN_KEY, t); }
function clearToken() { localStorage.removeItem(TOKEN_KEY); }

function updateAuthUI(hasToken) {
  document.getElementById('auth-authenticated').style.display = hasToken ? '' : 'none';
  document.getElementById('auth-unauthenticated').style.display = hasToken ? 'none' : '';
  document.getElementById('auth-error').textContent = '';
}

function logout() {
  clearToken();
  updateAuthUI(false);
  otpState = null;
  document.getElementById('auth-email').value = '';
  document.getElementById('auth-otp').value = '';
  document.getElementById('auth-otp').classList.add('hidden');
  document.getElementById('auth-btn').textContent = 'Send OTP';
  showToast('Logged out');
}

async function handleAuth() {
  var email = document.getElementById('auth-email').value.trim();
  if (!email) { showAuthError('Enter your email'); return; }
  var btn = document.getElementById('auth-btn');
  var otpInput = document.getElementById('auth-otp');

  if (btn.textContent === 'Send OTP') {
    btn.disabled = true;
    btn.textContent = 'Sending...';
    try {
      otpState = await requestOtp(email);
      otpInput.classList.remove('hidden');
      btn.textContent = 'Verify';
      btn.disabled = false;
      showAuthError('');
    } catch (err) {
      showAuthError('Failed: ' + err.message);
      btn.textContent = 'Send OTP';
      btn.disabled = false;
    }
  } else {
    var otp = otpInput.value.trim();
    if (!otp) { showAuthError('Enter the OTP code'); return; }
    btn.disabled = true;
    btn.textContent = 'Verifying...';
    try {
      var token = await loginWithOtp(email, otpState, otp);
      setToken(token);
      updateAuthUI(true);
      otpInput.classList.add('hidden');
      otpInput.value = '';
      btn.textContent = 'Send OTP';
      btn.disabled = false;
      showAuthError('');
      showToast('Authenticated');
    } catch (err) {
      showAuthError('Failed: ' + err.message);
      btn.textContent = 'Verify';
      btn.disabled = false;
    }
  }
}

function showAuthError(msg) {
  document.getElementById('auth-error').textContent = msg;
}

async function requestOtp(email) {
  var resp = await fetch(PROXY + AUTH_BASE + '/request_otp?hl=en', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Strava 422.0.1 (49113)|iPhone|iPhone10,1|iOS|16.7.15|en-FR',
      'x-strava-nav-version': '2',
      'time-offset-seconds': String(-new Date().getTimezoneOffset() * 60),
    },
    body: JSON.stringify({ email: email, client_id: '1', logging_in: true }),
  });
  if (!resp.ok) throw new Error(resp.status + ': ' + (await resp.text()).slice(0, 100));
  return (await resp.json()).otp_state;
}

async function loginWithOtp(email, state, otp) {
  var resp = await fetch(PROXY + AUTH_BASE + '/login/otp?hl=en', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Strava 422.0.1 (49113)|iPhone|iPhone10,1|iOS|16.7.15|en-FR',
      'x-strava-nav-version': '2',
      'time-offset-seconds': String(-new Date().getTimezoneOffset() * 60),
    },
    body: JSON.stringify({ email: email, otp_state: state, client_id: '1', otp: otp, client_secret: CLIENT_SECRET }),
  });
  if (!resp.ok) throw new Error(resp.status + ': ' + (await resp.text()).slice(0, 100));
  return (await resp.json()).access_token;
}

// ===== POLYLINE DECODER =====
function decodePolyline(str) {
  var index = 0, lat = 0, lng = 0, coords = [];
  while (index < str.length) {
    var result = 0, shift = 0, b;
    do { b = str.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    var dlat = ((result & 1) ? ~(result >> 1) : (result >> 1)); lat += dlat;
    result = 0; shift = 0;
    do { b = str.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    var dlng = ((result & 1) ? ~(result >> 1) : (result >> 1)); lng += dlng;
    coords.push([lat * 1e-5, lng * 1e-5]);
  }
  return coords;
}

// ===== GRAPHQL =====
function buildVariables(lat, lng, routeType, difficulty, elevation, targetDistance, bboxArr) {
  var offset = 0.05;
  var bbox = bboxArr
    ? {
        northeastCorner: { lat: bboxArr[0], lng: bboxArr[1] },
        northwestCorner: { lat: bboxArr[0], lng: bboxArr[3] },
        southeastCorner: { lat: bboxArr[2], lng: bboxArr[1] },
        southwestCorner: { lat: bboxArr[2], lng: bboxArr[3] },
      }
    : {
        northeastCorner: { lat: lat + offset, lng: lng + offset },
        northwestCorner: { lat: lat + offset, lng: lng - offset },
        southeastCorner: { lat: lat - offset, lng: lng + offset },
        southwestCorner: { lat: lat - offset, lng: lng - offset },
      };
  return {
    args: {
      prefs: {
        difficulty: [difficulty],
        elevation: elevation,
        enforcePassThruSource: false,
        routeTypes: [routeType],
        surfaceType: 'Unknown',
        targetDistance: targetDistance > 0 ? targetDistance * 1000 : -1,
      },
      source: {
        boundingBoxWithPoint: {
          boundingBox: bbox,
          point: { currentLocation: { point: { lat: lat, lng: lng } } },
        },
      },
    },
    first: 15,
    resolutions: [{ height: 512, width: 512 }],
    minSizeDesired: 512,
    lookupOptions: { locale: 'en', source: 'Mysql' },
  };
}

async function fetchRoutes(token, variables) {
  var resp = await fetch(PROXY + GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
      'User-Agent': 'Strava 422.0.1 (49113)|iPhone|iPhone10,1|iOS|16.7.15|en-FR',
      'apollographql-client-name': 'strava-ios',
      'apollographql-client-version': '422.0.1-49113',
      'X-APOLLO-OPERATION-TYPE': 'query',
      'X-APOLLO-OPERATION-NAME': 'SuggestedRoutes',
    },
    body: JSON.stringify({ operationName: 'SuggestedRoutes', query: SUGGESTED_ROUTES_QUERY, variables: variables }),
  });
  var data = await resp.json();
  if (data.errors) throw new Error(data.errors.map(function(e) { return e.message; }).join('; '));
  return data.data.suggestedRoutesBySourceGeo;
}

// ===== ROUTE IMAGES =====
function getRouteImageUrl(route) {
  try {
    var media = route.routePolylineData && route.routePolylineData.media;
    if (media && media[0]) {
      var md = media[0].mediaDetails;
      if (md.imageUrlWithMetadata && md.imageUrlWithMetadata.imageUrl) return md.imageUrlWithMetadata.imageUrl;
      if (md.imageUrl) return md.imageUrl;
    }
  } catch (e) {}
  return null;
}

function getAllRouteImages(route) {
  var urls = [];
  try {
    var media = route.routePolylineData && route.routePolylineData.media;
    if (media) media.forEach(function(m) {
      var md = m.mediaDetails;
      if (md.imageUrlWithMetadata && md.imageUrlWithMetadata.imageUrl) urls.push(md.imageUrlWithMetadata.imageUrl);
      else if (md.imageUrl) urls.push(md.imageUrl);
    });
  } catch (e) {}
  return urls;
}

// ===== LIGHTBOX =====
function openLightbox(url) {
  var el = document.getElementById('lightbox');
  el.querySelector('img').src = url;
  el.classList.add('open');
}
function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
}

// ===== RESULTS =====
function showResults(result) {
  routesData = [];
  polylines = [];
  activeIndex = -1;
  panelOpen = false;

  // create results map
  document.getElementById('map-results').classList.remove('hidden');
  mapResults = initMap('map-results');
  if (pickerMarker) {
    mapResults.setView(pickerMarker.getLatLng(), 13);
  }

  var routes = result.routes.nodes;
  var totalCount = result.totalCount;
  var adjustedBB = result.adjustedBoundingBox;
  var curLoc = result.pointSourceType && result.pointSourceType.currentLocation;

  document.getElementById('results-header').textContent = totalCount + ' routes found';

  routesData = routes.map(function(route, i) {
    var coords = [];
    if (route.legs) route.legs.forEach(function(leg) {
      if (leg.paths) leg.paths.forEach(function(path) {
        if (path.polyline && path.polyline.data) coords.push(decodePolyline(path.polyline.data));
      });
    });
    var color = COLORS[i % COLORS.length];
    var eta = route.completionTimeEstimation ? Math.round(route.completionTimeEstimation.expectedTime / 60) + ' min' : '';
    var allLats = [], allLngs = [];
    coords.forEach(function(seg) { seg.forEach(function(p) { allLats.push(p[0]); allLngs.push(p[1]); }); });
    var bounds = allLats.length
      ? [Math.min.apply(null, allLats), Math.max.apply(null, allLats), Math.min.apply(null, allLngs), Math.max.apply(null, allLngs)]
      : [0,0,0,0];
    return {
      index: i, title: route.title || '', type: route.routeType || '',
      distanceKm: route.length ? (route.length / 1000).toFixed(1) : '0',
      elevationM: route.elevationGain ? Math.round(route.elevationGain) : 0,
      location: route.locationSummary || '', eta: eta, color: color, bounds: bounds, coords: coords,
      images: getAllRouteImages(route), image: getRouteImageUrl(route),
    };
  });

  var listEl = document.getElementById('route-list');
  listEl.innerHTML = '';
  routesData.forEach(function(d) {
    var li = document.createElement('li');
    li.className = 'route-item flex items-start gap-2.5 px-3 py-2.5 cursor-pointer border-l-[3px] border-l-transparent border-b border-[#e4dfd8] transition-all duration-100 hover:bg-[#ede9e3]';
    li.style.borderLeftColor = 'transparent';
    li.style.setProperty('--acolor', d.color);
    li.dataset.index = d.index;

    var imgHtml = d.image
      ? '<img class="route-img" src="' + escapeHtml(d.image) + '" alt="" loading="lazy" onclick="event.stopPropagation();openLightbox(\'' + escapeHtml(d.image) + '\')">'
      : '<div class="w-3.5 h-3.5 flex items-center justify-center mt-0.5 flex-shrink-0"><div class="route-color w-2 h-2 rounded-full transition-transform duration-150" style="background:' + d.color + '"></div></div>';

    var metaHtml = '<span class="meta-tag">' + escapeHtml(d.type) + '</span><span class="meta-tag">' + escapeHtml(d.distanceKm) + ' km</span><span class="meta-tag">' + escapeHtml(d.elevationM) + ' m</span>';
    var etaHtml = d.eta ? '<div class="flex-shrink-0 self-start mt-0.5 font-mono text-[9px] font-medium text-[#3e3a35] bg-[#ddd8d0] px-1.5 py-0.5 rounded-sm whitespace-nowrap">' + escapeHtml(d.eta) + '</div>' : '';

    li.innerHTML = imgHtml +
      '<div class="flex-1 min-w-0">' +
        '<div class="text-[11px] font-semibold text-stone leading-snug line-clamp-2">' + escapeHtml(d.title) + '</div>' +
        '<div class="flex flex-wrap gap-0.5 mt-1">' + metaHtml + '</div>' +
        '<div class="text-[9px] text-[#a89f97] mt-0.5 truncate">' + escapeHtml(d.location) + '</div>' +
      '</div>' + etaHtml;
    li.addEventListener('click', function() { selectRoute(parseInt(this.dataset.index)); closePanel(); });
    listEl.appendChild(li);
  });

  // polylines
  routesData.forEach(function(d) {
    var group = [];
    d.coords.forEach(function(seg) {
      var poly = L.polyline(seg, { color: d.color, weight: 4, opacity: 0.5, smoothFactor: 1.5 }).addTo(mapResults);
      poly.on('click', function() { selectRoute(d.index); });
      group.push(poly);
    });
    polylines.push(group);
  });

  // current location
  if (curLoc && curLoc.point) {
    locationMarker = L.marker([curLoc.point.lat, curLoc.point.lng], {
      icon: L.divIcon({
        className: '', html: '<div style="background:red;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 4px rgba(0,0,0,.4)"></div>',
        iconSize: [16, 16], iconAnchor: [8, 8],
      }), zIndexOffset: 1000,
    }).addTo(mapResults).bindPopup('Current location');
  }

  // bounding box
  if (adjustedBB) {
    L.rectangle(
      [[adjustedBB.southwestCorner.lat, adjustedBB.southwestCorner.lng], [adjustedBB.northeastCorner.lat, adjustedBB.northeastCorner.lng]],
      { color: '#666', weight: 1, fill: false, interactive: false }
    ).addTo(mapResults);
    mapResults.fitBounds(
      [[adjustedBB.southwestCorner.lat, adjustedBB.southwestCorner.lng], [adjustedBB.northeastCorner.lat, adjustedBB.northeastCorner.lng]],
      { padding: [40, 40], maxZoom: 14 }
    );
  } else if (curLoc && curLoc.point) {
    mapResults.setView([curLoc.point.lat, curLoc.point.lng], 13);
  }

  // switch view
  document.getElementById('form-mode').classList.add('hidden');
  var panel = document.getElementById('results-panel');
  panel.classList.remove('hidden');
  panel.classList.add('flex', 'flex-col');
  panel.classList.remove('translate-x-full');
  document.getElementById('panel-fab').classList.remove('hidden');
  document.getElementById('loading-bar').classList.add('hidden');
  document.getElementById('find-btn').disabled = false;
}

function clearResultsLayers() {
  if (locationMarker) { mapResults.removeLayer(locationMarker); locationMarker = null; }
  polylines.forEach(function(group) { group.forEach(function(p) { mapResults.removeLayer(p); }); });
  polylines = [];
  mapResults.eachLayer(function(layer) { if (layer instanceof L.Rectangle) mapResults.removeLayer(layer); });
}

function selectRoute(idx) {
  activeIndex = (activeIndex === idx) ? -1 : idx;
  updateVisibility();
  document.querySelectorAll('.route-item').forEach(function(el, i) {
    el.classList.toggle('active', i === activeIndex);
    el.style.borderLeftColor = i === activeIndex ? routesData[i].color : 'transparent';
  });
  if (activeIndex >= 0) {
    var b = routesData[activeIndex].bounds;
    if (b[0] !== 0 || b[1] !== 0 || b[2] !== 0 || b[3] !== 0)
      mapResults.fitBounds([[b[0], b[2]], [b[1], b[3]]], { padding: [40, 40], maxZoom: 15 });
    closePanel();
  } else {
    fitAllRoutes();
  }
}

function updateVisibility() {
  routesData.forEach(function(r, i) {
    polylines[i].forEach(function(poly) {
      if (activeIndex === -1) { poly.setStyle({ opacity: 0.5, weight: 4 }); poly.bringToBack(); }
      else if (i === activeIndex) { poly.setStyle({ opacity: 1, weight: 5 }); poly.bringToFront(); }
      else { poly.setStyle({ opacity: 0.12, weight: 2.5 }); poly.bringToBack(); }
    });
  });
}

function fitAllRoutes() {
  if (!routesData.length) return;
  var allLats = [], allLngs = [];
  routesData.forEach(function(r) { r.coords.forEach(function(seg) { seg.forEach(function(p) { allLats.push(p[0]); allLngs.push(p[1]); }); }); });
  if (allLats.length)
    mapResults.fitBounds([[Math.min.apply(null, allLats), Math.min.apply(null, allLngs)], [Math.max.apply(null, allLats), Math.max.apply(null, allLngs)]], { padding: [40, 40], maxZoom: 14 });
}

// ===== PANEL TOGGLE (mobile) =====
var panelOpen = false;

function togglePanel() {
  panelOpen = !panelOpen;
  var panel = document.getElementById('results-panel');
  var backdrop = document.getElementById('panel-backdrop');
  if (panelOpen) {
    panel.classList.remove('translate-x-full');
    backdrop.classList.remove('hidden');
  } else {
    panel.classList.add('translate-x-full');
    backdrop.classList.add('hidden');
  }
}

function closePanel() {
  panelOpen = false;
  document.getElementById('results-panel').classList.add('translate-x-full');
  document.getElementById('panel-backdrop').classList.add('hidden');
}

// ===== FORM =====
function showFormView() {
  closePanel();
  var panel = document.getElementById('results-panel');
  panel.classList.add('hidden');
  panel.classList.remove('flex', 'flex-col');
  document.getElementById('panel-fab').classList.add('hidden');
  document.getElementById('map-results').classList.add('hidden');
  document.getElementById('form-mode').classList.remove('hidden');
  if (mapResults) { mapResults.remove(); mapResults = null; }
  if (!mapForm) { mapForm = initMap('map-form'); }
  setTimeout(function() { if (mapForm) mapForm.invalidateSize(); }, 50);
}

async function findRoutes() {
  var token = getToken();
  if (!token) { showToast('Authenticate first', true); return; }

  var lat = document.getElementById('lat').value.trim();
  var lng = document.getElementById('lng').value.trim();
  var routeType = document.getElementById('route-type').value;
  var difficulty = document.getElementById('difficulty').value;
  var elevation = document.getElementById('elevation').value.trim();
  var distance = document.getElementById('distance').value.trim();

  if (!lat || !lng) { showToast('Enter a location', true); return; }
  if (!routeType) { showToast('Select a route type', true); return; }

  var bboxArr = null;
  if (document.getElementById('custom-bbox').checked) {
    var neLat = document.getElementById('bbox-ne-lat').value.trim();
    var neLng = document.getElementById('bbox-ne-lng').value.trim();
    var swLat = document.getElementById('bbox-sw-lat').value.trim();
    var swLng = document.getElementById('bbox-sw-lng').value.trim();
    if (neLat && neLng && swLat && swLng) bboxArr = [parseFloat(neLat), parseFloat(neLng), parseFloat(swLat), parseFloat(swLng)];
  }

  var btn = document.getElementById('find-btn');
  var loading = document.getElementById('loading-bar');
  btn.disabled = true;
  loading.classList.remove('hidden');

  try {
    var variables = buildVariables(parseFloat(lat), parseFloat(lng), routeType, difficulty, parseInt(elevation) || 0, parseFloat(distance) || -1, bboxArr);
    var result = await fetchRoutes(token, variables);
    showResults(result);
  } catch (err) {
    showToast('Error: ' + err.message, true);
    btn.disabled = false;
    loading.classList.add('hidden');
  }
}

function detectLocation() {
  var status = document.getElementById('loc-status');
  if (!navigator.geolocation) { status.textContent = 'Not supported'; return; }
  status.textContent = 'Detecting...';
  navigator.geolocation.getCurrentPosition(
    function(pos) {
      var lat = pos.coords.latitude.toFixed(6);
      var lng = pos.coords.longitude.toFixed(6);
      document.getElementById('lat').value = lat;
      document.getElementById('lng').value = lng;
      placePickerMarker(parseFloat(lat), parseFloat(lng));
      status.textContent = 'Location detected';
    },
    function(err) { status.textContent = 'Failed: ' + err.message; },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

// ===== UTILS =====
function escapeHtml(s) { var d = document.createElement('div'); d.appendChild(document.createTextNode(s)); return d.innerHTML; }

function showToast(msg, isError) {
  var el = document.getElementById('toast');
  el.textContent = msg;
  el.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1a1614;color:#fff;padding:8px 16px;border-radius:6px;font-size:12px;font-weight:500;z-index:99999;pointer-events:none;transition:opacity .2s;opacity:1' + (isError ? ';background:#e41a1c' : '');
  el.className = '';
  clearTimeout(el._timeout);
  el._timeout = setTimeout(function() { el.style.opacity = '0'; el.textContent = ''; }, 3000);
}

// ===== START =====
init();
