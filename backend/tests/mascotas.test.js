const { app, request, login } = require("./setup");
const { pool } = require("../src/db");

let token;
beforeAll(async () => {
  token = await login("admin@huellitas.cl", "Admin123!");
});
afterAll(async () => {
  await pool.end();
});

describe("Mascotas", () => {
  test("listar mascotas (autenticado)", async () => {
    const res = await request(app)
      .get("/mascotas")
      .set("authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test("crear y leer una mascota", async () => {
    const crear = await request(app)
      .post("/mascotas")
      .set("authorization", `Bearer ${token}`)
      .send({ tutor_id: 6, nombre: "TestPet", especie: "Perro", raza: "Quiltro" });
    expect(crear.status).toBe(201);
    const id = crear.body.id;

    const leer = await request(app)
      .get(`/mascotas/${id}`)
      .set("authorization", `Bearer ${token}`);
    expect(leer.status).toBe(200);
    expect(leer.body.nombre).toBe("TestPet");
  });

  test("crear mascota sin nombre devuelve 400", async () => {
    const res = await request(app)
      .post("/mascotas")
      .set("authorization", `Bearer ${token}`)
      .send({ tutor_id: 6, especie: "Gato" });
    expect(res.status).toBe(400);
  });
});
