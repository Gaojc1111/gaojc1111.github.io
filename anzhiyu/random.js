var posts=["2025/02/18/Learn-It-When-I-Need/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };