const http = require('http');
const Koa = require('koa');
const cors = require('@koa/cors');
const { koaBody }= require('koa-body');
const uuid = require('uuid');

const app = new Koa();

class Ticket {
  constructor(name, description, id) {
    this.id = id;
    this.name = name;
    this.status = false;
    this.created = this.getDate();
    this.description = description;
  }

  getDate() {
    const now = new Date();

    return now.toLocaleString();
  }
}

let tickets = [];

app.use(cors());

app.use(koaBody({
  urlencoded: true,
  multipart: true,
}));

app.use((ctx, next) => {
  ctx.body = 'server response';

  ctx.response.set('Access-Control-Allow-Origin', '*');
  ctx.response.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, PATCH, PUT');

  next();
})

app.use((ctx, next) => {
  if (ctx.request.method !== 'PATCH') {
    next();

    return;
  }

  if (ctx.get('Methods') === 'updateStatus') {
    const { status } = ctx.request.body;
    const id = ctx.get('id');

    tickets.forEach((element) => {
      if (element.id === id) {
        element.status = status;
      }
    });

    next();

    return;
  }

  const id = ctx.get('id');

  const { name, description } = ctx.request.body;

  tickets.forEach((element) => {
    if (element.id === id) {
      element.name = name;
      element.description = description;
    }
  });

  next();
});

app.use((ctx, next) => {
  if (ctx.request.method !== 'POST') {
    next();

    return;
  }

  const { name, full_desc } = ctx.request.body;

  const id = uuid.v4();

  ctx.response.set('Access-Control-Allow-Origin', '*');

  if (tickets.some(ticket => ticket.name === name)) {
    ctx.response.status = 400;
    ctx.response.body = 'ticket exists';

    return;
  }

  tickets.push(new Ticket(name,full_desc, id));

  ctx.response.body = 'OK';

  next();
})

app.use((ctx, next) => {
  if (ctx.request.method !== 'DELETE') {
    next();

    return;
  }

  let id = ctx.get('id');

  ctx.response.set('Access-Control-Allow-Origin', '*');
    
  tickets = tickets.filter((ticket) => ticket.id !== `${id}`);

  next();
});

app.use((ctx, next) => {
  let method = ctx.get('Methods');

  if (method === 'allTickets') {
    ctx.response.body = tickets;

    next();

    return;
  }

  if (method === 'getTicket') {
    let id = ctx.get('id');

    let ticket = tickets.filter((element) => element.id == `${id}`);

    ctx.response.body = ticket;

    next();

    return;
  }

  next()
});

const port = 7070;

const server = http.createServer(app.callback());

server.listen(port, (err) => {
  if (err) {
    console.log(err);

    return;
  }

  console.log('Server is listening to: ' + port);
})
