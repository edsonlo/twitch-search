const twitchURI = "https://api.twitch.tv/kraken/search/streams";
const clientID = "5gf843clbfohl8wxwvw4h37653sdya6";

searchApp = {
  runQuery: function(queryURI) {
    console.log(queryURI);
    let script = document.createElement("script");
    script.id = "jsonpQuery";
    script.src = queryURI;
    document.getElementsByTagName("head")[0].appendChild(script);
  },

  createQuery: function() {
    let queryString = document.getElementById("searchQuery").value;
    console.log(queryString);
    if(queryString === null || queryString === "") {
      alert('Please type a search string');
      return false;
    }
    let queryURI = `${twitchURI}?q=${encodeURIComponent(queryString)}&client_id=${clientID}&callback=searchApp.processResults`;
    console.log(queryURI);
    return queryURI;
  },

  processResults: function(data) {
    console.log(data);
    document.getElementsByTagName("head")[0].removeChild(document.getElementById("jsonpQuery"));
    searchApp.updatePager(data._total, data._links);
    searchApp.clearResults();
    data.streams.map(searchApp.showStreamInfo);
  },

  updatePager: function(total, links) {
    let pages = Math.ceil(total/10);
    let offset = 0;
    let curLink = links.self;
    if(curLink.indexOf('offset') != -1) {
      offset = searchApp.calcOffset(curLink);
    }
    let pageNum = Math.floor(offset/10) + 1;

    document.getElementById("totalResults").innerHTML = total;
    document.getElementById("pageTotal").innerHTML = `${pageNum}/${pages}`;

    searchApp.updateButtonState(pageNum, pages, links.prev, links.next);
  },

  updateButtonState: function(pageNum, pages, prevLink, nextLink) {
    let prevButton = document.getElementById("prevButton");
    let nextButton = document.getElementById("nextButton");

    pageNum === 1 ? prevButton.disabled = true : prevButton.disabled = false;
    if(prevLink !== null && prevLink !== undefined) {
      prevButton.onclick = function() {
        searchApp.runQuery(`${prevLink}&client_id=${clientID}&callback=searchApp.processResults`);
      }
    }
    pageNum === pages ? nextButton.disabled = true : nextButton.disabled = false;
    if(nextLink !== null && nextLink !== undefined) {
      nextButton.onclick = function() {
        searchApp.runQuery(`${nextLink}&client_id=${clientID}&callback=searchApp.processResults`);
      }
    }

  },

  clearResults: function() {
    var searchResultsDiv = document.getElementById("searchResults")
    while (searchResultsDiv.firstChild) {
        searchResultsDiv.removeChild(searchResultsDiv.firstChild);
    }
  },

  showStreamInfo: function(stream) {
    console.log(stream);
    const { channel: {display_name: streamName,
                      status: description,
                      url: linkUrl},
            game: gameName,
            viewers: totalViewers } = stream;


    let div = document.createElement("div");
    div.className = "streamTemplate";
    // image
    let img = document.createElement("img");
    img.src = stream.preview.medium;
    img.alt = streamName;
    img.className = "streamImage";
    div.appendChild(img);
    // stream info
    let infoDiv = document.createElement("div");
    infoDiv.className = "streamInfo";
    // header link
    let streamDiv = document.createElement("div");
    let streamLink = document.createElement("a");
    streamLink.innerHTML = utils.escapeHTML(streamName);
    streamLink.href = linkUrl;
    streamLink.target = "_blank";
    streamLink.className = "streamHeader";
    streamDiv.appendChild(streamLink);
    infoDiv.appendChild(streamDiv);
    // body info
    let gameInfoDiv = document.createElement("div");
    let gameNameInfo = `${gameName} - ${totalViewers} viewers`;
    gameInfoDiv.innerHTML = utils.escapeHTML(gameNameInfo);
    gameInfoDiv.className = "streamBody";
    infoDiv.appendChild(gameInfoDiv);

    let descDiv = document.createElement("div");
    descDiv.innerHTML = utils.escapeHTML(description);
    descDiv.className = "streamBody";
    infoDiv.appendChild(descDiv);
    div.appendChild(infoDiv);

    document.getElementById("searchResults").appendChild(div);

  },

  calcOffset: function(link) {
    let parts = link.split('?');
    let params = parts[1].split('&');
    for(let i = 0; i < params.length; i++) {
      if(params[i].startsWith("offset")) {
        let keyValue = params[i].split("=");
        return keyValue[1];
      }
    }
  }
}
