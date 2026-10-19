const { app, request, login } = require("./setup");
const { pool } = require("../src/db");

afterAll(async () => {
  await pool.end();
});

describe("Autenticación", () => {
  test("login con credenciales válidas devuelve token", async () => {
    const res = await request(app)
      .post("/autenticacion/login")
      .send({ email: "admin@huellitas.cl", password: "Admin123!" });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.usuario.rol).toBe("admin");
  });

  test("login con contraseña incorrecta devuelve 401", async () => {
    const res = await request(app)
      .post("/autenticacion/login")
      .send({ email: "admin@huellitas.cl", password: "incorrecta" });
    expect(res.status).toBe(401);
  });

  test("login sin campos devuelve 400", async () => {
    const res = await request(app).post("/autenticacion/login").send({});
    expect(res.status).toBe(400);
  });

  test("perfil requiere token", async () => {
    const res = await request(app).get("/autenticacion/perfil");
    expect(res.status).toBe(401);
  });

  test("perfil con token válido devuelve el usuario", async () => {
    const token = await login("admin@huellitas.cl", "Admin123!");
    const res = await request(app)
      .get("/autenticacion/perfil")
      .set("authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe("admin@huellitas.cl");
  });
});
