import { DEST_FONT_SIZE, PAGE_INFO } from "./config";

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

const getIndex = (
  p: { name: "SL" | "VT"; stopName: string },
  content?: string,
) => `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="robots" content="noindex">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="ie=edge">
      <title>${p.name} ${p.stopName}</title>
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
          console.log('Loading content');
          const headers = !!knownServerVer ? { ['x-server-version']: knownServerVer } : {}
          const q = new URLSearchParams(window.location.search).toString();
          const updatePromise = fetch('/${p.name}/content?' + q, { headers })
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

        ${!content && "void loadContent().catch(console.error);"};
        window.addEventListener('focus', loadContent);

        ${scrollScript}
      </script>
    </body>
  </html>
  `;

export default getIndex;

export const getHelp = (origin: string) => {
  return `
<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="robots" content="noindex">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="ie=edge">
      <style>
      body {
        font-family: sans-serif;
        font-size: 1.2rem;
      }
      h1 {
        font-size: 1.5rem;
      }
      ul {
        list-style-type: none;
        padding: 0 0 0 2rem;
      }
      li {
        margin-bottom: 1rem;
      }
      pre { display: inline; }
      </style>
      </head>
      <body>
      <h1>USAGE</h1>
      <pre>${origin}/{provider}?stop_id=1234&mot=metro&dir=1&min_min=2&max_min=30</pre>
      <ul>
      <li><pre>provider</pre>: SL or VT</li>
      <li><pre>stop_id</pre>: SL site ID or VT stop area GID</li>
      <li><pre>dir</pre>: (optional) emphasize a direction (provider-specific)</li>
      <li><pre>mot</pre>: (optional) filter to a mode of transport (provider-specific)</li>
      <li><pre>min_min</pre>: (optional) filter to departures at least n minutes away (expected)</li>
      <li><pre>max_min</pre>: (optional) filter to departures at most n minutes away (expected)</li>
      <li><pre>limit</pre>: (optional) filter max n results</li>
      </ul>
      </body>
      </html>
      `;
};
