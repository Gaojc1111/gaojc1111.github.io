var posts=["2025/02/18/Learn-It-When-I-Need/","2023/10/11/MySQL笔记/","2024/03/03/SyncMap源码解析/","2023/12/27/欲买桂花同载酒-终不似-少年游/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };