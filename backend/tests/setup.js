// Utilidades compartidas para las pruebas.
const request = require("supertest");
const app = require("../src/app");

async function login(email, password) {
  const res = await request(app)
    .post("/autenticacion/login")
    .send({ email, password });
  return res.body.token;
}

module.exports = { app, request, login };
