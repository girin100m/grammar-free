import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {extname,normalize,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('../public/',import.meta.url)));
const port=Number(process.env.PORT)||4173;
const mimes={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8'};
createServer(async (req,res)=>{
  const path=decodeURIComponent(new URL(req.url,`http://localhost:${port}`).pathname);
  const file=resolve(root, `.${path==='/'?'/index.html':path}`);
  if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403).end('Forbidden');return;}
  try{const s=await stat(file);if(!s.isFile())throw Error('not a file');const body=await readFile(file);res.writeHead(200,{'Content-Type':mimes[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(body);}catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'}).end('Not found');}
}).listen(port,'0.0.0.0',()=>console.log(`Grammar site → http://localhost:${port}`));
