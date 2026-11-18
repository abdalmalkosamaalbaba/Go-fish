const http=require("http"),fs=require("fs"),path=require("path"),{WebSocketServer}=require("ws");
const PORT=process.env.PORT||3000,rooms=new Map();
const srv=http.createServer((q,r)=>{
  fs.readFile(path.join(__dirname,"index.html"),(e,b)=>{
    if(e){r.writeHead(500);return r.end("error")}
    r.writeHead(200,{"Content-Type":"text/html; charset=utf-8"});r.end(b);
  });
});
const wss=new WebSocketServer({server:srv,path:"/ws",maxPayload:65536});
wss.on("connection",(ws,req)=>{
  const room=(new URL(req.url,"http://x").searchParams.get("room")||"").toUpperCase();
  if(!/^[A-Z0-9]{4}$/.test(room))return ws.close();
  let s=rooms.get(room);if(!s){s=new Set();rooms.set(room,s)}
  if(s.size>=20)return ws.close();
  s.add(ws);
  ws.on("message",d=>{const t=d.toString();for(const c of s)if(c.readyState===1)c.send(t)});
  ws.on("close",()=>{s.delete(ws);if(!s.size)rooms.delete(room)});
  ws.on("error",()=>{});
});
setInterval(()=>wss.clients.forEach(c=>{if(c.readyState===1)c.ping()}),25000);
srv.listen(PORT,()=>console.log("listening on "+PORT));
