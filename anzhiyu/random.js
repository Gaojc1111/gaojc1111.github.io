var posts=["2025/04/17/Go的Sync-Pool是什么/","2025/02/18/Learn-It-When-I-Need/","2023/09/24/Linux命令总结/","2023/10/11/MySQL笔记/","2025/04/16/Redis-一个靠事件驱动的程序/","2024/03/03/SyncMap源码解析/","2023/12/27/欲买桂花同载酒-终不似-少年游/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };