const { REFRESH_INTERVAL_MS, DEST_FONT_SIZE } = require("./config");

const scrollScript = `
(function() {
    
  var browser = window,
      doc = browser.document;

  // If there's a hash, or addEventListener is undefined, stop here
  if ( !location.hash || !browser.addEventListener ) {

    //set to 1
    window.scrollTo( 0, 1 );
    var scrollTop = 1,

    //reset to 0 if needed
    checkWindowBody = setInterval(function(){
      if( doc.body ){
        clearInterval( checkWindowBody );
        scrollTop = "scrollTop" in doc.body ? doc.body.scrollTop : 1;
        browser.scrollTo( 0, scrollTop === 1 ? 0 : 1 );
      } 
    }, 15 );

    if (browser.addEventListener) {
      browser.addEventListener("load", function(){
        setTimeout(function(){
          //reset to hide address
          browser.scrollTo( 0, scrollTop === 1 ? 0 : 1 );
        }, 0);
      }, false );
    }
  }
})();`;

const getIndex = (content) => `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="ie=edge">
      <title>SL Hökis</title>
      <style>
        body {
          font-family: 'Trebuchet MS', sans-serif;
          font-size: ${DEST_FONT_SIZE};
          background-color: #483B38; 
          color: white;
          height: 100vh;
        }

        #content {
          height: 100%;
          margin-bottom: 3rem; 
          text-wrap: nowrap; 
          display: flex; 
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        #error {
          color: orange; 
          font-size: 0.4em;
        }
      </style>
    </head>
    <body>
      <div id="content" >${content ?? ""}</div>
      <pre id="error" ></div>
    
      <script>
        let errorCount = 0;
        let errorSince = null;
        let knownServerVer;

        function loadContent() { 
          console.log('Loading contentä');
          const headers = !!knownServerVer ? { ['x-server-version']: knownServerVer } : {}
          
          const updatePromise = fetch('/content', { headers })
            .then(function (response) {
              const { redirected, headers } = response;
              console.log('Got response', { redirected, headers });

              // Handle redirect
              if (redirected) { window.location.reload(); }
              
              // Update known server version
              knownServerVer = headers.get('x-server-version');

              // Extract html as text
              return response.text();
            })
            .then(function (html) {
              errorCount = 0;
              errorSince = null;
              document.getElementById('content').innerHTML = html;
              document.getElementById('error').innerHTML = '';
            })
            .catch(function (err) {
              if (errorCount === 0) errorSince = new Date();
              errorCount++;
              document.getElementById('error').innerHTML = '<pre>(' + errorCount + ') ' + err.message + '<br/>' + errorSince.toTimeString() + '</pre>';
            })
        }

        ${!content && void loadContent()};
        window.addEventListener('focus', loadContent);
        
        ${scrollScript}
      </script>
    </body>
  </html>
  `;

module.exports = getIndex;
