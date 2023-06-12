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

const index = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>SL Hökis</title>
    
  </head>
  <body>
    <div id="content" ></div>
    <script>
      function loadContent() { 
        fetch('/content')
          .then(function (response) { 
            return response.text();
          })
          .catch(function (err) {
            return '<pre>' + err.toString() + '</pre>';
          })
          .then(function (html) {
            document.getElementById('content').innerHTML = html;
          })
      }
      setInterval(loadContent, 5000);
      loadContent();
      ${scrollScript}
    </script>
  </body>
</html>
`;

module.exports = index;
