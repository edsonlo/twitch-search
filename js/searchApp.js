const twitchURI = "https://api.twitch.tv/kraken/search/streams";
const clientID = "5gf843clbfohl8wxwvw4h37653sdya6";
const ENTER_KEY = 13;

class SearchApp {

  constructor(searchBoxId, searchButtonId) {
    this.counter = 0;

    document.getElementById(searchBoxId).addEventListener("keyup", (event) => {
      let key = event.which || event.keyCode;
      let isInitSearch = true;
      if(key === ENTER_KEY) {
        this.doSearch(this.createQuery(), isInitSearch);
      }
    });
    document.getElementById(searchButtonId).addEventListener("click", () => {
      let isInitSearch = true;
      this.doSearch(this.createQuery(), isInitSearch);
    });

    this.processResults = this.processResults.bind(this);
  }

  doSearch(queryURI, isInitSearch) {
    if(queryURI) {
      this.runJSONPQuery(queryURI, isInitSearch)
      .then(this.processResults)
      .catch((error) => {
        console.log(error);
        let errorDiv = document.createElement("div");
        errorDiv.className = "streamTemplate";
        errorDiv.innerHTML = "Oops! Something went wrong, try again";
        this.clearResults();
        document.getElementById("searchResults").appendChild(errorDiv);
      });
    }
  }

  runJSONPQuery(queryURI, isInitSearch) {
    return new Promise((resolve, reject) => {
      let callbackName = `processResults${this.counter++}`;

      let jsonpScript = document.createElement("script");
      jsonpScript.id = "jsonpQuery";
      jsonpScript.src = `${queryURI}&callback=${callbackName}`;
      jsonpScript.onerror = reject;

      document.getElementsByTagName("head")[0].appendChild(jsonpScript);

      window[callbackName] = function(data) {
        if(data.streams && data.streams.length === 0 && !isInitSearch) {
          reject(new Error("No data returned"));
        }
        resolve(data);

        window[callbackName] = null;
        delete window[callbackName];
        document.getElementsByTagName("head")[0].removeChild(jsonpScript);
      }
    })
  }

  createQuery() {
    let queryString = document.getElementById("searchQuery").value;
    if(queryString === null || queryString === "") {
      return false;
    }
    let queryURI = `${twitchURI}?q=${encodeURIComponent(queryString)}&client_id=${clientID}`;

    return queryURI;
  }

  processResults(data) {
    this.clearResults();
    this.showStreamInfo(data.streams);
    this.updatePager(data._total, data._links);
  }

  updatePager(total, links) {
    let pages = Math.ceil(total/10);
    let offset = 0;
    let curLink = links.self;
    if(curLink.indexOf('offset') != -1) {
      offset = this.calcOffset(curLink);
    }
    let pageNum = (total === 0) ? 0 : Math.floor(offset/10) + 1;

    document.getElementById("totalResults").innerHTML = utils.escapeHTML(total);
    document.getElementById("pageTotal").innerHTML = `${pageNum}/${pages}`;
    document.getElementById("pageTotalBottom").innerHTML = `${pageNum}/${pages}`;

    this.updatePageButtonState(pageNum, pages, links.prev, links.next);
  }

  updatePageButtonState(pageNum, pages, prevLink, nextLink) {
    let prevButton = document.getElementById("prevButton");
    let prevButtonBottom = document.getElementById("prevButtonBottom");
    let nextButton = document.getElementById("nextButton");
    let nextButtonBottom = document.getElementById("nextButtonBottom");
    let app = this;

    document.getElementById("pagerBottom").style.display = "block";

    if(pageNum <= 1) {
      prevButton.disabled = true;
      prevButtonBottom.disabled = true;
    } else {
      prevButton.disabled = false;
      prevButtonBottom.disabled = false;
    }
    if(prevLink !== null && prevLink !== undefined) {
      prevButton.onclick = function() {
        app.doSearch(`${prevLink}&client_id=${clientID}`);
      }
      prevButtonBottom.onclick = function() {
        app.doSearch(`${prevLink}&client_id=${clientID}`);
      }
    }

    if(pageNum === pages) {
      nextButton.disabled = true;
      nextButtonBottom.disabled = true;
    } else {
      nextButton.disabled = false;
      nextButtonBottom.disabled = false;
    }
    if(nextLink !== null && nextLink !== undefined) {
      nextButton.onclick = function() {
        app.doSearch(`${nextLink}&client_id=${clientID}`);
      }
      nextButtonBottom.onclick = function() {
        app.doSearch(`${nextLink}&client_id=${clientID}`);
      }
    }

  }

  clearResults() {
    let searchResultsDiv = document.getElementById("searchResults");
    while (searchResultsDiv.firstChild) {
      searchResultsDiv.removeChild(searchResultsDiv.firstChild);
    }
  }

  showStreamInfo(streams) {
    if(streams == null || streams.length === 0) {
      let noResultsDiv = document.createElement("div");
      noResultsDiv.className = "streamTemplate";
      noResultsDiv.innerHTML = "No results, try again";
      this.clearResults();
      document.getElementById("searchResults").appendChild(noResultsDiv);
      return;
    }

    // create a wrapper div so all streams get added at once
    let wrapperDiv = document.createElement("div");
    wrapperDiv.id = "resultsWrapper";

    let streamDivs = streams.map(this.createStreamDiv);
    streamDivs.map(div => {
      wrapperDiv.appendChild(div);
    });

    document.getElementById("searchResults").appendChild(wrapperDiv);
    window.scrollTo(0,0);
  }

  createStreamDiv(stream) {
    const { channel: {display_name: streamName,
                      status: description,
                      url: linkUrl},
            game: gameName,
            viewers: totalViewers } = stream;


    let div = document.createElement("div");
    div.className = "streamTemplate";

    let imgLink = document.createElement("a");
    imgLink.href = linkUrl;
    imgLink.target = "_blank";
    imgLink.className = "streamImgLink";
    let img = document.createElement("img");
    img.src = stream.preview.medium;
    img.alt = `Stream ${streamName}`;
    img.className = "streamImage";
    imgLink.appendChild(img);
    div.appendChild(imgLink);

    let infoDiv = document.createElement("div");
    infoDiv.className = "streamInfo";
    let streamDiv = document.createElement("div");
    streamDiv.className = "streamHeader";
    let streamLink = document.createElement("a");
    streamLink.innerHTML = utils.escapeHTML(streamName);
    streamLink.href = linkUrl;
    streamLink.target = "_blank";
    streamDiv.appendChild(streamLink);
    infoDiv.appendChild(streamDiv);

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

    return div;
  }

  calcOffset(link) {
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
